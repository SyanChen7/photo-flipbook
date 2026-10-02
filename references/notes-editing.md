# Note editing and persistence

The runtime uses notes.js, notes.css and notes-server.py. Load notes.js after flipbook.js. Keep keyboard input isolated from page turns while editing.

The local font is style/fonts/maoken-handwriting-0.20.ttf (about 6.4 MB), accompanied by maoken-ofl.txt and maoken-attribution.md. It is loaded through @font-face for notes only. Do not simulate handwriting with random glyph transforms. Font bytes are unmodified; future conversion or subsetting must respect OFL reserved-name requirements.

Launch open-flipbook.command on macOS, open-flipbook.bat on Windows, or run python3 notes-server.py on Linux. Python 3.10+ is required; no npm dependency. The server binds only to 127.0.0.1 on a random port and stops when its terminal closes. Static file viewing does not support saving.

notes.json contains revision and a notes array. Each note stores id, zero-based page, proportional x/y/width, relative font size, text, and optional color and rotation. Defaults are #3e493d and 0 degrees. The server derives page count from index.html. Saving uses atomic replacement, a previous-save notes.backup.json, and revision conflict detection. Preserve personal notes and migrate their page assignments before reordering an existing book.

New books must not inherit sample notes or private backups. Custom backgrounds retain a visible pencil button but disable the default desk-pencil hotspot.

Run python3 test-notes-server.py in a separate generated test book. Check text, color and rotation after reopening, conflicts, backups, and notes near the end of books with different page counts. Verify editing, multiline text, dragging, sizing, saving and restored page turns in the browser, including narrow screens. Never write test notes into a user's existing book.
