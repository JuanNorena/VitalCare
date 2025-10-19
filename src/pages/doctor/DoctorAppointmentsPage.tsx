/**
 * Página de Gestión de Citas Médicas para Doctores.
 * 
 * Muestra todas las citas programadas del doctor con opciones para:
 * - Ver detalles de la cita
 * - Iniciar atención médica (crear consulta)
 * - Confirmar asistencia del paciente
 * - Cancelar citas
 * - Acceder al historial médico del paciente
 */

import { useAuth } from '@/hooks/useAuth';
import { useDoctorAppointments, useConfirmAttendance, useCancelAppointment } from '@/hooks/useAppointments';
import { useDoctorProfileId } from '@/hooks/useDoctorProfile';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { AppointmentDTO } from '@/services/appointments';
import { useToast } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CancelAppointmentModal } from '@/components/appointments/CancelAppointmentModal';

/**
 * Página de gestión de citas médicas para doctores.
 * 
 * @component
 * @returns {JSX.Element} Interfaz de gestión de citas del doctor.
 */
export function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<{
    id: string;
    date: string;
  } | null>(null);

  /**
   * ✅ SOLUCIÓN DEFINITIVA: Usa el hook useDoctorProfileId
   * 
   * Este hook:
   * 1. Primero intenta usar user.profileId (si backend está actualizado)
   * 2. Luego busca en localStorage (cache de sesiones previas)
   * 3. Si no encuentra, consulta el backend por email
   * 4. Guarda el resultado en localStorage para futuras sesiones
   * 
   * @returns {string} DoctorProfile.id correcto para consultar citas
   */
  const doctorProfileId = useDoctorProfileId(user || null);
  
  console.log('🔍 [DoctorAppointments] Debug info:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userProfileId: user?.profileId,
    doctorProfileId: doctorProfileId,
    isCorrectProfileId: !!doctorProfileId && doctorProfileId !== user?.id
  });

  // Cargar citas del doctor usando el profileId correcto
  const { data: appointments = [], isLoading, error } = useDoctorAppointments(doctorProfileId);
  const confirmMutation = useConfirmAttendance();
  const cancelMutation = useCancelAppointment();

  /**
   * Formatea una fecha para mostrar en formato localizado colombiano.
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Determina la clase CSS de color para un estado de cita.
   */
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Convierte el estado técnico de la cita a texto legible en español.
   */
  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'Programada';
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  /**
   * Maneja la confirmación de asistencia a una cita médica.
   */
  const handleConfirmAttendance = async (appointmentId: string) => {
    try {
      await confirmMutation.mutateAsync(appointmentId);
      showSuccess('Asistencia confirmada', 'La asistencia del paciente ha sido confirmada exitosamente');
    } catch (error) {
      console.error('Error al confirmar asistencia:', error);
      showError('Error al confirmar asistencia', 'No se pudo confirmar la asistencia. Inténtalo nuevamente.');
    }
  };

  /**
   * Maneja la cancelación de una cita médica.
   */
  const handleCancelAppointment = (appointmentId: string, scheduledDate?: string) => {
    const formattedDate = scheduledDate ? formatDate(scheduledDate) : 'Fecha no especificada';
    setAppointmentToCancel({
      id: appointmentId,
      date: formattedDate
    });
    setShowCancelModal(true);
  };

  /**
   * Confirma y ejecuta la cancelación de la cita.
   */
  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      await cancelMutation.mutateAsync(appointmentToCancel.id);
      showSuccess(
        '✅ Cita cancelada exitosamente', 
        'La cita ha sido cancelada correctamente.'
      );
      setShowCancelModal(false);
      setAppointmentToCancel(null);
    } catch (error) {
      console.error('Error al cancelar cita:', error);
      showError(
        '❌ Error al cancelar cita', 
        'No se pudo cancelar la cita. Por favor, inténtalo nuevamente.'
      );
    }
  };

  /**
   * Cierra el modal de cancelación sin ejecutar la acción.
   */
  const handleCloseCancelModal = () => {
    if (!cancelMutation.isPending) {
      setShowCancelModal(false);
      setAppointmentToCancel(null);
    }
  };

  /**
   * Inicia la atención médica (crea una consulta) para una cita.
   */
  const handleStartConsultation = (appointment: AppointmentDTO) => {
    navigate(`/doctor/consultation/${appointment.id}`, {
      state: { appointment }
    });
  };

  /**
   * Navega al historial médico del paciente.
   */
  const handleViewMedicalHistory = (patientId: string) => {
    navigate(`/doctor/patient/${patientId}/history`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--vc-bg)] px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--vc-text)]">No autorizado</h2>
          <p className="text-[var(--vc-text)]/70 mt-2">Por favor inicia sesión</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--vc-bg)] transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">
                Citas Médicas
              </h1>
              <p className="text-[var(--vc-text)]/70 mt-1">
                Gestiona las citas de tus pacientes
              </p>
            </div>
          </div>
        </div>

        {/* Lista de citas */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
              </div>
              <p className="text-[var(--vc-text)]/70 text-lg font-medium">
                Cargando citas médicas...
              </p>
            </div>
          </div>
        ) : error ? (
          <Card className="p-6 sm:p-8 text-center shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-[var(--vc-text)]/70">
              Error al cargar las citas: {error.message}
            </p>
          </Card>
        ) : appointments && appointments.length > 0 ? (
          <div className="grid gap-4 sm:gap-6">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)] hover:shadow-xl transition-all duration-200">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    {/* Header con estado */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status || 'scheduled')}`}>
                        {getStatusText(appointment.status || 'scheduled')}
                      </span>
                      <span className="text-sm text-[var(--vc-text)]/60">
                        ID: {appointment.id?.substring(0, 8)}...
                      </span>
                    </div>

                    {/* Información del paciente */}
                    <div className="mb-4 p-4 bg-[var(--vc-bg)] rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {appointment.patient?.username?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--vc-text)]">
                            {appointment.patient?.username || appointment.patientEmail || 'Paciente'}
                          </p>
                          <p className="text-sm text-[var(--vc-text)]/60">
                            {appointment.patient?.email || appointment.patientEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detalles de la cita */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-[var(--vc-text)]/70">
                        <svg className="w-5 h-5 text-[var(--vc-text)]/60" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>{formatDate(appointment.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--vc-text)]/70">
                        <svg className="w-5 h-5 text-[var(--vc-text)]/60" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>Sede: {appointment.siteId?.substring(0, 8) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex flex-col gap-2 w-full lg:w-auto lg:min-w-[200px]">
                    {(appointment.status?.toLowerCase() === 'scheduled' || appointment.status?.toLowerCase() === 'confirmed') && (
                      <>
                        <Button
                          onClick={() => handleStartConsultation(appointment)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Iniciar Atención
                        </Button>
                        
                        {appointment.status?.toLowerCase() === 'scheduled' && (
                          <Button
                            onClick={() => handleConfirmAttendance(appointment.id!)}
                            disabled={confirmMutation.isPending}
                            variant="outline"
                            className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/30"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Confirmar Asistencia
                          </Button>
                        )}

                        <Button
                          onClick={() => appointment.patientId && handleViewMedicalHistory(appointment.patientId)}
                          variant="outline"
                          className="w-full"
                          disabled={!appointment.patientId}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </svg>
                          Ver Historial
                        </Button>

                        <Button
                          onClick={() => handleCancelAppointment(appointment.id!, appointment.scheduledDate)}
                          disabled={cancelMutation.isPending}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Cancelar Cita
                        </Button>
                      </>
                    )}

                    {appointment.status?.toLowerCase() === 'completed' && (
                      <Button
                        onClick={() => appointment.patientId && handleViewMedicalHistory(appointment.patientId)}
                        variant="outline"
                        className="w-full"
                        disabled={!appointment.patientId}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Ver Consulta
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[var(--vc-text)] mb-3">
                No hay citas programadas
              </h3>
              <p className="text-[var(--vc-text)]/70 mb-6">
                No se han encontrado citas en tu agenda médica.
              </p>
            </div>
          </Card>
        )}
      </main>

      {/* Modal de Confirmación para Cancelar Cita */}
      <CancelAppointmentModal
        isOpen={showCancelModal}
        onClose={handleCloseCancelModal}
        onConfirm={confirmCancelAppointment}
        appointmentDate={appointmentToCancel?.date || ''}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
