/**
 * Página React para crear nuevas citas médicas en VitalCare.
 *
 * Esta página proporciona una interfaz completa para que pacientes, doctores y personal
 * administrativo puedan crear nuevas citas médicas. Incluye validaciones robustas,
 * manejo de roles de usuario, normalización de fechas y navegación automática.
 *
 * @description
 * Funcionalidades principales:
 * - Creación de citas médicas con formulario completo
 * - Selección de doctores con dropdown dinámico
 * - Manejo de roles: pacientes pueden solicitar citas, doctores/staff pueden agendar
 * - Validaciones en tiempo real con mensajes de error específicos
 * - Normalización automática de fechas para compatibilidad con backend
 * - Integración con sistema de notificaciones toast
 * - Navegación automática después de crear cita exitosamente
 * - Interfaz responsive con diseño moderno
 * - Soporte completo para modo oscuro
 * - Creación por email cuando no se conoce el patientId
 *
 * La página se adapta dinámicamente según el rol del usuario:
 * - Pacientes: Solo pueden solicitar citas para sí mismos
 * - Doctores/Staff: Pueden agendar citas para cualquier paciente
 *
 * @example
 * ```typescript
 * import { CreateAppointmentPage } from '@/pages/appointments/CreateAppointmentPage';
 *
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/appointments/create" element={<CreateAppointmentPage />} />
 *     </Routes>
 *   );
 * }
 * ```
 *
 * @see {@link useAppointments} para el hook que maneja la lógica de citas.
 * @see {@link useAuth} para el hook de autenticación.
 * @see {@link useToast} para el sistema de notificaciones.
 * @see {@link doctorService} para el servicio de doctores.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { useNavigate } from 'react-router-dom';
import type { CreateAppointmentRequest } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';
import { doctorService } from '@/services/doctors';
import type { DoctorProfileDTO } from '@/services/doctors';

/**
 * Componente de página CreateAppointmentPage para crear nuevas citas médicas.
 *
 * @component
 * @returns {JSX.Element} Página completa con formulario para crear citas.
 *
 * @description
 * Esta página renderiza un formulario completo para crear citas médicas con:
 * - Campos dinámicos según el rol del usuario
 * - Validaciones en tiempo real
 * - Manejo de errores con notificaciones toast
 * - Navegación automática al completar
 * - Diseño responsive y accesible
 *
 * @example
 * ```typescript
 * <CreateAppointmentPage />
 * ```
 */
