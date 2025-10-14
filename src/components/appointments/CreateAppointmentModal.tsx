/**
 * Componente modal para crear una nueva cita médica en la aplicación VitalCare.
 *
 * Este componente proporciona una interfaz modal para que los usuarios creen citas médicas,
 * permitiendo ingresar el ID del doctor y seleccionar fecha y hora. Está integrado con
 * el servicio de citas y maneja validaciones, errores y estados de carga.
 *
 * @component
 * @example
 * ```tsx
 * import { CreateAppointmentModal } from '@/components/appointments/CreateAppointmentModal';
 *
 * function AppointmentsPage() {
 *   const [isModalOpen, setIsModalOpen] = useState(false);
 *
 *   return (
 *     <div>
 *       <button onClick={() => setIsModalOpen(true)}>Nueva Cita</button>
 *       <CreateAppointmentModal
 *         isOpen={isModalOpen}
 *         onClose={() => setIsModalOpen(false)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @description
 * El modal utiliza React Query para manejar la mutación de creación de citas,
 * invalidando las consultas relacionadas al éxito. Incluye validaciones del lado
 * del cliente para campos requeridos y fechas futuras. El ID del paciente se
 * auto-rellena desde el usuario autenticado.
 *
 * Funcionalidades principales:
 * - Formulario con validación en tiempo real.
 * - Integración con servicio de citas backend.
 * - Manejo de errores y estados de carga.
 * - Soporte para modo oscuro y claro.
 * - Normalización de fechas para compatibilidad con backend.
 *
 * @see {@link appointmentService} para detalles del servicio de citas.
 * @see {@link useAuth} para gestión de autenticación.
 * @see {@link useToast} para notificaciones.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { appointmentService } from '@/services/appointments';
import { useAuth } from '@/hooks/useAuth';
import type { AppointmentCreate } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';

/**
 * Props para el componente CreateAppointmentModal.
 * @interface CreateAppointmentModalProps
 */
interface CreateAppointmentModalProps {
  /** Indica si el modal está abierto y visible */
  isOpen: boolean;
  /** Función callback para cerrar el modal */
  onClose: () => void;
}

/**
 * Componente funcional que renderiza el modal de creación de citas.
 * @param {CreateAppointmentModalProps} props - Las props del componente.
 * @returns {JSX.Element | null} El modal renderizado o null si no está abierto.
 */
export function CreateAppointmentModal({ isOpen, onClose }: CreateAppointmentModalProps) {
  /**
   * Hook de autenticación para obtener información del usuario actual.
   * @type {Object}
   * @property {Object} user - Información del usuario autenticado.
   * @property {string} user.id - ID único del usuario.
   */
  const { user } = useAuth();

  /**
   * Cliente de React Query para invalidar consultas después de mutaciones.
   * @type {QueryClient}
   */
  const queryClient = useQueryClient();

  /**
   * Hook de contexto para mostrar notificaciones de éxito.
   * @type {Object}
   * @property {Function} showSuccess - Función para mostrar notificación de éxito.
   */
  const { showSuccess } = useToast();

  /**
   * Estado del formulario con los datos de la cita a crear.
   * @type {Object}
   * @property {string} patientId - ID del paciente (auto-rellenado desde usuario).
   * @property {string} doctorId - ID del doctor ingresado manualmente.
   * @property {string} scheduledDate - Fecha y hora seleccionada en formato datetime-local.
   */
  const [formData, setFormData] = useState({
    patientId: user?.id || '',
    doctorId: '',
    scheduledDate: ''
  });

  /**
   * Estado para almacenar errores de validación del formulario.
   * @type {Record<string, string>}
   */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Mutación de React Query para crear una nueva cita.
   * Maneja el éxito invalidando consultas y mostrando notificación,
   * y el error registrándolo en consola y mostrando mensaje.
   * @type {UseMutationResult}
   */
  const createMutation = useMutation({
    mutationFn: appointmentService.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      showSuccess('Cita creada exitosamente', 'Tu cita ha sido programada correctamente');
      onClose();
      setFormData({
        patientId: user?.id || '',
        doctorId: '',
        scheduledDate: ''
      });
      setErrors({});
    },
    onError: (error: any) => {
      console.error('Error creating appointment:', error);
      setErrors({ submit: 'Error al crear la cita. Intenta nuevamente.' });
    }
  });

  /**
   * Función manejadora del envío del formulario.
   * Realiza validaciones del lado del cliente, normaliza la fecha y ejecuta la mutación.
   * @param {React.FormEvent} e - Evento del formulario.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    const newErrors: Record<string, string> = {};
    
    if (!formData.doctorId.trim()) {
      newErrors.doctorId = 'Ingresa el ID del doctor';
    }
    
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Selecciona fecha y hora';
    }

    // Validar que la fecha sea futura
    if (formData.scheduledDate) {
      const selectedDate = new Date(formData.scheduledDate);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.scheduledDate = 'La fecha debe ser futura';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Formatear datos para el backend (backend espera LocalDateTime sin zona, p.e. "YYYY-MM-DDTHH:mm:ss")
    const normalizeScheduledDate = (v: string) => {
      if (!v) return v;
      // datetime-local produces "YYYY-MM-DDTHH:mm" (no segundos) in most browsers
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return `${v}:00`;
      // If an ISO with Z is provided, strip Z to produce a LocalDateTime-like string
      if (v.endsWith('Z')) return v.replace(/Z$/, '');
      return v;
    };

    const appointmentData: AppointmentCreate = {
      patientId: formData.patientId,
      doctorId: formData.doctorId,
      scheduledDate: normalizeScheduledDate(formData.scheduledDate)
    };

    createMutation.mutate(appointmentData);
  };

  /**
   * Función manejadora de cambios en los campos del formulario.
   * Actualiza el estado del formulario y limpia errores relacionados.
   * @param {string} field - Nombre del campo que cambió.
   * @param {string} value - Nuevo valor del campo.
   */
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Contenedor del modal con fondo semi-transparente */}
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Tarjeta contenedora sin borde ni sombra para el contenido del modal */}
        <Card className="border-0 shadow-none">
          <div className="p-6">
            {/* Encabezado del modal con título y botón de cierre */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Nueva Cita Médica
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>

            {/* Formulario de creación de cita */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo para ingresar el ID del doctor */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                  ID del Doctor *
                </label>
                <Input
                  type="text"
                  placeholder="Ingresa el ID del doctor"
                  value={formData.doctorId}
                  onChange={(e) => handleChange('doctorId', e.target.value)}
                  className={errors.doctorId ? 'border-red-500' : ''}
                />
                {errors.doctorId && (
                  <div className="mt-1 px-3 py-1 bg-red-500 text-white text-sm rounded">
                    {errors.doctorId}
                  </div>
                )}
              </div>

              {/* Campo para seleccionar fecha y hora */}
              <DatePicker
                value={formData.scheduledDate}
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
                label="Fecha y Hora"
                minDate={new Date()}
                required
                error={errors.scheduledDate}
              />

              {/* Mensaje de error general en caso de fallo en la creación */}
              {errors.submit && (
                <div className="px-4 py-3 bg-red-500 text-white text-sm rounded-lg">
                  {errors.submit}
                </div>
              )}

              {/* Botones de acción: Cancelar y Crear Cita */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear Cita'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
