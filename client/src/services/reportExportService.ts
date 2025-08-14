/**
 * @fileoverview Servicio de exportación de reportes de tiempos de espera
 * 
 * Este módulo proporciona servicios especializados para exportar reportes de análisis
 * de tiempos de espera en múltiples formatos (Excel y CSV). Incluye procesamiento
 * avanzado de datos, generación de estadísticas y creación de reportes estructurados
 * con información detallada por sucursal, servicio y punto de atención.
 * 
 * @version 2.0.0
 * @since 2025-01-30
 * @lastModified 2025-07-15
 * 
 * @example
 * ```typescript
 * // Exportar reporte en Excel
 * await ReportExportService.exportReport('excel', exportData);
 * 
 * // Exportar reporte en CSV
 * await ReportExportService.exportReport('csv', exportData);
 * ```
 */

import * as XLSX from 'xlsx';

// =========================================================================
// TIPOS E INTERFACES
// =========================================================================

/**
 * Tipos de formato de exportación disponibles
 * 
 * @public
 * @typedef {('excel' | 'csv')} ExportFormat
 * @description Define los formatos de archivo soportados para exportación
 */
export type ExportFormat = 'excel' | 'csv';

/**
 * Configuración de filtros aplicados al reporte
 * 
 * @public
 * @interface ExportFilters
 * @description Define los parámetros de filtrado que se pueden aplicar
 * a los datos antes de la exportación
 */
export interface ExportFilters {
  /** 
   * Fecha de inicio del período de análisis en formato YYYY-MM-DD
   * @example "2025-01-01"
   */
  startDate?: string;
  
  /** 
   * Fecha de fin del período de análisis en formato YYYY-MM-DD
   * @example "2025-01-31"
   */
  endDate?: string;
  
  /** 
   * Identificador único de la sucursal para filtrar datos específicos
   * @example 123
   */
  branchId?: number;
  
  /** 
   * Identificador único del servicio para filtrar datos específicos
   * @example 456
   */
  serviceId?: number;
  
  /** 
   * Identificador único del punto de atención para filtrar datos específicos
   * @example 789
   */
  servicePointId?: number;
}

/**
 * Estructura de datos principal para exportación de reportes
 * 
 * @public
 * @interface ExportData
 * @description Contiene todos los datos necesarios para generar un reporte
 * completo de tiempos de espera, incluyendo resúmenes, datos por categoría
 * y metadatos de configuración
 */
export interface ExportData {
  /** 
   * Datos de resumen general del reporte (opcional)
   * @description Contiene métricas globales como tiempo promedio general,
   * total de atenciones completadas, etc.
   */
  summary?: any;
  
  /** 
   * Colección de datos agrupados por sucursal (opcional)
   * @description Array con información detallada de rendimiento por cada sucursal
   */
  branches?: any[];
  
  /** 
   * Colección de datos agrupados por servicio (opcional)
   * @description Array con información detallada de rendimiento por cada servicio
   */
  services?: any[];
  
  /** 
   * Colección de datos agrupados por punto de atención (opcional)
   * @description Array con información detallada de rendimiento por cada punto
   */
  servicePoints?: any[];
  
  /** 
   * Configuración de filtros aplicados al reporte
   * @description Especifica los criterios de filtrado utilizados para generar los datos
   */
  filters: ExportFilters;
  
  /** 
   * Marca de tiempo de generación del reporte en formato ISO
   * @example "2025-07-15T10:30:00.000Z"
   */
  generatedAt: string;
}

/**
 * Métrica de tiempo de espera con estadísticas descriptivas
 * 
 * @private
 * @interface WaitTimeMetric
 * @description Define la estructura para métricas estadísticas de tiempos de espera
 */
interface WaitTimeMetric {
  /** Tiempo promedio de espera en minutos */
  average: number;
  
  /** Tiempo mínimo de espera registrado en minutos */
  minimum: number;
  
  /** Tiempo máximo de espera registrado en minutos */
  maximum: number;
  
  /** Tiempo mediano de espera en minutos (opcional) */
  median?: number;
}

/**
 * Datos procesados para exportación en formato legacy
 * 
 * @private
 * @interface ProcessedExportData
 * @description Estructura de datos simplificada para compatibilidad
 * con versiones anteriores del sistema de exportación
 * @deprecated Usar OrganizedExportData para nuevas implementaciones
 */
interface ProcessedExportData {
  /** Encabezados de las columnas del reporte */
  headers: string[];
  
  /** Matriz de datos organizados por filas y columnas */
  data: any[][];
  
  /** Nombre base del archivo sin extensión */
  fileName: string;
}

/**
 * Estructura de datos organizados por secciones para exportación avanzada
 * 
 * @private
 * @interface OrganizedExportData
 * @description Organiza los datos del reporte en secciones estructuradas
 * para generar exportaciones más detalladas y profesionales
 */
interface OrganizedExportData {
  /** 
   * Sección de resumen ejecutivo
   * @description Contiene métricas generales y estadísticas de alto nivel
   */
  summary: {
    /** Encabezados específicos para la sección de resumen */
    headers: string[];
    
    /** Datos del resumen organizados en filas */
    data: any[][];
    
    /** Estadísticas calculadas para el resumen */
    stats: any;
  };
  
  /** 
   * Sección de análisis por sucursal
   * @description Contiene datos detallados y estadísticas por cada sucursal
   */
  branches: {
    /** Encabezados específicos para datos de sucursales */
    headers: string[];
    
    /** Datos de sucursales organizados en filas */
    data: any[][];
    
    /** Estadísticas calculadas para sucursales */
    stats: any;
  };
  
