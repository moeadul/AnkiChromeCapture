let currentDeck = null;
let allCards = [];
let filteredCards = [];
let selectedCard = null;

const elements = {
  connectionStatus: document.getElementById('connection-status'),
  connectionText: document.getElementById('connection-text'),
  deckSelect: document.getElementById('deck-select'),
  refreshDecks: document.getElementById('refresh-decks'),
  showWithoutImages: document.getElementById('show-without-images'),
  cardCount: document.getElementById('card-count'),
  cardsList: document.getElementById('cards-list'),
  selectedCardInfo: document.getElementById('selected-card-info'),
  clearSelection: document.getElementById('clear-selection'),
  guidedModeSection: document.getElementById('guided-mode-section'),
  startGuidedMode: document.getElementById('start-guided-mode'),
  guidedProgress: document.getElementById('guided-progress'),
  progressText: document.getElementById('progress-text'),
  stopGuidedMode: document.getElementById('stop-guided-mode')
};

async function initialize() {
  const isConnected = await checkAnkiConnection();
  updateConnectionStatus(isConnected);
  
  if (isConnected) {
    await loadDecks();
    await loadSelectedCard();
    await checkGuidedModeState();
  }
  
  setupEventListeners();
}

function updateConnectionStatus(isConnected) {
  if (isConnected) {
    elements.connectionStatus.className = 'status-indicator connected';
    elements.connectionText.textContent = 'Connected to AnkiConnect';
    elements.deckSelect.disabled = false;
    elements.refreshDecks.disabled = false;
  } else {
    elements.connectionStatus.className = 'status-indicator disconnected';
    elements.connectionText.textContent = 'Not connected - Is Anki running?';
    elements.deckSelect.disabled = true;
    elements.refreshDecks.disabled = true;
  }
}

async function loadDecks() {
  try {
    const decks = await getDeckNames();
    elements.deckSelect.innerHTML = '<option value="">-- Select a deck --</option>';
    
    decks.forEach(deck => {
      const option = document.createElement('option');
      option.value = deck;
      option.textContent = deck;
      elements.deckSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load decks:', error);
    showError('Failed to load decks. Make sure Anki is running with AnkiConnect installed.');
  }
}

async function loadCardsFromDeck(deckName) {
  try {
    elements.cardsList.innerHTML = '<div class="empty-state">Loading cards...</div>';
    
    allCards = await getCardsInDeck(deckName);
    currentDeck = deckName;
    
    filterAndDisplayCards();
  } catch (error) {
    console.error('Failed to load cards:', error);
    elements.cardsList.innerHTML = '<div class="empty-state">Error loading cards</div>';
  }
}

async function refreshCardsFromDeck() {
  try {
    allCards = await getCardsInDeck(currentDeck);
    filterAndDisplayCards();
  } catch (error) {
    console.error('Failed to refresh cards:', error);
  }
}

function filterAndDisplayCards() {
  const showOnlyWithoutImages = elements.showWithoutImages.checked;
  
  if (showOnlyWithoutImages) {
    filteredCards = allCards.filter(card => !cardHasImage(card));
  } else {
    filteredCards = allCards;
  }
  
  displayCards();
  updateGuidedModeButton();
}

function displayCards() {
  elements.cardCount.textContent = `${filteredCards.length} card${filteredCards.length !== 1 ? 's' : ''}`;
  
  if (filteredCards.length === 0) {
    elements.cardsList.innerHTML = '<div class="empty-state">No cards found</div>';
    return;
  }
  
  elements.cardsList.innerHTML = '';
  
  filteredCards.forEach(card => {
    const cardElement = createCardElement(card);
    elements.cardsList.appendChild(cardElement);
  });
}

function createCardElement(card) {
  const div = document.createElement('div');
  div.className = 'card-item';
  div.dataset.cardId = card.cardId;
  div.dataset.noteId = card.noteId;
  
  if (selectedCard && selectedCard.cardId === card.cardId) {
    div.classList.add('selected');
  }
  
  const question = stripHtml(card.question).substring(0, 100);
  const hasImage = cardHasImage(card);
  
  div.innerHTML = `
    <div class="card-question">${question || '(Empty card)'}</div>
    <div class="card-meta">${hasImage ? '📷 Has image' : '⭕ No image'}</div>
  `;
  
  div.addEventListener('click', () => selectCard(card));
  
  return div;
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

async function selectCard(card) {
  selectedCard = card;
  
  await chrome.storage.local.set({ selectedCard: card });
  
  updateSelectedCardDisplay();
  
  document.querySelectorAll('.card-item').forEach(el => {
    el.classList.remove('selected');
  });
  
  const cardElement = document.querySelector(`[data-card-id="${card.cardId}"]`);
  if (cardElement) {
    cardElement.classList.add('selected');
  }
}

async function loadSelectedCard() {
  const result = await chrome.storage.local.get('selectedCard');
  if (result.selectedCard) {
    selectedCard = result.selectedCard;
    updateSelectedCardDisplay();
  }
}

function updateSelectedCardDisplay() {
  if (selectedCard) {
    const question = stripHtml(selectedCard.question).substring(0, 80);
    elements.selectedCardInfo.className = 'selected-info has-selection';
    elements.selectedCardInfo.innerHTML = `
      <strong>Selected:</strong> ${question || '(Empty card)'}<br>
      <small>Deck: ${selectedCard.deckName}</small>
    `;
    elements.clearSelection.disabled = false;
  } else {
    elements.selectedCardInfo.className = 'selected-info';
    elements.selectedCardInfo.textContent = 'No card selected';
    elements.clearSelection.disabled = true;
  }
}

async function clearSelection() {
  selectedCard = null;
  await chrome.storage.local.remove('selectedCard');
  updateSelectedCardDisplay();
  
  document.querySelectorAll('.card-item').forEach(el => {
    el.classList.remove('selected');
  });
}

function setupEventListeners() {
  elements.deckSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      loadCardsFromDeck(e.target.value);
    }
  });
  
  elements.refreshDecks.addEventListener('click', async () => {
    await loadDecks();
  });
  
  elements.showWithoutImages.addEventListener('change', () => {
    filterAndDisplayCards();
  });
  
  elements.clearSelection.addEventListener('click', clearSelection);
  
  elements.startGuidedMode.addEventListener('click', startGuidedMode);
  elements.stopGuidedMode.addEventListener('click', stopGuidedMode);
  
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.guidedMode) {
        handleGuidedModeChange(changes.guidedMode.newValue);
      }
      if (changes.selectedCard) {
        handleSelectedCardChange(changes.selectedCard.newValue);
      }
    }
  });
}

