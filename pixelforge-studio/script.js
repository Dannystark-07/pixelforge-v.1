const designCanvas = document.getElementById('designCanvas');
const propertyPanel = document.getElementById('propertyPanel');
const layerList = document.getElementById('layerList');
const imageUpload = document.getElementById('imageUpload');
const fillColorInput = document.getElementById('fillColor');
const strokeColorInput = document.getElementById('strokeColor');
const canvasBackgroundInput = document.getElementById('canvasBackground');
const templateLibrary = document.getElementById('templateLibrary');
const templateCount = document.getElementById('templateCount');
const filterLibrary = document.getElementById('filterLibrary');
const filterCount = document.getElementById('filterCount');
const filterSearch = document.getElementById('filterSearch');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const duplicateBtn = document.getElementById('duplicateBtn');
const deleteBtn = document.getElementById('deleteBtn');
const newProjectBtn = document.getElementById('newProjectBtn');
const downloadBtn = document.getElementById('downloadBtn');
const zoomLabel = document.getElementById('zoomLabel');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const toolButtons = document.querySelectorAll('.tool-btn');
const swatches = document.querySelectorAll('.swatch');
const alignLeftBtn = document.getElementById('alignLeftBtn');
const alignCenterBtn = document.getElementById('alignCenterBtn');
const alignRightBtn = document.getElementById('alignRightBtn');
const bringFrontBtn = document.getElementById('bringFrontBtn');
const sendBackBtn = document.getElementById('sendBackBtn');

let selectedTool = 'select';
let zoom = 1;
let objectIdCounter = 1;
let selectedId = null;
let dragState = null;
let history = [];
let future = [];

const state = {
  objects: [],
  backgroundColor: '#fffaf5',
};

