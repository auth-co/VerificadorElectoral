const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Carpetas y archivos
  obtenerCarpetaTrabajo: () => ipcRenderer.invoke('obtener-carpeta-trabajo'),
  seleccionarPDFs: () => ipcRenderer.invoke('seleccionar-pdfs'),
  seleccionarCSV: () => ipcRenderer.invoke('seleccionar-csv'),
  seleccionarCarpetaMMV: () => ipcRenderer.invoke('seleccionar-carpeta-mmv'),
  abrirCarpeta: (ruta) => ipcRenderer.invoke('abrir-carpeta', ruta),
  abrirRuta: (rutaAbsoluta) => ipcRenderer.invoke('abrir-ruta', rutaAbsoluta),
  abrirURL: (url) => ipcRenderer.invoke('abrir-url', url),

  // Configuracion
  guardarConfiguracion: (config) => ipcRenderer.invoke('guardar-configuracion', config),
  cargarConfiguracion: () => ipcRenderer.invoke('cargar-configuracion'),

  // Integracion con R
  verificarR: () => ipcRenderer.invoke('verificar-r'),
  convertirPDFaCSVv2: (params) => ipcRenderer.invoke('convertir-pdf-csv-v2', params),
  cancelarProcesoR: () => ipcRenderer.invoke('cancelar-proceso-r'),
  fusionarCSVs: () => ipcRenderer.invoke('fusionar-csvs'),
  leerLogProceso: () => ipcRenderer.invoke('leer-log-proceso'),
  obtenerFallidos: () => ipcRenderer.invoke('obtener-fallidos'),
  abrirCarpetaCoordenadas: () => ipcRenderer.invoke('abrir-carpeta-coordenadas'),

  // Comparacion E14-E24
  seleccionarCarpetaSalida: () => ipcRenderer.invoke('seleccionar-carpeta-salida'),
  compararE14E24: (archivoCSV, carpetaMMV, carpetaSalida) => ipcRenderer.invoke('comparar-e14-e24', archivoCSV, carpetaMMV, carpetaSalida),
  abrirResultados: () => ipcRenderer.invoke('abrir-resultados'),

  // Eventos de R
  onEventoR: (callback) => {
    ipcRenderer.on('r-evento', (event, data) => callback(data));
  },
  removeEventoR: () => {
    ipcRenderer.removeAllListeners('r-evento');
  },

  // Security - USB validation
  obtenerSecurityStatus: () => ipcRenderer.invoke('obtener-security-status'),
  onSecurityStatus: (callback) => {
    ipcRenderer.on('security-status', (event, data) => callback(data));
  },
  removeSecurityStatus: () => {
    ipcRenderer.removeAllListeners('security-status');
  },

  // Auto-Update
  descargarActualizacion: () => ipcRenderer.invoke('descargar-actualizacion'),
  instalarActualizacion: () => ipcRenderer.invoke('instalar-actualizacion'),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, data) => callback(data));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, data) => callback(data));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, data) => callback(data));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, data) => callback(data));
  },
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available');
    ipcRenderer.removeAllListeners('update-progress');
    ipcRenderer.removeAllListeners('update-downloaded');
    ipcRenderer.removeAllListeners('update-error');
  },

  // Google Drive auto-upload
  autoUploadDrive: (params) => ipcRenderer.invoke('auto-upload-drive', params),

  // Info del sistema
  plataforma: process.platform,
  version: process.versions.electron
});
