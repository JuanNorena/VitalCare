/**
 * Página dedicada para crear nueva cita médica
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';
import type { CreateAppointmentRequest } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';

export function CreateAppointmentPage() {
  const { user } = useAuth();
  const { createAppointment, isCreating } = useAppointments();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    patientId: user?.id || '',
    doctorId: '',
    siteId: '',
    scheduledDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determinar el rol del usuario
  const isPatient = user?.role?.toLowerCase().includes('patient');

  // Si es doctor o staff, el patientId debe ser ingresado manualmente
  useEffect(() => {
    if (isPatient && user?.id) {
      setFormData(prev => ({ ...prev, patientId: user.id }));
    } else {
      setFormData(prev => ({ ...prev, patientId: '' }));
    }
  }, [isPatient, user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones según el rol
    if (!isPatient && !formData.patientId.trim()) {
      newErrors.patientId = 'ID del paciente es requerido';
    }

    if (!formData.doctorId.trim()) {
      newErrors.doctorId = 'ID del doctor es requerido';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Error de validación', 'Por favor revisa los campos marcados');
      return;
    }

    try {
      // Normalizar la fecha antes de enviar
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
              {/* ID del Paciente - Solo visible para doctores y staff */}
              {!isPatient && (
                <div className="md:col-span-2">
                  <label htmlFor="patientId" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                    ID del Paciente *
                  </label>
                  <Input
                    id="patientId"
                    name="patientId"
                    type="text"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    placeholder="Ingresa el ID del paciente"
                    className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${errors.patientId ? 'border-red-500' : ''}`}
                  />
                  {errors.patientId && (
                    <div className="mt-1 px-3 py-1 bg-red-500 text-white text-sm rounded">
                      {errors.patientId}
                    </div>
                  )}
                </div>
              )}

              {/* ID del Doctor */}
              <div>
                <label htmlFor="doctorId" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                  ID del Doctor *
                </label>
                <Input
                  id="doctorId"
                  name="doctorId"
                  type="text"
                  placeholder="Ingresa el ID del doctor"
                  value={formData.doctorId}
                  onChange={handleInputChange}
                  className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${errors.doctorId ? 'border-red-500' : ''}`}
                />
                {errors.doctorId && (
                  <div className="mt-1 px-3 py-1 bg-red-500 text-white text-sm rounded">
                    {errors.doctorId}
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
            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                Fecha y Hora de la Cita *
              </label>
              <Input
                id="scheduledDate"
                name="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                min={new Date().toISOString().slice(0, 16)}
                className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${errors.scheduledDate ? 'border-red-500' : ''}`}
              />
              {errors.scheduledDate && (
                <div className="mt-1 px-3 py-1 bg-red-500 text-white text-sm rounded">
                  {errors.scheduledDate}
                </div>
              )}
            </div>

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
