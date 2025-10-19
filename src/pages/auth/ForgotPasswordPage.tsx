/**
 * ForgotPasswordPage
 * 
 * Página para recuperación de contraseña - Paso 1: Solicitar código
 * El usuario ingresa su email y recibe un código de verificación de 6 dígitos
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../../services/passwordReset';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación básica
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor ingresa un correo válido');
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      
      // Redirigir a la página de verificación del código
      navigate('/auth/verify-reset-code', { 
        state: { email },
        replace: true 
      });
    } catch (err: any) {
      console.error('Error al solicitar recuperación:', err);
      
      // Manejo de errores específicos
      if (err?.message?.includes('Usuario no encontrado')) {
        setError('No existe una cuenta con este correo electrónico');
      } else if (err?.message?.includes('network')) {
        setError('Error de conexión. Verifica tu internet');
      } else {
        setError(err?.message || 'Error al enviar el código. Intenta nuevamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--vc-bg)] px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <Card className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 shadow-2xl border-0 bg-[var(--vc-card-bg)]">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          {/* Logo de VitalCare */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-[var(--vc-text)] mt-2 text-sm sm:text-base opacity-70">
            Te enviaremos un código de verificación a tu correo electrónico
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--vc-text)] mb-1"
            >
              Correo electrónico
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-[var(--vc-error-bg)] border border-red-200 dark:border-red-800 p-3 sm:p-4">
              <div className="text-sm text-[var(--vc-error-text)]">
                {error}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Enviando código...' : 'Enviar código de verificación'}
            </Button>
          </div>

          {/* Back to Login Link */}
          <div className="text-center">
            <p className="text-sm text-[var(--vc-text)]">
              <Link
                to="/login"
                className="font-medium text-[var(--vc-accent)] hover:text-[var(--vc-button-primary)] transition-colors"
              >
                ← Volver al inicio de sesión
              </Link>
            </p>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-4 sm:mt-6 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-[var(--vc-text)] opacity-70 text-center">
            💡 El código de verificación expirará en 10 minutos
          </p>
        </div>
      </Card>
    </div>
  );
};