  /** 
   * Sección de análisis por servicio
   * @description Contiene datos detallados y estadísticas por cada servicio
   */
  services: {
    /** Encabezados específicos para datos de servicios */
    headers: string[];
    
    /** Datos de servicios organizados en filas */
    data: any[][];
    
    /** Estadísticas calculadas para servicios */
    stats: any;
  };
  
  /** 
   * Sección de análisis por punto de atención
   * @description Contiene datos detallados y estadísticas por cada punto
   */
  servicePoints: {
    /** Encabezados específicos para datos de puntos de atención */
    headers: string[];
    
    /** Datos de puntos de atención organizados en filas */
    data: any[][];
    
    /** Estadísticas calculadas para puntos de atención */
    stats: any;
  };
  
  /** Nombre base del archivo sin extensión */
  fileName: string;
}

// =========================================================================
// SERVICIO BASE DE EXPORTACIÓN
// =========================================================================

/**
 * Clase base abstracta para servicios de exportación
 * 
 * @abstract
 * @class BaseExportService
 * @description Proporciona funcionalidades comunes y métodos utilitarios
 * para todos los servicios de exportación. Incluye procesamiento de datos,
 * formato de tiempo, descarga de archivos y generación de estadísticas.
 * 
 * @example
 * ```typescript
 * // Los servicios hijos extienden esta clase
 * class ExcelExportService extends BaseExportService {
 *   static async export(data: ExportData): Promise<void> {
 *     const processed = this.processOrganizedDataForExport(data);
 *     // ... lógica específica de Excel
 *   }
 * }
 * ```
 */
