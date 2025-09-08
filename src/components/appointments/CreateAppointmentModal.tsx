/**
 * Modal para crear nueva cita médica
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { appointmentService } from '@/services/appointments';
import { useAuth } from '@/hooks/useAuth';
import type { AppointmentCreate } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAppointmentModal({ isOpen, onClose }: CreateAppointmentModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess } = useToast();
  
  const [formData, setFormData] = useState({
    patientId: user?.id || '',
    doctorId: '',
    scheduledDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* modal uses theme background: white in light mode, dark gray in dark mode; text color inherited */}
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <div className="p-6">
            {/* Header */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Doctor ID */}
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

              {/* Fecha y hora */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-2">
                  Fecha y Hora *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => handleChange('scheduledDate', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${errors.scheduledDate ? 'border-red-500' : ''}`}
                />
                {errors.scheduledDate && (
                  <div className="mt-1 px-3 py-1 bg-red-500 text-white text-sm rounded">
                    {errors.scheduledDate}
                  </div>
                )}
              </div>

              {/* Error de submit */}
              {errors.submit && (
                <div className="px-4 py-3 bg-red-500 text-white text-sm rounded-lg">
                  {errors.submit}
                </div>
              )}

              {/* Actions */}
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
