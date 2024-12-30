// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const AdmZip = require('adm-zip');
const fs = require('fs');

const { v4: uuidv4 } = require('uuid'); // Import UUID

let mainWindow;
let settingsWindow;

// Default Settings
let defaultSettings = {
    connectionRouting: 'bezier',   // Existing setting
    gridSize: 50,                  // Default grid size in pixels
    backgroundColor: '#ffffff'     // Default background color (white)
};

// Function to create the main application window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Enable context isolation for security
            nodeIntegration: false, // Disable Node.js integration
        }
    });

    mainWindow.loadFile('index.html');

    // Remove the default menu for a cleaner UI
    // Menu.setApplicationMenu(null);
}

// Function to create the settings window
function openSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 400,
        height: 400, // Increased height to accommodate new settings
        parent: mainWindow,
        modal: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    settingsWindow.loadFile('settings.html');

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

let isFileOpenPending = false; // Flag to track if a file is being opened


// app.whenReady().then(createMainWindow); // creates main window upon launch
// console.log("mainwindow created at launch");

// IPC Listener: Open Settings Window
ipcMain.on('open-settings', () => {
    openSettingsWindow();
});

// IPC Listener: Renderer requests current settings
ipcMain.on('request-settings', () => {
    if (mainWindow) {
        // Send a message to the renderer to send current settings
        mainWindow.webContents.send('send-current-settings', defaultSettings);
    }
});

// IPC Listener: Renderer sends current settings
ipcMain.on('current-settings', (event, settings) => {
    if (settingsWindow) {
        // Forward the current settings to the settings window
        settingsWindow.webContents.send('settings-changed', settings);
    } else {
        // If settingsWindow is not open, update defaultSettings
        defaultSettings = { ...defaultSettings, ...settings };
    }
});

// IPC Listener: Settings window updates settings
ipcMain.on('update-settings', (event, newSettings) => {
    // Update defaultSettings with newSettings
    defaultSettings = { ...defaultSettings, ...newSettings };

    if (mainWindow) {
        // Forward the updated settings to the renderer process
        mainWindow.webContents.send('settings-changed', newSettings);
    }
});

// IPC Handler: Save Mindmap with Image Support
ipcMain.handle('save-map', async (event, mindmapData) => {
    const zip = new AdmZip();

    // Process nodes to handle images
    const processedNodes = mindmapData.nodes.map(node => {
        if (node.type === 'image' && node.imageData && node.imagePath) {
            // Decode base64 image data
            const imageBuffer = Buffer.from(node.imageData, 'base64');
            // Add image file to ZIP under images/ directory
            zip.addFile(node.imagePath, imageBuffer);
            // Remove imageData from node to prevent embedding in JSON
            const { imageData, ...rest } = node;
            return rest;
        }
        return node;
    });

    // Prepare the updated mindmap data without imageData
    const updatedMindmapData = {
        ...mindmapData,
        nodes: processedNodes
    };

    // Add mindmap.json to the ZIP
    zip.addFile('mindmap.json', Buffer.from(JSON.stringify(updatedMindmapData, null, 2)));

    // Prompt user to select save location
    const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save Mindmap',
        defaultPath: 'mindmap.mindmap',
        filters: [
            { name: 'Mindmap', extensions: ['mindmap'] }
        ]
    });

    if (canceled || !filePath) {
        return { success: false, message: 'Save cancelled.' };
    }

    try {
        zip.writeZip(filePath);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// IPC Handler: Load Mindmap with Image Support
ipcMain.handle('load-map', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Open Mindmap',
        filters: [
            { name: 'Mindmap', extensions: ['mindmap'] }
        ],
        properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
        return { success: false, message: 'Open cancelled.' };
    }

    const filePath = filePaths[0];
    const zip = new AdmZip(filePath);
    const mindmapEntry = zip.getEntry('mindmap.json');

    if (!mindmapEntry) {
        return { success: false, message: 'mindmap.json not found in the archive.' };
    }

    try {
        const mindmapContent = mindmapEntry.getData().toString('utf8');
        const mindmapData = JSON.parse(mindmapContent);

        // Process nodes to include image data
        const processedNodes = mindmapData.nodes.map(node => {
            if (node.type === 'image' && node.imagePath) {
                const imageEntry = zip.getEntry(node.imagePath);
                if (imageEntry) {
                    const imageBuffer = imageEntry.getData();
                    const base64Data = imageBuffer.toString('base64');
                    return { ...node, imageData: base64Data };
                }
            }
            return node;
        });

        const updatedMindmapData = {
            ...mindmapData,
            nodes: processedNodes
        };

        return { success: true, data: updatedMindmapData };
    } catch (error) {
        return { success: false, message: 'Error parsing mindmap.json.' };
    }
});