const templateCatalog = [
  { id: 'birthday', name: 'Birthday Glow', category: 'Birthday', accent: '#ff7a18', preview: 'linear-gradient(135deg, #ff7a18, #ffb86c)', title: 'Happy Birthday', subtitle: 'You are amazing' },
  { id: 'hindi', name: 'Hindi Greeting', category: 'Hindi', accent: '#7c3aed', preview: 'linear-gradient(135deg, #7c3aed, #c084fc)', title: 'शुभकामनाएँ', subtitle: 'सदा खुश रहो' },
  { id: 'wedding', name: 'Wedding Invite', category: 'Wedding', accent: '#f43f5e', preview: 'linear-gradient(135deg, #f43f5e, #f9a8d4)', title: 'We are getting married', subtitle: 'Save the date' },
  { id: 'festival', name: 'Festival Poster', category: 'Festival', accent: '#f59e0b', preview: 'linear-gradient(135deg, #f59e0b, #fbbf24)', title: 'Diwali Wishes', subtitle: 'Joy & light' },
  { id: 'business', name: 'Business Banner', category: 'Business', accent: '#0ea5e9', preview: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', title: 'Launch Your Brand', subtitle: 'Fresh growth' },
  { id: 'travel', name: 'Travel Poster', category: 'Travel', accent: '#14b8a6', preview: 'linear-gradient(135deg, #14b8a6, #5eead4)', title: 'Explore More', subtitle: 'Adventure starts here' },
  { id: 'social', name: 'Social Post', category: 'Social', accent: '#f472b6', preview: 'linear-gradient(135deg, #f472b6, #f9a8d4)', title: 'New Drop', subtitle: 'Shop now' },
  { id: 'thankyou', name: 'Thank You Card', category: 'Greeting', accent: '#22c55e', preview: 'linear-gradient(135deg, #22c55e, #86efac)', title: 'Thank You', subtitle: 'For everything' },
];

function buildFilterCatalog(total = 1000) {
  const names = ['Aurora', 'Bliss', 'Nova', 'Velvet', 'Radiant', 'Mist', 'Bloom', 'Solar', 'Citrus', 'Nightfall', 'Peach', 'Rosy', 'Sky', 'Crystal', 'Dusk', 'Golden', 'Lime', 'Cloud', 'Lagoon', 'Coral'];
  const results = [];

  for (let i = 0; i < total; i += 1) {
    const name = names[i % names.length];
    const brightness = 90 + ((i * 7) % 36);
    const saturation = 90 + ((i * 13) % 65);
    const contrast = 100 + ((i * 9) % 55);
    const sepia = (i % 5) * 12;
    const hue = (i * 17) % 360;
    const blur = (i % 3) * 0.4;
    const grayscale = i % 7 === 0 ? 30 : 0;
    const accent = `hsl(${hue} 80% 60%)`;

    results.push({
      id: i + 1,
      name: `${name} ${String(i + 1).padStart(3, '0')}`,
      css: `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%) sepia(${sepia}%) grayscale(${grayscale}%) hue-rotate(${hue}deg) blur(${blur}px)`,
      accent,
    });
  }

  return results;
}

const filterCatalog = buildFilterCatalog(1000);

function cloneObjects() {
  return state.objects.map((item) => ({ ...item }));
}

function pushHistory() {
  const snapshot = JSON.stringify(cloneObjects());
  history.push(snapshot);
  if (history.length > 50) history.shift();
  future = [];
  updateHistoryButtons();
}

function updateHistoryButtons() {
  undoBtn.disabled = history.length === 0;
  redoBtn.disabled = future.length === 0;
  undoBtn.style.opacity = history.length === 0 ? '0.5' : '1';
  redoBtn.style.opacity = future.length === 0 ? '0.5' : '1';
}

function recordState() {
  pushHistory();
}

function undoAction() {
  if (history.length === 0) return;
  const current = JSON.stringify(cloneObjects());
  future.push(current);
  const prev = history.pop();
  state.objects = JSON.parse(prev || '[]');
  renderCanvas();
  renderProperties();
  renderLayers();
  updateHistoryButtons();
}

function redoAction() {
  if (future.length === 0) return;
  const current = JSON.stringify(cloneObjects());
  history.push(current);
  const next = future.pop();
  state.objects = JSON.parse(next || '[]');
  renderCanvas();
  renderProperties();
  renderLayers();
  updateHistoryButtons();
}

function getSelectedObject() {
  return state.objects.find((obj) => obj.id === selectedId) || null;
}

function selectObject(id) {
  selectedId = id;
  renderCanvas();
  renderProperties();
  renderLayers();
}

function setTool(tool) {
  selectedTool = tool;
  toolButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tool === tool));
}

function updateCanvasBackground(color) {
  state.backgroundColor = color;
  designCanvas.style.backgroundColor = color;
  designCanvas.style.backgroundImage = 'linear-gradient(var(--grid-dark) 1px, transparent 1px), linear-gradient(90deg, var(--grid-dark) 1px, transparent 1px), linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
  designCanvas.style.backgroundBlendMode = 'normal';
}

function addObject(type, extra = {}) {
  const object = {
    id: objectIdCounter++,
    type,
    x: 220,
    y: 170,
    width: 180,
    height: 120,
    fill: '#8b5cf6',
    stroke: '#111827',
    strokeWidth: 2,
    fontSize: 42,
    fontFamily: 'Inter, sans-serif',
    text: 'Your text',
    opacity: 1,
    rotation: 0,
    filter: 'none',
    src: '',
    name: type,
    ...extra,
  };

  recordState();
  state.objects.push(object);
  selectedId = object.id;
  renderCanvas();
  renderProperties();
  renderLayers();
}

