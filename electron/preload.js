const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  onNewGame: (callback) => ipcRenderer.on('new-game', callback),
  onShowHelp: (callback) => ipcRenderer.on('show-help', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})