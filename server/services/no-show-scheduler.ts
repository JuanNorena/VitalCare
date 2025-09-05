import { db } from '../../db';
import { appointments } from '../../db/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';

/**
 * Configuración del scheduler de marcado automático de "no asistió"
 * @interface NoShowSchedulerConfig
 */
interface NoShowSchedulerConfig {
  /** Intervalo en minutos entre ejecuciones */
  intervalMinutes: number;
  /** Indica si el scheduler está activo */
  enabled: boolean;
  /** Tiempo de gracia en minutos después de la cita programada antes de marcar como no asistió */
  graceTimeMinutes: number;
}

/**
 * Estadísticas de ejecución del scheduler
 * @interface NoShowSchedulerStats
 */
interface NoShowSchedulerStats {
  /** Última ejecución */
  lastRun?: Date;
  /** Próxima ejecución programada */
  nextRun?: Date;
  /** Total de citas marcadas como no asistió */
  totalMarkedAsNoShow: number;
  /** Total de errores */
  totalErrors: number;
  /** Indica si está ejecutándose actualmente */
  isRunning: boolean;
  /** Tiempo promedio de ejecución en ms */
  averageExecutionTime: number;
}

/**
 * Scheduler Automático de Marcado "No Asistió"
 * 
 * Sistema que ejecuta automáticamente el marcado de citas como "no asistió"
 * cuando ha pasado el tiempo de gracia después de la hora programada.
 * 
 * **Características:**
 * - Ejecución automática por intervalos configurables
 * - Tiempo de gracia configurable antes de marcar como no asistió
 * - Manejo de errores robusto con logging detallado
 * - Estadísticas y métricas de rendimiento
 * - Control de concurrencia para evitar ejecuciones superpuestas
 * - Solo procesa citas en estado "scheduled"
 * 
 * **Lógica de Negocio:**
 * - Solo marca citas con estado "scheduled"
 * - Respeta un tiempo de gracia configurable (por defecto 60 minutos)
 * - No afecta citas ya procesadas (checked-in, completed, cancelled)
 * - Registra timestamp de cuando se marcó como no asistió
 * - Marca si fue procesado automáticamente vs manualmente
 * 
 * @class NoShowScheduler
 * @version 1.0.0
 * 
 * @example
 * ```typescript
 * // Iniciar scheduler automático
 * const scheduler = new NoShowScheduler({
 *   intervalMinutes: 30,     // Ejecutar cada 30 minutos
 *   enabled: true,
 *   graceTimeMinutes: 60     // 1 hora de gracia después de la cita
 * });
 * 
 * scheduler.start();
 * 
 * // Obtener estadísticas
 * const stats = scheduler.getStats();
 * console.log(`Citas marcadas: ${stats.totalMarkedAsNoShow}`);
 * ```
 */
class NoShowScheduler {
  private config: NoShowSchedulerConfig;
  private stats: NoShowSchedulerStats;
  private intervalId?: NodeJS.Timeout;
  private isProcessing: boolean = false;
  private executionTimes: number[] = [];

  /**
   * Constructor del scheduler
   * 
   * @param {NoShowSchedulerConfig} config - Configuración del scheduler
   */
  constructor(config: NoShowSchedulerConfig) {
    this.config = config;
    this.stats = {
      totalMarkedAsNoShow: 0,
      totalErrors: 0,
      isRunning: false,
      averageExecutionTime: 0
    };
  }