export function CreateAppointmentPage() {
  /**
   * Hook de autenticación para obtener información del usuario actual.
   * @type {Object}
   */
  const { user } = useAuth();

  /**
   * Hook de citas para acceder a la funcionalidad de crear citas.
   * @type {Object}
   */
  const { createAppointment, isCreating } = useAppointments();

  /**
   * Hook de navegación de React Router para redireccionar después de crear cita.
   * @type {Function}
   */
  const navigate = useNavigate();

  /**
   * Hook de notificaciones toast para mostrar mensajes de éxito y error.
   * @type {Object}
   */
  const { showError, showSuccess } = useToast();

  /**
   * Estado del formulario que mantiene los datos de la nueva cita.
   * Se inicializa con valores por defecto basados en el usuario actual.
   * Para pacientes, se usa automáticamente su email.
   * @type {CreateAppointmentRequest}
   */
  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    doctorId: '',
    siteId: '',
    scheduledDate: '',
    // Solo usar email para crear citas
    patientEmail: user?.email || ''
  });

  /**
   * Estado para manejar errores de validación del formulario.
   * Cada clave corresponde a un campo del formulario con su mensaje de error.
   * @type {Record<string, string>}
   */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Estado para almacenar la lista de doctores disponibles.
   * Se carga automáticamente al montar el componente.
   * @type {DoctorProfileDTO[]}
   */
  const [doctors, setDoctors] = useState<DoctorProfileDTO[]>([]);

  /**
   * Estado para controlar el loading de la carga de doctores.
   * @type {boolean}
   */
  const [isLoadingDoctors, setIsLoadingDoctors] = useState<boolean>(false);

  /**
   * Determina si el usuario actual es un paciente basado en su rol.
   * Esto afecta qué campos se muestran y cómo se comporta el formulario.
   * @type {boolean}
   */
  const isPatient = user?.role?.toLowerCase().includes('patient');

  /**
   * Efecto que configura automáticamente el email del paciente basado en el usuario autenticado.
   * Para pacientes, usa su propio email. Para doctores/staff, deja el campo vacío
   * para que sea ingresado manualmente.
   */
  useEffect(() => {
    if (isPatient && user?.email) {
      setFormData(prev => ({ ...prev, patientEmail: user.email }));
    } else {
      setFormData(prev => ({ ...prev, patientEmail: '' }));
    }
  }, [isPatient, user?.email]);

  /**
   * Efecto para cargar la lista de doctores disponibles al montar el componente.
   * Se ejecuta una sola vez al cargar la página para poblar el dropdown de doctores.
   */
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsLoadingDoctors(true);
        console.log('🔍 [CreateAppointmentPage] Cargando doctores disponibles...');
        
        const doctorsList = await doctorService.getAllDoctors();
        setDoctors(doctorsList);
        
        console.log('✅ [CreateAppointmentPage] Doctores cargados:', doctorsList.length);
      } catch (error) {
        console.error('❌ [CreateAppointmentPage] Error al cargar doctores:', error);
        showError('Error al cargar la lista de doctores');
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Manejador de cambios en los inputs del formulario.
   * Actualiza el estado del formulario y limpia errores específicos cuando el usuario
   * comienza a escribir en un campo que tenía error.
   *
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - Evento de cambio.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error específico cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Función de validación del formulario.
   * Verifica todos los campos requeridos y reglas de negocio específicas.
   * Actualiza el estado de errores y retorna si el formulario es válido.
   *
   * @returns {boolean} true si el formulario es válido, false en caso contrario.
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones según el rol
    if (!isPatient) {
      // Para doctores/staff: deben proporcionar email del paciente
      if (!formData.patientEmail?.trim()) {
        newErrors.patientEmail = 'Email del paciente es requerido';
      }
      
      // Validar formato de email si se proporciona
      if (formData.patientEmail?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.patientEmail)) {
          newErrors.patientEmail = 'Formato de email inválido';
        }
      }
    } else {
      // Para pacientes: validar que el email esté presente
      if (!formData.patientEmail?.trim()) {
        newErrors.patientEmail = 'Tu email es requerido';
      }
    }

    if (!formData.doctorId.trim()) {
      newErrors.doctorId = 'Debe seleccionar un doctor';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Fecha y hora son requeridas';
    }

    // Validar que la fecha sea futura
    if (formData.scheduledDate) {
      const selectedDate = new Date(formData.scheduledDate);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.scheduledDate = 'La fecha debe ser futura';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Manejador del envío del formulario.
   * Valida el formulario, normaliza la fecha y crea la cita.
   * Maneja errores y muestra notificaciones apropiadas.
   *
   * @param {React.FormEvent} e - Evento de envío del formulario.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Error de validación', 'Por favor revisa los campos marcados');
      return;
    }

    try {
      /**
       * Función interna para normalizar la fecha antes de enviar al backend.
       * Convierte formatos de fecha para compatibilidad con LocalDateTime de Java.
       *
       * @param {string} dateString - Cadena de fecha a normalizar.
       * @returns {string} Fecha normalizada.
       */
      const normalizeScheduledDate = (dateString: string) => {
        if (!dateString) return dateString;
        // Si el datetime-local produce "YYYY-MM-DDTHH:mm", agregar segundos
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
          return `${dateString}:00`;
        }
        // Si tiene Z al final, quitarlo para LocalDateTime
        if (dateString.endsWith('Z')) {
          return dateString.replace(/Z$/, '');
        }
        return dateString;
      };

      const appointmentData: CreateAppointmentRequest = {
        ...formData,
        scheduledDate: normalizeScheduledDate(formData.scheduledDate),
        // Eliminar campos vacíos opcionales
        ...(formData.siteId ? { siteId: formData.siteId } : {})
      };

      // El hook useCreateAppointment ahora detecta automáticamente qué endpoint usar
      console.log('🔄 [CreateAppointmentPage] Creando cita con datos:', appointmentData);
      await createAppointment(appointmentData);

      showSuccess(
        'Cita creada exitosamente',
        isPatient ? 'Tu cita ha sido programada correctamente' : 'La cita ha sido agendada correctamente'
      );

      // Redirigir a la página de citas después de crear
      navigate('/appointments');

    } catch (error) {
      console.error('Error al crear cita:', error);
      showError('Error al crear cita', 'No se pudo crear la cita. Inténtalo nuevamente.');
    }
  };

  /**
   * Manejador para cancelar la creación de cita.
   * Redirige al usuario de vuelta a la página de citas sin guardar cambios.
   */
  const handleCancel = () => {
    navigate('/appointments');
  };

  return (
    <div className="min-h-full bg-[var(--vc-bg)] transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="p-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">
                {isPatient ? 'Solicitar Nueva Cita' : 'Agendar Nueva Cita'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isPatient
                  ? 'Completa el formulario para solicitar tu cita médica'
                  : 'Completa el formulario para agendar una cita para un paciente'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <Card className="p-6 sm:p-8 shadow-lg border-0 bg-[var(--vc-card-bg)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campo de email del paciente - Solo visible para doctores y staff */}
              {!isPatient && (
                <div className="md:col-span-2">
                  <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                    Email del Paciente *
                  </label>
                  <Input
                    id="patientEmail"
                    name="patientEmail"
                    type="email"
                    value={formData.patientEmail || ''}
                    onChange={handleInputChange}
                    placeholder="Ingresa el email del paciente"
                    className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${errors.patientEmail ? 'border-red-500' : ''}`}
                  />
                  {errors.patientEmail && (
                    <div className="mt-1 px-3 py-1 bg-red-500 text-white text-sm rounded">
                      {errors.patientEmail}
                    </div>
                  )}
                </div>
              )}

              {/* Para pacientes - mostrar email como solo lectura */}
              {isPatient && (
                <div className="md:col-span-2">
                  <label htmlFor="patientEmailReadonly" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                    Tu Email
                  </label>
                  <Input
                    id="patientEmailReadonly"
                    type="email"
                    value={formData.patientEmail || ''}
                    readOnly
                    className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Se usará tu email registrado para la cita médica
                  </p>
                </div>
              )}

              {/* Selector de Doctor */}
              <div>
                <label htmlFor="doctorId" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                  Doctor *
                </label>
                <select
                  id="doctorId"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleInputChange}
                  disabled={isLoadingDoctors}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.doctorId ? 'border-red-500' : ''}`}
                >
                  <option value="">
                    {isLoadingDoctors ? 'Cargando doctores...' : 'Selecciona un doctor'}
                  </option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.lastName} - {doctor.specialty}
                    </option>
                  ))}
                </select>
                {errors.doctorId && (
                  <div className="mt-1 px-3 py-1 bg-red-500 text-white text-sm rounded">
                    {errors.doctorId}
                  </div>
                )}
                {isLoadingDoctors && (
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    🔄 Cargando lista de doctores...
                  </div>
                )}
              </div>

              {/* ID de la Sede */}
              <div>
                <label htmlFor="siteId" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                  ID de la Sede
                </label>
                <Input
                  id="siteId"
                  name="siteId"
                  type="text"
                  value={formData.siteId}
                  onChange={handleInputChange}
                  placeholder="Ingresa el ID de la sede (opcional)"
                  className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            {/* Fecha y Hora */}
            <DatePicker
              id="scheduledDate"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleInputChange}
              label="Fecha y Hora de la Cita"
              minDate={new Date()}
              required
              error={errors.scheduledDate}
            />

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1 sm:flex-initial"
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 sm:flex-initial"
                disabled={isCreating}
              >
                {isCreating ? 'Creando...' : (isPatient ? 'Solicitar Cita' : 'Agendar Cita')}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
