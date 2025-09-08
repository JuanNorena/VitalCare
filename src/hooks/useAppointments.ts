/**
 * Hook personalizado para el manejo completo de citas médicas en VitalCare.
 *
 * Este módulo proporciona hooks React Query para gestionar todas las operaciones
 * relacionadas con citas médicas, incluyendo consultas, creación, modificación
 * y eliminación. Utiliza React Query para cache, sincronización y manejo de estado.
 *
 * @description
 * Funcionalidades principales:
 * - Consultas de citas por paciente o doctor
 * - Creación de nuevas citas
 * - Cancelación de citas existentes
 * - Reprogramación de citas
 * - Confirmación de asistencia
 * - Invalidación automática de cache
 * - Estados de carga y error integrados
 *
 * Los hooks están diseñados para seguir las reglas de React Query:
 * - Queries para lectura de datos
 * - Mutations para modificaciones
 * - Invalidación automática del cache tras mutaciones
 * - Estados de carga y error consistentes
 *
 * @example
 * ```typescript
 * // Uso básico en componente
 * import { useAppointments } from '@/hooks/useAppointments';
 *
 * function AppointmentsComponent() {
 *   const { usePatientAppointments, createAppointment, isCreating } = useAppointments();
 *   const appointments = usePatientAppointments(userId);
 *
 *   const handleCreate = async (data) => {
 *     await createAppointment(data);
 *   };
 *
 *   // ... resto del componente
 * }
 * ```
 *
 * @see {@link appointmentService} para el servicio subyacente de citas.
 * @see {@link useQuery} y {@link useMutation} de React Query.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointments';
import type { Appointment } from '@/types/api';
import type { RescheduleAppointmentRequest } from '@/services/appointments';

// Hooks de lectura (top-level) — evitan advertencias del plugin de Hooks
/**
 * Hook para consultar citas de un paciente específico.
 *
 * @param {string} patientId - ID del paciente cuyas citas se quieren consultar.
 * @returns {UseQueryResult<Appointment[]>} Resultado de la consulta con datos, loading, error.
 *
 * @description
 * Utiliza React Query para cachear las citas del paciente.
 * La consulta se ejecuta automáticamente cuando patientId cambia.
 * Los datos se invalidan tras operaciones de modificación.
 *
 * @example
 * ```typescript
 * const appointmentsQuery = usePatientAppointments('patient-123');
 * if (appointmentsQuery.isLoading) return <Loading />;
 * if (appointmentsQuery.error) return <Error message={error.message} />;
 * return <AppointmentsList appointments={appointmentsQuery.data} />;
 * ```
 */
export const usePatientAppointments = (patientId: string) => {
  return useQuery<Appointment[]>({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: () => appointmentService.getAppointmentsByPatient(patientId),
    enabled: !!patientId,
  });
};

/**
 * Hook para consultar citas de un doctor específico.
 *
 * @param {string} doctorId - ID del doctor cuyas citas se quieren consultar.
 * @returns {UseQueryResult<Appointment[]>} Resultado de la consulta con datos, loading, error.
 *
 * @description
 * Utiliza React Query para cachear las citas del doctor.
 * La consulta se ejecuta automáticamente cuando doctorId cambia.
 * Los datos se invalidan tras operaciones de modificación.
 *
 * @example
 * ```typescript
 * const appointmentsQuery = useDoctorAppointments('doctor-456');
 * // Usar appointmentsQuery.data, appointmentsQuery.isLoading, etc.
 * ```
 */
export const useDoctorAppointments = (doctorId: string) => {
  return useQuery<Appointment[]>({
    queryKey: ['appointments', 'doctor', doctorId],
    queryFn: () => appointmentService.getAppointmentsByDoctor(doctorId),
    enabled: !!doctorId,
  });
};

// Hooks de escritura (mutations) — también top-level
/**
 * Hook para crear una nueva cita médica.
 *
 * @returns {UseMutationResult} Objeto con mutate, isPending, error, etc.
 *
 * @description
 * Mutation que crea una nueva cita y actualiza el cache automáticamente.
 * Invalida todas las consultas de appointments tras la creación exitosa.
 *
 * @example
 * ```typescript
 * const createMutation = useCreateAppointment();
 *
 * const handleCreate = async (appointmentData) => {
 *   try {
 *     await createMutation.mutateAsync(appointmentData);
 *     showSuccess('Cita creada exitosamente');
 *   } catch (error) {
 *     showError('Error al crear cita');
 *   }
 * };
 * ```
 */
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

