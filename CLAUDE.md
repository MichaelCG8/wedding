# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static single-page wedding website for Michael & Aga (wedding: 27 Jun 2026, Harburn Barn, West Calder). It is a customized fork of [rampatra/wedding-website](https://github.com/rampatra/wedding-website). There is no backend, build server, or database — it is served as static files from GitHub Pages (`CNAME` → wedding.rampatra.com, `.nojekyll` disables Jekyll processing). Deployment is simply pushing to `master`.

## Commands

```bash
npm install        # install dev dependencies (gulp toolchain)
npx gulp           # default task: compile sass + minify js (run before committing asset changes)
npx gulp sass      # compile sass/styles.scss -> css/styles.min.css only
npx gulp minify-js # uglify js/scripts.js -> js/scripts.min.js only
```

There are no tests (`npm test` intentionally fails). To preview, open `index.html` directly in a browser — no server needed.

The `.github/workflows/npm-gulp.yml` CI is entirely commented out; builds are run locally and the generated `css/styles.min.css` / `js/scripts.min.js` are committed to the repo.

## Architecture

The whole site is one page: `index.html`, with sections (`#invitation`, `#map`, `#timeline`, `#gifts`, `rsvp`, etc.) anchored for smooth-scroll nav.

**Editable source vs. generated artifacts** — edit the source, never the `.min` files:
- `sass/styles.scss` is the entry point; partials live in `sass/partials/` (`_typography`, `_buttons`, `_colors`, `_layout`). Compiles to the committed `css/styles.min.css`.
- `js/scripts.js` is the source; uglified to the committed `js/scripts.min.js`. `index.html` loads the `.min` version, so **you must run `npx gulp` after editing `scripts.js` or `styles.scss` or changes won't appear.**
- Other `css/*.css` and `js/vendor/*`, `js/jquery.*` are third-party libraries (Bootstrap, FlexSlider, Fancybox, YTPlayer, jQuery) — treat as vendored, don't hand-edit.

**`js/scripts.js`** holds all custom behavior: scroll/waypoint animations, nav, FlexSlider/Fancybox init, Google Map (`initMap`), Add-to-Calendar (`ouical.js`), and the RSVP form handler. A bundled MD5 implementation lives at the bottom of this file.

**RSVP flow** (in `scripts.js`, `#rsvp-form` submit handler):
1. Client-side gate: the entered invite code is MD5-hashed and compared against a hardcoded digest. Wrong code → error, no submission. This is obfuscation, not real security.
2. On match, the serialized form is POSTed to a Google Apps Script web app URL (the `script.google.com/macros/.../exec` endpoint) which appends the row to a Google Sheet and emails an alert.
3. Success/decline shows a Bootstrap modal; failure shows an alert.

## Editing notes

- Event-specific details are scattered: date/venue/title for the calendar invite are in `scripts.js` (`createCalendar` data block); map coordinates are in `initMap`; all visible copy, the RSVP form fields, and the timeline are in `index.html`.
- Changing the accepted invite code means replacing the MD5 digest string in `scripts.js` (hash the new code, lowercase hex), then re-running `npx gulp minify-js`.
- Changing the RSVP destination (sheet/email) means re-deploying the Google Apps Script and updating its `/exec` URL in `scripts.js`. The script itself is not in this repo.
