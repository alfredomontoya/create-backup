let seleccionados = [];
let discoSeleccionado = "";
let discosBackupSeleccionados = [];
let carpetasSeleccionadas = [];

window.onload = async () => {
  await cargarDirectorios();
  await cargarDiscos();
  await cargarDiscosBackup();

  document.getElementById('btnGenerar').addEventListener('click', generarComandos);
  document.getElementById('btnCopiar').addEventListener('click', copiarPortapapeles);
  document.getElementById('btnEjecutar').addEventListener('click', ejecutarBackup);
  document.getElementById('btnLimpiar').addEventListener('click', limpiarTodo);

  const input = document.getElementById('nombreDestino');
  const errorDiv = document.getElementById('errorNombre');

  input.addEventListener('input', () => {
    input.classList.remove('input-error');
    errorDiv.style.display = 'none';
  });

  document.querySelectorAll('#carpetas input').forEach(chk => {
    chk.addEventListener('change', () => {
      document.getElementById('errorCarpetas').style.display = 'none';
    });
  });
};


// 📂 usuarios
async function cargarDirectorios() {
  const dirs = await window.api.listarDirectorios();
  const contenedor = document.getElementById('lista');
  contenedor.innerHTML = '';

  dirs.forEach(dir => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) seleccionados.push(dir);
      else seleccionados = seleccionados.filter(d => d !== dir);
    });

    const label = document.createElement('label');
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + dir));

    contenedor.appendChild(label);
  });
}


// 💾 discos
async function cargarDiscos() {
  const discos = await window.api.listarDiscos();
  const contenedor = document.getElementById('discos');
  contenedor.innerHTML = '';

  discos.forEach(disco => {
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'disco';

    radio.addEventListener('change', () => {
      discoSeleccionado = disco;
      document.getElementById('errorDisco').style.display = 'none';
    });

    const label = document.createElement('label');
    label.appendChild(radio);
    label.appendChild(document.createTextNode(' ' + disco));

    contenedor.appendChild(label);
  });
}


// 💽 backup
async function cargarDiscosBackup() {
  const discos = await window.api.listarDiscos();
  const contenedor = document.getElementById('discosBackup');
  contenedor.innerHTML = '';

  discos.forEach(disco => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) discosBackupSeleccionados.push(disco);
      else discosBackupSeleccionados = discosBackupSeleccionados.filter(d => d !== disco);
    });

    const label = document.createElement('label');
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + disco));

    contenedor.appendChild(label);
  });
}


// 📂 carpetas seleccionadas
function obtenerCarpetasSeleccionadas() {
  carpetasSeleccionadas = [];
  document.querySelectorAll('#carpetas input').forEach(chk => {
    if (chk.checked) carpetasSeleccionadas.push(chk.value);
  });
}


// 🚀 generar comandos
function generarComandos() {
  const nombreInput = document.getElementById('nombreDestino');
  const errorNombre = document.getElementById('errorNombre');
  const errorDisco = document.getElementById('errorDisco');
  const errorCarpetas = document.getElementById('errorCarpetas');
  const textarea = document.getElementById('comandos');

  let valido = true;

  nombreInput.classList.remove('input-error');
  errorNombre.style.display = 'none';
  errorDisco.style.display = 'none';
  errorCarpetas.style.display = 'none';

  const nombre = nombreInput.value.trim();

  if (!nombre) {
    nombreInput.classList.add('input-error');
    errorNombre.style.display = 'block';
    valido = false;
  }

  if (!discoSeleccionado) {
    errorDisco.style.display = 'block';
    valido = false;
  }

  if (seleccionados.length === 0) {
    textarea.value = "⚠️ Debes seleccionar al menos un usuario\n";
    return;
  }

  obtenerCarpetasSeleccionadas();

  if (carpetasSeleccionadas.length === 0) {
    errorCarpetas.style.display = 'block';
    valido = false;
  }

  if (!valido) return;

  let comandos = "@echo off\n\n";
  comandos += "echo Iniciando backup...\n\n";

  const opciones = "/E /Z /R:3 /W:5 /V /FP /TEE";

  seleccionados.forEach(usuario => {
    comandos += `echo ==============================\n`;
    comandos += `echo Usuario: ${usuario}\n`;
    comandos += `echo ==============================\n\n`;

    carpetasSeleccionadas.forEach(carpeta => {

      const origen = `C:\\Users\\${usuario}\\${carpeta}`;
      const destino = `${discoSeleccionado}${nombre}\\Users\\${usuario}\\${carpeta}`;

      comandos += `echo Copiando ${carpeta}...\n`;
      comandos += `robocopy "${origen}" "${destino}" ${opciones} || echo ERROR en ${carpeta}\n`;

      discosBackupSeleccionados.forEach(disco => {
        const destinoBackup = `${disco}${nombre}\\Users\\${usuario}\\${carpeta}`;
        comandos += `robocopy "${origen}" "${destinoBackup}" ${opciones} || echo ERROR en backup ${carpeta}\n`;
      });

      comandos += "\n";
    });

    comandos += "\n";
  });

  comandos += "echo ==============================\n";
  comandos += "echo Backup finalizado\n";
  comandos += "echo ==============================\n";
  comandos += "pause";

  textarea.value = comandos;
}


// ▶ ejecutar backup
function ejecutarBackup() {
  let comando = document.getElementById('comandos').value;
  if (!comando) return;

  // 🔥 limpiar listeners anteriores
  window.api.removeListeners();

  // ❗ solo eliminar pause
  comando = comando.replace('pause', '');

  const logArea = document.getElementById('logOutput');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  logArea.value = "";
  progressBar.style.width = "0%";
  progressText.innerText = "0%";

  window.api.ejecutarRobocopy(comando);

  window.api.onOutput((data) => {
    logArea.value += data;
    logArea.scrollTop = logArea.scrollHeight;

    const match = data.match(/(\d+)%/);
    if (match) {
      const porcentaje = parseInt(match[1]);
      progressBar.style.width = porcentaje + "%";
      progressText.innerText = porcentaje + "%";
    }
  });

  window.api.onFin((code) => {
    logArea.value += `\n\nFinalizado (code: ${code})`;

    if (code <= 7) {
      progressBar.style.width = "100%";
      progressText.innerText = "100% ✅";
    } else {
      progressText.innerText = "Error ❌";
    }
  });
}


// 📋 copiar
function copiarPortapapeles() {
  const texto = document.getElementById('comandos').value;
  if (!texto) return;
  navigator.clipboard.writeText(texto);
}


// 🧼 limpiar todo
function limpiarTodo() {
  document.getElementById('comandos').value = "";
  document.getElementById('logOutput').value = "";

  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  progressBar.style.width = "0%";
  progressText.innerText = "0%";
}