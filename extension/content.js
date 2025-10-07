let captureOverlay = null;
let selectionBox = null;
let isSelecting = false;
let startX = 0;
let startY = 0;
let currentCard = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCapture') {
    currentCard = message.card;
    initializeCaptureMode();
  }
});

function initializeCaptureMode() {
  if (captureOverlay) {
    removeCaptureMode();
  }
  
  captureOverlay = document.createElement('div');
  captureOverlay.id = 'anki-screenshot-overlay';
  captureOverlay.innerHTML = `
    <div id="anki-capture-instructions">
      Click and drag to select area. Press ESC to cancel.
    </div>
    <div id="anki-selection-box"></div>
  `;
  
  document.body.appendChild(captureOverlay);
  
  selectionBox = document.getElementById('anki-selection-box');
  
  captureOverlay.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('keydown', handleKeyDown);
}

function handleMouseDown(e) {
  if (e.target !== captureOverlay) return;
  
  isSelecting = true;
  startX = e.clientX;
  startY = e.clientY;
  
  selectionBox.style.left = startX + 'px';
  selectionBox.style.top = startY + 'px';
  selectionBox.style.width = '0px';
  selectionBox.style.height = '0px';
  selectionBox.style.display = 'block';
}

function handleMouseMove(e) {
  if (!isSelecting) return;
  
  const currentX = e.clientX;
  const currentY = e.clientY;
  
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  selectionBox.style.left = left + 'px';
  selectionBox.style.top = top + 'px';
  selectionBox.style.width = width + 'px';
  selectionBox.style.height = height + 'px';
}

async function handleMouseUp(e) {
  if (!isSelecting) return;
  
  isSelecting = false;
  
  const rect = selectionBox.getBoundingClientRect();
  
  if (rect.width < 10 || rect.height < 10) {
    removeCaptureMode();
    return;
  }
  
  captureOverlay.style.display = 'none';
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await captureSelectedArea(rect);
  
  removeCaptureMode();
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    removeCaptureMode();
  }
}

async function captureSelectedArea(rect) {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser'
      }
    });
    
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    await new Promise(resolve => {
      video.onloadedmetadata = resolve;
    });
    
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    const scaleX = videoWidth / window.innerWidth;
    const scaleY = videoHeight / window.innerHeight;
    
    const sourceX = Math.round(rect.left * scaleX);
    const sourceY = Math.round(rect.top * scaleY);
    const sourceWidth = Math.round(rect.width * scaleX);
    const sourceHeight = Math.round(rect.height * scaleY);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    
    ctx.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight
    );
    
    stream.getTracks().forEach(track => track.stop());
    
    const imageData = canvas.toDataURL('image/png');
    
    chrome.runtime.sendMessage({
      action: 'captureComplete',
      imageData: imageData,
      card: currentCard
    }, (response) => {
      if (response && response.success) {
        console.log('Screenshot successfully added to Anki card');
      } else {
        console.error('Failed to add screenshot:', response?.error);
      }
    });
    
  } catch (error) {
    console.error('Capture failed:', error);
    alert('Screenshot capture failed. Please try again.');
  }
}

function removeCaptureMode() {
  if (captureOverlay) {
    captureOverlay.remove();
    captureOverlay = null;
    selectionBox = null;
  }
  
  isSelecting = false;
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('keydown', handleKeyDown);
}
