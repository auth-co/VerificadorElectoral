interface UpdateBannerProps {
  available: string | null;
  progress: number | null;
  ready: boolean;
  updateError: string | null;
  canRetry: boolean;
  onDownload: () => void;
  onInstall: () => void;
  onManualDownload: () => void;
}

export default function UpdateBanner({ available, progress, ready, updateError, canRetry, onDownload, onInstall, onManualDownload }: UpdateBannerProps) {
  if (!available && progress === null && !ready && !updateError) return null;

  if (ready) {
    return (
      <div className="sticky top-0 z-50 bg-[#2d2557] border-b border-[#00c853] px-6 py-3 flex items-center justify-between">
        <p className="font-['Poppins',sans-serif] text-[#f3f3f3] text-sm">
          Actualización lista. Reinicie para aplicar.
        </p>
        <button
          onClick={onInstall}
          className="bg-[#00c853] text-white font-['Poppins',sans-serif] font-semibold text-sm px-4 py-1.5 rounded hover:bg-[#00b248] transition-colors"
        >
          Reiniciar ahora
        </button>
      </div>
    );
  }

  if (updateError) {
    return (
      <div className="sticky top-0 z-50 bg-[#2d2557] border-b border-[#ff5a5a] px-6 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-['Poppins',sans-serif] text-[#ff5a5a] text-sm">
            Error al actualizar. Descarga e instala manualmente la nueva versión.
          </p>
          <p className="font-['Poppins',sans-serif] text-[#ff5a5a]/70 text-xs mt-0.5 font-mono">{updateError}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canRetry && (
            <button
              onClick={onDownload}
              className="bg-transparent border border-[#ff5a5a] text-[#ff5a5a] font-['Poppins',sans-serif] font-semibold text-sm px-4 py-1.5 rounded hover:bg-[#ff5a5a]/10 transition-colors"
            >
              Reintentar
            </button>
          )}
          <button
            onClick={onManualDownload}
            className="bg-[#ff5a5a] text-white font-['Poppins',sans-serif] font-semibold text-sm px-4 py-1.5 rounded hover:bg-[#e54a4a] transition-colors"
          >
            Descarga manual
          </button>
        </div>
      </div>
    );
  }

  if (progress !== null) {
    const verificando = progress >= 100;
    return (
      <div className="sticky top-0 z-50 bg-[#2d2557] border-b border-[#ffb700] px-6 py-3">
        <p className="font-['Poppins',sans-serif] text-[#f3f3f3] text-sm mb-1">
          {verificando ? 'Verificando archivo descargado...' : `Descargando actualización... ${progress}%`}
        </p>
        <div className="w-full bg-[#40376d] rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${verificando ? 'bg-[#00c853] animate-pulse' : 'bg-[#ffb700]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (available) {
    return (
      <div className="sticky top-0 z-50 bg-[#2d2557] border-b border-[#ffb700] px-6 py-3 flex items-center justify-between gap-3">
        <p className="font-['Poppins',sans-serif] text-[#f3f3f3] text-sm">
          Nueva versión disponible: <span className="font-bold text-[#ffb700]">v{available}</span>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onManualDownload}
            className="bg-transparent border border-[#ffb700] text-[#ffb700] font-['Poppins',sans-serif] font-semibold text-sm px-4 py-1.5 rounded hover:bg-[#ffb700]/10 transition-colors"
          >
            Descarga manual
          </button>
          <button
            onClick={onDownload}
            className="bg-[#ffb700] text-[#1a1333] font-['Poppins',sans-serif] font-semibold text-sm px-4 py-1.5 rounded hover:bg-[#e6a600] transition-colors"
          >
            Descargar
          </button>
        </div>
      </div>
    );
  }

  return null;
}
