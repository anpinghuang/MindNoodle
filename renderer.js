// fixed temporary line not following cursor due to scaling bug; changed x => e.clientX (scaled coordinate => actual world coordinate) 
// fixed orthogonal line not drawing perfectly by setting offset to 0. offset is the distance between post-it and line
// pre-made themes in settings: Grid Line Color, Post-It Block Color, Connection Line Color, Background Color
// updated const settings = {} and drawgrid with new values for this setting
// individual post-it colors are still customizable. overall settings set a post-it color for all. post-it sets to node.color and all node.color set to settings.postItColor if changed
// removed outline for images so transparent PNGs don't have outlines

const canvas = document.getElementById('mindmap');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Data structures
let nodes = [];
let connections = [];
let isDragging = false;
let dragTarget = null;

const BASE_FONT_SIZE = 16; // Base font size in pixels


// Panning and zooming state
let offsetX = 0;
let offsetY = 0;
let scale = 1;

// Define minimum and maximum scale limits
const MIN_SCALE = 0.2;
const MAX_SCALE = 10;

// Define zoom sensitivity
const ZOOM_SENSITIVITY = 0.002; // Adjust this value for faster or slower zooming

// Thresholds and sensitivity settings
const DISTANCE_THRESHOLD = 10; // Minimum change in distance to detect pinch
const MOVE_THRESHOLD = 10; // Minimum movement to consider for panning

let startX = 0;
let startY = 0;


// Mouse event handlers
let isMousePanning = false;
let mouseStartX, mouseStartY;

// Touch event handling
let initialTouchData = {
    distance: 0,
    midpoint: { x: 0, y: 0 },
    touch1Start: { x: 0, y: 0 },
    touch2Start: { x: 0, y: 0 },
};

// undo & redo
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50; // Limit history size

const resizeHandleSize = 10;


let isConnecting = false;
let connectionStart = null;
let connectionEnd = null;
let hoveredCircle = null; // Tracks the circle currently hovered by the mouse


// multiple selections
let selectedNodes = []; // Array to hold selected nodes
let selectedConnections = []; // Array to hold selected connections


let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionEnd = { x: 0, y: 0 };

// images
const MAX_IMAGE_WIDTH = 500;
const MAX_IMAGE_HEIGHT = 500;
const imageCache = {};


let isPanning = false;

let activePointers = new Set(); // To track active pointers
let isTwoFingerPanning = false;

let pickr;

// Initialize Pickr after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    pickr = Pickr.create({
        el: '#pickr-button',
        theme: 'classic', // Available themes: 'classic', 'monolith', 'nano'

        default: '#FFFF00', // Default color (yellow)

        swatches: [
            'rgba(244, 67, 54, 1)',
            'rgba(233, 30, 99, 0.95)',
            'rgba(156, 39, 176, 0.9)',
            'rgba(103, 58, 183, 0.85)',
            'rgba(63, 81, 181, 0.8)',
            'rgba(33, 150, 243, 0.75)',
            'rgba(3, 169, 244, 0.7)',
            'rgba(0, 188, 212, 0.7)',
            'rgba(0, 150, 136, 0.75)',
            'rgba(76, 175, 80, 0.8)',
            'rgba(139, 195, 74, 0.85)',
            'rgba(205, 220, 57, 0.9)',
            'rgba(255, 235, 59, 0.95)',
            'rgba(255, 193, 7, 1)'
        ],

        components: {
            // Main components
            preview: true,
            opacity: true, // Enables alpha slider
            hue: true,

            // Input / output Options
            interaction: {
                hex: true,
                rgba: true,
                hsla: true,
                hsva: true,
                cmyk: true,
                input: true,
                clear: true,
                save: true
            }
        }
    });

    // Function to convert RGB/RGBA to HEX
    function rgbToHex(rgb) {
        // Handle both HEX and RGB inputs
        if (rgb.startsWith('#')) {
            return rgb;
        }

        const sep = rgb.indexOf(',') > -1 ? ',' : ' ';
        const rgbArr = rgb.substr(4).split(')')[0].split(sep);

        let r = (+rgbArr[0]).toString(16).padStart(2, '0');
        let g = (+rgbArr[1]).toString(16).padStart(2, '0');
        let b = (+rgbArr[2]).toString(16).padStart(2, '0');
        let a = rgbArr.length === 4 ? Math.round(parseFloat(rgbArr[3]) * 255).toString(16).padStart(2, '0') : '';

        return `#${r}${g}${b}${a}`;
    }

    // Function to extract alpha from RGBA
    function getAlpha(color) {
        if (color.startsWith('rgba')) {
            const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([0-9.]*)\)/);
            if (rgba && rgba[4]) {
                return rgba[4];
            }
        }
        return 1;
    }
    

    // Listen to Pickr's save event to update node color
    pickr.on('save', (color, instance) => {
        if (selectedNodes.length === 1) {
            const node = selectedNodes[0];
            const rgbaColor = color.toRGBA().toString(); // e.g., 'rgba(255, 0, 0, 0.5)'
            node.color = rgbaColor;
            drawMap();
            // updateColorDisplay(); // don't do this  (lag)
        }
        pickr.hide();
    });

    // Optionally, listen to Pickr's change event for real-time updates
    pickr.on('change', (color, instance) => {
        if (selectedNodes.length === 1) {
            const node = selectedNodes[0];
            const rgbaColor = color.toRGBA().toString();
            node.color = rgbaColor;
            drawMap();
            // updateColorDisplay(); // don't do this (lag)
        }
    });
});

// Define settings object
let settings = {
    connectionRouting: 'bezier', // Existing setting
    gridSize: 50,                // Default grid size in pixels
    backgroundColor: '#ffffff',   // Default background color (white)
    gridLineColor: '#e0e0e0',          // Default grid line color
    postItColor: 'rgba(255, 255, 0, 1)', // Default post-it color
    connectionLineColor: '#000000'     // Default connection line color
};


// Function to apply settings
function applySettings() {
    // Redraw the map with the current settings
    console.log("settings applied");
    drawMap();
    
}

// Listen for 'settings-changed' from main process
electronAPI.onSettingsChanged((newSettings) => {
    // Update global settings
    settings = { ...settings, ...newSettings };

    // Apply global post-it color to all post-it nodes
    if (newSettings.postItColor) {
        nodes.forEach(node => {
            if (node.type === 'post-it') {
                node.color = newSettings.postItColor;
            }
        });
    }
    // Apply other settings as needed
    applySettings();
    drawMap();
});

// Listen for 'send-current-settings' from main process and respond with 'current-settings'
electronAPI.onRequestCurrentSettings(() => {
    electronAPI.sendCurrentSettings(settings);
});

// Request current settings when the renderer loads
electronAPI.requestSettings();

function updateColorDisplay() {
    if (selectedNodes.length === 1) {
        const node = selectedNodes[0];
        const colorInput = node.color;
        
        const tc = tinycolor(colorInput);
        if (tc.isValid()) {
            // Convert to RGBA string
            const rgbaString = tc.toRgbString(); // e.g., 'rgba(255, 87, 51, 0.5)'
            // Set Pickr's color
            pickr.setColor(rgbaString);
        } else {
            console.warn(`Invalid color format: ${colorInput}`);
            // Optionally, reset Pickr and color display to default
            pickr.setColor('#FFFF00'); // Default yellow
        }
    }
}

// Function to show the loading indicator
function showLoadingIndicator() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

// Function to hide the loading indicator
function hideLoadingIndicator() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Listen for 'mindmap-data' event from main process
electronAPI.onMindmapData((mindmapData) => {
    console.log('Mindmap data received:', mindmapData);
    hideLoadingIndicator(); // Hide loading indicator when data is received
    loadMindmapData(mindmapData);
});

// Listen for 'mindmap-error' event from main process
electronAPI.onMindmapError((errorMessage) => {
    hideLoadingIndicator(); // Hide loading indicator on error
    alert(errorMessage); // Replace with a custom UI notification if preferred
});

// Listen for 'open-mindmap' event to initiate loading
electronAPI.onOpenMindmap((filePath) => {
    console.log(`Opening mindmap file: ${filePath}`);
    showLoadingIndicator(); // Show loading indicator when loading starts
    // The main process will handle reading the file and sending 'mindmap-data' or 'mindmap-error' events
    // No further action needed here
});