/**
 * Handles opening a .mindmap file by creating a new window with data or showing an error.
 * @param {Object|null} event - The IPC event object or null.
 * @param {string} filePath - Path to the .mindmap file to open.
 */
async function handleOpenMindmapFile(event, filePath) {
    if (!filePath || filePath.trim() === '') {
        console.log('No valid filePath provided. Creating empty window.');
        createMainWindow();
        console.log("empty main window created at handleopenmindmapfile because not filepath provided ")
        return;
    }

    console.log(`Attempting to load mindmap from: ${filePath}`);

    try {
        const zip = new AdmZip(filePath);
        const mindmapEntry = zip.getEntry('mindmap.json');

        if (!mindmapEntry) {
            throw new Error('mindmap.json not found in the archive.');
        }

        const mindmapContent = mindmapEntry.getData().toString('utf8');
        const mindmapData = JSON.parse(mindmapContent);
        console.log('Parsed mindmap.json successfully.');

        // Process nodes to include image data
        const processedNodes = mindmapData.nodes.map(node => {
            if (node.type === 'image' && node.imagePath) {
                const imageEntry = zip.getEntry(node.imagePath);
                if (imageEntry) {
                    const imageBuffer = imageEntry.getData();
                    const base64Data = imageBuffer.toString('base64');
                    return { ...node, imageData: base64Data };
                }
            }
            return node;
        });

        const updatedMindmapData = {
            ...mindmapData,
            nodes: processedNodes
        };

        if (event) {
            // Send 'mindmap-data' to the renderer process that initiated the event
            const window = BrowserWindow.fromWebContents(event.sender);
            window.webContents.send('mindmap-data', updatedMindmapData);
            console.log(`Sent 'mindmap-data' to window.`);
        } else {
            // When called from 'open-file' or 'second-instance', create a new window and send data
            createMainWindow();
            mainWindow.webContents.on('did-finish-load', () => {
                mainWindow.webContents.send('mindmap-data', updatedMindmapData);
                console.log('Sent "mindmap-data" to new main window.');
            });
            console.log('Created new main window with loaded mindmap data.');
        }

        // log(`Successfully loaded mindmap from ${filePath}.`);
    } catch (error) {
        console.error(`Error loading mindmap: ${error.message}`);
        // log(`Error loading mindmap: ${error.message}`);

        if (event) {
            // Send 'mindmap-error' to the renderer process that initiated the event
            const window = BrowserWindow.fromWebContents(event.sender);
            window.webContents.send('mindmap-error', error.message);
            console.log(`Sent 'mindmap-error' to window.`);
        } else {
            // If no event, create a window and send the error
            createMainWindow();
            console.log("no event, so create new window and send error");
            mainWindow.webContents.on('did-finish-load', () => {
                mainWindow.webContents.send('mindmap-error', error.message);
                console.log('Sent "mindmap-error" to new main window.');
            });
            console.log('Created new main window with error message.');
        }
    }
}


function handleFilePath(filePath) {
    if (filePath) {
        handleOpenMindmapFile(null, filePath);
        isFileOpenPending = true;
    } else if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(); 
        console.log("there are no main windows so create new window (second instance, handlefilepath)")
    }
}

app.on('second-instance', (event, argv) => {
    const filePath = argv.find(arg => arg.endsWith('.mindmap'));
    handleFilePath(filePath);
});

app.on('open-file', (event, filePath) => {
    event.preventDefault();
    handleFilePath(filePath);
});

// Parse command-line arguments for .mindmap files on Windows/Linux
let initialFilePath = null;
if (process.platform === 'win32' || process.platform === 'linux') {
    // Windows/Linux: arguments start from index 1
    initialFilePath = process.argv.find(arg => arg.endsWith('.mindmap'));
    if (initialFilePath) {
        isFileOpenPending = true; // Set the flag
    }
}

app.whenReady().then(() => {
    if (isFileOpenPending && initialFilePath) {
        // Handle the file opening scenario
        handleOpenMindmapFile(null, initialFilePath);
    } else {
        // Launch a normal empty main window
        createMainWindow();
    }
});

// IPC Handler: Generate UUID
ipcMain.handle('generate-uuid', () => {
    return uuidv4(); // yeah it's that simple
});

// macOS specific behavior: Re-create window when dock icon is clicked
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && !isFileOpenPending) {
        createMainWindow();
    }
    console.log("create new window macos behavior");
});

// Quit the app when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
