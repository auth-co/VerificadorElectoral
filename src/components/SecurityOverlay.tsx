interface SecurityOverlayProps {
  status: string;
  message: string;
}

export default function SecurityOverlay({ status, message }: SecurityOverlayProps) {
  if (status === 'ok' || status === 'pending') return null;

  const emojis: Record<string, string> = {
    no_usb: '\u{1F512}',
    usb_expirada: '\u{23F0}',
    sin_conexion: '\u{1F310}',
    usb_no_autorizada: '\u{1F6AB}',
    llave_invalida: '\u{1F6AB}',
    registro_corrupto: '\u{1F6AB}',
  };

  const titles: Record<string, string> = {
    no_usb: 'INSERTE LA LLAVE USB',
    usb_no_autorizada: 'USB NO AUTORIZADA',
    llave_invalida: 'LLAVE INVALIDA',
    usb_expirada: 'USB EXPIRADA',
    sin_conexion: 'SIN CONEXION',
    registro_corrupto: 'ERROR DE REGISTRO',
  };

  const messages: Record<string, string> = {
    no_usb: 'Esta aplicación requiere una llave USB autorizada para funcionar. Inserte la USB y reinicie la aplicación.',
    usb_no_autorizada: 'La USB insertada no está registrada como llave autorizada. Contacte al administrador del sistema.',
    llave_invalida: 'La llave de seguridad en la USB es inválida o los archivos están corruptos. Contacte al administrador.',
    usb_expirada: 'La autorización de esta USB ha expirado. Contacte al administrador para renovar su acceso.',
    sin_conexion: 'Se requiere conexión a internet para verificar la llave USB. Conéctese a internet y reinicie la aplicación.',
    registro_corrupto: 'El registro de USBs autorizadas tiene una firma inválida. Contacte al administrador del sistema.',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#1a1333] flex items-center justify-center">
      <div className="text-center max-w-lg px-8">
        <div className="text-7xl mb-6">
          {emojis[status] || '\u{1F6AB}'}
        </div>
        <h2 className="font-['Poppins',sans-serif] font-bold text-[#ff5a5a] text-3xl mb-4">
          {titles[status] || 'ERROR DE SEGURIDAD'}
        </h2>
        <p className="font-['Poppins',sans-serif] text-[#f3f3f3] text-lg mb-6">
          {messages[status] || 'Error de seguridad desconocido.'}
        </p>
        {message && (
          <p className="font-['Poppins',sans-serif] text-[#999] text-sm mt-4">
            {message}
          </p>
        )}
        <div className="mt-8 py-3 px-6 bg-[#40376d] rounded-lg inline-block">
          <p className="font-['Poppins',sans-serif] text-[#ffb700] text-sm font-semibold">
            Cierre y vuelva a abrir la aplicación después de corregir el problema.
          </p>
        </div>
      </div>
    </div>
  );
}
