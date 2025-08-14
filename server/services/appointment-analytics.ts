/**
 * @fileoverview Servicio de análisis y reportes de citas
 * 
 * Este servicio proporciona funciones para generar reportes y estadísticas
 * detalladas sobre citas, turnos, reprogramaciones y análisis de asistencia.
 * 
 * @version 1.0.0
 * @since 2025-08-04
 */

import { db } from "../../db";
import { appointments, queues, branches, services, servicePoints, users } from "../../db/schema";
import { eq, and, gte, lte, sql, count, avg, min, max, isNull, isNotNull, desc, asc } from "drizzle-orm";
import { startOfDay, endOfDay, format, parseISO } from "date-fns";

// =========================================================================
// INTERFACES Y TIPOS
// =========================================================================

export interface AppointmentReportFilters {
  startDate: string;
  endDate: string;
  branchId?: number;
  serviceId?: number;
  servicePointId?: number;
  status?: 'scheduled' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
  type?: 'appointment' | 'turn' | 'public';
}

export interface AppointmentMetrics {
  totalAppointments: number;
  scheduledAppointments: number;
  checkedInAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  rescheduledAppointments: number;
  attendanceRate: number; // Porcentaje de asistencia
  completionRate: number; // Porcentaje de completadas
  noShowRate: number; // Porcentaje de no asistencias
}

export interface QueueMetrics {
  totalQueues: number;
  waitingQueues: number;
  servingQueues: number;
  completedQueues: number;
  averageWaitTime: number; // En minutos
  averageServiceTime: number; // En minutos
  queueEfficiency: number; // Porcentaje de eficiencia
}

export interface AppointmentByBranch {
  branchId: number;
  branchName: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  rescheduledAppointments: number;
  attendanceRate: number;
  averageAppointmentsPerDay: number;
}

export interface AppointmentByService {
  serviceId: number;
  serviceName: string;
  totalAppointments: number;
  completedAppointments: number;
  averageCompletionTime: number; // En minutos
  popularityRank: number;
  demandTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface ReschedulingStats {
  totalRescheduled: number;
  reschedulingRate: number; // Porcentaje del total
  averageRescheduleTime: number; // Días de anticipación promedio
  mostCommonReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  reschedulingTrends: Array<{
    date: string;
    count: number;
  }>;
}

export interface HourlyDistribution {
  hour: number;
  appointmentCount: number;
  completionRate: number;
  averageWaitTime: number;
}

export interface AppointmentTrend {
  date: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  attendanceRate: number;
}

// =========================================================================
// CLASE PRINCIPAL DEL SERVICIO
// =========================================================================

export class AppointmentAnalyticsService {
  
