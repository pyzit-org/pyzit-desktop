const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pyzit', {
  version: () => 'Pyzit Desktop ' + process.versions.electron,
  reload: () => ipcRenderer.send('reload-page')
});

window.addEventListener('DOMContentLoaded', () => {
  // Custom context menu only
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    ipcRenderer.send('show-context-menu');
  });
});
