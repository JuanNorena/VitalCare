/**
 * Hook para manejo de citas médicas
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointments';
import type { Appointment } from '@/types/api';

// Hooks de lectura (top-level) — evitan advertencias del plugin de Hooks
export const usePatientAppointments = (patientId: string) => {
  return useQuery<Appointment[]>({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: () => appointmentService.getAppointmentsByPatient(patientId),
    enabled: !!patientId,
  });
};

export const useDoctorAppointments = (doctorId: string) => {
  return useQuery<Appointment[]>({
    queryKey: ['appointments', 'doctor', doctorId],
    queryFn: () => appointmentService.getAppointmentsByDoctor(doctorId),
    enabled: !!doctorId,
  });
};

// Hooks de escritura (mutations) — también top-level
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentService.cancelAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      appointmentService.rescheduleAppointment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

export const useConfirmAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentService.confirmAttendance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });
};

// API agrupada para compatibilidad con código existente
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
