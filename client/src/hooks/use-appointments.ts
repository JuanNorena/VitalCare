import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Appointment, Queue } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * Interfaz extendida para citas con campos adicionales del API
 */
interface AppointmentWithService extends Appointment {
  serviceName?: string;
}

/**
 * Interfaz extendida para entradas de cola con campos adicionales del API
 */
interface QueueEntryWithServicePoint extends Queue {
  servicePointId?: number;
  branchId?: number;
  scheduledAt?: Date;
  userName?: string;
  serviceName?: string;
  confirmationCode?: string;
}

/**
 * Tipos de estado para las colas y citas
 */
type QueueStatus = 'waiting' | 'in-progress' | 'completed' | 'cancelled';
type AppointmentStatus = 'scheduled' | 'checked-in' | 'completed' | 'cancelled';

/**
 * Parámetros para operaciones de check-in
 * 
 * @interface CheckinParams
 * @property {string} [qrCode] - Código QR escaneado para check-in automático
 * @property {string} [confirmationCode] - Código de confirmación manual
 */
interface CheckinParams {
  qrCode?: string;
  confirmationCode?: string;
}

/**
 * Parámetros para reprogramar una cita
 * 
 * @interface RescheduleParams
 * @property {number} appointmentId - ID de la cita a reprogramar
 * @property {string} newScheduledAt - Nueva fecha y hora en formato ISO
 * @property {string} [reason] - Motivo opcional de la reprogramación
 */
interface RescheduleParams {
  appointmentId: number;
  newScheduledAt: string;
  reason?: string;
}

/**
 * Entrada del historial de reprogramaciones
 * 
 * @interface RescheduleHistoryEntry
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
 * Parámetros para agregar citas a la cola de atención
 * 
 * @interface AddToQueueParams
 * @property {number} appointmentId - ID de la cita a agregar
 * @property {number} servicePointId - ID del punto de atención asignado
 */
interface AddToQueueParams {
  appointmentId: number;
  servicePointId: number;
}

/**
 * Parámetros para actualizar el estado de la cola
 * 
 * @interface UpdateQueueStatusParams
 * @property {number} queueId - ID de la entrada en cola
 * @property {QueueStatus} status - Nuevo estado de la cola
 */
interface UpdateQueueStatusParams {
  queueId: number;
  status: string;
}

/**
 * Hook personalizado para la gestión completa de citas médicas y colas de atención.
 * 
 * Este hook centraliza toda la lógica de negocio relacionada con el ciclo de vida
 * de las citas médicas, desde la reserva hasta la atención, incluyendo:
 * 
 * **Gestión de Citas:**
 * - Consulta y listado de citas del usuario
 * - Creación de nuevas citas médicas
 * - Cancelación de citas programadas
 * - Check-in mediante QR o código de confirmación
 * 
 * **Gestión de Colas:**
 * - Consulta de estado de colas de atención
 * - Creación de entradas en cola
 * - Actualización de estados de cola
 * - Gestión de citas en espera de atención
 * 
 * **Características destacadas:**
 * - **Cache inteligente**: Utiliza React Query para optimizar consultas
 * - **Actualizaciones automáticas**: Refrescos periódicos para datos en tiempo real
 * - **Feedback visual**: Notificaciones automáticas para todas las operaciones
 * - **Manejo de errores**: Gestión robusta de errores con mensajes localizados
 * - **Invalidación de cache**: Sincronización automática entre datos relacionados
 * 
 * **Flujo típico de uso:**
 * 1. Usuario reserva una cita médica
 * 2. Sistema genera código QR y confirmación
 * 3. Usuario realiza check-in el día de la cita
 * 4. Cita se agrega automáticamente a la cola de atención
 * 5. Personal gestiona el flujo de atención
 * 6. Sistema actualiza estados en tiempo real
 * 
 * @hook
 * @example
 * ```tsx
 * function AppointmentManager() {
 *   const {
 *     appointments,
 *     isLoading,
 *     createAppointment,
 *     checkinAppointment,
 *     queue,
 *     addToQueue
 *   } = useAppointments();
 * 
 *   const handleBooking = async (appointmentData) => {
 *     try {
 *       await createAppointment(appointmentData);
 *       // Notificación automática de éxito
 *     } catch (error) {
 *       // Error handling automático
 *     }
 *   };
 * 
 *   const handleCheckin = async (qrCode) => {
 *     try {
 *       await checkinAppointment({ qrCode });
 *       // Check-in exitoso
 *     } catch (error) {
 *       // Error en check-in
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       {appointments?.map(appointment => (
 *         <AppointmentCard key={appointment.id} appointment={appointment} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {Object} Objeto con datos y funciones para gestión de citas y colas
 * 
 * @see {@link useQuery} Para consultas de datos optimizadas
 * @see {@link useMutation} Para operaciones de modificación
 * @see {@link useToast} Para notificaciones al usuario
 * @see {@link useTranslation} Para internacionalización
 * 
 * @since 1.0.0
 * @version 2.1.0
 * @lastModified 2025-01-28
 */