// Function to load mindmap data into the app
function loadMindmapData(mindmapData) {
    nodes = mindmapData.nodes || [];
    connections = mindmapData.connections || [];
    offsetX = mindmapData.offsetX || 0;
    offsetY = mindmapData.offsetY || 0;
    scale = mindmapData.scale || 1;
    settings = mindmapData.settings || { connectionRouting: 'bezier' };

    // Preload images if any
    nodes.forEach(node => {
        if (node.type === 'image' && node.imageData) {
            const img = new Image();
            img.src = `data:image/png;base64,${node.imageData}`;
            imageCache[node.id] = img;
        }
    });

    applySettings();
    drawMap();

    console.log('Mindmap loaded successfully.');
}

// Utility Functions (Ensure no duplicates)
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return regex ? {
        r: parseInt(regex[1], 16),
        g: parseInt(regex[2], 16),
        b: parseInt(regex[3], 16)
    } : null;
}

// Function to update node color with alpha (Simplified)
function updateNodeColor(colorHex, alpha) {
    // Convert HEX to RGB
    const rgb = hexToRgb(colorHex);
    if (rgb) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }
    return 'rgba(255, 255, 0, 1)'; // Default yellow
}

// Before any state-changing action (e.g., adding, moving, resizing nodes or connections), call saveState().
function saveState() {
    if (undoStack.length >= MAX_HISTORY) {
        undoStack.shift(); // Remove oldest state
    }
    undoStack.push(JSON.stringify({ nodes, connections, offsetX, offsetY, scale }));
    // Clear redo stack on new action
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) return;
    const currentState = JSON.stringify({ nodes, connections, offsetX, offsetY, scale });
    redoStack.push(currentState);
    const prevState = JSON.parse(undoStack.pop());
    restoreState(prevState);
}

function redo() {
    if (redoStack.length === 0) return;
    const currentState = JSON.stringify({ nodes, connections, offsetX, offsetY, scale });
    undoStack.push(currentState);
    const nextState = JSON.parse(redoStack.pop());
    restoreState(nextState);
}

// function restoreState(state) {
//     nodes = state.nodes;
//     connections = state.connections;
//     offsetX = state.offsetX;
//     offsetY = state.offsetY;
//     scale = state.scale;
//     drawMap();
// }
function restoreState(state) {
    nodes = state.nodes || [];
    connections = state.connections || [];
    offsetX = state.offsetX || 0;
    offsetY = state.offsetY || 0;
    scale = state.scale || 1;
    settings = state.settings || { connectionRouting: 'bezier' };

    // Validate nodes
    nodes.forEach(node => {
        if (node.type === 'image') {
            if (typeof node.width !== 'number' || typeof node.height !== 'number' || node.width <= 0 || node.height <= 0) {
                console.error(`Node ID: ${node.id} has invalid width or height. Setting to default values.`);
                node.width = node.defaultWidth || 100;
                node.height = node.defaultHeight || 100;
            } else {
                console.log(`Loaded image node ID: ${node.id}, Width: ${node.width}, Height: ${node.height}`);
            }
        }
    });

    // Preload image cache
    nodes.forEach(node => {
        if (node.type === 'image' && node.imageData) {
            const img = new Image();
            img.src = `data:image/png;base64,${node.imageData}`;
            imageCache[node.id] = img;
            console.log(`Preloaded image for node ID: ${node.id}`);
        }
    });

    applySettings();
    drawMap();
}


document.addEventListener('keydown', handleKeyDown);
function handleKeyDown(e) {

    // Check if any selected node is in editing mode
    const isEditing = selectedNodes.some(node => node.isEditing);
    if (isEditing) {
        // If editing, do not process global shortcuts
        return;
    }

    // Detect if CTRL or CMD key is pressed (for Mac compatibility)
    const isCtrlPressed = e.ctrlKey || e.metaKey;

    // Handle keyboard shortcuts
    if (isCtrlPressed) {
        switch (e.key.toLowerCase()) {
            case 'z':
                // CTRL+Z: Undo
                undo();
                e.preventDefault(); // prevents default browser actions from this shortcut
                break;
            case 'y':
                // CTRL+Y: Redo
                redo();
                e.preventDefault();
                break;
            case 's':
                // CTRL+S: Save
                saveMap();
                e.preventDefault();
                break;
            case 'o':
                // CTRL+O: Load
                loadMap();
                e.preventDefault();
                break;
            default:
                break;
        }
    }

    // Existing handling for Backspace/Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
        // Remove selected connections
        if (selectedConnections.length > 0) {
            selectedConnections.forEach(conn => {
                connections = connections.filter(c => c !== conn);
                console.log(`Removed connection between node ${conn.source} and node ${conn.target}`);
            });
            selectedConnections = [];
            drawMap();
            e.preventDefault(); // Prevent default backspace behavior (e.g., navigating back)
        }

        // Optionally, remove selected nodes if desired
        if (selectedNodes.length > 0) {
            selectedNodes.forEach(node => {
                // Remove connections associated with the node
                connections = connections.filter(c => c.source !== node.id && c.target !== node.id);
                // Remove the node itself
                nodes = nodes.filter(n => n !== node);
                console.log(`Removed node ID: ${node.id}`);
            });
            selectedNodes = [];
            drawMap();
            e.preventDefault();
        }
    }
}



// This function detects if a user has clicked near any connection line
function findConnectionAtPosition(x, y) {
    const threshold = 5 / scale; // Adjust based on current scale

    for (const connection of connections) {
        if (isPointOnConnection(x, y, connection)) {
            return connection;
        }
    }

    return null;
}




// connection snapping 
// increasing the threshold makes it easier to form temporary line connections by allowing a larger area wround the line to be considered "near" 
function isPointNearLine(px, py, x1, y1, x2, y2, threshold = 20) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) // in case of 0 length line
        param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return (Math.hypot(dx, dy) <= threshold);
}

// make sure connection lines can be selected with selection rect. 
// If line & rect intersect, then selected
function isLineIntersectingRect(x1, y1, x2, y2, rect) {
    // Check if either end of the line is inside the rectangle
    if (isPointInsideRect(x1, y1, rect) || isPointInsideRect(x2, y2, rect)) {
        return true;
    }

    // Check intersection with each side of the rectangle
    // Top
    if (doLinesIntersect(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.width, rect.y)) {
        return true;
    }
    // Bottom
    if (doLinesIntersect(x1, y1, x2, y2, rect.x, rect.y + rect.height, rect.x + rect.width, rect.y + rect.height)) {
        return true;
    }
    // Left
    if (doLinesIntersect(x1, y1, x2, y2, rect.x, rect.y, rect.x, rect.y + rect.height)) {
        return true;
    }
    // Right
    if (doLinesIntersect(x1, y1, x2, y2, rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height)) {
        return true;
    }

    return false;
}

function isPointInsideRect(x, y, rect) {
    return (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
    );
}

// Helper function to determine if two lines (p1->p2 and p3->p4) intersect
function doLinesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Calculate denominators
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false; // Parallel lines

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}




function getEdgeCircles(node) {
    const baseVisibleRadius = 10;          // Base visible size
    const interactiveRadius = 15;          // Larger for easier interaction

    const top = { x: snapToGrid(node.x + node.width / 2), y: snapToGrid(node.y) };
    const bottom = { x: snapToGrid(node.x + node.width / 2), y: snapToGrid(node.y + node.height) };
    const left = { x: snapToGrid(node.x), y: snapToGrid(node.y + node.height / 2) };
    const right = { x: snapToGrid(node.x + node.width), y: snapToGrid(node.y + node.height / 2) };

    return [
        { x: top.x, y: top.y, baseRadius: baseVisibleRadius, currentRadius: baseVisibleRadius, targetRadius: baseVisibleRadius, interactiveRadius, edge: 'top', node},
        { x: bottom.x, y: bottom.y, baseRadius: baseVisibleRadius, currentRadius: baseVisibleRadius, targetRadius: baseVisibleRadius, interactiveRadius, edge: 'bottom', node},
        { x: left.x, y: left.y, baseRadius: baseVisibleRadius, currentRadius: baseVisibleRadius, targetRadius: baseVisibleRadius, interactiveRadius, edge: 'left', node },
        { x: right.x, y: right.y, baseRadius: baseVisibleRadius, currentRadius: baseVisibleRadius, targetRadius: baseVisibleRadius, interactiveRadius, edge: 'right', node},
    ];
}

