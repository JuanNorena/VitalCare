import { reminderService } from './reminder-service';

/**
 * Configuración del scheduler de recordatorios
 * @interface SchedulerConfig
 */
interface SchedulerConfig {
  /** Intervalo en minutos entre ejecuciones */
  intervalMinutes: number;
  /** Indica si el scheduler está activo */
  enabled: boolean;
  /** Hora de inicio (24h format) */
  startHour: number;
  /** Hora de fin (24h format) */
  endHour: number;
}

/**
 * Estadísticas de ejecución del scheduler
 * @interface SchedulerStats
 */
interface SchedulerStats {
  /** Última ejecución */
  lastRun?: Date;
  /** Próxima ejecución programada */
  nextRun?: Date;
  /** Total de recordatorios enviados */
  totalSent: number;
  /** Total de errores */
  totalErrors: number;
  /** Indica si está ejecutándose actualmente */
  isRunning: boolean;
  /** Tiempo promedio de ejecución en ms */
  averageExecutionTime: number;
}

/**
 * Scheduler Automático de Recordatorios
 * 
 * Sistema que ejecuta automáticamente el procesamiento de recordatorios
 * según una configuración de intervalos establecida.
 * 
 * **Características:**
 * - Ejecución automática por intervalos configurables
 * - Funcionamiento 24/7 sin restricciones de horario
 * - Manejo de errores robusto con reintento automático
 * - Estadísticas y métricas de rendimiento
 * - Control de concurrencia para evitar ejecuciones superpuestas
 * 
 * @class ReminderScheduler
 * @version 1.1.0
 * 
 * @example
 * ```typescript
 * // Iniciar scheduler automático
 * const scheduler = new ReminderScheduler({
 *   intervalMinutes: 60,
 *   enabled: true,
 *   startHour: 8,    // Solo para compatibilidad, ya no se usa
 *   endHour: 18      // Solo para compatibilidad, ya no se usa
 * });
 * 
 * scheduler.start();
 * ```
 */
class ReminderScheduler {
  private config: SchedulerConfig;
  private stats: SchedulerStats;
  private intervalId?: NodeJS.Timeout;
  private isProcessing: boolean = false;

  /**
   * Constructor del scheduler
   * 
   * @param {SchedulerConfig} config - Configuración del scheduler
   */
  constructor(config: SchedulerConfig) {
    this.config = config;
    this.stats = {
      totalSent: 0,
      totalErrors: 0,
      isRunning: false,
      averageExecutionTime: 0
    };
  }

