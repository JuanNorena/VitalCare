/**
 * Página de Dashboard Principal de VitalCare.
 *
 * Esta página sirve como panel de control central para todos los usuarios del sistema médico.
 * Muestra estadísticas personalizadas, citas próximas y acciones rápidas basadas en el rol del usuario.
 * Implementa un diseño responsivo con tema adaptable (claro/oscuro).
 *
 * @example
 * ```tsx
 * // La página se renderiza automáticamente en la ruta /
 * // después de la autenticación del usuario
 * // No requiere instanciación manual
 * ```
 *
 * @description
 * Funcionalidades principales por rol:
 *
 * Para Pacientes:
 * - Visualización de citas próximas y completadas
 * - Estadísticas de citas totales y estado de cuenta
 * - Acciones rápidas: programar nueva cita, ver todas las citas
 * - Modal integrado para citas rápidas
 *
 * Para Doctores:
 * - Dashboard de consultas médicas pendientes y completadas
 * - Vista rápida de próximas consultas con detalles
 * - Acciones: agendar nueva cita, ver todas las consultas, gestionar pacientes
 * - Enfoque en gestión de agenda médica
 *
 * Para Personal Administrativo:
 * - Panel de control administrativo
 * - Acciones: agendar citas, gestión general, panel administrativo
 * - Vista de estadísticas generales del sistema
 *
 * Características técnicas:
 * - Carga dinámica de datos usando React Query
 * - Filtrado automático de citas por estado (scheduled, confirmed, completed)
 * - Formateo de fechas localizado (es-CO)
 * - Saludos dinámicos basados en hora del día
 * - Navegación integrada con React Router
 * - Tema adaptable con variables CSS personalizadas
 * - Diseño responsivo con Tailwind CSS
 *
 * Estados de citas manejados:
 * - 'scheduled': Cita programada
 * - 'confirmed': Cita confirmada
 * - 'completed': Cita completada
 *
 * @see {@link useAuth} para la gestión de autenticación y roles de usuario.
 * @see {@link useAppointments} para los hooks de carga de citas.
 * @see {@link AppointmentsPage} para la vista completa de citas.
 */

import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

