/**
 * Formulario de Signos Vitales
 * 
 * Permite registrar los signos vitales del paciente durante la consulta médica.
 * Incluye: presión arterial, temperatura, frecuencia cardíaca, frecuencia respiratoria,
 * saturación de oxígeno, peso y altura.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { VitalSign } from '@/types/clinical';

interface VitalSignsFormProps {
  onSubmit: (vitalSigns: Omit<VitalSign, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[]) => void;
  isLoading?: boolean;
  initialData?: VitalSign[];
}

export function VitalSignsForm({ onSubmit, isLoading, initialData }: VitalSignsFormProps) {
  const [bloodPressure, setBloodPressure] = useState(
    initialData?.find(vs => vs.type === 'blood_pressure')?.value || ''
  );
  const [temperature, setTemperature] = useState(
    initialData?.find(vs => vs.type === 'temperature')?.value || ''
  );
  const [heartRate, setHeartRate] = useState(
    initialData?.find(vs => vs.type === 'heart_rate')?.value || ''
  );
  const [respiratoryRate, setRespiratoryRate] = useState(
    initialData?.find(vs => vs.type === 'respiratory_rate')?.value || ''
  );
  const [oxygenSaturation, setOxygenSaturation] = useState(
    initialData?.find(vs => vs.type === 'oxygen_saturation')?.value || ''
  );
  const [weight, setWeight] = useState(
    initialData?.find(vs => vs.type === 'weight')?.value || ''
  );
  const [height, setHeight] = useState(
    initialData?.find(vs => vs.type === 'height')?.value || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vitalSigns: Omit<VitalSign, 'id' | 'consultationId' | 'createdAt' | 'updatedAt'>[] = [];

    if (bloodPressure) {
      vitalSigns.push({ type: 'blood_pressure', value: bloodPressure, unit: 'mmHg' });
    }
    if (temperature) {
      vitalSigns.push({ type: 'temperature', value: temperature, unit: '°C' });
    }
    if (heartRate) {
      vitalSigns.push({ type: 'heart_rate', value: heartRate, unit: 'lpm' });
    }
    if (respiratoryRate) {
      vitalSigns.push({ type: 'respiratory_rate', value: respiratoryRate, unit: 'rpm' });
    }
    if (oxygenSaturation) {
      vitalSigns.push({ type: 'oxygen_saturation', value: oxygenSaturation, unit: '%' });
    }
    if (weight) {
      vitalSigns.push({ type: 'weight', value: weight, unit: 'kg' });
    }
    if (height) {
      vitalSigns.push({ type: 'height', value: height, unit: 'cm' });
    }

    onSubmit(vitalSigns);
  };

  return (
    <Card className="p-6 bg-[var(--vc-card-bg)] border-0 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--vc-text)]">Signos Vitales</h2>
          <p className="text-sm text-[var(--vc-text)]/70">Registra las mediciones del paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Presión Arterial */}
          <div>
            <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
              Presión Arterial (mmHg)
            </label>
            <Input
              type="text"
              placeholder="120/80"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-[var(--vc-text)]/60 mt-1">Formato: sistólica/diastólica</p>
          </div>

          {/* Temperatura */}
          <div>
            <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
              Temperatura (°C)
            </label>
            <Input
              type="number"
              step="0.1"
              placeholder="36.5"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Frecuencia Cardíaca */}
          <div>
            <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
              Frecuencia Cardíaca (lpm)
            </label>
            <Input
              type="number"
              placeholder="70"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-[var(--vc-text)]/60 mt-1">Latidos por minuto</p>
          </div>

          {/* Frecuencia Respiratoria */}
          <div>
            <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
              Frecuencia Respiratoria (rpm)
            </label>
            <Input
              type="number"
              placeholder="16"
              value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-[var(--vc-text)]/60 mt-1">Respiraciones por minuto</p>
          </div>

          {/* Saturación de Oxígeno */}
          <div>
            <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
              Saturación de Oxígeno (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="98"
              value={oxygenSaturation}
              onChange={(e) => setOxygenSaturation(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Peso */}
          <div>
            <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
              Peso (kg)
            </label>
            <Input
              type="number"
              step="0.1"
              placeholder="70.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Altura */}
          <div>
            <label className="block text-sm font-medium text-[var(--vc-text)] mb-2">
              Altura (cm)
            </label>
            <Input
              type="number"
              placeholder="170"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--vc-border)]">
          <Button type="submit" disabled={isLoading}>
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
                Guardar Signos Vitales
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
