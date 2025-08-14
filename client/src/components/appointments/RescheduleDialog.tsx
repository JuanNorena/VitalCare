import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, AlertCircle, Shield, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { Appointment } from '@db/schema';

/**
 * Propiedades del componente RescheduleDialog.
 * 
 * @interface RescheduleDialogProps
 * @description Define las propiedades requeridas para el diálogo de reprogramación de citas.
 * 
 * @property {boolean} open - Estado que controla si el diálogo está abierto o cerrado
 * @property {function} onOpenChange - Función callback que se ejecuta cuando cambia el estado del diálogo
 * @property {Appointment | null} appointment - Objeto de la cita a reprogramar o null si no hay cita seleccionada
 * @property {function} onReschedule - Función callback que se ejecuta cuando se confirma la reprogramación
 * @property {boolean} [isLoading] - Estado opcional que indica si se está procesando la reprogramación
 * @property {object} [user] - Información opcional del usuario logueado para mostrar privilegios de admin
 * 
 * @since 1.0.0
 * @version 1.0.0
 */
interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onReschedule: (params: { appointmentId: number; newScheduledAt: string; reason?: string }) => Promise<void>;
  isLoading?: boolean;
  user?: { role?: string } | null;
}

/**
 * Componente de diálogo para reprogramar citas de servicios.
 * 
 * @component
 * @description Este componente renderiza un diálogo modal completo para reprogramar citas existentes.
 * Proporciona una interfaz intuitiva que permite a los usuarios:
 * - Seleccionar una nueva fecha válida basada en los horarios configurados del servicio
 * - Elegir una nueva hora entre los slots disponibles del servicio
 * - Agregar un motivo opcional para la reprogramación
 * - Validar automáticamente disponibilidad de horarios
 * - Mostrar retroalimentación visual durante el proceso
 * 
 * El componente integra validaciones inteligentes que:
 * - Respetan los horarios configurados por cada servicio
 * - Previenen la selección de fechas pasadas
 * - Muestran días y horarios disponibles
 * - Validan la disponibilidad en tiempo real
 * 
 * @param {RescheduleDialogProps} props - Propiedades del componente
 * @param {boolean} props.open - Controla la visibilidad del diálogo
 * @param {function} props.onOpenChange - Callback para manejar cambios en el estado del diálogo
 * @param {Appointment | null} props.appointment - Datos de la cita a reprogramar
 * @param {function} props.onReschedule - Callback que se ejecuta al confirmar la reprogramación
 * @param {boolean} [props.isLoading] - Indica si se está procesando la reprogramación
 * 
 * @returns {JSX.Element | null} Elemento JSX del diálogo o null si no hay cita
 * 
 * @example
 * ```tsx
 * // Uso básico del componente
 * <RescheduleDialog
 *   open={isRescheduleOpen}
 *   onOpenChange={setIsRescheduleOpen}
 *   appointment={selectedAppointment}
 *   onReschedule={handleReschedule}
 *   isLoading={isProcessing}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Integración completa con manejo de estado
 * const [showReschedule, setShowReschedule] = useState(false);
 * const [currentAppointment, setCurrentAppointment] = useState(null);
 * const [isProcessing, setIsProcessing] = useState(false);
 * 
 * const handleRescheduleSubmit = async (params) => {
 *   setIsProcessing(true);
 *   try {
 *     await rescheduleAppointment(params);
 *     setShowReschedule(false);
 *     toast.success('Cita reprogramada exitosamente');
 *   } catch (error) {
 *     toast.error('Error al reprogramar la cita');
 *   } finally {
 *     setIsProcessing(false);
 *   }
 * };
 * 
 * return (
 *   <RescheduleDialog
 *     open={showReschedule}
 *     onOpenChange={setShowReschedule}
 *     appointment={currentAppointment}
 *     onReschedule={handleRescheduleSubmit}
 *     isLoading={isProcessing}
 *   />
 * );
 * ```
 * 
 * @remarks
 * - El componente obtiene automáticamente los horarios configurados del servicio
 * - Implementa validación en tiempo real de fechas y horarios
 * - Maneja estados de carga y error de forma elegante
 * - Incluye localización completa para fechas y textos
 * - Genera slots de tiempo en intervalos de 30 minutos
 * - Limpia automáticamente el formulario al abrir/cerrar
 * - Optimizado para dispositivos móviles con diseño responsivo
 * 
 * @dependencies
 * - `@tanstack/react-query` - Para obtener horarios del servicio
 * - `@/components/ui/*` - Componentes base de la interfaz
 * - `react-i18next` - Para soporte de internacionalización
 * - `date-fns` - Para formateo y manipulación de fechas
 * - `lucide-react` - Para iconos de la interfaz
 * 
 * @since 1.0.0
 * @version 1.2.0
 * @lastModified 2025-07-03
 */