  /**
   * Ejecuta el procesamiento de marcado de no asistidos con métricas
   * 
   * @private
   * @returns {Promise<void>}
   */
  private async executeNoShowMarking(): Promise<void> {
    if (this.isProcessing) {
      console.log('No-Show Scheduler ya está procesando, omitiendo ejecución');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      console.log('Iniciando procesamiento de marcado no asistió...');

      // Calcular fecha límite (hora actual - tiempo de gracia)
      const graceTimeMs = this.config.graceTimeMinutes * 60 * 1000;
      const cutoffTime = new Date(Date.now() - graceTimeMs);

      // Buscar citas que deberían marcarse como no asistió
      const overdueAppointments = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.status, 'scheduled'),
            lt(appointments.scheduledAt, cutoffTime),
            isNull(appointments.noShowMarkedAt) // No procesadas previamente
          )
        );

      console.log(`Encontradas ${overdueAppointments.length} citas para marcar como no asistió`);

      let markedCount = 0;
      let errorCount = 0;

      // Procesar cada cita encontrada
      for (const appointment of overdueAppointments) {
        try {
          await this.markAppointmentAsNoShow(appointment);
          markedCount++;
          
          console.log(`Cita ${appointment.id} marcada como no asistió (programada: ${appointment.scheduledAt})`);
        } catch (error) {
          errorCount++;
          console.error(`Error marcando cita ${appointment.id} como no asistió:`, error);
        }
      }

      // Actualizar estadísticas
      this.stats.totalMarkedAsNoShow += markedCount;
      this.stats.totalErrors += errorCount;
      this.stats.lastRun = new Date();

      // Calcular próxima ejecución
      this.stats.nextRun = new Date(Date.now() + (this.config.intervalMinutes * 60 * 1000));

      console.log(`Procesamiento completado: ${markedCount} marcadas, ${errorCount} errores`);

    } catch (error) {
      console.error('Error general en el procesamiento de no asistidos:', error);
      this.stats.totalErrors++;
    } finally {
      // Calcular tiempo de ejecución
      const executionTime = Date.now() - startTime;
      this.executionTimes.push(executionTime);
      
      // Mantener solo las últimas 10 ejecuciones para el promedio
      if (this.executionTimes.length > 10) {
        this.executionTimes.shift();
      }
      
      this.stats.averageExecutionTime = 
        this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length;

      this.isProcessing = false;
      
      console.log(`Tiempo de ejecución: ${executionTime}ms`);
    }
  }

  /**
   * Marca una cita específica como no asistió
   * 
   * @private
   * @param {any} appointment - La cita a marcar
   * @returns {Promise<void>}
   */
  private async markAppointmentAsNoShow(appointment: any): Promise<void> {
    const now = new Date();

    await db
      .update(appointments)
      .set({
        status: 'no-show',
        noShowMarkedAt: now,
        autoMarkedAsNoShow: true,
        updatedAt: now
      })
      .where(eq(appointments.id, appointment.id));
  }

  /**
   * Inicia el scheduler automático
   * 
   * @returns {void}
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('No-Show Scheduler está deshabilitado');
      return;
    }

    if (this.stats.isRunning) {
      console.log('No-Show Scheduler ya está ejecutándose');
      return;
    }

    console.log(`Iniciando No-Show Scheduler con intervalo de ${this.config.intervalMinutes} minutos`);
    console.log(`Tiempo de gracia configurado: ${this.config.graceTimeMinutes} minutos`);

    // Ejecutar inmediatamente
    this.executeNoShowMarking();

    // Programar ejecuciones periódicas
    this.intervalId = setInterval(() => {
      this.executeNoShowMarking();
    }, this.config.intervalMinutes * 60 * 1000);

    this.stats.isRunning = true;
  }

  /**
   * Detiene el scheduler automático
   * 
   * @returns {void}
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.stats.isRunning = false;
    console.log('No-Show Scheduler detenido');
  }

  /**
   * Actualiza la configuración del scheduler
   * 
   * @param {Partial<NoShowSchedulerConfig>} newConfig - Nueva configuración
   * @returns {void}
   */
  updateConfig(newConfig: Partial<NoShowSchedulerConfig>): void {
    const wasRunning = this.stats.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasRunning && this.config.enabled) {
      this.start();
    }

    console.log('Configuración de No-Show Scheduler actualizada:', this.config);
  }

  /**
   * Obtiene las estadísticas actuales del scheduler
   * 
   * @returns {NoShowSchedulerStats} Estadísticas actuales
   */
  getStats(): NoShowSchedulerStats {
    return { ...this.stats };
  }

  /**
   * Obtiene la configuración actual del scheduler
   * 
   * @returns {NoShowSchedulerConfig} Configuración actual
   */
  getConfig(): NoShowSchedulerConfig {
    return { ...this.config };
  }

  /**
   * Ejecuta manualmente el procesamiento (útil para testing o ejecución bajo demanda)
   * 
   * @returns {Promise<void>}
   */
  async executeManually(): Promise<void> {
    console.log('Ejecutando procesamiento manual de no asistidos...');
    await this.executeNoShowMarking();
  }

  /**
   * Reinicia las estadísticas del scheduler
   * 
   * @returns {void}
   */
  resetStats(): void {
    this.stats.totalMarkedAsNoShow = 0;
    this.stats.totalErrors = 0;
    this.stats.averageExecutionTime = 0;
    this.executionTimes = [];
    
    console.log('Estadísticas de No-Show Scheduler reiniciadas');
  }
}

// Configuración por defecto
const defaultConfig: NoShowSchedulerConfig = {
  intervalMinutes: 5,        // Ejecutar cada 30 minutos
  enabled: true,              // Habilitado por defecto
  graceTimeMinutes: 1        // 1 minuto de gracia después de la cita
};

// Instancia singleton del scheduler
export const noShowScheduler = new NoShowScheduler(defaultConfig);

// Iniciar automáticamente si está en producción
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_NO_SHOW_SCHEDULER === 'true') {
  noShowScheduler.start();
  console.log('No-Show Scheduler iniciado automáticamente');
}

export { NoShowScheduler, type NoShowSchedulerConfig, type NoShowSchedulerStats };
