import { db } from '@db';
import { queues, appointments, branches, services, servicePoints, users } from '@db/schema';
import { eq, and, gte, lte, sql, isNotNull } from 'drizzle-orm';

/**
 * Interfaz para definir el rango de fechas de un reporte
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Interfaz para los filtros del reporte
 */
export interface ReportFilters {
  dateRange: DateRange;
  branchId?: number;
  serviceId?: number;
  servicePointId?: number;
}

/**
 * Interfaz para las métricas básicas de tiempo
 */
export interface TimeMetrics {
  average: number;
  median: number;
  minimum: number;
  maximum: number;
  count: number;
}

/**
 * Interfaz para el reporte de tiempos de espera por sede
 */
export interface WaitTimeByBranch {
  branchId: number;
  branchName: string;
  waitTime: TimeMetrics;
  serviceTime: TimeMetrics;
  totalProcessed: number;
}

/**
 * Interfaz para el reporte de tiempos de espera por servicio
 */
export interface WaitTimeByService {
  serviceId: number;
  serviceName: string;
  branchId: number;
  branchName: string;
  waitTime: TimeMetrics;
  serviceTime: TimeMetrics;
  totalProcessed: number;
}

/**
 * Interfaz para el reporte de tiempos de espera por punto de atención
 */
export interface WaitTimeByServicePoint {
  servicePointId: number;
  servicePointName: string;
  branchId: number;
  branchName: string;
  waitTime: TimeMetrics;
  serviceTime: TimeMetrics;
  totalProcessed: number;
}

/**
 * Interfaz para el resumen general de tiempos de espera
 */
