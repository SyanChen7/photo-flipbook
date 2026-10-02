# HTML runtime and verification

Copy `assets/html/`, or run `scripts/create-book.py`. Outputs contain their own assets, engine and licenses; no runtime dependency on this skill's location or another project.

## Files

- `index.html`: title, subtitle and `.book-page` leaves. First/last only use `data-density="hard"`. Fill `PHOTO_PAGES` with paired photo leaves, or let the generator do it. Keep an even total leaf count; add a blank leaf for an odd photo count. Never leave blank sample placeholders in delivery.
- `book-config.js`: background, clothColor and sound `{enabled,src,volume}`. Paths are local to the result directory. Use the supplied media by default; user media takes precedence. No external fetches needed.
- `styles.css`: original responsive reader geometry and navigation; `style/`: paper, cloth, fonts and page design.
- `edition.css`: desk, hidden bars, cover material, case shadow and independent left/right paper blocks. Only customize requested values, not reimplement the structure.
- `flipbook.js`: original PageFlip integration plus state-driven decorative blocks and one user-triggered audio playback per turn. Decorative spans must remain outside the `.book-page` NodeList passed to `loadFromHTML`.
- `vendor/page-flip.browser.js`: original bundled engine; retain its license and animation behavior.

## Geometry invariants

Use an appropriate image ratio. The default 384×640 dimensions define the aspect ratio, not a display-size cap. The rig targets 82% of viewport height with safe outer margins, and constrains width to available space. Avoid fixed display-size caps that prevent the book from scaling with large windows. `contain` preserves original art. `.poster` provides narrow framing for complete posters; `.plate` supports art-book spacing for ordinary photos.

The persistent case sits below PageFlip, with `pointer-events:none`. Open books show two independent stacks and a separated gutter. `--left-stack` grows from2px to8px and `--right-stack` shrinks from8px to2px with page index. Do not add full-width striped bottom edges. Closed front/back state hides both decorative paper stacks and aligns the underlying case to the single visible cover. Portrait mode uses one paper block and must not retain a double-width case.

Cloth face and case share color and texture. Use small rounded corners, subtle inset highlights and soft contact shadows. Keep moving leaf shadows attached to their leaves so turning still looks like paper rather than a flat card.

Header/control elements remain in the DOM for existing state bindings but are not displayed. Do not delete them without adapting their script references. Keyboard navigation, pointer turns and touch must remain functional.

## Audio

The bundled page-turn MP3 is enabled by default. Replace it via `--sound` or configure a local path in book-config.js. Default volume is 0.40. Only deliberate turns play audio; playback failures must not interrupt reading. See `assets/media-origin.md` for bundled media provenance.

## Preview and QA

Serve from the output directory on an available loopback port:

```sh
python3 notes-server.py --port 4173 --no-open
```

Keep the active server available during review. If the old link fails, check the service and document root first. Provide the absolute `index.html` file link as a durable alternative; do not describe a temporary localhost link as permanently hosted.

Run `node --test html-contract.test.mjs`. Then verify in the browser:

- compare desktop viewports 1151×734 and 1824×930: the book grows with the window, targeting about 82% height when width permits; also check 390×844 portrait;
- cover aligns with its case; no exposed white bottom rim; typography fits;
- open spread has separated, restrained side stacks and a visible contact shadow;
- forward/back turns, drag and Home/End work; photos are complete, correctly paired and unmirrored;
- closed back cover and narrow portrait mode have no stray half-book base or horizontal overflow;
- all images and audio load locally; one real user turn plays the supplied audio when enabled, no autoplay;
- custom background and sound paths resolve; no visible header/footer bars or console errors.

Save a cover and an open-spread screenshot in the output QA directory. Use the available browser tool rather than assuming markup proves visual correctness.