function createShapeElement(obj) {
  const el = document.createElement('div');
  el.className = `design-object ${obj.type}`;
  el.dataset.id = String(obj.id);
  el.style.left = `${obj.x}px`;
  el.style.top = `${obj.y}px`;
  el.style.width = `${obj.width}px`;
  el.style.height = `${obj.height}px`;
  el.style.opacity = obj.opacity;
  el.style.transform = `rotate(${obj.rotation}deg)`;
  el.style.filter = obj.filter;

  if (obj.type === 'rectangle' || obj.type === 'ellipse' || obj.type === 'triangle') {
    el.style.background = obj.fill;
    el.style.border = `${obj.strokeWidth || 2}px solid ${obj.stroke || '#111827'}`;
    el.style.borderRadius = obj.type === 'ellipse' ? '50%' : obj.type === 'rectangle' ? '18px' : '0';
    if (obj.type === 'triangle') {
      el.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
      el.style.border = `${obj.strokeWidth || 2}px solid ${obj.stroke || '#111827'}`;
      el.style.borderRadius = '0';
    }
  }

  if (obj.type === 'text') {
    el.classList.add('text');
    el.style.fontSize = `${obj.fontSize}px`;
    el.style.color = obj.fill;
    el.style.border = 'none';
    el.style.background = 'transparent';
    el.style.fontWeight = '700';
    el.style.lineHeight = '1.2';
    el.style.fontFamily = obj.fontFamily || 'Inter, sans-serif';
    el.textContent = obj.text;
  }

  if (obj.type === 'image') {
    el.classList.add('image');
    el.style.border = 'none';
    const img = document.createElement('img');
    img.src = obj.src;
    img.alt = obj.name;
    el.appendChild(img);
  }

  const isSelected = selectedId === obj.id;
  if (isSelected) el.classList.add('selected');

  const handle = document.createElement('div');
  handle.className = 'resize-handle';
  handle.style.display = isSelected ? 'block' : 'none';
  el.appendChild(handle);

  el.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    selectObject(obj.id);
    const isResize = event.target.classList.contains('resize-handle');

    dragState = {
      id: obj.id,
      mode: isResize ? 'resize' : 'drag',
      startX: event.clientX,
      startY: event.clientY,
      original: { ...obj },
    };
  });

  return el;
}

function renderCanvas() {
  designCanvas.innerHTML = '';
  designCanvas.style.backgroundColor = state.backgroundColor;
  const layers = [...state.objects].reverse();

  layers.forEach((obj) => {
    const el = createShapeElement(obj);
    designCanvas.appendChild(el);
  });

  if (!getSelectedObject()) {
    propertyPanel.innerHTML = '<p class="empty-state">Select an object to edit</p>';
  }
}

function updatePropertyControls() {
  const obj = getSelectedObject();
  if (!obj) return;
  fillColorInput.value = obj.fill || '#8b5cf6';
  strokeColorInput.value = obj.stroke || '#111827';
}

