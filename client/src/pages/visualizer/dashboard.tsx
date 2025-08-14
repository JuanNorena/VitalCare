import { useEffect, useState, useRef } from "react";
import { useAppointments } from "@/hooks/use-appointments";
import { useServicePoints } from "@/hooks/use-service-points";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Monitor, Users, Clock, Eye, Maximize, Minimize, Volume2, VolumeX, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format, differenceInMinutes } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useFullscreen } from "@/contexts/fullscreen-context";
import { useTurnAudio } from "@/utils/audio";

/**
 * Dashboard del visualizador de turnos para pantallas públicas.
 * 
 * Este componente proporciona una interfaz completa para mostrar el estado
 * de la cola de turnos en tiempo real, diseñado especialmente para ser
 * visualizado en pantallas públicas en bancos, clínicas y otras instituciones.
 * 
 * ## Funcionalidades principales:
 * 
 * ### 📺 Modo Pantalla Completa
 * - Soporte completo para modo pantalla completa con tecla F11
 * - Controles auto-ocultables después de 3 segundos de inactividad
 * - Interfaz escalable y responsive para diferentes tamaños de pantalla
 * 
 * ### 🔊 Sistema de Audio
 * - Notificaciones sonoras cuando se llaman nuevos turnos
 * - Anuncios de voz en español con códigos de confirmación
 * - Control de habilitación/deshabilitación de audio
 * - Priorización de anuncios según tiempo de espera
 * 
 * ### 📋 Visualización de Datos
 * - Tarjetas de resumen con estadísticas en tiempo real
 * - Lista de turnos siendo atendidos organizados por punto de servicio
 * - Cola de espera con información detallada de cada turno
 * - Códigos de confirmación en lugar de IDs internos
 * 
 * ### 🎨 Interfaz de Usuario
 * - Diseño limpio y profesional con colores diferenciados por estado
 * - Animaciones suaves y transiciones fluidas
 * - Iconografía intuitiva para mejor comprensión visual
 * - Soporte completo para internacionalización (i18n)
 * 
 * @returns Componente React que renderiza el dashboard del visualizador
 * 
 * @example
 * ```tsx
 * // Uso básico del componente
 * function App() {
 *   return (
 *     <FullscreenProvider>
 *       <VisualizerDashboard />
 *     </FullscreenProvider>
 *   );
 * }
 * ```
 * 
 * @see {@link useFullscreen} Para el control de pantalla completa
 * @see {@link useTurnAudio} Para el sistema de audio
 * @see {@link useAppointments} Para los datos de citas
 * @see {@link useServicePoints} Para los puntos de servicio
 */