abstract class BaseExportService {
  /**
   * Descarga un archivo en el navegador del usuario
   * 
   * @protected
   * @static
   * @method downloadFile
   * @param {Blob} blob - Objeto Blob que contiene los datos del archivo
   * @param {string} fileName - Nombre del archivo con extensión
   * 
   * @description Crea un enlace temporal para descargar el archivo y lo
   * remueve automáticamente después de la descarga. Incluye limpieza
   * de memoria para evitar fugas.
   * 
   * @example
   * ```typescript
   * const blob = new Blob([data], { type: 'text/csv' });
   * this.downloadFile(blob, 'reporte.csv');
   * ```
   */
  protected static downloadFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar la URL del objeto
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Formatea un tiempo en minutos a un formato legible
   * 
   * @protected
   * @static
   * @method formatTime
   * @param {number} minutes - Tiempo en minutos a formatear
   * @returns {string} Tiempo formateado como string legible
   * 
   * @description Convierte minutos a un formato human-readable:
   * - Menos de 60 min: "45m"
   * - 60+ min: "1h 30m" o "2h" (si no hay minutos restantes)
   * 
   * @example
   * ```typescript
   * this.formatTime(45)   // "45m"
   * this.formatTime(90)   // "1h 30m"
   * this.formatTime(120)  // "2h"
   * this.formatTime(0)    // "0m"
   * ```
   */
  protected static formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  /**
   * Procesa y organiza los datos para exportación estructurada por secciones
   * 
   * @protected
   * @static
   * @method processOrganizedDataForExport
   * @param {ExportData} data - Datos de entrada con información del reporte
   * @returns {OrganizedExportData} Datos organizados por secciones con estadísticas
   * 
   * @description Transforma los datos brutos en una estructura organizada
   * que incluye:
   * - Sección de resumen ejecutivo con métricas generales
   * - Análisis detallado por sucursal con estadísticas
   * - Análisis detallado por servicio con métricas de eficiencia
   * - Análisis detallado por punto de atención con clasificación de rendimiento
   * - Cálculo automático de estadísticas descriptivas para cada sección
   * 
   * @throws {Error} Si los datos de entrada están malformados
   * 
   * @example
   * ```typescript
   * const exportData: ExportData = {
   *   summary: { avgWaitTime: 25, completedQueues: 150 },
   *   branches: [{ branchName: "Sucursal A", waitTime: {...} }],
   *   filters: { startDate: "2025-01-01", endDate: "2025-01-31" },
   *   generatedAt: "2025-07-15T10:30:00Z"
   * };
   * 
   * const organized = this.processOrganizedDataForExport(exportData);
   * console.log(organized.summary.stats.avgWaitTime); // 25
   * ```
   */
  protected static processOrganizedDataForExport(data: ExportData): OrganizedExportData {
    const fileName = `reporte-tiempos-espera-${new Date().toISOString().slice(0, 10)}`;

    // ========= SECCIÓN RESUMEN =========
    const summaryHeaders = [
      'Métrica',
      'Valor',
      'Descripción'
    ];

    const summaryData: any[][] = [];
    let summaryStats: any = {};

    if (data.summary) {
      const avgWait = data.summary.avgWaitTime || 0;
      const totalCompleted = data.summary.completedQueues || 0;
      
      summaryData.push(
        ['Tiempo Promedio de Espera', this.formatTime(avgWait), 'Promedio general de todos los servicios'],
        ['Total de Atenciones', totalCompleted.toLocaleString(), 'Número total de atenciones completadas'],
        ['Período de Análisis', `${data.filters.startDate || 'N/A'} - ${data.filters.endDate || 'N/A'}`, 'Rango de fechas analizado']
      );

      summaryStats = {
        avgWaitTime: avgWait,
        totalCompleted,
        period: `${data.filters.startDate || 'N/A'} - ${data.filters.endDate || 'N/A'}`
      };
    }

    // ========= SECCIÓN SUCURSALES =========
    const branchHeaders = [
      'Nombre de la Sucursal',
      'Tiempo Promedio',
      'Tiempo Mínimo', 
      'Tiempo Máximo',
      'Tiempo Mediano',
      'Total Atenciones',
      'Porcentaje del Total'
    ];

    const branchData: any[][] = [];
    let branchStats: any = {};

    if (data.branches && data.branches.length > 0) {
      const totalBranchAttentions = data.branches.reduce((sum, branch) => sum + (branch.totalProcessed || 0), 0);
      
      data.branches.forEach(branch => {
        const waitTime = branch.waitTime as WaitTimeMetric;
        const attentions = branch.totalProcessed || 0;
        const percentage = totalBranchAttentions > 0 ? ((attentions / totalBranchAttentions) * 100).toFixed(1) : '0';
        
        branchData.push([
          branch.branchName || 'Sin nombre',
          waitTime ? this.formatTime(waitTime.average) : 'N/A',
          waitTime ? this.formatTime(waitTime.minimum) : 'N/A',
          waitTime ? this.formatTime(waitTime.maximum) : 'N/A',
          waitTime?.median ? this.formatTime(waitTime.median) : 'N/A',
          attentions.toLocaleString(),
          `${percentage}%`
        ]);
      });

      // Calcular estadísticas de sucursales
      const avgTimes = data.branches.filter(b => b.waitTime).map(b => b.waitTime.average);
      branchStats = {
        totalBranches: data.branches.length,
        totalAttentions: totalBranchAttentions,
        avgWaitTime: avgTimes.length > 0 ? avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length : 0,
        minWaitTime: avgTimes.length > 0 ? Math.min(...avgTimes) : 0,
        maxWaitTime: avgTimes.length > 0 ? Math.max(...avgTimes) : 0
      };
    }

    // ========= SECCIÓN SERVICIOS =========
    const serviceHeaders = [
      'Nombre del Servicio',
      'Sucursal',
      'Tiempo Promedio',
      'Tiempo Mínimo',
      'Tiempo Máximo', 
      'Tiempo Mediano',
      'Total Atenciones',
      'Eficiencia (%)'
    ];

    const serviceData: any[][] = [];
    let serviceStats: any = {};

    if (data.services && data.services.length > 0) {
      const totalServiceAttentions = data.services.reduce((sum, service) => sum + (service.totalProcessed || 0), 0);
      
      data.services.forEach(service => {
        const waitTime = service.waitTime as WaitTimeMetric;
        const attentions = service.totalProcessed || 0;
        // Calcular eficiencia basada en tiempo promedio (menor tiempo = mayor eficiencia)
        const avgTime = waitTime?.average || 0;
        const efficiency = avgTime > 0 ? Math.max(0, 100 - (avgTime / 60) * 10).toFixed(1) : 'N/A';
        
        serviceData.push([
          service.serviceName || 'Sin nombre',
          service.branchName || 'Sin sucursal',
          waitTime ? this.formatTime(waitTime.average) : 'N/A',
          waitTime ? this.formatTime(waitTime.minimum) : 'N/A',
          waitTime ? this.formatTime(waitTime.maximum) : 'N/A',
          waitTime?.median ? this.formatTime(waitTime.median) : 'N/A',
          attentions.toLocaleString(),
          efficiency !== 'N/A' ? `${efficiency}%` : 'N/A'
        ]);
      });

      // Calcular estadísticas de servicios
      const serviceAvgTimes = data.services.filter(s => s.waitTime).map(s => s.waitTime.average);
      serviceStats = {
        totalServices: data.services.length,
        totalAttentions: totalServiceAttentions,
        avgWaitTime: serviceAvgTimes.length > 0 ? serviceAvgTimes.reduce((a, b) => a + b, 0) / serviceAvgTimes.length : 0,
        minWaitTime: serviceAvgTimes.length > 0 ? Math.min(...serviceAvgTimes) : 0,
        maxWaitTime: serviceAvgTimes.length > 0 ? Math.max(...serviceAvgTimes) : 0
      };
    }

    // ========= SECCIÓN PUNTOS DE ATENCIÓN =========
    const servicePointHeaders = [
      'Nombre del Punto',
      'Sucursal',
      'Tiempo Promedio',
      'Tiempo Mínimo',
      'Tiempo Máximo',
      'Tiempo Mediano', 
      'Total Atenciones',
      'Estado de Rendimiento'
    ];

    const servicePointData: any[][] = [];
    let servicePointStats: any = {};

    if (data.servicePoints && data.servicePoints.length > 0) {
      const totalSPAttentions = data.servicePoints.reduce((sum, sp) => sum + (sp.totalProcessed || 0), 0);
      
      data.servicePoints.forEach(servicePoint => {
        const waitTime = servicePoint.waitTime as WaitTimeMetric;
        const attentions = servicePoint.totalProcessed || 0;
        
        // Determinar estado de rendimiento basado en tiempo promedio
        let performance = 'N/A';
        if (waitTime?.average !== undefined) {
          if (waitTime.average <= 15) performance = 'Excelente';
          else if (waitTime.average <= 30) performance = 'Bueno';
          else if (waitTime.average <= 60) performance = 'Regular';
          else performance = 'Necesita Mejora';
        }
        
        servicePointData.push([
          servicePoint.servicePointName || 'Sin nombre',
          servicePoint.branchName || 'Sin sucursal',
          waitTime ? this.formatTime(waitTime.average) : 'N/A',
          waitTime ? this.formatTime(waitTime.minimum) : 'N/A',
          waitTime ? this.formatTime(waitTime.maximum) : 'N/A',
          waitTime?.median ? this.formatTime(waitTime.median) : 'N/A',
          attentions.toLocaleString(),
          performance
        ]);
      });

      // Calcular estadísticas de puntos de atención
      const spAvgTimes = data.servicePoints.filter(sp => sp.waitTime).map(sp => sp.waitTime.average);
      servicePointStats = {
        totalServicePoints: data.servicePoints.length,
        totalAttentions: totalSPAttentions,
        avgWaitTime: spAvgTimes.length > 0 ? spAvgTimes.reduce((a, b) => a + b, 0) / spAvgTimes.length : 0,
        minWaitTime: spAvgTimes.length > 0 ? Math.min(...spAvgTimes) : 0,
        maxWaitTime: spAvgTimes.length > 0 ? Math.max(...spAvgTimes) : 0
      };
    }

    return {
      summary: {
        headers: summaryHeaders,
        data: summaryData,
        stats: summaryStats
      },
      branches: {
        headers: branchHeaders,
        data: branchData,
        stats: branchStats
      },
      services: {
        headers: serviceHeaders,
        data: serviceData,
        stats: serviceStats
      },
      servicePoints: {
        headers: servicePointHeaders,
        data: servicePointData,
        stats: servicePointStats
      },
      fileName
    };
  }