function renderProperties() {
  const obj = getSelectedObject();
  if (!obj) {
    propertyPanel.innerHTML = '<p class="empty-state">Select an object to edit</p>';
    return;
  }

  const isText = obj.type === 'text';
  const isShape = obj.type === 'rectangle' || obj.type === 'ellipse' || obj.type === 'triangle';

  propertyPanel.innerHTML = `
    <div class="control-group">
      <label>Position X</label>
      <input type="number" data-prop="x" value="${Math.round(obj.x)}" />
    </div>
    <div class="control-group">
      <label>Position Y</label>
      <input type="number" data-prop="y" value="${Math.round(obj.y)}" />
    </div>
    <div class="control-group">
      <label>Width</label>
      <input type="number" data-prop="width" value="${Math.round(obj.width)}" />
    </div>
    <div class="control-group">
      <label>Height</label>
      <input type="number" data-prop="height" value="${Math.round(obj.height)}" />
    </div>
    <div class="control-group">
      <label>Rotation</label>
      <input type="range" min="0" max="360" data-prop="rotation" value="${obj.rotation}" />
    </div>
    ${isShape ? `
      <div class="control-group">
        <label>Fill</label>
        <input type="color" data-prop="fill" value="${obj.fill}" />
      </div>
      <div class="control-group">
        <label>Stroke</label>
        <input type="color" data-prop="stroke" value="${obj.stroke}" />
      </div>
      <div class="control-group">
        <label>Stroke width</label>
        <input type="number" min="0" max="20" data-prop="strokeWidth" value="${obj.strokeWidth || 2}" />
      </div>
    ` : ''}
    ${isText ? `
      <div class="control-group">
        <label>Text</label>
        <textarea rows="3" data-prop="text">${obj.text}</textarea>
      </div>
      <div class="control-group">
        <label>Font family</label>
        <select data-prop="fontFamily">
          <option value="Inter, sans-serif" ${obj.fontFamily === 'Inter, sans-serif' ? 'selected' : ''}>Inter</option>
          <option value="Georgia, serif" ${obj.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
          <option value="Courier New, monospace" ${obj.fontFamily === 'Courier New, monospace' ? 'selected' : ''}>Mono</option>
        </select>
      </div>
      <div class="control-group">
        <label>Font size</label>
        <input type="number" data-prop="fontSize" value="${obj.fontSize}" />
      </div>
      <div class="control-group">
        <label>Text color</label>
        <input type="color" data-prop="fill" value="${obj.fill}" />
      </div>
    ` : ''}
    <div class="control-group">
      <label>Opacity</label>
      <input type="range" min="0.1" max="1" step="0.05" data-prop="opacity" value="${obj.opacity}" />
    </div>
    <div class="control-group">
      <label>Filter</label>
      <select data-prop="filter">
        <option value="none" ${obj.filter === 'none' ? 'selected' : ''}>None</option>
        <option value="grayscale(100%)" ${obj.filter === 'grayscale(100%)' ? 'selected' : ''}>Grayscale</option>
        <option value="brightness(1.5)" ${obj.filter === 'brightness(1.5)' ? 'selected' : ''}>Bright</option>
        <option value="contrast(1.6)" ${obj.filter === 'contrast(1.6)' ? 'selected' : ''}>Contrast</option>
        <option value="sepia(100%)" ${obj.filter === 'sepia(100%)' ? 'selected' : ''}>Sepia</option>
      </select>
    </div>
  `;

  propertyPanel.querySelectorAll('input, select, textarea').forEach((input) => {
    input.addEventListener('input', (event) => {
      const property = event.target.dataset.prop;
      const current = getSelectedObject();
      if (!current) return;
      const value = event.target.type === 'number' || event.target.type === 'range' ? Number(event.target.value) : event.target.value;
      current[property] = value;
      renderCanvas();
      renderLayers();
      updatePropertyControls();
    });
  });

  updatePropertyControls();
}

function renderLayers() {
  layerList.innerHTML = '';
  const layers = [...state.objects].reverse();

  layers.forEach((obj) => {
    const item = document.createElement('div');
    item.className = `layer-item ${selectedId === obj.id ? 'active' : ''}`;
    item.innerHTML = `
      <span>${obj.type}</span>
      <div class="layer-actions">
        <button data-action="up" type="button">↑</button>
        <button data-action="down" type="button">↓</button>
      </div>
    `;

    item.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      selectObject(obj.id);
    });

    item.querySelector('[data-action="up"]').addEventListener('click', (event) => {
      event.stopPropagation();
      moveLayer(obj.id, 1);
    });

    item.querySelector('[data-action="down"]').addEventListener('click', (event) => {
      event.stopPropagation();
      moveLayer(obj.id, -1);
    });

    layerList.appendChild(item);
  });
}

function moveLayer(id, direction) {
  const index = state.objects.findIndex((obj) => obj.id === id);
  if (index === -1) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= state.objects.length) return;
  recordState();
  [state.objects[index], state.objects[targetIndex]] = [state.objects[targetIndex], state.objects[index]];
  renderCanvas();
  renderLayers();
}

function duplicateSelected() {
  const obj = getSelectedObject();
  if (!obj) return;
  recordState();
  const clone = { ...obj, id: objectIdCounter++, x: obj.x + 20, y: obj.y + 20 };
  state.objects.push(clone);
  selectedId = clone.id;
  renderCanvas();
  renderProperties();
  renderLayers();
}

function deleteSelected() {
  if (!selectedId) return;
  recordState();
  state.objects = state.objects.filter((obj) => obj.id !== selectedId);
  selectedId = null;
  renderCanvas();
  renderProperties();
  renderLayers();
}