  /**
   * Obtiene un resumen completo de métricas de citas
   */
  static async getAppointmentsSummary(filters: AppointmentReportFilters): Promise<AppointmentMetrics> {
    const { startDate, endDate, branchId, serviceId, servicePointId } = filters;
    
    // Construir condiciones WHERE dinámicamente
    const whereConditions = [
      gte(appointments.scheduledAt, startOfDay(parseISO(startDate))),
      lte(appointments.scheduledAt, endOfDay(parseISO(endDate)))
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

    // Query principal para obtener conteos por estado
    const result = await db
      .select({
        status: appointments.status,
        count: count(),
        hasReschedule: sql<number>`COUNT(CASE WHEN ${appointments.rescheduledFromId} IS NOT NULL THEN 1 END)`.as('rescheduled_count')
      })
      .from(appointments)
      .where(and(...whereConditions))
      .groupBy(appointments.status);

    // Procesar resultados
    let totalAppointments = 0;
    let scheduledAppointments = 0;
    let checkedInAppointments = 0;
    let completedAppointments = 0;
    let cancelledAppointments = 0;
    let noShowAppointments = 0;
    let rescheduledAppointments = 0;

    result.forEach((row: any) => {
      const count = Number(row.count);
      totalAppointments += count;

      switch (row.status) {
        case 'scheduled':
          scheduledAppointments = count;
          break;
        case 'checked-in':
          checkedInAppointments = count;
          break;
        case 'completed':
          completedAppointments = count;
          break;
        case 'cancelled':
          cancelledAppointments = count;
          break;
        case 'no-show':
          noShowAppointments = count;
          break;
      }
    });

    // Obtener total de reprogramaciones en el período
    const rescheduledResult = await db
      .select({
        count: count()
      })
      .from(appointments)
      .where(and(
        ...whereConditions,
        isNotNull(appointments.rescheduledFromId)
      ));

    rescheduledAppointments = Number(rescheduledResult[0]?.count || 0);

    // Calcular tasas porcentuales
    const attendanceRate = totalAppointments > 0 
      ? ((completedAppointments + checkedInAppointments) / totalAppointments) * 100 
      : 0;
    
    const completionRate = totalAppointments > 0 
      ? (completedAppointments / totalAppointments) * 100 
      : 0;
    
    const noShowRate = totalAppointments > 0 
      ? (noShowAppointments / totalAppointments) * 100 
      : 0;

    return {
      totalAppointments,
      scheduledAppointments,
      checkedInAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      rescheduledAppointments,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      noShowRate: Math.round(noShowRate * 100) / 100
    };
  }

  /**
   * Obtiene métricas de citas agrupadas por sede
   */
  static async getAppointmentsByBranch(filters: AppointmentReportFilters): Promise<AppointmentByBranch[]> {
    const { startDate, endDate, serviceId, servicePointId } = filters;
    
    const whereConditions = [
      gte(appointments.scheduledAt, startOfDay(parseISO(startDate))),
      lte(appointments.scheduledAt, endOfDay(parseISO(endDate)))
    ];

    if (serviceId) {
      whereConditions.push(eq(appointments.serviceId, serviceId));
    }
    if (servicePointId) {
      whereConditions.push(eq(appointments.servicePointId, servicePointId));
    }

    const result = await db
      .select({
        branchId: appointments.branchId,
        branchName: branches.name,
        totalAppointments: count(),
        completedAppointments: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'completed' THEN 1 END)`.as('completed'),
        cancelledAppointments: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'cancelled' THEN 1 END)`.as('cancelled'),
        noShowAppointments: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'no-show' THEN 1 END)`.as('no_show'),
        rescheduledAppointments: sql<number>`COUNT(CASE WHEN ${appointments.rescheduledFromId} IS NOT NULL THEN 1 END)`.as('rescheduled')
      })
      .from(appointments)
      .innerJoin(branches, eq(appointments.branchId, branches.id))
      .where(and(...whereConditions))
      .groupBy(appointments.branchId, branches.name)
      .orderBy(desc(count()));

    // Calcular días en el período para promedio diario
    const startDay = parseISO(startDate);
    const endDay = parseISO(endDate);
    const daysDiff = Math.max(1, Math.ceil((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)));

    return result.map((row: any) => {
      const total = Number(row.totalAppointments);
      const completed = Number(row.completedAppointments);
      const cancelled = Number(row.cancelledAppointments);
      const noShow = Number(row.noShowAppointments);
      const rescheduled = Number(row.rescheduledAppointments);
      
      const attendanceRate = total > 0 ? ((completed) / total) * 100 : 0;
      const averageAppointmentsPerDay = total / daysDiff;

      return {
        branchId: row.branchId,
        branchName: row.branchName,
        totalAppointments: total,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        noShowAppointments: noShow,
        rescheduledAppointments: rescheduled,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        averageAppointmentsPerDay: Math.round(averageAppointmentsPerDay * 100) / 100
      };
    });
  }

  /**
   * Obtiene métricas de citas agrupadas por servicio
   */
  static async getAppointmentsByService(filters: AppointmentReportFilters): Promise<AppointmentByService[]> {
    const { startDate, endDate, branchId, servicePointId } = filters;
    
    const whereConditions = [
      gte(appointments.scheduledAt, startOfDay(parseISO(startDate))),
      lte(appointments.scheduledAt, endOfDay(parseISO(endDate)))
    ];

    if (branchId) {
      whereConditions.push(eq(appointments.branchId, branchId));
    }
    if (servicePointId) {
      whereConditions.push(eq(appointments.servicePointId, servicePointId));
    }

    const result = await db
      .select({
        serviceId: appointments.serviceId,
        serviceName: services.name,
        totalAppointments: count(),
        completedAppointments: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'completed' THEN 1 END)`.as('completed'),
        averageCompletionMinutes: sql<number>`
          AVG(
            CASE 
              WHEN ${appointments.attendedAt} IS NOT NULL AND ${appointments.scheduledAt} IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (${appointments.attendedAt} - ${appointments.scheduledAt})) / 60 
            END
          )
        `.as('avg_completion_time')
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(and(...whereConditions))
      .groupBy(appointments.serviceId, services.name)
      .orderBy(desc(count()));

    return result.map((row: any, index: number) => {
      const total = Number(row.totalAppointments);
      const completed = Number(row.completedAppointments);
      const avgTime = Number(row.averageCompletionMinutes) || 0;

      // Calcular tendencia de demanda (simplificado por ahora)
      let demandTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (index < result.length / 3) {
        demandTrend = 'increasing';
      } else if (index > (result.length * 2) / 3) {
        demandTrend = 'decreasing';
      }

      return {
        serviceId: row.serviceId,
        serviceName: row.serviceName,
        totalAppointments: total,
        completedAppointments: completed,
        averageCompletionTime: Math.round(avgTime * 100) / 100,
        popularityRank: index + 1,
        demandTrend
      };
    });
  }

  /**
   * Obtiene estadísticas de colas/turnos
   */
  static async getQueueStatistics(filters: AppointmentReportFilters): Promise<QueueMetrics> {
    const { startDate, endDate, branchId, serviceId } = filters;
    
    // Construir condiciones para la consulta de colas
    const whereConditions = [
      gte(queues.createdAt, startOfDay(parseISO(startDate))),
      lte(queues.createdAt, endOfDay(parseISO(endDate)))
    ];

    // Agregar filtros adicionales usando JOIN con appointments
    let joinConditions = [eq(queues.appointmentId, appointments.id)];
    
    if (branchId) {
      joinConditions.push(eq(appointments.branchId, branchId));
    }
    if (serviceId) {
      joinConditions.push(eq(appointments.serviceId, serviceId));
    }

    // Query principal para métricas de cola
    const queueStats = await db
      .select({
        status: queues.status,
        count: count(),
        avgWaitTime: sql<number>`
          AVG(
            CASE 
              WHEN ${queues.calledAt} IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (${queues.calledAt} - ${queues.createdAt})) / 60 
            END
          )
        `.as('avg_wait_time'),
        avgServiceTime: sql<number>`
          AVG(
            CASE 
              WHEN ${queues.completedAt} IS NOT NULL AND ${queues.calledAt} IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (${queues.completedAt} - ${queues.calledAt})) / 60 
            END
          )
        `.as('avg_service_time')
      })
      .from(queues)
      .innerJoin(appointments, and(...joinConditions))
      .where(and(...whereConditions))
      .groupBy(queues.status);

    // Procesar resultados
    let totalQueues = 0;
    let waitingQueues = 0;
    let servingQueues = 0;
    let completedQueues = 0;
    let totalWaitTime = 0;
    let totalServiceTime = 0;
    let waitTimeCount = 0;
    let serviceTimeCount = 0;

    queueStats.forEach((row: any) => {
      const count = Number(row.count);
      totalQueues += count;

      switch (row.status) {
        case 'waiting':
          waitingQueues = count;
          break;
        case 'serving':
          servingQueues = count;
          break;
        case 'complete':
          completedQueues = count;
          if (row.avgWaitTime) {
            totalWaitTime += Number(row.avgWaitTime) * count;
            waitTimeCount += count;
          }
          if (row.avgServiceTime) {
            totalServiceTime += Number(row.avgServiceTime) * count;
            serviceTimeCount += count;
          }
          break;
      }
    });

    const averageWaitTime = waitTimeCount > 0 ? totalWaitTime / waitTimeCount : 0;
    const averageServiceTime = serviceTimeCount > 0 ? totalServiceTime / serviceTimeCount : 0;
    const queueEfficiency = totalQueues > 0 ? (completedQueues / totalQueues) * 100 : 0;

    return {
      totalQueues,
      waitingQueues,
      servingQueues,
      completedQueues,
      averageWaitTime: Math.round(averageWaitTime * 100) / 100,
      averageServiceTime: Math.round(averageServiceTime * 100) / 100,
      queueEfficiency: Math.round(queueEfficiency * 100) / 100
    };
  }

  /**
   * Obtiene estadísticas de reprogramaciones
   */
  static async getReschedulingStats(filters: AppointmentReportFilters): Promise<ReschedulingStats> {
    const { startDate, endDate, branchId, serviceId } = filters;
    
    const whereConditions = [
      gte(appointments.rescheduledAt, startOfDay(parseISO(startDate))),
      lte(appointments.rescheduledAt, endOfDay(parseISO(endDate))),
      isNotNull(appointments.rescheduledFromId)
    ];

    if (branchId) {
      whereConditions.push(eq(appointments.branchId, branchId));
    }
    if (serviceId) {
      whereConditions.push(eq(appointments.serviceId, serviceId));
    }

    // Total de citas reprogramadas
    const totalRescheduled = await db
      .select({
        count: count()
      })
      .from(appointments)
      .where(and(...whereConditions));

    // Total de citas en el período para calcular tasa
    const totalAppointments = await db
      .select({
        count: count()
      })
      .from(appointments)
      .where(and(
        gte(appointments.scheduledAt, startOfDay(parseISO(startDate))),
        lte(appointments.scheduledAt, endOfDay(parseISO(endDate))),
        branchId ? eq(appointments.branchId, branchId) : sql`1=1`,
        serviceId ? eq(appointments.serviceId, serviceId) : sql`1=1`
      ));

    // Razones más comunes de reprogramación
    const reasons = await db
      .select({
        reason: appointments.rescheduledReason,
        count: count()
      })
      .from(appointments)
      .where(and(...whereConditions, isNotNull(appointments.rescheduledReason)))
      .groupBy(appointments.rescheduledReason)
      .orderBy(desc(count()))
      .limit(5);

    // Tendencias de reprogramación por día
    const trends = await db
      .select({
        date: sql<string>`DATE(${appointments.rescheduledAt})`.as('date'),
        count: count()
      })
      .from(appointments)
      .where(and(...whereConditions))
      .groupBy(sql`DATE(${appointments.rescheduledAt})`)
      .orderBy(sql`DATE(${appointments.rescheduledAt})`);

    const totalRescheduledCount = Number(totalRescheduled[0]?.count || 0);
    const totalAppointmentsCount = Number(totalAppointments[0]?.count || 0);
    const reschedulingRate = totalAppointmentsCount > 0 
      ? (totalRescheduledCount / totalAppointmentsCount) * 100 
      : 0;

    // Procesar razones más comunes
    const mostCommonReasons = reasons.map((row: any) => ({
      reason: row.reason || 'Sin especificar',
      count: Number(row.count),
      percentage: totalRescheduledCount > 0 
        ? Math.round((Number(row.count) / totalRescheduledCount) * 10000) / 100 
        : 0
    }));

    // Procesar tendencias
    const reschedulingTrends = trends.map((row: any) => ({
      date: row.date,
      count: Number(row.count)
    }));

    return {
      totalRescheduled: totalRescheduledCount,
      reschedulingRate: Math.round(reschedulingRate * 100) / 100,
      averageRescheduleTime: 0, // TODO: Implementar cálculo de días de anticipación
      mostCommonReasons,
      reschedulingTrends
    };
  }

  /**
   * Obtiene distribución horaria de citas
   */
  static async getHourlyDistribution(filters: AppointmentReportFilters): Promise<HourlyDistribution[]> {
    const { startDate, endDate, branchId, serviceId } = filters;
    
    const whereConditions = [
      gte(appointments.scheduledAt, startOfDay(parseISO(startDate))),
      lte(appointments.scheduledAt, endOfDay(parseISO(endDate)))
    ];

    if (branchId) {
      whereConditions.push(eq(appointments.branchId, branchId));
    }
    if (serviceId) {
      whereConditions.push(eq(appointments.serviceId, serviceId));
    }

    const result = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${appointments.scheduledAt})`.as('hour'),
        appointmentCount: count(),
        completedCount: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'completed' THEN 1 END)`.as('completed'),
        avgWaitTime: sql<number>`
          AVG(
            CASE 
              WHEN ${appointments.attendedAt} IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (${appointments.attendedAt} - ${appointments.scheduledAt})) / 60 
            END
          )
        `.as('avg_wait_time')
      })
      .from(appointments)
      .where(and(...whereConditions))
      .groupBy(sql`EXTRACT(HOUR FROM ${appointments.scheduledAt})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${appointments.scheduledAt})`);

