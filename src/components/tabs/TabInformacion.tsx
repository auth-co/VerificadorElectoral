import { useState } from 'react';
import Checkbox from '../Checkbox';

interface TabInformacionProps {
  checkZonas: boolean;
  checkKey: boolean;
  checkE14: boolean;
  onCheckZonas: (v: boolean) => void;
  onCheckKey: (v: boolean) => void;
  onCheckE14: (v: boolean) => void;
  onMostrarEjemploFormatos: () => void;
  onContinuar: () => void;
}

export default function TabInformacion({
  checkZonas, checkKey, checkE14,
  onCheckZonas, onCheckKey, onCheckE14,
  onMostrarEjemploFormatos, onContinuar
}: TabInformacionProps) {
  const [opcionAAbierta, setOpcionAAbierta] = useState(true);
  const checklistCompleto = checkZonas && checkKey && checkE14;

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-[1250px] mx-auto">
        {/* COLUMNA 1: Contexto */}
        <div>
          <p className="font-['Poppins',sans-serif] text-[#40376d] text-base leading-relaxed mb-4">
            La verificación electoral consiste en comparar los formatos e-14 con los formatos e-24 para comprobar si existe algún tipo de inconsistencia.
          </p>

          <button
            onClick={onMostrarEjemploFormatos}
            className="font-['Poppins',sans-serif] text-[#ffb700] text-base font-semibold hover:underline transition-colors cursor-pointer mb-6 block"
          >
            Ver ejemplo de formatos
          </button>

          <p className="font-['Poppins',sans-serif] text-[#40376d] text-base mb-3">
            Este proceso está dividido en dos fases:
          </p>

          <p className="font-['Poppins',sans-serif] font-bold text-[#ff5a5a] text-lg mb-2">FASE 1</p>

          <p className="font-['Poppins',sans-serif] font-bold text-[#40376d] text-base mb-1">
            Comparación automática:
          </p>
          <p className="font-['Poppins',sans-serif] text-[#40376d] text-base leading-relaxed mb-4">
            un software lee la información de cada uno de los formatos, unifica la información en un archivo, compara y muestra si hay alguna diferencia de votos.
          </p>

          <p className="font-['Poppins',sans-serif] text-[#40376d] text-base mb-3">
            Para que esto suceda, es necesario identificar y alistar los archivos que se van a entregar al software, siguiendo estos pasos:
          </p>

          <p className="font-['Poppins',sans-serif] font-semibold text-[#11d0d0] text-base mb-2">
            1. Solicita al líder que te indique:
          </p>
          <ul className="font-['Poppins',sans-serif] text-[#40376d] text-base space-y-1 list-disc list-inside ml-1">
            <li>Cuáles zonas te corresponden verificar</li>
            <li>Cuál Key te asignaron</li>
          </ul>
        </div>

        {/* COLUMNA 2: Preparar archivos */}
        <div>
          <p className="font-['Poppins',sans-serif] font-bold text-[#11d0d0] text-base mb-4">
            2. Prepara los archivos:
          </p>

          <div className="flex items-start gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-[#ffb700] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white font-bold text-sm">!</span>
            </div>
            <p className="font-['Poppins',sans-serif] text-[#40376d] text-base italic leading-relaxed">
              Inicia con la Opción A, solamente si el líder lo indica, de lo contrario continúa con la opción B.
            </p>
          </div>

          {/* OPCIÓN A - Desplegable */}
          <div className="border border-[#11d0d0] rounded-[8px] overflow-hidden mb-5">
            <button
              onClick={() => setOpcionAAbierta(!opcionAAbierta)}
              className="w-full flex items-center justify-between px-4 py-3 cursor-pointer bg-[#11d0d0] hover:bg-[#0db8b8] transition-colors"
            >
              <p className="font-['Poppins',sans-serif] font-bold text-white text-base">OPCIÓN A</p>
              <svg
                className={`w-5 h-5 text-white transition-transform duration-200 ${opcionAAbierta ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {opcionAAbierta && (
              <div className="px-4 pb-4 border-t border-[#11d0d0]/30">
                <ul className="font-['Poppins',sans-serif] text-[#40376d] text-base space-y-3 mt-3">
                  <li>· Descarga la carpeta del Drive con el nombre de las zonas que te fueron asignadas. Guárdala de manera que la puedas encontrar fácilmente.</li>
                  <li>· Ingresa a la página de la registraduría ... (Ubicación) y descarga todas las E-14 de las zonas que te corresponden. Guardarlas en la carpeta que descargaste anteriormente.</li>
                  <li>· Sube la carpeta al drive con los formatos E-14 que guardaste.</li>
                  <li>· Ten en cuenta que estas son las carpetas que vas a utilizar en los siguientes pasos.</li>
                </ul>
              </div>
            )}
          </div>

          <div>
            <p className="font-['Poppins',sans-serif] font-bold text-[#11d0d0] text-base mb-2">OPCIÓN B</p>
            <p className="font-['Poppins',sans-serif] text-[#40376d] text-base leading-relaxed">
              Descarga las carpetas E-14 de las zonas que te fueron asignadas por el líder. Estas carpetas se encuentran en (DRIVE)
            </p>
          </div>
        </div>

        {/* COLUMNA 3: Checklist */}
        <div>
          <p className="font-['Poppins',sans-serif] font-bold text-[#11d0d0] text-base mb-6 leading-relaxed">
            SI YA CUENTAS CON LA SIGUIENTE INFORMACIÓN, PUEDES CONTINUAR CON LA IDENTIFICACIÓN:
          </p>

          <div className="space-y-5">
            <Checkbox checked={checkZonas} onChange={onCheckZonas} label="Zonas asignadas" />
            <Checkbox checked={checkKey} onChange={onCheckKey} label="Key Asignada" />
            <Checkbox
              checked={checkE14}
              onChange={onCheckE14}
              label="Formatos E-14 descargados en el computador y divididos en carpetas por zona."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={onContinuar}
          disabled={!checklistCompleto}
          className={`h-[53px] w-[226px] rounded-[8px] transition-colors border-2 ${
            checklistCompleto
              ? 'bg-[#ffb700] border-[#ffb700] hover:bg-[#e6a600] cursor-pointer'
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
    </div>
  );
}