function alignSelected(type) {
  const obj = getSelectedObject();
  if (!obj) return;
  recordState();

  if (type === 'left') obj.x = 40;
  if (type === 'center') obj.x = (700 - obj.width) / 2;
  if (type === 'right') obj.x = 700 - obj.width - 40;

  renderCanvas();
  renderProperties();
}

function bringToFront() {
  const obj = getSelectedObject();
  if (!obj) return;
  recordState();
  const index = state.objects.findIndex((item) => item.id === obj.id);
  if (index !== -1) {
    state.objects.splice(index, 1);
    state.objects.push(obj);
  }
  renderCanvas();
  renderLayers();
}

function sendToBack() {
  const obj = getSelectedObject();
  if (!obj) return;
  recordState();
  const index = state.objects.findIndex((item) => item.id === obj.id);
  if (index !== -1) {
    state.objects.splice(index, 1);
    state.objects.unshift(obj);
  }
  renderCanvas();
  renderLayers();
}

function createTemplateObjects(template) {
  const objects = [];

  const background = {
    id: objectIdCounter++,
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 700,
    height: 700,
    fill: template.accent,
    stroke: '#ffffff',
    strokeWidth: 0,
    opacity: 1,
    rotation: 0,
    filter: 'none',
  };
  objects.push(background);

  const glow = {
    id: objectIdCounter++,
    type: 'ellipse',
    x: 100,
    y: 100,
    width: 500,
    height: 500,
    fill: 'rgba(255,255,255,0.18)',
    stroke: 'rgba(255,255,255,0.4)',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    filter: 'none',
  };
  objects.push(glow);

  const heading = {
    id: objectIdCounter++,
    type: 'text',
    x: 82,
    y: 120,
    width: 540,
    height: 120,
    fill: '#ffffff',
    text: template.title,
    fontSize: 42,
    fontFamily: 'Inter, sans-serif',
    opacity: 1,
    rotation: 0,
    filter: 'none',
  };
  objects.push(heading);

  const subtitle = {
    id: objectIdCounter++,
    type: 'text',
    x: 82,
    y: 220,
    width: 500,
    height: 80,
    fill: 'rgba(255,255,255,0.9)',
    text: template.subtitle,
    fontSize: 22,
    fontFamily: 'Inter, sans-serif',
    opacity: 1,
    rotation: 0,
    filter: 'none',
  };
  objects.push(subtitle);

  const badge = {
    id: objectIdCounter++,
    type: 'rectangle',
    x: 82,
    y: 500,
    width: 180,
    height: 50,
    fill: '#ffffff',
    stroke: '#ffffff',
    strokeWidth: 0,
    opacity: 1,
    rotation: 0,
    filter: 'none',
  };
  objects.push(badge);

  const badgeText = {
    id: objectIdCounter++,
    type: 'text',
    x: 112,
    y: 510,
    width: 140,
    height: 30,
    fill: '#7c3aed',
    text: 'Template',
    fontSize: 20,
    fontFamily: 'Inter, sans-serif',
    opacity: 1,
    rotation: 0,
    filter: 'none',
  };
  objects.push(badgeText);

  return objects;
}

function renderTemplates() {
  templateCount.textContent = `${templateCatalog.length}`;
  templateLibrary.innerHTML = templateCatalog.map((template) => `
    <button class="template-card" data-template="${template.id}" type="button">
      <div class="mini-preview" style="background:${template.preview}"></div>
      <strong>${template.name}</strong>
      <span>${template.category}</span>
    </button>
  `).join('');

  templateLibrary.querySelectorAll('.template-card').forEach((card) => {
    card.addEventListener('click', () => {
      const template = templateCatalog.find((item) => item.id === card.dataset.template);
      if (!template) return;
      state.objects = createTemplateObjects(template);
      selectedId = state.objects[state.objects.length - 1].id;
      renderCanvas();
      renderProperties();
      renderLayers();
    });
  });
}