export default function VisualizerDashboard() {
  // Hooks principales para obtener datos del sistema
  const { queue, queueLoading, appointments } = useAppointments();
  const { user } = useUser();
  
  // Filtrar service points por sede del visualizador
  // Si el visualizador tiene sede asignada, solo mostrar puntos de esa sede
  const { servicePoints } = useServicePoints(user?.branchId || undefined);
  
  const { t } = useTranslation();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { playTurnCall, setEnabled, isEnabled } = useTurnAudio();

  /** Estado para controlar la visibilidad de los controles en pantalla completa */
  const [showControls, setShowControls] = useState(true);
  
  /** Estado para controlar si el audio está habilitado o deshabilitado */
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  /** Estados para el scroll automático de las secciones */
  const [servingScrollIndex, setServingScrollIndex] = useState(0);
  const [waitingScrollIndex, setWaitingScrollIndex] = useState(0);
  
  /** Estados para animaciones suaves */
  const [isDataRefreshing, setIsDataRefreshing] = useState(false);
  const [fadeState, setFadeState] = useState<'visible' | 'fading-out' | 'fading-in'>('visible');
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  /** 
   * Referencia para trackear los turnos que ya han sido servidos previamente.
   * Utilizada para detectar nuevos turnos llamados y evitar reproducir audio duplicado.
   */
  const previousServingTurns = useRef<Set<number>>(new Set());
  
  /** Referencia para almacenar los datos anteriores y comparar cambios */
  const previousQueueData = useRef<{
    serving: number;
    waiting: number;
    complete: number;
  }>({ serving: 0, waiting: 0, complete: 0 });

  /**
   * Maneja la transición suave de datos cuando hay cambios en la cola.
   * 
   * Detecta cambios en los números de turnos y ejecuta una animación suave
   * de fade-out -> fade-in para indicar visualmente las actualizaciones.
   * 
   * @function handleDataTransition
   * @returns {void}
   * 
   * @since 2.0.0
   */
  const handleDataTransition = () => {
    const currentData = {
      serving: servingQueue.length,
      waiting: waitingQueue.length,
      complete: completeQueue.length
    };
    
    // Detectar si hay cambios significativos en los datos
    const hasChanges = 
      currentData.serving !== previousQueueData.current.serving ||
      currentData.waiting !== previousQueueData.current.waiting ||
      currentData.complete !== previousQueueData.current.complete;
    
    if (hasChanges) {
      setFadeState('fading-out');
      
      setTimeout(() => {
        setFadeState('fading-in');
        setLastUpdateTime(new Date());
        previousQueueData.current = currentData;
        
        setTimeout(() => {
          setFadeState('visible');
        }, 300);
      }, 200);
    }
  };

  /**
   * Obtiene la clase CSS apropiada para las transiciones de datos.
   * 
   * @function getDataTransitionClass
   * @returns {string} Clase CSS para el estado de transición actual
   * 
   * @since 2.0.0
   */
  const getDataTransitionClass = (): string => {
    switch (fadeState) {
      case 'fading-out':
        return 'opacity-70 scale-95 transition-all duration-200 ease-out';
      case 'fading-in':
        return 'opacity-90 scale-105 transition-all duration-300 ease-in';
      case 'visible':
      default:
        return 'opacity-100 scale-100 transition-all duration-300 ease-in-out';
    }
  };
  /**
   * Obtiene el locale de date-fns según el idioma actual de la aplicación.
   * 
   * @returns Locale de date-fns correspondiente al idioma seleccionado
   */
  const getDateLocale = () => {
    return t('language') === 'es' ? es : enUS;
  };

  /**
   * Formatea una fecha con localización completa (día, fecha y hora).
   * 
   * @param date - Fecha a formatear
   * @returns Fecha formateada según el idioma actual
   * 
   * @example
   * ES: "lunes, 24 de junio de 2025, 4:02:38 PM"
   * EN: "Monday, June 24th, 2025, 4:02:38 PM"
   */
  const formatFullDateTime = (date: Date) => {
    const locale = getDateLocale();
    if (t('language') === 'es') {
      return format(date, "EEEE, d 'de' MMMM 'de' yyyy, h:mm:ss a", { locale });
    } else {
      return format(date, "EEEE, MMMM do, yyyy, h:mm:ss a", { locale });
    }
  };

  /**
   * Formatea una hora con localización.
   * 
   * @param date - Fecha a formatear
   * @returns Hora formateada según el idioma actual
   * 
   * @example
   * ES: "16:02" o "4:02 PM"
   * EN: "4:02 PM"
   */
  const formatTime = (date: Date) => {
    const locale = getDateLocale();
    return format(date, "h:mm a", { locale });
  };

  /**
   * Filtro principal para aislar turnos por sede del visualizador.
   * 
   * Si el usuario visualizador tiene una sede asignada (branchId), solo se mostrarán
   * los turnos correspondientes a esa sede. Si no tiene sede asignada, se mostrarán
   * todos los turnos (comportamiento por defecto para compatibilidad).
   * 
   * @computed
   * @returns {Array} Cola filtrada por sede del usuario o cola completa
   * 
   * @since 1.0.0
   */
  const filteredQueue = queue?.filter(q => {
    // Si el usuario no tiene sede asignada, mostrar todos los turnos
    if (!user?.branchId) {
      return true;
    }

    // Solo mostrar turnos de la sede asignada al visualizador
    // Necesitamos obtener el branchId de la cita asociada al turno
    const appointment = appointments?.find(apt => apt.id === q.appointmentId);
    return appointment?.branchId === user.branchId;
  }) || [];

  /** 
   * Organización de los datos de la cola filtrada según su estado.
   * Filtra la cola filtrada por sede en tres categorías para facilitar la visualización.
   * 
   * **Importante:** Estos datos ya están filtrados por sede del visualizador.
   */
  const servingQueue = filteredQueue.filter(q => q.status === "serving") || [];
  const waitingQueue = filteredQueue.filter(q => q.status === "waiting") || [];
  const completeQueue = filteredQueue.filter(q => q.status === "complete") || [];

  /**
   * Busca y retorna los detalles completos de una cita basándose en su ID.
   * 
   * @param appointmentId - ID único de la cita
   * @returns Objeto con los detalles de la cita o undefined si no se encuentra
   * 
   * @example
   * ```tsx
   * const appointment = getAppointmentDetails(123);
   * const confirmationCode = appointment?.confirmationCode || 'N/A';
   * ```
   */
  const getAppointmentDetails = (appointmentId: number) => {
    return appointments?.find(a => a.id === appointmentId);
  };

  /**
   * Obtiene el nombre del punto de servicio basado en el appointmentId.
   * 
   * @param appointmentId - ID único de la cita
   * @returns Nombre del punto de servicio o un nombre por defecto si no se encuentra
   * 
   * @example
   * ```tsx
   * const serviceName = getServicePointName(123); // "Caja 1" o "Punto de Servicio 1"
   * ```
   */
  const getServicePointName = (appointmentId: number) => {
    const appointment = getAppointmentDetails(appointmentId);
    return servicePoints?.find(sp => sp.id === appointment?.servicePointId)?.name || `${t('visualizer.servicePoint')} ${appointment?.servicePointId || t('common.notAvailable')}`;
  };

  /**
   * Obtiene el nombre del punto de servicio directamente por servicePointId
   * (para usar con datos de la cola que ya incluyen servicePointId).
   * 
   * @param servicePointId - ID único del punto de servicio
   * @returns Nombre del punto de servicio o un nombre por defecto si no se encuentra
   */
  const getServicePointNameById = (servicePointId?: number) => {
    if (!servicePointId) return t('visualizer.servicePoint') + ' ' + t('common.notAvailable');
    return servicePoints?.find(sp => sp.id === servicePointId)?.name || `${t('visualizer.servicePoint')} ${servicePointId}`;
  };

  /**
   * Determina la prioridad de un turno basándose en su tiempo de espera.
   * 
   * Los turnos que han esperado más de 30 minutos se consideran de alta prioridad
   * para recibir atención preferencial y notificaciones de audio diferentes.
   * 
   * @param createdAt - Fecha y hora de creación del turno (string o Date)
   * @returns 'high' si el turno ha esperado más de 30 minutos, 'normal' en caso contrario
   * 
   * @example
   * ```tsx
   * const priority = getTurnPriority('2024-01-01T10:00:00Z');
   * if (priority === 'high') {
   *   // Aplicar tratamiento especial para turnos prioritarios
   * }
   * ```
   */
  const getTurnPriority = (createdAt: string | Date): 'normal' | 'high' => {
    const waitingMinutes = differenceInMinutes(new Date(), new Date(createdAt));
    return waitingMinutes > 30 ? 'high' : 'normal';
  };

  /**
   * Obtiene la clase CSS apropiada para el indicador visual de tiempo de espera.
   * 
   * Categoriza el tiempo de espera en diferentes niveles visuales:
   * - < 5 min: 'visualizer-time-fresh' (verde)
   * - 5-15 min: 'visualizer-time-normal' (azul)
   * - 15-30 min: 'visualizer-time-warning' (amarillo)
   * - > 30 min: 'visualizer-time-urgent' (rojo)
   * 
   * @param createdAt - Fecha y hora de creación del turno
   * @returns Nombre de la clase CSS correspondiente al tiempo de espera
   * 
   * @example
   * ```tsx
   * const timeClass = getTimeIndicatorClass(entry.createdAt);
   * return <span className={timeClass}>15m</span>;
   * ```
   */
  const getTimeIndicatorClass = (createdAt: string | Date): string => {
    const waitingMinutes = differenceInMinutes(new Date(), new Date(createdAt));
    if (waitingMinutes < 5) return 'visualizer-time-fresh';
    if (waitingMinutes < 15) return 'visualizer-time-normal';
    if (waitingMinutes < 30) return 'visualizer-time-warning';
    return 'visualizer-time-urgent';
  };

  /**
   * Agrupa los turnos que están siendo servidos por punto de servicio.
   * 
   * Organiza los datos para facilitar la visualización en la interfaz,
   * creando un objeto donde cada clave es el nombre del punto de servicio
   * y el valor es un array de turnos asignados a ese punto.
   * 
   * @returns Objeto con turnos agrupados por nombre de punto de servicio
   * 
   * @example
   * ```tsx
   * // Resultado esperado:
   * {
   *   "Caja 1": [turno1, turno2],
   *   "Ventanilla 2": [turno3]
   * }
   * ```
   */
  const servingByServicePoint = servingQueue.reduce((acc, entry) => {
    const servicePointName = getServicePointNameById(entry.servicePointId);
    if (!acc[servicePointName]) {
      acc[servicePointName] = [];
    }
    acc[servicePointName].push(entry);
    return acc;
  }, {} as Record<string, typeof servingQueue>);

  /**
   * Obtiene los turnos servidos visibles para la página actual del scroll automático.
   * 
   * @returns Array de turnos servidos limitado a máximo 4 elementos para la página actual
   */
  const getVisibleServingEntries = () => {
    const allEntries = Object.values(servingByServicePoint).flat();
    if (allEntries.length <= 4) {
      return allEntries;
    }
    
    const startIndex = servingScrollIndex * 4;
    return allEntries.slice(startIndex, startIndex + 4);
  };

  /**
   * Obtiene los turnos en espera visibles para la página actual del scroll automático.
   * 
   * @returns Array de turnos en espera limitado a máximo 6 elementos para la página actual
   */
  const getVisibleWaitingEntries = () => {
    if (waitingQueue.length <= 6) {
      return waitingQueue;
    }
    
    const startIndex = waitingScrollIndex * 6;
    return waitingQueue.slice(startIndex, startIndex + 6);
  };

  /**
   * Agrupa los turnos visibles por punto de servicio para la visualización.
   * 
   * @returns Objeto con turnos visibles agrupados por nombre de punto de servicio
   */
  const getVisibleServingByServicePoint = () => {
    const visibleEntries = getVisibleServingEntries();
    return visibleEntries.reduce((acc, entry) => {
      const servicePointName = getServicePointNameById(entry.servicePointId);
      if (!acc[servicePointName]) {
        acc[servicePointName] = [];
      }
      acc[servicePointName].push(entry);
      return acc;
    }, {} as Record<string, typeof servingQueue>);
  };

  /**
   * Efecto para detectar cambios en los datos y activar transiciones suaves.
   * 
   * Se ejecuta cada vez que cambian los datos de la cola para activar
   * animaciones visuales que indican al usuario que la información se ha actualizado.
   * 
   * @dependencies [servingQueue.length, waitingQueue.length, completeQueue.length]
   * @since 2.0.0
   */
  useEffect(() => {
    handleDataTransition();
  }, [servingQueue.length, waitingQueue.length, completeQueue.length]);

  /**
   * Efecto para detectar nuevos turnos llamados y reproducir notificaciones de audio.
   * 
   * Este efecto se ejecuta cada vez que cambia la cola de turnos servidos o el estado del audio.
   * Detecta turnos que han sido recién llamados comparando con una referencia de turnos previos
   * y reproduce el anuncio de audio correspondiente.
   * 
   * ## Lógica del proceso:
   * 1. Crea un Set con los IDs de turnos actualmente siendo servidos
   * 2. Filtra turnos que no estaban en la referencia previa y tienen `calledAt`
   * 3. Para cada turno nuevo llamado, reproduce audio con prioridad según tiempo de espera
   * 4. Actualiza la referencia de turnos previos para la próxima ejecución
   * 
   * @dependencies [servingQueue, audioEnabled, playTurnCall, getAppointmentDetails, getServicePointName]
   */
  useEffect(() => {
    if (!audioEnabled) return;

    const currentServingTurns = new Set(servingQueue.map(entry => entry.id));
    
    // Encontrar turnos recién llamados
    const newlyCalledTurns = servingQueue.filter(entry => 
      !previousServingTurns.current.has(entry.id) && entry.calledAt
    );

    // Reproducir audio para cada turno nuevo llamado
    newlyCalledTurns.forEach(async (entry) => {
      const servicePointName = getServicePointNameById(entry.servicePointId);
      const confirmationCode = entry.confirmationCode || entry.appointmentId.toString();
      const priority = getTurnPriority(entry.createdAt);
      
      await playTurnCall(confirmationCode, servicePointName, priority);
    });

    // Actualizar la referencia de turnos anteriores
    previousServingTurns.current = currentServingTurns;
  }, [servingQueue, audioEnabled, playTurnCall]);

  /**
   * Maneja el toggle (activar/desactivar) del sistema de audio.
   * 
   * Alterna el estado local de audio y sincroniza con el sistema de audio global
   * para asegurar consistencia en toda la aplicación.
   */
  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    setEnabled(newState);
  };

  /**
   * Efecto para manejar eventos de teclado y controles de pantalla completa.
   * 
   * ## Funcionalidades:
   * - **F11**: Alterna entre modo pantalla completa y normal
   * - **Cualquier tecla en fullscreen**: Muestra los controles temporalmente
   * 
   * Se configura y limpia automáticamente al montar/desmontar el componente.
   * 
   * @dependencies [isFullscreen]
   */
  useEffect(() => {
    /**
     * Maneja los eventos de presión de teclas.
     * 
     * @param event - Evento de teclado del navegador
     */
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
      // Mostrar controles al presionar cualquier tecla en pantalla completa
      if (isFullscreen) {
        setShowControls(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen]);

  /**
   * Efecto para auto-ocultar controles en modo pantalla completa.
   * 
   * ## Comportamiento:
   * - **Timeout**: Oculta controles después de 3 segundos de inactividad
   * - **Movimiento de mouse**: Muestra controles automáticamente
   * - **Solo en fullscreen**: El comportamiento se activa únicamente en pantalla completa
   * 
   * Limpia listeners y timeouts automáticamente para prevenir memory leaks.
   * 
   * @dependencies [isFullscreen, showControls]
   */
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isFullscreen && showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    /**
     * Maneja el movimiento del mouse para mostrar controles.
     * Solo activo cuando está en modo pantalla completa.
     */
    const handleMouseMove = () => {
      if (isFullscreen) {
        setShowControls(true);
      }
    };

    if (isFullscreen) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isFullscreen, showControls]);

  /**
   * Efecto para refrescar datos automáticamente cada 15 segundos.
   * 
   * Implementa un intervalo de actualización más espaciado para reducir la carga
   * del servidor y mejorar la experiencia visual con transiciones suaves.
   * Los hooks useQuery configurados con `refetchInterval` se encargan de 
   * actualizar los datos automáticamente.
   * 
   * @dependencies []
   * @since 2.0.0
   */
  useEffect(() => {
    // Marcar como refrescando al inicio del intervalo
    const interval = setInterval(() => {
      setIsDataRefreshing(true);
      
      // Simular el tiempo de carga y luego quitar el estado de refreshing
      setTimeout(() => {
        setIsDataRefreshing(false);
      }, 1000);
    }, 15000); // Cambiado de 5000 a 15000 (15 segundos)

    return () => clearInterval(interval);
  }, []);

  /**
   * Efecto para el scroll automático de la sección "Atendiendo Actualmente".
   * 
   * Si hay más de 4 turnos siendo atendidos, inicia un scroll automático que
   * rota cada 8 segundos para mostrar diferentes grupos de turnos con
   * transiciones más suaves y tiempo adecuado para lectura.
   * 
   * @dependencies [servingQueue.length]
   * @since 2.0.0
   */
  useEffect(() => {
    // Obtener todos los turnos servidos agrupados
    const allServingEntries = Object.values(servingByServicePoint).flat();
    
    if (allServingEntries.length <= 4) {
      setServingScrollIndex(0);
      return;
    }

    const scrollInterval = setInterval(() => {
      setServingScrollIndex(prev => {
        const maxIndex = Math.ceil(allServingEntries.length / 4) - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 8000); // Cambiado de 3000 a 8000 (8 segundos)

    return () => clearInterval(scrollInterval);
  }, [servingQueue.length]);

  /**
   * Efecto para el scroll automático de la sección "Cola de Espera".
   * 
   * Si hay más de 6 turnos en espera, inicia un scroll automático que
   * rota cada 8 segundos para mostrar diferentes grupos de turnos con
   * transiciones más suaves y tiempo adecuado para lectura.
   * 
   * @dependencies [waitingQueue.length]
   * @since 2.0.0
   */
  useEffect(() => {
    if (waitingQueue.length <= 6) {
      setWaitingScrollIndex(0);
      return;
    }

    const scrollInterval = setInterval(() => {
      setWaitingScrollIndex(prev => {
        const maxIndex = Math.ceil(waitingQueue.length / 6) - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 8000); // Cambiado de 3000 a 8000 (8 segundos)

    return () => clearInterval(scrollInterval);
  }, [waitingQueue.length]);

  // Mostrar pantalla de carga mientras se obtienen los datos
  if (queueLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Monitor className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  /**
   * ## Estructura del componente renderizado:
   * 
   * ### 📱 Layout Principal
   * - Container principal con padding responsive según modo pantalla completa
   * - Espaciado dinámico que se ajusta al estado de fullscreen
   * 
   * ### 🎛️ Header con Controles
   * - Título principal con icono y tamaño escalable
   * - Fecha y hora actual con actualización en tiempo real  
   * - Botones de control (audio y pantalla completa) con auto-hide
   * 
   * ### 📊 Tarjetas de Resumen
   * - Grid responsive de 3 columnas con estadísticas clave
   * - Colores diferenciados: verde (sirviendo), amarillo (esperando), azul (completados)
   * - Números grandes para fácil lectura a distancia
   * 
   * ### 📋 Panel Principal Dividido
   * - **Lado izquierdo**: Turnos siendo atendidos agrupados por punto de servicio
   * - **Lado derecho**: Cola de espera ordenada con posiciones numeradas
   * - Scroll automático para listas largas con altura máxima definida
   * 
   * ### 🎨 Estados Visuales
   * - Alertas destacadas para turnos llamados con colores primarios
   * - Badges informativos con timestamps de acciones
   * - Estados vacíos con iconografía y mensajes descriptivos
   * - Transiciones suaves y hover effects para mejor UX
   */
  return (    <div className={`min-h-screen bg-background ${isFullscreen ? 'p-6' : 'p-4'}`}>
      <div className={`space-y-6 ${isFullscreen ? 'space-y-8' : ''}`}>
        
        {/* Header con controles y título principal */}
        <div className="text-center space-y-2 relative">
          
          {/* 
            Botones de control con auto-hide en pantalla completa.
            Los controles se desvanecen después de 3 segundos de inactividad
            pero reaparecen con movimiento de mouse o teclas.
          */}
          <div className={`absolute right-0 top-0 transition-opacity duration-300 flex gap-2 ${
            isFullscreen && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>            {/* Botón de control de audio con indicador visual */}
            <Button
              onClick={toggleAudio}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-background/80 backdrop-blur-sm"
              title={audioEnabled ? t('visualizer.disableAudio') : t('visualizer.enableAudio')}
            >
              {audioEnabled ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  {t('visualizer.audio')}
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  {t('visualizer.audio')}
                </>
              )}
            </Button>
            
            {/* Botón de pantalla completa con estado dinámico */}
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-background/80 backdrop-blur-sm"
              title={`${t('visualizer.pressF11')} (F11)`}
            >
              {isFullscreen ? (
                <>
                  <Minimize className="h-4 w-4" />
                  {t('visualizer.exitFullscreen')}
                </>
              ) : (
                <>
                  <Maximize className="h-4 w-4" />
                  {t('visualizer.enterFullscreen')}
                </>
              )}
            </Button>
          </div>
          
          {/* Título principal con escalado responsive */}
          <h1 className={`font-bold flex items-center justify-center gap-3 ${isFullscreen ? 'text-5xl' : 'text-4xl'}`}>
            <Eye className={`text-primary ${isFullscreen ? 'h-12 w-12' : 'h-10 w-10'}`} />
            {t('visualizer.dashboard')}
          </h1>
          
          {/* Subtítulo con fecha y hora actual */}
          <p className={`text-muted-foreground ${isFullscreen ? 'text-xl' : 'text-lg'}`}>
            {t('visualizer.queueStatus')} • {formatFullDateTime(new Date())}
            {isDataRefreshing && (
              <span className="ml-2 text-primary animate-pulse">
                • {t('visualizer.refreshing')}
              </span>
            )}
          </p>
          
          {/* Indicador de última actualización */}
          <p className={`text-muted-foreground/70 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
            {t('visualizer.lastUpdated')}: {formatTime(lastUpdateTime)}
          </p>
        </div>
        
        {/* Tarjetas de resumen con estadísticas principales */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${isFullscreen ? 'gap-6' : 'gap-4'} ${getDataTransitionClass()}`}>
          
          {/* Tarjeta: Actualmente Sirviendo */}
          <Card className="bg-green-50 border-green-200 hover:shadow-lg transition-all duration-500 ease-in-out transform hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className={`text-green-800 flex items-center gap-2 ${isFullscreen ? 'text-lg' : ''}`}>
                <Bell className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'}`} />
                {t('visualizer.currentlyServing')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-bold text-green-700 transition-all duration-700 ease-out ${isFullscreen ? 'text-5xl' : 'text-3xl'}`}>
                {servingQueue.length}
              </div>
            </CardContent>
          </Card>
          
          {/* Tarjeta: Cola de Espera */}
          <Card className="bg-yellow-50 border-yellow-200 hover:shadow-lg transition-all duration-500 ease-in-out transform hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className={`text-yellow-800 flex items-center gap-2 ${isFullscreen ? 'text-lg' : ''}`}>
                <Users className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'}`} />
                {t('visualizer.waitingQueue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-bold text-yellow-700 transition-all duration-700 ease-out ${isFullscreen ? 'text-5xl' : 'text-3xl'}`}>
                {waitingQueue.length}
              </div>
            </CardContent>
          </Card>
          
          {/* Tarjeta: Completados Hoy */}
          <Card className="bg-blue-50 border-blue-200 hover:shadow-lg transition-all duration-500 ease-in-out transform hover:scale-105">
            <CardHeader className="pb-3">
              <CardTitle className={`text-blue-800 flex items-center gap-2 ${isFullscreen ? 'text-lg' : ''}`}>
                <Clock className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'}`} />
                {t('common.completed')} {t('common.today')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-bold text-blue-700 transition-all duration-700 ease-out ${isFullscreen ? 'text-5xl' : 'text-3xl'}`}>
                {completeQueue.length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Panel principal dividido en dos columnas */}
        <div className={`grid grid-cols-1 xl:grid-cols-2 ${isFullscreen ? 'gap-8' : 'gap-6'} ${getDataTransitionClass()}`}>
          
          {/* Panel izquierdo: Turnos siendo atendidos */}
          <Card className={`hover:shadow-lg transition-all duration-300 ease-in-out ${isFullscreen ? 'h-[650px]' : 'h-[550px]'} flex flex-col`}>
            <CardHeader className="flex-shrink-0">
              <CardTitle className={`text-center flex items-center justify-center gap-2 ${isFullscreen ? 'text-3xl' : 'text-2xl'}`}>
                <Bell className={`${isFullscreen ? 'h-8 w-8' : 'h-6 w-6'}`} />
                {t('visualizer.currentlyServing')}
                {servingQueue.length > 4 && (
                  <Badge variant="secondary" className="ml-2 animate-in slide-in-from-left-2 duration-500">
                    {Math.floor(servingScrollIndex * 4) + 1}-{Math.min((servingScrollIndex + 1) * 4, servingQueue.length)} / {servingQueue.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={`flex-1 flex flex-col justify-start ${isFullscreen ? 'space-y-4' : 'space-y-3'}`}>
              
              {/* Renderizado condicional: Turnos activos o mensaje vacío */}
              {Object.entries(getVisibleServingByServicePoint()).length > 0 ? (
                // Mapeo de turnos agrupados por punto de servicio (solo elementos visibles)
                Object.entries(getVisibleServingByServicePoint()).map(([servicePointName, entries]) => (
                  <div key={servicePointName} className={`${isFullscreen ? 'space-y-3' : 'space-y-2'} animate-in slide-in-from-bottom-3 duration-700 ease-out`}>
                    {/* Encabezado del punto de servicio */}
                    <h3 className={`font-semibold border-b pb-1 ${isFullscreen ? 'text-xl' : 'text-lg'}`}>
                      {servicePointName}
                    </h3>
                    
                    {/* Lista de turnos para este punto de servicio */}
                    {entries.map((entry, index) => (
                      <Alert 
                        key={entry.id} 
                        className={`bg-green-600 text-white border-green-700 transform transition-all duration-700 ease-in-out hover:scale-105 animate-in slide-in-from-left-3 ${isFullscreen ? 'py-3 px-4' : 'py-2 px-3'}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <Bell className={`${isFullscreen ? 'h-4 w-4' : 'h-3 w-3'}`} />
                        <AlertTitle className={`font-bold ${isFullscreen ? 'text-lg' : 'text-base'}`}>
                          {t('visualizer.turnNumber')} #{entry.confirmationCode || entry.appointmentId}
                        </AlertTitle>
                        <AlertDescription className="text-white/90">
                          <div className="flex items-center justify-between">
                            <span className={`${isFullscreen ? 'text-sm' : 'text-xs'}`}>{t('visualizer.servicePoint')}: {servicePointName}</span>
                            {entry.calledAt && (
                              <Badge variant="secondary" className={`ml-2 animate-pulse ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>
                                {t('visualizer.called')}: {formatTime(new Date(entry.calledAt))}
                              </Badge>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ))
              ) : (
                // Estado vacío cuando no hay turnos siendo atendidos
                <div className="flex-1 flex items-center justify-center text-muted-foreground animate-in fade-in-50 duration-500">
                  <div className="text-center">
                    <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p className="text-lg">{t('visualizer.noCurrentlyServing')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Panel derecho: Cola de espera */}
          <Card className={`hover:shadow-lg transition-all duration-300 ease-in-out ${isFullscreen ? 'h-[650px]' : 'h-[550px]'} flex flex-col`}>
            <CardHeader className="flex-shrink-0">
              <CardTitle className={`text-center flex items-center justify-center gap-2 ${isFullscreen ? 'text-3xl' : 'text-2xl'}`}>
                <Users className={`${isFullscreen ? 'h-8 w-8' : 'h-6 w-6'}`} />
                {t('visualizer.waitingQueue')} ({waitingQueue.length})
                {waitingQueue.length > 6 && (
                  <Badge variant="secondary" className="ml-2 animate-in slide-in-from-right-2 duration-500">
                    {waitingScrollIndex * 6 + 1}-{Math.min((waitingScrollIndex + 1) * 6, waitingQueue.length)} / {waitingQueue.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className={`flex-1 flex flex-col justify-start ${isFullscreen ? 'space-y-3' : 'space-y-2'} ${getDataTransitionClass()}`}>
                
                {/* Renderizado condicional: Lista de espera o mensaje vacío */}
                {waitingQueue.length > 0 ? (
                  // Mapeo de turnos en espera con numeración (solo elementos visibles)
                  getVisibleWaitingEntries().map((entry, index) => {
                    const globalIndex = waitingScrollIndex * 6 + index;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between border rounded-lg bg-yellow-100 hover:bg-yellow-200/70 border-yellow-300 transform transition-all duration-700 ease-in-out hover:scale-105 animate-in slide-in-from-right-3 ${isFullscreen ? 'p-3' : 'p-2'}`}
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Número de posición en la cola */}
                          <div className={`rounded-full bg-yellow-600 text-white flex items-center justify-center font-semibold transition-all duration-500 ease-in-out ${isFullscreen ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs'}`}>
                            {globalIndex + 1}
                          </div>
                          
                          {/* Información del turno */}
                          <div>
                            <div className={`font-semibold ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                              {t('visualizer.turnNumber')} #{entry.confirmationCode || entry.appointmentId}
                            </div>
                            <div className={`text-muted-foreground ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                              {getServicePointNameById(entry.servicePointId)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Estado y timestamp */}
                        <div className="text-right">
                          <Badge variant="outline" className={`transition-all duration-300 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>
                            {t('queue.waiting')}
                          </Badge>
                          <div className={`text-muted-foreground mt-1 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>
                            {formatTime(new Date(entry.createdAt))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Estado vacío cuando no hay turnos esperando
                  <div className="flex-1 flex items-center justify-center text-muted-foreground animate-in fade-in-50 duration-500">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                      <p className="text-lg">{t('visualizer.noWaitingTurns')}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>  );
}