export function useAppointments() {  // Hooks para gestión de notificaciones, cache y traducción
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  /**
   * Consulta las citas del usuario autenticado con actualizaciones automáticas.
   * 
   * Obtiene todas las citas asociadas al usuario actual, manteniendo los datos
   * actualizados mediante refrescos periódicos y cuando la ventana obtiene el foco.
   * 
   * **Configuración de actualización:**
   * - Refresco automático cada 30 segundos
   * - Actualización al enfocar la ventana
   * - Cache inteligente con React Query
   * 
   * @query appointments
   * @returns {Appointment[]} Array de citas del usuario
   * @throws {Error} Si falla la consulta al servidor
   */
  const { data: appointments, isLoading } = useQuery<AppointmentWithService[]>({    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const response = await fetch('/api/appointments', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      return response.json();
    },
    refetchInterval: 30000, // Actualización automática cada 30 segundos
    refetchOnWindowFocus: true, // Actualizar cuando la ventana obtiene el foco
  });

  /**
   * Procesa la creación de una nueva cita con validación del servidor,
   * actualización automática del cache y notificaciones al usuario.
   * 
   * **Efectos secundarios:**
   * - Invalida cache de citas y colas
   * - Muestra notificación de éxito/error
   * - Actualiza la UI automáticamente
   * 
   * @mutation createAppointment
   * @param {Partial<Appointment>} appointment - Datos de la nueva cita
   * @returns {Promise<Appointment>} Cita creada con datos completos
   * @throws {Error} Si falla la creación en el servidor
   * 
   * @example
   * ```tsx
   * const { createAppointment } = useAppointments();
   * 
   * await createAppointment({
   *   scheduledAt: new Date(),
   *   serviceId: 1,
   *   notes: 'Consulta general'
   * });
   * ```
   */
  const createAppointmentMutation = useMutation({    mutationFn: async (appointment: Partial<Appointment>) => {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(appointment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('appointments.bookingError'));
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalida el cache para actualizar la lista de citas
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      // También invalidar la cola para sincronizar datos relacionados
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      // Notifica éxito al usuario
      toast({
        title: t('common.success'),
        description: t('appointments.bookingSuccess'),
      });
    },
    onError: (error: Error) => {
      // Notifica error al usuario con mensaje descriptivo
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  /**
   * Mutación para cancelar citas programadas.
   * 
   * Permite cancelar citas existentes con validación de permisos,
   * actualización del cache y feedback al usuario. Opcionalmente
   * permite incluir un motivo de cancelación.
   * 
   * **Restricciones:**
   * - Solo citas en estado 'scheduled' pueden cancelarse
   * - Validación de permisos del usuario
   * - Actualización automática de la interfaz
   * 
   * @mutation cancelAppointment
   * @param {number} appointmentId - ID de la cita a cancelar
   * @param {string} [reason] - Motivo opcional de la cancelación
   * @returns {Promise<void>} Confirmación de cancelación
   * @throws {Error} Si falla la cancelación o no está permitida
   * 
   * @example
   * ```tsx
   * const { cancelAppointment } = useAppointments();
   * 
   * await cancelAppointment(123, "Motivo de cancelación");
   * // Cita cancelada y UI actualizada automáticamente
   * ```
   */
  const cancelAppointmentMutation = useMutation({    
    mutationFn: async ({ appointmentId, reason }: { appointmentId: number; reason?: string }) => {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('appointments.cancelError'));
      }

      return response.json();
    },
    onSuccess: () => {
      // Actualiza la lista de citas tras la cancelación
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      // Notifica éxito de la cancelación
      toast({
        title: t('common.success'),
        description: t('appointments.cancelSuccess'),
      });
    },
    onError: (error: Error) => {
      // Maneja errores de cancelación
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  /**
   * Mutación para reprogramar una cita existente.
   * 
   * Permite cambiar la fecha y hora de una cita previamente agendada,
   * con validaciones de disponibilidad y notificaciones automáticas.
   * 
   * **Funcionalidades:**
   * - Validación de nueva fecha/hora
   * - Verificación de disponibilidad del servicio
   * - Registro en historial de reprogramaciones
   * - Notificación por email al usuario
   * - Actualización automática de la UI
   * 
   * **Permisos:**
   * - Usuario propietario de la cita
   * - Administradores (cualquier cita)
   * - Staff (citas de su sede asignada)
   * 
   * @mutation rescheduleAppointment
   * @param {RescheduleParams} params - Parámetros de reprogramación
   * @returns {Promise<Appointment>} Cita reprogramada
   * @throws {Error} Si falla la reprogramación
   * 
   * @example
   * ```typescript
   * try {
   *   await rescheduleAppointment({
   *     appointmentId: 123,
   *     newScheduledAt: '2024-01-20T14:30:00.000Z',
   *     reason: 'Cambio de horario solicitado por el cliente'
   *   });
   *   // Cita reprogramada y UI actualizada automáticamente
   * } catch (error) {
   *   // Manejo de errores (conflictos de horario, etc.)
   * }
   * ```
   */
  const rescheduleAppointmentMutation = useMutation({
    mutationFn: async (params: RescheduleParams) => {
      const response = await fetch(`/api/appointments/${params.appointmentId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          newScheduledAt: params.newScheduledAt,
          reason: params.reason
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('appointments.rescheduleError'));
      }

      return response.json();
    },
    onSuccess: () => {
      // Actualiza la lista de citas tras la reprogramación
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      // Notifica éxito de la reprogramación
      toast({
        title: t('common.success'),
        description: t('appointments.rescheduleSuccess'),
      });
    },
    onError: (error: Error) => {
      // Maneja errores de reprogramación
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  /**
   * Consulta el estado actual de las colas de atención.
   * 
   * Obtiene información en tiempo real sobre las colas de espera,
   * con actualizaciones frecuentes para reflejar cambios inmediatos.
   * 
   * **Configuración de actualización:**
   * - Refresco automático cada 5 segundos
   * - Datos críticos para operaciones en tiempo real
   * 
   * @query queue
   * @returns {Queue[]} Array con el estado de todas las colas
   * @throws {Error} Si falla la consulta de colas
   */
  const { data: queue, isLoading: queueLoading } = useQuery<QueueEntryWithServicePoint[]>({    queryKey: ['/api/queue'],
    queryFn: async () => {
      const response = await fetch('/api/queue', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch queue');
      }
      return response.json();
    },
    refetchInterval: 15000, // Actualización cada 15 segundos para visualizador (optimizado)
  });

  /**
   * Mutación para crear nuevas entradas en la cola de atención.
   * 
   * Permite agregar directamente entradas a la cola sin pasar por el
   * proceso completo de citas, útil para walk-ins y servicios inmediatos.
   * 
   * @mutation createQueueEntry
   * @param {Partial<Queue>} queueEntry - Datos de la entrada en cola
   * @returns {Promise<Queue>} Entrada de cola creada
   * @throws {Error} Si falla la creación
   * 
   * @example
   * ```tsx
   * const { createQueueEntry } = useAppointments();
   * 
   * await createQueueEntry({
   *   servicePointId: 1,
   *   priority: 'normal',
   *   patientName: 'Juan Pérez'
   * });
   * ```
   */
  const createQueueEntryMutation = useMutation({    mutationFn: async (queueEntry: Partial<Queue>) => {
      console.log('Creating queue entry:', queueEntry);
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(queueEntry),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('queue.addToQueueError'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Actualiza la cola tras crear nueva entrada
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      // Notifica éxito de la operación
      toast({
        title: t('common.success'),
        description: t('queue.addToQueueSuccess'),
      });
      console.log('Queue entry created successfully:', data);
    },
    onError: (error: Error) => {
      // Maneja errores de creación de entrada
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
      console.error('Error creating queue entry:', error);
    },
  });

  /**
   * Mutación para actualizar el estado de entradas en cola.
   * 
   * Permite cambiar el estado de las entradas en cola (esperando, en progreso,
   * completado, cancelado) para gestionar el flujo de atención.
   * 
   * **Estados válidos:**
   * - 'waiting': En espera de atención
   * - 'in-progress': Siendo atendido actualmente
   * - 'completed': Atención completada
   * - 'cancelled': Cancelado por el paciente o sistema
   * 
   * @mutation updateQueueStatus
   * @param {UpdateQueueStatusParams} params - ID de cola y nuevo estado
   * @returns {Promise<Queue>} Entrada de cola actualizada
   * @throws {Error} Si falla la actualización
   * 
   * @example
   * ```tsx
   * const { updateQueueStatus } = useAppointments();
   * 
   * await updateQueueStatus({
   *   queueId: 456,
   *   status: 'in-progress'
   * });
   * ```
   */
  const updateQueueStatusMutation = useMutation({    mutationFn: async ({ queueId, status }: { queueId: number, status: string }) => {
      console.log('Updating queue status:', { queueId, status });
      const response = await fetch(`/api/queue/${queueId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('queue.statusUpdateError'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Actualiza la cola tras cambio de estado
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      // Notifica éxito del cambio de estado
      toast({
        title: t('common.success'),
        description: t('queue.statusUpdateSuccess'),
      });
      console.log('Queue status updated successfully:', data);
    },
    onError: (error: Error) => {
      // Maneja errores de actualización de estado
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
      console.error('Error updating queue status:', error);
    },
  });

  /**
   * Mutación para realizar check-in de citas médicas.
   * 
   * Procesa el check-in de pacientes mediante código QR escaneado o
   * código de confirmación manual, validando la cita y actualizando su estado.
   * 
   * **Métodos de check-in soportados:**
   * - Escaneo de código QR (automático)
   * - Ingreso manual de código de confirmación
   * - Validación cruzada de datos del paciente
   * 
   * **Efectos del check-in exitoso:**
   * - Cambia estado de cita a 'checked-in'
   * - Invalida caches relacionados
   * - Prepara la cita para ingreso a cola
   * - Registra timestamp de check-in
   * 
   * @mutation checkinAppointment
   * @param {CheckinParams} params - Parámetros de check-in (QR o código)
   * @returns {Promise<Appointment>} Cita actualizada tras check-in
   * @throws {Error} Si falla la validación o el check-in
   * 
   * @example
   * ```tsx
   * const { checkinAppointment } = useAppointments();
   * 
   * // Check-in por QR
   * await checkinAppointment({ qrCode: 'scanned_qr_data' });
   * 
   * // Check-in manual
   * await checkinAppointment({ confirmationCode: 'ABC123' });
   * ```
   */
  const checkinAppointmentMutation = useMutation({    mutationFn: async ({ qrCode, confirmationCode }: { qrCode?: string, confirmationCode?: string }) => {
      console.log('Sending check-in request:', { qrCode: !!qrCode, confirmationCode: !!confirmationCode });
      
      const response = await fetch('/api/appointments/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ qrCode, confirmationCode }),
      });

      console.log('Check-in response status:', response.status);
      console.log('Check-in response headers:', response.headers.get('content-type'));

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.message || t('appointments.checkinError'));
        } else {
          // Manejo especial para respuestas no-JSON (errores del servidor)
          const htmlText = await response.text();
          console.error('Non-JSON response received:', htmlText.substring(0, 200));
          throw new Error('Error de servidor. Por favor, inicie sesión nuevamente.');
        }
      }

      const result = await response.json();
      console.log('Check-in successful:', result);
      return result;
    },
    onSuccess: (data) => {
      // Invalida caches relacionados tras check-in exitoso
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      // Notifica éxito del check-in
      toast({
        title: t('common.success'),
        description: t('appointments.checkinSuccess'),
      });
    },
    onError: (error: Error) => {
      console.error('Check-in mutation error:', error);
      // Maneja errores de check-in con contexto
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  /**
   * Mutación para agregar citas con check-in a la cola de atención.
   * 
   * Transfiere citas que han completado el check-in exitosamente
   * a la cola de espera del punto de atención correspondiente.
   * 
   * **Prerequisitos:**
   * - Cita debe estar en estado 'checked-in'
   * - Punto de atención debe estar activo
   * - Usuario debe tener permisos necesarios
   * 
   * @mutation addToQueue
   * @param {AddToQueueParams} params - ID de cita y punto de atención
   * @returns {Promise<Queue>} Nueva entrada en cola creada
   * @throws {Error} Si falla la adición a cola
   * 
   * @example
   * ```tsx
   * const { addToQueue } = useAppointments();
   * 
   * await addToQueue({
   *   appointmentId: 789,
   *   servicePointId: 2
   * });
   * ```
   */
  const addToQueueMutation = useMutation({    mutationFn: async ({ appointmentId, servicePointId }: { appointmentId: number; servicePointId: number }) => {
      console.log('🚀 Adding appointment to queue:', { appointmentId, servicePointId });
      
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentId, servicePointId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al agregar a la cola');
      }

      const result = await response.json();
      console.log('✅ Queue response received:', result);
      return result;
    },
    onSuccess: (data) => {
      // Actualiza caches relacionados tras agregar a cola
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/checked-in'] });
      // Notifica éxito de la adición a cola
      toast({
        title: t('common.success'),
        description: data.message || 'Cita agregada a la cola exitosamente',
      });
      console.log('Successfully added to queue:', data);
    },
    onError: (error: Error) => {
      // Maneja errores de adición a cola
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
      console.error('Error adding to queue:', error);
    },
  });

  /**
   * Consulta las citas que han completado check-in pero no están en cola.
   * 
   * Obtiene citas en estado intermedio, útil para interfaces de gestión
   * que necesitan mostrar citas pendientes de asignación a cola.
   * 
   * **Casos de uso:**
   * - Dashboard de gestión de check-ins
   * - Asignación manual a puntos de atención
   * - Monitoreo de citas en proceso
   * 
   * @query checkedInAppointments
   * @returns {Appointment[]} Citas con check-in pero sin cola asignada
   * @throws {Error} Si falla la consulta
   */
  const { data: checkedInAppointments, isLoading: checkedInLoading } = useQuery({    queryKey: ['/api/appointments/checked-in'],
    queryFn: async () => {
      const response = await fetch('/api/appointments/checked-in', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch checked-in appointments');
      }
      return response.json();
    },
    refetchInterval: 10000, // Actualización cada 10 segundos para gestión ágil
  });

  /**
   * Transferir cita entre puntos de atención
   * 
   * @param {Object} params - Parámetros de transferencia
   * @param {number} params.queueId - ID de la entrada en cola
   * @param {number} params.servicePointId - ID del nuevo punto de atención
   * @returns {Promise<Object>} Respuesta del servidor
   * @throws {Error} Si la transferencia falla
   * 
   * @example
   * ```typescript
   * const { transferAppointment } = useAppointments();
   * 
   * await transferAppointment({
   *   queueId: 123,
   *   servicePointId: 456
   * });
   * ```
   */
  const transferAppointmentMutation = useMutation({
    mutationFn: async ({ queueId, servicePointId }: { queueId: number, servicePointId: number }) => {
      const response = await fetch(`/api/queue/${queueId}/transfer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicePointId }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('common.error'));
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/checked-in'] });
      
      toast({
        title: t('common.success'),
        description: t('queue.transferSuccess'),
      });
    },
    onError: (error: Error) => {
      console.error('Error transferring appointment:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message || t('queue.transferError'),
      });
    },
  });

  /**
   * Retorna todas las funciones y datos disponibles del hook.
   * 
   * Expone una API completa para gestión de citas y colas, organizando
   * las funcionalidades por categorías para facilitar su uso.
   * 
   * **Categorías de funcionalidades:**
   * 
   * **Gestión de Citas:**
   * - `appointments`: Lista de citas del usuario
   * - `isLoading`: Estado de carga de citas
   * - `createAppointment`: Crear nueva cita
   * - `cancelAppointment`: Cancelar cita existente
   * - `rescheduleAppointment`: Reprogramar cita existente
   * - `useRescheduleHistory`: Hook para historial de reprogramaciones
   * - `checkinAppointment`: Realizar check-in
   * 
   * **Gestión de Colas:**
   * - `queue`: Estado actual de colas
   * - `queueLoading`: Estado de carga de colas
   * - `createQueueEntry`: Crear entrada directa en cola
   * - `updateQueueStatus`: Actualizar estado de cola
   * - `addToQueue`: Agregar cita con check-in a cola
   * - `transferAppointment`: Transferir cita entre puntos de atención
   * 
   * **Estados Intermedios:**
   * - `checkedInAppointments`: Citas con check-in pendientes de cola
   * - `checkedInLoading`: Estado de carga de check-ins pendientes
   * 
   * @returns {Object} API completa para gestión de citas y colas
   */
  return {    // Datos y estados de citas
    appointments,
    isLoading,
    
    // Operaciones de citas
    createAppointment: createAppointmentMutation.mutateAsync,
    cancelAppointment: async (appointmentId: number, reason?: string) => 
      cancelAppointmentMutation.mutateAsync({ appointmentId, reason }),
    rescheduleAppointment: rescheduleAppointmentMutation.mutateAsync,
    checkinAppointment: checkinAppointmentMutation.mutateAsync,
    
    // Estados de operaciones
    isRescheduling: rescheduleAppointmentMutation.isPending,
    isCancelling: cancelAppointmentMutation.isPending,
    
    // Datos y estados de colas
    queue,
    queueLoading,
    
    // Operaciones de colas
    createQueueEntry: createQueueEntryMutation.mutateAsync,
    updateQueueStatus: updateQueueStatusMutation.mutateAsync,
    addToQueue: addToQueueMutation.mutateAsync,
    transferAppointment: transferAppointmentMutation.mutateAsync,
    
    // Estados intermedios
    checkedInAppointments,
    checkedInLoading,
  };
}

/**
 * Hook separado para obtener el historial de reprogramaciones de una cita específica.
 * 
 * Este hook debe usarse independientemente del hook principal para evitar
 * problemas con las reglas de hooks de React.
 * 
 * @param {number} appointmentId - ID de la cita
 * @returns {Object} Datos del historial y estado de carga
 * 
 * @example
 * ```typescript
 * const { data: history, isLoading } = useRescheduleHistory(appointmentId);
 * ```
 */
export const useRescheduleHistory = (appointmentId: number) => {
  return useQuery<RescheduleHistoryEntry[]>({
    queryKey: ['/api/appointments', appointmentId, 'reschedule-history'],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/${appointmentId}/reschedule-history`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch reschedule history');
      }
      return response.json();
    },
    enabled: !!appointmentId,
  });
};