function renderFilters() {
  filterCount.textContent = `${filterCatalog.length}`;
  const searchTerm = filterSearch.value.trim().toLowerCase();
  const visible = filterCatalog.filter((item) => item.name.toLowerCase().includes(searchTerm));

  filterLibrary.innerHTML = visible.slice(0, 30).map((filter) => `
    <button class="filter-pill" data-filter="${filter.css}" type="button">
      <span>${filter.name}</span>
      <span class="filter-swatch" style="background:${filter.accent}; filter:${filter.css};"></span>
    </button>
  `).join('');

  filterLibrary.querySelectorAll('.filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const obj = getSelectedObject();
      if (!obj) return;
      recordState();
      obj.filter = pill.dataset.filter;
      renderCanvas();
      renderProperties();
    });
  });
}

function resetProject() {
  state.objects = [];
  selectedId = null;
  updateCanvasBackground('#fffaf5');
  canvasBackgroundInput.value = '#fffaf5';
  renderCanvas();
  renderLayers();
  renderProperties();
}

function handleCanvasPointerMove(event) {
  if (!dragState) return;

  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;
  const obj = state.objects.find((item) => item.id === dragState.id);
  if (!obj) return;

  if (dragState.mode === 'drag') {
    obj.x = dragState.original.x + dx / zoom;
    obj.y = dragState.original.y + dy / zoom;
  } else {
    obj.width = Math.max(30, dragState.original.width + dx / zoom);
    obj.height = Math.max(30, dragState.original.height + dy / zoom);
  }

  renderCanvas();
  renderProperties();
  renderLayers();
}

function handleCanvasPointerUp() {
  if (dragState) {
    recordState();
  }
  dragState = null;
}

function addShapeByTool(x = 220, y = 170) {
  if (selectedTool === 'rectangle') addObject('rectangle', { x, y, width: 180, height: 120, fill: fillColorInput.value || '#8b5cf6', stroke: strokeColorInput.value || '#111827', strokeWidth: 2 });
  if (selectedTool === 'ellipse') addObject('ellipse', { x, y, width: 180, height: 140, fill: fillColorInput.value || '#f97316', stroke: strokeColorInput.value || '#111827', strokeWidth: 2 });
  if (selectedTool === 'triangle') addObject('triangle', { x, y, width: 180, height: 160, fill: fillColorInput.value || '#22c55e', stroke: strokeColorInput.value || '#111827', strokeWidth: 2 });
  if (selectedTool === 'text') addObject('text', { x, y, width: 200, height: 80, fill: fillColorInput.value || '#0f172a', text: 'New text', fontSize: 42, fontFamily: 'Inter, sans-serif' });
}

designCanvas.addEventListener('pointerdown', (event) => {
  if (event.target !== designCanvas) return;
  if (selectedTool === 'select') {
    selectedId = null;
    renderCanvas();
    renderProperties();
    renderLayers();
    return;
  }

  const rect = designCanvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / zoom;
  const y = (event.clientY - rect.top) / zoom;
  addShapeByTool(x, y);
  setTool('select');
});

document.addEventListener('pointermove', handleCanvasPointerMove);
document.addEventListener('pointerup', handleCanvasPointerUp);

imageUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      recordState();
      const width = Math.min(260, image.width);
      const height = Math.min(220, image.height);
      addObject('image', { x: 240, y: 180, width, height, src: reader.result, name: file.name });
    };
    image.src = reader.result;
  };

  reader.readAsDataURL(file);
});

fillColorInput.addEventListener('input', (event) => {
  const obj = getSelectedObject();
  if (!obj) return;
  recordState();
  obj.fill = event.target.value;
  renderCanvas();
  renderProperties();
});

strokeColorInput.addEventListener('input', (event) => {
  const obj = getSelectedObject();
  if (!obj) return;
  recordState();
  obj.stroke = event.target.value;
  renderCanvas();
  renderProperties();
});

canvasBackgroundInput.addEventListener('input', (event) => {
  updateCanvasBackground(event.target.value);
});

