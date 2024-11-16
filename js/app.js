/* 全局变量 */
/// 属性面板
// 图层
let layers = []; 
let currentLayerIndex = 0;

/// 主绘图区
let isDrawing = false;
let lastX = 0;
let lastY = 0;

/// 工具栏
let currentTool = 'brush'; // 笔刷/橡皮擦
let undoStack = []; // 撤回
let redoStack = []; // 重做

// 初始化
window.onload = function() {
    initializeCanvas();
    setupEventListeners();
    addLayer(); // 添加第一个图层
    updateLayerSelector();
    setupToolListeners();
};

// 初始化画布
function initializeCanvas() {
    const container = document.getElementById('layerContainer');
    container.style.width = '800px';
    container.style.height = '600px';
}

// 添加新图层
function addLayer() {
    const container = document.getElementById('layerContainer');
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    layers.push({
        canvas: canvas,
        ctx: ctx,
        visible: true
    });
    
    container.appendChild(canvas);
    currentLayerIndex = layers.length - 1;
    updateLayerSelector();
}

// 更新图层选择器
function updateLayerSelector() {
    const selector = document.getElementById('layerSelector');
    selector.innerHTML = '';
    layers.forEach((layer, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = `图层 ${index + 1}`;
        selector.appendChild(option);
    });
    selector.value = currentLayerIndex;
}

// 设置工具监听器
function setupToolListeners() {
    document.getElementById('brushTool').addEventListener('click', () => {
        currentTool = 'brush';
    });
    document.getElementById('eraserTool').addEventListener('click', () => {
        currentTool = 'eraser';
    })
}

// 设置事件监听器
function setupEventListeners() {
    const container = document.getElementById('layerContainer');

    // 鼠标事件
    container.addEventListener('mousedown', startDrawing);
    container.addEventListener('mousemove', draw);
    container.addEventListener('mouseup', stopDrawing);
    container.addEventListener('mouseout', stopDrawing);

    // 触摸和电容笔事件
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);
    container.addEventListener("touchend", stopDrawing);
    container.addEventListener("touchcancel", stopDrawing);

    // 指针事件
    container.addEventListener("pointerdown", handlePointerStart);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", stopDrawing);
    container.addEventListener("pointerout", stopDrawing);

    // 图层事件
    document.getElementById('addLayer').addEventListener('click', addLayer);
    document.getElementById('layerSelector').addEventListener('change', (e) => {
        currentLayerIndex = parseInt(e.target.value);
    });
    
    // 撤销和重做事件
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);
}

// 开始绘画
function startDrawing(e) {
    const rect = e.target.getBoundingClientRect();
    startDrawingAt(e.clientX - rect.left, e.clientY - rect.top);
}

// 绘画
function draw(e) {
    const rect = e.target.getBoundingClientRect();
    drawAt(e.clientX - rect.left, e.clientY - rect.top);
}

// 停止绘画
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveState();
    }
}

// 处理触摸开始
function handleTouchStart(e) {
    e.preventDefault(); // 防止页面滚动
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    startDrawingAt(touch.clientX - rect.left, touch.clientY - rect.top);
}

// 处理触摸移动
function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    startDrawingAt(touch.clientX - rect.left, touch.clientY - rect.top);
}

// 处理电容笔开始
function handlePointerStart(e) {
    if (e.pointerType === 'pen') {
        e.preventDefault();
        const rect = e.target.getBoundingClientRect();
        startDrawingAt(e.clientX - rect.left, e.clientY - rect.top, e.pressure);
    }
}

// 处理电容笔移动
function handlePointerMove(e) {
    if (e.pointerType === 'pen') {
        e.preventDefault();
        const rect = e.target.getBoundingClientRect();
        drawAt(e.clientX - rect.left, e.clientY - rect.top, e.pressure);
    }
}

// 统一的开始绘画函数
function startDrawingAt(x, y, pressure = 1) {
    isDrawing = true;
    lastX = x;
    lastY = y;
}

// 统一的绘画函数
function drawAt(x, y, pressure = 1) {
    if(!isDrawing) return;

    const ctx = layers[currentLayerIndex].ctx;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);

    // 设置笔刷属性
    if (currentTool === 'brush') {
        ctx.strokeStyle = document.getElementById('colorPicker').value;
    } else if (currentTool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
    }

    // ------------根据压感调整笔刷大小！！！------------------
    let baseBrushSize = parseInt(document.getElementById('brushSize').value);
    ctx.lineWidth = baseBrushSize * pressure;
    
    // 绘制线条
    ctx.lineTo(x, y);
    ctx.stroke();
    
    lastX = x;
    lastY = y;

}

// 保存状态
function saveState() {
    const state = layers.map(layer => layer.canvas.toDataURL());
    undoStack.push(state);
    redoStack = []; // 清空重做栈
}

// 撤销
function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        loadState(undoStack[undoStack.length - 1]);
    }
}

// 重做
function redo() {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(state);
        loadState(state);
    }
}

// 加载状态
function loadState(state) {
    state.forEach((dataUrl, index) => {
        if (index >= layers.length) {
            addLayer();
        }
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const ctx = layers[index].ctx;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    });
}

// 文件操作函数
function newFile() {
    layers.forEach(layer => {
        layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    });
    undoStack = [];
    redoStack = [];
    saveState();
}

function saveFile() {
    const link = document.createElement('a');
    link.download = 'artwork.png';
    
    // 合并所有图层
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 800;
    finalCanvas.height = 600;
    const finalCtx = finalCanvas.getContext('2d');
    
    layers.forEach(layer => {
        if (layer.visible) {
            finalCtx.drawImage(layer.canvas, 0, 0);
        }
    });
    
    link.href = finalCanvas.toDataURL();
    link.click();
}

function openFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const ctx = layers[currentLayerIndex].ctx;
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.drawImage(img, 0, 0);
                saveState();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function showHelp() {
    alert('ArtCanva使用帮助：\n\n' +
          '1. 使用左侧工具栏选择绘画工具\n' +
          '2. 在右侧面板调整笔刷属性\n' +
          '3. 使用图层功能创建复杂作品\n' +
          '4. 可以随时保存或撤销操作');
}

// 触摸或电容笔事件支持