function handlePointerDown(e) {
    e.preventDefault(); // Prevent default behaviors

    // **1. Handle Image Resizing**
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale - offsetX;
    const mouseY = (e.clientY - rect.top) / scale - offsetY;

    // **Check if clicking on a resize handle of an image node**
    if (selectedNodes.length > 0) {
        const node = selectedNodes[0];
        if (node.type === 'image') { // Only apply to image nodes
            const resizeX = node.x + node.width;
            const resizeY = node.y + node.height;
            const handleRect = {
                x: resizeX - resizeHandleSize,
                y: resizeY - resizeHandleSize,
                width: resizeHandleSize,
                height: resizeHandleSize
            };
            if (
                mouseX >= handleRect.x &&
                mouseX <= handleRect.x + handleRect.width &&
                mouseY >= handleRect.y &&
                mouseY <= handleRect.y + handleRect.height
            ) {
                // **Start Resizing Image Node**
                if (typeof node.width !== 'number' || typeof node.height !== 'number' || node.height === 0) {
                    console.error(`Cannot resize node ID: ${node.id} due to invalid width or height.`);
                    return;
                }
        
                isResizing = true;
                dragTarget = node; // Use dragTarget instead of selectedNode
        
                const aspectRatio = node.width / node.height;
                if (isNaN(aspectRatio) || !isFinite(aspectRatio)) {
                    console.error(`Invalid aspect ratio for node ID: ${node.id}. Setting to 1.`);
                    dragTarget.aspectRatio = 1; // Default aspect ratio
                } else {
                    dragTarget.aspectRatio = aspectRatio; // Store aspect ratio
                    console.log(`Aspect Ratio for node ID: ${node.id} set to ${dragTarget.aspectRatio}`);
                }
        
                saveState(); // Save state before resizing
                console.log(`Started resizing image node ID: ${node.id}`);
                return; // Exit early to prevent other actions
            }
        }
    }


    // connection, selection, pointer code


    activePointers.add(e.pointerId);

    const { x, y } = getMousePosition(e);
    const targetNode = findNodeAtPosition(x, y);

    if (activePointers.size === 2) { // Two-finger gesture detected
        isTwoFingerPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        isPanning = true;
        console.log(`Started two-finger panning at (${startX}, ${startY})`);
        return; // Exit early to prevent other actions
    }

    if (e.button === 1 || isTwoFingerPanning) { // Middle mouse button or two-finger panning
        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        console.log(`Started panning at (${startX}, ${startY})`);
        return; // Exit early to prevent other actions
    }

    if (e.button !== 0) { // Only handle left mouse button
        return;
    }

    // **1. Check if clicking on a connection circle**
    let clickedCircle = null;
    for (const node of nodes) {
        const circles = getEdgeCircles(node);
        for (const circle of circles) {
            const dx = x - circle.x;
            const dy = y - circle.y;
            if (Math.hypot(dx, dy) <= circle.interactiveRadius) {
                clickedCircle = { node, circle };
                break;
            }
        }
        if (clickedCircle) break;
    }

    if (clickedCircle) {
        // **Initiate a new connection from this circle**
        if (selectedNodes.includes(clickedCircle.node)) {
            isConnecting = true;
            connectionStart = clickedCircle;
            connectionEnd = { x: e.clientX, y: e.clientY };
            console.log(`Started connecting from node ID: ${clickedCircle.node.id} (${clickedCircle.circle.edge} edge)`);
            drawMap();
            return; // Exit early after initiating connection
        } else {
            // Optionally, select the node if not already selected
            if (e.shiftKey) {
                // Toggle selection
                const index = selectedNodes.indexOf(clickedCircle.node);
                if (index > -1) {
                    selectedNodes.splice(index, 1);
                } else {
                    selectedNodes.push(clickedCircle.node);
                }
            } else {
                // Single selection
                selectedNodes = [clickedCircle.node];
                selectedConnections = []; // Deselect connections
            }

            isDragging = true;
            dragTarget = clickedCircle.node;
            dragTarget.offsetX = x - dragTarget.x;
            dragTarget.offsetY = y - dragTarget.y;

            saveState();
            console.log(`Selected node ID: ${clickedCircle.node.id}`);
            updateColorDisplay();
            drawMap();
            return; // Exit early after selection
        }
    }

    // **2. If not clicking on a circle, check for connection lines**
    const clickedConnection = findConnectionAtPosition(x, y);
    if (clickedConnection) {
        if (e.shiftKey) {
            // Toggle selection without deselecting others
            if (selectedConnections.includes(clickedConnection)) {
                selectedConnections = selectedConnections.filter(conn => conn !== clickedConnection);
            } else {
                selectedConnections.push(clickedConnection);
            }
        } else {
            // Single selection: deselect others and select the clicked connection
            if (selectedConnections.includes(clickedConnection) && selectedConnections.length === 1) {
                // If already the only selected connection, deselect it
                selectedConnections = [];
            } else {
                selectedConnections = [clickedConnection];
            }
        }
        drawMap();
        return; // Exit early after handling connection selection
    }

    // **3. Proceed with node interactions only if no circle or connection was clicked**
    if (targetNode) {
        // **Only allow connecting if the target node is selected**
        if (selectedNodes.includes(targetNode)) {
            const circles = getEdgeCircles(targetNode);
            const clickedCircle = circles.find(circle => {
                const dx = x - circle.x;
                const dy = y - circle.y;
                return Math.hypot(dx, dy) <= circle.interactiveRadius;
            });

            if (clickedCircle) {
                // Start connecting
                isConnecting = true;
                connectionStart = { node: targetNode, circle: clickedCircle };
                connectionEnd = { x: e.clientX, y: e.clientY };
                console.log(`Started connecting from node ID: ${targetNode.id} (${clickedCircle.edge} edge)`);
            } else if (isNearEdge(x, y, targetNode)) {
                // Begin resizing
                isResizing = true;
                dragTarget = targetNode;
                saveState(); // Save before resizing starts
                console.log(`Started resizing node ID: ${targetNode.id}`);
            } 
            else {
                // Select the node
                if (e.shiftKey) {
                    // Toggle selection
                    const index = selectedNodes.indexOf(targetNode);
                    if (index > -1) {
                        selectedNodes.splice(index, 1);
                    } else {
                        selectedNodes.push(targetNode);
                    }
                } else {
                    // Single selection
                    selectedNodes = [targetNode];
                    selectedConnections = []; // Deselect connections
                }

                isDragging = true;
                dragTarget = targetNode;
                dragTarget.offsetX = x - dragTarget.x;
                dragTarget.offsetY = y - dragTarget.y;

                saveState();
                console.log(`Selected node ID: ${targetNode.id}`);
                updateColorDisplay();
            }
        } else {
            // Select the node
            if (e.shiftKey) {
                // Toggle selection
                const index = selectedNodes.indexOf(targetNode);
                if (index > -1) {
                    selectedNodes.splice(index, 1);
                } else {
                    selectedNodes.push(targetNode);
                }
            } else {
                // Single selection
                selectedNodes = [targetNode];
                selectedConnections = []; // Deselect connections
            }

            isDragging = true;
            dragTarget = targetNode;
            dragTarget.offsetX = x - dragTarget.x;
            dragTarget.offsetY = y - dragTarget.y;

            saveState();
            console.log(`Selected node ID: ${targetNode.id}`);
            updateColorDisplay();
        }
    } else {
        // **Deselect if clicking elsewhere**
        selectedNodes = [];
        selectedConnections = []; // Deselect any selected connections
        isDragging = false; // Ensure no dragging is ongoing
        dragTarget = null;
        console.log(`Started selection at (${e.clientX}, ${e.clientY})`);
        
        // **Start selection rectangle in screen coordinates**
        isSelecting = true;
        selectionStart = { x: e.clientX, y: e.clientY };
        selectionEnd = { x: e.clientX, y: e.clientY };
        console.log(`Started selection at (${e.clientX}, ${e.clientY})`);
    }
    drawMap();
}