swatches.forEach((swatch) => {
  swatch.addEventListener('click', () => {
    const color = swatch.dataset.color;
    fillColorInput.value = color;
    const obj = getSelectedObject();
    if (obj) {
      recordState();
      obj.fill = color;
      renderCanvas();
      renderProperties();
    }
    swatches.forEach((button) => button.classList.toggle('active', button === swatch));
  });
});

alignLeftBtn.addEventListener('click', () => alignSelected('left'));
alignCenterBtn.addEventListener('click', () => alignSelected('center'));
alignRightBtn.addEventListener('click', () => alignSelected('right'));
bringFrontBtn.addEventListener('click', bringToFront);
sendBackBtn.addEventListener('click', sendToBack);

newProjectBtn.addEventListener('click', () => {
  resetProject();
  const defaultTemplate = templateCatalog[0];
  state.objects = createTemplateObjects(defaultTemplate);
  selectedId = state.objects[state.objects.length - 1].id;
  renderCanvas();
  renderProperties();
  renderLayers();
});

filterSearch.addEventListener('input', renderFilters);

undoBtn.addEventListener('click', undoAction);
redoBtn.addEventListener('click', redoAction);
duplicateBtn.addEventListener('click', duplicateSelected);
deleteBtn.addEventListener('click', deleteSelected);

toolButtons.forEach((button) => {
  button.addEventListener('click', () => setTool(button.dataset.tool));
});

zoomInBtn.addEventListener('click', () => {
  zoom = Math.min(2, Number((zoom + 0.1).toFixed(2)));
  designCanvas.style.transform = `scale(${zoom})`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
});

zoomOutBtn.addEventListener('click', () => {
  zoom = Math.max(0.5, Number((zoom - 0.1).toFixed(2)));
  designCanvas.style.transform = `scale(${zoom})`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
});

downloadBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  const width = 1200;
  const height = 800;
  exportCanvas.width = width;
  exportCanvas.height = height;

  const ctx = exportCanvas.getContext('2d');
  ctx.fillStyle = state.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  state.objects.forEach((obj) => {
    ctx.save();
    ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
    ctx.rotate((obj.rotation * Math.PI) / 180);
    ctx.globalAlpha = obj.opacity;
    ctx.filter = obj.filter || 'none';

    if (obj.type === 'rectangle') {
      ctx.fillStyle = obj.fill;
      ctx.strokeStyle = obj.stroke || '#111827';
      ctx.lineWidth = obj.strokeWidth || 2;
      ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
      ctx.strokeRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
    }

    if (obj.type === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(0, 0, obj.width / 2, obj.height / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = obj.fill;
      ctx.lineWidth = obj.strokeWidth || 2;
      ctx.strokeStyle = obj.stroke || '#111827';
      ctx.fill();
      ctx.stroke();
    }

    if (obj.type === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -obj.height / 2);
      ctx.lineTo(-obj.width / 2, obj.height / 2);
      ctx.lineTo(obj.width / 2, obj.height / 2);
      ctx.closePath();
      ctx.fillStyle = obj.fill;
      ctx.lineWidth = obj.strokeWidth || 2;
      ctx.strokeStyle = obj.stroke || '#111827';
      ctx.fill();
      ctx.stroke();
    }

    if (obj.type === 'text') {
      ctx.font = `${obj.fontWeight || 700} ${obj.fontSize}px ${obj.fontFamily || 'Inter, sans-serif'}`;
      ctx.fillStyle = obj.fill;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obj.text, 0, 0);
    }

    if (obj.type === 'image') {
      const img = new Image();
      img.src = obj.src;
      if (obj.src) ctx.drawImage(img, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
    }

    ctx.restore();
  });

  const link = document.createElement('a');
  link.href = exportCanvas.toDataURL('image/png');
  link.download = 'pixelforge-design.png';
  link.click();
});

setTool('select');
updateCanvasBackground(state.backgroundColor);
renderTemplates();
renderFilters();
newProjectBtn.click();
updateHistoryButtons();
