import importlib.util
import json
from pathlib import Path
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError

spec=importlib.util.spec_from_file_location('notes_server',Path(__file__).with_name('notes-server.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class NotesTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        (Path(self.temp.name)/'index.html').write_text('<article class="book-page"></article>' * 24, encoding='utf-8')
        self.server=ThreadingHTTPServer(('127.0.0.1',0),module.handler_for(self.temp.name))
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True)
        self.thread.start()
        self.url=f'http://127.0.0.1:{self.server.server_port}/api/notes'
    def tearDown(self):
        self.server.shutdown();self.server.server_close();self.thread.join();self.temp.cleanup()
    def post(self,data,origin=None):
        headers={'Content-Type':'application/json'}
        if origin:headers['Origin']=origin
        req=Request(self.url,data=json.dumps(data).encode(),headers=headers,method='POST')
        try:
            with urlopen(req) as r:return r.status,json.load(r)
        except HTTPError as e:
            with e:return e.code,json.load(e)
    def note(self):
        return {'id':'test','page':5,'x':.1,'y':.2,'width':.6,'font':4,'text':'秋天\n河湾'}
    def test_persistence_conflict_and_backup(self):
        data={'revision':0,'notes':[self.note()]}
        status,saved=self.post(data);self.assertEqual(status,200)
        self.assertEqual(saved['revision'],1)
        self.assertEqual(json.loads((Path(self.temp.name)/'notes.json').read_text(encoding='utf-8'))['notes'],data['notes'])
        self.assertEqual(self.post(data)[0],409)
        saved['notes'][0]['text']='更新'
        self.assertEqual(self.post(saved)[0],200)
        self.assertEqual(json.loads((Path(self.temp.name)/'notes.backup.json').read_text(encoding='utf-8'))['notes'][0]['text'],'秋天\n河湾')
        # A new handler reads the same file, with no process-memory dependency.
        other=ThreadingHTTPServer(('127.0.0.1',0),module.handler_for(self.temp.name))
        t=threading.Thread(target=other.serve_forever,daemon=True);t.start()
        try:
            with urlopen(f'http://127.0.0.1:{other.server_port}/api/notes') as r:self.assertEqual(json.load(r)['revision'],2)
        finally:other.shutdown();other.server_close();t.join()
    def test_color_rotation_round_trip_and_legacy(self):
        note=self.note();note.update(color='#93784f',rotation=-17)
        status,saved=self.post({'revision':0,'notes':[note]})
        self.assertEqual(status,200)
        with urlopen(self.url) as r:
            restored=json.load(r)['notes'][0]
        self.assertEqual((restored['color'],restored['rotation']),('#93784f',-17))
        for key,value in [('color','red'),('rotation',46),('rotation',float('nan'))]:
            invalid=dict(note);invalid[key]=value
            self.assertEqual(self.post({'revision':1,'notes':[invalid]})[0],400)
        self.assertEqual(self.post({'revision':1,'notes':[self.note()]})[0],200)
    def test_reject_invalid_and_foreign_origin(self):
        note=self.note();note['x']=.9
        self.assertEqual(self.post({'revision':0,'notes':[note]})[0],400)
        self.assertEqual(self.post({'revision':0,'notes':[]},'https://example.com')[0],403)
        self.assertFalse((Path(self.temp.name)/'notes.json').exists())
    def test_variable_page_count(self):
        note=self.note();note['page']=23
        self.assertEqual(self.post({'revision':0,'notes':[note]})[0],200)
        note['page']=24
        self.assertEqual(self.post({'revision':1,'notes':[note]})[0],400)

    def test_corrupt_file_not_overwritten(self):
        file=Path(self.temp.name)/'notes.json';file.write_text('broken', encoding='utf-8')
        self.assertEqual(self.post({'revision':0,'notes':[]})[0],400)
        self.assertEqual(file.read_text(encoding='utf-8'),'broken')

if __name__=='__main__':unittest.main()