  /**
   * Procesa los datos para exportación en formato legacy (compatibilidad)
   * 
   * @protected
   * @static
   * @method processDataForExport
   * @param {ExportData} data - Datos de entrada del reporte
   * @returns {ProcessedExportData} Datos procesados en formato simple
   * 
   * @description Método de compatibilidad que procesa los datos en un formato
   * más simple y plano. Combina todos los tipos de datos (resumen, sucursales,
   * servicios, puntos) en una sola tabla con columnas estándar.
   * 
   * @deprecated Este método se mantiene para compatibilidad. Se recomienda
   * usar processOrganizedDataForExport para nuevas implementaciones.
   * 
   * @example
   * ```typescript
   * const processed = this.processDataForExport(exportData);
   * console.log(processed.headers); // ['Tipo', 'Nombre', 'Sucursal', ...]
   * ```
   */
  protected static processDataForExport(data: ExportData): ProcessedExportData {
    const headers = [
      'Tipo',
      'Nombre',
      'Sucursal',
      'Tiempo Promedio',
      'Tiempo Mínimo',
      'Tiempo Máximo',
      'Total Atenciones'
    ];

    const rows: any[][] = [];

    // Agregar datos de resumen si están disponibles
    if (data.summary) {
      rows.push([
        'Resumen General',
        'Métricas Globales',
        'Todas las sucursales',
        this.formatTime(data.summary.avgWaitTime || 0),
        'N/A',
        'N/A',
        data.summary.completedQueues || 0
      ]);
    }

    // Agregar datos por sucursal
    if (data.branches && data.branches.length > 0) {
      data.branches.forEach(branch => {
        const waitTime = branch.waitTime as WaitTimeMetric;
        rows.push([
          'Sucursal',
          branch.branchName || 'Sin nombre',
          branch.branchName || 'Sin nombre',
          waitTime ? this.formatTime(waitTime.average) : 'N/A',
          waitTime ? this.formatTime(waitTime.minimum) : 'N/A',
          waitTime ? this.formatTime(waitTime.maximum) : 'N/A',
          branch.totalProcessed || 0
        ]);
      });
    }

    // Agregar datos por servicio
    if (data.services && data.services.length > 0) {
      data.services.forEach(service => {
        const waitTime = service.waitTime as WaitTimeMetric;
        rows.push([
          'Servicio',
          service.serviceName || 'Sin nombre',
          service.branchName || 'Sin sucursal',
          waitTime ? this.formatTime(waitTime.average) : 'N/A',
          waitTime ? this.formatTime(waitTime.minimum) : 'N/A',
          waitTime ? this.formatTime(waitTime.maximum) : 'N/A',
          service.totalProcessed || 0
        ]);
      });
    }

    // Agregar datos por punto de atención
    if (data.servicePoints && data.servicePoints.length > 0) {
      data.servicePoints.forEach(servicePoint => {
        const waitTime = servicePoint.waitTime as WaitTimeMetric;
        rows.push([
          'Punto de Atención',
          servicePoint.servicePointName || 'Sin nombre',
          servicePoint.branchName || 'Sin sucursal',
          waitTime ? this.formatTime(waitTime.average) : 'N/A',
          waitTime ? this.formatTime(waitTime.minimum) : 'N/A',
          waitTime ? this.formatTime(waitTime.maximum) : 'N/A',
          servicePoint.totalProcessed || 0
        ]);
      });
    }

    // Generar nombre de archivo
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `reporte-tiempos-espera-${dateStr}`;

    return {
      headers,
      data: rows,
      fileName
    };
  }
}

// =========================================================================
// SERVICIO DE EXPORTACIÓN EXCEL
// =========================================================================

