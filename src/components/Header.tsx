import logoEscritorio from '../assets/log_escritorio.png';
import type { Seccion } from '../types';
import { TAB_LABELS, TAB_BG_CLASSES, getVisibleTabs } from '../constants';

interface HeaderProps {
  seccionActiva: Seccion;
  securityTier: string;
  onChangeSeccion: (seccion: Seccion) => void;
}

export default function Header({ seccionActiva, securityTier, onChangeSeccion }: HeaderProps) {
  const visibleTabs = getVisibleTabs(securityTier);
  const indiceActual = visibleTabs.indexOf(seccionActiva);

  return (
    <>
      <div className="flex items-center gap-6 mb-6">
        <img src={logoEscritorio} alt="Ícono Verificador Electoral" className="w-[110px] h-[110px] object-contain rounded-2xl flex-shrink-0" />
        <h1 className="font-['Poppins',sans-serif] font-bold text-[#ffb700] text-[52px] leading-tight tracking-[2.6px]">
          VERIFICACIÓN<br />ELECTORAL
        </h1>
      </div>

      <div className="flex gap-4 flex-wrap relative z-10 justify-end">
        {visibleTabs.map((seccion, index) => {
          const permitido = index <= indiceActual;
          const isActive = seccionActiva === seccion;

          return (
            <button
              key={seccion}
              onClick={() => permitido && onChangeSeccion(seccion)}
              disabled={!permitido}
              className={`h-[70px] w-[220px] rounded-[5px] transition-all duration-200 ${
                isActive ? TAB_BG_CLASSES[seccion] : 'bg-white hover:bg-gray-100'
              } ${permitido ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <p className={`font-['Poppins',sans-serif] font-semibold text-[15px] tracking-[0.8px] ${
                isActive ? 'text-white' : 'text-[#40376d]'
              }`}>
                {TAB_LABELS[seccion]}
              </p>
            </button>
          );
        })}
      </div>
    </>
  );
}
