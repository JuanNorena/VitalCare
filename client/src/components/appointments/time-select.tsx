import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import type { Schedule, Service } from "@db/schema";
import { format, startOfDay, isSameDay, addMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslation } from "react-i18next";

/**
 * Propiedades del componente TimeSelect
 * 
 * @interface TimeSelectProps
 */
interface TimeSelectProps {
  /** Array de horarios disponibles por día de la semana */
  schedules: Schedule[];
  /** Fecha seleccionada por el usuario, puede ser undefined si no ha seleccionado ninguna */
  selectedDate: Date | undefined;
  /** Hora seleccionada en formato HH:mm, null si no ha seleccionado ninguna */
  selectedTime: string | null;
  /** Servicio seleccionado que determina la duración de los intervalos de tiempo */
  selectedService: Service | null;
  /** Función callback para manejar la selección de fecha */
  onSelectDate: (date: Date | undefined) => void;
  /** Función callback para manejar la selección de hora */
  onSelectTime: (time: string) => void;
}

/**
 * Componente TimeSelect - Selector de Fecha y Hora para Citas
 * 
 * Este componente permite a los usuarios seleccionar una fecha y hora para sus citas,
 * basándose en los horarios disponibles y la duración del servicio seleccionado.
 * 
 * Características principales:
 * - Calendario interactivo con fechas habilitadas según horarios programados
 * - Deshabilita fechas pasadas y días sin horarios disponibles
 * - Genera franjas horarias automáticamente basadas en la duración del servicio
 * - Ajusta automáticamente el horario inicial para el día actual
 * - Interfaz responsive con diseño adaptativo
 * - Soporte completo para internacionalización (i18n)
 * 
 * @example
 * ```tsx
 * <TimeSelect
 *   schedules={schedules}
 *   selectedDate={selectedDate}
 *   selectedTime={selectedTime}
 *   selectedService={selectedService}
 *   onSelectDate={handleDateSelect}
 *   onSelectTime={handleTimeSelect}
 * />
 * ```
 * 
 * @param {TimeSelectProps} props - Propiedades del componente
 * @returns {JSX.Element} Elemento JSX que renderiza el selector de fecha y hora
 */
export function TimeSelect({
  schedules,
  selectedDate,
  selectedTime,
  selectedService,
  onSelectDate,
  onSelectTime,
}: TimeSelectProps) {
  const { t } = useTranslation();

  /**
   * Obtiene las franjas horarias disponibles para un día específico
   * 
   * Esta función calcula todas las franjas horarias disponibles para una fecha dada,
   * teniendo en cuenta:
   * - El horario programado para el día de la semana correspondiente
   * - La duración del servicio seleccionado
   * - Si es el día actual, ajusta el horario inicial para evitar horarios pasados
   * 
   * @param {Date} date - La fecha para la cual calcular las franjas horarias
   * @returns {string[]} Array de strings con las horas disponibles en formato HH:mm
   * 
   * @example
   * ```tsx
   * const times = getAvailableTimesForDay(new Date('2024-01-15'));
   * // Retorna: ['09:00', '09:30', '10:00', '10:30', ...]
   * ```
   */  const getAvailableTimesForDay = (date: Date) => {
    // Obtener el día de la semana (0 = domingo, 1 = lunes, etc.)
    const dayOfWeek = date.getDay();
    // Buscar el horario programado para este día de la semana
    const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek);

    // Si no hay horario programado o no hay servicio seleccionado, retornar array vacío
    if (!schedule || !selectedService) return [];

    const times: string[] = [];
    // Crear objetos Date para trabajar con las horas de inicio y fin
    let currentTime = new Date(`1970-01-01T${schedule.startTime}`);
    const endTime = new Date(`1970-01-01T${schedule.endTime}`);

    // Si es el día actual, ajustar la hora de inicio para evitar horarios pasados
    if (isSameDay(date, new Date())) {
      const now = new Date();
      const minutes = now.getMinutes();
      const serviceInterval = selectedService.duration || 5;
      // Redondear hacia arriba al siguiente intervalo válido
      const roundedMinutes = Math.ceil(minutes / serviceInterval) * serviceInterval;
      const startTime = addMinutes(new Date(now.setMinutes(0, 0, 0)), roundedMinutes);

      currentTime = new Date(`1970-01-01T${format(startTime, 'HH:mm')}`);
    }

    // Generar todas las franjas horarias disponibles
    const interval = selectedService.duration || 5;
    while (currentTime < endTime) {
      const serviceEndTime = addMinutes(currentTime, interval);
      // Solo agregar la franja si el servicio completo cabe dentro del horario
      if (serviceEndTime <= endTime) {
        times.push(format(currentTime, "HH:mm"));
      }
      currentTime = addMinutes(currentTime, interval);
    }

    return times;
  };
  // Calcular las franjas horarias disponibles para la fecha seleccionada
  const availableTimes = selectedDate ? getAvailableTimesForDay(selectedDate) : [];
  
  return (
    <div className="space-y-8">
      {/* Sección de Selector de Fecha */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">{t('appointments.timeSelection.dateTitle')}</h3>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            locale={es}
            className="border rounded-lg shadow-sm w-fit"
            disabled={(date) => {
              // Obtener el día de la semana para validar disponibilidad
              const dayOfWeek = date.getDay();
              // Verificar si la fecha es anterior al día actual
              const isBeforeToday = date < startOfDay(new Date());
              // Verificar si existe un horario programado para este día
              const hasSchedule = schedules.some(s => s.dayOfWeek === dayOfWeek);

              // Para el día actual, solo deshabilitar si no hay horario
              if (isSameDay(date, new Date())) {
                return !hasSchedule;
              }

              // Para otros días, deshabilitar si es fecha pasada o no hay horario
              return isBeforeToday || !hasSchedule;
            }}
          />
        </div>
      </div>

      {/* Sección de Selector de Hora - Solo se muestra si hay una fecha seleccionada */}
      {selectedDate && (
        <div className="space-y-4">
          {/* Cabecera de la sección de horarios */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{t('appointments.timeSelection.selectTimeSlot')}</h3>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
            </p>
          </div>
          
          {/* Mostrar franjas horarias disponibles o mensaje de no disponibilidad */}
          {availableTimes.length > 0 ? (
            // Grid responsivo de botones de horarios
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
              {availableTimes.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => onSelectTime(time)}
                  className={`w-full h-12 text-sm font-medium transition-all duration-200 ${
                    selectedTime === time 
                      ? 'bg-primary text-primary-foreground shadow-md transform scale-105' 
                      : 'hover:bg-muted hover:shadow-sm hover:scale-[1.02]'
                  }`}
                >
                  {time}
                </Button>
              ))}
            </div>
          ) : (
            // Mensaje cuando no hay horarios disponibles
            <div className="text-center py-8">
              <div className="bg-muted/30 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-muted-foreground">
                  {t('appointments.timeSelection.noAvailableSlots')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}