interface TabComparacionManualProps {
  onAbrirRegistraduria: () => void;
  onAbrirEvidencias: () => void;
}

export default function TabComparacionManual({ onAbrirRegistraduria, onAbrirEvidencias }: TabComparacionManualProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 animate-fadeIn max-w-[1250px] mx-auto">
      {/* Columna 1 */}
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <p className="font-['Poppins',sans-serif] font-semibold text-[#d3c4d1] text-3xl leading-none">1.</p>
          <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-base mt-1">
            Abre la carpeta donde se encuentran las actas E-14 que te asignaron.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <p className="font-['Poppins',sans-serif] font-semibold text-[#d3c4d1] text-3xl leading-none">2.</p>
          <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-base mt-1">
            Abre el archivo de comparación y ubícate en la hoja de "discrepancias"
          </p>
        </div>

        <div className="flex items-start gap-3">
          <p className="font-['Poppins',sans-serif] font-semibold text-[#d3c4d1] text-3xl leading-none">3.</p>
          <div>
            <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-base mt-1">
              Busca el acta E-14 de la fila que vas a revisar.
            </p>
            <p className="font-['Poppins',sans-serif] italic text-[#40376d] text-base mt-2">
              Ten en cuenta el municipio, la zona, el puesto de votación, la mesa y candidato.
            </p>
          </div>
        </div>
      </div>

      {/* Columna 2 */}
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <p className="font-['Poppins',sans-serif] font-semibold text-[#d3c4d1] text-3xl leading-none">4.</p>
          <div>
            <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-base mt-1">
              Verifica que el dato de la columna "VOTOS_E14" corresponde con el que se encuentra en la E-14 que estás revisando.
            </p>
            <p className="font-['Poppins',sans-serif] font-semibold text-[#ff6e6e] text-base mt-4">Si no corresponde:</p>
            <p className="font-['Poppins',sans-serif] text-[#40376d] text-base mt-1">
              Cámbialo por el dato que se encuentra en el acta E-14, ya que esto pudo ser un error de lectura del software.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <p className="font-['Poppins',sans-serif] font-semibold text-[#d3c4d1] text-3xl leading-none">5.</p>
          <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-base mt-1">
            Luego, en la página de la registraduría, ubica el acta E-24 correspondiente a la E-14 que estás revisando:
          </p>
        </div>

        <button
          onClick={onAbrirRegistraduria}
          className="w-full h-[48px] bg-[#d3c4d1]/30 border-2 border-[#40376d]/20 rounded-[8px] hover:bg-[#d3c4d1]/50 transition-colors cursor-pointer"
        >
          <span className="font-['Poppins',sans-serif] font-semibold text-[#40376d] text-base tracking-wider">
            PÁGINA DE LA REGISTRADURÍA
          </span>
        </button>
      </div>

      {/* Columna 3 */}
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <p className="font-['Poppins',sans-serif] font-semibold text-[#d3c4d1] text-3xl leading-none">6.</p>
          <div>
            <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-base mt-1">
              Verifica que el dato de la columna "VOTOS_E14" es el mismo que se encuentra en el acta E-24.
            </p>
            <p className="font-['Poppins',sans-serif] text-[#40376d] text-base mt-4">
              Si los datos son iguales, significa que no hay discrepancia. <span className="text-[#11d0d0] font-semibold">Borra la fila de la hoja de discrepancias.</span>
            </p>
            <p className="font-['Poppins',sans-serif] text-base mt-4">
              <span className="text-[#ff6e6e] font-semibold">Si no corresponden los datos significa que hay una discrepancia. </span>
              <span className="text-[#40376d]">En este caso, descarga la E-14 y la E-24 y guárdalas en la carpeta de EVIDENCIAS.</span>
            </p>
          </div>
        </div>

        <button
          onClick={onAbrirEvidencias}
          className="w-full h-[48px] bg-[#d3c4d1]/30 border-2 border-[#40376d]/20 rounded-[8px] hover:bg-[#d3c4d1]/50 transition-colors cursor-pointer"
        >
          <span className="font-['Poppins',sans-serif] font-semibold text-[#40376d] text-base tracking-wider">
            CARPETA DE EVIDENCIAS
          </span>
        </button>
      </div>
    </div>
  );
}
