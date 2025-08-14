export class TurnAudioSystem {
  /** Instancia única del sistema (patrón Singleton) */
  private static instance: TurnAudioSystem;
  
  /** Contexto de Web Audio API para generación de sonidos sintéticos */
  private audioContext: AudioContext | null = null;
  
  /** Estado de habilitación del sistema de audio */
  private isEnabled = true;
  
  /** Volumen maestro del sistema (0.0 - 1.0) */
  private volume = 0.8;
  
  /** Velocidad de la síntesis de voz (0.1 - 10.0) */
  private voiceRate = 0.9;
  
  /** Tono de la síntesis de voz (0.0 - 2.0) */
  private voicePitch = 1.0;

  /**
   * Constructor privado para implementar patrón Singleton.
   * Inicializa el contexto de audio automáticamente.
   * 
   * @private
   */
  private constructor() {
    this.initializeAudioContext();
  }

  /**
   * Obtiene la instancia única del sistema de audio.
   * 
   * Implementa el patrón Singleton para garantizar que solo exista
   * una instancia del sistema de audio en toda la aplicación.
   * 
   * @returns Instancia única de TurnAudioSystem
   * 
   * @example
   * ```typescript
   * const audioSystem = TurnAudioSystem.getInstance();
   * audioSystem.setVolume(0.5);
   * ```
   */
  public static getInstance(): TurnAudioSystem {
    if (!TurnAudioSystem.instance) {
      TurnAudioSystem.instance = new TurnAudioSystem();
    }
    return TurnAudioSystem.instance;
  }

  /**
   * Inicializa el contexto de Web Audio API.
   * 
   * Intenta crear un AudioContext compatible con diferentes navegadores.
   * Si falla, deshabilita automáticamente el sistema de audio y continúa
   * funcionando en modo silencioso.
   * 
   * ## Compatibilidad:
   * - `AudioContext`: Navegadores modernos
   * - `webkitAudioContext`: Safari y navegadores basados en WebKit
   * 
   * @private
   */
  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Configura el volumen maestro del sistema de audio.
   * 
   * Establece el volumen para todas las notificaciones sonoras y anuncios de voz.
   * El valor se restringe automáticamente al rango válido [0, 1].
   * 
   * @param volume - Nivel de volumen entre 0.0 (silencio) y 1.0 (máximo)
   * 
   * @example
   * ```typescript
   * // Volumen medio
   * audioSystem.setVolume(0.5);
   * 
   * // Volumen máximo
   * audioSystem.setVolume(1.0);
   * 
   * // Valor fuera de rango se ajusta automáticamente
   * audioSystem.setVolume(1.5); // Se convierte en 1.0
   * ```
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Configura la velocidad de la síntesis de voz.
   * 
   * Controla qué tan rápido se pronuncian los anuncios de voz.
   * Valores más bajos hacen que la voz sea más lenta y clara,
   * valores más altos aceleran el anuncio.
   * 
   * @param rate - Velocidad de voz entre 0.1 (muy lenta) y 10.0 (muy rápida)
   *               Valor recomendado: 0.8 - 1.2 para mejor comprensión
   * 
   * @example
   * ```typescript
   * // Voz lenta y clara
   * audioSystem.setVoiceRate(0.7);
   * 
   * // Voz normal
   * audioSystem.setVoiceRate(1.0);
   * 
   * // Voz rápida
   * audioSystem.setVoiceRate(1.3);
   * ```
   */
  public setVoiceRate(rate: number): void {
    this.voiceRate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * Configura el tono de la síntesis de voz.
   * 
   * Ajusta la altura tonal de la voz sintética.
   * Valores menores producen voces más graves,
   * valores mayores producen voces más agudas.
   * 
   * @param pitch - Tono de voz entre 0.0 (muy grave) y 2.0 (muy agudo)
   *                Valor recomendado: 0.8 - 1.2 para sonido natural
   * 
   * @example
   * ```typescript
   * // Voz grave
   * audioSystem.setVoicePitch(0.8);
   * 
   * // Voz normal
   * audioSystem.setVoicePitch(1.0);
   * 
   * // Voz aguda
   * audioSystem.setVoicePitch(1.2);
   * ```
   */
  public setVoicePitch(pitch: number): void {
    this.voicePitch = Math.max(0, Math.min(2, pitch));
  }  /**
   * Reproduce una llamada completa de turno con tono y anuncio de voz.
   * 
   * Esta es la función principal del sistema que combina una notificación
   * sonora seguida de un anuncio de voz personalizado. La secuencia incluye:
   * 
   * ## Secuencia de reproducción:
   * 1. **Verificación**: Valida que el audio esté habilitado y disponible
   * 2. **Activación**: Resume el contexto de audio si está suspendido
   * 3. **Tono**: Reproduce un tono distintivo según la prioridad
   * 4. **Pausa**: Espera 800ms para separar el tono del anuncio
   * 5. **Voz**: Reproduce el anuncio de voz en español
   * 
   * ## Tipos de prioridad:
   * - **'normal'**: Tono estándar + mensaje básico
   * - **'high'**: Tono de prioridad + mensaje con "inmediatamente"
   * 
   * @param turnCode - Código de confirmación del turno (ej: "A001", "B042")
   * @param servicePointName - Nombre del punto de atención (ej: "Caja 1", "Ventanilla 3")
   * @param priority - Nivel de prioridad del anuncio
   * 
   * @returns Promise que se resuelve cuando se inicia la reproducción
   * 
   * @throws No lanza errores - maneja excepciones internamente con console.warn
   * 
   * @example
   * ```typescript
   * // Llamada normal
   * await audioSystem.playTurnCall("A001", "Caja 1", "normal");
   * // Resultado: Tono estándar + "Turno A001, favor dirigirse a Caja 1"
   * 
   * // Llamada de alta prioridad  
   * await audioSystem.playTurnCall("B015", "Ventanilla 2", "high");
   * // Resultado: Tono prioritario + "Atención. Turno B015, favor dirigirse inmediatamente a Ventanilla 2"
   * ```
   * 
   * @example
   * ```typescript
   * // Uso en un sistema de gestión de turnos
   * const callTurn = async (entry: QueueEntry) => {
   *   const appointment = getAppointmentDetails(entry.appointmentId);
   *   const servicePoint = getServicePointName(entry.counter);
   *   const priority = getTurnPriority(entry.createdAt);
   *   
   *   await audioSystem.playTurnCall(
   *     appointment.confirmationCode,
   *     servicePoint,
   *     priority
   *   );
   * };
   * ```
   */
  public async playTurnCall(turnCode: string, servicePointName: string, priority: 'normal' | 'high' = 'normal'): Promise<void> {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      // Asegurar que el contexto esté activo
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Generar un tono distintivo según prioridad
      const toneType = priority === 'high' ? 'priority' : 'standard';
      await this.playNotificationTone(toneType);
        // Esperar un momento antes del anuncio de voz para mejor separación
      setTimeout(() => {
        this.playVoiceAnnouncement(turnCode, servicePointName, priority);
      }, 800);

    } catch (error) {
      console.warn('Error playing turn call audio:', error);
    }
  }

  /**
   * Reproduce una alerta sonora urgente para situaciones críticas.
   * 
   * Este método genera un tono de alerta especial caracterizado por:
   * - **Patrón distintivo**: Secuencia de 5 tonos alternados (400-800-400-800-400 Hz)
   * - **Mayor duración**: 1.5 segundos para mayor impacto auditivo
   * - **Sin anuncio de voz**: Solo tono para llamar atención inmediata
   * 
   * ## Casos de uso típicos:
   * - Emergencias o evacuaciones
   * - Turnos críticos que requieren atención inmediata
   * - Alertas del sistema (errores, desconexiones)
   * - Notificaciones de alta prioridad para el personal
   * 
   * @returns Promise que se resuelve cuando se inicia la reproducción
   * 
   * @example
   * ```typescript
   * // Alerta de emergencia
   * await audioSystem.playUrgentAlert();
   * 
   * // Uso condicional para situaciones críticas
   * if (isEmergency) {
   *   await audioSystem.playUrgentAlert();
   * }
   * ```
   * 
   * @example
   * ```typescript
   * // En un sistema de monitoreo
   * const handleCriticalTurn = async (turnData) => {
   *   if (turnData.waitingTime > 60) { // Más de 1 hora esperando
   *     await audioSystem.playUrgentAlert();
   *     // Luego llamar el turno normalmente
   *     await audioSystem.playTurnCall(turnData.code, turnData.servicePoint, 'high');
   *   }
   * };
   * ```
   */
  public async playUrgentAlert(): Promise<void> {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }      await this.playNotificationTone('urgent');

    } catch (error) {
      console.warn('Error playing urgent alert:', error);
    }
  }

  /**
   * Genera tonos de notificación distintivos usando Web Audio API.
   * 
   * Este método privado es el núcleo del sistema de notificaciones sonoras.
   * Utiliza osciladores de la Web Audio API para crear secuencias de tonos
   * personalizadas según el tipo de notificación requerida.
   * 
   * ## Características técnicas:
   * - **Oscilador**: Generación sintética de frecuencias
   * - **Gain Node**: Control de volumen con fade in/out
   * - **Secuencias**: Múltiples frecuencias por tipo de notificación
   * - **Timing**: Interpolación suave entre frecuencias
   * 
   * ## Tipos de tonos disponibles:
   * 
   * ### 🔔 Standard (0.7s)
   * - **Frecuencias**: 800Hz → 1000Hz → 800Hz
   * - **Uso**: Llamadas normales de turno
   * - **Característica**: Tono limpio y profesional
   * 
   * ### 🔔 Priority (1.0s)
   * - **Frecuencias**: 600Hz → 800Hz → 1000Hz → 800Hz
   * - **Uso**: Turnos con tiempo de espera elevado
   * - **Característica**: Secuencia más larga y ascendente
   * 
   * ### 🚨 Urgent (1.5s)
   * - **Frecuencias**: 400Hz → 800Hz → 400Hz → 800Hz → 400Hz
   * - **Uso**: Emergencias y situaciones críticas
   * - **Característica**: Alternancia rápida de tonos graves/agudos
   * 
   * @param type - Tipo de tono a reproducir
   * 
   * @private
   * 
   * @example
   * ```typescript
   * // Llamada interna desde playTurnCall
   * await this.playNotificationTone('standard');
   * 
   * // Para turnos prioritarios
   * await this.playNotificationTone('priority');
   * 
   * // Para alertas urgentes
   * await this.playNotificationTone('urgent');
   * ```
   */
  private async playNotificationTone(type: 'standard' | 'priority' | 'urgent' = 'standard'): Promise<void> {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Configurar frecuencias y duración según el tipo de notificación
    let frequencies: number[];
    let duration: number;
    
    switch (type) {
      case 'priority':
        frequencies = [600, 800, 1000, 800]; // Secuencia ascendente-descendente
        duration = 1.0;
        break;
      case 'urgent':
        frequencies = [400, 800, 400, 800, 400]; // Alternancia grave-agudo
        duration = 1.5;
        break;
      default:
        frequencies = [800, 1000, 800]; // Tono clásico de campana
        duration = 0.7;
    }

    // Aplicar secuencia de frecuencias con interpolación temporal
    frequencies.forEach((freq, index) => {
      const time = this.audioContext!.currentTime + (index * duration / frequencies.length);
      oscillator.frequency.setValueAtTime(freq, time);
    });    // Configurar el volumen con fade in/out suave para evitar clics
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioContext.currentTime + duration - 0.2);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

    // Iniciar y programar la finalización del oscilador
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Reproduce anuncios de voz usando la Speech Synthesis API del navegador.
   * 
   * Este método privado maneja la síntesis de voz para los anuncios de turnos.
   * Utiliza la API nativa del navegador para convertir texto a voz con
   * configuraciones específicas para idioma español y parámetros personalizables.
   * 
   * ## Funcionalidades principales:
   * 
   * ### 🎤 Mensajes Personalizados
   * - **Normal**: "Turno [código], favor dirigirse a [punto]"
   * - **Alta prioridad**: "Atención. Turno [código], favor dirigirse inmediatamente a [punto]"
   * 
   * ### 🌐 Configuración de Idioma
   * - **Idioma**: Español (es-ES) como configuración principal
   * - **Detección**: Búsqueda automática de voces locales en español
   * - **Fallback**: Funciona con voces del sistema si no hay voces locales
   * 
   * ### ⚙️ Parámetros Configurables
   * - **Velocidad**: Controlada por `this.voiceRate`
   * - **Tono**: Controlada por `this.voicePitch`
   * - **Volumen**: Sincronizado con el volumen maestro del sistema
   * 
   * ## Compatibilidad y fallbacks:
   * - Verificación de soporte de Speech Synthesis API
   * - Manejo graceful si no hay soporte
   * - Selección inteligente de voces disponibles
   * 
   * @param turnCode - Código de confirmación del turno
   * @param servicePointName - Nombre del punto de atención
   * @param priority - Nivel de prioridad del anuncio
   * 
   * @private
   * 
   * @example
   * ```typescript
   * // Llamada interna desde playTurnCall
   * this.playVoiceAnnouncement("A001", "Caja 1", "normal");
   * // Resultado: "Turno A001, favor dirigirse a Caja 1"
   * 
   * this.playVoiceAnnouncement("B015", "Ventanilla 3", "high");
   * // Resultado: "Atención. Turno B015, favor dirigirse inmediatamente a Ventanilla 3"
   * ```
   */
  private playVoiceAnnouncement(turnCode: string, servicePointName: string, priority: 'normal' | 'high' = 'normal'): void {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Construir mensaje personalizado según el nivel de prioridad
    let message: string;
    if (priority === 'high') {
      message = `Atención. Turno ${turnCode}, favor dirigirse inmediatamente a ${servicePointName}`;
    } else {
      message = `Turno ${turnCode}, favor dirigirse a ${servicePointName}`;
    }    // Crear y configurar la síntesis de voz
    const utterance = new SpeechSynthesisUtterance(message);
    
    utterance.lang = 'es-ES';
    utterance.rate = this.voiceRate;
    utterance.pitch = this.voicePitch;
    utterance.volume = this.volume;

    // Buscar y seleccionar la mejor voz disponible en español
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(voice => 
      voice.lang.startsWith('es') && voice.localService // Priorizar voces locales
    );
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    // Iniciar la síntesis de voz
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Reproduce un sonido de alerta general para notificaciones del sistema.
   * 
   * Este método genera un sonido de alerta simple y distintivo usando
   * tres tonos en secuencia (400Hz → 600Hz → 400Hz) con una duración
   * total de 0.5 segundos. Es ideal para notificaciones generales que
   * no requieren la urgencia de `playUrgentAlert()`.
   * 
   * ## Características del sonido:
   * - **Patrón**: Grave → Agudo → Grave (400-600-400 Hz)
   * - **Duración**: 0.5 segundos total
   * - **Volumen**: 20% del volumen maestro (más sutil)
   * - **Uso**: Notificaciones generales, confirmaciones, avisos
   * 
   * ## Casos de uso típicos:
   * - Confirmación de acciones del usuario
   * - Notificaciones de sistema no críticas
   * - Alertas informativas
   * - Sonidos de interfaz de usuario
   * 
   * @returns Promise que se resuelve cuando se inicia la reproducción
   * 
   * @example
   * ```typescript
   * // Sonido de confirmación
   * await audioSystem.playAlertSound();
   * 
   * // Al confirmar una acción
   * const handleConfirm = async () => {
   *   await processAction();
   *   await audioSystem.playAlertSound(); // Feedback auditivo
   * };
   * ```
   * 
   * @example
   * ```typescript
   * // En notificaciones de sistema
   * const showNotification = async (message: string) => {
   *   displayMessage(message);
   *   await audioSystem.playAlertSound();
   * };
   * ```
   */
  public async playAlertSound(): Promise<void> {    if (!this.isEnabled || !this.audioContext) return;

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configurar secuencia de frecuencias: 400Hz → 600Hz → 400Hz
      oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime + 0.3);

      // Configurar envelope de volumen con fade suave
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.4);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);

    } catch (error) {
      console.warn('Error playing alert sound:', error);
    }
  }

  /**
   * Habilita o deshabilita todo el sistema de audio.
   * 
   * Este método controla el estado maestro del sistema de audio.
   * Cuando se deshabilita, todos los métodos de reproducción de audio
   * fallarán silenciosamente sin generar errores.
   * 
   * ## Comportamiento:
   * - **Habilitado**: Todos los sonidos y anuncios funcionan normalmente
   * - **Deshabilitado**: Modo silencioso completo, sin reproducción de audio
   * - **Persistente**: El estado se mantiene durante toda la sesión
   * 
   * ## Casos de uso típicos:
   * - Control de usuario para activar/desactivar sonidos
   * - Modo silencioso durante horas específicas
   * - Configuración de accesibilidad
   * - Debugging y testing
   * 
   * @param enabled - `true` para habilitar audio, `false` para deshabilitarlo
   * 
   * @example
   * ```typescript
   * // Deshabilitar audio completamente
   * audioSystem.setEnabled(false);
   * 
   * // Llamada que no producirá sonido
   * await audioSystem.playTurnCall("A001", "Caja 1"); // Silencioso
   * 
   * // Volver a habilitar
   * audioSystem.setEnabled(true);
   * await audioSystem.playTurnCall("A002", "Caja 1"); // Con sonido
   * ```
   * 
   * @example
   * ```typescript
   * // Toggle de audio en interfaz de usuario
   * const toggleAudio = () => {
   *   const currentState = audioSystem.isAudioEnabled();
   *   audioSystem.setEnabled(!currentState);
   * };
   * ```
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Verifica si el sistema de audio está completamente habilitado y funcional.
   * 
   * Este método realiza una verificación completa del estado del sistema,
   * comprobando tanto la configuración de habilitación como la disponibilidad
   * del contexto de audio del navegador.
   * 
   * ## Verificaciones realizadas:
   * 1. **Estado de habilitación**: Configuración `this.isEnabled`
   * 2. **Contexto de audio**: Disponibilidad de `this.audioContext`
   * 3. **Compatibilidad**: Soporte del navegador para Web Audio API
   * 
   * @returns `true` si el audio está habilitado y funcional, `false` en caso contrario
   * 
   * @example
   * ```typescript
   * // Verificar antes de reproducir audio
   * if (audioSystem.isAudioEnabled()) {
   *   await audioSystem.playTurnCall(turnCode, servicePoint);
   * } else {
   *   console.log("Audio deshabilitado o no soportado");
   * }
   * ```
   * 
   * @example
   * ```typescript
   * // Mostrar estado en la interfaz
   * const audioStatus = audioSystem.isAudioEnabled() 
   *   ? "Audio habilitado" 
   *   : "Audio deshabilitado";
   * ```
   */
  public isAudioEnabled(): boolean {
    return this.isEnabled && this.audioContext !== null;
  }

  /**
   * Obtiene la configuración completa actual del sistema de audio.
   * 
   * Retorna un objeto con todos los parámetros configurables del sistema,
   * útil para mostrar el estado actual en interfaces de configuración,
   * debugging, o para persistir configuraciones del usuario.
   * 
   * ## Configuraciones incluidas:
   * - **enabled**: Estado de habilitación del sistema
   * - **volume**: Volumen maestro (0.0 - 1.0)
   * - **voiceRate**: Velocidad de síntesis de voz (0.1 - 10.0)
   * - **voicePitch**: Tono de síntesis de voz (0.0 - 2.0)
   * 
   * @returns Objeto con la configuración actual del sistema
   * 
   * @example
   * ```typescript
   * // Obtener configuración actual
   * const settings = audioSystem.getAudioSettings();
   * console.log(settings);
   * // Output: { enabled: true, volume: 0.8, voiceRate: 0.9, voicePitch: 1.0 }
   * ```
   * 
   * @example
   * ```typescript
   * // Guardar configuración en localStorage
   * const settings = audioSystem.getAudioSettings();
   * localStorage.setItem('audioSettings', JSON.stringify(settings));
   * 
   * // Restaurar configuración
   * const savedSettings = JSON.parse(localStorage.getItem('audioSettings') || '{}');
   * if (savedSettings.volume) audioSystem.setVolume(savedSettings.volume);
   * if (savedSettings.voiceRate) audioSystem.setVoiceRate(savedSettings.voiceRate);
   * ```
   * 
   * @example
   * ```typescript
   * // Panel de configuración de audio
   * const AudioSettingsPanel = () => {
   *   const settings = audioSystem.getAudioSettings();
   *   
   *   return (
   *     <div>
   *       <label>Volumen: {Math.round(settings.volume * 100)}%</label>
   *       <label>Velocidad: {settings.voiceRate}x</label>
   *       <label>Tono: {settings.voicePitch}</label>
   *     </div>
   *   );
   * };
   * ```
   */
  public getAudioSettings() {
    return {
      enabled: this.isEnabled,
      volume: this.volume,
      voiceRate: this.voiceRate,
      voicePitch: this.voicePitch,
    };
  }
}

