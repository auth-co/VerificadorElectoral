import Checkbox from '../Checkbox';
import StepBadge from '../StepBadge';

interface TabComparacionAutomaticaProps {
  checkMigaPan: boolean;
  onCheckMigaPan: (v: boolean) => void;
  onMostrarGuiaDrive: () => void;
  onContinuar: () => void;
}

export default function TabComparacionAutomatica({
  checkMigaPan, onCheckMigaPan, onMostrarGuiaDrive, onContinuar
}: TabComparacionAutomaticaProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-10 animate-fadeIn max-w-[1100px] mx-auto">
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5a5a] flex items-center justify-center flex-shrink-0">
              <span className="font-['Poppins',sans-serif] font-bold text-white text-xl">1.</span>
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[#ff5a5a] text-lg leading-relaxed mt-1">
              Indícale al concatenador que ya se encuentran los documentos en el DRIVE, para realizar el proceso de comparación automática.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff5a5a] flex items-center justify-center flex-shrink-0">
              <span className="font-['Poppins',sans-serif] font-bold text-white text-xl">2.</span>
            </div>
            <div>
              <p className="font-['Poppins',sans-serif] text-[#ff5a5a] text-lg leading-relaxed">
                El concatenador subirá al drive el archivo
              </p>
              <p className="font-['Poppins',sans-serif] font-bold text-[#40376d] text-xl tracking-wide">
                COMPRARACION_MIGA_DE_PAN
              </p>
              <p className="font-['Poppins',sans-serif] font-semibold text-[#ff5a5a] text-lg leading-relaxed mt-3">
                Este es el archivo que debes &nbsp;usar en la fase de comparación manual:
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <StepBadge number={3} color="#ff5a5a" />
            <div>
              <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-lg leading-relaxed">
                En drive, abre el documento con "hojas de calculo de google"
              </p>
              <button
                onClick={onMostrarGuiaDrive}
                className="font-['Poppins',sans-serif] text-[#11d0d0] text-base italic hover:underline transition-colors cursor-pointer mt-1"
              >
                ¿Cómo abrir el doc en "hojas de cálculo de Google"?
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <p className="font-['Poppins',sans-serif] font-bold text-[#ff5a5a] text-sm tracking-wider leading-relaxed uppercase">
              SI YA CUENTAS CON LA SIGUIENTE INFORMACIÓN, PUEDES CONTINUAR A LA REVISIÓN EN CANCHA:
            </p>
            <div className="mt-5">
              <Checkbox
                checked={checkMigaPan}
                onChange={onCheckMigaPan}
                label='Archivo COMPARACIÓN_MIGA_DE_PAN abierto en "hojas de cálculo de Google"'
                accentColor="#ff5a5a"
              />
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={onContinuar}
              className="h-[53px] w-[226px] border-2 border-[#40376d] rounded-[8px] hover:bg-[#40376d] hover:text-white transition-colors cursor-pointer"
            >
              <span className="font-['Poppins',sans-serif] font-semibold text-[#40376d] text-2xl tracking-wider hover:text-white">
                CONTINUAR
              </span>
            </button>
          </div>
        </div>
      </div>

    </>
  );
}
