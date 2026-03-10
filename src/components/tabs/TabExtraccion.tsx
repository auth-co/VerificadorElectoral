import StepBadge from '../StepBadge';
import Checkbox from '../Checkbox';
import type { ArchivoExitoso, ArchivoFallido } from '../../types';

interface TabExtraccionProps {
  // Estado de archivos
  archivosPDF: string[];
  conversionEnProgreso: boolean;
  conversionCompleta: boolean;
  mostrarModal: boolean;
  keyAsignada: string;
  // Progreso
  archivosExitosos: ArchivoExitoso[];
  archivosFallidos: ArchivoFallido[];
  archivoActual: string;
  progresoActual: { actual: number; total: number };
  loteInfo: { actual: number; total: number };
  csvsGenerados: string[];
  mensajeEstado: string;
  porcentajeProgreso: number;
  // Identificacion
  departamento: string;
  municipio: string;
  zona: string;
  // Checklist
  checkCsvSubidos: boolean;
  checkTotales: boolean;
  checkMmv: boolean;
  onCheckCsvSubidos: (v: boolean) => void;
  onCheckTotales: (v: boolean) => void;
  onCheckMmv: (v: boolean) => void;
  // Handlers
  onSeleccionarPDFs: () => void;
  onConvertirCSV: () => void;
  onCancelarProceso: () => void;
  onVerUbicacion: () => void;
  onAbrirRegistraduria: () => void;
  onContinuar: () => void;
}

