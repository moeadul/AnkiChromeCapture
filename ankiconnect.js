const ANKI_CONNECT_URL = 'http://localhost:8765';

async function ankiRequest(action, params = {}) {
  const response = await fetch(ANKI_CONNECT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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

async function checkAnkiConnection() {
  try {
    await ankiRequest('version');
    return true;
  } catch (error) {
    console.error('AnkiConnect connection error:', error);
    return false;
  }
}

async function getDeckNames() {
  return await ankiRequest('deckNames');
}

async function getCardsInDeck(deckName) {
  const cardIds = await ankiRequest('findCards', {
    query: `deck:"${deckName}"`
  });
  
  const cardsInfo = await ankiRequest('cardsInfo', {
    cards: cardIds
  });
  
  return cardsInfo.map(card => ({
    cardId: card.cardId,
    noteId: card.note,
    fields: card.fields,
    question: card.fields.Front?.value || '',
    answer: card.fields.Back?.value || '',
    deckName: card.deckName
  }));
}

function cardHasImage(card) {
  const frontField = card.fields.Front?.value || '';
  return frontField.includes('<img') || frontField.includes('[sound:');
}

async function getCardsWithoutImages(deckName) {
  const cards = await getCardsInDeck(deckName);
  return cards.filter(card => !cardHasImage(card));
}

async function storeMediaFile(filename, data) {
  return await ankiRequest('storeMediaFile', {
    filename: filename,
    data: data
  });
}

async function updateNoteFields(noteId, fields) {
  return await ankiRequest('updateNoteFields', {
    note: {
      id: noteId,
      fields: fields
    }
  });
}

async function addImageToCard(noteId, currentFrontField, imageFilename) {
  const imageTag = `<img src="${imageFilename}">`;
  const updatedFront = currentFrontField + '<br>' + imageTag;
  
  await updateNoteFields(noteId, {
    Front: updatedFront
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkAnkiConnection,
    getDeckNames,
    getCardsInDeck,
    getCardsWithoutImages,
    storeMediaFile,
    updateNoteFields,
    addImageToCard
  };
}
