chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture-screenshot') {
    const result = await chrome.storage.local.get('selectedCard');
    
    if (!result.selectedCard) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'No Card Selected',
        message: 'Please select a card in the extension popup first.'
      });
      return;
    }
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'startCapture',
        card: result.selectedCard
      });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureComplete') {
    handleScreenshotCapture(message.imageData, message.card)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function ankiRequest(action, params = {}) {
  const ANKI_CONNECT_URL = 'http://localhost:8765';
  
  const response = await fetch(ANKI_CONNECT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: action,
      version: 6,
      params: params
    })
  });

  if (!response.ok) {
    throw new Error(`AnkiConnect request failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data.result;
}

async function handleScreenshotCapture(imageDataUrl, card) {
  const base64Data = imageDataUrl.split(',')[1];
  
  const timestamp = Date.now();
  const filename = `anki_screenshot_${card.noteId}_${timestamp}.png`;
  
  await ankiRequest('storeMediaFile', {
    filename: filename,
    data: base64Data
  });
  
  const currentFront = card.fields.Front?.value || '';
  const imageTag = `<img src="${filename}">`;
  const updatedFront = currentFront + '<br>' + imageTag;
  
  await ankiRequest('updateNoteFields', {
    note: {
      id: card.noteId,
      fields: {
        Front: updatedFront
      }
    }
  });
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'Screenshot Added',
    message: 'Image successfully added to Anki card!'
  });
  
  return { filename };
}
