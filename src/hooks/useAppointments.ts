/**
 * Hook para manejo de citas médicas
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointments';
import type { 
  Appointment, 
  CreateAppointmentRequest 
} from '@/types/api';

export function useAppointments() {
  const queryClient = useQueryClient();

  // Hook para obtener citas por paciente
  const usePatientAppointments = (patientId: string) => {
    return useQuery<Appointment[]>({
      queryKey: ['appointments', 'patient', patientId],
      queryFn: () => appointmentService.getAppointmentsByPatient(patientId),
      enabled: !!patientId,
    });
  };

  // Hook para obtener citas por doctor
  const useDoctorAppointments = (doctorId: string) => {
    return useQuery<Appointment[]>({
      queryKey: ['appointments', 'doctor', doctorId],
      queryFn: () => appointmentService.getAppointmentsByDoctor(doctorId),
      enabled: !!doctorId,
    });
  };

  // Mutation para crear cita
  const createAppointmentMutation = useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Mutation para cancelar cita
  const cancelAppointmentMutation = useMutation({
    mutationFn: appointmentService.cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Mutation para reprogramar cita
  const rescheduleAppointmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      appointmentService.rescheduleAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Mutation para confirmar asistencia
  const confirmAttendanceMutation = useMutation({
    mutationFn: appointmentService.confirmAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    // Hooks secundarios
    usePatientAppointments,
    useDoctorAppointments,

    // Acciones
    createAppointment: createAppointmentMutation.mutateAsync,
    cancelAppointment: cancelAppointmentMutation.mutateAsync,
    rescheduleAppointment: rescheduleAppointmentMutation.mutateAsync,
    confirmAttendance: confirmAttendanceMutation.mutateAsync,

    // Estados de carga
    isCreating: createAppointmentMutation.isPending,
    isCancelling: cancelAppointmentMutation.isPending,
    isRescheduling: rescheduleAppointmentMutation.isPending,
    isConfirming: confirmAttendanceMutation.isPending,

    // Errores
    createError: createAppointmentMutation.error,
    cancelError: cancelAppointmentMutation.error,
    rescheduleError: rescheduleAppointmentMutation.error,
    confirmError: confirmAttendanceMutation.error,
  };
}
