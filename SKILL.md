---
name: photo-flipbook
description: Create and edit interactive HTML photo books with realistic page turns and editable handwritten notes.
---

# Photo Flipbook

Build a self-contained photo book in the user's chosen output directory using the bundled template. `SKILL_DIR` is the directory containing this file. Match the book's language to the user's request.

## Photos and design

Establish the subject, image proportions, and reading order. Use the [contact sheet script](scripts/make-contact-sheet.py) when an overview helps. Read [photo library guidance](references/photo-library.md) only when asked to search a photo library.

Preserve complete images and their aspect ratios with `contain`; do not regenerate approved artwork. Choose titles, cover colors, page proportions, and spreads to suit the material, following the [design principles](references/default-style.md). For requested artistic transformations, consult [spread generation](references/spread-generation.md) or the [photo processing catalog](references/photo-skill-catalog.md).

## Default reading experience

- **Setting:** Use the bundled overhead wooden desk with a pencil on the right, or the user's background. Crop the background to fit the viewport, not the book pages.
- **Sound:** Play the bundled local page-turn recording at volume 0.40 only on deliberate turns, never on load, hover, or instant page jumps. Playback failures must not interrupt reading. Prefer user-supplied audio when provided. Consult [media provenance](assets/media-origin.md) before redistributing bundled media; personal use does not establish redistribution rights.
- **Controls:** Hide the reading header and footer. Retain page-corner clicks, dragging, touch swipes, arrow keys, and Home/End. Keep editing controls visible only while writing.
- **Sizing:** Target a book height of 82% of the viewport, constrained by available width. The base 384×640 dimensions define proportions, not a display-size cap. Check small and large windows.
- **Physical appearance:** Separate the cover, page blocks, and contact shadows. Open books have independent left and right page stacks, subtle side edges, and a thin bottom edge interrupted at the gutter. Stack thickness shifts as pages turn. Closed covers align with their backing, conceal exposed paper edges, and share cloth texture, rounded corners, and edge lighting. Avoid continuous striped bottom edges.

Explicit user preferences override these defaults.

## Handwritten notes

Include the bundled editor and local Maoken handwriting font; no system font installation is needed. Clicking the pencil enters editing; clicking a page adds text. Support line breaks, dragging, text-box width, font size, color, ±45° rotation, reset to horizontal, deletion, discard, and save.

Read [note editing and persistence](references/notes-editing.md) when generating or maintaining a book. Preserve the font, OFL license, and attribution. Never copy personal `notes.json` files or backups into templates or new books. Keep editing events isolated from page-turn controls.

## Generate and maintain

Read [runtime and validation](references/book-editing.md). Reuse the PageFlip engine in `assets/html/`, preserving page folds, front and back faces, shadows, and the 760ms turn duration.

Use the [generator](scripts/create-book.py) to copy the runtime and populate pages:

```sh
python3 "$SKILL_DIR/scripts/create-book.py" --output "output/photo-book" --title "My Photo Book" --subtitle "Travel Notes" --photos "photo1.jpg" "photo2.png"
```

Use `--background` and `--sound` for custom media, and `--page-width` / `--page-height` for proportions. The output directory must not already exist. Edit existing books in place without regenerating over them.

Copy all runtime assets into the output with relative paths; generated books must not depend on the installed skill directory. Configure the background, cloth color, and audio in `book-config.js`; pages and titles in `index.html`; book materials in `edition.css`. Preserve font and engine licenses.

After asset changes, check caching and update CSS/JS version parameters when necessary. If a preview URL stops working, check the local server before treating the files as damaged.

## Validate and deliver

Check the cover, open spreads, back cover, page turns, and narrow layouts. Verify audio triggers, font loading, note editing, persistence after reopening, and browser errors. Use a separate test book so verification cannot overwrite personal notes.

Provide the output directory, a working local preview, and a screenshot. Include the platform's launch entry point and explain that saving notes requires the Python 3 local server to remain running. Opening `index.html` directly is a reading option, not a file-saving workflow.

Video production is a separate task; when requested, adapt an independent copy and preserve the accepted interactive book.