function getResizeHandles(node) {
    const handleSize = resizeHandleSize; // Size of the resize handle, not visually
    const handles = [
        { x: node.x + node.width, y: node.y + node.height, interactiveRadius: handleSize }, // Bottom-right
        // Add more handles if needed (e.g., top-left, top-right, bottom-left)
    ];
    return handles;
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Replace all mouse event listeners with pointer event listeners
canvas.addEventListener('pointerdown', handlePointerDown);
// canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointermove', throttle(handlePointerMove, 16)); // ~60fps
canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointercancel', handlePointerCancel);

function handlePointerCancel(e) {
    activePointers.delete(e.pointerId);
    
    if (activePointers.size < 2) {
        isTwoFingerPanning = false;
    }

    if (activePointers.size === 0) {
        isPanning = false;
        isSelecting = false;
        isDragging = false;
        isResizing = false;
        isConnecting = false;
        // isDisconnecting = false;
        dragTarget = null;
        // resizeHandle = null;
        connectionStart = null;
        connectionEnd = null;
        selectionStart = null;
        selectionEnd = null;
    }

    drawMap();
}



let isResizing = false;
function handlePointerMove(e) {
    const { x, y } = getMousePosition(e);

    // panning & selection code
    if (isPanning) {
        // Calculate the movement delta
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;

        // Update offsets for panning
        offsetX += dx;
        offsetY += dy;

        // Update the starting position for the next movement
        startX = e.clientX;
        startY = e.clientY;

        drawMap();
        return; // Skip other mousemove logic while panning
    }

    if (isSelecting) {
        // Update the end point of the selection rectangle
        selectionEnd = { x: e.clientX, y: e.clientY };
        drawMap(); // Redraw to show the selection rectangle
        return; // Skip other mousemove logic while selecting
    }

    let foundHoveredCircle = null;
    let hoveringCircle = false;

    let hoveringResizeHandle = false;
    let hoveringConnection = false;

    // **Check for hovered connection circles only if nodes or connections are selected**
    if (selectedNodes.length > 0 || selectedConnections.length > 0 || isConnecting) {
        for (const node of nodes) {
            const circles = getEdgeCircles(node);
            for (const circle of circles) {
                const dx = x - circle.x;
                const dy = y - circle.y;
                if (Math.hypot(dx, dy) <= circle.interactiveRadius) {
                    foundHoveredCircle = circle;
                    hoveringCircle = true;
                    break;
                }
            }
            if (foundHoveredCircle) break;
        }
    }

    // **Check for hovered connections**
    const hoveredConn = findConnectionAtPosition(x, y);
    if (hoveredConn) {
        hoveringConnection = true;
    }

    // makes sure the handle only changes it its actually touching the handle. prevents confusion
    if (!hoveringCircle && selectedNodes.length > 0) {
        const node = selectedNodes[0]; // Assuming single selection for resizing
        const resizeX = node.x + node.width;
        const resizeY = node.y + node.height;
        const handleRect = {
            x: resizeX - resizeHandleSize,
            y: resizeY - resizeHandleSize,
            width: resizeHandleSize,
            height: resizeHandleSize
        };
        if (
            x >= handleRect.x &&
            x <= handleRect.x + handleRect.width &&
            y >= handleRect.y &&
            y <= handleRect.y + handleRect.height
        ) {
            hoveringResizeHandle = true;
        }
    }


    // Update hoveredCircle reference
    if (foundHoveredCircle !== hoveredCircle) {
        if (hoveredCircle) {
            hoveredCircle.currentRadius = hoveredCircle.baseRadius;
        }
        hoveredCircle = foundHoveredCircle;
        if (hoveredCircle) {
            hoveredCircle.currentRadius = hoveredCircle.baseRadius + 5;
        }
        drawMap();
    }

    // **Update cursor**
    if (isPanning) {
        canvas.style.cursor = 'grabbing'; // Indicate panning
    } else if (hoveringResizeHandle) {
        canvas.style.cursor = 'nwse-resize'; // Double-headed arrow for resizing
    } else if (hoveringConnection) {
        canvas.style.cursor = 'pointer'; // Indicate clickable connections
    } else if (hoveringCircle) {
        canvas.style.cursor = 'pointer'; // Indicate clickable circles
    } else {
        canvas.style.cursor = isDragging ? 'grabbing' : 'default'; // Indicate dragging or default
    }

    if (isResizing && dragTarget) {
        if (dragTarget.type === 'image') {
            // **Resizing Logic for Images (Maintain Aspect Ratio)**
            // Calculate the new width based on mouse position
            let newWidth = x - dragTarget.x;
            // Calculate the new height to maintain aspect ratio
            let newHeight = newWidth / dragTarget.aspectRatio;

            // Enforce minimum and maximum sizes
            // newWidth = Math.max(dragTarget.defaultWidth, newWidth); // Enforce minimum width
            // newWidth = Math.min(newWidth, MAX_IMAGE_WIDTH); // Enforce maximum width
            // newHeight = Math.max(dragTarget.defaultHeight, newHeight); // Enforce minimum height
            // newHeight = Math.min(newHeight, MAX_IMAGE_HEIGHT); // Enforce maximum height
            const MIN_SIZE = 20; // Minimum width and height
            newWidth = Math.max(MIN_SIZE, newWidth); // Enforce minimum width
            newHeight = Math.max(MIN_SIZE, newHeight); // Enforce minimum height

            // Snap width and height to grid
            newWidth = snapToGrid(newWidth);
            newHeight = snapToGrid(newHeight);

            // Debugging logs
            console.log(`Resizing Image Node ID: ${dragTarget.id}`);
            console.log(`Original Width: ${dragTarget.width}, Original Height: ${dragTarget.height}`);
            console.log(`New Width: ${newWidth}, New Height: ${newHeight}`);

            // Update node dimensions
            dragTarget.width = newWidth;
            dragTarget.height = newHeight;

            drawMap();
            return; // Exit early after resizing
        } else if (dragTarget.type === 'post-it') {
            // **Existing Resizing Logic for Post-it-Blocks (Independent Width & Height)**
            const dx = x - dragTarget.x;
            const dy = y - dragTarget.y;

            // min width & height is defined in newNode initially. 
            let newWidth = Math.max(dragTarget.defaultWidth, dx); // Enforce minimum width
            let newHeight = Math.max(dragTarget.defaultHeight, dy); // Enforce minimum height

            // Snap width and height to grid
            newWidth = snapToGrid(newWidth);
            newHeight = snapToGrid(newHeight);

            // Update node dimensions
            dragTarget.width = newWidth;
            dragTarget.height = newHeight;

            drawMap();
            return; // Exit early after resizing
        }
    } else if (isDragging && dragTarget) {
        // Dragging logic with snapping
        const newX = x - dragTarget.offsetX;
        const newY = y - dragTarget.offsetY;
        const snappedPosition = snapToGrid(newX);
        const snappedY = snapToGrid(newY);
        dragTarget.x = snappedPosition;
        dragTarget.y = snappedY;
        drawMap();
    } else if (isConnecting) {
        // Update the end point of the temporary connection
        // client XY:  364 405.20001220703125  normal XY: 417.32300166077084 449.706597883143
        connectionEnd = { x: e.clientX, y: e.clientY }; // e.clientX is the actual position, while x is the scaled position. 
        drawMap();
    }
}



function rectsIntersect(node, rect) {
    return !(
        node.x + node.width < rect.x ||
        node.x > rect.x + rect.width ||
        node.y + node.height < rect.y ||
        node.y > rect.y + rect.height
    );
}

function handlePointerUp(e) {
    activePointers.delete(e.pointerId);
    
    if (activePointers.size < 2) {
        isTwoFingerPanning = false;
    }

    if (e.button === 1) { // Middle mouse button
        isPanning = false;
        console.log('Stopped panning.');
        return; // Exit early as panning has been handled
    }

    if (e.button !== 0) { // Only handle left mouse button
        return;
    }

    if (isSelecting) {
        const rect = {
            x: Math.min(selectionStart.x, selectionEnd.x),
            y: Math.min(selectionStart.y, selectionEnd.y),
            width: Math.abs(selectionEnd.x - selectionStart.x),
            height: Math.abs(selectionEnd.y - selectionStart.y)
        };
    
        // Convert selection rectangle from screen to canvas coordinates
        const normalizedRect = {
            x: rect.x / scale - offsetX,
            y: rect.y / scale - offsetY,
            width: rect.width / scale,
            height: rect.height / scale
        };
    
        // Select nodes within the selection rectangle
        const newlySelectedNodes = nodes.filter(node => (
            node.x >= normalizedRect.x &&
            node.y >= normalizedRect.y &&
            (node.x + node.width) <= (normalizedRect.x + normalizedRect.width) &&
            (node.y + node.height) <= (normalizedRect.y + normalizedRect.height)
        ));
    
        // Select connections within the selection rectangle
        const newlySelectedConnections = connections.filter(connection => {
            const sourceNode = nodes.find(n => n.id === connection.source);
            const targetNode = nodes.find(n => n.id === connection.target);
            if (!sourceNode || !targetNode) return false;
    
            const sourceCircles = getEdgeCircles(sourceNode);
            const targetCircles = getEdgeCircles(targetNode);
    
            const sourceCircle = sourceCircles.find(c => c.edge === connection.sourceEdge) || { 
                x: sourceNode.x + sourceNode.width / 2, 
                y: sourceNode.y + sourceNode.height / 2 
            };
            const targetCircle = targetCircles.find(c => c.edge === connection.targetEdge) || { 
                x: targetNode.x + targetNode.width / 2, 
                y: targetNode.y + targetNode.height / 2 
            };
    
            return isLineIntersectingRect(sourceCircle.x, sourceCircle.y, targetCircle.x, targetCircle.y, normalizedRect);
        });
    
        // If Shift key is held, add to existing selection
        if (e.shiftKey) {
            selectedNodes = Array.from(new Set([...selectedNodes, ...newlySelectedNodes]));
            selectedConnections = Array.from(new Set([...selectedConnections, ...newlySelectedConnections]));
        } else {
            selectedNodes = newlySelectedNodes;
            selectedConnections = newlySelectedConnections;
        }
    
        isSelecting = false;
        console.log(`Selected ${newlySelectedNodes.length} node(s) and ${newlySelectedConnections.length} connection(s) via selection rectangle.`);
        drawMap();
        return; // Skip other mouseup logic
    }

    // Reset states for dragging and resizing

    if (isResizing) {
        isResizing = false;
        dragTarget = null;
        drawMap();
    }

    isDragging = false;
    isResizing = false;
    dragTarget = null;
    resizeHandle = null; // Clear the currently active handle

    // Handle connection if any
    if (isConnecting) {
        const { x, y } = getMousePosition(e);
        // Find if the mouse is over any circle of any node
        let targetNode = null;
        let targetCircle = null;
        for (const node of nodes) {
            const circles = getEdgeCircles(node);
            for (const circle of circles) {
                const dx = x - circle.x;
                const dy = y - circle.y;
                if (Math.hypot(dx, dy) <= circle.interactiveRadius) { // Added buffer
                    targetNode = node;
                    targetCircle = circle;
                    break;
                }
            }
            if (targetNode) break;
        }

        if (targetNode && targetNode !== connectionStart.node) {
            saveState(); // Save before connecting
            // Create a new connection with edge information
            connections.push({
                source: connectionStart.node.id,
                target: targetNode.id,
                sourceEdge: connectionStart.circle.edge,
                targetEdge: targetCircle.edge,
            });
            console.log(`Connected node ID: ${connectionStart.node.id} (${connectionStart.circle.edge} edge) to node ID: ${targetNode.id} (${targetCircle.edge} edge)`);
        } else {
            console.log('Connection not established: No valid target circle found.');
        }

        isConnecting = false;
        connectionStart = null;
        connectionEnd = null;
    }

    // Redraw the map
    drawMap();
}





canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Prevent the context menu from appearing on right-click or middle mouse
});



