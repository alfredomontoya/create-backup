const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listarDirectorios: () => ipcRenderer.invoke('listar-directorios'),
  listarDiscos: () => ipcRenderer.invoke('listar-discos'),

  ejecutarRobocopy: (cmd) => ipcRenderer.send('ejecutar-robocopy', cmd),
  onOutput: (callback) => ipcRenderer.on('robocopy-output', (_, data) => callback(data)),
  onFin: (callback) => ipcRenderer.on('robocopy-fin', (_, code) => callback(code)),
  verificarCarpeta: (ruta) => ipcRenderer.invoke('verificar-carpeta', ruta),
  listarSubcarpetas: (ruta) => ipcRenderer.invoke('listar-subcarpetas', ruta),

  // 👇 IMPORTANTE: coma antes de esto
  removeListeners: () => {
    ipcRenderer.removeAllListeners('robocopy-output');
    ipcRenderer.removeAllListeners('robocopy-fin');
  }
});