/**
 * Hook para cancelar una cita médica existente.
 *
 * @returns {UseMutationResult} Objeto con mutate, isPending, error, etc.
 *
 * @description
 * Mutation que cancela una cita y actualiza el cache automáticamente.
 * Invalida todas las consultas de appointments tras la cancelación exitosa.
 *
 * @example
 * ```typescript
 * const cancelMutation = useCancelAppointment();
 *
 * const handleCancel = async (appointmentId) => {
 *   if (confirm('¿Cancelar cita?')) {
 *     await cancelMutation.mutateAsync(appointmentId);
 *   }
 * };
 * ```
 */
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentService.cancelAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

/**
 * Hook para reprogramar una cita médica existente.
 *
 * @returns {UseMutationResult} Objeto con mutate, isPending, error, etc.
 *
 * @description
 * Mutation que reprograma una cita con nuevos datos y actualiza el cache.
 * Invalida todas las consultas de appointments tras la reprogramación exitosa.
 *
 * @example
 * ```typescript
 * const rescheduleMutation = useRescheduleAppointment();
 *
 * const handleReschedule = async (appointmentId, newData) => {
 *   await rescheduleMutation.mutateAsync({ id: appointmentId, data: newData });
 * };
 * ```
 */
export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RescheduleAppointmentRequest }) =>
      appointmentService.rescheduleAppointment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

/**
 * Hook para confirmar asistencia a una cita médica.
 *
 * @returns {UseMutationResult} Objeto con mutate, isPending, error, etc.
 *
 * @description
 * Mutation que confirma la asistencia del paciente a una cita.
 * Invalida todas las consultas de appointments tras la confirmación exitosa.
 * Generalmente usado por doctores para marcar asistencia.
 *
 * @example
 * ```typescript
 * const confirmMutation = useConfirmAttendance();
 *
 * const handleConfirm = async (appointmentId) => {
 *   await confirmMutation.mutateAsync(appointmentId);
 *   showSuccess('Asistencia confirmada');
 * };
 * ```
 */
export const useConfirmAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentService.confirmAttendance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

// API agrupada para compatibilidad con código existente
/**
 * Hook principal que agrupa todos los hooks de citas para facilitar el uso.
 *
 * @returns {Object} Objeto con todos los hooks y funciones de citas.
 *
 * @property {Function} usePatientAppointments - Hook para citas de paciente.
 * @property {Function} useDoctorAppointments - Hook para citas de doctor.
 * @property {Function} createAppointment - Función para crear cita.
 * @property {Function} cancelAppointment - Función para cancelar cita.
 * @property {Function} rescheduleAppointment - Función para reprogramar cita.
 * @property {Function} confirmAttendance - Función para confirmar asistencia.
 * @property {boolean} isCreating - Estado de carga de creación.
 * @property {boolean} isCancelling - Estado de carga de cancelación.
 * @property {boolean} isRescheduling - Estado de carga de reprogramación.
 * @property {boolean} isConfirming - Estado de carga de confirmación.
 *
 * @description
 * Hook principal que combina todos los hooks individuales para facilitar
 * el uso en componentes. Proporciona una API unificada para todas las
 * operaciones de citas médicas.
 *
 * @example
 * ```typescript
 * function AppointmentsManager() {
 *   const {
 *     usePatientAppointments,
 *     createAppointment,
 *     cancelAppointment,
 *     isCreating,
 *     isCancelling
 *   } = useAppointments();
 *
 *   const appointments = usePatientAppointments(userId);
 *
 *   // ... usar las funciones según sea necesario
 * }
 * ```
 */
export function useAppointments() {
  const create = useCreateAppointment();
  const cancel = useCancelAppointment();
  const reschedule = useRescheduleAppointment();
  const confirm = useConfirmAttendance();

  return {
    usePatientAppointments,
    useDoctorAppointments,
    createAppointment: create.mutateAsync,
    cancelAppointment: cancel.mutateAsync,
    rescheduleAppointment: reschedule.mutateAsync,
    confirmAttendance: confirm.mutateAsync,
    isCreating: create.isPending,
    isCancelling: cancel.isPending,
    isRescheduling: reschedule.isPending,
    isConfirming: confirm.isPending,
    createError: create.error,
    cancelError: cancel.error,
    rescheduleError: reschedule.error,
    confirmError: confirm.error,
  };
}