/**
 * Servicio especializado para exportación de reportes en formato Microsoft Excel
 * 
 * @class ExcelExportService
 * @extends BaseExportService
 * @description Genera archivos Excel (.xlsx) con múltiples hojas organizadas,
 * incluyendo formato de celdas, anchos de columna optimizados y estructura
 * profesional para análisis de datos.
 * 
 * Características del archivo Excel generado:
 * - Hoja "Resumen": Métricas ejecutivas y estadísticas generales
 * - Hoja "Por Sucursal": Análisis detallado por cada sucursal
 * - Hoja "Por Servicio": Análisis detallado por cada servicio
 * - Hoja "Por Punto Atención": Análisis detallado por punto de atención
 * - Hoja "Información": Metadatos técnicos y documentación
 * 
 * @example
 * ```typescript
 * const exportData: ExportData = {
 *   summary: { avgWaitTime: 25 },
 *   branches: [...],
 *   services: [...],
 *   filters: {...},
 *   generatedAt: new Date().toISOString()
 * };
 * 
 * await ExcelExportService.export(exportData);
 * // Descarga automática de archivo: reporte-tiempos-espera-2025-07-15.xlsx
 * ```
 * 
 * @since 2.0.0
 */
class ExcelExportService extends BaseExportService {
  /**
   * Exporta datos en formato Excel con múltiples hojas organizadas
   * 
   * @static
   * @async
   * @method export
   * @param {ExportData} data - Datos completos del reporte a exportar
   * @returns {Promise<void>} Promesa que se resuelve cuando la descarga inicia
   * 
   * @description Genera un archivo Excel completo con:
   * - Múltiples hojas temáticas organizadas
   * - Formato profesional con anchos de columna optimizados
   * - Estadísticas calculadas automáticamente
   * - Encabezados con estilos aplicados
   * - Información técnica y metadatos
   * 
   * @throws {Error} Si hay problemas en la generación del archivo Excel
   * @throws {Error} Si los datos de entrada son inválidos
   * 
   * @example
   * ```typescript
   * try {
   *   await ExcelExportService.export(reportData);
   *   console.log('Excel exportado exitosamente');
   * } catch (error) {
   *   console.error('Error al exportar Excel:', error.message);
   * }
   * ```
   */
  static async export(data: ExportData): Promise<void> {
    const organizedData = this.processOrganizedDataForExport(data);
    
    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new();

    // ========= HOJA 1: RESUMEN =========
    if (organizedData.summary.data.length > 0) {
      const summarySheetData = [
        ['REPORTE DE TIEMPOS DE ESPERA - RESUMEN EJECUTIVO'],
        [''],
        ...organizedData.summary.data.map(row => [row[0], row[1], row[2]]),
        [''],
        ['ESTADÍSTICAS GENERALES:'],
        ['Generado el:', new Date(data.generatedAt).toLocaleString('es-ES')],
        ['Filtros aplicados:'],
        ['  Sucursal:', data.filters.branchId ? `ID: ${data.filters.branchId}` : 'Todas'],
        ['  Servicio:', data.filters.serviceId ? `ID: ${data.filters.serviceId}` : 'Todos'],
        ['  Punto de Atención:', data.filters.servicePointId ? `ID: ${data.filters.servicePointId}` : 'Todos']
      ];
      
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summarySheetData);
      summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 40 }];
      
      // Aplicar estilo al título
      summaryWorksheet['A1'] = { 
        v: 'REPORTE DE TIEMPOS DE ESPERA - RESUMEN EJECUTIVO',
        s: { font: { bold: true, sz: 14 } }
      };
      
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen');
    }

    // ========= HOJA 2: POR SUCURSAL =========
    if (organizedData.branches.data.length > 0) {
      const branchSheetData = [
        ['ANÁLISIS DETALLADO POR SUCURSAL'],
        [''],
        ['Estadísticas Generales:'],
        ['Total de Sucursales:', organizedData.branches.stats.totalBranches || 0],
        ['Total de Atenciones:', (organizedData.branches.stats.totalAttentions || 0).toLocaleString()],
        ['Tiempo Promedio General:', this.formatTime(organizedData.branches.stats.avgWaitTime || 0)],
        ['Tiempo Mínimo:', this.formatTime(organizedData.branches.stats.minWaitTime || 0)],
        ['Tiempo Máximo:', this.formatTime(organizedData.branches.stats.maxWaitTime || 0)],
        [''],
        ['DATOS DETALLADOS:'],
        organizedData.branches.headers,
        ...organizedData.branches.data
      ];
      
      const branchWorksheet = XLSX.utils.aoa_to_sheet(branchSheetData);
      branchWorksheet['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, branchWorksheet, 'Por Sucursal');
    }

    // ========= HOJA 3: POR SERVICIO =========
    if (organizedData.services.data.length > 0) {
      const serviceSheetData = [
        ['ANÁLISIS DETALLADO POR SERVICIO'],
        [''],
        ['Estadísticas Generales:'],
        ['Total de Servicios:', organizedData.services.stats.totalServices || 0],
        ['Total de Atenciones:', (organizedData.services.stats.totalAttentions || 0).toLocaleString()],
        ['Tiempo Promedio General:', this.formatTime(organizedData.services.stats.avgWaitTime || 0)],
        ['Tiempo Mínimo:', this.formatTime(organizedData.services.stats.minWaitTime || 0)],
        ['Tiempo Máximo:', this.formatTime(organizedData.services.stats.maxWaitTime || 0)],
        [''],
        ['DATOS DETALLADOS:'],
        organizedData.services.headers,
        ...organizedData.services.data
      ];
      
      const serviceWorksheet = XLSX.utils.aoa_to_sheet(serviceSheetData);
      serviceWorksheet['!cols'] = [
        { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, serviceWorksheet, 'Por Servicio');
    }

    // ========= HOJA 4: POR PUNTO DE ATENCIÓN =========
    if (organizedData.servicePoints.data.length > 0) {
      const servicePointSheetData = [
        ['ANÁLISIS DETALLADO POR PUNTO DE ATENCIÓN'],
        [''],
        ['Estadísticas Generales:'],
        ['Total de Puntos:', organizedData.servicePoints.stats.totalServicePoints || 0],
        ['Total de Atenciones:', (organizedData.servicePoints.stats.totalAttentions || 0).toLocaleString()],
        ['Tiempo Promedio General:', this.formatTime(organizedData.servicePoints.stats.avgWaitTime || 0)],
        ['Tiempo Mínimo:', this.formatTime(organizedData.servicePoints.stats.minWaitTime || 0)],
        ['Tiempo Máximo:', this.formatTime(organizedData.servicePoints.stats.maxWaitTime || 0)],
        [''],
        ['DATOS DETALLADOS:'],
        organizedData.servicePoints.headers,
        ...organizedData.servicePoints.data
      ];
      
      const servicePointWorksheet = XLSX.utils.aoa_to_sheet(servicePointSheetData);
      servicePointWorksheet['!cols'] = [
        { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, servicePointWorksheet, 'Por Punto Atención');
    }

    // ========= HOJA 5: INFORMACIÓN TÉCNICA =========
    const infoData = [
      ['INFORMACIÓN TÉCNICA DEL REPORTE'],
      [''],
      ['Metadatos:'],
      ['Fecha de generación:', new Date(data.generatedAt).toLocaleString('es-ES')],
      ['Período analizado:', `${data.filters.startDate || 'N/A'} - ${data.filters.endDate || 'N/A'}`],
      ['Sistema:', 'Gestión de Atención Plus'],
      ['Versión del reporte:', '2.0.0'],
      [''],
      ['Filtros aplicados:'],
      ['Sucursal:', data.filters.branchId ? `ID: ${data.filters.branchId}` : 'Todas las sucursales'],
      ['Servicio:', data.filters.serviceId ? `ID: ${data.filters.serviceId}` : 'Todos los servicios'],
      ['Punto de Atención:', data.filters.servicePointId ? `ID: ${data.filters.servicePointId}` : 'Todos los puntos'],
      [''],
      ['Interpretación de datos:'],
      ['• Tiempo Promedio: Media aritmética de los tiempos de espera'],
      ['• Tiempo Mínimo: Menor tiempo de espera registrado'],
      ['• Tiempo Máximo: Mayor tiempo de espera registrado'],
      ['• Tiempo Mediano: Valor central de los tiempos ordenados'],
      ['• Eficiencia: Medida basada en el tiempo promedio (menor tiempo = mayor eficiencia)'],
      ['• Estado de Rendimiento: Clasificación cualitativa del desempeño'],
      ['  - Excelente: ≤ 15 minutos'],
      ['  - Bueno: 16-30 minutos'],
      ['  - Regular: 31-60 minutos'],
      ['  - Necesita Mejora: > 60 minutos']
    ];
    
    const infoWorksheet = XLSX.utils.aoa_to_sheet(infoData);
    infoWorksheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, infoWorksheet, 'Información');
    
    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    this.downloadFile(blob, `${organizedData.fileName}.xlsx`);
  }
}

