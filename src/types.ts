export type Seccion = 'informacion' | 'identificacion' | 'extraccion' | 'comparacion_automatica' | 'comparacion_archivos' | 'comparacion_manual';

export type TipoError = 'api_key' | 'cuota_excedida' | 'rate_limit' | 'conexion' | 'servidor' | 'pdf_corrupto' | 'pdf_no_encontrado' | 'respuesta_ia' | 'imagen_grande' | 'python' | 'otro';

export interface ArchivoExitoso {
  archivo: string;
  filas: number;
  validacion: string;
}

export interface ArchivoFallido {
  archivo: string;
  ruta: string;
  error: string;
}

export interface DiscrepanciaFila {
  mesa: string;
  puesto: string;
  nombre: string;
  votos_oficial: number;
  votos_extraido: number;
  discrepancia: number;
  tipo: string;
}

export interface EventoR {
  tipo: string;
  archivo?: string;
  ruta?: string;
  indice?: number;
  total?: number;
  filas?: number;
  error?: string;
  mensaje?: string;
  lote?: number;
  total_lotes?: number;
  exitosos?: number;
  fallidos?: number;
  nombre?: string;
  validacion?: string;
  paso?: string;
  total_registros?: number;
  total_coinciden?: number;
  total_discrepancias?: number;
  porcentaje_coinciden?: number;
  casos_registraduria_mas?: number;
  votos_registraduria_mas?: number;
  casos_registraduria_menos?: number;
  votos_registraduria_menos?: number;
  no_encontrados?: number;
  archivo_discrepancias?: string;
  archivo_completo?: string;
  detalle?: DiscrepanciaFila[];
}

export interface ResultadoComparacion {
  total_registros: number;
  total_coinciden: number;
  total_discrepancias: number;
  porcentaje_coinciden: number;
  casos_registraduria_mas: number;
  votos_registraduria_mas: number;
  casos_registraduria_menos: number;
  votos_registraduria_menos: number;
}

declare global {
  interface Window {
    electronAPI?: {
      obtenerCarpetaTrabajo: () => Promise<string>;
      seleccionarPDFs: () => Promise<{ carpeta: string; archivos: string[] }>;
      seleccionarCSV: () => Promise<string | null>;
      seleccionarCarpetaMMV: () => Promise<string | null>;
      abrirCarpeta: (ruta?: string) => Promise<boolean>;
      abrirRuta: (rutaAbsoluta: string) => Promise<boolean>;
      abrirURL: (url: string) => Promise<boolean>;
      guardarConfiguracion: (config: object) => Promise<boolean>;
      cargarConfiguracion: () => Promise<object | null>;
      verificarR: () => Promise<{ disponible: boolean; ruta: string; version: string | null }>;
      cancelarProcesoR: () => Promise<{ success: boolean; error?: string }>;
      convertirPDFaCSVv2: (params: {
        archivos: string[];
        apiKey: string;
        modo?: string;
        tipoEleccion?: string;
        codigoDepartamento?: string;
        circunscripcion?: string;
      }) => Promise<{
        success: boolean;
        code?: number;
        outputDir?: string;
        procesoLog?: {
          exitosos: ArchivoExitoso[];
          fallidos: ArchivoFallido[];
          estadisticas: { total: number; ok: number; error: number; tasa_exito: number };
        };
        error?: string;
        criticalError?: string | null;
        resultadoFinal?: object | null;
      }>;
      fusionarCSVs: () => Promise<{ success: boolean; archivoFinal?: string; error?: string }>;
      leerLogProceso: () => Promise<object | null>;
      obtenerFallidos: () => Promise<ArchivoFallido[]>;
      seleccionarCarpetaSalida: () => Promise<string | null>;
      compararE14E24: (archivoCSV: string, archivoMMV: string, carpetaSalida?: string) => Promise<{
        success: boolean;
        error?: string;
        outputDir?: string;
        resultado?: ResultadoComparacion & { no_encontrados: number; archivo_discrepancias: string; archivo_completo: string };
      }>;
      abrirResultados: () => Promise<{ success: boolean; path?: string; error?: string }>;
      abrirCarpetaCoordenadas: () => Promise<{ success: boolean; path?: string; error?: string }>;
      onEventoR: (callback: (data: EventoR) => void) => void;
      removeEventoR: () => void;
      obtenerSecurityStatus: () => Promise<{ status: string; message?: string; tier?: string }>;
      onSecurityStatus: (callback: (data: { status: string; message?: string; tier?: string }) => void) => void;
      removeSecurityStatus: () => void;
      descargarActualizacion: () => Promise<{ success: boolean; error?: string }>;
      instalarActualizacion: () => void;
      onUpdateAvailable: (callback: (data: { version: string }) => void) => void;
      onUpdateProgress: (callback: (data: { percent: number }) => void) => void;
      onUpdateDownloaded: (callback: (data: { version: string }) => void) => void;
      onUpdateError?: (callback: (data: { message: string }) => void) => void;
      removeUpdateListeners: () => void;
      autoUploadDrive: (params: {
        archivoFinal: string;
        tipo: string;
        circunscripcion?: string;
        depFolder: string;
        munFolder: string;
        zonaFolder: string;
      }) => Promise<{ success: boolean; url?: string; error?: string }>;
    };
  }
}
