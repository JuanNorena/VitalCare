/**
 * Formulario de Diagnóstico
 * 
 * Permite registrar diagnósticos médicos con código CIE-10 (opcional),
 * descripción y notas adicionales.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { Diagnosis } from '@/types/clinical';

interface DiagnosisFormProps {
  onSubmit: (diagnoses: Omit<Diagnosis, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[]) => void;
  isLoading?: boolean;
}

export function DiagnosisForm({ onSubmit, isLoading }: DiagnosisFormProps) {
  const [diagnoses, setDiagnoses] = useState<Omit<Diagnosis, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[]>([
    { code: '', description: '', notes: '' }
  ]);

  const addDiagnosis = () => {
    setDiagnoses([...diagnoses, { code: '', description: '', notes: '' }]);
  };

  const removeDiagnosis = (index: number) => {
    if (diagnoses.length > 1) {
      setDiagnoses(diagnoses.filter((_, i) => i !== index));
    }
  };

  const updateDiagnosis = (
    index: number,
    field: keyof Omit<Diagnosis, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>,
    value: string
  ) => {
    const newDiagnoses = [...diagnoses];
    newDiagnoses[index] = { ...newDiagnoses[index], [field]: value };
    setDiagnoses(newDiagnoses);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filtrar diagnósticos con descripción
    const validDiagnoses = diagnoses.filter(d => d.description.trim() !== '');
    
    if (validDiagnoses.length > 0) {
      onSubmit(validDiagnoses);
    }
  };

  return (
    <Card className="p-6 bg-[var(--vc-card-bg)] border-0 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--vc-text)]">Diagnóstico</h2>
          <p className="text-sm text-[var(--vc-text)]/70">Registra el diagnóstico médico del paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {diagnoses.map((diagnosis, index) => (
          <div key={index} className="p-4 bg-[var(--vc-bg)] rounded-lg border border-[var(--vc-border)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--vc-text)]">Diagnóstico #{index + 1}</h3>
              {diagnoses.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDiagnosis(index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Código CIE-10 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
                    Código CIE-10
                  </label>
                  <Input
                    type="text"
                    value={diagnosis.code || ''}
                    onChange={(e) => updateDiagnosis(index, 'code', e.target.value.toUpperCase())}
                    placeholder="Ej: A09, J00"
                    className="w-full"
                  />
                  <p className="text-xs text-[var(--vc-text)]/60 mt-1">Opcional</p>
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
                    Descripción del Diagnóstico *
                  </label>
                  <Input
                    type="text"
                    value={diagnosis.description}
                    onChange={(e) => updateDiagnosis(index, 'description', e.target.value)}
                    placeholder="Ej: Gastroenteritis aguda"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              {/* Notas adicionales */}
              <div>
                <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={diagnosis.notes || ''}
                  onChange={(e) => updateDiagnosis(index, 'notes', e.target.value)}
                  placeholder="Notas adicionales sobre el diagnóstico, severidad, pronóstico, etc..."
                  className="w-full px-4 py-2 bg-[var(--vc-input-bg)] border border-[var(--vc-border)] rounded-lg text-[var(--vc-text)] placeholder:text-[var(--vc-text)]/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          onClick={addDiagnosis}
          variant="outline"
          className="w-full"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Agregar Otro Diagnóstico
        </Button>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--vc-border)]">
          <Button type="submit" disabled={isLoading || diagnoses.every(d => !d.description.trim())}>
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
                Guardar Diagnóstico
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