// =========================================================================
// SERVICIO DE EXPORTACIÓN CSV
// =========================================================================

/**
 * Servicio especializado para exportación de reportes en formato CSV
 * 
 * @class CSVExportService
 * @extends BaseExportService
 * @description Genera archivos CSV con estructura organizada por secciones,
 * compatible con herramientas de análisis de datos como Excel, Google Sheets,
 * y software estadístico. Incluye codificación UTF-8 con BOM para soporte
 * completo de caracteres especiales.
 * 
 * Características del archivo CSV generado:
 * - Estructura por secciones claramente delimitadas
 * - Estadísticas calculadas para cada categoría
 * - Datos tabulares listos para análisis
 * - Información técnica y documentación integrada
 * - Codificación UTF-8 con BOM para compatibilidad universal
 * 
 * @example
 * ```typescript
 * const exportData: ExportData = {
 *   summary: { avgWaitTime: 25 },
 *   branches: [...],
 *   services: [...],
 *   filters: {...},
 *   generatedAt: new Date().toISOString()
 * };
 * 
 * await CSVExportService.export(exportData);
 * // Descarga automática de archivo: reporte-tiempos-espera-2025-07-15.csv
 * ```
 * 
 * @since 2.0.0
 */
class CSVExportService extends BaseExportService {
  /**
   * Exporta datos en formato CSV con secciones organizadas
   * 
   * @static
   * @async
   * @method export
   * @param {ExportData} data - Datos completos del reporte a exportar
   * @returns {Promise<void>} Promesa que se resuelve cuando la descarga inicia
   * 
   * @description Genera un archivo CSV estructurado que incluye:
   * - Encabezado principal con información del reporte
   * - Sección de resumen ejecutivo
   * - Análisis detallado por sucursal con estadísticas
   * - Análisis detallado por servicio con métricas
   * - Análisis detallado por punto de atención
   * - Información técnica y guía de interpretación
   * - Formato compatible con aplicaciones de hojas de cálculo
   * 
   * @throws {Error} Si hay problemas en la generación del archivo CSV
   * @throws {Error} Si los datos de entrada son inválidos
   * 
   * @example
   * ```typescript
   * try {
   *   await CSVExportService.export(reportData);
   *   console.log('CSV exportado exitosamente');
   * } catch (error) {
   *   console.error('Error al exportar CSV:', error.message);
   * }
   * ```
   */
  static async export(data: ExportData): Promise<void> {
    const organizedData = this.processOrganizedDataForExport(data);
    
    const csvSections: string[] = [];

    // ========= ENCABEZADO PRINCIPAL =========
    csvSections.push('"REPORTE DE TIEMPOS DE ESPERA - ANÁLISIS COMPLETO"');
    csvSections.push(`"Generado el: ${new Date(data.generatedAt).toLocaleString('es-ES')}"`);
    csvSections.push(`"Período: ${data.filters.startDate || 'N/A'} - ${data.filters.endDate || 'N/A'}"`);
    csvSections.push('');

    // ========= SECCIÓN RESUMEN =========
    if (organizedData.summary.data.length > 0) {
      csvSections.push('"=== RESUMEN EJECUTIVO ==="');
      csvSections.push(organizedData.summary.headers.map(h => `"${h}"`).join(','));
      organizedData.summary.data.forEach(row => {
        csvSections.push(row.map(cell => `"${cell}"`).join(','));
      });
      csvSections.push('');
    }

    // ========= SECCIÓN SUCURSALES =========
    if (organizedData.branches.data.length > 0) {
      csvSections.push('"=== ANÁLISIS POR SUCURSAL ==="');
      csvSections.push('');
      csvSections.push('"ESTADÍSTICAS GENERALES:"');
      csvSections.push(`"Total de Sucursales:","${organizedData.branches.stats.totalBranches || 0}"`);
      csvSections.push(`"Total de Atenciones:","${(organizedData.branches.stats.totalAttentions || 0).toLocaleString()}"`);
      csvSections.push(`"Tiempo Promedio General:","${this.formatTime(organizedData.branches.stats.avgWaitTime || 0)}"`);
      csvSections.push(`"Tiempo Mínimo:","${this.formatTime(organizedData.branches.stats.minWaitTime || 0)}"`);
      csvSections.push(`"Tiempo Máximo:","${this.formatTime(organizedData.branches.stats.maxWaitTime || 0)}"`);
      csvSections.push('');
      csvSections.push('"DATOS DETALLADOS:"');
      csvSections.push(organizedData.branches.headers.map(h => `"${h}"`).join(','));
      organizedData.branches.data.forEach(row => {
        csvSections.push(row.map(cell => `"${cell}"`).join(','));
      });
      csvSections.push('');
    }

    // ========= SECCIÓN SERVICIOS =========
    if (organizedData.services.data.length > 0) {
      csvSections.push('"=== ANÁLISIS POR SERVICIO ==="');
      csvSections.push('');
      csvSections.push('"ESTADÍSTICAS GENERALES:"');
      csvSections.push(`"Total de Servicios:","${organizedData.services.stats.totalServices || 0}"`);
      csvSections.push(`"Total de Atenciones:","${(organizedData.services.stats.totalAttentions || 0).toLocaleString()}"`);
      csvSections.push(`"Tiempo Promedio General:","${this.formatTime(organizedData.services.stats.avgWaitTime || 0)}"`);
      csvSections.push(`"Tiempo Mínimo:","${this.formatTime(organizedData.services.stats.minWaitTime || 0)}"`);
      csvSections.push(`"Tiempo Máximo:","${this.formatTime(organizedData.services.stats.maxWaitTime || 0)}"`);
      csvSections.push('');
      csvSections.push('"DATOS DETALLADOS:"');
      csvSections.push(organizedData.services.headers.map(h => `"${h}"`).join(','));
      organizedData.services.data.forEach(row => {
        csvSections.push(row.map(cell => `"${cell}"`).join(','));
      });
      csvSections.push('');
    }

    // ========= SECCIÓN PUNTOS DE ATENCIÓN =========
    if (organizedData.servicePoints.data.length > 0) {
      csvSections.push('"=== ANÁLISIS POR PUNTO DE ATENCIÓN ==="');
      csvSections.push('');
      csvSections.push('"ESTADÍSTICAS GENERALES:"');
      csvSections.push(`"Total de Puntos:","${organizedData.servicePoints.stats.totalServicePoints || 0}"`);
      csvSections.push(`"Total de Atenciones:","${(organizedData.servicePoints.stats.totalAttentions || 0).toLocaleString()}"`);
      csvSections.push(`"Tiempo Promedio General:","${this.formatTime(organizedData.servicePoints.stats.avgWaitTime || 0)}"`);
      csvSections.push(`"Tiempo Mínimo:","${this.formatTime(organizedData.servicePoints.stats.minWaitTime || 0)}"`);
      csvSections.push(`"Tiempo Máximo:","${this.formatTime(organizedData.servicePoints.stats.maxWaitTime || 0)}"`);
      csvSections.push('');
      csvSections.push('"DATOS DETALLADOS:"');
      csvSections.push(organizedData.servicePoints.headers.map(h => `"${h}"`).join(','));
      organizedData.servicePoints.data.forEach(row => {
        csvSections.push(row.map(cell => `"${cell}"`).join(','));
      });
      csvSections.push('');
    }

    // ========= INFORMACIÓN TÉCNICA =========
    csvSections.push('"=== INFORMACIÓN TÉCNICA ==="');
    csvSections.push('');
    csvSections.push('"FILTROS APLICADOS:"');
    csvSections.push(`"Sucursal:","${data.filters.branchId ? `ID: ${data.filters.branchId}` : 'Todas las sucursales'}"`);
    csvSections.push(`"Servicio:","${data.filters.serviceId ? `ID: ${data.filters.serviceId}` : 'Todos los servicios'}"`);
    csvSections.push(`"Punto de Atención:","${data.filters.servicePointId ? `ID: ${data.filters.servicePointId}` : 'Todos los puntos'}"`);
    csvSections.push('');
    csvSections.push('"INTERPRETACIÓN DE DATOS:"');
    csvSections.push('"• Tiempo Promedio: Media aritmética de los tiempos de espera"');
    csvSections.push('"• Tiempo Mínimo: Menor tiempo de espera registrado"');
    csvSections.push('"• Tiempo Máximo: Mayor tiempo de espera registrado"');
    csvSections.push('"• Tiempo Mediano: Valor central de los tiempos ordenados"');
    csvSections.push('"• Eficiencia: Medida basada en el tiempo promedio"');
    csvSections.push('"• Estado de Rendimiento: Clasificación cualitativa"');
    csvSections.push('"  - Excelente: ≤ 15 minutos"');
    csvSections.push('"  - Bueno: 16-30 minutos"');
    csvSections.push('"  - Regular: 31-60 minutos"');
    csvSections.push('"  - Necesita Mejora: > 60 minutos"');

    // Crear contenido final del CSV
    const csvContent = csvSections.join('\n');
    
    // Crear blob y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `${organizedData.fileName}.csv`);
  }
}

