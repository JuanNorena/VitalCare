/**
 * Página de Gestión de Citas Médicas de VitalCare.
 *
 * Esta página permite a pacientes y doctores gestionar completamente sus citas médicas.
 * Ofrece funcionalidades diferenciadas según el rol del usuario con interfaz adaptativa.
 * Incluye creación, visualización, cancelación y confirmación de citas médicas.
 *
 * @example
 * ```tsx
 * // La página se renderiza automáticamente en la ruta /appointments
 * // Requiere autenticación previa del usuario
 * // No requiere instanciación manual
 * ```
 *
 * @description
 * Funcionalidades principales:
 *
 * Para Pacientes:
 * - Visualización completa de todas sus citas médicas
 * - Creación de nuevas citas mediante formulario o modal
 * - Cancelación de citas programadas
 * - Vista detallada con información del doctor y sede
 * - Estados de citas: programada, confirmada, completada, cancelada
 *
 * Para Doctores:
 * - Dashboard de todas las consultas asignadas
 * - Confirmación de asistencia de pacientes
 * - Cancelación de citas cuando sea necesario
 * - Vista de pacientes asignados con IDs completos
 * - Gestión eficiente de agenda médica
 *
 * Características técnicas:
 * - Carga asíncrona de datos usando React Query
 * - Estados de carga y manejo de errores robusto
 * - Formulario integrado para creación rápida de citas
 * - Modal separado para creación avanzada de citas
 * - Diseño responsivo con breakpoints móviles
 * - Tema adaptable (claro/oscuro) con variables CSS
 * - Notificaciones toast para feedback de usuario
 * - Formateo de fechas localizado (es-CO)
 * - Estados de citas con colores diferenciados
 *
 * Estados de citas manejados:
 * - 'scheduled': Cita programada (azul)
 * - 'confirmed': Cita confirmada (verde)
 * - 'cancelled': Cita cancelada (rojo)
 * - 'completed': Cita completada (gris)
 *
 * Componentes internos:
 * - CreateAppointmentForm: Formulario inline para creación rápida
 * - CreateAppointmentModal: Modal avanzado para creación detallada
 *
 * @see {@link useAuth} para la gestión de autenticación y roles.
 * @see {@link useAppointments} para los hooks de gestión de citas.
 * @see {@link CreateAppointmentModal} para el modal de creación avanzada.
 * @see {@link CreateAppointmentRequest} para la estructura de datos de creación.
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  usePatientAppointments,
  useDoctorAppointments,
  useCancelAppointment,
  useConfirmAttendance 
} from '@/hooks/useAppointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreateAppointmentModal } from '@/components/appointments/CreateAppointmentModal';
import type { AppointmentDTO } from '@/services/appointments';
import { useToast } from '@/contexts/ToastContext';

/**
 * Página de Gestión de Citas Médicas de VitalCare.
 *
 * @component
 * @returns {JSX.Element} Interfaz de gestión de citas adaptada al rol del usuario.
 */