// Wheel event handler for zooming
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    // Normalize deltaY based on deltaMode
    let delta = e.deltaY;
    switch (e.deltaMode) {
        case WheelEvent.DOM_DELTA_LINE:
            delta *= 16; // Approximate line height in pixels
            break;
        case WheelEvent.DOM_DELTA_PAGE:
            delta *= 800; // Approximate page height in pixels
            break;
        // DOM_DELTA_PIXEL doesn't require adjustment
    }

    // Invert delta to correct zoom direction
    delta = -delta;

    // Calculate the zoom factor using an exponential scale for smooth zooming
    const zoomFactor = Math.exp(delta * ZOOM_SENSITIVITY);

    // Calculate the new scale and clamp it within the defined limits
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * zoomFactor));

    // Get the cursor position relative to the canvas (in world coordinates)
    const rect = canvas.getBoundingClientRect();
    const cursorX = (e.clientX - rect.left) / scale - offsetX;
    const cursorY = (e.clientY - rect.top) / scale - offsetY;

    // Adjust offsets to keep the cursor position fixed during zoom
    offsetX += cursorX * (1 / newScale - 1 / scale);
    offsetY += cursorY * (1 / newScale - 1 / scale);

    // Update the scale
    scale = newScale;

    // Removed console log

    // Redraw the map with the updated scale and offsets
    drawMap();
});


document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);

// Existing event listeners for adding post-it notes, saving, loading, etc.
document.getElementById('add-post-it').addEventListener('click', () => {
    saveState();
    // Removed console log
    const screenCenterX = (canvas.width / 2 - offsetX) / scale;
    const screenCenterY = (canvas.height / 2 - offsetY) / scale;

    let newX = snapToGrid(screenCenterX);
    let newY = snapToGrid(screenCenterY);

    // Find a position that doesn't overlap existing nodes
    const padding = 20; // Minimum space between nodes
    const checkOverlap = (x, y) => {
        return nodes.some((node) => 
            x < node.x + node.width + padding &&
            x + node.defaultWidth > node.x - padding &&
            y < node.y + node.height + padding &&
            y + node.defaultHeight > node.y - padding
        );
    };

    while (checkOverlap(newX, newY)) {
        newX += settings.gridSize; // Adjust position to the right
        newY += settings.gridSize; // Adjust position downward
    }

    // make sure node width &  height are multiples of grid
    const newNode = {
        id: Date.now(), // Unique ID
        type: 'post-it',
        content: 'Click to edit',
        x: newX,
        y: newY,
        width: 150, // Default width
        height: 100, // Default height
        defaultWidth: 150, // Minimum width
        defaultHeight: 100, // Minimum height
        isEditing: false,
        color: 'rgb(255, 255, 0)',
        createdAt: Date.now() // Timestamp
    };
    nodes.push(newNode);
    drawMap();
});

// saving  & loading functions for shortcut
const { saveMap, loadMap, generateUUID } = electronAPI;


// Function to handle image scaling
function scaleImage(originalWidth, originalHeight) {
    let width = originalWidth;
    let height = originalHeight;

    if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
        const widthRatio = MAX_IMAGE_WIDTH / width;
        const heightRatio = MAX_IMAGE_HEIGHT / height;
        const scaleRatio = Math.min(widthRatio, heightRatio);
        width = Math.floor(width * scaleRatio);
        height = Math.floor(height * scaleRatio);
    }

    console.log(`Scaled Image: Original (${originalWidth}x${originalHeight}) -> Scaled (${width}x${height})`);
    return { width, height };
}

// Function to handle paste events
document.addEventListener('paste', async (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            const blob = item.getAsFile();
            if (blob) {
                const reader = new FileReader();
                reader.onload = async () => {
                    const base64Data = reader.result.split(',')[1]; // Remove data URL prefix
                    const nodeId = await generateUUID(); // Generate a UUID

                    // Create an Image object to get original dimensions
                    const img = new Image();
                    img.onload = () => {
                        const { width, height } = scaleImage(img.width, img.height);
                        const newNode = {
                            id: nodeId,
                            type: 'image',
                            content: '', // No text content
                            x: 100, // Default position, adjust as needed
                            y: 100,
                            width: width, // Set scaled width
                            height: height, // Set scaled height
                            defaultWidth: width, // Initialize defaultWidth
                            defaultHeight: height, // Initialize defaultHeight
                            imagePath: `images/${nodeId}.png`,
                            imageData: base64Data,
                            createdAt: Date.now() // Timestamp
                        };
                        nodes.push(newNode);
                        console.log(`Added image node ID: ${newNode.id}, Width: ${newNode.width}, Height: ${newNode.height}`);
                        // Validate width and height
                            if (typeof newNode.width !== 'number' || typeof newNode.height !== 'number' || newNode.width <= 0 || newNode.height <= 0) {
                                console.error(`Invalid dimensions for image node ID: ${newNode.id}. Setting to default values.`);
                                newNode.width = newNode.defaultWidth || 100;
                                newNode.height = newNode.defaultHeight || 100;
                            }
                        drawMap();
                    };
                    img.src = `data:image/png;base64,${base64Data}`;
                };
                reader.readAsDataURL(blob);
            }
        }
    }
});

