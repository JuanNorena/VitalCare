/**
 * Formulario de Tratamiento
 * 
 * Permite registrar tratamientos farmacológicos, terapias, cirugías u otros.
 * Incluye tipo, descripción, duración e instrucciones.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { Treatment } from '@/types/clinical';

interface TreatmentFormProps {
  onSubmit: (treatments: Omit<Treatment, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[]) => void;
  isLoading?: boolean;
}

export function TreatmentForm({ onSubmit, isLoading }: TreatmentFormProps) {
  const [treatments, setTreatments] = useState<Omit<Treatment, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[]>([
    { type: 'pharmacological', description: '', duration: '', instructions: '' }
  ]);

  const addTreatment = () => {
    setTreatments([...treatments, { type: 'pharmacological', description: '', duration: '', instructions: '' }]);
  };

  const removeTreatment = (index: number) => {
    if (treatments.length > 1) {
      setTreatments(treatments.filter((_, i) => i !== index));
    }
  };

  const updateTreatment = (
    index: number,
    field: keyof Omit<Treatment, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>,
    value: string
  ) => {
    const newTreatments = [...treatments];
    newTreatments[index] = { ...newTreatments[index], [field]: value };
    setTreatments(newTreatments);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validTreatments = treatments.filter(t => t.description.trim() !== '');
    
    if (validTreatments.length > 0) {
      onSubmit(validTreatments);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pharmacological':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
          </svg>
        );
      case 'therapy':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <Card className="p-6 bg-[var(--vc-card-bg)] border-0 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--vc-text)]">Tratamiento</h2>
          <p className="text-sm text-[var(--vc-text)]/70">Define el plan de tratamiento para el paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {treatments.map((treatment, index) => (
          <div key={index} className="p-4 bg-[var(--vc-bg)] rounded-lg border border-[var(--vc-border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="text-blue-600 dark:text-blue-400">
                  {getTypeIcon(treatment.type)}
                </div>
                <h3 className="font-semibold text-[var(--vc-text)]">Tratamiento #{index + 1}</h3>
              </div>
              {treatments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTreatment(index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Tipo de Tratamiento */}
              <div>
                <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
                  Tipo de Tratamiento *
                </label>
                <select
                  value={treatment.type}
                  onChange={(e) => updateTreatment(index, 'type', e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--vc-input-bg)] border border-[var(--vc-border)] rounded-lg text-[var(--vc-text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pharmacological">Farmacológico (Medicamentos)</option>
                  <option value="therapy">Terapia (Física, Ocupacional, etc.)</option>
                  <option value="surgery">Cirugía</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
                  Descripción del Tratamiento *
                </label>
                <textarea
                  value={treatment.description}
                  onChange={(e) => updateTreatment(index, 'description', e.target.value)}
                  placeholder="Describe el tratamiento a seguir..."
                  className="w-full px-4 py-2 bg-[var(--vc-input-bg)] border border-[var(--vc-border)] rounded-lg text-[var(--vc-text)] placeholder:text-[var(--vc-text)]/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Duración */}
                <div>
                  <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
                    Duración
                  </label>
                  <Input
                    type="text"
                    value={treatment.duration || ''}
                    onChange={(e) => updateTreatment(index, 'duration', e.target.value)}
                    placeholder="Ej: 7 días, 2 semanas"
                    className="w-full"
                  />
                </div>

                {/* Instrucciones */}
                <div>
                  <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
                    Instrucciones Especiales
                  </label>
                  <Input
                    type="text"
                    value={treatment.instructions || ''}
                    onChange={(e) => updateTreatment(index, 'instructions', e.target.value)}
                    placeholder="Indicaciones adicionales"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          onClick={addTreatment}
          variant="outline"
          className="w-full"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Agregar Otro Tratamiento
        </Button>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--vc-border)]">
          <Button type="submit" disabled={isLoading || treatments.every(t => !t.description.trim())}>
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Guardar Tratamiento
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
