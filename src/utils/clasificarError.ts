import type { TipoError } from '../types';

export function clasificarError(error: string): { tipo: TipoError; mensaje: string } {
  const e = error.toLowerCase();

  // ─────────────────────────────────────────────────────────────────────────────
  // Patrones basados en HTTP status + code (formato: "[HTTP 4xx]: msg [code:xxx]")
  // Tienen prioridad sobre los patrones de texto libre
  // ─────────────────────────────────────────────────────────────────────────────

  // HTTP 401 → siempre API Key inválida
  if (e.includes('[http 401]')) {
    return { tipo: 'api_key', mensaje: 'La API Key es incorrecta o ha sido revocada. Ve a Identificación y pégala nuevamente.' };
  }

  // HTTP 403 → cuenta suspendida o sin acceso al modelo
  if (e.includes('[http 403]')) {
    return { tipo: 'api_key', mensaje: 'La API Key no tiene permisos o la cuenta está suspendida. Verifica el estado de tu cuenta en OpenAI.' };
  }

  // HTTP 404 → modelo no encontrado
  if (e.includes('[http 404]') || e.includes('code:model_not_found')) {
    return { tipo: 'otro', mensaje: 'El modelo de IA solicitado no existe o no está disponible en esta cuenta.' };
  }

  // Codes de cuota/facturación (pueden venir en 400, 429 u otros)
  if (
    e.includes('code:insufficient_quota') ||
    e.includes('code:billing_hard_limit_reached') ||
    e.includes('code:account_deactivated') ||
    e.includes('code:billing_not_active')
  ) {
    return { tipo: 'cuota_excedida', mensaje: 'La API Key no tiene créditos o la cuenta tiene un problema de facturación. Recarga el saldo en OpenAI o usa otra Key.' };
  }

  // Code de rate limit
  if (e.includes('code:rate_limit_exceeded') || e.includes('code:tokens_exceeded')) {
    return { tipo: 'rate_limit', mensaje: 'Se alcanzó el límite de solicitudes por minuto. Espera unos minutos y reintenta.' };
  }

  // Code de API key inválida
  if (e.includes('code:invalid_api_key') || e.includes('code:no_such_api_key')) {
    return { tipo: 'api_key', mensaje: 'La API Key es incorrecta o no existe. Ve a Identificación y verifica que la hayas copiado completa.' };
  }

  // HTTP 400 con problemas de facturación/billing
  if (
    e.includes('[http 400]') && (
      e.includes('billing') ||
      e.includes('payment') ||
      e.includes('quota') ||
      e.includes('credit') ||
      e.includes('funds') ||
      e.includes('plan')
    )
  ) {
    return { tipo: 'cuota_excedida', mensaje: 'La cuenta no tiene método de pago válido o el saldo es insuficiente. Verifica tu facturación en OpenAI.' };
  }

  // HTTP 400 genérico (Bad Request, sin mensaje específico)
  if (e.includes('[http 400]')) {
    return { tipo: 'otro', mensaje: 'La solicitud fue rechazada por la API (Bad Request). Puede ser un problema temporal o de configuración de la cuenta.' };
  }

  // HTTP 413 / payload too large
  if (e.includes('[http 413]') || e.includes('request too large') || e.includes('payload too large') || e.includes('content too large')) {
    return { tipo: 'imagen_grande', mensaje: 'El archivo PDF genera una imagen demasiado grande para la API. Intenta con un PDF de menor resolución.' };
  }

  // HTTP 429 → rate limit o cuota (según mensaje)
  if (e.includes('[http 429]')) {
    if (e.includes('quota') || e.includes('insufficient') || e.includes('exceeded your current quota')) {
      return { tipo: 'cuota_excedida', mensaje: 'La API Key no tiene créditos disponibles. Recarga el saldo en OpenAI o usa otra Key.' };
    }
    return { tipo: 'rate_limit', mensaje: 'Se alcanzó el límite de solicitudes por minuto. Espera unos minutos y reintenta.' };
  }

  // HTTP 500 / 503
  if (e.includes('[http 500]') || e.includes('[http 503]') || e.includes('[http 502]')) {
    return { tipo: 'servidor', mensaje: 'El servidor de IA está con problemas temporales. Reintenta en unos minutos.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Patrones de texto libre (para errores de versiones anteriores o stderr)
  // ─────────────────────────────────────────────────────────────────────────────

  // API KEY INVALIDA
  if (
    e.includes('incorrect api key') ||
    e.includes('invalid api key') ||
    e.includes('invalid_api_key') ||
    e.includes('invalid x-api-key') ||
    e.includes('authentication_error') ||
    e.includes('unauthorized') ||
    e.includes('invalid bearer') ||
    e.includes('no such api key')
  ) {
    return { tipo: 'api_key', mensaje: 'La API Key es incorrecta. Ve a Identificación y verifica que la hayas copiado completa.' };
  }

  // CUOTA / CREDITOS AGOTADOS
  if (
    e.includes('exceeded your current quota') ||
    e.includes('credit balance is too low') ||
    e.includes('insufficient_quota') ||
    e.includes('insufficient credits') ||
    e.includes('out of credits') ||
    e.includes('billing hard limit') ||
    e.includes('account deactivated') ||
    e.includes('billing')
  ) {
    return { tipo: 'cuota_excedida', mensaje: 'La API Key no tiene créditos disponibles. Recarga tu saldo en OpenAI o usa otra API Key.' };
  }

  // RATE LIMIT
  if (
    e.includes('rate limit') ||
    e.includes('rate_limit') ||
    e.includes('too many requests') ||
    e.includes('exceeded your per-model limit') ||
    e.includes('tokens per minute')
  ) {
    return { tipo: 'rate_limit', mensaje: 'Se alcanzó el límite de solicitudes por minuto de la API. Espera unos minutos y reintenta.' };
  }

  // SERVIDOR NO DISPONIBLE
  if (
    e.includes('server had an error') ||
    e.includes('overloaded_error') ||
    e.includes('overloaded') ||
    e.includes('internal server error') ||
    e.includes('service unavailable') ||
    e.includes('bad gateway') ||
    e.includes('502') ||
    e.includes('503')
  ) {
    return { tipo: 'servidor', mensaje: 'El servidor de IA está sobrecargado o con problemas temporales. Reintenta en unos minutos.' };
  }

  // CONEXION A INTERNET
  if (
    e.includes('could not resolve host') ||
    e.includes('failed to connect') ||
    e.includes('connection refused') ||
    e.includes('connection timed out') ||
    e.includes('network error') ||
    e.includes('econnrefused') ||
    e.includes('enotfound') ||
    e.includes('etimedout') ||
    e.includes('econnreset') ||
    e.includes('socket hang up') ||
    e.includes('getaddrinfo') ||
    e.includes('no internet') ||
    e.includes('offline') ||
    e.includes('premature eof') ||
    e.includes('unexpected eof') ||
    e.includes('connection reset')
  ) {
    return { tipo: 'conexion', mensaje: 'No hay conexión a internet o el servidor no responde. Verifica tu conexión y reintenta.' };
  }

  // IMAGEN MUY GRANDE
  if (
    e.includes('request too large') ||
    e.includes('payload too large') ||
    e.includes('content too large') ||
    e.includes('maximum context length') ||
    e.includes('tokens') && e.includes('exceed')
  ) {
    return { tipo: 'imagen_grande', mensaje: 'El archivo PDF genera una imagen demasiado grande para la API. Intenta con un PDF de menor resolución.' };
  }

  // PDF CORRUPTO O MAL ESCANEADO
  if (
    e.includes('pdf file is damaged') ||
    e.includes('pdf damaged') ||
    e.includes('not a pdf file') ||
    e.includes('error reading page') ||
    e.includes('unable to read image') ||
    e.includes('corrupted') ||
    e.includes('pdf is empty') ||
    e.includes('no pages') ||
    e.includes('no se pudo alinear') ||
    e.includes('no se detecto marcador') ||
    e.includes('error en preparacion') ||
    e.includes('no se pudo leer') ||
    e.includes('warpperspective') ||
    e.includes('perspectiva')
  ) {
    return { tipo: 'pdf_corrupto', mensaje: 'El PDF no pudo procesarse. Puede estar dañado, mal escaneado o rotado. Descárgalo nuevamente.' };
  }

  // ARCHIVO NO ENCONTRADO
  if (
    e.includes('no such file or directory') ||
    e.includes('cannot open file') ||
    e.includes('file not found') ||
    e.includes('does not exist')
  ) {
    return { tipo: 'pdf_no_encontrado', mensaje: 'El archivo PDF no se encontró en la ruta indicada. Puede que se haya movido o eliminado.' };
  }

  // RESPUESTA DE IA NO INTERPRETABLE
  if (
    e.includes('no se pudo parsear') ||
    e.includes('sin datos extraidos') ||
    e.includes('respuesta inesperada de la api') ||
    e.includes('parse error') ||
    e.includes('unexpected token') ||
    e.includes('unexpected end') ||
    e.includes('json parse') ||
    e.includes('no se encontro json valido') ||
    e.includes('no hay datos de ubicacion') ||
    e.includes('no hay datos de votos') ||
    e.includes('sin campo content')
  ) {
    return { tipo: 'respuesta_ia', mensaje: 'La IA no pudo leer correctamente este PDF. El formato puede ser diferente al esperado. Reintenta o revísalo manualmente.' };
  }

  // PYTHON PORTABLE / OPENCV NO DISPONIBLE
  if (
    e.includes('python portable no disponible') ||
    e.includes('python/opencv no disponible') ||
    e.includes('error al inicializar python') ||
    e.includes('no se pudo cargar cv2') ||
    (e.includes('reticulate') && (e.includes('error') || e.includes('failed') || e.includes('no se pudo'))) ||
    (e.includes('cv2') && !e.includes('api')) ||
    (e.includes('numpy') && e.includes('error'))
  ) {
    return { tipo: 'python', mensaje: 'Python portable no está disponible o sus módulos están dañados. Reinstala la aplicación.' };
  }

  // PAQUETE R FALTANTE
  if (
    e.includes('no package called') ||
    e.includes('there is no package') ||
    (e.includes('package') && e.includes('not found'))
  ) {
    return { tipo: 'otro', mensaje: 'Falta una dependencia de R. Verifica tu conexión a internet y vuelve a intentar (se instalará automáticamente).' };
  }

  // ERROR DESCONOCIDO
  return {
    tipo: 'otro',
    mensaje: `Error inesperado: ${error}`
  };
}