import StepBadge from '../StepBadge';
import type { DiscrepanciaFila, ResultadoComparacion } from '../../types';

interface TabComparacionArchivosProps {
  archivoCSV: string | null;
  carpetaMMV: string | null;
  comparacionEnProgreso: boolean;
  comparacionCompleta: boolean;
  progresoComparacion: number;
  errorComparacion: string | null;
  resultadoComparacion: ResultadoComparacion | null;
  discrepanciasDetalle: DiscrepanciaFila[];
  onSeleccionarCSV: () => void;
  onSeleccionarMMV: () => void;
  onGenerarComparacion: () => void;
  onCancelarProceso: () => void;
  onDescargarResultados: () => void;
  onContinuar: () => void;
}

export default function TabComparacionArchivos({
  archivoCSV, carpetaMMV, comparacionEnProgreso, comparacionCompleta,
  progresoComparacion, errorComparacion, resultadoComparacion, discrepanciasDetalle,
  onSeleccionarCSV, onSeleccionarMMV, onGenerarComparacion,
  onCancelarProceso, onDescargarResultados
}: TabComparacionArchivosProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 animate-fadeIn max-w-[1000px] mx-auto">
        {/* Columna 1: Pasos 1 y 2 */}
        <div className="max-w-[380px] space-y-6">
          {/* Paso 1 */}
          <div>
            <div className="flex items-start gap-3 mb-3">
              <StepBadge number={1} color="#ff5a5a" />
              <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-lg leading-relaxed">
                Ingresa a la carpeta de Drive de cada zona y descarga los archivos TOTALES_MIGA_DE_PAN. CSV y los archivos MMV.
              </p>
            </div>
            <p className="font-['Poppins',sans-serif] text-[#ff5a5a] text-base italic leading-relaxed ml-1">
              La persona que se encargó de la preparación te indicará cuándo los archivos se encuentren subidos en la carpeta.
            </p>
          </div>

          {/* Paso 2 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <StepBadge number={2} color="#ff5a5a" />
              <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-lg">
                Sube los archivos "todoscsv.CSV" y MMV de las E-24.
              </p>
            </div>

            <button
              onClick={onSeleccionarCSV}
              className={`w-full h-[114px] rounded-[8px] transition-colors cursor-pointer drop-zone border-2 ${
                archivoCSV
                  ? 'bg-[#ff5a5a]/10 border-[#ff5a5a]'
                  : 'bg-[#d9d9d9] border-black border-dashed hover:bg-[#c9c9c9]'
              }`}
            >
              {archivoCSV ? (
                <div className="flex flex-col items-center gap-2 px-4">
                  <svg className="w-7 h-7 text-[#ff5a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-['Poppins',sans-serif] text-sm font-semibold text-[#ff5a5a]">CSV SELECCIONADO</span>
                  <span className="font-['Inter',sans-serif] text-xs text-[#40376d] truncate max-w-full px-2">
                    {archivoCSV.split(/[/\\]/).pop()}
                  </span>
                </div>
              ) : (
                <span className="font-['Poppins',sans-serif] text-[22px] text-black">Seleccionar archivo CSV</span>
              )}
            </button>

            <button
              onClick={onSeleccionarMMV}
              className={`w-full h-[114px] rounded-[8px] transition-colors cursor-pointer mt-4 drop-zone border-2 ${
                carpetaMMV
                  ? 'bg-[#ff5a5a]/10 border-[#ff5a5a]'
                  : 'bg-[#d9d9d9] border-black border-dashed hover:bg-[#c9c9c9]'
              }`}
            >
              {carpetaMMV ? (
                <div className="flex flex-col items-center gap-2 px-4">
                  <svg className="w-7 h-7 text-[#ff5a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-['Poppins',sans-serif] text-sm font-semibold text-[#ff5a5a]">MMV SELECCIONADO</span>
                  <span className="font-['Inter',sans-serif] text-xs text-[#40376d] truncate max-w-full px-2">
                    {carpetaMMV.split(/[/\\]/).pop()}
                  </span>
                </div>
              ) : (
                <span className="font-['Poppins',sans-serif] text-[22px] text-black">Seleccionar  MMV DE E-24</span>
              )}
            </button>
          </div>
        </div>

        {/* Columna 2: Paso 3 */}
        <div className="max-w-[380px]">
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number={3} color="#ff5a5a" />
            <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-lg">
              Crea el archivo de comparación.
            </p>
          </div>

          <button
            onClick={onGenerarComparacion}
            disabled={comparacionEnProgreso || !archivoCSV || !carpetaMMV}
            className={`w-full h-[70px] rounded-[8px] transition-colors cursor-pointer ${
              comparacionEnProgreso || !archivoCSV || !carpetaMMV
                ? 'bg-[#e0e0e0] cursor-not-allowed'
                : 'bg-[#d9d9d9] hover:bg-[#c9c9c9]'
            }`}
          >
            <span className="font-['Poppins',sans-serif] font-medium text-[22px] text-black">
              {comparacionEnProgreso ? 'COMPARANDO...' : 'GENERAR ARCHIVO DE COMPARACIÓN'}
            </span>
          </button>

          {comparacionEnProgreso && (
            <button
              onClick={onCancelarProceso}
              className="w-full h-[42px] rounded-[8px] bg-[#ff5a5a] hover:bg-[#e54a4a] transition-colors cursor-pointer mt-2"
            >
              <span className="font-['Poppins',sans-serif] font-semibold text-white">CANCELAR</span>
            </button>
          )}

          {progresoComparacion > 0 && (
            <div className="mt-4">
              <div className="w-full bg-white border border-[#ff5a5a] rounded-[8px] h-[17px] overflow-hidden">
                <div className="h-full bg-[#ff5a5a] rounded-[8px] transition-all duration-300" style={{ width: `${progresoComparacion}%` }} />
              </div>
              <p className="font-['Inter',sans-serif] text-black text-[15px] mt-2 text-right">{progresoComparacion}%</p>
            </div>
          )}

          {errorComparacion && (
            <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="font-['Poppins',sans-serif] text-red-700 text-sm">{errorComparacion}</p>
            </div>
          )}

          {comparacionCompleta && resultadoComparacion && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-white border border-[#ff5a5a] rounded-lg space-y-1">
                <p className="font-['Poppins',sans-serif] text-sm text-gray-700">
                  Comparados: <span className="font-bold">{resultadoComparacion.total_registros}</span> |
                  Coinciden: <span className="font-bold text-green-700">{resultadoComparacion.total_coinciden}</span> ({resultadoComparacion.porcentaje_coinciden}%) |
                  Discrepancias: <span className="font-bold text-red-700">{resultadoComparacion.total_discrepancias}</span>
                </p>
                {resultadoComparacion.total_discrepancias === 0 && (
                  <p className="font-['Poppins',sans-serif] text-sm text-green-700 font-bold">
                    Todos los votos coinciden perfectamente
                  </p>
                )}
              </div>
              <button
                onClick={onDescargarResultados}
                className="w-full h-[50px] bg-[#d9d9d9] rounded-[8px] hover:bg-[#c9c9c9] transition-colors cursor-pointer"
              >
                <span className="font-['Poppins',sans-serif] font-medium text-lg text-black">DESCARGAR</span>
              </button>
              <p className="font-['Poppins',sans-serif] text-[#ff5a5a] text-sm leading-relaxed">
                Avísale a la persona con la zona asignada, que ya se encuentra el archivo de comparación listo para realizar la verificación manual.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de discrepancias */}
      {discrepanciasDetalle.length > 0 && (
        <div className="mt-8 max-w-[1100px] mx-auto animate-fadeIn">
          <p className="font-['Poppins',sans-serif] font-bold text-[#40376d] text-lg mb-3">
            Discrepancias encontradas ({discrepanciasDetalle.length})
          </p>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-300 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-[#40376d] text-white sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-['Poppins',sans-serif] font-semibold">Mesa</th>
                  <th className="px-3 py-2 text-left font-['Poppins',sans-serif] font-semibold">Puesto</th>
                  <th className="px-3 py-2 text-left font-['Poppins',sans-serif] font-semibold">Partido / Candidato</th>
                  <th className="px-3 py-2 text-right font-['Poppins',sans-serif] font-semibold">V. Oficial</th>
                  <th className="px-3 py-2 text-right font-['Poppins',sans-serif] font-semibold">V. Extraido</th>
                  <th className="px-3 py-2 text-right font-['Poppins',sans-serif] font-semibold">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {discrepanciasDetalle.map((fila, idx) => {
                  const esMas = fila.discrepancia > 0;
                  return (
                    <tr key={idx} className={esMas ? 'bg-red-50 border-b border-red-200' : 'bg-blue-50 border-b border-blue-200'}>
                      <td className="px-3 py-2 font-mono text-xs text-gray-800">{fila.mesa}</td>
                      <td className="px-3 py-2 text-xs text-gray-700 max-w-[150px] truncate">{fila.puesto}</td>
                      <td className="px-3 py-2 text-xs text-gray-800 max-w-[200px] truncate">{fila.nombre}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs font-bold text-gray-800">{fila.votos_oficial}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs font-bold text-gray-800">{fila.votos_extraido}</td>
                      <td className={`px-3 py-2 text-right font-mono text-xs font-bold ${esMas ? 'text-red-700' : 'text-blue-700'}`}>
                        {esMas ? '+' : ''}{fila.discrepancia}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-2 text-xs font-['Poppins',sans-serif]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-red-200 rounded"></span>
              <span className="text-red-700">Rojo: Registraduría reporta MÁS votos</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 bg-blue-200 rounded"></span>
              <span className="text-blue-700">Azul: Registraduría reporta MENOS votos</span>
            </span>
          </div>
        </div>
      )}
    </>
  );
}