/**
 * Página de registro de usuarios
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { RegistrationRequest } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';

type UserRole = 'patient' | 'doctor' | 'staff';

export function RegisterPage() {
  const navigate = useNavigate();
  const { 
    registerPatient, 
    registerDoctor, 
    registerStaff, 
    isRegisterPending 
  } = useAuth();
  const { showError, showSuccess } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [formData, setFormData] = useState<RegistrationRequest>({
    email: '',
    password: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: 'MALE',
    cityId: '',
    // Campos específicos según el rol seleccionado
    bloodType: '',
    licenseNumber: '',
    specialty: '',
    lastName: '',
    department: '',
    position: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let registerFunction;
      
      switch (selectedRole) {
        case 'patient':
          registerFunction = registerPatient;
          break;
        case 'doctor':
          registerFunction = registerDoctor;
          break;
        case 'staff':
          registerFunction = registerStaff;
          break;
        default:
          return;
      }

      await registerFunction(formData);
      showSuccess(
        '¡Registro exitoso!',
        'Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión.'
      );
      navigate('/login', { 
        state: { message: 'Registro exitoso. Por favor inicia sesión.' } 
      });
    } catch (error) {
      console.error('Error al registrarse:', error);
      showError(
        'Error en el registro',
        'Ocurrió un problema al crear tu cuenta. Por favor intenta nuevamente.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--vc-bg)] py-6 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 sm:p-8 shadow-2xl border-0 bg-[var(--vc-card-bg)]">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
            </div>
            {/* Título: forzamos color claro correcto (sin override blanco en modo claro) */}
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">VitalCare</h1>
            <p className="text-[var(--vc-text)] dark:text-gray-400 mt-2 text-sm sm:text-base">Crea tu cuenta médica</p>
          </div>

          {/* Selector de rol */}
          <div className="mb-6 sm:mb-8">
            <label className="block text-sm font-medium text-[var(--vc-text)] mb-3 sm:mb-4">
              Tipo de usuario
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { value: 'patient', label: 'Paciente', description: 'Para solicitar citas médicas' },
                { value: 'doctor', label: 'Doctor', description: 'Para atender pacientes' },
                { value: 'staff', label: 'Personal', description: 'Para administrar el sistema' },
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value as UserRole)}
                  className={`group relative p-3 sm:p-4 rounded-lg border text-left transition-all focus:outline-none focus:ring-2 focus:ring-[var(--vc-button-primary)] focus:ring-offset-1 ${
                    selectedRole === role.value
                      ? 'border-[var(--vc-accent)] bg-[var(--vc-accent)]/10 dark:bg-[var(--vc-accent)]/20 dark:border-[var(--vc-accent)] shadow-sm'
                      : 'border-[var(--vc-border)] bg-[var(--vc-hover)] hover:border-[var(--vc-accent)] hover:shadow-sm dark:bg-[var(--vc-hover)] dark:hover:border-[var(--vc-accent)]'
                  }`}
                  aria-pressed={selectedRole === role.value}
                >
                  <div className={`font-medium text-sm sm:text-base ${selectedRole === role.value ? 'text-[var(--vc-text)]' : 'text-[var(--vc-text)]'}`}>{role.label}</div>
                  <div className={`text-xs sm:text-sm mt-1 ${selectedRole === role.value ? 'text-[var(--vc-text)]/70' : 'text-[var(--vc-text)]/60'}`}>{role.description}</div>
                  {selectedRole === role.value && (
                    <span className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-[var(--vc-accent)]/50 dark:ring-[var(--vc-accent)]/40" aria-hidden />
                  )}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                  Correo electrónico *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="juan@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                  Contraseña *
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                  Teléfono
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                  Fecha de nacimiento
                </label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                  Género
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full h-10 sm:h-11 px-3 sm:px-4 text-sm sm:text-base rounded-lg border border-[var(--vc-border)] bg-[var(--vc-input-bg)] text-[var(--vc-text)] focus:outline-none focus:ring-2 focus:ring-[var(--vc-button-primary)] focus:border-transparent transition-all duration-200"
                >
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Femenino</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>

              <div>
                <label htmlFor="cityId" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                  ID de Ciudad
                </label>
                <Input
                  id="cityId"
                  name="cityId"
                  type="text"
                  value={formData.cityId || ''}
                  onChange={handleInputChange}
                  placeholder="ID de la ciudad"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                Dirección
              </label>
              <Input
                id="address"
                name="address"
                type="text"
                value={formData.address || ''}
                onChange={handleInputChange}
                placeholder="Calle 123 #45-67, Ciudad"
              />
            </div>

            {/* Campos específicos por rol */}
            {selectedRole === 'patient' && (
              <div className="pt-4 sm:pt-6 border-t border-[var(--vc-border)]">
                <h3 className="text-base sm:text-lg font-medium text-[var(--vc-text)] mb-3 sm:mb-4">
                  Información del Paciente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="bloodType" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                      Tipo de Sangre
                    </label>
                    <select
                      id="bloodType"
                      name="bloodType"
                      value={formData.bloodType || ''}
                      onChange={handleInputChange}
                      className="w-full h-10 sm:h-11 px-3 sm:px-4 text-sm sm:text-base rounded-lg border border-[var(--vc-border)] bg-[var(--vc-input-bg)] text-[var(--vc-text)] focus:outline-none focus:ring-2 focus:ring-[var(--vc-button-primary)] focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Seleccionar tipo de sangre</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {selectedRole === 'doctor' && (
              <div className="pt-4 sm:pt-6 border-t border-[var(--vc-border)]">
                <h3 className="text-base sm:text-lg font-medium text-[var(--vc-text)] mb-3 sm:mb-4">
                  Información del Doctor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                      Apellidos *
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName || ''}
                      onChange={handleInputChange}
                      placeholder="Apellidos"
                    />
                  </div>
                  <div>
                    <label htmlFor="licenseNumber" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                      Licencia Médica *
                    </label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      required
                      value={formData.licenseNumber || ''}
                      onChange={handleInputChange}
                      placeholder="Número de licencia médica"
                    />
                  </div>
                  <div>
                    <label htmlFor="specialty" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                      Especialidad *
                    </label>
                    <Input
                      id="specialty"
                      name="specialty"
                      type="text"
                      required
                      value={formData.specialty || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: Cardiología, Dermatología"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedRole === 'staff' && (
              <div className="pt-4 sm:pt-6 border-t border-[var(--vc-border)]">
                <h3 className="text-base sm:text-lg font-medium text-[var(--vc-text)] mb-3 sm:mb-4">
                  Información del Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                      Departamento
                    </label>
                    <Input
                      id="department"
                      name="department"
                      type="text"
                      value={formData.department || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: IT, Recursos Humanos"
                    />
                  </div>
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
                      Cargo
                    </label>
                    <Input
                      id="position"
                      name="position"
                      type="text"
                      value={formData.position || ''}
                      onChange={handleInputChange}
                      placeholder="Cargo o posición"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="pt-4 sm:pt-6">
              <Button
                type="submit"
                disabled={isRegisterPending}
                className="w-full h-10 sm:h-11 text-sm sm:text-base"
              >
                {isRegisterPending ? 'Registrando...' : 'Crear cuenta'}
              </Button>
            </div>

            <div className="text-center pt-4 sm:pt-6">
              <p className="text-sm text-[var(--vc-text)]">
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login"
                  className="font-medium text-[var(--vc-accent)] hover:text-[var(--vc-button-primary)] transition-colors"
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
