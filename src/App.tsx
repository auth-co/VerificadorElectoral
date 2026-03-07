import { useState, useEffect, useRef } from 'react';
import ejemploFormatos from './assets/ejemplo-formatos-e14-e24.png';
import guiaDriveHojas from './assets/guia-drive-hojas-calculo.png';
import {
  getDepartamentos,
  getMunicipiosByDepartamento,
  getZonasByMunicipio,
  getCircunscripcionesCITREP,
  getDepartamentosByCITREP,
  getMunicipiosByCITREP,
  getZonasCITREP,
  getCodigoDepartamento,
  getCodigoMunicipio,
} from './divipoleData';
import type { Seccion, TipoError, ArchivoExitoso, ArchivoFallido, DiscrepanciaFila, EventoR, ResultadoComparacion } from './types';
import { TAB_COLORS, URL_REGISTRADURIA, getVisibleTabs, TIPOS_ELECCION, FEATURE_FLAGS } from './constants';
import { clasificarError } from './utils/clasificarError';
import { useSecurity } from './hooks/useSecurity';
import { useAutoUpdate } from './hooks/useAutoUpdate';
import { useElectronConfig } from './hooks/useElectronConfig';
import SecurityOverlay from './components/SecurityOverlay';
import UpdateModal from './components/UpdateModal';
import Header from './components/Header';
import ModalErrores from './components/ModalErrores';
import Modal from './components/Modal';
import TabInformacion from './components/tabs/TabInformacion';
import TabIdentificacion from './components/tabs/TabIdentificacion';
import TabExtraccion from './components/tabs/TabExtraccion';
import TabComparacionAutomatica from './components/tabs/TabComparacionAutomatica';
import TabComparacionArchivos from './components/tabs/TabComparacionArchivos';
import TabComparacionManual from './components/tabs/TabComparacionManual';