export function RescheduleDialog({
  open,
  onOpenChange,
  appointment,
  onReschedule,
  isLoading = false,
  user
}: RescheduleDialogProps) {
  const { t, i18n } = useTranslation();
  
  // Obtener configuraciones de la sede - solo si hay appointment y branchId válido
  const { data: branchSettingsResponse } = useQuery({
    queryKey: ["branch-settings", appointment?.branchId],
    queryFn: async () => {
      if (!appointment?.branchId) return null;
      const response = await fetch(`/api/branches/${appointment.branchId}/settings`);
      if (!response.ok) throw new Error('Failed to fetch branch settings');
      return response.json();
    },
    enabled: !!appointment?.branchId && open
  });
  
  const branchSettings = branchSettingsResponse?.settings;
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  /**
   * Hook para obtener los horarios configurados del servicio asociado a la cita.
   * 
   * @description Realiza una consulta al endpoint `/api/services/:id/schedules` para obtener
   * los horarios configurados del servicio. La consulta se activa únicamente cuando
   * el diálogo está abierto y existe un ID de servicio válido.
   * 
   * @returns {Object} Datos de los horarios del servicio con configuraciones de días y horas
   */
  const { data: schedules } = useQuery({
    queryKey: ['/api/services', appointment?.serviceId, 'schedules'],
    queryFn: async () => {
      if (!appointment?.serviceId) return [];
      const response = await fetch(`/api/services/${appointment.serviceId}/schedules`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json();
    },
    enabled: !!appointment?.serviceId && open
  });

  /**
   * Efecto para limpiar el formulario cuando se abre o cierra el diálogo.
   * 
   * @description Resetea todos los campos del formulario a sus valores por defecto
   * cuando el diálogo se abre, garantizando un estado limpio para cada nueva reprogramación.
   * 
   * @since 1.0.0
   */
  useEffect(() => {
    if (open) {
      setSelectedDate(undefined);
      setSelectedTime('');
      setReason('');
      setErrors({});
      setAvailableSlots([]);
    }
  }, [open]);

  /**
   * Efecto para calcular y generar los horarios disponibles basados en la fecha seleccionada.
   * 
   * @description Este efecto se ejecuta cuando cambia la fecha seleccionada o los horarios del servicio.
   * Realiza las siguientes operaciones:
   * 1. Filtra los horarios del servicio según el día de la semana seleccionado
   * 2. Genera slots de tiempo en intervalos de 30 minutos dentro del rango configurado
   * 3. Elimina duplicados y ordena los horarios
   * 4. Limpia la hora seleccionada si ya no está disponible
   * 
   * @example
   * ```typescript
   * // Si el servicio tiene horarios: Lunes 09:00-17:00
   * // Y se selecciona un lunes, genera: ['09:00', '09:30', '10:00', ..., '16:30']
   * ```
   * 
   * @since 1.0.0
   */
  useEffect(() => {
    if (selectedDate && schedules) {
      const dayOfWeek = selectedDate.getDay();
      const daySchedules = schedules.filter((schedule: any) => schedule.dayOfWeek === dayOfWeek);
      
      if (daySchedules.length === 0) {
        setAvailableSlots([]);
        return;
      }

      // Generar slots de tiempo basados en los horarios del servicio
      const slots: string[] = [];
      daySchedules.forEach((schedule: any) => {
        const startTime = schedule.startTime; // formato "HH:MM"
        const endTime = schedule.endTime;
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          slots.push(timeString);
          
          // Incrementar 30 minutos
          currentMinute += 30;
          if (currentMinute >= 60) {
            currentMinute -= 60;
            currentHour += 1;
          }
        }
      });

      // Eliminar duplicados y ordenar
      const uniqueSlots = Array.from(new Set(slots)).sort();
      setAvailableSlots(uniqueSlots);
      
      // Limpiar hora seleccionada si no está disponible
      if (selectedTime && !uniqueSlots.includes(selectedTime)) {
        setSelectedTime('');
      }
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, schedules, selectedTime]);

  /**
   * Calcula el tiempo mínimo de reprogramación basado en la configuración dinámica de la sede y el rol del usuario.
   * 
   * @function getMinRescheduleHours
   * @description Determina las horas mínimas de anticipación requeridas para reprogramar
   * una cita, considerando la configuración específica de la sede (rescheduleTimeLimit) y privilegios de admin.
   * Esta configuración es dinámica y se puede modificar desde el apartado de administración.
   * 
   * @returns {number} Número de horas mínimas de anticipación
   * 
   * @since 1.2.0
   */
  const getMinRescheduleHours = (): number => {
    // Los administradores tienen privilegios especiales - solo 2 horas mínimas
    if (user?.role === 'admin') {
      return 2;
    }
    
    // Para usuarios regulares: usar configuración dinámica de sede
    // El campo rescheduleTimeLimit se obtiene directamente de la configuración de la sede
    if (branchSettings?.rescheduleTimeLimit && typeof branchSettings.rescheduleTimeLimit === 'number') {
      return branchSettings.rescheduleTimeLimit;
    }
    
    // Valor por defecto del sistema si no hay configuración (24 horas)
    return 24;
  };

  /**
   * Valida todos los campos del formulario antes de permitir el envío.
   * 
   * @function validateForm
   * @description Realiza validaciones completas del formulario incluyendo:
   * - Verificación de fecha seleccionada y que sea futura
   * - Verificación de hora seleccionada y que esté disponible
   * - Validación de disponibilidad de horarios para la fecha
   * - Validación de tiempo mínimo de reprogramación según configuración de sede
   * - Actualización del estado de errores para mostrar mensajes al usuario
   * 
   * @returns {boolean} true si todas las validaciones pasan, false en caso contrario
   * 
   * @example
   * ```typescript
   * if (validateForm()) {
   *   // Proceder con la reprogramación
   * } else {
   *   // Mostrar errores al usuario
   * }
   * ```
   * 
   * @since 1.0.0
   * @version 1.2.0
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const now = new Date();
    const locale = i18n.language === 'es' ? es : undefined;

    // Calcular fecha mínima basada en configuración de sede
    const minRescheduleHours = getMinRescheduleHours();
    const minRescheduleDate = new Date(now.getTime() + (minRescheduleHours * 60 * 60 * 1000));

    if (!selectedDate) {
      newErrors.date = t('appointments.rescheduleDialog.selectDate');
    } else {
      // CORRECCIÓN: Combinar fecha y hora seleccionadas para validación correcta
      let selectedDateTimeForValidation = new Date(selectedDate);
      
      // Si hay hora seleccionada, combinarla con la fecha
      if (selectedTime) {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        selectedDateTimeForValidation.setHours(hours, minutes, 0, 0);
      } else {
        // Si no hay hora, usar el final del día para la validación de fecha
        selectedDateTimeForValidation.setHours(23, 59, 59, 999);
      }
      
      // Verificar si la fecha es en el pasado
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDateTime < today) {
        // Fecha en el pasado - siempre usar configuración de sede
        newErrors.date = t('appointments.rescheduleDialog.invalidDatePast', {
          minimumDate: format(minRescheduleDate, 'PPP', { locale }),
          minimumTime: format(minRescheduleDate, 'HH:mm')
        });
      } else if (selectedDateTime.getTime() === today.getTime()) {
        // Es hoy - verificar si la fecha + hora seleccionada respeta el tiempo mínimo de la sede
        if (selectedDateTimeForValidation < minRescheduleDate) {
          newErrors.date = t('appointments.rescheduleDialog.invalidDateToday', {
            minimumDate: format(minRescheduleDate, 'PPP', { locale }),
            minimumTime: format(minRescheduleDate, 'HH:mm')
          });
        }
      } else if (selectedDateTimeForValidation < minRescheduleDate) {
        // Fecha futura pero la combinación fecha+hora no respeta el tiempo mínimo de la sede
        newErrors.date = t('appointments.rescheduleDialog.invalidDate', {
          currentDate: format(now, 'PPP', { locale }),
          currentTime: format(now, 'HH:mm'),
          minimumDate: format(minRescheduleDate, 'PPP', { locale }),
          minimumTime: format(minRescheduleDate, 'HH:mm')
        });
      }
    }

    if (!selectedTime) {
      newErrors.time = t('appointments.rescheduleDialog.selectTime');
    } else if (!availableSlots.includes(selectedTime)) {
      newErrors.time = t('appointments.rescheduleDialog.serviceNotAvailable');
    }

    // Verificar que hay horarios disponibles para la fecha seleccionada
    if (selectedDate && availableSlots.length === 0) {
      // Verificar si es porque no hay horarios configurados para ese día
      const dayOfWeek = selectedDate.getDay();
      const hasSchedulesForDay = schedules?.some((schedule: any) => 
        schedule.dayOfWeek === dayOfWeek && schedule.isActive
      );
      
      if (!hasSchedulesForDay) {
        newErrors.date = t('appointments.rescheduleDialog.noAvailableSlotsDetail');
      } else {
        newErrors.date = t('appointments.rescheduleDialog.noAvailableSlots');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Maneja el envío del formulario de reprogramación.
   * 
   * @function handleSubmit
   * @description Procesa la solicitud de reprogramación realizando las siguientes acciones:
   * 1. Previene el comportamiento por defecto del formulario
   * 2. Valida todos los campos del formulario
   * 3. Combina la fecha y hora seleccionadas en un objeto Date
   * 4. Ejecuta la función de reprogramación con los parámetros correctos
   * 5. Maneja errores de forma elegante
   * 
   * @param {React.FormEvent} e - Evento del formulario
   * @returns {Promise<void>} Promise que se resuelve cuando la operación completa
   * 
   * @example
   * ```typescript
   * // Los parámetros enviados incluyen:
   * {
   *   appointmentId: 123,
   *   newScheduledAt: "2025-07-15T10:30:00.000Z",
   *   reason: "Cambio de horario solicitado por el cliente"
   * }
   * ```
   * 
   * @since 1.0.0
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !appointment || !selectedDate) {
      return;
    }

    try {
      // Combinar fecha y hora seleccionadas
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const newScheduledAt = new Date(selectedDate);
      newScheduledAt.setHours(hours, minutes, 0, 0);

      await onReschedule({
        appointmentId: appointment.id,
        newScheduledAt: newScheduledAt.toISOString(),
        reason: reason.trim() || undefined
      });

      // El cierre del diálogo se maneja en el componente padre
    } catch (error) {
      // El error se maneja en el hook useAppointments
      console.error('Error rescheduling appointment:', error);
    }
  };

  // Filtrar fechas - usar configuración de sede para determinar fechas mínimas
  const disablePastDates = (date: Date) => {
    const now = new Date();
    const minRescheduleHours = getMinRescheduleHours();
    const minRescheduleDate = new Date(now.getTime() + (minRescheduleHours * 60 * 60 * 1000));
    
    // Deshabilitar fechas que no respetan el tiempo mínimo según configuración de sede
    const dateToCheck = new Date(date);
    dateToCheck.setHours(23, 59, 59, 999); // Usar el final del día para la comparación
    
    if (dateToCheck < minRescheduleDate) {
      return true;
    }

    // Si no hay horarios del servicio cargados, permitir fechas que respeten el tiempo mínimo
    if (!schedules || schedules.length === 0) {
      return false;
    }

    // Verificar si hay horarios configurados para este día de la semana
    const dayOfWeek = date.getDay();
    const hasSchedulesForDay = schedules.some((schedule: any) => 
      schedule.dayOfWeek === dayOfWeek && schedule.isActive
    );

    return !hasSchedulesForDay;
  };

  if (!appointment) {
    return null;
  }

  const currentDate = new Date(appointment.scheduledAt);
  const locale = i18n.language === 'es' ? es : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-5 w-5" />
            {user?.role === 'admin' && (
              <Shield className="h-4 w-4 text-amber-500" />
            )}
            {t('appointments.rescheduleDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t('appointments.rescheduleDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alert especial para administradores */}
          {user?.role === 'admin' && (
            <Alert className="border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                {t('appointments.adminPrivileges.rescheduleMessage')}
              </AlertDescription>
            </Alert>
          )}

          {/* Información sobre tiempo mínimo de reprogramación para usuarios regulares */}
          {user?.role !== 'admin' && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm space-y-1">
                <p>{t('appointments.rescheduleDialog.minimumRescheduleNotice', {
                  hours: getMinRescheduleHours()
                })}</p>
                <p className="font-medium">{t('appointments.rescheduleDialog.minimumDateAvailable', {
                  minimumDate: format(new Date(Date.now() + getMinRescheduleHours() * 60 * 60 * 1000), 'PPP', { locale }),
                  minimumTime: format(new Date(Date.now() + getMinRescheduleHours() * 60 * 60 * 1000), 'HH:mm')
                })}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Información de la cita actual */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm">
                <p className="font-medium mb-1">{t('appointments.rescheduleHistory.originalDate')}:</p>
                <p>{format(currentDate, 'PPP', { locale })} - {format(currentDate, 'HH:mm')}</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Selección de nueva fecha */}
          <div className="space-y-2">
            <Label htmlFor="date">{t('appointments.rescheduleDialog.newDate')}</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    errors.date && "border-destructive"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'PPP', { locale })
                  ) : (
                    t('appointments.rescheduleDialog.selectDate')
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setShowCalendar(false);
                    if (errors.date) {
                      setErrors(prev => ({ ...prev, date: '' }));
                    }
                  }}
                  disabled={disablePastDates}
                  locale={locale}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
            {schedules && schedules.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">{t('appointments.rescheduleDialog.availableDays')}:</p>
                <div className="flex flex-wrap gap-1">
                  {schedules.map((schedule: any) => {
                    const dayNames = [
                      t('common.days.sunday'),
                      t('common.days.monday'), 
                      t('common.days.tuesday'),
                      t('common.days.wednesday'),
                      t('common.days.thursday'),
                      t('common.days.friday'),
                      t('common.days.saturday')
                    ];
                    return (
                      <span key={schedule.id} className="bg-muted px-2 py-1 rounded text-xs">
                        {dayNames[schedule.dayOfWeek]} ({schedule.startTime} - {schedule.endTime})
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selección de nueva hora */}
          <div className="space-y-2">
            <Label htmlFor="time">{t('appointments.rescheduleDialog.newTime')}</Label>
            <Select
              value={selectedTime}
              onValueChange={(value) => {
                setSelectedTime(value);
                if (errors.time) {
                  setErrors(prev => ({ ...prev, time: '' }));
                }
              }}
              disabled={!selectedDate || availableSlots.length === 0}
            >
              <SelectTrigger className={cn(errors.time && "border-destructive")}>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <SelectValue 
                    placeholder={
                      !selectedDate 
                        ? t('appointments.rescheduleDialog.selectDate')
                        : availableSlots.length === 0
                        ? t('appointments.rescheduleDialog.noAvailableSlots')
                        : t('appointments.rescheduleDialog.selectTime')
                    } 
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time && (
              <p className="text-sm text-destructive">{errors.time}</p>
            )}
            {selectedDate && availableSlots.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t('appointments.rescheduleDialog.noAvailableSlots')}
              </p>
            )}
          </div>

          {/* Motivo opcional */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              {t('appointments.rescheduleDialog.reason')}
            </Label>
            <Textarea
              id="reason"
              placeholder={t('appointments.rescheduleDialog.reasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {t('appointments.rescheduleDialog.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  {t('appointments.rescheduleDialog.loading')}
                </div>
              ) : (
                t('appointments.rescheduleDialog.confirm')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RescheduleDialog;
