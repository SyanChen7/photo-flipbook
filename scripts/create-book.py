#!/usr/bin/env python3
"""Create a self-contained photo book from the bundled, verified runtime."""
import argparse
import html
import json
import shutil
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--title', required=True)
    parser.add_argument('--subtitle', default='Photo Journal')
    parser.add_argument('--photos', nargs='+', required=True, type=Path)
    parser.add_argument('--background', type=Path)
    parser.add_argument('--sound', type=Path)
    parser.add_argument('--page-width', type=int, default=384)
    parser.add_argument('--page-height', type=int, default=640)
    args = parser.parse_args()
    output = args.output.resolve()
    if output.exists():
        parser.error('Output already exists; edit the existing book rather than overwriting it.')
    if not (1 <= args.page_width <= 640 and 1 <= args.page_height <= 640):
        parser.error('Page dimensions must be within 1–640.')
    inputs = args.photos + [p for p in [args.background, args.sound] if p]
    for file in inputs:
        if not file.is_file():
            parser.error(f'Missing input: {file}')
    for file in args.photos:
        if file.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'}:
            parser.error(f'Convert unsupported image format before use: {file}')
    template = Path(__file__).resolve().parents[1] / 'assets' / 'html'
    shutil.copytree(template, output, ignore=shutil.ignore_patterns("__pycache__", "*.pyc", ".DS_Store", "notes.json", "notes.backup.json", "notes.pending.json"))
    (output / 'assets/photos').mkdir(parents=True, exist_ok=True)
    pages, manifest = [], []
    for i, file in enumerate(args.photos, 1):
        rel = f'assets/photos/{i:02d}{file.suffix.lower()}'
        shutil.copy2(file, output / rel)
        label = html.escape(file.stem, quote=True)
        side = 'verso' if i % 2 else 'recto'
        pages.append(f'<article class="book-page art-page paper {side} artwork" aria-label="{label}"><figure class="poster"><img src="{rel}" alt="{label}" decoding="async" draggable="false"></figure><span class="folio">{i:02d}</span></article>')
        manifest.append({'leaf': i+2, 'title': file.stem, 'source': file.name, 'asset': rel})
    if len(args.photos) % 2:
        pages.append('<article class="book-page art-page paper recto" aria-label="留白页"></article>')
    index = (output / 'index.html').read_text(encoding='utf-8')
    index = index.replace('Book title', html.escape(args.title, quote=True)).replace('Photographs', html.escape(args.subtitle, quote=True))
    index = index.replace('<!-- PHOTO_PAGES -->', '\n'.join(pages))
    index = index.replace('data-page-width="384"', f'data-page-width="{args.page_width}"').replace('data-page-height="640"', f'data-page-height="{args.page_height}"')
    (output / 'index.html').write_text(index, encoding='utf-8')
    config = {'background':'assets/backgrounds/desk.png','clothColor':'#294844', 'sound':{'enabled':True,'src':'assets/audio/page-turn.mp3','volume':0.4}}
    for file, folder, key in [(args.background,'backgrounds','background'),(args.sound,'audio','sound')]:
        if file:
            rel = f'assets/{folder}/custom{file.suffix.lower()}'
            shutil.copy2(file, output / rel)
            if key == 'sound': config['sound'].update(src=rel, enabled=True)
            else: config[key] = rel
    # Escape script delimiters even though this is a standalone JS resource.
    encoded = json.dumps(config, ensure_ascii=False, indent=2).replace('<', '\\u003c')
    (output / 'book-config.js').write_text('window.PHOTO_FLIPBOOK_CONFIG = ' + encoded + ';\n', encoding='utf-8')
    (output / 'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n', encoding='utf-8')
    print(output / 'index.html')


if __name__ == '__main__':
    main()