export interface WaitTimeSummary {
  totalQueues: number;
  completedQueues: number;
  avgWaitTime: number;
  avgServiceTime: number;
  topBranches: Array<{
    branchName: string;
    avgWaitTime: number;
    totalProcessed: number;
  }>;
  topServices: Array<{
    serviceName: string;
    avgWaitTime: number;
    totalProcessed: number;
  }>;
  timeDistribution: Array<{
    timeRange: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Servicio para análisis de tiempos de espera
 * Proporciona métodos para generar reportes detallados sobre los tiempos
 * de espera y atención en diferentes dimensiones (sede, servicio, punto de atención)
 */
export class WaitTimeAnalyticsService {
  
  /**
   * Obtiene métricas de tiempo de espera agrupadas por sede
   * 
   * @param filters - Filtros para el reporte
   * @returns Array de métricas por sede
   */
  async getWaitTimesByBranch(filters: ReportFilters): Promise<WaitTimeByBranch[]> {
    const startTime = Date.now();
    const { dateRange, serviceId, servicePointId } = filters;
    
    const whereConditions = [
      gte(queues.createdAt, dateRange.startDate),
      lte(queues.createdAt, dateRange.endDate),
      isNotNull(queues.calledAt),
      isNotNull(queues.completedAt)
    ];

    if (filters.branchId) {
      whereConditions.push(eq(appointments.branchId, filters.branchId));
    }

    if (serviceId) {
      whereConditions.push(eq(appointments.serviceId, serviceId));
    }

    if (servicePointId) {
      whereConditions.push(eq(appointments.servicePointId, servicePointId));
    }

    const rawData = await db
      .select({
        branchId: appointments.branchId,
        branchName: branches.name,
        queueCreatedAt: queues.createdAt,
        queueCalledAt: queues.calledAt,
        queueCompletedAt: queues.completedAt,
      })
      .from(queues)
      .innerJoin(appointments, eq(queues.appointmentId, appointments.id))
      .innerJoin(branches, eq(appointments.branchId, branches.id))
      .where(and(...whereConditions))
      .orderBy(appointments.branchId);

    // Procesar los datos para calcular métricas por sede
    const branchMap = new Map<number, {
      branchName: string;
      waitTimes: number[];
      serviceTimes: number[];
    }>();

    let validRecords = 0;
    for (const row of rawData) {
      if (!branchMap.has(row.branchId)) {
        branchMap.set(row.branchId, {
          branchName: row.branchName,
          waitTimes: [],
          serviceTimes: []
        });
      }

      const times = this.validateAndCalculateTimes(
        row.queueCreatedAt,
        row.queueCalledAt,
        row.queueCompletedAt
      );

      if (times) {
        const branchData = branchMap.get(row.branchId)!;
        branchData.waitTimes.push(times.waitTime);
        branchData.serviceTimes.push(times.serviceTime);
        validRecords++;
      }
    }

    // Convertir a formato de respuesta
    const result: WaitTimeByBranch[] = [];
    
    Array.from(branchMap.entries()).forEach(([branchId, data]) => {
      result.push({
        branchId,
        branchName: data.branchName,
        waitTime: this.calculateMetrics(data.waitTimes),
        serviceTime: this.calculateMetrics(data.serviceTimes),
        totalProcessed: data.waitTimes.length
      });
    });

    this.logPerformance('getWaitTimesByBranch', startTime, validRecords);
    return result.sort((a, b) => a.branchName.localeCompare(b.branchName));
  }

  /**
   * Obtiene métricas de tiempo de espera agrupadas por servicio
   * 
   * @param filters - Filtros para el reporte
   * @returns Array de métricas por servicio
   */
  async getWaitTimesByService(filters: ReportFilters): Promise<WaitTimeByService[]> {
    const { dateRange, branchId, servicePointId } = filters;
    
    const whereConditions = [
      gte(queues.createdAt, dateRange.startDate),
      lte(queues.createdAt, dateRange.endDate),
      isNotNull(queues.calledAt),
      isNotNull(queues.completedAt)
    ];

    if (branchId) {
      whereConditions.push(eq(appointments.branchId, branchId));
    }

    if (filters.serviceId) {
      whereConditions.push(eq(appointments.serviceId, filters.serviceId));
    }

    if (servicePointId) {
      whereConditions.push(eq(appointments.servicePointId, servicePointId));
    }

    const rawData = await db
      .select({
        serviceId: appointments.serviceId,
        serviceName: services.name,
        branchId: appointments.branchId,
        branchName: branches.name,
        queueCreatedAt: queues.createdAt,
        queueCalledAt: queues.calledAt,
        queueCompletedAt: queues.completedAt,
      })
      .from(queues)
      .innerJoin(appointments, eq(queues.appointmentId, appointments.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(branches, eq(appointments.branchId, branches.id))
      .where(and(...whereConditions))
      .orderBy(services.name);

    // Procesar los datos para calcular métricas por servicio
    const serviceMap = new Map<string, {
      serviceId: number;
      serviceName: string;
      branchId: number;
      branchName: string;
      waitTimes: number[];
      serviceTimes: number[];
    }>();

    for (const row of rawData) {
      const key = `${row.serviceId}-${row.branchId}`;
      
      if (!serviceMap.has(key)) {
        serviceMap.set(key, {
          serviceId: row.serviceId,
          serviceName: row.serviceName,
          branchId: row.branchId,
          branchName: row.branchName,
          waitTimes: [],
          serviceTimes: []
        });
      }

      const serviceData = serviceMap.get(key)!;
      
      // Validar que las fechas sean válidas y lógicas
      const createdTime = new Date(row.queueCreatedAt).getTime();
      const calledTime = new Date(row.queueCalledAt!).getTime();
      const completedTime = new Date(row.queueCompletedAt!).getTime();

      // Validar secuencia lógica de tiempos
      if (calledTime <= createdTime || completedTime <= calledTime) {
        console.warn(`Secuencia de tiempos inválida para servicio ${row.serviceId}: created=${row.queueCreatedAt}, called=${row.queueCalledAt}, completed=${row.queueCompletedAt}`);
        continue;
      }
      
      // Calcular tiempo de espera (minutos)
      const waitTime = Math.round((calledTime - createdTime) / (1000 * 60));
      
      // Calcular tiempo de atención (minutos)
      const serviceTime = Math.round((completedTime - calledTime) / (1000 * 60));

      // Validar que los tiempos sean razonables
      if (waitTime < 0 || serviceTime < 0 || waitTime > 24 * 60 || serviceTime > 8 * 60) {
        console.warn(`Tiempos fuera de rango para servicio ${row.serviceId}: wait=${waitTime}min, service=${serviceTime}min`);
        continue;
      }

      serviceData.waitTimes.push(waitTime);
      serviceData.serviceTimes.push(serviceTime);
    }

    // Convertir a formato de respuesta
    const result: WaitTimeByService[] = [];
    
    Array.from(serviceMap.values()).forEach((data) => {
      result.push({
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        branchId: data.branchId,
        branchName: data.branchName,
        waitTime: this.calculateMetrics(data.waitTimes),
        serviceTime: this.calculateMetrics(data.serviceTimes),
        totalProcessed: data.waitTimes.length
      });
    });

    return result.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  }

  /**
   * Obtiene métricas de tiempo de espera agrupadas por punto de atención
   * 
   * @param filters - Filtros para el reporte
   * @returns Array de métricas por punto de atención
   */
  async getWaitTimesByServicePoint(filters: ReportFilters): Promise<WaitTimeByServicePoint[]> {
    const { dateRange, branchId, serviceId } = filters;
    
    const whereConditions = [
      gte(queues.createdAt, dateRange.startDate),
      lte(queues.createdAt, dateRange.endDate),
      isNotNull(queues.calledAt),
      isNotNull(queues.completedAt),
      isNotNull(appointments.servicePointId)
    ];

    if (branchId) {
      whereConditions.push(eq(appointments.branchId, branchId));
    }

    if (serviceId) {
      whereConditions.push(eq(appointments.serviceId, serviceId));
    }

    if (filters.servicePointId) {
      whereConditions.push(eq(appointments.servicePointId, filters.servicePointId));
    }

    const rawData = await db
      .select({
        servicePointId: appointments.servicePointId,
        servicePointName: servicePoints.name,
        branchId: appointments.branchId,
        branchName: branches.name,
        queueCreatedAt: queues.createdAt,
        queueCalledAt: queues.calledAt,
        queueCompletedAt: queues.completedAt,
      })
      .from(queues)
      .innerJoin(appointments, eq(queues.appointmentId, appointments.id))
      .innerJoin(servicePoints, eq(appointments.servicePointId, servicePoints.id))
      .innerJoin(branches, eq(appointments.branchId, branches.id))
      .where(and(...whereConditions))
      .orderBy(servicePoints.name);

    // Procesar los datos para calcular métricas por punto de atención
    const servicePointMap = new Map<string, {
      servicePointId: number;
      servicePointName: string;
      branchId: number;
      branchName: string;
      waitTimes: number[];
      serviceTimes: number[];
    }>();

    for (const row of rawData) {
      const key = `${row.servicePointId}-${row.branchId}`;
      
      if (!servicePointMap.has(key)) {
        servicePointMap.set(key, {
          servicePointId: row.servicePointId!,
          servicePointName: row.servicePointName,
          branchId: row.branchId,
          branchName: row.branchName,
          waitTimes: [],
          serviceTimes: []
        });
      }

      const servicePointData = servicePointMap.get(key)!;
      
      // Validar que las fechas sean válidas y lógicas
      const createdTime = new Date(row.queueCreatedAt).getTime();
      const calledTime = new Date(row.queueCalledAt!).getTime();
      const completedTime = new Date(row.queueCompletedAt!).getTime();

      // Validar secuencia lógica de tiempos
      if (calledTime <= createdTime || completedTime <= calledTime) {
        console.warn(`Secuencia de tiempos inválida para punto de atención ${row.servicePointId}: created=${row.queueCreatedAt}, called=${row.queueCalledAt}, completed=${row.queueCompletedAt}`);
        continue;
      }
      
      // Calcular tiempo de espera (minutos)
      const waitTime = Math.round((calledTime - createdTime) / (1000 * 60));
      
      // Calcular tiempo de atención (minutos)
      const serviceTime = Math.round((completedTime - calledTime) / (1000 * 60));

      // Validar que los tiempos sean razonables
      if (waitTime < 0 || serviceTime < 0 || waitTime > 24 * 60 || serviceTime > 8 * 60) {
        console.warn(`Tiempos fuera de rango para punto de atención ${row.servicePointId}: wait=${waitTime}min, service=${serviceTime}min`);
        continue;
      }

      servicePointData.waitTimes.push(waitTime);
      servicePointData.serviceTimes.push(serviceTime);
    }

    // Convertir a formato de respuesta
    const result: WaitTimeByServicePoint[] = [];
    
    Array.from(servicePointMap.values()).forEach((data) => {
      result.push({
        servicePointId: data.servicePointId,
        servicePointName: data.servicePointName,
        branchId: data.branchId,
        branchName: data.branchName,
        waitTime: this.calculateMetrics(data.waitTimes),
        serviceTime: this.calculateMetrics(data.serviceTimes),
        totalProcessed: data.waitTimes.length
      });
    });

    return result.sort((a, b) => a.servicePointName.localeCompare(b.servicePointName));
  }

  /**
   * Obtiene un resumen general de los tiempos de espera
   * 
   * @param filters - Filtros para el reporte
   * @returns Resumen general con estadísticas destacadas
   */
  async getWaitTimesSummary(filters: ReportFilters): Promise<WaitTimeSummary> {
    const { dateRange, branchId, serviceId, servicePointId } = filters;
    
    const whereConditions = [
      gte(queues.createdAt, dateRange.startDate),
      lte(queues.createdAt, dateRange.endDate)
    ];

    if (branchId) {
      whereConditions.push(eq(appointments.branchId, branchId));
    }

    if (serviceId) {
      whereConditions.push(eq(appointments.serviceId, serviceId));
    }

    if (servicePointId) {
      whereConditions.push(eq(appointments.servicePointId, servicePointId));
    }

    // Obtener datos básicos
    const [totalData, completedData] = await Promise.all([
      // Total de colas en el período
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(queues)
        .innerJoin(appointments, eq(queues.appointmentId, appointments.id))
        .where(and(...whereConditions)),

      // Colas completadas con tiempos
      db
        .select({
          branchName: branches.name,
          serviceName: services.name,
          queueCreatedAt: queues.createdAt,
          queueCalledAt: queues.calledAt,
          queueCompletedAt: queues.completedAt,
        })
        .from(queues)
        .innerJoin(appointments, eq(queues.appointmentId, appointments.id))
        .innerJoin(branches, eq(appointments.branchId, branches.id))
        .innerJoin(services, eq(appointments.serviceId, services.id))
        .where(and(...whereConditions, isNotNull(queues.calledAt), isNotNull(queues.completedAt)))
    ]);

    const totalQueues = totalData[0]?.count || 0;
    const completedQueues = completedData.length;

    // Calcular métricas de tiempo
    const waitTimes: number[] = [];
    const serviceTimes: number[] = [];
    const branchStats = new Map<string, { waitTimes: number[]; count: number }>();
    const serviceStats = new Map<string, { waitTimes: number[]; count: number }>();

    for (const row of completedData) {
      // Validar que las fechas sean válidas y lógicas
      const createdTime = new Date(row.queueCreatedAt).getTime();
      const calledTime = new Date(row.queueCalledAt!).getTime();
      const completedTime = new Date(row.queueCompletedAt!).getTime();

      // Validar secuencia lógica de tiempos
      if (calledTime <= createdTime || completedTime <= calledTime) {
        console.warn(`Secuencia de tiempos inválida en resumen: created=${row.queueCreatedAt}, called=${row.queueCalledAt}, completed=${row.queueCompletedAt}`);
        continue;
      }

      const waitTime = Math.round((calledTime - createdTime) / (1000 * 60));
      const serviceTime = Math.round((completedTime - calledTime) / (1000 * 60));

      // Validar que los tiempos sean razonables
      if (waitTime < 0 || serviceTime < 0 || waitTime > 24 * 60 || serviceTime > 8 * 60) {
        console.warn(`Tiempos fuera de rango en resumen: wait=${waitTime}min, service=${serviceTime}min`);
        continue;
      }

      waitTimes.push(waitTime);
      serviceTimes.push(serviceTime);

      // Estadísticas por sede
      if (!branchStats.has(row.branchName)) {
        branchStats.set(row.branchName, { waitTimes: [], count: 0 });
      }
      const branchStat = branchStats.get(row.branchName)!;
      branchStat.waitTimes.push(waitTime);
      branchStat.count++;

      // Estadísticas por servicio
      if (!serviceStats.has(row.serviceName)) {
        serviceStats.set(row.serviceName, { waitTimes: [], count: 0 });
      }
      const serviceStat = serviceStats.get(row.serviceName)!;
      serviceStat.waitTimes.push(waitTime);
      serviceStat.count++;
    }

    // Top sedes por menor tiempo de espera
    const topBranches = Array.from(branchStats.entries())
      .map(([name, stats]) => ({
        branchName: name,
        avgWaitTime: Math.round(stats.waitTimes.reduce((sum, time) => sum + time, 0) / stats.waitTimes.length),
        totalProcessed: stats.count
      }))
      .sort((a, b) => a.avgWaitTime - b.avgWaitTime)
      .slice(0, 5);

    // Top servicios por menor tiempo de espera
    const topServices = Array.from(serviceStats.entries())
      .map(([name, stats]) => ({
        serviceName: name,
        avgWaitTime: Math.round(stats.waitTimes.reduce((sum, time) => sum + time, 0) / stats.waitTimes.length),
        totalProcessed: stats.count
      }))
      .sort((a, b) => a.avgWaitTime - b.avgWaitTime)
      .slice(0, 5);

    // Distribución de tiempos
    const timeDistribution = this.calculateTimeDistribution(waitTimes);

    return {
      totalQueues,
      completedQueues,
      avgWaitTime: waitTimes.length > 0 ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length) : 0,
      avgServiceTime: serviceTimes.length > 0 ? Math.round(serviceTimes.reduce((sum, time) => sum + time, 0) / serviceTimes.length) : 0,
      topBranches,
      topServices,
      timeDistribution
    };
  }

  /**
   * Calcula métricas estadísticas para un array de tiempos
   * 
   * @param times - Array de tiempos en minutos
   * @returns Métricas calculadas
   */
  private calculateMetrics(times: number[]): TimeMetrics {
    if (times.length === 0) {
      return {
        average: 0,
        median: 0,
        minimum: 0,
        maximum: 0,
        count: 0
      };
    }

    // Filtrar valores no válidos
    const validTimes = times.filter(time => 
      typeof time === 'number' && 
      !isNaN(time) && 
      isFinite(time) && 
      time >= 0
    );

    if (validTimes.length === 0) {
      return {
        average: 0,
        median: 0,
        minimum: 0,
        maximum: 0,
        count: 0
      };
    }

    const sortedTimes = [...validTimes].sort((a, b) => a - b);
    const sum = validTimes.reduce((acc, time) => acc + time, 0);

    return {
      average: Math.round(sum / validTimes.length),
      median: Math.round(this.calculateMedian(sortedTimes)),
      minimum: sortedTimes[0],
      maximum: sortedTimes[sortedTimes.length - 1],
      count: validTimes.length
    };
  }

  /**
   * Calcula la mediana de un array ordenado
   * 
   * @param sortedTimes - Array de tiempos ordenado
   * @returns Mediana
   */
  private calculateMedian(sortedTimes: number[]): number {
    if (sortedTimes.length === 0) {
      return 0;
    }

    const length = sortedTimes.length;
    if (length % 2 === 0) {
      const mid1 = sortedTimes[length / 2 - 1];
      const mid2 = sortedTimes[length / 2];
      return (mid1 + mid2) / 2;
    } else {
      return sortedTimes[Math.floor(length / 2)];
    }
  }

  /**
   * Calcula la distribución de tiempos en rangos
   * 
   * @param waitTimes - Array de tiempos de espera
   * @returns Distribución por rangos
   */
  private calculateTimeDistribution(waitTimes: number[]): Array<{
    timeRange: string;
    count: number;
    percentage: number;
  }> {
    const ranges = [
      { min: 0, max: 5, label: '0-5 min' },
      { min: 6, max: 15, label: '6-15 min' },
      { min: 16, max: 30, label: '16-30 min' },
      { min: 31, max: 60, label: '31-60 min' },
      { min: 61, max: Infinity, label: 'Más de 60 min' }
    ];

    // Filtrar tiempos válidos
    const validTimes = waitTimes.filter(time => 
      typeof time === 'number' && 
      !isNaN(time) && 
      isFinite(time) && 
      time >= 0
    );

    const total = validTimes.length;
    
    return ranges.map(range => {
      let count = 0;
      if (range.max === Infinity) {
        count = validTimes.filter(time => time >= range.min).length;
      } else {
        count = validTimes.filter(time => time >= range.min && time <= range.max).length;
      }
      
      return {
        timeRange: range.label,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    });
  }

  /**
   * Valida y calcula tiempos de espera y atención
   * 
   * @param queueCreatedAt - Fecha de creación de la cola
   * @param queueCalledAt - Fecha de llamada
   * @param queueCompletedAt - Fecha de completado
   * @returns Objeto con tiempos válidos o null si los datos son inválidos
   */
  private validateAndCalculateTimes(
    queueCreatedAt: Date,
    queueCalledAt: Date | null,
    queueCompletedAt: Date | null
  ): { waitTime: number; serviceTime: number } | null {
    if (!queueCalledAt || !queueCompletedAt) {
      return null;
    }

    const createdTime = new Date(queueCreatedAt).getTime();
    const calledTime = new Date(queueCalledAt).getTime();
    const completedTime = new Date(queueCompletedAt).getTime();

    // Validar secuencia lógica de tiempos
    if (calledTime <= createdTime || completedTime <= calledTime) {
      return null;
    }
    
    const waitTime = Math.round((calledTime - createdTime) / (1000 * 60));
    const serviceTime = Math.round((completedTime - calledTime) / (1000 * 60));

    // Validar que los tiempos sean razonables
    if (waitTime < 0 || serviceTime < 0 || waitTime > 24 * 60 || serviceTime > 8 * 60) {
      return null;
    }

    return { waitTime, serviceTime };
  }

  /**
   * Log de rendimiento para queries
   * 
   * @param operation - Nombre de la operación
   * @param startTime - Tiempo de inicio
   * @param recordCount - Número de registros procesados
   */
  private logPerformance(operation: string, startTime: number, recordCount: number): void {
    const duration = Date.now() - startTime;
    console.log(`[WaitTimeAnalytics] ${operation}: ${recordCount} registros procesados en ${duration}ms`);
  }
}

// Instancia singleton del servicio
export const waitTimeAnalyticsService = new WaitTimeAnalyticsService();
