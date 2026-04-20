const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

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

  try {
    const items = fs.readdirSync(basePath);

    return items.filter(item => {
      const fullPath = path.join(basePath, item);

      try {
        return fs.statSync(fullPath).isDirectory() && !ignorar.includes(item);
      } catch {
        return false;
      }
    });

  } catch (err) {
    return [];
  }
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


// 🚀 Ejecutar robocopy usando .bat
ipcMain.on('ejecutar-robocopy', (event, comando) => {

  // 🔒 Seguridad básica
  if (!comando.includes('robocopy')) {
    event.sender.send('robocopy-output', '❌ Comando no permitido\n');
    return;
  }

  try {
    // 📄 Crear archivo .bat temporal
    const tempPath = path.join(os.tmpdir(), 'backup_script.bat');

    fs.writeFileSync(tempPath, comando, 'utf-8');

    // ▶ Ejecutar .bat
    const proceso = spawn('cmd.exe', ['/c', tempPath]);

    // 📤 salida normal
    proceso.stdout.on('data', (data) => {
      event.sender.send('robocopy-output', data.toString());
    });

    // ⚠️ errores
    proceso.stderr.on('data', (data) => {
      event.sender.send('robocopy-output', data.toString());
    });

    // ❌ error del proceso
    proceso.on('error', (err) => {
      event.sender.send('robocopy-output', 'ERROR: ' + err.message + '\n');
    });

    // ✅ finalización
    proceso.on('close', (code) => {
      event.sender.send('robocopy-fin', code);
    });

  } catch (err) {
    event.sender.send('robocopy-output', 'ERROR GENERAL: ' + err.message + '\n');
  }

});

// ===============================
// 📁 VERIFICAR SI CARPETA EXISTE
// ===============================
ipcMain.handle('verificar-carpeta', async (event, ruta) => {
  try {
    return fs.existsSync(ruta);
  } catch (error) {
    console.error('Error al verificar carpeta:', error);
    return false;
  }
});

// ===============================
// 📂 LISTAR SUBCARPETAS
// ===============================
ipcMain.handle('listar-subcarpetas', async (event, ruta) => {
  try {
    if (!fs.existsSync(ruta)) {
      return [];
    }
    
    const items = fs.readdirSync(ruta);
    const subcarpetas = [];
    
    for (const item of items) {
      const rutaCompleta = path.join(ruta, item);
      const stats = fs.statSync(rutaCompleta);
      if (stats.isDirectory()) {
        subcarpetas.push(item);
      }
    }
    
    return subcarpetas;
  } catch (error) {
    console.error('Error al listar subcarpetas:', error);
    return [];
  }
});