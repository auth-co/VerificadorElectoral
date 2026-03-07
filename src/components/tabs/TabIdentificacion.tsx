import StepBadge from '../StepBadge';
import type { Zona } from '../../divipoleData';

interface TabIdentificacionProps {
  tipoEleccion: string;
  circunscripcion: string;
  departamento: string;
  municipio: string;
  zona: string;
  keyAsignada: string;
  esCITREP: boolean;
  tiposEleccion: string[];
  circunscripcionesCITREP: string[];
  departamentosFiltrados: string[];
  municipiosFiltrados: string[];
  zonasFiltradas: Zona[];
  onTipoEleccion: (v: string) => void;
  onCircunscripcion: (v: string) => void;
  onDepartamento: (v: string) => void;
  onMunicipio: (v: string) => void;
  onZona: (v: string) => void;
  onKeyAsignada: (v: string) => void;
  onContinuar: () => void;
}

export default function TabIdentificacion({
  tipoEleccion, circunscripcion, departamento, municipio, zona, keyAsignada,
  esCITREP, tiposEleccion, circunscripcionesCITREP,
  departamentosFiltrados, municipiosFiltrados, zonasFiltradas,
  onTipoEleccion, onCircunscripcion, onDepartamento, onMunicipio, onZona, onKeyAsignada,
  onContinuar
}: TabIdentificacionProps) {
  const selectClass = "w-full h-[42px] bg-[#d9d9d9] rounded-[8px] px-3 text-[#40376d] font-['Poppins',sans-serif] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ffb700] disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 animate-fadeIn max-w-[1000px] mx-auto">
        <div className="max-w-[380px]">
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number={1} />
            <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-lg">
              Escoge el tipo de elección que te fue asignado.
            </p>
          </div>
          <p className="font-['Poppins',sans-serif] italic text-[#40376d] text-base mb-6 ml-14">
            Guíate con el nombre de los archivos en la carpeta.
          </p>

          <div className="space-y-4">
            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-[#40376d] text-lg block mb-2">TIPO DE ELECCIÓN</label>
              <select value={tipoEleccion} onChange={(e) => onTipoEleccion(e.target.value)} className={selectClass}>
                <option value="">Seleccionar...</option>
                {tiposEleccion.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>

            {esCITREP && (
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-[#40376d] text-lg block mb-2">CIRCUNSCRIPCIÓN</label>
                <select value={circunscripcion} onChange={(e) => onCircunscripcion(e.target.value)} disabled={!tipoEleccion} className={selectClass}>
                  <option value="">Seleccionar...</option>
                  {circunscripcionesCITREP.map((circ) => <option key={circ} value={circ}>{circ}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-[#40376d] text-lg block mb-2">DEPARTAMENTO</label>
              <select value={departamento} onChange={(e) => onDepartamento(e.target.value)} disabled={esCITREP ? !circunscripcion : !tipoEleccion} className={selectClass}>
                <option value="">Seleccionar...</option>
                {departamentosFiltrados.map((dep) => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-[#40376d] text-lg block mb-2">MUNICIPIO</label>
              <select value={municipio} onChange={(e) => onMunicipio(e.target.value)} disabled={!departamento} className={selectClass}>
                <option value="">Seleccionar...</option>
                {municipiosFiltrados.map((mun) => <option key={mun} value={mun}>{mun}</option>)}
              </select>
            </div>

            <div>
              <label className="font-['Poppins',sans-serif] font-semibold text-[#40376d] text-lg block mb-2">ZONA</label>
              <select value={zona} onChange={(e) => onZona(e.target.value)} disabled={!municipio} className={selectClass}>
                <option value="">Seleccionar...</option>
                {zonasFiltradas.map((z) => <option key={z.codigo} value={z.codigo}>{z.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-[380px]">
          <div className="flex items-center gap-3 mb-4">
            <StepBadge number={2} />
            <p className="font-['Poppins',sans-serif] font-medium text-[#40376d] text-lg">
              Ingresa la API Key que te fue asignada.
            </p>
          </div>

          <div className="mt-8">
            <label className="font-['Poppins',sans-serif] font-semibold text-[#40376d] text-lg block mb-2">API KEY</label>
            <input
              type="password"
              value={keyAsignada}
              onChange={(e) => onKeyAsignada(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full h-[42px] bg-[#d9d9d9] rounded-[8px] px-3 text-[#40376d] font-['Poppins',sans-serif] focus:outline-none focus:ring-2 focus:ring-[#ffb700] placeholder:text-[#888]"
            />
            <p className="font-['Poppins',sans-serif] text-xs text-[#888] mt-2">
              API Key de OpenAI. Se guarda localmente.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={onContinuar}
          className="h-[53px] w-[226px] bg-[#ffb700] rounded-[8px] hover:bg-[#e5a500] transition-colors cursor-pointer"
        >
          <span className="font-['Poppins',sans-serif] font-semibold text-white text-2xl tracking-wider">CONTINUAR</span>
        </button>
      </div>
    </>
  );
}