// Function to handle drag-and-drop events
canvas.addEventListener('dragover', (event) => {
    event.preventDefault();
});

canvas.addEventListener('drop', async (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Data = reader.result.split(',')[1];
                const nodeId = await generateUUID(); // Generate a UUID

                // Create an Image object to get original dimensions
                const img = new Image();
                img.onload = () => {
                    const { width, height } = scaleImage(img.width, img.height);
                    const newNode = {
                        id: nodeId,
                        type: 'image',
                        content: '',
                        x: event.offsetX, // Position where the image was dropped
                        y: event.offsetY,
                        width: width, // Set scaled width
                        height: height, // Set scaled height
                        defaultWidth: width, // Initialize defaultWidth
                        defaultHeight: height, // Initialize defaultHeight
                        imagePath: `images/${nodeId}.png`,
                        imageData: base64Data,
                        createdAt: Date.now() // Timestamp
                    };
                    nodes.push(newNode);

                    console.log(`Dropped image node ID: ${newNode.id}, Width: ${newNode.width}, Height: ${newNode.height}`);

                    // Validate width and height
                    if (typeof newNode.width !== 'number' || typeof newNode.height !== 'number' || newNode.width <= 0 || newNode.height <= 0) {
                        console.error(`Invalid dimensions for image node ID: ${newNode.id}. Setting to default values.`);
                        newNode.width = newNode.defaultWidth || 100;
                        newNode.height = newNode.defaultHeight || 100;
                    }
                    drawMap();
                };
                img.src = `data:image/png;base64,${base64Data}`;
            };
            reader.readAsDataURL(file);
        }
    }
});

async function saveMapFunction() {
    const mindmapData = {
        nodes,
        connections,
        offsetX,
        offsetY,
        scale,
        settings
    };

    const result = await saveMap(mindmapData);
    if (result.success) {
        console.log('Mindmap saved successfully.');
    } else {
        console.error('Error saving mindmap:', result.message);
    }
}

async function loadMapFunction() {
    const result = await loadMap();
    if (result.success) {
        const mindmapData = result.data;
        nodes = mindmapData.nodes || [];
        connections = mindmapData.connections || [];
        offsetX = mindmapData.offsetX || 0;
        offsetY = mindmapData.offsetY || 0;
        scale = mindmapData.scale || 1;
        settings = mindmapData.settings || { connectionRouting: 'bezier' };

        // Clear Image Cache when new mindmap is loaded to prevent memory leaks
        for (const key in imageCache) {
            delete imageCache[key];
        }
        // preload image cache (optional, since drawmap will do it not done here)
        nodes.forEach(node => {
            if (node.type === 'image' && node.imageData) {
                const img = new Image();
                img.src = `data:image/png;base64,${node.imageData}`;
                imageCache[node.id] = img;
            }
        });

        applySettings();
        drawMap();

        console.log('Mindmap loaded successfully.');
    } else {
        console.error('Error loading mindmap:', result.message);
    }
}

// Attach functions to UI elements
document.getElementById('save-map').addEventListener('click', saveMapFunction);
document.getElementById('load-map').addEventListener('click', loadMapFunction);

// Double-click to edit post-it-note content
canvas.addEventListener('dblclick', (e) => {
    const { x, y } = getMousePosition(e);
    const target = findNodeAtPosition(x, y);
    if (target) {
        // Removed console log
        target.isEditing = true;
        drawMap();
        createEditableInput(target);
    }
});


function createEditableInput(node) {
    const input = document.createElement('textarea');
    input.value = node.content;
    input.style.position = 'absolute';
    input.style.background = 'rgba(255, 255, 255, 0.8)';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.resize = 'none';
    input.style.overflowY = 'auto'; // Enable vertical scrolling
    input.style.overflowX = 'hidden'; // Optional: Hide horizontal scrollbar
    input.style.boxSizing = 'border-box';
    
    // Calculate the screen position and size of the post-it note
    const rectX = (node.x + offsetX) * scale;
    const rectY = (node.y + offsetY) * scale;
    const rectWidth = node.width * scale;
    const rectHeight = node.height * scale;
    
    // Apply styles to match the post-it note size and position
    input.style.left = `${rectX + 5}px`; // Add padding
    input.style.top = `${rectY + 5}px`;  // Add padding
    input.style.width = `${rectWidth - 10}px`; // Adjust for padding
    input.style.height = `${rectHeight - 10}px`; // Adjust for padding
    
    // Synchronize font size with canvas zoom level
    input.style.fontSize = `${BASE_FONT_SIZE * scale}px`;
    input.style.fontFamily = 'Arial, sans-serif';
    input.style.lineHeight = '1.2';
    
    // Optional: Adjust padding inside the textarea
    input.style.padding = '4px';
    
    // Add the input element to the document
    document.body.appendChild(input);
    
    // Focus the input box
    input.focus();
    
    // Prevent pointer events on the canvas while editing
    canvas.style.pointerEvents = 'none';
    
    // Stop propagation of key events within the textarea
    // input.addEventListener('keydown', (e) => {
    //     // Allow Backspace and Enter within the textarea without affecting global handlers
    //     e.stopPropagation();
        
    //     // Allow Enter to insert a newline
    //     if (e.key === 'Enter') {
    //         // Do nothing, allow default behavior
    //     }
    // });
    
    // Handle blur event to save changes
    input.addEventListener('blur', () => {
        // Save the input value to the node's content
        node.content = input.value.trim() || 'Click to edit';
        node.isEditing = false;
        
        // Remove the input element
        document.body.removeChild(input);
        
        // Re-enable pointer events on the canvas
        canvas.style.pointerEvents = 'auto';
        
        // Redraw the map to reflect changes
        drawMap();
    });
    
    // Optional: Handle Enter key without Shift to prevent unexpected behavior
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Allow Enter to insert a newline
            // Do not blur the textarea
        }
    });
}



// Utility functions
function getMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / scale - offsetX,
        y: (e.clientY - rect.top) / scale - offsetY,
    };
}


function findNodeAtPosition(x, y) {
    return nodes.find(
        (node) =>
            x > node.x &&
            x < node.x + node.width &&
            y > node.y &&
            y < node.y + node.height
    );
}

function getDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.hypot(dx, dy);
}

function getMidpoint(touch1, touch2) {
    return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
    };
}

//allow nodes to be snapped to any grid point, including those with negative coordinates
function snapToGrid(value) {
    if (typeof value !== 'number' || isNaN(value)) {
        console.error(`snapToGrid received invalid value: ${value}`);
        return 0; // Allow snapping to zero
    }
    const snapped = Math.round(value / settings.gridSize) * settings.gridSize;
    return snapped;
}



