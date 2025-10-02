# Anki Screenshot Helper - Setup Instructions

## Prerequisites

1. **Anki Desktop** must be installed and running
2. **AnkiConnect Add-on** must be installed in Anki
   - Open Anki
   - Go to Tools → Add-ons → Get Add-ons
   - Enter code: `2055492159`
   - Restart Anki

## Installing the Extension

### Step 1: Load Unpacked Extension in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right corner)
3. Click **"Load unpacked"** button
4. Select the folder containing this extension's files
5. The extension should now appear in your extensions list

### Step 2: Verify AnkiConnect

1. Make sure Anki is running
2. Click the extension icon in Chrome toolbar
3. You should see "Connected to AnkiConnect" in green

## How to Use

### 1. Select a Card

1. Click the extension icon to open the popup
2. Choose a deck from the dropdown
3. (Optional) Filter to show only cards without images
4. Click on a card to select it
5. The selected card will be highlighted and shown at the bottom

### 2. Capture a Screenshot

1. Navigate to any webpage with the content you want to capture
2. Press **Ctrl+Shift+S** (Windows/Linux) or **⌘+Shift+S** (Mac)
3. A semi-transparent overlay will appear with instructions
4. Click and drag to select the area you want to capture
5. Release the mouse to capture
6. Press **ESC** to cancel at any time

### 3. Verify the Image Was Added

1. Open Anki
2. Find your card in the deck
3. The screenshot should appear in the "Front" field
4. You'll also see a notification in Chrome when successful

## Troubleshooting

### "Not connected - Is Anki running?"

- Make sure Anki desktop application is running
- Verify AnkiConnect add-on is installed (code: `2055492159`)
- Restart Anki after installing AnkiConnect

### "No Card Selected" notification

- Open the extension popup
- Select a card from the list
- The selected card persists until you change it

### Screenshot capture fails

- Grant Chrome permission to capture your screen when prompted
- Make sure you're selecting a reasonably sized area (at least 10x10 pixels)
- Try refreshing the page and attempting again

### Cards not loading

- Verify Anki is running with AnkiConnect installed
- Check that the deck has cards in it
- Click the refresh button (↻) next to the deck selector

## Keyboard Shortcuts

- **Ctrl+Shift+S** (⌘+Shift+S on Mac): Start screenshot capture
- **ESC**: Cancel screenshot capture

## Features

- ✅ Browse all decks and cards from Anki
- ✅ Filter cards that don't have images
- ✅ Persistent card selection across browsing sessions
- ✅ Capture screenshots from any webpage
- ✅ Automatic image upload to Anki's media collection
- ✅ Direct field update - images added to "Front" field

## Notes

- Screenshots are saved as PNG files in Anki's media folder
- Images are appended to existing Front field content
- The extension works in developer mode - no Chrome Web Store submission needed
- AnkiConnect must be running (Anki must be open) for the extension to work