/**
 * Página de Dashboard Principal de VitalCare.
 *
 * @component
 * @returns {JSX.Element} Dashboard personalizado según el rol del usuario.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const { usePatientAppointments, useDoctorAppointments } = useAppointments();

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
   * Determina si el usuario actual es personal administrativo.
   * @type {boolean}
   */
  const isStaff = user?.role?.toLowerCase().includes('staff');

  /**
   * SOLUCIÓN AL PROBLEMA User.id ≠ PatientProfile.id:
   * Obtiene el patientProfileId correcto desde localStorage.
   * Si no existe, usa user.id como fallback.
   * @returns {string} ID correcto del paciente
   */
  const getPatientId = (): string => {
    if (!isPatient || !user) return '';
    
    // Intentar obtener el patientProfileId de localStorage
    const storedPatientId = localStorage.getItem(`patientProfileId_${user.id}`);
    
    if (storedPatientId) {
      console.log('✅ [Dashboard] Usando patientProfileId de localStorage:', storedPatientId);
      return storedPatientId;
    }
    
    console.warn('⚠️ [Dashboard] No hay patientProfileId en localStorage. Usando User.id:', user.id);
    return user.id;
  };

  /**
   * Hook para cargar citas del paciente actual.
   * Solo se ejecuta si el usuario es paciente.
   * Usa el patientProfileId correcto obtenido de localStorage.
   */
  const patientAppointments = usePatientAppointments(getPatientId());

  /**
   * Hook para cargar citas del doctor actual.
   * Solo se ejecuta si el usuario es doctor.
   */
  const doctorAppointments = useDoctorAppointments(isDoctor && user ? user.id : '');

  /**
   * Citas del usuario actual (paciente o doctor).
   * Se selecciona automáticamente basado en el rol.
   * @type {Appointment[] | undefined}
   */
  const appointments = isPatient ? patientAppointments.data : doctorAppointments.data;

  /**
   * Filtra las citas próximas (programadas o confirmadas).
   * @type {Appointment[]}
   */
  const upcomingAppointments = appointments?.filter(apt =>
    apt.status?.toLowerCase() === 'scheduled' || apt.status?.toLowerCase() === 'confirmed'
  ) || [];

  /**
   * Filtra las citas completadas.
   * @type {Appointment[]}
   */
  const completedAppointments = appointments?.filter(apt =>
    apt.status?.toLowerCase() === 'completed'
  ) || [];

  /**
   * Filtra las citas canceladas.
   * @type {Appointment[]}
   */
  const cancelledAppointments = appointments?.filter(apt =>
    apt.status?.toLowerCase() === 'cancelled'
  ) || [];

  // Debug logs para verificar estadísticas
  console.log('📊 [Dashboard] Estadísticas:', {
    total: appointments?.length || 0,
    proximas: upcomingAppointments.length,
    completadas: completedAppointments.length,
    canceladas: cancelledAppointments.length,
    isPatient,
    isDoctor,
    userId: user?.id,
    patientProfileId: isPatient ? getPatientId() : 'N/A'
  });

  /**
   * Formatea una fecha para mostrar en formato localizado colombiano.
   *
   * @param {string} dateString - Fecha en formato ISO string.
   * @returns {string} Fecha formateada (ej: "ene 15, 14:30").
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Genera un saludo dinámico basado en la hora del día.
   *
   * @returns {string} Saludo apropiado ('Buenos días', 'Buenas tardes', 'Buenas noches').
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  /**
   * Determina el rol del usuario en formato legible.
   *
   * @returns {string} Rol del usuario ('Paciente', 'Doctor', 'Personal Médico', 'Usuario').
   */
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
          <p className="text-[var(--vc-text)]/70 mt-1">
            Bienvenido a tu panel de control médico
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--vc-text)]/70">
                  {isDoctor ? 'Consultas Pendientes' : 'Citas Próximas'}
                </p>
                <p className="text-2xl font-bold text-[var(--vc-text)]">
                  {upcomingAppointments.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--vc-text)]/70">
                  {isDoctor ? 'Consultas Completadas' : 'Citas Completadas'}
                </p>
                <p className="text-2xl font-bold text-[var(--vc-text)]">
                  {completedAppointments.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--vc-text)]/70">
                  Total de Citas
                </p>
                <p className="text-2xl font-bold text-[var(--vc-text)]">
                  {appointments?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg border-0 bg-[var(--vc-card-bg)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--vc-text)]/70">
                  Estado
                </p>
                <p className="text-lg font-semibold text-green-500 dark:text-green-400">
                  Activo
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
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
                  <div 
                    key={appointment.id} 
                    className="flex items-center justify-between p-4 bg-[var(--vc-card-bg)] border border-[var(--vc-border)] rounded-lg hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {/* Indicador de estado */}
                      <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
                      
                      <div>
                        <p className="text-sm font-medium text-[var(--vc-text)]">
                          Cita #{appointment.id ? appointment.id.substring(0, 8) : 'N/A'}...
                        </p>
                        <p className="text-xs text-[var(--vc-text)]/60 mt-0.5">
                          {formatDate(appointment.scheduledDate)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Badge de estado */}
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-700 bg-blue-100 dark:bg-blue-900/40 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
                      {appointment.status === 'SCHEDULED' ? 'Programada' : 'Confirmada'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-[var(--vc-text)]/40 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <p className="text-[var(--vc-text)]/70">
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
                <Link to="/create-appointment">
                  <Button className="w-full justify-start gap-3" variant="outline">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Programar Nueva Cita
                  </Button>
                </Link>
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
                  Ver Mis Citas
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
    </div>
  );
}
