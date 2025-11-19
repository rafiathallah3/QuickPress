# QuickPress Chrome Extension

Scaffold for a Manifest V3 Chrome extension built with TypeScript and bundled through [tsup](https://tsup.egoist.dev/).

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the type-safe development build with file watching:

   ```bash
   npm run dev
   ```

   - `dist/` is regenerated with every change.
   - Static assets inside `public/` (like `manifest.json`, popup HTML, and icons) are copied into `dist/`.

3. Create a production build:

   ```bash
   npm run build
   ```

## Load the Extension in Chrome

1. `npm run build` (if you have not already) so that `dist/` contains the latest assets.
2. Open `chrome://extensions`.
3. Toggle **Developer mode** (top-right).
4. Choose **Load unpacked**, then select the `dist/` directory from this project.

Whenever you rebuild, click the **Reload** button on the QuickPress card inside `chrome://extensions` to apply the updates.

## Keyboard Shortcut

- Press `Ctrl + Q` on any page to open the QuickPress command palette.
  - Every visible button and link is outlined on the page and listed in an overlay.
  - Use the search box to filter entries by text content as you type.
  - Press the shown shortcut key or click an entry to invoke that element’s original action.
  - Press `Esc` to dismiss the overlay without running anything.
- Open the popup’s “Overlay Shortcut” section to change the modifier keys and letter/digit used to toggle the palette. The new shortcut is saved immediately and works on all tabs.

### Firefox Submission Notes

- Firefox requires Manifest V3 add-ons to declare an ID and a minimum version that supports service workers. Update `browser_specific_settings.gecko.id` in `public/manifest.json` to your own domain-style identifier (for example `quickpress@example.com`) before uploading to AMO.
- The included `strict_min_version` is set to `121.0`, the first Firefox release that supports background service workers. Keep that or raise it if you depend on newer APIs.

