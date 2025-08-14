import { useEffect, useState } from "react";
import { useAppointments, useRescheduleHistory } from "@/hooks/use-appointments";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QRDisplay } from "@/components/ui/qr-display";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar, Clock, CalendarDays, RefreshCw, QrCode, Edit, History, Shield, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { RescheduleDialog } from "@/components/appointments/RescheduleDialog";
import { RescheduleHistoryDialog } from "@/components/appointments/RescheduleHistoryDialog";

/**
 * Tipos de datos utilizados en el componente
 */

/**
 * @interface AppointmentStatus
 * @description Estados posibles de una cita médica
 */
type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

/**
 * @interface AppointmentData  
 * @description Estructura de datos de una cita médica
 * @property {number} id - Identificador único de la cita
 * @property {string} confirmationCode - Código de confirmación único
 * @property {AppointmentStatus} status - Estado actual de la cita
 * @property {string} createdAt - Fecha de creación/reserva (ISO string)
 * @property {string} scheduledAt - Fecha programada para atención (ISO string)
 * @property {string} [attendedAt] - Fecha de atención real (ISO string, opcional)
 * @property {string} [qrCode] - Código QR en formato base64 (opcional)
 */

/**
 * Componente principal para la visualización y gestión de citas.
 * 
 * Este componente permite a los usuarios:
 * - Ver todas sus citas médicas con información detallada
 * - Filtrar citas por estado (programadas, completadas, canceladas)
 * - Cancelar citas programadas
 * - Visualizar y gestionar códigos QR de las citas
 * - Refrescar los datos en tiempo real
 * - Ver estadísticas de citas por estado
 * 
 * **Características principales:**
 * - Interfaz responsiva con diseño de tarjetas
 * - Filtrado dinámico con contadores en tiempo real
 * - Gestión de estado con React Query para cache optimizado
 * - Internacionalización completa con react-i18next
 * - Feedback visual mediante toast notifications
 * - Modal interactivo para códigos QR con opciones de descarga
 * - Formateo de fechas localizado en español
 * - Estados de carga y error manejados elegantemente
 * 
 * **Flujo de usuario:**
 * 1. El componente carga las citas del usuario desde la API
 * 2. Muestra las citas en tarjetas con información detallada
 * 3. Permite filtrar por estado con contadores dinámicos
 * 4. Ofrece acciones contextuales (ver QR, cancelar)
 * 5. Proporciona feedback inmediato para todas las operaciones
 * 
 * @component
 * @example
 * ```tsx
 * // Uso básico del componente
 * <ViewAppointments />
 * 
 * // El componente se auto-gestiona y no requiere props
 * function MyAppointmentsPage() {
 *   return (
 *     <div className="container">
 *       <ViewAppointments />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {JSX.Element} Interfaz completa de gestión de citas con filtros, acciones y estadísticas
 * 
 * @see {@link useAppointments} Para la gestión de datos de citas
 * @see {@link QRDisplay} Para la visualización de códigos QR
 * @see {@link useToast} Para notificaciones al usuario
 * @see {@link useTranslation} Para internacionalización
 * 
 * @since 1.0.0
 * @version 1.2.0
 * @lastModified 2025-01-28
 */
