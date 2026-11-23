const canvas = document.getElementById('pixelCanvas');
const colorPicker = document.getElementById('colorPicker');
const gridSizeInput = document.getElementById('gridSize');
const gridValue = document.getElementById('gridValue');
const statusText = document.getElementById('statusText');
const clearCanvasButton = document.getElementById('clearCanvas');
const saveImageButton = document.getElementById('saveImage');
const toolButtons = document.querySelectorAll('.tool-button');

let gridSize = Number(gridSizeInput.value);
let currentTool = 'paint';
let isDrawing = false;
let isErasing = false;
let currentColor = colorPicker.value;
let pixels = [];

function initializeGrid(size) {
  pixels = [];
  canvas.innerHTML = '';
  canvas.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
  canvas.style.gridTemplateRows = `repeat(${size}, minmax(0, 1fr))`;

  for (let i = 0; i < size * size; i += 1) {
    const pixel = document.createElement('button');
    pixel.type = 'button';
    pixel.className = 'pixel';
    pixel.dataset.index = String(i);
    pixel.style.background = '#ffffff';

    pixel.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      isDrawing = true;
      applyCellColor(pixel, i);
    });

    pixel.addEventListener('pointerenter', () => {
      if (isDrawing) {
        applyCellColor(pixel, i);
      }
    });

    canvas.appendChild(pixel);
    pixels.push(pixel);
  }
}

function setStatus(message) {
  statusText.textContent = message;
}

function applyCellColor(pixel, index) {
  const targetColor = currentTool === 'erase' ? '#ffffff' : currentColor;
  pixel.style.background = targetColor;
  pixels[index] = pixel;
}

function updateGridSize() {
  gridSize = Number(gridSizeInput.value);
  gridValue.textContent = `${gridSize} x ${gridSize}`;
  initializeGrid(gridSize);
  setStatus('Canvas resized');
}

function activateTool(toolName) {
  currentTool = toolName;
  toolButtons.forEach((button) => {
    const isActive = button.dataset.tool === toolName;
    button.classList.toggle('active', isActive);
  });

  setStatus(toolName === 'paint' ? 'Painting mode' : 'Eraser mode');
}

function clearCanvas() {
  pixels.forEach((pixel) => {
    pixel.style.background = '#ffffff';
  });
  setStatus('Canvas cleared');
}

function saveCanvasAsImage() {
  const exportCanvas = document.createElement('canvas');
  const cellSize = 32;
  exportCanvas.width = gridSize * cellSize;
  exportCanvas.height = gridSize * cellSize;

  const ctx = exportCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  pixels.forEach((pixel, index) => {
    const x = (index % gridSize) * cellSize;
    const y = Math.floor(index / gridSize) * cellSize;
    ctx.fillStyle = pixel.style.background || '#ffffff';
    ctx.fillRect(x, y, cellSize, cellSize);
  });

  const link = document.createElement('a');
  link.href = exportCanvas.toDataURL('image/png');
  link.download = 'pixel-forge-art.png';
  link.click();
  setStatus('PNG saved');
}

colorPicker.addEventListener('input', (event) => {
  currentColor = event.target.value;
  setStatus(`Brush set to ${currentColor}`);
});

gridSizeInput.addEventListener('input', updateGridSize);

clearCanvasButton.addEventListener('click', clearCanvas);
saveImageButton.addEventListener('click', saveCanvasAsImage);

toolButtons.forEach((button) => {
  button.addEventListener('click', () => activateTool(button.dataset.tool));
});

document.addEventListener('pointerup', () => {
  isDrawing = false;
});

document.addEventListener('pointerleave', () => {
  isDrawing = false;
});

initializeGrid(gridSize);
activateTool('paint');
setStatus('Ready');
