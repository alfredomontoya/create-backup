// ===============================
// 📦 VARIABLES GLOBALES
// ===============================
let seleccionados = [];
let discoSeleccionado = "";
let discosBackupSeleccionados = [];
let carpetasSeleccionadas = [];


// ===============================
// 🚀 INICIALIZACIÓN
// ===============================
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


// ===============================
// 📂 CARGAR USUARIOS
// ===============================
async function cargarDirectorios() {
  const dirs = await window.api.listarDirectorios();
  const contenedor = document.getElementById('lista');
  contenedor.innerHTML = '';

  dirs.forEach(dir => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = dir;

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        if (!seleccionados.includes(dir)) seleccionados.push(dir);
      } else {
        seleccionados = seleccionados.filter(d => d !== dir);
      }
    });

    const label = document.createElement('label');
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + dir));

    contenedor.appendChild(label);
  });
}


// ===============================
// 💾 DISCO PRINCIPAL
// ===============================
async function cargarDiscos() {
  const discos = await window.api.listarDiscos();
  const contenedor = document.getElementById('discos');
  contenedor.innerHTML = '';

  discos.forEach(disco => {
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'disco';
    radio.value = disco;

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


// ===============================
// 💽 DISCOS BACKUP
// ===============================
async function cargarDiscosBackup() {
  const discos = await window.api.listarDiscos();
  const contenedor = document.getElementById('discosBackup');
  contenedor.innerHTML = '';

  discos.forEach(disco => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = disco;

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        if (!discosBackupSeleccionados.includes(disco)) {
          discosBackupSeleccionados.push(disco);
        }
      } else {
        discosBackupSeleccionados =
          discosBackupSeleccionados.filter(d => d !== disco);
      }
    });

    const label = document.createElement('label');
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + disco));

    contenedor.appendChild(label);
  });
}


// ===============================
// 📂 CARPETAS SELECCIONADAS
// ===============================
function obtenerCarpetasSeleccionadas() {
  carpetasSeleccionadas = [];

  document.querySelectorAll('#carpetas input').forEach(chk => {
    if (chk.checked) {
      carpetasSeleccionadas.push(chk.value);
    }
  });
}


// ===============================
// 🧠 GENERAR COMANDOS
// ===============================
function generarComandos() {

  const nombre = document.getElementById('nombreDestino').value.trim();
  const textarea = document.getElementById('comandos');

  if (!nombre) {
    textarea.value = "⚠️ Debes ingresar un nombre de destino";
    return;
  }

  if (!discoSeleccionado) {
    textarea.value = "⚠️ Debes seleccionar un disco destino";
    return;
  }

  let comandos = "@echo off\n\n";
  comandos += "echo Iniciando proceso...\n\n";

  // ===============================
  // 🔹 OPCIONES ROBOCOPY
  // ===============================
  const opcionesUsuarios = "/E /Z /R:1 /W:1 /V /FP /TEE";
  const opcionesDisco = "/E /Z /R:1 /W:1 /V /FP /TEE /XJ /MT:8";

  // ===============================
  // 🔹 1) COPIA DE USUARIOS (SOLO AL DISCO DESTINO)
  // ===============================
  if (seleccionados.length > 0) {

    obtenerCarpetasSeleccionadas();

    if (carpetasSeleccionadas.length === 0) {
      textarea.value = "⚠️ Debes seleccionar carpetas de usuario";
      return;
    }

    seleccionados.forEach(usuario => {

      comandos += `echo ==============================\n`;
      comandos += `echo Usuario: ${usuario}\n`;
      comandos += `echo ==============================\n\n`;

      carpetasSeleccionadas.forEach(carpeta => {

        const origen = `C:\\Users\\${usuario}\\${carpeta}`;
        const destino = `${discoSeleccionado}${nombre}\\Users\\${usuario}\\${carpeta}`;

        // ✅ SOLO UNA LINEA (sin duplicados)
        comandos += `robocopy "${origen}" "${destino}" ${opcionesUsuarios}\n\n`;
      });
    });
  }

  // ===============================
  // 🔹 2) CLONACIÓN DE DISCOS
  // ===============================
  if (discosBackupSeleccionados.length > 0) {

    discosBackupSeleccionados.forEach(discoOrigen => {

      const letra = discoOrigen.replace(":\\", "");
      const origen = `${discoOrigen}`;
      const destino = `${discoSeleccionado}${nombre}\\${letra}\\`;

      // 🔥 EXCLUSIONES DEL SISTEMA
      const excluir = `/XD `
        + `"${discoOrigen}$Recycle.Bin" `
        + `"${discoOrigen}System Volume Information" `
        + `"${discoOrigen}Windows\\Temp" `
        + `"${discoOrigen}Windows\\Logs" `
        + `"${discoOrigen}Windows\\SoftwareDistribution" `
        + `"${discoOrigen}ProgramData\\Microsoft\\Windows\\WER" `
        + `"${discoOrigen}ProgramData\\Package Cache"`;

      comandos += `echo ==============================\n`;
      comandos += `echo Clonando disco ${discoOrigen}\n`;
      comandos += `echo ==============================\n`;

      comandos += `robocopy "${origen}" "${destino}" ${opcionesDisco} ${excluir}\n\n`;
    });
  }

  // ===============================
  // FINAL
  // ===============================
  comandos += "echo ==============================\n";
  comandos += "echo Proceso finalizado\n";
  comandos += "echo ==============================\n";
  comandos += "pause";

  textarea.value = comandos;
}
// ===============================
// ▶ EJECUTAR BACKUP
// ===============================
function ejecutarBackup() {
  let comando = document.getElementById('comandos').value;
  if (!comando) return;

  window.api.removeListeners();
  comando = comando.replace('pause', '');

  const logArea = document.getElementById('logOutput');
  logArea.value = "";

  window.api.ejecutarRobocopy(comando);

  window.api.onOutput((data) => {
    logArea.value += data;
  });

  window.api.onFin((code) => {
    logArea.value += `\nFinalizado (code: ${code})`;
  });
}


// ===============================
// 📋 COPIAR
// ===============================
function copiarPortapapeles() {
  const texto = document.getElementById('comandos').value;
  if (!texto) return;

  navigator.clipboard.writeText(texto);
}


// ===============================
// 🧼 LIMPIAR
// ===============================
function limpiarTodo() {
  document.getElementById('comandos').value = "";
  document.getElementById('logOutput').value = "";

  console.log("Limpiando selecciones...");
//   seleccionados = [];
//   discosBackupSeleccionados = [];
//   carpetasSeleccionadas = [];
}