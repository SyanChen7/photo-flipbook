---
name: photo-flipbook
description: Create and edit interactive HTML photo books with realistic page turns and editable handwritten notes. Downloads the complete, checksum-verified runtime from the project's GitHub release on first use.
metadata:
  version: "1.0.0"
---

# Photo Flipbook

Create local interactive photo books with complete, uncropped photos, realistic page turns, a wooden desk setting, cloth covers, page-turn audio, and editable handwritten notes. Match titles and content to the user's language. Generated books work independently of this skill's install directory.

## Prepare the complete runtime

This is the SkillHub distribution. SkillHub does not include the project's binary fonts and media. The installer retrieves the complete public **v1.0.0** archive from **SyanChen7/photo-flipbook** on GitHub and checks its pinned SHA-256 before extraction. It does not install system packages or run the downloaded code.

Python 3.10+ and network access to GitHub are required for this first step. Choose a new, writable directory in the user's workspace, separate from the finished book:

```sh
python3 "<installed-skill>/scripts/install-runtime.py" --output "<workspace>/photo-flipbook-runtime"
```

The output directory must not already exist. Reuse a runtime prepared earlier in the same task; do not reinstall or overwrite it. If download or verification fails, report the error and stop generation until the complete runtime is available. Do not generate a book with missing fonts or media.

Read **`<runtime>/SKILL.md`** next and follow its workflow. Its `SKILL_DIR` and all relative resource links refer to the runtime directory, not this launcher distribution. It contains the design rules, handwritten-note workflow, photo-library guidance, generation scripts, self-contained HTML template, fonts, media, and third-party license notices.

## Generate and edit

Use the runtime's generator with the user's photos in reading order:

```sh
python3 "<runtime>/scripts/create-book.py" --output "<workspace>/my-photo-book" --title "My Photo Book" --photos "photo1.jpg" "photo2.png"
python3 "<workspace>/my-photo-book/notes-server.py"
```

Preserve original images and aspect ratios. The output directory must be new; edit an existing book in place rather than regenerating over its notes. Optional `--background`, `--sound`, and page-size arguments customize the book. Keep font, engine, template, and media attribution notices with the generated assets.

Saving handwritten notes requires the local Python server to stay running. Opening `index.html` directly supports reading only. Verify page turns, narrow layouts, local assets, note editing, and persistence using the runtime's validation guidance before delivery. Provide the output directory and working preview; do not describe a temporary local URL as permanent hosting.

## Distribution and licenses

The complete source and offline installation ZIP are at https://github.com/SyanChen7/photo-flipbook/releases/tag/v1.0.0. The ZIP's SHA-256 is pinned in the installer. This launcher's MIT license does not replace the runtime's separate font, engine, template, or media terms. Consult `assets/media-origin.md` inside the runtime before redistribution.
