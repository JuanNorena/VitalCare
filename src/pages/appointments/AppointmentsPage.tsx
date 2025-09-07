/**
 * Página principal de citas médicas
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CreateAppointmentModal } from '@/components/appointments/CreateAppointmentModal';
import type { CreateAppointmentRequest } from '@/types/api';

export function AppointmentsPage() {
  const { user } = useAuth();
  const { 
    usePatientAppointments, 
    useDoctorAppointments,
    createAppointment,
    cancelAppointment,
    confirmAttendance,
    isCreating,
    isCancelling,
    isConfirming
  } = useAppointments();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Determinar qué tipo de usuario es y obtener sus citas
  const isPatient = user?.role?.toLowerCase().includes('patient');
  const isDoctor = user?.role?.toLowerCase().includes('doctor');
  
  const patientAppointments = usePatientAppointments(isPatient && user ? user.id : '');
  const doctorAppointments = useDoctorAppointments(isDoctor && user ? user.id : '');
  
  const appointments = isPatient ? patientAppointments.data : doctorAppointments.data;
  const isLoading = isPatient ? patientAppointments.isLoading : doctorAppointments.isLoading;

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      try {
        await cancelAppointment(appointmentId);
      } catch (error) {
        console.error('Error al cancelar cita:', error);
      }
    }
  };

  const handleConfirmAttendance = async (appointmentId: string) => {
    try {
      await confirmAttendance(appointmentId);
    } catch (error) {
      console.error('Error al confirmar asistencia:', error);
    }
  };

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
          <p className="text-gray-600 dark:text-gray-400 mt-2">Por favor inicia sesión</p>
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
              <p className="text-gray-600 dark:text-gray-400 mt-1">
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

        {/* Formulario de crear cita (solo para pacientes) */}
        {showCreateForm && isPatient && (
          <Card className="p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border-0 bg-[var(--vc-card-bg)] dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--vc-text)] dark:text-white">
                Programar Nueva Cita
              </h3>
            </div>
            <CreateAppointmentForm 
              onSubmit={async (data) => {
                try {
                  await createAppointment(data);
                  setShowCreateForm(false);
                } catch (error) {
                  console.error('Error al crear cita:', error);
                }
              }}
              isLoading={isCreating}
              currentUserId={user.id}
            />
          </Card>
        )}

        {/* Lista de citas */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-[var(--vc-text)] dark:text-gray-400">Cargando citas...</div>
          </div>
        ) : appointments && appointments.length > 0 ? (
          <div className="grid gap-4 sm:gap-6">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="p-4 sm:p-6 shadow-lg border-0 bg-[var(--vc-card-bg)] dark:bg-gray-800 hover:shadow-xl transition-all duration-200">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h3 className="text-base sm:text-lg font-semibold text-[var(--vc-text)] dark:text-white truncate">
                          Cita #{appointment.id.substring(0, 8)}...
                        </h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm sm:text-base text-[var(--vc-text)] dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--vc-text)] dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span><strong>Fecha:</strong> {formatDate(appointment.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--vc-text)] dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="break-all"><strong>Paciente:</strong> {appointment.patientId.substring(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--vc-text)] dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="break-all"><strong>Doctor:</strong> {appointment.doctorId.substring(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--vc-text)] dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="break-all"><strong>Sede:</strong> {appointment.siteId.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto lg:ml-4">
                    {appointment.status?.toLowerCase() === 'scheduled' && (
                      <>
                        {isDoctor && (
                          <Button
                            onClick={() => handleConfirmAttendance(appointment.id)}
                            disabled={isConfirming}
                            size="sm"
                            className="flex-1 lg:flex-initial text-xs sm:text-sm"
                          >
                            Confirmar
                          </Button>
                        )}
                        <Button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={isCancelling}
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
          <Card className="p-6 sm:p-8 text-center shadow-lg border-0 bg-[var(--vc-card-bg)] dark:bg-gray-800">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--vc-bg)] dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--vc-text)] dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-[var(--vc-text)] dark:text-gray-400">
              <p className="text-base sm:text-lg font-medium text-[var(--vc-text)] dark:text-white mb-2">
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

// Componente de formulario para crear cita
interface CreateAppointmentFormProps {
  onSubmit: (data: CreateAppointmentRequest) => Promise<void>;
  isLoading: boolean;
  currentUserId: string;
}

function CreateAppointmentForm({ onSubmit, isLoading, currentUserId }: CreateAppointmentFormProps) {
  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    patientId: currentUserId,
    doctorId: '',
    siteId: '',
    scheduledDate: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label htmlFor="doctorId" className="block text-sm font-medium text-[var(--vc-text)] dark:text-gray-300 mb-1">
            ID del Doctor *
          </label>
          <input
            id="doctorId"
            name="doctorId"
            type="text"
            required
            value={formData.doctorId}
            onChange={handleInputChange}
            placeholder="Ingresa el ID del doctor"
            className="w-full h-10 sm:h-11 px-3 sm:px-4 text-sm sm:text-base rounded-lg border border-[var(--vc-border)] bg-[var(--vc-input-bg)] text-[var(--vc-text)] focus:outline-none focus:ring-2 focus:ring-[var(--vc-button-primary)] focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label htmlFor="siteId" className="block text-sm font-medium text-[var(--vc-text)] dark:text-gray-300 mb-1">
            ID de la Sede *
          </label>
          <input
            id="siteId"
            name="siteId"
            type="text"
            required
            value={formData.siteId}
            onChange={handleInputChange}
            placeholder="Ingresa el ID de la sede"
            className="w-full h-10 sm:h-11 px-3 sm:px-4 text-sm sm:text-base rounded-lg border border-[var(--vc-border)] bg-[var(--vc-input-bg)] text-[var(--vc-text)] focus:outline-none focus:ring-2 focus:ring-[var(--vc-button-primary)] focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <div>
  <label htmlFor="scheduledDate" className="block text-sm font-medium text-[var(--vc-text)] dark:text-gray-300 mb-1">
          Fecha y Hora *
        </label>
        <input
          id="scheduledDate"
          name="scheduledDate"
          type="datetime-local"
          required
          value={formData.scheduledDate}
          onChange={handleInputChange}
          className="w-full h-10 sm:h-11 px-3 sm:px-4 text-sm sm:text-base rounded-lg border border-[var(--vc-border)] bg-[var(--vc-input-bg)] text-[var(--vc-text)] focus:outline-none focus:ring-2 focus:ring-[var(--vc-button-primary)] focus:border-transparent transition-all duration-200"
        />
      </div>

      <div className="flex justify-end pt-2 sm:pt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full sm:w-auto text-sm sm:text-base"
        >
          {isLoading ? 'Creando...' : 'Programar Cita'}
        </Button>
      </div>
    </form>
  );
}