/**
 * Hook personalizado para interactuar con el sistema de audio de turnos.
 * 
 * Este hook proporciona una interfaz React-friendly para usar el sistema
 * de audio TurnAudioSystem. Utiliza el patrón Singleton internamente
 * para garantizar consistencia en toda la aplicación.
 * 
 * ## Funcionalidades proporcionadas:
 * 
 * ### 🔊 Reproducción de Audio
 * - `playTurnCall`: Llamada completa de turno con tono + voz
 * - `playAlertSound`: Sonido de alerta general
 * - `playUrgentAlert`: Alerta urgente para situaciones críticas
 * 
 * ### ⚙️ Configuración
 * - `setEnabled`: Habilitar/deshabilitar todo el sistema
 * - `setVolume`: Control de volumen maestro
 * - `setVoiceRate`: Velocidad de síntesis de voz
 * - `setVoicePitch`: Tono de síntesis de voz
 * 
 * ### 📊 Estado e Información
 * - `isEnabled`: Verificar si el audio está funcional
 * - `getSettings`: Obtener configuración completa actual
 * 
 * ## Ventajas del hook:
 * - **Consistencia**: Una sola instancia compartida en toda la app
 * - **Simplicidad**: API limpia y fácil de usar en componentes React
 * - **Binding automático**: Métodos ya vinculados, listos para usar
 * - **TypeScript**: Tipado completo para mejor developer experience
 * 
 * @returns Objeto con métodos para controlar el sistema de audio
 * 
 * @example
 * ```tsx
 * // Uso básico en un componente React
 * function TurnNotifier() {
 *   const { playTurnCall, setVolume, isEnabled } = useTurnAudio();
 * 
 *   const handleCallTurn = async (turn: Turn) => {
 *     if (isEnabled()) {
 *       await playTurnCall(turn.code, turn.servicePoint, turn.priority);
 *     }
 *   };
 * 
 *   return (
 *     <button onClick={() => handleCallTurn(currentTurn)}>
 *       Llamar Turno
 *     </button>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Panel de configuración de audio
 * function AudioSettings() {
 *   const { 
 *     setVolume, 
 *     setVoiceRate, 
 *     setEnabled, 
 *     getSettings,
 *     playAlertSound 
 *   } = useTurnAudio();
 * 
 *   const settings = getSettings();
 * 
 *   return (
 *     <div>
 *       <input 
 *         type="range" 
 *         min="0" 
 *         max="1" 
 *         step="0.1"
 *         value={settings.volume}
 *         onChange={(e) => setVolume(Number(e.target.value))}
 *       />
 *       <button onClick={playAlertSound}>
 *         Probar Sonido
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Integración con sistema de gestión de turnos
 * function VisualizerDashboard() {
 *   const { playTurnCall } = useTurnAudio();
 *   const { queue } = useAppointments();
 * 
 *   useEffect(() => {
 *     // Detectar nuevos turnos llamados y reproducir audio
 *     const newlyServedTurns = queue.filter(turn => 
 *       turn.status === 'serving' && turn.calledAt
 *     );
 * 
 *     newlyServedTurns.forEach(async (turn) => {
 *       const priority = calculatePriority(turn.waitingTime);
 *       await playTurnCall(turn.confirmationCode, turn.servicePoint, priority);
 *     });
 *   }, [queue, playTurnCall]);
 * 
 *   return <div>...</div>;
 * }
 * ```
 * 
 * @since 1.0.0
 * @see {@link TurnAudioSystem} Clase principal del sistema de audio
 * @see {@link playTurnCall} Método principal para llamar turnos
 */
