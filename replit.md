# Anki Screenshot Helper

## Overview

This project is a Chrome browser extension that enables users to capture screenshots from web pages and automatically attach them to Anki flashcards. The extension integrates with Anki Desktop through the AnkiConnect add-on, allowing seamless communication between the browser and the flashcard application. Users can select a target card from their Anki decks, capture a portion of any webpage using a visual selection tool, and have the screenshot automatically added to their chosen card.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 10, 2025
- **Added Guided Mode**: Automated workflow for batch processing cards
  - Select deck → click "Start Guided Mode" → automatically cycles through cards without images
  - After each screenshot capture, auto-advances to next card needing an image
  - Shows progress indicator (e.g., "Card 3 of 15")
  - Displays completion notification when all cards have images
  - Can stop/restart guided mode anytime
- **Fixed Service Worker Compatibility**: Replaced Image API with OffscreenCanvas and createImageBitmap for Manifest V3
- **Implemented Real-time State Sync**: Popup UI updates automatically when background script advances to next card
- **Added Card Data Refresh**: Popup refreshes card metadata after each capture to accurately track completion

### October 2, 2025
- Built complete Chrome extension for Anki screenshot capture
- Added notifications permission to manifest (critical fix for user feedback)
- Refactored background.js to use consistent AnkiRequest function
- Created organized project structure with extension files in `/extension` directory
- Added demo page for testing extension functionality
- Created comprehensive setup instructions in SETUP.md

## Project Structure

```
/extension/              # Chrome extension files (load this folder in Chrome)
  ├── manifest.json      # Extension configuration
  ├── background.js      # Service worker for commands & messaging
  ├── content.js         # Screenshot capture overlay
  ├── content.css        # Overlay styling
  ├── popup.html         # Extension popup UI
  ├── popup.js           # Popup logic
  ├── popup.css          # Popup styling
  ├── ankiconnect.js     # AnkiConnect API wrapper
  ├── icon*.png          # Extension icons
  └── SETUP.md           # Installation and usage instructions

/demo.html              # Test page for trying the extension
/server.py              # Development server for demo page
```

## System Architecture

### Extension Architecture

The extension follows the Chrome Extension Manifest V3 architecture with three main components:

**Background Service Worker (background.js)**
- Handles keyboard shortcut commands (Ctrl+Shift+S / ⌘+Shift+S)
- Manages cross-component messaging between popup and content scripts
- Validates that a card is selected before allowing screenshot capture
- Processes screenshot data and communicates with AnkiConnect API
- Displays system notifications for user feedback

**Content Scripts (content.js + content.css)**
- Injected into all web pages to enable screenshot capture
- Creates a visual overlay with semi-transparent background for selection
- Implements click-and-drag selection box with real-time visual feedback
- Captures selected area dimensions and triggers screenshot processing
- Provides escape key functionality to cancel capture

**Popup Interface (popup.html + popup.js + popup.css)**
- Serves as the main user interface for card selection
- Displays connection status to AnkiConnect
- Lists available Anki decks in a dropdown selector
- Shows filterable list of cards (with option to show only cards without images)
- Maintains selected card state in Chrome's local storage
- Provides refresh functionality to reload deck/card data
- **Guided Mode**: Automated batch processing workflow that cycles through cards without images

### Communication Flow

**Manual Mode:**
1. User opens popup → checks AnkiConnect connection → loads deck list
2. User selects deck → fetches and displays cards from that deck
3. User clicks card → stores selection in Chrome local storage
4. User presses keyboard shortcut → background worker validates selection
5. Background worker sends message to content script with card data
6. Content script initializes capture overlay and selection interface
7. User completes selection → content script sends image data to background
8. Background worker sends image to AnkiConnect API with card ID

**Guided Mode:**
1. User selects deck → clicks "Start Guided Mode" → creates queue of cards without images
2. First card in queue is auto-selected and stored in Chrome local storage
3. User captures screenshot (same flow as manual mode steps 4-8)
4. After successful capture → background auto-advances to next card in queue
5. Background updates storage with new selectedCard and currentIndex
6. Popup listens to storage.onChanged → refreshes UI with new card and progress
7. Popup refetches card data from AnkiConnect to update image status
8. Process repeats until all cards have images → displays completion notification

### State Management

- Selected card stored in Chrome's local storage for persistence across sessions
- Connection status checked on popup initialization
- Card lists filtered client-side based on image presence
- **Guided Mode State**: Stores active status, card queue, and current index in Chrome local storage
- **Real-time Sync**: Popup listens to storage.onChanged events to update UI when background advances cards
- **Card Data Refresh**: Popup refetches card metadata after each capture to maintain accurate image status
- No complex state management library needed due to storage-based event system

### UI/UX Design Decisions

**Visual Selection Interface**
- Semi-transparent overlay (30% black) to maintain page visibility
- Blue selection box with 20% opacity fill for clear boundary indication
- Floating instruction banner with high z-index for visibility
- Crosshair cursor to indicate capture mode

**Popup Interface**
- Fixed width (450px) for consistent layout
- Scrollable card list with maximum height for large decks
- Color-coded connection indicator (green/red) for quick status recognition
- Sticky selected card section at bottom for constant visibility

## External Dependencies

### AnkiConnect API

The extension depends on the AnkiConnect add-on (code: 2055492159) running in Anki Desktop. Communication occurs via HTTP POST requests to `http://localhost:8765` using AnkiConnect's JSON API (version 6).

**Key API Methods Used:**
- `version` - Connection validation
- `deckNames` - Retrieve list of available decks
- `findCards` - Query card IDs by deck name
- `cardsInfo` - Fetch detailed card information including fields and media
- `storeMediaFile` - Upload base64 image data to Anki media collection
- `updateNoteFields` - Update card fields with new content

### Chrome Extension APIs

**Permissions Required:**
- `activeTab` - Access current tab for screenshot capture
- `storage` - Persist selected card across sessions
- `scripting` - Inject content scripts dynamically
- `notifications` - Display error/status messages
- `host_permissions` for localhost:8765 - AnkiConnect communication

**APIs Used:**
- `chrome.commands` - Keyboard shortcut handling
- `chrome.storage.local` - Card selection persistence
- `chrome.tabs` - Tab querying and messaging
- `chrome.runtime` - Cross-component messaging
- `chrome.notifications` - User feedback

## Installation & Usage

1. **Install AnkiConnect** in Anki Desktop (add-on code: 2055492159)
2. **Load Extension** in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `/extension` folder
3. **Use Extension**:
   - Open extension popup and select a card
   - Press Ctrl+Shift+S (⌘+Shift+S on Mac) while browsing
   - Draw a box around content to capture
   - Screenshot automatically added to Anki card

See `/extension/SETUP.md` for detailed instructions.

## Development Tools

A Python-based development server (server.py) runs on port 5000 to serve demo.html for testing the extension with sample content.