  /**
   * Ejecuta el procesamiento de recordatorios con métricas
   * 
   * @private
   * @returns {Promise<void>}
   */
  private async executeReminders(): Promise<void> {
    if (this.isProcessing) {
      console.log('Scheduler ya está procesando, omitiendo ejecución');
      return;
    }

    // Los recordatorios deben enviarse en cualquier momento del día
    // para asegurar que los pacientes reciban las notificaciones a tiempo
    
    this.isProcessing = true;
    this.stats.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('Scheduler ejecutando procesamiento de recordatorios...');
      
      // Procesar recordatorios
      const results = await reminderService.processReminders();
      
      // Actualizar estadísticas
      const successful = results.filter(r => r.success).length;
      const errors = results.filter(r => !r.success).length;
      
      this.stats.totalSent += successful;
      this.stats.totalErrors += errors;
      this.stats.lastRun = new Date();
      
      // Calcular tiempo promedio de ejecución
      const executionTime = Date.now() - startTime;
      this.stats.averageExecutionTime = this.stats.averageExecutionTime === 0 
        ? executionTime 
        : (this.stats.averageExecutionTime + executionTime) / 2;

      console.log(`✅ Scheduler completado: ${successful} enviados, ${errors} errores, ${executionTime}ms`);

    } catch (error) {
      console.error('❌ Error en scheduler de recordatorios:', error);
      this.stats.totalErrors++;
    } finally {
      this.isProcessing = false;
      this.stats.isRunning = false;
      
      // Calcular próxima ejecución
      this.stats.nextRun = new Date(Date.now() + (this.config.intervalMinutes * 60 * 1000));
    }
  }

  /**
   * Inicia el scheduler automático
   * 
   * @public
   * @returns {void}
   * 
   * @example
   * ```typescript
   * scheduler.start();
   * console.log('Scheduler iniciado');
   * ```
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('Scheduler de recordatorios deshabilitado');
      return;
    }

    if (this.intervalId) {
      console.log('Scheduler ya está ejecutándose');
      return;
    }

    console.log(`Iniciando scheduler de recordatorios (cada ${this.config.intervalMinutes} minutos, 24/7)`);
    
    // Ejecutar inmediatamente la primera vez
    this.executeReminders();
    
    // Programar ejecuciones periódicas
    this.intervalId = setInterval(() => {
      this.executeReminders();
    }, this.config.intervalMinutes * 60 * 1000);

    console.log('✅ Scheduler de recordatorios iniciado - funcionando 24/7');
  }

  /**
   * Detiene el scheduler automático
   * 
   * @public
   * @returns {void}
   * 
   * @example
   * ```typescript
   * scheduler.stop();
   * console.log('Scheduler detenido');
   * ```
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('Scheduler de recordatorios detenido');
    }
  }

  /**
   * Ejecuta manualmente el procesamiento de recordatorios
   * 
   * @public
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * // Ejecutar manualmente
   * await scheduler.runNow();
   * ```
   */
  async runNow(): Promise<void> {
    console.log('Ejecución manual del scheduler solicitada');
    await this.executeReminders();
  }

  /**
   * Obtiene las estadísticas actuales del scheduler
   * 
   * @public
   * @returns {SchedulerStats} Estadísticas del scheduler
   * 
   * @example
   * ```typescript
   * const stats = scheduler.getStats();
   * console.log(`Total enviados: ${stats.totalSent}`);
   * ```
   */
  getStats(): SchedulerStats {
    return { ...this.stats };
  }

  /**
   * Actualiza la configuración del scheduler
   * 
   * @public
   * @param {Partial<SchedulerConfig>} newConfig - Nueva configuración
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // Cambiar intervalo a 30 minutos
   * scheduler.updateConfig({ intervalMinutes: 30 });
   * ```
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    const wasRunning = this.intervalId !== undefined;
    
    // Detener si está ejecutándose
    if (wasRunning) {
      this.stop();
    }
    
    // Actualizar configuración
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar si estaba ejecutándose
    if (wasRunning && this.config.enabled) {
      this.start();
    }
    
    console.log('Configuración del scheduler actualizada');
  }

  /**
   * Verifica el estado del scheduler
   * 
   * @public
   * @returns {boolean} true si está activo
   */
  isActive(): boolean {
    return this.intervalId !== undefined;
  }
}

/**
 * Configuración por defecto del scheduler
 * Puede ser sobrescrita por variables de entorno
 * 
 * Nota: startHour y endHour se mantienen para compatibilidad
 * pero ya no se usan - el scheduler funciona 24/7
 */
const defaultConfig: SchedulerConfig = {
  intervalMinutes: parseInt(process.env.REMINDER_INTERVAL_MINUTES || '60'), // Cada hora por defecto
  enabled: process.env.REMINDER_SCHEDULER_ENABLED !== 'false', // Habilitado por defecto
  startHour: parseInt(process.env.REMINDER_START_HOUR || '0'), // Mantenido para compatibilidad
  endHour: parseInt(process.env.REMINDER_END_HOUR || '24') // Mantenido para compatibilidad
};

/**
 * Instancia singleton del scheduler de recordatorios
 * 
 * Esta instancia está configurada con valores por defecto que pueden
 * ser personalizados a través de variables de entorno.
 * 
 * @constant {ReminderScheduler} reminderScheduler
 * 
 * Variables de entorno disponibles:
 * - REMINDER_INTERVAL_MINUTES: Intervalo en minutos (default: 60)
 * - REMINDER_SCHEDULER_ENABLED: true/false (default: true)
 * - REMINDER_START_HOUR: (deprecado) Se mantiene para compatibilidad
 * - REMINDER_END_HOUR: (deprecado) Se mantiene para compatibilidad
 *
 * Nota: El scheduler ahora funciona 24/7 sin restricciones de horario
 * para asegurar que los recordatorios se envíen oportunamente.
 * 
 * @example
 * ```typescript
 * import { reminderScheduler } from './services/reminder-scheduler';
 * 
 * // Iniciar en el arranque del servidor
 * reminderScheduler.start();
 * ```
 */
export const reminderScheduler = new ReminderScheduler(defaultConfig);