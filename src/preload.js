const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('pyzit', {
  version: () => 'Pyzit Desktop ' + process.versions.electron
});
