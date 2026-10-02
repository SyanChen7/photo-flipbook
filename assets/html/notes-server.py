"""Local-only book preview and atomic, revision-checked annotation storage."""
from html.parser import HTMLParser
import argparse
import json
import os
import re
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import threading
from urllib.parse import urlsplit, unquote
import webbrowser


def count_pages(root):
    class Pages(HTMLParser):
        count = 0
        def handle_starttag(self, tag, attrs):
            if 'book-page' in dict(attrs).get('class', '').split():
                self.count += 1
    parser = Pages()
    parser.feed((Path(root) / 'index.html').read_text('utf-8'))
    if not parser.count:
        raise ValueError('相册中没有书页')
    return parser.count


def validate(data, page_count):
    if not isinstance(data, dict) or type(data.get('revision')) is not int or not isinstance(data.get('notes'), list) or len(data['notes']) > 300:
        raise ValueError('笔记格式无效')
    ids = set()
    for n in data['notes']:
        if not isinstance(n, dict) or not isinstance(n.get('id'), str) or not 1 <= len(n['id']) <= 80 or n['id'] in ids:
            raise ValueError('笔记编号无效')
        ids.add(n['id'])
        if type(n.get('page')) is not int or not 0 <= n['page'] < page_count or not isinstance(n.get('text'), str) or len(n['text']) > 2000:
            raise ValueError('页码或文字无效')
        for key, low, high in [('x',0,1),('y',0,1),('width',.15,1),('font',2,8)]:
            if type(n.get(key)) not in (int,float) or not low <= n[key] <= high:
                raise ValueError('位置或字号无效')
        if not isinstance(n.get('color','#3e493d'),str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',n.get('color','#3e493d')):
            raise ValueError('颜色无效')
        if type(n.get('rotation',0)) not in (int,float) or not -45 <= n.get('rotation',0) <= 45:
            raise ValueError('旋转角度无效')
        if n['x'] + n['width'] > 1.001:
            raise ValueError('文字框超出页面')
    return data


def handler_for(root):
    root = Path(root)
    page_count = count_pages(root)
    target = root / 'notes.json'
    lock = threading.Lock()
    def read():
        return validate(json.loads(target.read_text('utf-8')), page_count) if target.exists() else {'revision':0,'notes':[]}
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)
        def reply(self, status, data):
            body=json.dumps(data, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type','application/json; charset=utf-8')
            self.send_header('Cache-Control','no-store')
            self.send_header('Content-Length',str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        def allowed(self):
            host=self.headers.get('Host','')
            expected=f'127.0.0.1:{self.server.server_port}'
            return host == expected and self.headers.get('Origin', f'http://{expected}') == f'http://{expected}'
        def do_GET(self):
            if not self.allowed():
                return self.reply(403,{'error':'仅允许本机页面访问'})
            path=unquote(urlsplit(self.path).path)
            if any(s.startswith('.') for s in path.split('/') if s):
                return self.send_error(404)
            if path == '/api/notes':
                try:
                    with lock: data=read()
                    return self.reply(200,data)
                except (ValueError,OSError):
                    return self.reply(500,{'error':'笔记文件无法读取，请保留原文件并检查'})
            return super().do_GET()
        def do_POST(self):
            if not self.allowed() or self.headers.get('Content-Type') != 'application/json':
                return self.reply(403,{'error':'请求来源无效'})
            if urlsplit(self.path).path != '/api/notes':
                return self.reply(404,{'error':'未知地址'})
            try:
                length=int(self.headers.get('Content-Length','0'))
                if not 0 < length <= 2000000: raise ValueError('笔记过大')
                data=validate(json.loads(self.rfile.read(length)), page_count)
                with lock:
                    previous=read()
                    if data['revision'] != previous['revision']:
                        return self.reply(409,{'error':'另一窗口已保存新笔记。请先复制当前文字，再刷新页面。'})
                    data['revision'] += 1
                    if target.exists():
                        (root/'notes.backup.json').write_bytes(target.read_bytes())
                    temp=root/'notes.pending.json'
                    with temp.open('w',encoding='utf-8') as f:
                        json.dump(data,f,ensure_ascii=False,indent=2)
                        f.flush()
                        os.fsync(f.fileno())
                    os.replace(temp,target)
                return self.reply(200,data)
            except (ValueError,KeyError,TypeError):
                return self.reply(400,{'error':'笔记内容或格式无效'})
            except OSError:
                return self.reply(500,{'error':'写入失败，文字仍留在编辑框中，请重试'})
    return Handler


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=0)
    parser.add_argument('--no-open',action='store_true')
    args=parser.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),handler_for(Path(__file__).resolve().parent))
    url=f'http://127.0.0.1:{server.server_port}/index.html'
    print(f'照片翻页书：{url}\n保持此窗口打开；阅读结束后按 Control+C。',flush=True)
    if not args.no_open: threading.Timer(.4,lambda:webbrowser.open(url)).start()
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
