import type { TipoError, ArchivoExitoso, ArchivoFallido } from '../types';

interface ModalErroresProps {
  visible: boolean;
  exitosos: ArchivoExitoso[];
  fallidos: ArchivoFallido[];
  errorDetectado: { tipo: TipoError; mensaje: string } | null;
  onReintentar: () => void;
  onIgnorar: () => void;
  onVerUbicacion: () => void;
  onCerrar: () => void;
}

const iconoPorTipo: Record<string, string> = {
  api_key: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  cuota_excedida: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  rate_limit: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  conexion: 'M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414',
  servidor: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
  imagen_grande: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  pdf_corrupto: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  pdf_no_encontrado: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  respuesta_ia: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  python: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  success: 'M5 13l4 4L19 7',
};

export default function ModalErrores({ visible, exitosos, fallidos, errorDetectado, onReintentar, onIgnorar, onVerUbicacion, onCerrar }: ModalErroresProps) {
  if (!visible) return null;

  const total = exitosos.length + fallidos.length;
  const hayErrores = fallidos.length > 0;
  const tipoError = errorDetectado?.tipo;

  const esErrorCritico = tipoError === 'api_key' || tipoError === 'cuota_excedida' || tipoError === 'conexion' || tipoError === 'python';
  const esReintentable = tipoError === 'conexion' || tipoError === 'servidor' || tipoError === 'rate_limit';
  const esErrorPrevio = tipoError === 'otro' && !hayErrores && total === 0;

  const getTituloError = () => {
    switch (tipoError) {
      case 'api_key':           return 'API KEY INCORRECTA';
      case 'cuota_excedida':    return 'SIN CRÉDITOS EN LA API';
      case 'rate_limit':        return 'LÍMITE DE SOLICITUDES';
      case 'conexion':          return 'SIN CONEXIÓN A INTERNET';
      case 'servidor':          return 'SERVIDOR NO DISPONIBLE';
      case 'imagen_grande':     return 'ARCHIVO MUY GRANDE';
      case 'pdf_corrupto':      return 'PDF DAÑADO';
      case 'pdf_no_encontrado': return 'ARCHIVO NO ENCONTRADO';
      case 'respuesta_ia':      return 'ERROR DE LECTURA DE IA';
      case 'python':            return 'PYTHON PORTABLE DAÑADO';
      default:
        if (esErrorPrevio) return 'ERROR DE CONFIGURACIÓN';
        return hayErrores ? 'PROCESAMIENTO CON ERRORES' : 'PROCESAMIENTO COMPLETADO';
    }
  };

  const getMensajeError = () => {
    switch (tipoError) {
      case 'api_key':           return 'La API Key es incorrecta. Ve a Identificación y pégala nuevamente.';
      case 'cuota_excedida':    return 'La API Key no tiene créditos. Recarga en la plataforma del proveedor o usa otra API Key.';
      case 'rate_limit':        return 'Demasiadas solicitudes. Espera 2-3 minutos y presiona Reintentar.';
      case 'conexion':          return 'No hay conexión a internet. Verifica tu red y reintenta.';
      case 'servidor':          return 'El servidor de IA no está disponible. Espera unos minutos y reintenta.';
      case 'imagen_grande':     return 'El PDF es demasiado grande. Intenta con un archivo de menor resolución.';
      case 'pdf_corrupto':      return 'El PDF está dañado. Descárgalo nuevamente desde la Registraduría.';
      case 'pdf_no_encontrado': return 'El archivo fue movido o eliminado. Vuelve a seleccionar la carpeta.';
      case 'respuesta_ia':      return 'La IA no pudo leer el PDF. Reintenta o revísalo manualmente.';
      case 'python':            return 'Python portable no está disponible o sus módulos están dañados. Reinstala la aplicación.';
      default:                  return errorDetectado?.mensaje || 'Algunos archivos no pudieron procesarse.';
    }
  };

  const getBotonPrincipal = () => {
    if (tipoError === 'api_key')        return { texto: 'CORREGIR API KEY', accion: onCerrar, color: 'bg-[#ff5a5a] hover:bg-[#e54a4a]' };
    if (tipoError === 'cuota_excedida') return { texto: 'CAMBIAR API KEY', accion: onCerrar, color: 'bg-[#ff5a5a] hover:bg-[#e54a4a]' };
    if (tipoError === 'python')         return { texto: 'CERRAR', accion: onCerrar, color: 'bg-[#ff5a5a] hover:bg-[#e54a4a]' };
    if (esReintentable)                 return { texto: 'REINTENTAR', accion: onReintentar, color: 'bg-[#11d0d0] hover:bg-[#0fb8b8]' };
    if (esErrorPrevio)                  return { texto: 'CERRAR', accion: onCerrar, color: 'bg-[#ff5a5a] hover:bg-[#e54a4a]' };
    if (hayErrores)                     return { texto: `REINTENTAR (${fallidos.length})`, accion: onReintentar, color: 'bg-[#11d0d0] hover:bg-[#0fb8b8]' };
    return                                     { texto: 'VER UBICACIÓN', accion: onVerUbicacion, color: 'bg-[#11d0d0] hover:bg-[#0fb8b8]' };
  };

  const botonPrincipal = getBotonPrincipal();
  const esError = hayErrores || esErrorCritico || esErrorPrevio;
  const colorBorde = esError ? 'border-[#ff5a5a]' : 'border-[#11d0d0]';
  const colorFondo = esError ? 'bg-[#ff5a5a]/10' : 'bg-[#11d0d0]/10';
  const iconoColor = esError ? 'text-[#ff5a5a]' : 'text-[#11d0d0]';
  const colorTexto = esError ? 'text-[#ff5a5a]' : 'text-[#11d0d0]';
  const colorSep = esError ? 'bg-[#ff5a5a]/30' : 'bg-[#11d0d0]/30';

  const iconoPath = tipoError && iconoPorTipo[tipoError]
    ? iconoPorTipo[tipoError]
    : esError ? iconoPorTipo.warning : iconoPorTipo.success;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#40376d]/80 backdrop-blur-sm" />

      <div className={`relative bg-white rounded-[17px] p-8 max-w-[500px] w-full mx-4 shadow-2xl border-[3px] ${colorBorde}`}>
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${colorFondo}`}>
            <svg className={`w-8 h-8 ${iconoColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconoPath} />
            </svg>
          </div>
          <h2 className={`font-['Poppins',sans-serif] font-bold text-xl ${colorTexto}`}>
            {getTituloError()}
          </h2>
        </div>

        <div className={`h-[2px] ${colorSep} mb-6`} />

        {tipoError && (
          <div className="bg-[#fff5f5] border-2 border-[#ff5a5a] rounded-[8px] p-4 mb-6">
            <p className="font-['Poppins',sans-serif] text-[#ff5a5a] text-base font-medium text-center">
              {getMensajeError()}
            </p>
          </div>
        )}

        {!esErrorPrevio && (
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="font-['Poppins',sans-serif] font-bold text-3xl text-[#11d0d0]">{exitosos.length}</p>
              <p className="font-['Poppins',sans-serif] text-sm text-[#40376d]">Exitosos</p>
            </div>
            <div className="text-center">
              <p className="font-['Poppins',sans-serif] font-bold text-3xl text-[#ff5a5a]">{fallidos.length}</p>
              <p className="font-['Poppins',sans-serif] text-sm text-[#40376d]">Fallidos</p>
            </div>
            <div className="text-center">
              <p className="font-['Poppins',sans-serif] font-bold text-3xl text-[#40376d]">{total}</p>
              <p className="font-['Poppins',sans-serif] text-sm text-[#40376d]">Total</p>
            </div>
          </div>
        )}

        {hayErrores && !esErrorCritico && (
          <div className="bg-[#fff5f5] rounded-[8px] p-4 mb-6 max-h-[150px] overflow-y-auto">
            <p className="font-['Poppins',sans-serif] font-semibold text-sm text-[#40376d] mb-3">
              Archivos con error ({fallidos.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {fallidos.map((archivo, idx) => (
                <span key={idx} className="bg-white px-3 py-1 rounded-full border border-[#ff5a5a]/30 text-sm text-[#40376d]">
                  {archivo.archivo}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={botonPrincipal.accion}
            className={`flex-1 h-[48px] rounded-[8px] transition-colors ${botonPrincipal.color}`}
          >
            <span className="font-['Poppins',sans-serif] font-semibold text-white">
              {botonPrincipal.texto}
            </span>
          </button>
          {hayErrores && !esErrorCritico && !esReintentable && (
            <button
              onClick={onIgnorar}
              className="flex-1 h-[48px] rounded-[8px] bg-[#d9d9d9] hover:bg-[#c9c9c9] transition-colors"
            >
              <span className="font-['Poppins',sans-serif] font-semibold text-[#40376d]">
                IGNORAR Y CONTINUAR
              </span>
            </button>
          )}
        </div>

        {hayErrores && !esErrorCritico && (
          <button
            onClick={onVerUbicacion}
            className="w-full h-[40px] mt-3 border-2 border-[#40376d] rounded-[8px] hover:bg-gray-50 transition-colors"
          >
            <span className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-sm">
              VER UBICACIÓN DE ARCHIVOS
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