// =========================================================================
// SERVICIO PRINCIPAL
// =========================================================================

/**
 * Servicio principal de exportación de reportes de tiempos de espera
 * 
 * @public
 * @class ReportExportService
 * @description Punto de entrada principal para todas las operaciones de exportación
 * de reportes. Actúa como facade que coordina los servicios especializados de
 * exportación (Excel, CSV) y proporciona una interfaz unificada y simple para
 * la aplicación cliente.
 * 
 * Este servicio maneja:
 * - Enrutamiento a servicios específicos según el formato solicitado
 * - Validación de formatos de exportación
 * - Manejo unificado de errores
 * - Logging de operaciones de exportación
 * 
 * @example
 * ```typescript
 * import { ReportExportService, type ExportData } from './reportExportService';
 * 
 * const reportData: ExportData = {
 *   summary: {
 *     avgWaitTime: 25.5,
 *     completedQueues: 1250
 *   },
 *   branches: [
 *     {
 *       branchName: "Sucursal Centro",
 *       waitTime: { average: 22, minimum: 5, maximum: 45 },
 *       totalProcessed: 500
 *     }
 *   ],
 *   services: [...],
 *   servicePoints: [...],
 *   filters: {
 *     startDate: "2025-01-01",
 *     endDate: "2025-01-31"
 *   },
 *   generatedAt: new Date().toISOString()
 * };
 * 
 * // Exportar como Excel
 * await ReportExportService.exportReport('excel', reportData);
 * 
 * // Exportar como CSV
 * await ReportExportService.exportReport('csv', reportData);
 * ```
 * 
 * @since 2.0.0
 * @author Sistema de Gestión de Atención Plus
 */