export function AppointmentsPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  /**
   * Controla la visibilidad del modal de creación de citas.
   * @type {boolean}
   */
  const [showCreateModal, setShowCreateModal] = useState(false);

  /**
   * Determina si el usuario actual es un paciente.
   * @type {boolean}
   */
  const isPatient = user?.role?.toLowerCase().includes('patient');

  /**
   * Determina si el usuario actual es un doctor.
   * @type {boolean}
   */
  const isDoctor = user?.role?.toLowerCase().includes('doctor');

  /**
   * Hook para cargar citas del paciente actual.
   * Solo se ejecuta si el usuario es paciente.
   */
  const patientAppointments = usePatientAppointments(isPatient && user ? user.id : '');

  /**
   * Hook para cargar citas del doctor actual.
   * Solo se ejecuta si el usuario es doctor.
   */
  const doctorAppointments = useDoctorAppointments(isDoctor && user ? user.id : '');

  // Debug logging
  console.log('[AppointmentsPage] Usuario:', user);
  console.log('[AppointmentsPage] Es paciente:', isPatient);
  console.log('[AppointmentsPage] Es doctor:', isDoctor);
  console.log('[AppointmentsPage] User ID:', user?.id);
  console.log('[AppointmentsPage] Patient appointments query:', patientAppointments);
  console.log('[AppointmentsPage] Doctor appointments query:', doctorAppointments);

  /**
   * Mutations individuales para operaciones de citas.
   */
  const cancelMutation = useCancelAppointment();
  const confirmMutation = useConfirmAttendance();

  /**
   * Lista de citas del usuario actual (paciente o doctor).
   * @type {AppointmentDTO[]}
   */
  const appointments: AppointmentDTO[] = isPatient ? patientAppointments.data || [] : doctorAppointments.data || [];

  /**
   * Estado de carga de las citas.
   * @type {boolean}
   */
  const isLoading = isPatient ? patientAppointments.isLoading : doctorAppointments.isLoading;

  /**
   * Estado de error de las citas.
   * @type {Error | null}
   */
  const error = isPatient ? patientAppointments.error : doctorAppointments.error;

  // Debug logging adicional
  console.log('[AppointmentsPage] Appointments data:', appointments);
  console.log('[AppointmentsPage] IsLoading:', isLoading);
  console.log('[AppointmentsPage] Error:', error);
  console.log('[AppointmentsPage] Raw query data - Patient:', patientAppointments.data);
  console.log('[AppointmentsPage] Raw query data - Doctor:', doctorAppointments.data);

  /**
   * Estados de loading para las mutations (no se usan actualmente).
   */
  // const isCreating = createMutation.isPending;
  const isCancelling = cancelMutation.isPending;
  const isConfirming = confirmMutation.isPending;

  /**
   * Maneja la cancelación de una cita médica.
   * Solicita confirmación del usuario antes de proceder.
   *
   * @param {string} appointmentId - ID único de la cita a cancelar.
   * @returns {Promise<void>} No retorna valor.
   *
   * @description
   * Proceso de cancelación:
   * 1. Muestra diálogo de confirmación al usuario
   * 2. Si confirma, llama al servicio de cancelación
   * 3. Muestra notificación de éxito
   * 4. Maneja errores y muestra notificación de error
   */
  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      try {
        await cancelMutation.mutateAsync(appointmentId);
        showSuccess('Cita cancelada', 'La cita ha sido cancelada exitosamente');
      } catch (error) {
        console.error('Error al cancelar cita:', error);
        showError('Error al cancelar cita', 'No se pudo cancelar la cita. Inténtalo nuevamente.');
      }
    }
  };

  /**
   * Maneja la confirmación de asistencia a una cita médica.
   * Solo disponible para doctores.
   *
   * @param {string} appointmentId - ID único de la cita.
   * @returns {Promise<void>} No retorna valor.
   *
   * @description
   * Proceso de confirmación:
   * 1. Llama al servicio de confirmación de asistencia
   * 2. Muestra notificación de éxito
   * 3. Maneja errores y muestra notificación de error
   */
  const handleConfirmAttendance = async (appointmentId: string) => {
    try {
      await confirmMutation.mutateAsync(appointmentId);
      showSuccess('Asistencia confirmada', 'La asistencia a la cita ha sido confirmada exitosamente');
    } catch (error) {
      console.error('Error al confirmar asistencia:', error);
      showError('Error al confirmar asistencia', 'No se pudo confirmar la asistencia. Inténtalo nuevamente.');
    }
  };

  /**
   * Formatea una fecha para mostrar en formato localizado colombiano.
   * Incluye año completo para mejor claridad.
   *
   * @param {string} dateString - Fecha en formato ISO string.
   * @returns {string} Fecha formateada completa (ej: "15 de enero de 2024, 14:30").
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
   * Utiliza colores semánticos para mejor comprensión visual.
   *
   * @param {string} status - Estado de la cita.
   * @returns {string} Clases CSS de Tailwind para el color del estado.
   */
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Convierte el estado técnico de la cita a texto legible en español.
   *
   * @param {string} status - Estado técnico de la cita.
   * @returns {string} Estado en español o el estado original si no se reconoce.
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
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">
                {isDoctor ? 'Consultas Médicas' : 'Mis Citas Médicas'}
              </h1>
              <p className="text-[var(--vc-text)]/70 mt-1">
                {isDoctor ? 'Gestiona las citas de tus pacientes' : 'Administra tus citas médicas'}
              </p>
            </div>
            {isPatient && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Nueva Cita
              </Button>
            )}
          </div>
        </div>

        {/* Formulario de crear cita eliminado - Solo usar modal */}

        {/* Lista de citas */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-[var(--vc-text)]/70">Cargando citas...</div>
          </div>
        ) : error ? (
          <Card className="p-6 sm:p-8 text-center shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-[var(--vc-text)]/70">
              <p className="text-base sm:text-lg font-medium text-red-500 dark:text-red-400 mb-2">
                Error al cargar las citas
              </p>
              <p className="text-sm sm:text-base">
                {error?.message || 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.'}
              </p>
            </div>
          </Card>
        ) : appointments && appointments.length > 0 ? (
          <div className="grid gap-4 sm:gap-6">
            {appointments.map((appointment: any) => (
              <Card key={appointment.id} className="p-4 sm:p-6 shadow-lg border-0 bg-[var(--vc-card-bg)] hover:shadow-xl transition-all duration-200">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h3 className="text-base sm:text-lg font-semibold text-[var(--vc-text)] truncate">
                          Cita #{appointment.id ? `${appointment.id.substring(0, 8)}...` : 'N/A'}
                        </h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(appointment.status || 'COMPLETED')}`}>
                        {getStatusText(appointment.status || 'COMPLETED')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm sm:text-base text-[var(--vc-text)]/70">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--vc-text)]/60" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span><strong>Fecha:</strong> {formatDate(appointment.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--vc-text)]/60" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="break-all">
                          <strong>Paciente:</strong> {
                            appointment.patientId 
                              ? `${appointment.patientId.substring(0, 8)}...` 
                              : appointment.patientEmail || 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--vc-text)]/60" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="break-all"><strong>Doctor:</strong> {appointment.doctorId.substring(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--vc-text)]/60" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="break-all"><strong>Sede:</strong> {appointment.siteId ? `${appointment.siteId.substring(0, 8)}...` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto lg:ml-4">
                    {appointment.status?.toLowerCase() === 'scheduled' && (
                      <>
                        {isDoctor && (
                          <Button
                            onClick={() => appointment.id && handleConfirmAttendance(appointment.id)}
                            disabled={isConfirming || !appointment.id}
                            size="sm"
                            className="flex-1 lg:flex-initial text-xs sm:text-sm"
                          >
                            Confirmar
                          </Button>
                        )}
                        <Button
                          onClick={() => appointment.id && handleCancelAppointment(appointment.id)}
                          disabled={isCancelling || !appointment.id}
                          variant="outline"
                          size="sm"
                          className="flex-1 lg:flex-initial text-xs sm:text-sm"
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 sm:p-8 text-center shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--vc-bg)] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--vc-text)]/40" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-[var(--vc-text)]/70">
              <p className="text-base sm:text-lg font-medium text-[var(--vc-text)] mb-2">
                No tienes citas programadas
              </p>
              {isPatient && (
                <p className="text-sm sm:text-base">
                  Haz clic en "Nueva Cita" para programar tu primera cita médica.
                </p>
              )}
            </div>
          </Card>
        )}
      </main>

      {/* Modal para crear nueva cita */}
      <CreateAppointmentModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
