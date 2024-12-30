// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose electronAPI methods
contextBridge.exposeInMainWorld('electronAPI', {
    openSettings: () => ipcRenderer.send('open-settings'),
    onSettingsChanged: (callback) => ipcRenderer.on('settings-changed', (event, settings) => callback(settings)),
    requestSettings: () => ipcRenderer.send('request-settings'),
    updateSettings: (newSettings) => ipcRenderer.send('update-settings', newSettings),
    sendCurrentSettings: (settings) => ipcRenderer.send('current-settings', settings),
    onRequestCurrentSettings: (callback) => ipcRenderer.on('send-current-settings', (event) => callback()),
    saveMap: (mindmapData) => ipcRenderer.invoke('save-map', mindmapData),
    loadMap: () => ipcRenderer.invoke('load-map'),
    generateUUID: () => ipcRenderer.invoke('generate-uuid'), // Expose UUID generation
    onOpenMindmap: (callback) => ipcRenderer.on('open-mindmap', (event, filePath) => callback(filePath)), 
    onMindmapData: (callback) => ipcRenderer.on('mindmap-data', (event, mindmapData) => callback(mindmapData)),
    onMindmapError: (callback) => ipcRenderer.on('mindmap-error', (event, errorMessage) => callback(errorMessage)),
});

console.log('Preload script loaded successfully.');