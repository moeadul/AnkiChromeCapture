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
  if (message.action === 'captureArea') {
    handleCaptureArea(message.coordinates, message.card, sender.tab.id)
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

async function handleCaptureArea(coordinates, card, tabId) {
  const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: 'png'
  });
  
  const croppedImageData = await cropImage(screenshotDataUrl, coordinates);
  
  const base64Data = croppedImageData.split(',')[1];
  
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
  
  const guidedState = await chrome.storage.local.get('guidedMode');
  
  if (guidedState.guidedMode && guidedState.guidedMode.active) {
    await advanceToNextCard(guidedState.guidedMode);
  } else {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Screenshot Added',
      message: 'Image successfully added to Anki card!'
    });
  }
  
  return { filename };
}

async function advanceToNextCard(guidedMode) {
  const currentIndex = guidedMode.currentIndex + 1;
  const totalCards = guidedMode.cardQueue.length;
  
  if (currentIndex >= totalCards) {
    await chrome.storage.local.remove('guidedMode');
    await chrome.storage.local.remove('selectedCard');
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Guided Mode Complete!',
      message: `All ${totalCards} cards now have images!`
    });
  } else {
    const nextCard = guidedMode.cardQueue[currentIndex];
    
    await chrome.storage.local.set({
      selectedCard: nextCard,
      guidedMode: {
        ...guidedMode,
        currentIndex: currentIndex
      }
    });
    
    const cardPreview = stripHtmlTags(nextCard.question).substring(0, 50);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: `Card ${currentIndex + 1} of ${totalCards}`,
      message: `Next: ${cardPreview || '(Empty card)'}...`
    });
  }
}

function stripHtmlTags(html) {
  return html.replace(/<[^>]*>/g, '');
}

async function cropImage(dataUrl, coordinates) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);
  
  const dpr = coordinates.devicePixelRatio;
  const x = coordinates.x * dpr;
  const y = coordinates.y * dpr;
  const width = coordinates.width * dpr;
  const height = coordinates.height * dpr;
  
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(imageBitmap, x, y, width, height, 0, 0, width, height);
  
  const resultBlob = await canvas.convertToBlob({ type: 'image/png' });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(resultBlob);
  });
}