    return result.map((row: any) => {
      const total = Number(row.appointmentCount);
      const completed = Number(row.completedCount);
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        hour: Number(row.hour),
        appointmentCount: total,
        completionRate: Math.round(completionRate * 100) / 100,
        averageWaitTime: Math.round((Number(row.avgWaitTime) || 0) * 100) / 100
      };
    });
  }

  /**
   * Obtiene tendencias de citas por fecha
   */
  static async getAppointmentTrends(filters: AppointmentReportFilters): Promise<AppointmentTrend[]> {
    const { startDate, endDate, branchId, serviceId } = filters;
    
    const whereConditions = [
      gte(appointments.scheduledAt, startOfDay(parseISO(startDate))),
      lte(appointments.scheduledAt, endOfDay(parseISO(endDate)))
    ];

    if (branchId) {
      whereConditions.push(eq(appointments.branchId, branchId));
    }
    if (serviceId) {
      whereConditions.push(eq(appointments.serviceId, serviceId));
    }

    const result = await db
      .select({
        date: sql<string>`DATE(${appointments.scheduledAt})`.as('date'),
        totalAppointments: count(),
        completedAppointments: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'completed' THEN 1 END)`.as('completed'),
        cancelledAppointments: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'cancelled' THEN 1 END)`.as('cancelled'),
        noShowAppointments: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'no-show' THEN 1 END)`.as('no_show')
      })
      .from(appointments)
      .where(and(...whereConditions))
      .groupBy(sql`DATE(${appointments.scheduledAt})`)
      .orderBy(sql`DATE(${appointments.scheduledAt})`);

    return result.map((row: any) => {
      const total = Number(row.totalAppointments);
      const completed = Number(row.completedAppointments);
      const cancelled = Number(row.cancelledAppointments);
      const noShow = Number(row.noShowAppointments);
      
      const attendanceRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        date: row.date,
        totalAppointments: total,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        noShowAppointments: noShow,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      };
    });
  }
}
