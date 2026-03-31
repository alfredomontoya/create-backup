const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

// 📂 Listar usuarios
ipcMain.handle('listar-directorios', async () => {
  const basePath = 'C:\\Users';
  const ignorar = ['All Users', 'Default', 'Default User', 'Public'];

  const items = fs.readdirSync(basePath);

  return items.filter(item => {
    const fullPath = path.join(basePath, item);
    return fs.statSync(fullPath).isDirectory() && !ignorar.includes(item);
  });
});

// 💾 Listar discos
ipcMain.handle('listar-discos', async () => {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const discos = [];

  for (let letra of letras) {
    const ruta = letra + ':\\';
    if (fs.existsSync(ruta)) {
      discos.push(ruta);
    }
  }

  return discos;
});

// 🚀 Ejecutar robocopy
ipcMain.on('ejecutar-robocopy', (event, comando) => {
  const proceso = spawn('cmd.exe', ['/c', comando]);

  proceso.stdout.on('data', (data) => {
    event.sender.send('robocopy-output', data.toString());
  });

  proceso.stderr.on('data', (data) => {
    event.sender.send('robocopy-output', data.toString());
  });

  proceso.on('close', (code) => {
    event.sender.send('robocopy-fin', code);
  });
});