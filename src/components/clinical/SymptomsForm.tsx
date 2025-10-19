/**
 * Formulario de Síntomas
 * 
 * Permite registrar los síntomas reportados por el paciente durante la consulta.
 * Incluye descripción, severidad y duración de cada síntoma.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { Symptom } from '@/types/clinical';

interface SymptomsFormProps {
  onSubmit: (symptoms: Omit<Symptom, 'id' | 'consultationId' | 'createdAt'>[]) => void;
  isLoading?: boolean;
}

export function SymptomsForm({ onSubmit, isLoading }: SymptomsFormProps) {
  const [symptoms, setSymptoms] = useState<Omit<Symptom, 'id' | 'consultationId' | 'createdAt'>[]>([
    { description: '', severity: 'mild', duration: '' }
  ]);

  const addSymptom = () => {
    setSymptoms([...symptoms, { description: '', severity: 'mild', duration: '' }]);
  };

  const removeSymptom = (index: number) => {
    if (symptoms.length > 1) {
      setSymptoms(symptoms.filter((_, i) => i !== index));
    }
  };

  const updateSymptom = (
    index: number,
    field: keyof Omit<Symptom, 'id' | 'consultationId' | 'createdAt'>,
    value: string
  ) => {
    const newSymptoms = [...symptoms];
    newSymptoms[index] = { ...newSymptoms[index], [field]: value };
    setSymptoms(newSymptoms);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filtrar síntomas con descripción
    const validSymptoms = symptoms.filter(s => s.description.trim() !== '');
    
    if (validSymptoms.length > 0) {
      onSubmit(validSymptoms);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'severe':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6 bg-[var(--vc-card-bg)] border-0 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--vc-text)]">Síntomas</h2>
          <p className="text-sm text-[var(--vc-text)]/70">Registra los síntomas reportados por el paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {symptoms.map((symptom, index) => (
          <div key={index} className="p-4 bg-[var(--vc-bg)] rounded-lg border border-[var(--vc-border)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--vc-text)]">Síntoma #{index + 1}</h3>
              {symptoms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSymptom(index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
                  Descripción del Síntoma *
                </label>
                <textarea
                  value={symptom.description}
                  onChange={(e) => updateSymptom(index, 'description', e.target.value)}
                  placeholder="Ej: Dolor abdominal en la parte superior derecha..."
                  className="w-full px-4 py-2 bg-[var(--vc-input-bg)] border border-[var(--vc-border)] rounded-lg text-[var(--vc-text)] placeholder:text-[var(--vc-text)]/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Severidad */}
                <div>
                  <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
                    Severidad *
                  </label>
                  <select
                    value={symptom.severity}
                    onChange={(e) => updateSymptom(index, 'severity', e.target.value as 'mild' | 'moderate' | 'severe')}
                    className={`w-full px-4 py-2 rounded-lg font-medium ${getSeverityColor(symptom.severity)} border-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  >
                    <option value="mild">Leve</option>
                    <option value="moderate">Moderado</option>
                    <option value="severe">Severo</option>
                  </select>
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
                    Duración
                  </label>
                  <Input
                    type="text"
                    value={symptom.duration || ''}
                    onChange={(e) => updateSymptom(index, 'duration', e.target.value)}
                    placeholder="Ej: 3 días, 1 semana"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          onClick={addSymptom}
          variant="outline"
          className="w-full"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Agregar Otro Síntoma
        </Button>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--vc-border)]">
          <Button type="submit" disabled={isLoading || symptoms.every(s => !s.description.trim())}>
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
                Guardar Síntomas
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
