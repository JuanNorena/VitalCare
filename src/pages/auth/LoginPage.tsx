/**
 * Página de inicio de sesión
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { LoginRequest } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoginPending, error } = useAuth();
  const { showError, showSuccess } = useToast();
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(formData);
      showSuccess('¡Bienvenido!', 'Has iniciado sesión correctamente');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      showError(
        'Error al iniciar sesión',
        'Por favor verifica tus credenciales e intenta nuevamente'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--vc-bg)] px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Card className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 shadow-2xl border-0 bg-[var(--vc-card-bg)]">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">VitalCare</h1>
          <p className="text-[var(--vc-text)] mt-2 text-sm sm:text-base">Accede a tu cuenta médica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
              Correo electrónico
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder="tu@email.com"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--vc-text)] mb-1">
              Contraseña
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Tu contraseña"
              className="w-full"
            />
          </div>

          {error && (
            <div className="rounded-md bg-[var(--vc-error-bg)] border border-red-200 dark:border-red-800 p-3 sm:p-4">
              <div className="text-sm text-[var(--vc-error-text)]">
                Error al iniciar sesión. Por favor verifica tus credenciales.
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={isLoginPending}
              className="w-full"
              size="lg"
            >
              {isLoginPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-[var(--vc-text)]">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="font-medium text-[var(--vc-accent)] hover:text-[var(--vc-button-primary)] transition-colors"
              >
                Registrarse
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
