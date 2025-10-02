# Anki Screenshot Helper

A Chrome extension that lets you capture screenshots from any webpage and automatically add them to your Anki flashcards.

## 🚀 Quick Start

### 1. Install AnkiConnect

1. Open Anki Desktop
2. Go to **Tools → Add-ons → Get Add-ons**
3. Enter code: **2055492159**
4. Restart Anki

### 2. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the **`extension`** folder from this project
5. The extension icon should appear in your Chrome toolbar

### 3. Use It!

1. Make sure Anki is running
2. Click the extension icon
3. Select a deck and pick a card without an image
4. Navigate to any webpage
5. Press **Ctrl+Shift+S** (or **⌘+Shift+S** on Mac)
6. Draw a box around what you want to capture
7. Done! The screenshot is now on your Anki card

## 📁 Project Structure

```
extension/              ← Load this folder in Chrome
├── manifest.json       Extension configuration
├── background.js       Command handling & messaging
├── content.js          Screenshot capture overlay
├── popup.html/js/css   Extension popup interface
├── ankiconnect.js      AnkiConnect API wrapper
└── SETUP.md           Detailed installation guide

demo.html              Test page for trying the extension
server.py              Demo page server (runs on port 5000)
```

## ✨ Features

- ✅ Browse all your Anki decks and cards
- ✅ Filter cards that don't have images
- ✅ Capture screenshots from any webpage
- ✅ Automatic upload to Anki's media collection
- ✅ Images added directly to card's Front field
- ✅ Persistent card selection across browsing sessions
- ✅ Visual feedback with notifications

## 🔧 Testing

A demo page is available at `http://localhost:5000` when the server is running. Use it to test screenshot capture with sample vocabulary words and visual content.

## 📖 Documentation

See **`extension/SETUP.md`** for:
- Detailed setup instructions
- Troubleshooting guide
- Keyboard shortcuts
- Usage tips

## 🎯 How It Works

1. Extension connects to Anki via AnkiConnect (localhost:8765)
2. You select a card from your deck
3. Keyboard shortcut triggers screenshot mode
4. You draw a selection box on the webpage
5. Extension captures, encodes, and uploads the image
6. AnkiConnect updates the card's Front field with the image

## 🐛 Troubleshooting

**"Not connected"** → Make sure Anki is running with AnkiConnect installed

**"No Card Selected"** → Open the popup and click on a card to select it

**Screenshot fails** → Grant Chrome permission to capture screen when prompted

**Cards not loading** → Verify Anki is running and the deck contains cards

## 💡 Pro Tips

- Use the "Show only cards without images" filter to find cards that need images
- The selected card persists across browser sessions
- Press ESC to cancel screenshot capture
- Works on any webpage - try Wikipedia, dictionaries, or image sites!

---

Made for language learners who want to add visual context to their Anki flashcards 🎴