// add a grid!!!
function drawGrid() {
    const gridSize = settings.gridSize; // Size of the grid cells
    const lineColor = settings.gridLineColor; // Subtle grid color
    const lineWidth = 0.4; // Thickness of grid lines

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any existing transformations
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // **Fill the Background with the Selected Color**
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;

    // Calculate the start positions for the grid based on the offset and scale
    const startX = Math.floor((offsetX * scale) % (gridSize * scale));
    const startY = Math.floor((offsetY * scale) % (gridSize * scale));

    // Draw vertical grid lines
    for (let x = startX; x <= canvas.width; x += gridSize * scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = startY; y <= canvas.height; y += gridSize * scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    ctx.restore();
}

// Function to check if a point is near any connection line
function isPointOnConnection(px, py, connection) {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    if (!sourceNode || !targetNode) return false;

    const sourcePoint = { x: sourceNode.x + sourceNode.width / 2, y: sourceNode.y + sourceNode.height / 2 };
    const targetPoint = { x: targetNode.x + targetNode.width / 2, y: targetNode.y + targetNode.height / 2 };

    let points = [];
    if (settings.connectionRouting === 'bezier') {
        points = getBezierPoints(sourcePoint, targetPoint);
    } else if (settings.connectionRouting === 'orthogonal') {
        points = getOrthogonalPoints(sourcePoint, targetPoint, 0);
    } else {
        points = [sourcePoint, targetPoint];
    }

    for (let i = 0; i < points.length - 1; i++) {
        if (isPointNearLine(px, py, points[i], points[i + 1], 5 / scale)) { // Adjust tolerance based on scale
            return true;
        }
    }
    return false;
}


function getOrthogonalPoints(source, target, offset = 0) {
    let points = [];

    // Calculate differences
    const deltaX = target.x - source.x;
    const deltaY = target.y - source.y;

    // Determine the direction to offset
    let offsetX = 0;
    let offsetY = 0;

    if (deltaX === 0) {
        // Vertically aligned
        offsetX = 0;
        offsetY = offset;
    } else if (deltaY === 0) {
        // Horizontally aligned
        offsetX = offset;
        offsetY = 0;
    } else {
        // Diagonally aligned
        offsetX = deltaX > 0 ? offset : -offset;
        offsetY = deltaY > 0 ? offset : -offset;
    }

    // First point after source
    points.push({ x: source.x + offsetX, y: source.y });

    // Second point after first offset
    points.push({ x: source.x + offsetX, y: target.y + offsetY });

    // Third point before target
    points.push({ x: target.x, y: target.y + offsetY });

    // Final target point
    points.push({ x: target.x, y: target.y });

    return points;
}


// Function to calculate Bezier curve points between two points
function getBezierPoints(source, target) {
    const deltaX = target.x - source.x;
    const deltaY = target.y - source.y;
    return [
        { x: source.x, y: source.y },
        { x: source.x + deltaX / 2, y: source.y },
        { x: target.x - deltaX / 2, y: target.y },
        { x: target.x, y: target.y }
    ];
}


function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(); // Draw the grid background
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offsetX, offsetY);

     // **Sort Nodes by createdAt Timestamp (Ascending Order)**
     const sortedNodes = [...nodes].sort((a, b) => a.createdAt - b.createdAt);

    // **1. Draw connections first**
    connections.forEach((connection) => {
        const sourceNode = nodes.find((n) => n.id === connection.source);
        const targetNode = nodes.find((n) => n.id === connection.target);
        if (sourceNode && targetNode) {
            const sourceCircles = getEdgeCircles(sourceNode);
            const targetCircles = getEdgeCircles(targetNode);

            const sourceCircle = sourceCircles.find(c => c.edge === connection.sourceEdge) || { 
                x: sourceNode.x + sourceNode.width / 2, 
                y: sourceNode.y + sourceNode.height / 2 
            };
            const targetCircle = targetCircles.find(c => c.edge === connection.targetEdge) || { 
                x: targetNode.x + targetNode.width / 2, 
                y: targetNode.y + targetNode.height / 2 
            };

            ctx.beginPath();
            // ctx.moveTo(sourceCircle.x, sourceCircle.y);
            // ctx.lineTo(targetCircle.x, targetCircle.y);

            if (settings.connectionRouting === 'bezier') {
                // Draw Bezier Curve
                const bezierPoints = getBezierPoints(sourceCircle, targetCircle);
                ctx.moveTo(bezierPoints[0].x, bezierPoints[0].y);
                ctx.bezierCurveTo(
                    bezierPoints[1].x, bezierPoints[1].y,
                    bezierPoints[2].x, bezierPoints[2].y,
                    bezierPoints[3].x, bezierPoints[3].y
                );
            } else if (settings.connectionRouting === 'orthogonal') {
                // Draw Orthogonal Lines
                const orthogonalPoints = getOrthogonalPoints(sourceCircle, targetCircle, 0);
                ctx.moveTo(orthogonalPoints[0].x, orthogonalPoints[0].y);
                for (let i = 1; i < orthogonalPoints.length; i++) {
                    ctx.lineTo(orthogonalPoints[i].x, orthogonalPoints[i].y);
                }
            } else {
                // Draw Straight Line
                ctx.moveTo(sourceCircle.x, sourceCircle.y);
                ctx.lineTo(targetCircle.x, targetCircle.y);
            }


            if (selectedConnections.includes(connection)) {
                ctx.strokeStyle = '#ff0000'; // Red color for selected connections
                ctx.lineWidth = 5; // Thicker line for visibility
            } else {
                ctx.strokeStyle = settings.connectionLineColor || '#000'; // Default connection line color
                ctx.lineWidth = 2; // Default thickness
            }
            ctx.stroke();
        }
    });

    // **2. Draw Nodes in Sorted Order**
    sortedNodes.forEach((node) => { 
        if (node.type === 'image' && node.imageData) {
            if (!imageCache[node.id]) {
                const img = new Image();
                img.src = `data:image/png;base64,${node.imageData}`;
                imageCache[node.id] = img;
            }
            const img = imageCache[node.id];
            if (img.complete) {
                ctx.drawImage(img, node.x, node.y, node.width, node.height);
                
                // **Conditional Border Rendering**
                if (selectedNodes.includes(node)) {
                    ctx.strokeStyle = 'blue'; // Blue outline for selected images
                    ctx.lineWidth = 2;
                    ctx.strokeRect(node.x, node.y, node.width, node.height); // moved here to render outline only when selected
                } 
                // removed for no outline for images if not selected
                // else {
                //     ctx.strokeStyle = '#000'; // Black outline for unselected images
                //     ctx.lineWidth = 1;
                // }
                // ctx.strokeRect(node.x, node.y, node.width, node.height);
        
                // **Determine if Connection Circles Should Be Shown**
                const shouldShowCircles = selectedNodes.includes(node) || isConnecting;
        
                if (shouldShowCircles) {
                    // **Draw Connection Circles**
                    const circles = getEdgeCircles(node);
                    circles.forEach(circle => {
                        ctx.beginPath();
                        ctx.arc(circle.x, circle.y, circle.currentRadius, 0, Math.PI * 2);
                        
                        // **Set Fill and Stroke Styles**
                        ctx.fillStyle = 'red'; // Red color for connection circles
                        ctx.strokeStyle = '#000'; // Black border
                        ctx.lineWidth = 1;
        
                        // **Highlight on Hover**
                        if (circle === hoveredCircle) {
                            ctx.fillStyle = '#ff0000'; // Brighter red on hover
                            ctx.lineWidth = 2;
                        }
                        
                        ctx.fill();
                        ctx.stroke();
        
                        // **Add Connection Count Indicator**
                        const connectionCount = connections.filter(conn => 
                            (conn.source === circle.node.id && conn.sourceEdge === circle.edge) ||
                            (conn.target === circle.node.id && conn.targetEdge === circle.edge)
                        ).length;
        
                        if (connectionCount > 1) {
                            ctx.fillStyle = '#fff';
                            ctx.font = `${10 * scale}px Arial`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(connectionCount, circle.x, circle.y);
                        }
                    });
        
                    // **Draw Resize Handles Only for Selected Nodes**
                    if (selectedNodes.includes(node)) {
                        drawResizeHandles(node);
                    }
                }
            } else {
                img.onload = () => {
                    ctx.drawImage(img, node.x, node.y, node.width, node.height);
                    
                    // **Conditional Border Rendering on Image Load**
                    if (selectedNodes.includes(node)) {
                        ctx.strokeStyle = 'blue'; // Blue outline for selected images
                        ctx.lineWidth = 2;
                        ctx.strokeRect(node.x, node.y, node.width, node.height); // moved here to render outline only when selected
                    } 
                    // removed for no outline for images if not selected
                    // else { 
                    //     ctx.strokeStyle = '#000'; // Black outline for unselected images
                    //     ctx.lineWidth = 1;
                    // }
                    // ctx.strokeRect(node.x, node.y, node.width, node.height);
        
                    // **Determine if Connection Circles Should Be Shown**
                    const shouldShowCircles = selectedNodes.includes(node) || isConnecting;
        
                    if (shouldShowCircles) {
                        // **Draw Connection Circles**
                        const circles = getEdgeCircles(node);
                        circles.forEach(circle => {
                            ctx.beginPath();
                            ctx.arc(circle.x, circle.y, circle.currentRadius, 0, Math.PI * 2);
                            
                            // **Set Fill and Stroke Styles**
                            ctx.fillStyle = 'red'; // Red color for connection circles
                            ctx.strokeStyle = '#000'; // Black border
                            ctx.lineWidth = 1;
        
                            // **Highlight on Hover**
                            if (circle === hoveredCircle) {
                                ctx.fillStyle = '#ff0000'; // Brighter red on hover
                                ctx.lineWidth = 2;
                            }
                            
                            ctx.fill();
                            ctx.stroke();
        
                            // **Add Connection Count Indicator**
                            const connectionCount = connections.filter(conn => 
                                (conn.source === circle.node.id && conn.sourceEdge === circle.edge) ||
                                (conn.target === circle.node.id && conn.targetEdge === circle.edge)
                            ).length;
        
                            if (connectionCount > 1) {
                                ctx.fillStyle = '#fff';
                                ctx.font = `${10 * scale}px Arial`;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillText(connectionCount, circle.x, circle.y);
                            }
                        });
        
                        // **Draw Resize Handles Only for Selected Nodes**
                        if (selectedNodes.includes(node)) {
                            drawResizeHandles(node);
                        }
                    }
                };
                img.onerror = () => {
                    console.error(`Failed to load image for node ID: ${node.id}`);
                };
            }
        } else if (node.type === 'post-it') {

        ctx.fillStyle = node.color || settings.postItColor || 'rgba(255, 255, 0, 1)'; // If node.color is not set, fallback to settings.postItColor.
        ctx.fillRect(node.x, node.y, node.width, node.height);
        ctx.strokeStyle = '#000'; // Black border for unselected nodes
        ctx.lineWidth = 1;
        ctx.strokeRect(node.x, node.y, node.width, node.height);

        // Highlight selected nodes
        if (selectedNodes.includes(node)) {
            ctx.strokeStyle = '#00f'; // Blue border for selection
            ctx.lineWidth = 2;
            ctx.strokeRect(node.x - 2, node.y - 2, node.width + 4, node.height + 4);
        }

        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        drawText(node); // Correctly formatted text

        // Determine if edge circles should be shown
        const shouldShowCircles = selectedNodes.includes(node) || isConnecting;

        if (shouldShowCircles) {
            // **3. Draw connection circles after lines**
            const circles = getEdgeCircles(node);
            circles.forEach(circle => {
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, circle.currentRadius, 0, Math.PI * 2);
                
                // **Set Fill and Stroke Styles**
                ctx.fillStyle = 'red'; // Red color for connection circles
                ctx.strokeStyle = '#000'; // Black border
                ctx.lineWidth = 1;
            
                // **Highlight on Hover**
                if (circle === hoveredCircle) {
                    ctx.fillStyle = '#ff0000'; // Brighter red on hover
                    ctx.lineWidth = 2;
                }
                
                ctx.fill();
                ctx.stroke();
            
                // **Add Connection Count Indicator**
                const connectionCount = connections.filter(conn => 
                    (conn.source === circle.node.id && conn.sourceEdge === circle.edge) ||
                    (conn.target === circle.node.id && conn.targetEdge === circle.edge)
                ).length;
            
                if (connectionCount > 1) {
                    ctx.fillStyle = '#fff';
                    ctx.font = `${10 * scale}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(connectionCount, circle.x, circle.y);
                }
            });

            // Draw resize handles only for selected nodes
            if (selectedNodes.includes(node)) {
                drawResizeHandles(node);
            }
        }

        }

    });

    // **4. Draw Temporary Connection Line**
    if (isConnecting && connectionStart && connectionEnd) {
        const sourceCircle = connectionStart.circle;
        const endX = connectionEnd.x;
        const endY = connectionEnd.y;

        // Convert screen coordinates to world coordinates
        const worldEndX = (endX / scale) - offsetX;
        const worldEndY = (endY / scale) - offsetY;

        ctx.beginPath();
        ctx.moveTo(sourceCircle.x, sourceCircle.y);
        if (settings.connectionRouting === 'bezier') {
            const bezierPoints = getBezierPoints(sourceCircle, { x: worldEndX, y: worldEndY });
            ctx.bezierCurveTo(
                bezierPoints[1].x, bezierPoints[1].y,
                bezierPoints[2].x, bezierPoints[2].y,
                bezierPoints[3].x, bezierPoints[3].y
            );
        } else if (settings.connectionRouting === 'orthogonal') {
            const orthogonalPoints = getOrthogonalPoints(sourceCircle, { x: worldEndX, y: worldEndY }, 0);
            ctx.moveTo(orthogonalPoints[0].x, orthogonalPoints[0].y);
            for (let i = 1; i < orthogonalPoints.length; i++) {
                ctx.lineTo(orthogonalPoints[i].x, orthogonalPoints[i].y);
            }
        } else {
            ctx.lineTo(worldEndX, worldEndY);
        }
        ctx.strokeStyle = '#0000ff'; // Temporary line color
        ctx.lineWidth = 5;           // Adjusted thickness for visibility
        ctx.stroke();
    }


    // **5. Draw Selection Rectangle Without Transformations**
    if (isSelecting) {
        const rect = {
            x: Math.min(selectionStart.x, selectionEnd.x),
            y: Math.min(selectionStart.y, selectionEnd.y),
            width: Math.abs(selectionEnd.x - selectionStart.x),
            height: Math.abs(selectionEnd.y - selectionStart.y)
        };

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scaling and translation

        // Draw the selection rectangle without adjusting for scale and offset
        ctx.beginPath();
        ctx.rect(
            rect.x,
            rect.y,
            rect.width,
            rect.height
        );
        ctx.strokeStyle = '#00f'; // Blue border for selection rectangle
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]); // Dashed line
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.1)'; // Semi-transparent fill
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
}



function drawResizeHandles(node) {
    const handleSize = resizeHandleSize;
    const handles = getResizeHandles(node);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scaling
    ctx.fillStyle = '#ffffff'; // Handle color (white fill)
    ctx.strokeStyle = '#000000'; // Handle border color (black outline)
    ctx.lineWidth = 1;

    handles.forEach((handle) => {
        // Convert positions to screen space based on current scale and offsets
        const screenX = (handle.x + offsetX) * scale;
        const screenY = (handle.y + offsetY) * scale;

        // Draw the handle as a square
        ctx.fillRect(
            screenX - handleSize / 2,
            screenY - handleSize / 2,
            handleSize,
            handleSize
        );
        ctx.strokeRect(
            screenX - handleSize / 2,
            screenY - handleSize / 2,
            handleSize,
            handleSize
        );
    });

    ctx.restore();
}


function drawText(node) {
    const padding = 5;
    const maxCharsPerLine = 10;
    const lineHeight = 18;
    let y = node.y + padding + lineHeight;
    let isTruncated = false;

    

    ctx.save();
    ctx.beginPath();
    ctx.rect(node.x + padding, node.y + padding, node.width - 2 * padding, node.height - 2 * padding);
    ctx.clip();

    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';

    const words = node.content.split(/\s+/);
    let currentLine = '';

    words.forEach(word => {
        if (isTruncated) return;

        if ((currentLine + word).length > maxCharsPerLine) {
            ctx.fillText(currentLine.trim(), node.x + padding, y);
            y += lineHeight;

            if (y + lineHeight > node.y + node.height - padding) {
                ctx.fillText('...', node.x + padding, y);
                isTruncated = true;
                return;
            }

            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    });

    if (!isTruncated && currentLine.length > 0) {
        ctx.fillText(currentLine.trim(), node.x + padding, y);
    }

    ctx.restore();
}

function isNearEdge(x, y, node) {
    const edgeThreshold = 20; // Pixels near edge to allow resizing
    const nearRightEdge = Math.abs(x - (node.x + node.width)) < edgeThreshold;
    const nearBottomEdge = Math.abs(y - (node.y + node.height)) < edgeThreshold;
    return nearRightEdge || nearBottomEdge;
}

// Function to wrap text within a specified width
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawMap(); // Redraw the map to fit the new canvas size
});

// Initial draw
drawMap();