export class ReportExportService {
  /**
   * Exporta un reporte en el formato especificado
   * 
   * @public
   * @static
   * @async
   * @method exportReport
   * @param {ExportFormat} format - Formato de exportación ('excel' | 'csv')
   * @param {ExportData} data - Datos completos del reporte a exportar
   * @returns {Promise<void>} Promesa que se resuelve cuando la exportación se completa
   * 
   * @description Método principal para exportar reportes. Valida el formato
   * solicitado, delega la operación al servicio especializado correspondiente
   * y maneja errores de forma unificada.
   * 
   * Formatos soportados:
   * - 'excel': Genera archivo .xlsx con múltiples hojas organizadas
   * - 'csv': Genera archivo .csv con secciones estructuradas
   * 
   * @throws {Error} Si el formato especificado no está soportado
   * @throws {Error} Si ocurre un error durante la exportación
   * @throws {Error} Si los datos de entrada son inválidos o incompletos
   * 
   * @example
   * ```typescript
   * try {
   *   // Exportación exitosa
   *   await ReportExportService.exportReport('excel', reportData);
   *   console.log('Reporte exportado exitosamente');
   * 
   * } catch (error) {
   *   if (error.message.includes('formato no soportado')) {
   *     console.error('Formato inválido:', error.message);
   *   } else {
   *     console.error('Error de exportación:', error.message);
   *   }
   * }
   * ```
   * 
   * @see {@link ExcelExportService.export} Para detalles específicos de Excel
   * @see {@link CSVExportService.export} Para detalles específicos de CSV
   */
  static async exportReport(format: ExportFormat, data: ExportData): Promise<void> {
    try {
      switch (format) {
        case 'excel':
          await ExcelExportService.export(data);
          break;
        case 'csv':
          await CSVExportService.export(data);
          break;
        default:
          throw new Error(`Formato de exportación no soportado: ${format}`);
      }
    } catch (error) {
      console.error('Error durante la exportación:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al exportar en formato ${format}: ${errorMessage}`);
    }
  }
}

/**
 * Exportación por defecto del servicio principal de reportes
 * 
 * @default ReportExportService
 * @description Permite importar el servicio usando sintaxis de importación por defecto
 * para compatibilidad con diferentes estilos de importación en el proyecto.
 * 
 * @example
 * ```typescript
 * // Importación nombrada (recomendada)
 * import { ReportExportService } from './reportExportService';
 * 
 * // Importación por defecto (alternativa)
 * import ReportExportService from './reportExportService';
 * 
 * // Ambas formas permiten usar el servicio
 * await ReportExportService.exportReport('excel', data);
 * ```
 */
export default ReportExportService;