function showError(message) {
  elements.cardsList.innerHTML = `<div class="empty-state" style="color: #f44336;">${message}</div>`;
}

async function startGuidedMode() {
  const cardsWithoutImages = allCards.filter(card => !cardHasImage(card));
  
  if (cardsWithoutImages.length === 0) {
    alert('No cards without images found in this deck!');
    return;
  }
  
  const guidedMode = {
    active: true,
    cardQueue: cardsWithoutImages,
    currentIndex: 0,
    deckName: currentDeck
  };
  
  await chrome.storage.local.set({ 
    guidedMode: guidedMode,
    selectedCard: cardsWithoutImages[0]
  });
  
  selectedCard = cardsWithoutImages[0];
  updateGuidedModeUI(guidedMode);
  updateSelectedCardDisplay();
}

async function stopGuidedMode() {
  await chrome.storage.local.remove('guidedMode');
  
  elements.startGuidedMode.style.display = 'block';
  elements.guidedProgress.style.display = 'none';
  updateGuidedModeButton();
}

async function checkGuidedModeState() {
  const result = await chrome.storage.local.get('guidedMode');
  
  if (result.guidedMode && result.guidedMode.active) {
    updateGuidedModeUI(result.guidedMode);
  }
}

function updateGuidedModeUI(guidedMode) {
  elements.guidedModeSection.style.display = 'block';
  elements.startGuidedMode.style.display = 'none';
  elements.guidedProgress.style.display = 'flex';
  
  const current = guidedMode.currentIndex + 1;
  const total = guidedMode.cardQueue.length;
  elements.progressText.textContent = `Card ${current} of ${total}`;
}

function updateGuidedModeButton() {
  const cardsWithoutImages = allCards.filter(card => !cardHasImage(card));
  
  if (cardsWithoutImages.length > 0 && currentDeck) {
    elements.guidedModeSection.style.display = 'block';
    elements.startGuidedMode.disabled = false;
  } else {
    elements.startGuidedMode.disabled = true;
  }
}

async function handleGuidedModeChange(guidedMode) {
  if (guidedMode && guidedMode.active) {
    updateGuidedModeUI(guidedMode);
    
    if (guidedMode.currentIndex > 0 && currentDeck) {
      await refreshCardsFromDeck();
    }
  } else {
    elements.startGuidedMode.style.display = 'block';
    elements.guidedProgress.style.display = 'none';
    
    if (currentDeck) {
      await refreshCardsFromDeck();
    }
  }
}

function handleSelectedCardChange(card) {
  selectedCard = card;
  updateSelectedCardDisplay();
  
  document.querySelectorAll('.card-item').forEach(el => {
    el.classList.remove('selected');
  });
  
  if (card) {
    const cardElement = document.querySelector(`[data-card-id="${card.cardId}"]`);
    if (cardElement) {
      cardElement.classList.add('selected');
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  
  updateGuidedModeButton();
}

initialize();