export const useTurnAudio = () => {
  const audioSystem = TurnAudioSystem.getInstance();

  return {
    /** Reproduce una llamada completa de turno con tono y anuncio de voz */
    playTurnCall: audioSystem.playTurnCall.bind(audioSystem),
    
    /** Reproduce un sonido de alerta general para notificaciones */
    playAlertSound: audioSystem.playAlertSound.bind(audioSystem),
    
    /** Reproduce una alerta urgente para situaciones críticas */
    playUrgentAlert: audioSystem.playUrgentAlert.bind(audioSystem),
    
    /** Habilita o deshabilita todo el sistema de audio */
    setEnabled: audioSystem.setEnabled.bind(audioSystem),
    
    /** Configura el volumen maestro del sistema (0.0 - 1.0) */
    setVolume: audioSystem.setVolume.bind(audioSystem),
    
    /** Configura la velocidad de síntesis de voz (0.1 - 10.0) */
    setVoiceRate: audioSystem.setVoiceRate.bind(audioSystem),
    
    /** Configura el tono de síntesis de voz (0.0 - 2.0) */
    setVoicePitch: audioSystem.setVoicePitch.bind(audioSystem),
    
    /** Verifica si el audio está habilitado y funcional */
    isEnabled: audioSystem.isAudioEnabled.bind(audioSystem),
    
    /** Obtiene la configuración completa actual del sistema */
    getSettings: audioSystem.getAudioSettings.bind(audioSystem),
  };
};
