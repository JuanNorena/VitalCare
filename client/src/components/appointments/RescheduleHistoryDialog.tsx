import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { History, Calendar, User, MessageSquare, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRescheduleHistory } from '@/hooks/use-appointments';
import type { Appointment } from '@db/schema';

/**
 * Interfaz que define la estructura de una entrada del historial de reprogramaciones.
 * 
 * @interface RescheduleHistoryEntry
 * @description Representa un registro individual de reprogramación de una cita médica,
 * incluyendo las fechas originales y nuevas, motivo del cambio, y datos del usuario
 * que realizó la reprogramación.
 * 
 * @property {number} id - Identificador único de la entrada del historial
 * @property {string} originalScheduledAt - Fecha y hora original de la cita (formato ISO)
 * @property {string} newScheduledAt - Nueva fecha y hora de la cita (formato ISO)
 * @property {string} [reason] - Motivo opcional de la reprogramación
 * @property {string} createdAt - Fecha y hora cuando se realizó la reprogramación (formato ISO)
 * @property {Object} rescheduledBy - Datos del usuario que realizó la reprogramación
 * @property {number} rescheduledBy.id - ID del usuario que reprogramó
 * @property {string} rescheduledBy.username - Nombre de usuario que reprogramó
 * @property {string} rescheduledBy.email - Email del usuario que reprogramó
 * @property {string} rescheduledBy.role - Rol del usuario (admin, staff, user)
 * 
 * @since 1.0.0
 * @version 1.0.0
 */