export default function ViewAppointments() {
  // Hooks para gestión de datos y estado
  const { appointments, isLoading, cancelAppointment, rescheduleAppointment, isRescheduling, isCancelling } = useAppointments();
  const { user } = useUser(); // Hook para obtener información del usuario actual
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
    /**
   * Estados locales del componente para gestión de UI e interacciones
   */
  
  /** 
   * Cita seleccionada para mostrar su código QR en el modal
   * @state 
   */
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  /** 
   * Estado del modal de código QR (abierto/cerrado)
   * @state 
   */
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  
  /** 
   * Estado para controlar el diálogo de reprogramación
   * @state 
   */
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  
  /** 
   * Estado para controlar el diálogo de historial de reprogramaciones
   * @state 
   */
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  /** 
   * Cita seleccionada para reprogramar o ver historial
   * @state 
   */
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<any>(null);
  
  /** 
   * Filtro activo por estado de cita ('all', 'scheduled', 'completed', 'cancelled')
   * @state 
   */
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  /** 
   * ID de la cita que se está cancelando (para mostrar spinner específico)
   * @state 
   */
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<number | null>(null);
  
  /** 
   * Estado para controlar el dialog de confirmación de cancelación
   * @state 
   */
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  /** 
   * Cita que se va a cancelar (para el dialog de confirmación)
   * @state 
   */
  const [appointmentToCancel, setAppointmentToCancel] = useState<any>(null);
  
  /** 
   * Motivo de cancelación ingresado por el usuario
   * @state 
   */
  const [cancellationReason, setCancellationReason] = useState('');
  
  /**
   * Efecto para refrescar los datos al montar el componente.
   * 
   * Invalida las consultas de citas para asegurar que se muestren
   * los datos más actualizados cuando el usuario accede a la página.
   * 
   * @effect
   * @dependency queryClient - Cliente de React Query para invalidación de cache
   */  useEffect(() => {
    // Invalida el cache para obtener datos frescos al montar el componente
    queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
  }, [queryClient]);

  /**
   * Filtra las citas según el estado seleccionado por el usuario.
   * 
   * Aplica el filtro de estado activo a la lista completa de citas,
   * permitiendo mostrar todas las citas o solo las de un estado específico.
   * 
   * @computed
   * @returns {Appointment[]} Array de citas filtradas según el estado seleccionado
   */
  const filteredAppointments = appointments?.filter(appointment => {
    if (statusFilter === 'all') return true;
    return appointment.status === statusFilter;
  }) || [];

  /**
   * Calcula el conteo de citas por cada estado disponible.
   * 
   * Genera estadísticas agregadas de las citas para mostrar en los badges
   * del filtro, proporcionando feedback visual sobre la distribución de estados.
   * 
   * @computed
   * @returns {Record<string, number>} Objeto con el conteo de citas por estado
   */
  const appointmentCounts = appointments?.reduce((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  // Mostrar indicador de carga mientras se obtienen los datos de citas
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        {/* Spinner de carga centrado */}
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  /**
   * Maneja la cancelación de una cita programada.
   * 
   * Ejecuta el proceso de cancelación de una cita específica y proporciona
   * feedback al usuario mediante notificaciones toast. Solo permite cancelar
   * citas en estado "scheduled".
   * 
   * @async
   * @function handleCancel
   * @param {number} appointmentId - ID único de la cita a cancelar
   * @returns {Promise<void>} Promesa que se resuelve cuando se completa la cancelación
   * 
   * @example
   * ```tsx
   * <Button onClick={() => handleCancel(appointment.id)}>
   *   Cancelar Cita
   * </Button>
   * ```
   * 
  /**
   * Abre el dialog de confirmación para cancelar una cita.
   * 
   * Muestra un dialog modal donde el usuario puede confirmar la cancelación
   * de la cita y opcionalmente proporcionar un motivo para la cancelación.
   * 
   * @function handleCancel
   * @param {any} appointment - Objeto de la cita a cancelar
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={() => handleCancel(appointment)}>
   *   Cancelar Cita
   * </Button>
   * ```
   */  
  const handleCancel = (appointment: any) => {
    setAppointmentToCancel(appointment);
    setCancellationReason('');
    setIsCancelDialogOpen(true);
  };
  
  /**
   * Ejecuta la cancelación de una cita con motivo opcional.
   * 
   * Realiza la cancelación de la cita a través del hook useAppointments,
   * incluyendo el motivo de cancelación si fue proporcionado.
   * Las notificaciones son manejadas automáticamente por la mutación.
   * 
   * @function confirmCancel
   * @returns {Promise<void>} Promesa que se resuelve cuando se completa la cancelación
   */  
  const confirmCancel = async () => {
    if (!appointmentToCancel) return;
    
    try {
      // Marca esta cita como en proceso de cancelación
      setCancellingAppointmentId(appointmentToCancel.id);
      
      // Ejecuta la cancelación de la cita con motivo opcional
      await cancelAppointment(appointmentToCancel.id, cancellationReason || undefined);
      
      // Cierra el dialog de confirmación
      setIsCancelDialogOpen(false);
      setAppointmentToCancel(null);
      setCancellationReason('');
    } catch (error) {
      // El error ya se maneja en el hook useAppointments con onError
      // No necesitamos hacer nada aquí, solo evitar que se propague
      console.log('Error handled by useAppointments hook:', error);
    } finally {
      // Limpia el estado de cancelación independientemente del resultado
      setCancellingAppointmentId(null);
    }
  };
  
  /**
   * Abre el modal para mostrar el código QR de una cita.
   * 
   * Configura el estado necesario para mostrar el dialog modal que contiene
   * el código QR de la cita seleccionada, con opciones para descargar y compartir.
   * 
   * @function handleShowQR
   * @param {any} appointment - Objeto de la cita que contiene el código QR
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={() => handleShowQR(appointment)}>
   *   <QrCode className="h-4 w-4" />
   *   Ver QR
   * </Button>
   * ```
   * 
   * @see {@link QRDisplay} Componente que renderiza el código QR
   */  const handleShowQR = (appointment: any) => {
    // Establece la cita seleccionada para mostrar su QR
    setSelectedAppointment(appointment);
    // Abre el modal de código QR
    setIsQRDialogOpen(true);
  };

  /**
   * Abre el diálogo para reprogramar una cita.
   * 
   * Configura el estado necesario para mostrar el modal de reprogramación
   * con los datos de la cita seleccionada.
   * 
   * @function handleReschedule
   * @param {any} appointment - Objeto de la cita a reprogramar
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={() => handleReschedule(appointment)}>
   *   <Edit className="h-4 w-4" />
   *   Reprogramar
   * </Button>
   * ```
   */
  const handleReschedule = (appointment: any) => {
    setAppointmentToReschedule(appointment);
    setIsRescheduleDialogOpen(true);
  };

  /**
   * Ejecuta la reprogramación de una cita.
   * 
   * Procesa la reprogramación utilizando el hook useAppointments y maneja
   * las notificaciones de éxito y error correspondientes.
   * 
   * @function handleRescheduleSubmit
   * @param {Object} params - Parámetros de reprogramación
   * @param {number} params.appointmentId - ID de la cita a reprogramar
   * @param {string} params.newScheduledAt - Nueva fecha y hora en formato ISO
   * @param {string} [params.reason] - Motivo opcional de la reprogramación
   * @returns {Promise<void>}
   */
  const handleRescheduleSubmit = async (params: {
    appointmentId: number;
    newScheduledAt: string;
    reason?: string;
  }) => {
    try {
      await rescheduleAppointment(params);
      // Cerrar el diálogo después de una reprogramación exitosa
      setIsRescheduleDialogOpen(false);
    } catch (error) {
      // El error se maneja en el hook useAppointments
      console.error('Error in handleRescheduleSubmit:', error);
    }
  };

  /**
   * Abre el diálogo de historial de reprogramaciones.
   * 
   * Configura el estado para mostrar el modal con el historial de
   * todas las reprogramaciones de una cita específica.
   * 
   * @function handleShowHistory
   * @param {any} appointment - Objeto de la cita para mostrar su historial
   * @returns {void}
   */
  const handleShowHistory = (appointment: any) => {
    setAppointmentToReschedule(appointment);
    setIsHistoryDialogOpen(true);
  };

  /**
   * Refresca manualmente los datos de citas desde el servidor.
   * 
   * Invalida el cache de React Query para forzar una nueva consulta de datos
   * y muestra una notificación de confirmación al usuario. Útil para obtener
   * actualizaciones inmediatas sin recargar la página.
   * 
   * @function handleRefresh
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={handleRefresh} disabled={isLoading}>
   *   <RefreshCw className="h-4 w-4" />
   *   Actualizar
   * </Button>
   * ```
   */  const handleRefresh = () => {
    // Invalida el cache para forzar nueva consulta de datos
    queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    // Notifica al usuario que los datos se han actualizado
    toast({
      title: t('common.success'),
      description: t('appointments.refreshSuccess'),
    });
  };

  /**
   * Renderiza la interfaz completa de gestión de citas con las siguientes secciones:
   * 
   * **Encabezado:**
   * - Título de la página
   * - Botón de actualización manual de datos
   * 
   * **Sección de filtros:**
   * - Selector de estado con contadores por categoría
   * - Resumen de resultados filtrados
   * 
   * **Lista de citas:**
   * - Tarjetas individuales por cada cita
   * - Información detallada (fechas, estados, códigos)
   * - Botones de acción (ver QR, cancelar)
   * 
   * **Modal de código QR:**
   * - Visualización del código QR con opciones de descarga
   * 
   * @returns {JSX.Element} Interfaz completa de gestión de citas
   */  return (
    <div className="space-y-6">
      {/* Encabezado principal con título y botón de actualización */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('appointments.view')}</h2>        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Sección de filtros y estadísticas */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Selector de filtro por estado con contadores */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('common.filter')}:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('appointments.status.all')} />
              </SelectTrigger>
              <SelectContent>
                {/* Opción para mostrar todas las citas */}
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span>{t('appointments.status.all')}</span>
                    <Badge variant="outline" className="ml-auto">
                      {appointments?.length || 0}
                    </Badge>
                  </div>
                </SelectItem>
                {/* Filtro por citas programadas */}
                <SelectItem value="scheduled">
                  <div className="flex items-center gap-2">
                    <span>{t('appointments.status.scheduled')}</span>
                    <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-800">
                      {appointmentCounts.scheduled || 0}
                    </Badge>
                  </div>
                </SelectItem>
                {/* Filtro por citas completadas */}
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <span>{t('appointments.status.completed')}</span>
                    <Badge variant="outline" className="ml-auto bg-green-100 text-green-800">
                      {appointmentCounts.completed || 0}
                    </Badge>
                  </div>
                </SelectItem>
                {/* Filtro por citas canceladas */}
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <span>{t('appointments.status.cancelled')}</span>
                    <Badge variant="outline" className="ml-auto bg-red-100 text-red-800">
                      {appointmentCounts.cancelled || 0}
                    </Badge>
                  </div>
                </SelectItem>
                {/* Filtro por citas no asistidas */}
                <SelectItem value="no-show">
                  <div className="flex items-center gap-2">
                    <span>{t('appointments.status.no-show')}</span>
                    <Badge variant="outline" className="ml-auto bg-gray-200 text-gray-800">
                      {appointmentCounts['no-show'] || 0}
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Resumen de resultados filtrados */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {t('common.showing')} {filteredAppointments.length} {t('common.of')} {appointments?.length || 0} {t('appointments.title')}
          </span>
        </div>
      </div>      

      {/* Lista de citas filtradas */}
      <div className="grid gap-4">        {filteredAppointments?.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {/* Número de confirmación único de la cita */}
                <span className="font-semibold">
                  {t('appointments.appointmentNumber')}{appointment.confirmationCode}
                </span>
                {/* Badge de estado con colores dinámicos según el estado */}
                <span className={`text-sm font-normal px-3 py-1 rounded-full ${
                  appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'no-show' ? 'bg-gray-300 text-gray-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {t(`appointments.status.${appointment.status}`)}
                </span>
              </CardTitle>
            </CardHeader>            
            <CardContent>
              <div className="space-y-4">
                {/* Sección de fechas importantes con iconos descriptivos */}
                <div>
                  {/* Fecha de creación/reserva de la cita */}
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span className="font-medium">{t('appointments.bookingDate')}</span>
                    <span className="ml-2">
                      {format(new Date(appointment.createdAt), "PPP, h:mm a", { locale: es })}
                    </span>
                  </div>
                  {/* Fecha programada para la atención */}
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span className="font-medium">{t('appointments.scheduledDate')}</span>
                    <span className="ml-2">
                      {format(new Date(appointment.scheduledAt), "PPP, h:mm a", { locale: es })}
                    </span>
                  </div>
                  {/* Fecha de atención real (solo si fue atendida) */}
                  {appointment.attendedAt && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      <span className="font-medium">{t('appointments.serviceDate')}</span>
                      <span className="ml-2">
                        {format(new Date(appointment.attendedAt), "PPP, h:mm a", { locale: es })}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Información del servicio solicitado */}
                {appointment.serviceName && (
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-muted-foreground">{t('appointments.service', 'Servicio')}:</span>
                    <span className="ml-2 text-foreground">{appointment.serviceName}</span>
                  </div>
                )}                
                {/* Botones de acción disponibles para cada cita */}
                <div className="flex flex-wrap gap-2">
                  {/* Botón para mostrar código QR (solo si la cita tiene QR generado) */}
                  {appointment.qrCode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowQR(appointment)}
                      className="flex items-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      {t('appointments.qr.title')}
                    </Button>
                  )}
                  
                  {/* Botón para reprogramar cita (solo disponible para citas programadas) */}
                  {appointment.status === "scheduled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReschedule(appointment)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      {t('appointments.rescheduleAppointment')}
                    </Button>
                  )}
                  
                  {/* Botón para ver historial de reprogramaciones */}
                  {(appointment.rescheduledAt || appointment.rescheduledFromId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShowHistory(appointment)}
                      className="flex items-center gap-2"
                    >
                      <History className="h-4 w-4" />
                      {t('appointments.rescheduleHistory.viewHistory')}
                    </Button>
                  )}
                  
                  {/* Botón para cancelar cita (solo disponible para citas programadas) */}
                  {appointment.status === "scheduled" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(appointment)}
                      disabled={cancellingAppointmentId === appointment.id}
                      className="flex items-center gap-2"
                    >
                      {cancellingAppointmentId === appointment.id && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {t('appointments.cancelAppointment')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}        
        {/* Mensaje informativo cuando no hay citas para mostrar */}
        {filteredAppointments?.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {appointments?.length === 0 
                ? t('appointments.noAppointments')
                : t('appointments.noAppointmentsWithFilter')
              }
            </CardContent>
          </Card>
        )}
      </div>      {/* Modal para visualización de código QR */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('appointments.qr.title')}</DialogTitle>
            <DialogDescription>
              {t('appointments.qr.description', 'Utilice este código QR para realizar el check-in de su cita.')}
            </DialogDescription>
          </DialogHeader>
          {/* Componente QRDisplay con todas las funcionalidades */}
          {selectedAppointment?.qrCode && (
            <QRDisplay
              qrCode={selectedAppointment.qrCode}
              appointmentId={selectedAppointment.id}
              confirmationCode={selectedAppointment.confirmationCode}
              showActions={true}
              className="border-0"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para reprogramar cita */}
      <RescheduleDialog
        open={isRescheduleDialogOpen}
        onOpenChange={setIsRescheduleDialogOpen}
        appointment={appointmentToReschedule}
        onReschedule={handleRescheduleSubmit}
        isLoading={isRescheduling}
        user={user}
      />

      {/* Modal para mostrar historial de reprogramaciones */}
      <RescheduleHistoryDialog
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        appointment={appointmentToReschedule}
      />

      {/* Dialog de confirmación para cancelar cita */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <Shield className="h-4 w-4 text-amber-500" />
              )}
              {t('appointments.confirmCancel.title', 'Confirmar Cancelación')}
            </DialogTitle>
            <DialogDescription>
              {t('appointments.confirmCancel.description', 'Revise los detalles de la cita antes de confirmar la cancelación.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Alert especial para administradores */}
            {user?.role === 'admin' && (
              <Alert className="border-amber-200 bg-amber-50">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  {t('appointments.adminPrivileges.cancelMessage', 'Como administrador, puede cancelar esta cita sin restricciones de tiempo ni configuraciones de sede.')}
                </AlertDescription>
              </Alert>
            )}
            
            {appointmentToCancel && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  {t('appointments.appointmentDetails', 'Detalles de la Cita')}
                </h4>
                <p className="text-sm">
                  <strong>{t('appointments.service', 'Servicio')}:</strong> {appointmentToCancel.serviceName || t('appointments.unknownService', 'Servicio no especificado')}
                </p>
                <p className="text-sm">
                  <strong>{t('appointments.date', 'Fecha')}:</strong> {' '}
                  {format(new Date(appointmentToCancel.scheduledAt), 'PPP p', { locale: es })}
                </p>
                {appointmentToCancel.confirmationCode && (
                  <p className="text-sm">
                    <strong>{t('appointments.confirmationCode', 'Código')}:</strong> {appointmentToCancel.confirmationCode}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">
                {t('appointments.confirmCancel.reason', 'Motivo de cancelación (opcional)')}
              </Label>
              <Textarea
                id="cancellation-reason"
                placeholder={t('appointments.confirmCancel.reasonPlaceholder', 'Ingrese el motivo de la cancelación...')}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
            
            <p className="text-sm text-muted-foreground">
              {t('appointments.confirmCancel.warning', 'Esta acción no se puede deshacer. ¿Está seguro de que desea cancelar esta cita?')}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={cancellingAppointmentId === appointmentToCancel?.id}
            >
              {t('common.no', 'No, mantener cita')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={cancellingAppointmentId === appointmentToCancel?.id}
              className="flex items-center gap-2"
            >
              {cancellingAppointmentId === appointmentToCancel?.id && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t('common.yes', 'Sí, cancelar cita')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}