export default function App() {
  const { status: securityStatus, message: securityMessage, tier: securityTier } = useSecurity();
  const update = useAutoUpdate();
  const { carpetaTrabajo, config, setConfig } = useElectronConfig();

  const [seccionActiva, setSeccionActiva] = useState<Seccion>('informacion');

  // Cuando el tier llega desde la USB, redirigir a la primera pestaña visible si la actual no pertenece al tier
  useEffect(() => {
    const visibles = getVisibleTabs(securityTier);
    if (!visibles.includes(seccionActiva)) {
      setSeccionActiva(visibles[0]);
    }
  }, [securityTier]);

  // Identification state - synced with useElectronConfig
  const { tipoEleccion, circunscripcion, departamento, municipio, zona, keyAsignada } = config;
  const setField = (field: string) => (value: string) => setConfig(prev => ({ ...prev, [field]: value }));

  // Extraction state
  const [archivosPDF, setArchivosPDF] = useState<string[]>([]);
  const [conversionEnProgreso, setConversionEnProgreso] = useState(false);
  const [conversionCompleta, setConversionCompleta] = useState(false);
  const [archivosExitosos, setArchivosExitosos] = useState<ArchivoExitoso[]>([]);
  const [archivosFallidos, setArchivosFallidos] = useState<ArchivoFallido[]>([]);
  const [archivoActual, setArchivoActual] = useState('');
  const [progresoActual, setProgresoActual] = useState({ actual: 0, total: 0 });
  const [loteInfo, setLoteInfo] = useState({ actual: 0, total: 0 });
  const [csvsGenerados, setCsvsGenerados] = useState<string[]>([]);
  const [mensajeEstado, setMensajeEstado] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [errorDetectado, setErrorDetectado] = useState<{ tipo: TipoError; mensaje: string } | null>(null);
  const errorDetectadoRef = useRef<{ tipo: TipoError; mensaje: string } | null>(null);
  const canceladoRef = useRef(false);

  // Confirmation modal
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);

  // Info tab state
  const [mostrarEjemploFormatos, setMostrarEjemploFormatos] = useState(false);
  const [mostrarGuiaDrive, setMostrarGuiaDrive] = useState(false);
  const [checkZonas, setCheckZonas] = useState(false);
  const [checkKey, setCheckKey] = useState(false);
  const [checkE14, setCheckE14] = useState(false);

  // Extraction checklist
  const [checkCsvSubidos, setCheckCsvSubidos] = useState(false);
  const [checkTotales, setCheckTotales] = useState(false);
  const [checkMmv, setCheckMmv] = useState(false);

  // Comparacion automatica checklist
  const [checkMigaPan, setCheckMigaPan] = useState(false);

  // Comparacion archivos state
  const [archivoCSV, setArchivoCSV] = useState<string | null>(null);
  const [carpetaMMV, setCarpetaMMV] = useState<string | null>(null);
  const [progresoComparacion, setProgresoComparacion] = useState(0);
  const [comparacionCompleta, setComparacionCompleta] = useState(false);
  const [comparacionEnProgreso, setComparacionEnProgreso] = useState(false);
  const [resultadoComparacion, setResultadoComparacion] = useState<ResultadoComparacion | null>(null);
  const [errorComparacion, setErrorComparacion] = useState<string | null>(null);
  const [discrepanciasDetalle, setDiscrepanciasDetalle] = useState<DiscrepanciaFila[]>([]);

  // Cascading selects
  const esCITREP = tipoEleccion === 'CITREP';
  const tiposEleccion = TIPOS_ELECCION;
  const circunscripcionesCITREP = esCITREP ? getCircunscripcionesCITREP() : [];
  const departamentosFiltrados = esCITREP
    ? (circunscripcion ? getDepartamentosByCITREP(circunscripcion) : [])
    : getDepartamentos();
  const municipiosFiltrados = departamento
    ? (esCITREP ? getMunicipiosByCITREP(circunscripcion, departamento) : getMunicipiosByDepartamento(departamento))
    : [];
  const zonasFiltradas = (departamento && municipio)
    ? (esCITREP ? getZonasCITREP(circunscripcion, departamento, municipio) : getZonasByMunicipio(departamento, municipio))
    : [];

  // Cascading reset effects
  useEffect(() => { setConfig(p => ({ ...p, circunscripcion: '', departamento: '', municipio: '', zona: '' })); }, [tipoEleccion]);
  useEffect(() => { setConfig(p => ({ ...p, departamento: '', municipio: '', zona: '' })); }, [circunscripcion]);
  useEffect(() => { setConfig(p => ({ ...p, municipio: '', zona: '' })); }, [departamento]);
  useEffect(() => { setConfig(p => ({ ...p, zona: '' })); }, [municipio]);

  const porcentajeProgreso = progresoActual.total > 0
    ? Math.round((progresoActual.actual / progresoActual.total) * 100) : 0;

  // === Handlers ===

  const handleContinuar = async () => {
    if (seccionActiva === 'identificacion') {
      const camposCompletos = esCITREP
        ? (tipoEleccion && circunscripcion && departamento && municipio && zona && keyAsignada)
        : (tipoEleccion && departamento && municipio && zona && keyAsignada);
      if (camposCompletos) {
        setMostrarModalConfirmacion(true);
      } else {
        alert('Por favor completa todos los campos antes de continuar');
      }
      return;
    }
    const visibleTabs = getVisibleTabs(securityTier);
    const currentIndex = visibleTabs.indexOf(seccionActiva);
    if (currentIndex >= 0 && currentIndex < visibleTabs.length - 1) {
      setSeccionActiva(visibleTabs[currentIndex + 1]);
    }
  };

  const handleConfirmarIdentificacion = async () => {
    if (window.electronAPI) {
      await window.electronAPI.guardarConfiguracion({ tipoEleccion, circunscripcion, departamento, municipio, zona, keyAsignada });
    }
    setMostrarModalConfirmacion(false);
    const visibleTabs = getVisibleTabs(securityTier);
    const idIndex = visibleTabs.indexOf('identificacion');
    if (idIndex >= 0 && idIndex < visibleTabs.length - 1) {
      setSeccionActiva(visibleTabs[idIndex + 1]);
    }
  };

  const handleSeleccionarPDFs = async () => {
    if (!window.electronAPI) { alert('Función disponible solo en la aplicación de escritorio'); return; }
    const resultado = await window.electronAPI.seleccionarPDFs();
    if (resultado.archivos.length > 0) {
      setArchivosPDF(resultado.archivos);
      setConversionCompleta(false);
      setArchivosExitosos([]);
      setArchivosFallidos([]);
      setCsvsGenerados([]);
      setMensajeEstado('');
      setProgresoActual({ actual: 0, total: 0 });
      setLoteInfo({ actual: 0, total: 0 });
    }
  };

  const uploadToDrive = (archivoFinal: string) => {
    if (!FEATURE_FLAGS.autoUploadCSV || !window.electronAPI?.autoUploadDrive) return;
    const depCod = getCodigoDepartamento(departamento);
    const munCod = getCodigoMunicipio(departamento, municipio);
    window.electronAPI.autoUploadDrive({
      archivoFinal,
      tipo: tipoEleccion,
      circunscripcion: esCITREP ? circunscripcion : undefined,
      depFolder: `${depCod} - ${departamento}`,
      munFolder: `${munCod} - ${municipio}`,
      zonaFolder: `Zona ${zona.padStart(2, '0')}`,
    }).then(r => {
      if (r.success) console.log('[Drive] Subido:', r.url);
      else console.warn('[Drive] Error al subir:', r.error);
    }).catch(e => console.warn('[Drive] Upload error:', e));
  };

  const handleConvertirCSV = async (archivosAProcesar?: string[]) => {
    const archivos = archivosAProcesar || archivosPDF;
    const esReintento = !!archivosAProcesar;
    if (archivos.length === 0) { alert('No hay archivos para procesar'); return; }
    if (!keyAsignada) { alert('Por favor ingresa una API Key en la sección de Identificación'); return; }
    if (!window.electronAPI) return;

    const rStatus = await window.electronAPI.verificarR();
    if (!rStatus.disponible) {
      alert(`R Portable no responde o no tiene permisos de ejecución.\n\nRuta: ${rStatus.ruta}\n\nReinstala la aplicación o contacta soporte.`);
      return;
    }

    setConversionEnProgreso(true);
    setConversionCompleta(false);
    setMostrarModal(false);
    setErrorDetectado(null);
    errorDetectadoRef.current = null;
    canceladoRef.current = false;

    if (!esReintento) { setArchivosExitosos([]); setArchivosFallidos([]); setCsvsGenerados([]); }
    setArchivoActual('');
    setProgresoActual({ actual: 0, total: archivos.length });
    setMensajeEstado(esReintento ? 'Reintentando archivos fallidos...' : 'Iniciando procesamiento...');

    window.electronAPI.onEventoR((evento: EventoR) => {
      switch (evento.tipo) {
        case 'inicio':
          setProgresoActual({ actual: 0, total: evento.total || 0 });
          setMensajeEstado(`Procesando ${evento.total} archivos...`);
          break;
        case 'lote_inicio':
          setLoteInfo({ actual: evento.lote || 0, total: evento.total_lotes || 0 });
          setMensajeEstado(`Procesando lote ${evento.lote} de ${evento.total_lotes}...`);
          break;
        case 'exito':
          setArchivoActual(evento.archivo || '');
          setProgresoActual(prev => ({ ...prev, actual: evento.indice || prev.actual + 1 }));
          setArchivosExitosos(prev => [...prev, { archivo: evento.archivo || '', filas: evento.filas || 0, validacion: evento.validacion || 'OK' }]);
          break;
        case 'error_archivo': {
          setArchivoActual(evento.archivo || '');
          setProgresoActual(prev => ({ ...prev, actual: evento.indice || prev.actual + 1 }));
          const errorClasificado = clasificarError(evento.error || 'Error desconocido');
          const prioridadError: Record<TipoError, number> = {
            api_key: 10, cuota_excedida: 9, rate_limit: 8, conexion: 7,
            python: 7, servidor: 6, imagen_grande: 5, pdf_corrupto: 4,
            pdf_no_encontrado: 3, respuesta_ia: 2, otro: 1
          };
          setErrorDetectado(prev => {
            const prioridadNuevo = prioridadError[errorClasificado.tipo];
            const prioridadActual = prev ? prioridadError[prev.tipo] : 0;
            const resultado = prioridadNuevo >= prioridadActual ? errorClasificado : prev;
            errorDetectadoRef.current = resultado;
            return resultado;
          });
          const erroresCancelables: TipoError[] = ['api_key', 'cuota_excedida', 'conexion'];
          if (erroresCancelables.includes(errorClasificado.tipo)) {
            setMensajeEstado(`${errorClasificado.mensaje.split('.')[0]} - cancelando...`);
            window.electronAPI?.cancelarProcesoR();
          } else {
            setMensajeEstado(errorClasificado.mensaje.split('.')[0]);
          }
          setArchivosFallidos(prev => [...prev, { archivo: evento.archivo || '', ruta: evento.ruta || '', error: errorClasificado.mensaje }]);
          break;
        }
        case 'error': {
          const errorCritico = clasificarError(evento.mensaje || 'Error desconocido');
          errorDetectadoRef.current = errorCritico;
          setErrorDetectado(errorCritico);
          setMensajeEstado(errorCritico.mensaje.split('.')[0]);
          window.electronAPI?.cancelarProcesoR();
          break;
        }
        case 'lote_guardado':
          setCsvsGenerados(prev => [...prev, evento.nombre || '']);
          setMensajeEstado(`CSV guardado: ${evento.nombre}`);
          break;
        case 'fin':
          setMensajeEstado(`Completado: ${evento.exitosos} exitosos, ${evento.fallidos} fallidos`);
          break;
      }
    });

    let resultado: Awaited<ReturnType<NonNullable<typeof window.electronAPI>['convertirPDFaCSVv2']>> | null = null;
    try {
      resultado = await window.electronAPI.convertirPDFaCSVv2({
        archivos, apiKey: keyAsignada, modo: esReintento ? 'reintento' : 'normal',
        tipoEleccion, codigoDepartamento: getCodigoDepartamento(departamento), circunscripcion
      });
    } catch (err) {
      console.error('Error en convertirPDFaCSVv2:', err);
    } finally {
      window.electronAPI.removeEventoR();
      setConversionEnProgreso(false);
    }

    setConversionCompleta(true);

    if (resultado) {
      if (!resultado.success && resultado.error) {
        setErrorDetectado({ tipo: 'otro', mensaje: resultado.error });
        setMostrarModal(true);
        return;
      }
      // Fix race condition: si R falló pero el error IPC llegó tarde (microtask vs macrotask),
      // usar criticalError del resolve que siempre llega sincrónicamente con el resultado.
      // Se usa ref (no state) para evitar closure stale — el state puede no haber flushed aún.
      if (!resultado.success && resultado.criticalError && !errorDetectadoRef.current) {
        const clasificado = clasificarError(resultado.criticalError);
        errorDetectadoRef.current = clasificado;
        setErrorDetectado(clasificado);
        setMostrarModal(true);
        return;
      }
      if (resultado.procesoLog) {
        if (!esReintento) {
          setArchivosExitosos(resultado.procesoLog.exitosos || []);
          setArchivosFallidos(resultado.procesoLog.fallidos || []);
        } else {
          setArchivosExitosos(prev => {
            const nombresReintentados = new Set(archivos.map(a => a.split(/[/\\]/).pop()));
            return [...prev.filter(e => !nombresReintentados.has(e.archivo)), ...(resultado!.procesoLog?.exitosos || [])];
          });
          setArchivosFallidos(prev => {
            const nombresReintentados = new Set(archivos.map(a => a.split(/[/\\]/).pop()));
            return [...prev.filter(f => !nombresReintentados.has(f.archivo)), ...(resultado!.procesoLog?.fallidos || [])];
          });
        }
      }
      if (resultado.success) {
        const merged = await window.electronAPI.fusionarCSVs();
        if (merged.archivoFinal) uploadToDrive(merged.archivoFinal);
      }
    }

    if (canceladoRef.current) {
      canceladoRef.current = false;
      setMensajeEstado('Proceso cancelado por el usuario');
      return;
    }
    setMostrarModal(true);
  };

  const handleReintentar = async () => {
    setMostrarModal(false);
    const rutasFallidos = archivosFallidos.map(f => f.ruta).filter(r => r);
    if (rutasFallidos.length > 0) {
      await handleConvertirCSV(rutasFallidos);
    } else if (window.electronAPI) {
      const fallidos = await window.electronAPI.obtenerFallidos();
      const rutas = fallidos.map(f => f.ruta).filter(r => r);
      if (rutas.length > 0) await handleConvertirCSV(rutas);
    }
  };

  const handleIgnorarYContinuar = async () => {
    setMostrarModal(false);
    if (window.electronAPI) {
      const merged = await window.electronAPI.fusionarCSVs();
      if (merged.archivoFinal) uploadToDrive(merged.archivoFinal);
    }
  };

  const handleCancelarProceso = async () => {
    if (window.electronAPI) {
      canceladoRef.current = true;
      setMensajeEstado('Cancelando proceso...');
      await window.electronAPI.cancelarProcesoR();
    }
  };

  const handleVerUbicacion = async () => {
    setMostrarModal(false);
    if (window.electronAPI) {
      const resultado = await window.electronAPI.abrirResultados();
      if (resultado && !resultado.success) alert('No se pudo abrir la carpeta: ' + (resultado.error || 'Error desconocido'));
    }
  };

  const handleAbrirRegistraduria = async () => {
    if (window.electronAPI) { await window.electronAPI.abrirURL(URL_REGISTRADURIA); }
    else { window.open(URL_REGISTRADURIA, '_blank'); }
  };

  const handleSeleccionarCSV = async () => {
    if (!window.electronAPI) { alert('Función disponible solo en la aplicación de escritorio'); return; }
    const archivo = await window.electronAPI.seleccionarCSV();
    if (archivo) setArchivoCSV(archivo);
  };

  const handleSeleccionarMMV = async () => {
    if (!window.electronAPI) { alert('Función disponible solo en la aplicación de escritorio'); return; }
    const carpeta = await window.electronAPI.seleccionarCarpetaMMV();
    if (carpeta) setCarpetaMMV(carpeta);
  };

  const handleGenerarComparacion = async () => {
    if (!archivoCSV || !carpetaMMV) { alert('Selecciona el archivo CSV extraído y el archivo MMV oficial primero'); return; }
    if (!window.electronAPI) { alert('Función disponible solo en la aplicación de escritorio'); return; }

    setComparacionEnProgreso(true);
    setComparacionCompleta(false);
    setResultadoComparacion(null);
    setErrorComparacion(null);
    setDiscrepanciasDetalle([]);
    setProgresoComparacion(10);
    canceladoRef.current = false;

    window.electronAPI.onEventoR((evento: EventoR) => {
      if (evento.tipo === 'progreso') {
        setProgresoComparacion(prev => Math.min(prev + 20, 90));
      } else if (evento.tipo === 'error') {
        setErrorComparacion(evento.mensaje || 'Error desconocido');
      } else if (evento.tipo === 'fin') {
        setProgresoComparacion(100);
        setResultadoComparacion({
          total_registros: evento.total_registros || 0,
          total_coinciden: evento.total_coinciden || 0,
          total_discrepancias: evento.total_discrepancias || 0,
          porcentaje_coinciden: evento.porcentaje_coinciden || 0,
          casos_registraduria_mas: evento.casos_registraduria_mas || 0,
          votos_registraduria_mas: evento.votos_registraduria_mas || 0,
          casos_registraduria_menos: evento.casos_registraduria_menos || 0,
          votos_registraduria_menos: evento.votos_registraduria_menos || 0,
        });
        if (evento.detalle && Array.isArray(evento.detalle)) setDiscrepanciasDetalle(evento.detalle);
      }
    });

    try {
      const resultado = await window.electronAPI.compararE14E24(archivoCSV, carpetaMMV);
      if (!resultado.success && !canceladoRef.current) setErrorComparacion(resultado.error || 'Error en la comparación');
    } catch (err) {
      console.error('Error en comparación:', err);
      if (!canceladoRef.current) setErrorComparacion('Error inesperado en la comparación');
    } finally {
      window.electronAPI.removeEventoR();
      setComparacionEnProgreso(false);
      if (canceladoRef.current) {
        setProgresoComparacion(0);
        canceladoRef.current = false;
      } else {
        setComparacionCompleta(true);
      }
    }
  };

  return (
    <div className="bg-[#40376d] relative min-h-screen w-full overflow-auto">
      <SecurityOverlay status={securityStatus} message={securityMessage} />

      <UpdateModal
        available={update.available}
        progress={update.progress}
        ready={update.ready}
        updateError={update.updateError}
        canRetry={update.canRetry}
        dismissed={update.dismissed}
        onDownload={update.download}
        onInstall={update.install}
        onManualDownload={update.openManualDownload}
        onDismiss={update.dismiss}
      />

      <div className="max-w-[1440px] mx-auto relative min-h-[1024px] p-8">
        <Header
          seccionActiva={seccionActiva}
          securityTier={securityTier}
          onChangeSeccion={setSeccionActiva}
        />

        <div
          className="bg-white rounded-[17px] -mt-[22px] pt-[55px] px-8 pb-8 min-h-[550px] border-[3px] transition-colors animate-fadeIn relative"
          style={{ borderColor: TAB_COLORS[seccionActiva] }}
        >
          {seccionActiva === 'informacion' && (
            <TabInformacion
              checkZonas={checkZonas} checkKey={checkKey} checkE14={checkE14}
              onCheckZonas={setCheckZonas} onCheckKey={setCheckKey} onCheckE14={setCheckE14}
              onMostrarEjemploFormatos={() => setMostrarEjemploFormatos(true)}
              onContinuar={handleContinuar}
            />
          )}

          {seccionActiva === 'identificacion' && (
            <TabIdentificacion
              tipoEleccion={tipoEleccion} circunscripcion={circunscripcion}
              departamento={departamento} municipio={municipio} zona={zona} keyAsignada={keyAsignada}
              esCITREP={esCITREP} tiposEleccion={tiposEleccion}
              circunscripcionesCITREP={circunscripcionesCITREP}
              departamentosFiltrados={departamentosFiltrados}
              municipiosFiltrados={municipiosFiltrados}
              zonasFiltradas={zonasFiltradas}
              onTipoEleccion={setField('tipoEleccion')} onCircunscripcion={setField('circunscripcion')}
              onDepartamento={setField('departamento')} onMunicipio={setField('municipio')}
              onZona={setField('zona')} onKeyAsignada={setField('keyAsignada')}
              onContinuar={handleContinuar}
            />
          )}

          {seccionActiva === 'extraccion' && (
            <TabExtraccion
              archivosPDF={archivosPDF} conversionEnProgreso={conversionEnProgreso}
              conversionCompleta={conversionCompleta} mostrarModal={mostrarModal}
              keyAsignada={keyAsignada}
              archivosExitosos={archivosExitosos} archivosFallidos={archivosFallidos}
              archivoActual={archivoActual} progresoActual={progresoActual}
              loteInfo={loteInfo} csvsGenerados={csvsGenerados}
              mensajeEstado={mensajeEstado} porcentajeProgreso={porcentajeProgreso}
              departamento={departamento} municipio={municipio} zona={zona}
              checkCsvSubidos={checkCsvSubidos} checkTotales={checkTotales} checkMmv={checkMmv}
              onCheckCsvSubidos={setCheckCsvSubidos} onCheckTotales={setCheckTotales} onCheckMmv={setCheckMmv}
              onSeleccionarPDFs={handleSeleccionarPDFs}
              onConvertirCSV={() => handleConvertirCSV()}
              onCancelarProceso={handleCancelarProceso}
              onVerUbicacion={handleVerUbicacion}
              onAbrirRegistraduria={handleAbrirRegistraduria}
              onContinuar={handleContinuar}
            />
          )}

          {seccionActiva === 'comparacion_automatica' && (
            <TabComparacionAutomatica
              checkMigaPan={checkMigaPan}
              onCheckMigaPan={setCheckMigaPan}
              onMostrarGuiaDrive={() => setMostrarGuiaDrive(true)}
              onContinuar={handleContinuar}
            />
          )}

          {seccionActiva === 'comparacion_archivos' && (
            <TabComparacionArchivos
              archivoCSV={archivoCSV} carpetaMMV={carpetaMMV}
              comparacionEnProgreso={comparacionEnProgreso}
              comparacionCompleta={comparacionCompleta}
              progresoComparacion={progresoComparacion}
              errorComparacion={errorComparacion}
              resultadoComparacion={resultadoComparacion}
              discrepanciasDetalle={discrepanciasDetalle}
              onSeleccionarCSV={handleSeleccionarCSV}
              onSeleccionarMMV={handleSeleccionarMMV}
              onGenerarComparacion={handleGenerarComparacion}
              onCancelarProceso={handleCancelarProceso}
              onDescargarResultados={() => window.electronAPI?.abrirResultados()}
              onContinuar={handleContinuar}
            />
          )}

          {seccionActiva === 'comparacion_manual' && (
            <TabComparacionManual
              onAbrirRegistraduria={handleAbrirRegistraduria}
              onAbrirEvidencias={() => window.electronAPI?.abrirCarpeta('Evidencias')}
            />
          )}
        </div>

        {carpetaTrabajo && (
          <p className="text-white/50 text-sm mt-4 text-center">Carpeta de trabajo: {carpetaTrabajo}</p>
        )}
      </div>

      {/* Modal de errores */}
      <ModalErrores
        visible={mostrarModal}
        exitosos={archivosExitosos}
        fallidos={archivosFallidos}
        errorDetectado={errorDetectado}
        onReintentar={handleReintentar}
        onIgnorar={handleIgnorarYContinuar}
        onVerUbicacion={handleVerUbicacion}
        onCerrar={() => { setMostrarModal(false); setSeccionActiva('identificacion'); }}
      />

      {/* Modal ejemplo formatos */}
      <Modal isOpen={mostrarEjemploFormatos} onClose={() => setMostrarEjemploFormatos(false)} borderColor="#a855f7">
        <div className="text-center mb-4">
          <h2 className="font-['Poppins',sans-serif] font-bold text-[#a855f7] text-xl">EJEMPLO DE FORMATOS</h2>
        </div>
        <div className="h-[2px] bg-[#a855f7]/30 mb-4" />
        <img src={ejemploFormatos} alt="Ejemplo de formatos E-14 y E-24" className="w-full rounded-[8px]" />
        <div className="flex justify-center mt-4">
          <button onClick={() => setMostrarEjemploFormatos(false)} className="h-[48px] w-[180px] bg-[#a855f7] rounded-[8px] hover:bg-[#9333ea] transition-colors">
            <span className="font-['Poppins',sans-serif] font-semibold text-white">CERRAR</span>
          </button>
        </div>
      </Modal>

      {/* Modal guia Drive */}
      <Modal isOpen={mostrarGuiaDrive} onClose={() => setMostrarGuiaDrive(false)} borderColor="#11d0d0">
        <div className="text-center mb-4">
          <h2 className="font-['Poppins',sans-serif] font-bold text-[#11d0d0] text-xl">ABRIR CON HOJAS DE CÁLCULO DE GOOGLE</h2>
        </div>
        <div className="h-[2px] bg-[#11d0d0]/30 mb-4" />
        <img src={guiaDriveHojas} alt="Guía: abrir con Hojas de cálculo de Google" className="w-full rounded-[8px]" />
        <div className="flex justify-center mt-4">
          <button onClick={() => setMostrarGuiaDrive(false)} className="h-[48px] w-[180px] bg-[#11d0d0] rounded-[8px] hover:bg-[#0fb8b8] transition-colors">
            <span className="font-['Poppins',sans-serif] font-semibold text-white">CERRAR</span>
          </button>
        </div>
      </Modal>

      {/* Modal confirmacion identificacion */}
      {mostrarModalConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#40376d]/80 backdrop-blur-sm" onClick={() => setMostrarModalConfirmacion(false)} />
          <div className="relative bg-white rounded-[17px] p-8 max-w-[500px] w-full mx-4 shadow-2xl border-[3px] border-[#ffb700]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#ffb700]/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#ffb700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="font-['Poppins',sans-serif] font-bold text-[#ffb700] text-xl">CONFIRMA TUS DATOS</h2>
            </div>
            <div className="h-[2px] bg-[#ffb700]/30 mb-6" />
            <div className="bg-[#ffb700]/5 border border-[#ffb700]/20 rounded-[8px] p-4 mb-6">
              <p className="font-['Poppins',sans-serif] text-[#40376d] text-sm mb-4">
                Ten en cuenta que estás por procesar las actas <strong>E-14</strong> con la siguiente configuración:
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                  <span className="font-['Poppins',sans-serif] text-[#888] text-sm">Tipo de Elección:</span>
                  <span className="font-['Poppins',sans-serif] text-[#40376d] font-semibold">{tipoEleccion}</span>
                </div>
                {esCITREP && (
                  <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                    <span className="font-['Poppins',sans-serif] text-[#888] text-sm">Circunscripción:</span>
                    <span className="font-['Poppins',sans-serif] text-[#40376d] font-semibold">{circunscripcion}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                  <span className="font-['Poppins',sans-serif] text-[#888] text-sm">Departamento:</span>
                  <span className="font-['Poppins',sans-serif] text-[#40376d] font-semibold">{departamento}</span>
                </div>
                <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                  <span className="font-['Poppins',sans-serif] text-[#888] text-sm">Municipio:</span>
                  <span className="font-['Poppins',sans-serif] text-[#40376d] font-semibold">{municipio}</span>
                </div>
                <div className="flex justify-between items-center bg-white rounded px-3 py-2">
                  <span className="font-['Poppins',sans-serif] text-[#888] text-sm">Zona:</span>
                  <span className="font-['Poppins',sans-serif] text-[#40376d] font-semibold">{zonasFiltradas.find(z => z.codigo === zona)?.nombre || zona}</span>
                </div>
              </div>
              <p className="font-['Poppins',sans-serif] text-[#ff5a5a] text-xs mt-4 text-center italic">
                Verifica que estos datos correspondan a las actas que vas a procesar.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMostrarModalConfirmacion(false)} className="flex-1 h-[48px] border-2 border-[#40376d] rounded-[8px] hover:bg-gray-50 transition-colors">
                <span className="font-['Poppins',sans-serif] font-semibold text-[#40376d]">CANCELAR</span>
              </button>
              <button onClick={handleConfirmarIdentificacion} className="flex-1 h-[48px] bg-[#ffb700] rounded-[8px] hover:bg-[#e5a500] transition-colors">
                <span className="font-['Poppins',sans-serif] font-semibold text-white">CONFIRMAR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
