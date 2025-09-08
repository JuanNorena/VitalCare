/**
 * Página de dashboard principal
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { CreateAppointmentModal } from '@/components/appointments/CreateAppointmentModal';

export function DashboardPage() {
  const { user } = useAuth();
  const { usePatientAppointments, useDoctorAppointments } = useAppointments();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isPatient = user?.role?.toLowerCase().includes('patient');
  const isDoctor = user?.role?.toLowerCase().includes('doctor');
  const isStaff = user?.role?.toLowerCase().includes('staff');

  const patientAppointments = usePatientAppointments(isPatient && user ? user.id : '');
  const doctorAppointments = useDoctorAppointments(isDoctor && user ? user.id : '');
  
  const appointments = isPatient ? patientAppointments.data : doctorAppointments.data;

  // Estadísticas rápidas
  const upcomingAppointments = appointments?.filter(apt => 
    apt.status?.toLowerCase() === 'scheduled' || apt.status?.toLowerCase() === 'confirmed'
  ) || [];
  
  const completedAppointments = appointments?.filter(apt => 
    apt.status?.toLowerCase() === 'completed'
  ) || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getUserRole = () => {
    if (isPatient) return 'Paciente';
    if (isDoctor) return 'Doctor';
    if (isStaff) return 'Personal Médico';
    return 'Usuario';
  };

  return (
    <div className="min-h-full bg-[var(--vc-bg)] transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header de bienvenida */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">
            {getGreeting()}, {getUserRole()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Bienvenido a tu panel de control médico
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isDoctor ? 'Consultas Pendientes' : 'Citas Próximas'}
                </p>
                <p className="text-2xl font-bold text-[var(--vc-text)]">
                  {upcomingAppointments.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isDoctor ? 'Consultas Completadas' : 'Citas Completadas'}
                </p>
                <p className="text-2xl font-bold text-[var(--vc-text)]">
                  {completedAppointments.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Citas
                </p>
                <p className="text-2xl font-bold text-[var(--vc-text)]">
                  {appointments?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Estado
                </p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Activo
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Sección de acciones rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Próximas citas */}
          <Card className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--vc-text)]">
                {isDoctor ? 'Próximas Consultas' : 'Próximas Citas'}
              </h3>
              <Link to="/appointments">
                <Button variant="outline" size="sm">
                  Ver todas
                </Button>
              </Link>
            </div>
            
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Cita #{appointment.id ? appointment.id.substring(0, 8) : 'N/A'}...
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(appointment.scheduledDate)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full">
                      {appointment.status === 'SCHEDULED' ? 'Programada' : 'Confirmada'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">
                  No tienes citas próximas
                </p>
              </div>
            )}
          </Card>

          {/* Acciones rápidas */}
          <Card className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <h3 className="text-lg font-semibold text-[var(--vc-text)] mb-4">
              Acciones Rápidas
            </h3>
            
            <div className="space-y-3">
              {isPatient && (
                <>
                  <Link to="/create-appointment">
                    <Button className="w-full justify-start gap-3" variant="outline">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Programar Nueva Cita
                    </Button>
                  </Link>
                  
                  <Button 
                    className="w-full justify-start gap-3" 
                    variant="outline"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Cita Rápida (Modal)
                  </Button>
                </>
              )}
              
              {!isPatient && (
                <Link to="/create-appointment">
                  <Button className="w-full justify-start gap-3" variant="outline">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Agendar Nueva Cita
                  </Button>
                </Link>
              )}
              
              <Link to="/appointments">
                <Button className="w-full justify-start gap-3" variant="outline">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Ver Todas las Citas
                </Button>
              </Link>

              {isDoctor && (
                <Button className="w-full justify-start gap-3" variant="outline">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  Ver Mis Pacientes
                </Button>
              )}

              {isStaff && (
                <Button className="w-full justify-start gap-3" variant="outline">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Panel de Administración
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* Modal para crear nueva cita */}
      <CreateAppointmentModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