export default function TabExtraccion({
  archivosPDF, conversionEnProgreso, conversionCompleta, mostrarModal, keyAsignada,
  archivosExitosos, archivosFallidos, archivoActual, progresoActual, loteInfo,
  csvsGenerados, mensajeEstado, porcentajeProgreso,
  departamento, municipio, zona,
  checkCsvSubidos, checkTotales, checkMmv,
  onCheckCsvSubidos, onCheckTotales, onCheckMmv,
  onSeleccionarPDFs, onConvertirCSV, onCancelarProceso, onVerUbicacion,
  onAbrirRegistraduria, onContinuar
}: TabExtraccionProps) {
  const checklistCompleto = checkCsvSubidos && checkTotales && checkMmv;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 animate-fadeIn max-w-[1250px] mx-auto">
        {/* Columna 1: Paso 3 */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number={3} color="#11d0d0" />
            <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-lg">
              Selecciona la carpeta donde están los archivos PDF de las E-14 y conviértelos a Excel.
            </p>
          </div>

          <button
            onClick={onSeleccionarPDFs}
            disabled={conversionEnProgreso}
            className={`w-full h-[114px] bg-[#d9d9d9] rounded-[8px] transition-colors flex items-center justify-center drop-zone ${
              conversionEnProgreso ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#c9c9c9] cursor-pointer'
            }`}
          >
            <span className="font-['Inter',sans-serif] text-[22px] text-black text-center px-2">
              {archivosPDF.length > 0 ? `${archivosPDF.length} PDFs encontrados` : 'SELECCIONAR CARPETA E-14'}
            </span>
          </button>

          {/* Recuadro de progreso */}
          <div className="bg-[rgba(17,208,208,0.08)] rounded-[8px] p-4 w-full min-h-[120px] max-h-[250px] overflow-y-auto mt-4">
            {archivosPDF.length === 0 && !conversionEnProgreso && !conversionCompleta && (
              <p className="font-['Poppins',sans-serif] text-[#a2a2a2] text-sm text-center mt-4">
                Selecciona una carpeta con archivos PDF para ver el progreso aquí.
              </p>
            )}

            {archivosPDF.length > 0 && !conversionEnProgreso && !conversionCompleta && (
              <div>
                <p className="font-['Poppins',sans-serif] text-[#40376d] text-sm font-semibold mb-3">
                  Archivos listos para convertir:
                </p>
                <div className="space-y-2">
                  {archivosPDF.slice(0, 8).map((archivo, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#d9d9d9]"></div>
                      <span className="font-['Inter',sans-serif] text-xs text-[#40376d] truncate">
                        {archivo.split(/[/\\]/).pop()}
                      </span>
                    </div>
                  ))}
                  {archivosPDF.length > 8 && (
                    <p className="font-['Inter',sans-serif] text-xs text-[#a2a2a2] ml-4">
                      ... y {archivosPDF.length - 8} archivos más
                    </p>
                  )}
                </div>
                <p className="font-['Poppins',sans-serif] text-[#40376d] text-xs mt-4">
                  Se procesarán en {Math.ceil(archivosPDF.length / 50)} lote(s) de 50 PDFs
                </p>
              </div>
            )}

            {conversionEnProgreso && (
              <div>
                <p className="font-['Poppins',sans-serif] text-[#40376d] text-sm font-semibold mb-2">{mensajeEstado}</p>
                <div className="w-full bg-white border border-[#11d0d0] rounded-[8px] h-[16px] overflow-hidden mb-2">
                  <div className="h-full bg-[#11d0d0] rounded-[8px] transition-all duration-300" style={{ width: `${porcentajeProgreso}%` }} />
                </div>
                <p className="font-['Inter',sans-serif] text-xs text-[#40376d] text-right mb-4">
                  {progresoActual.actual} / {progresoActual.total} ({porcentajeProgreso}%)
                </p>
                {archivoActual ? (
                  <div className="flex items-center gap-2 p-2 bg-white rounded-[6px] mb-3">
                    <span className="font-['Inter',sans-serif] text-xs text-[#888]">Último:</span>
                    <span className="font-['Inter',sans-serif] text-sm text-[#11d0d0] truncate">{archivoActual}</span>
                  </div>
                ) : loteInfo.actual > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-white rounded-[6px] mb-3">
                    <div className="w-4 h-4 rounded-full border-2 border-[#11d0d0] border-t-transparent animate-spin"></div>
                    <span className="font-['Inter',sans-serif] text-sm text-[#11d0d0]">
                      Procesando lote {loteInfo.actual} de {loteInfo.total}...
                    </span>
                  </div>
                )}
                <div className="flex gap-4 text-sm">
                  <span className="text-[#11d0d0]">Exitosos: {archivosExitosos.length}</span>
                  <span className="text-[#ff5a5a]">Fallidos: {archivosFallidos.length}</span>
                </div>
              </div>
            )}

            {conversionCompleta && !mostrarModal && (
              <div>
                <p className="font-['Poppins',sans-serif] text-[#11d0d0] text-base font-semibold mb-4">Procesamiento completado</p>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 bg-[#11d0d0]/10 rounded-[8px] p-3 text-center">
                    <p className="font-['Poppins',sans-serif] font-bold text-2xl text-[#11d0d0]">{archivosExitosos.length}</p>
                    <p className="font-['Poppins',sans-serif] text-xs text-[#40376d]">Exitosos</p>
                  </div>
                  <div className="flex-1 bg-[#ff5a5a]/10 rounded-[8px] p-3 text-center">
                    <p className="font-['Poppins',sans-serif] font-bold text-2xl text-[#ff5a5a]">{archivosFallidos.length}</p>
                    <p className="font-['Poppins',sans-serif] text-xs text-[#40376d]">Fallidos</p>
                  </div>
                </div>
                {csvsGenerados.length > 0 && (
                  <div>
                    <p className="font-['Poppins',sans-serif] text-xs text-[#40376d] mb-2">Archivos Excel generados:</p>
                    {csvsGenerados.map((csv, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#11d0d0]">
                        <span>✓</span> {csv}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onConvertirCSV}
            disabled={conversionEnProgreso || archivosPDF.length === 0 || !keyAsignada}
            className={`w-full h-[42px] rounded-[8px] transition-colors mt-4 ${
              conversionEnProgreso || archivosPDF.length === 0 || !keyAsignada
                ? 'bg-[#e5e5e5] cursor-not-allowed'
                : 'bg-[#11d0d0] hover:bg-[#0fb8b8] cursor-pointer'
            }`}
          >
            <span className={`font-['Inter',sans-serif] text-xl ${
              conversionEnProgreso || archivosPDF.length === 0 || !keyAsignada ? 'text-[#888]' : 'text-white font-semibold'
            }`}>
              {conversionEnProgreso ? 'Procesando...' : 'Convertir a Excel'}
            </span>
          </button>

          {conversionEnProgreso && (
            <button
              onClick={onCancelarProceso}
              className="w-full h-[42px] rounded-[8px] bg-[#ff5a5a] hover:bg-[#e54a4a] transition-colors cursor-pointer mt-2"
            >
              <span className="font-['Inter',sans-serif] text-xl text-white font-semibold">Cancelar</span>
            </button>
          )}

          {!keyAsignada && archivosPDF.length > 0 && (
            <p className="font-['Poppins',sans-serif] text-xs text-[#ff5a5a] mt-2 text-center">
              Ingresa una API Key en Identificación
            </p>
          )}

          {conversionCompleta && (
            <button
              onClick={onVerUbicacion}
              className="w-full h-[42px] bg-[#d9d9d9] rounded-[8px] hover:bg-[#c9c9c9] transition-colors cursor-pointer mt-4"
            >
              <span className="font-['Poppins',sans-serif] font-medium text-lg text-black">VER UBICACIÓN</span>
            </button>
          )}
        </div>

        {/* Columna 2: Paso 4 - Registraduría */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number={4} color="#11d0d0" />
            <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-lg">
              Ingresa a la página de la registraduría y descarga el MMV de las E-24 correspondiente al municipio a revisar.
            </p>
          </div>

          {departamento && municipio && (
            <div className="bg-[#11d0d0]/10 rounded-[8px] p-4 border border-[#11d0d0]/30 mb-6 mt-6">
              <p className="font-['Poppins',sans-serif] text-sm text-[#40376d] font-semibold mb-3">
                GUÍA PARA FILTRAR EN REGISTRADURÍA:
              </p>
              <div className="space-y-2 text-sm font-['Inter',sans-serif]">
                <div className="flex justify-between items-center bg-white/50 rounded px-2 py-1">
                  <span className="text-[#888]">Departamento:</span>
                  <span className="text-[#40376d] font-semibold">{departamento}</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 rounded px-2 py-1">
                  <span className="text-[#888]">Municipio:</span>
                  <span className="text-[#40376d] font-semibold">{municipio}</span>
                </div>
                {zona && (
                  <div className="flex justify-between items-center bg-white/50 rounded px-2 py-1">
                    <span className="text-[#888]">Zona:</span>
                    <span className="text-[#40376d] font-semibold">{zona}</span>
                  </div>
                )}
              </div>
              <p className="font-['Poppins',sans-serif] text-xs text-[#888] mt-3 italic">
                Usa estos datos para filtrar en la página de la Registraduría.
              </p>
            </div>
          )}

          <button
            onClick={onAbrirRegistraduria}
            className="w-full h-[53px] bg-[#11d0d0] rounded-[8px] hover:bg-[#0fc0c0] transition-colors cursor-pointer"
          >
            <span className="font-['Poppins',sans-serif] font-semibold text-xl text-white">PÁGINA DE LA REGISTRADURÍA</span>
          </button>

          <div className="flex items-center gap-3 mt-6">
            <StepBadge number={5} color="#11d0d0" />
            <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-lg">
              Sube los archivos Excel y MMV a la carpeta de Drive que te indique el líder.
            </p>
          </div>
        </div>

        {/* Columna 3: Checklist */}
        <div>
          <p className="font-['Poppins',sans-serif] font-bold text-[#11d0d0] text-base mb-6 leading-relaxed">
            SI YA CUENTAS CON LA SIGUIENTE INFORMACIÓN, PUEDES CONTINUAR AL VAR AUTOMÁTICO:
          </p>

          <div className="space-y-5">
            <Checkbox checked={checkCsvSubidos} onChange={onCheckCsvSubidos} label="Archivos Excel de la zona en la carpeta del computador y subidos a Drive" />
            <Checkbox checked={checkTotales} onChange={onCheckTotales} label="Archivo resultados_e14_FINAL subido a la carpeta del DRIVE" />
            <Checkbox checked={checkMmv} onChange={onCheckMmv} label="MMV de la E-24 que corresponde a tu zona, descargada en tu computador y subida al DRIVE" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={onContinuar}
          disabled={!checklistCompleto}
          className={`h-[53px] w-[226px] rounded-[8px] transition-colors border-2 ${
            checklistCompleto
              ? 'bg-[#11d0d0] border-[#11d0d0] hover:bg-[#0eb8b8] cursor-pointer'
              : 'bg-white border-[#40376d] cursor-not-allowed'
          }`}
        >
          <span className={`font-['Poppins',sans-serif] font-semibold text-2xl tracking-wider ${
            checklistCompleto ? 'text-white' : 'text-[#40376d]'
          }`}>
            CONTINUAR
          </span>
        </button>
      </div>
    </>
  );
}
