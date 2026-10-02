[English](README.md) | [简体中文](README.zh-CN.md)

# Photo Flipbook

Turn photos and posters into a local, interactive HTML photo book with a wooden desk setting, cloth covers, layered page edges, shadows, and realistic page turns.

## Demo

https://github.com/user-attachments/assets/827a3277-13a8-44a3-be71-2fc60e4bf3d5

## Features

- Responsive single-page and two-page reading; click, drag, swipe, or use arrow keys.
- Complete images retain their proportions.
- Add handwritten notes; move, resize, recolor, rotate, delete, and save them.
- Included handwriting font; no system font installation or online font service.
- Local note files with a previous-revision backup and conflict protection.
- Bundled page-turn audio, enabled by default; replace it with your own recording.

## Requirements and installation

Python **3.10+** and a modern browser are required. Book generation and saving use Python's standard library; no Node.js or npm installation is required. Optional contact sheets require Pillow (`python3 -m pip install Pillow`). Node.js 18+ is only needed for the JavaScript checks.

Clone or download this repository. To use it as an agent skill, place this entire folder in your agent's skill directory under `photo-flipbook` (for Codex, `~/.codex/skills/photo-flipbook`). Preserve `assets`, `references`, and `scripts` alongside `SKILL.md`. You can also use the generator directly without an agent.

Ask your agent:

> Use $photo-flipbook to make a photo book from this folder. Keep the photos complete and enable handwritten notes.

## Basic usage

Prepare JPEG, PNG, WebP, GIF, or AVIF images in reading order. Convert HEIC/RAW files first. Optionally provide your own background and an audio file you have permission to use. Original images are copied, not edited; review photo metadata before publishing a generated book.

From this repository:

```sh
python3 scripts/create-book.py --output output/my-book --title "My Photo Book" --photos photo1.jpg photo2.png
python3 output/my-book/notes-server.py
```

On Windows, use `py -3` instead of `python3`. The output directory must not already exist. Add `--background desk.jpg`, `--sound page-turn.mp3`, or `--subtitle "Travel Notes"` as needed. The server opens the browser and must remain running while editing.

Generated books also include `open-flipbook.command` (macOS), `open-flipbook.bat` (Windows), and `open-flipbook.sh` (Linux). If your system blocks a downloaded launcher, use the Python command above. Double-clicking `index.html` supports reading, but saving notes requires the server.

Click the pencil, then click a page to write. Select a text box to adjust its size, color or tilt. Drag its handles to move or change its width, then save. The current editor labels are Chinese. Book titles and captions can use your preferred language.

Notes live in the generated book's `notes.json`; the previous save is `notes.backup.json`. Keep these with your book and review them before sharing. No cloud account is needed. The optional semantic photo-search adapter requires a separately configured engine; normal creation does not.

## Repository layout

```text
SKILL.md                 Agent instructions
agents/                  Agent UI metadata
scripts/                 Generator and optional photo helpers
references/              Design, runtime and persistence guidance
assets/html/             Self-contained book template, font and engine
assets/media-origin.md   Asset provenance and license locations
```

## Checks

```sh
python3 assets/html/test-notes-server.py
node --test assets/html/html-contract.test.mjs
```

## Acknowledgments

Photo Flipbook builds on the template and workflow of [create-photo-flipbook-ui](https://github.com/HaichaoLihc/create-photo-flipbook-ui), adding desk presentation, book materials, page-turn audio, and editable handwritten notes.

Upstream by **Haichao Li**, licensed under MIT. Its [original copyright and license notice](assets/html/vendor/create-photo-flipbook-ui-license.txt) is retained with the template.

## Licensing

Original code and content that the project authors have the right to license are available under the [MIT License](LICENSE). Third-party assets with separate licenses or authorization notices remain governed by those terms; MIT does not override or expand them. Bundled fonts retain their OFL licenses and PageFlip retains its MIT notice. See [media provenance](assets/media-origin.md). The runtime template contains no personal travel photos or saved notes. The demonstration video and GIF show the maintainer’s travel album. Audio licensing details are listed in the media provenance document.