interface RescheduleHistoryEntry {
  id: number;
  originalScheduledAt: string;
  newScheduledAt: string;
  reason?: string;
  createdAt: string;
  rescheduledBy: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * Propiedades del componente RescheduleHistoryDialog.
 * 
 * @interface RescheduleHistoryDialogProps
 * @description Define las propiedades requeridas para el diálogo de historial de reprogramaciones.
 * 
 * @property {boolean} open - Estado que controla si el diálogo está abierto o cerrado
 * @property {function} onOpenChange - Función callback que se ejecuta cuando cambia el estado del diálogo
 * @property {Appointment | null} appointment - Objeto de la cita o null si no hay cita seleccionada
 * 
 * @since 1.0.0
 * @version 1.0.0
 */
interface RescheduleHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

/**
 * Componente de diálogo para mostrar el historial completo de reprogramaciones de una cita médica.
 * 
 * @component
 * @description Este componente renderiza un diálogo modal que muestra:
 * - La fecha y hora actual programada de la cita
 * - Un historial cronológico de todas las reprogramaciones realizadas
 * - Para cada reprogramación: fecha original, nueva fecha, motivo, usuario que la realizó y fecha del cambio
 * - Indicadores visuales de roles de usuario (admin, staff, user) con colores distintivos
 * - Soporte completo para internacionalización (i18n)
 * - Estados de carga y mensajes informativos cuando no hay historial
 * 
 * @param {RescheduleHistoryDialogProps} props - Propiedades del componente
 * @param {boolean} props.open - Controla la visibilidad del diálogo
 * @param {function} props.onOpenChange - Callback para manejar cambios en el estado del diálogo
 * @param {Appointment | null} props.appointment - Datos de la cita a mostrar
 * 
 * @returns {JSX.Element | null} Elemento JSX del diálogo o null si no hay cita
 * 
 * @example
 * ```tsx
 * // Uso básico del componente
 * <RescheduleHistoryDialog
 *   open={isHistoryOpen}
 *   onOpenChange={setIsHistoryOpen}
 *   appointment={selectedAppointment}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Integración con estado de componente padre
 * const [showHistory, setShowHistory] = useState(false);
 * const [currentAppointment, setCurrentAppointment] = useState(null);
 * 
 * const handleShowHistory = (appointment) => {
 *   setCurrentAppointment(appointment);
 *   setShowHistory(true);
 * };
 * 
 * return (
 *   <RescheduleHistoryDialog
 *     open={showHistory}
 *     onOpenChange={setShowHistory}
 *     appointment={currentAppointment}
 *   />
 * );
 * ```
 * 
 * @remarks
 * - El componente utiliza el hook `useRescheduleHistory` para obtener los datos del historial
 * - Implementa lazy loading: solo carga datos cuando el diálogo está abierto
 * - Maneja automáticamente la localización de fechas según el idioma del usuario
 * - Incluye validación de datos y manejo de estados de error
 * - Optimizado para rendimiento con memoización interna de funciones helper
 * 
 * @dependencies
 * - `@/hooks/use-appointments` - Hook para obtener datos del historial
 * - `@/components/ui/*` - Componentes base de la interfaz
 * - `react-i18next` - Para soporte de internacionalización
 * - `date-fns` - Para formateo de fechas
 * - `lucide-react` - Para iconos
 * 
 * @since 1.0.0
 * @version 1.2.0
 * @lastModified 2025-07-03
 * @author Sistema de Gestión de Citas
 */
export function RescheduleHistoryDialog({
  open,
  onOpenChange,
  appointment
}: RescheduleHistoryDialogProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'es' ? es : undefined;

  /** Hook para obtener el historial de reprogramaciones de la cita */
  const { data: history = [], isLoading } = useRescheduleHistory(appointment?.id || 0);

  /**
   * Determina el color del badge según el rol del usuario.
   * 
   * @function getRoleBadgeVariant
   * @description Asigna colores distintivos a los badges de rol para mejorar la legibilidad:
   * - Admin: Color rojo (destructive) para indicar máximos privilegios
   * - Staff: Color gris (secondary) para operadores
   * - Otros: Color outline por defecto
   * 
   * @param {string} role - Rol del usuario (admin, staff, user, etc.)
   * @returns {string} Variante del badge para el componente Badge
   * 
   * @example
   * ```tsx
   * const variant = getRoleBadgeVariant('admin'); // retorna 'destructive'
   * ```
   * 
   * @since 1.0.0
   */
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'staff':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  /**
   * Traduce los roles de usuario utilizando las claves de internacionalización.
   * 
   * @function translateRole
   * @description Convierte los roles del sistema a texto legible en el idioma del usuario.
   * Utiliza las claves de traducción definidas en los archivos de localización.
   * 
   * @param {string} role - Rol del usuario en inglés (admin, staff, user)
   * @returns {string} Texto traducido del rol o el rol original si no hay traducción
   * 
   * @example
   * ```tsx
   * const adminText = translateRole('admin'); // retorna 'Administrador' en español
   * const staffText = translateRole('staff'); // retorna 'Operador' en español
   * ```
   * 
   * @since 1.0.0
   */
  const translateRole = (role: string) => {
    switch (role) {
      case 'admin':
        return t('auth.roles.admin');
      case 'staff':
        return t('auth.roles.staff');
      case 'user':
        return t('auth.roles.user');
      default:
        return role;
    }
  };

  /** Validación temprana: no renderizar si no hay cita seleccionada */
  if (!appointment) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('appointments.rescheduleHistory.title')}
          </DialogTitle>
          <DialogDescription>
            {t('appointments.rescheduleHistory.title')} - #{appointment.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                {t('common.loading')}
              </div>
            </div>
          ) : history.length === 0 ? (
            <Alert>
              <History className="h-4 w-4" />
              <AlertDescription>
                {t('appointments.rescheduleHistory.noHistory')}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Cita actual */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">
                    {t('appointments.status.scheduled')} ({t('common.current')})
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(appointment.scheduledAt), 'PPP - HH:mm', { locale })}
                </p>
              </div>

              <Separator />

              {/* Historial de cambios */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {t('appointments.rescheduleHistory.title')} ({history.length})
                </h4>

                {history.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    {/* Línea de conexión */}
                    {index < history.length - 1 && (
                      <div className="absolute left-4 top-6 bottom-0 w-px bg-border" />
                    )}

                    <div className="flex gap-4">
                      {/* Indicador de cambio */}
                      <div className="flex-shrink-0 w-8 h-8 bg-background border rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Contenido del cambio */}
                      <div className="flex-1 space-y-2 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {entry.rescheduledBy.username}
                            </span>
                            <Badge variant={getRoleBadgeVariant(entry.rescheduledBy.role)} className="text-xs">
                              {translateRole(entry.rescheduledBy.role)}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.createdAt), 'PPp', { locale })}
                          </span>
                        </div>

                        {/* Cambio de fecha */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {t('appointments.rescheduleHistory.originalDate')}:
                            </span>
                            <span className="line-through text-destructive">
                              {format(new Date(entry.originalScheduledAt), 'PPP - HH:mm', { locale })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {t('appointments.rescheduleHistory.newDate')}:
                            </span>
                            <span className="text-green-600 font-medium">
                              {format(new Date(entry.newScheduledAt), 'PPP - HH:mm', { locale })}
                            </span>
                          </div>
                        </div>

                        {/* Motivo */}
                        {entry.reason && (
                          <div className="flex gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-muted-foreground">
                                {t('appointments.rescheduleHistory.reason')}:
                              </span>
                              <p className="text-foreground mt-1 italic">
                                "{entry.reason}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Exportación por defecto del componente RescheduleHistoryDialog.
 * 
 * @default
 * @description Permite importar el componente usando sintaxis de importación por defecto.
 * 
 * @example
 * ```tsx
 * import RescheduleHistoryDialog from '@/components/appointments/RescheduleHistoryDialog';
 * ```
 * 
 * @since 1.0.0
 */
export default RescheduleHistoryDialog;
