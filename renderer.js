// ===============================
// 📦 VARIABLES GLOBALES
// ===============================
let seleccionados = [];
let discoSeleccionado = "";
let discosBackupSeleccionados = [];
let carpetasSeleccionadas = [];
let procesoActivo = false;

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
  
  // ESCUCHAR CAMBIOS EN EL INPUT de nombreDestino
  input.addEventListener('change', async () => {
    if (discoSeleccionado) {
      await verificarYGenerarNombreRespaldo();
    }
  });
  
  // Botón para actualizar manualmente
  const btnActualizar = document.createElement('button');
  btnActualizar.textContent = '🔄 Actualizar';
  btnActualizar.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
  btnActualizar.style.marginLeft = '10px';
  btnActualizar.style.padding = '5px 12px';
  btnActualizar.style.fontSize = '11px';
  btnActualizar.style.borderRadius = '8px';
  btnActualizar.onclick = async () => {
    if (discoSeleccionado) {
      await verificarYGenerarNombreRespaldo();
    } else {
      alert('Primero selecciona un disco destino');
    }
  };
  
  // Agregar el botón junto al input
  const configCard = document.querySelector('.card:has(#nombreDestino)');
  if (configCard) {
    const inputContainer = configCard.querySelector('label').parentNode;
    btnActualizar.style.display = 'inline-block';
    inputContainer.appendChild(btnActualizar);
  }
  
  // Esperar a que se seleccione el disco destino
  const esperarDisco = setInterval(async () => {
    if (discoSeleccionado) {
      await verificarYGenerarNombreRespaldo();
      clearInterval(esperarDisco);
    }
  }, 500);
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

    radio.addEventListener('change', async () => {
      discoSeleccionado = disco;
      document.getElementById('errorDisco').style.display = 'none';
      await verificarYGenerarNombreRespaldo();
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
// 📊 ACTUALIZAR PROGRESO
// ===============================
function actualizarProgreso(porcentaje, mensaje = '') {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  if (progressBar && progressText) {
    porcentaje = Math.min(100, Math.max(0, porcentaje));
    progressBar.style.width = `${porcentaje}%`;
    
    if (mensaje) {
      progressText.textContent = mensaje;
    } else {
      progressText.textContent = `${Math.round(porcentaje)}% Completado`;
    }
    
    if (porcentaje === 100) {
      progressText.style.color = '#4ade80';
      progressText.textContent = '✅ ¡COMPLETADO! 100%';
    } else if (porcentaje > 75) {
      progressText.style.color = '#f59e0b';
    } else {
      progressText.style.color = '#22c55e';
    }
  }
}

// ===============================
// 📁 VERIFICAR Y GENERAR NOMBRE DE RESPALDO
// ===============================
async function verificarYGenerarNombreRespaldo() {
  const nombreInput = document.getElementById('nombreDestino');
  const valorActual = nombreInput.value.trim();
  
  if (!discoSeleccionado) {
    console.log('No hay disco seleccionado');
    return;
  }
  
  // Separar la ruta base y el nombre de PC
  const ultimaBarra = valorActual.lastIndexOf('\\');
  const basePath = valorActual.substring(0, ultimaBarra);
  
  // Si no hay barra invertida, usar un valor por defecto
  if (ultimaBarra === -1) {
    console.log('Formato no reconocido, usando BACKUP-2026 como base');
    const nuevoNombre = `BACKUP-2026\\PC-01`;
    nombreInput.value = nuevoNombre;
    mostrarCarpetasEncontradas([]);
    return;
  }
  
  const rutaCompleta = `${discoSeleccionado}${basePath}`;
  
  try {
    // Verificar si la carpeta base existe
    const existeBase = await window.api.verificarCarpeta(rutaCompleta);
    
    if (!existeBase) {
      console.log('La carpeta base no existe, usando PC-01');
      // Limpiar el contenedor de carpetas existentes
      mostrarCarpetasEncontradas([]);
      // Establecer PC-01 como valor por defecto
      const nuevoNombre = `${basePath}\\PC-01`;
      nombreInput.value = nuevoNombre;
      return;
    }
    
    // Listar todas las subcarpetas en la ruta base
    const subcarpetas = await window.api.listarSubcarpetas(rutaCompleta);
    
    // Filtrar solo las que comienzan con "PC-"
    const carpetasPC = subcarpetas.filter(carpeta => 
      carpeta.match(/^PC-\d+$/i)
    );
    
    // Ordenar numéricamente
    carpetasPC.sort((a, b) => {
      const numA = parseInt(a.match(/PC-(\d+)/)[1]);
      const numB = parseInt(b.match(/PC-(\d+)/)[1]);
      return numA - numB;
    });
    
    // Mostrar las carpetas encontradas
    mostrarCarpetasEncontradas(carpetasPC);
    
    // Si no hay carpetas PC, usar PC-01
    if (carpetasPC.length === 0) {
      console.log('No se encontraron carpetas PC, usando PC-01');
      const nuevoNombre = `${basePath}\\PC-01`;
      nombreInput.value = nuevoNombre;
      return;
    }
    
    // Encontrar el número más alto
    let maxNumero = 0;
    carpetasPC.forEach(carpeta => {
      const match = carpeta.match(/PC-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumero) maxNumero = num;
      }
    });
    
    // Generar el siguiente número
    const siguienteNumero = maxNumero + 1;
    const siguientePC = `PC-${siguienteNumero.toString().padStart(2, '0')}`;
    const nuevoNombre = `${basePath}\\${siguientePC}`;
    
    // Actualizar el input
    nombreInput.value = nuevoNombre;
    
    console.log(`Carpetas encontradas en ${discoSeleccionado}: ${carpetasPC.join(', ')}`);
    console.log(`Siguiente nombre: ${nuevoNombre}`);
    
  } catch (error) {
    console.error('Error al verificar carpetas:', error);
    // En caso de error, establecer PC-01 por defecto
    const nuevoNombre = `${basePath}\\PC-01`;
    nombreInput.value = nuevoNombre;
    mostrarCarpetasEncontradas([]);
  }
}

// ===============================
// 📋 MOSTRAR CARPETAS ENCONTRADAS
// ===============================
function mostrarCarpetasEncontradas(carpetas) {
  const container = document.getElementById('carpetasExistentesContainer');
  
  if (!container) {
    console.error('No se encontró el contenedor carpetasExistentesContainer');
    return;
  }
  
  container.innerHTML = '';
  
  // Mostrar el disco actual
  const discoInfo = document.createElement('div');
  discoInfo.style.display = 'flex';
  discoInfo.style.alignItems = 'center';
  discoInfo.style.gap = '6px';
  discoInfo.style.marginBottom = '8px';
  discoInfo.style.fontSize = '11px';
  discoInfo.style.color = '#94a3b8';
  discoInfo.innerHTML = `<span>💾 Disco:</span> <strong style="color: #22c55e;">${discoSeleccionado}</strong>`;
  container.appendChild(discoInfo);
  
  if (carpetas.length === 0) {
    // Mostrar mensaje cuando no hay respaldos
    const mensaje = document.createElement('div');
    mensaje.style.display = 'flex';
    mensaje.style.alignItems = 'center';
    mensaje.style.gap = '8px';
    mensaje.style.padding = '6px 10px';
    mensaje.style.background = 'rgba(100, 116, 139, 0.1)';
    mensaje.style.borderRadius = '6px';
    mensaje.style.color = '#94a3b8';
    mensaje.style.fontSize = '12px';
    mensaje.innerHTML = '📭 No hay respaldos previos en este disco';
    container.appendChild(mensaje);
    return;
  }
  
  // Crear contenedor flex para los badges
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexWrap = 'wrap';
  wrapper.style.gap = '8px';
  wrapper.style.alignItems = 'center';
  wrapper.style.marginTop = '5px';
  
  // Agregar etiqueta de "Existentes:"
  const labelExistente = document.createElement('span');
  labelExistente.style.fontSize = '11px';
  labelExistente.style.color = '#94a3b8';
  labelExistente.style.marginRight = '5px';
  labelExistente.textContent = 'Existentes:';
  wrapper.appendChild(labelExistente);
  
  carpetas.forEach(carpeta => {
    const badge = document.createElement('div');
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.gap = '5px';
    badge.style.padding = '4px 10px';
    badge.style.background = 'rgba(34, 197, 94, 0.15)';
    badge.style.border = '1px solid rgba(34, 197, 94, 0.3)';
    badge.style.borderRadius = '6px';
    badge.style.fontSize = '11px';
    badge.style.fontWeight = '500';
    badge.style.color = '#4ade80';
    badge.style.transition = 'all 0.2s ease';
    badge.innerHTML = `📁 ${carpeta}`;
    
    badge.onmouseenter = () => {
      badge.style.background = 'rgba(34, 197, 94, 0.25)';
      badge.style.transform = 'translateY(-1px)';
      badge.style.borderColor = 'rgba(34, 197, 94, 0.5)';
    };
    badge.onmouseleave = () => {
      badge.style.background = 'rgba(34, 197, 94, 0.15)';
      badge.style.transform = 'translateY(0)';
      badge.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    };
    
    wrapper.appendChild(badge);
  });
  
  container.appendChild(wrapper);
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

  const opcionesUsuarios = "/E /Z /R:1 /W:1 /V /FP /TEE /NP";
  const opcionesDisco = "/E /Z /R:1 /W:1 /V /FP /TEE /XJ /MT:8 /NP";

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
        comandos += `robocopy "${origen}" "${destino}" ${opcionesUsuarios}\n\n`;
      });
    });
  }

  if (discosBackupSeleccionados.length > 0) {
    discosBackupSeleccionados.forEach(discoOrigen => {
      const letraUnidad = discoOrigen.charAt(0);
      const origen = discoOrigen;
      const destino = `${discoSeleccionado}${nombre}\\${letraUnidad}`;
      
      comandos += `if not exist "${destino}" mkdir "${destino}"\n`;
      comandos += `echo ==============================\n`;
      comandos += `echo Clonando disco ${discoOrigen}\n`;
      comandos += `echo ==============================\n`;
      
      comandos += `robocopy ${origen} ${destino} /E /COPY:DAT /R:1 /W:1 /XJ /MT:8 `;
      comandos += `/XD "${origen}$Recycle.Bin" `;
      comandos += `"${origen}System Volume Information" `;
      comandos += `"${origen}Windows\\Temp" `;
      comandos += `"${origen}Windows\\Logs" `;
      comandos += `"${origen}Windows\\SoftwareDistribution" `;
      comandos += `"${origen}ProgramData\\Microsoft\\Windows\\WER" `;
      comandos += `"${origen}ProgramData\\Package Cache"\n`;
      
      comandos += `attrib -s -h "${destino}" /S /D\n`;
      comandos += `echo ✅ Disco ${discoOrigen} clonado en ${destino}\n\n`;
    });
  }

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
  if (procesoActivo) {
    alert('Ya hay un proceso en ejecución');
    return;
  }
  
  let comando = document.getElementById('comandos').value;
  if (!comando) {
    alert('Primero genera los comandos');
    return;
  }

  procesoActivo = true;
  actualizarProgreso(0, 'Iniciando...');
  
  window.api.removeListeners();
  comando = comando.replace('pause', '');

  const logArea = document.getElementById('logOutput');
  logArea.value = "";
  
  let lineasProcesadas = 0;

  window.api.onOutput((data) => {
    logArea.value += data;
    logArea.scrollTop = logArea.scrollHeight;
    
    const lineas = data.split('\n');
    
    for (const linea of lineas) {
      const progresoMatch = linea.match(/(\d{1,3})%\s+[\w\s\.\-]+/);
      if (progresoMatch) {
        const porcentaje = parseInt(progresoMatch[1]);
        if (!isNaN(porcentaje)) {
          actualizarProgreso(porcentaje, `Copiando... ${porcentaje}%`);
        }
      }
      
      if (linea.includes('Copiado')) {
        lineasProcesadas++;
        const progresoEstimado = Math.min(95, (lineasProcesadas / 100) * 95);
        actualizarProgreso(progresoEstimado, `Archivos procesados: ${lineasProcesadas}`);
      }
    }
  });

  window.api.onFin((code) => {
    const mensajeFinal = `\n✅ Proceso finalizado (código: ${code})`;
    logArea.value += mensajeFinal;
    
    if (code === 0 || code === 1) {
      actualizarProgreso(100, '✅ Completado 100%');
    } else if (code === 2 || code === 3) {
      actualizarProgreso(100, '⚠️ Completado con advertencias');
    } else {
      actualizarProgreso(0, '❌ Error en el proceso');
    }
    
    procesoActivo = false;
  });

  window.api.ejecutarRobocopy(comando);
}

// ===============================
// 📋 COPIAR
// ===============================
function copiarPortapapeles() {
  const texto = document.getElementById('comandos').value;
  if (!texto) return;

  navigator.clipboard.writeText(texto);
  alert('Comandos copiados al portapapeles');
}

// ===============================
// 🧼 LIMPIAR
// ===============================
function limpiarTodo() {
  document.getElementById('comandos').value = "";
  document.getElementById('logOutput').value = "";
  actualizarProgreso(0, '0%');
  
  seleccionados = [];
  discosBackupSeleccionados = [];
  carpetasSeleccionadas = [];
  procesoActivo = false;
  
  document.querySelectorAll('#lista input').forEach(chk => chk.checked = false);
  document.querySelectorAll('#discosBackup input').forEach(chk => chk.checked = false);
  document.querySelectorAll('#discos input').forEach(radio => radio.checked = false);
  
  discoSeleccionado = "";
}