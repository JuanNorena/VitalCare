/**
 * ResetPasswordPage
 * 
 * Página para recuperación de contraseña - Paso 3: Nueva contraseña
 * El usuario ingresa y confirma su nueva contraseña
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../../services/passwordReset';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || '';
  const refreshToken = location.state?.refreshToken || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validación de fortaleza de contraseña
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
  });

  // Redirigir si no hay email o token
  useEffect(() => {
    if (!email || !refreshToken) {
      navigate('/auth/forgot-password', { replace: true });
    }
  }, [email, refreshToken, navigate]);

  // Validar fortaleza en tiempo real
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
    });
  }, [newPassword]);

  const isPasswordValid =
    passwordStrength.hasMinLength &&
    passwordStrength.hasUpperCase &&
    passwordStrength.hasLowerCase &&
    passwordStrength.hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📝 [RESET PASSWORD] Intentando resetear contraseña:', {
        email,
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length || 0,
      });

      await resetPassword(email, newPassword, refreshToken);
      setSuccess(true);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/auth/login', {
          state: { message: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña' },
          replace: true,
        });
      }, 3000);
    } catch (err: any) {
      console.error('Error al restablecer contraseña:', err);

      if (err?.message?.includes('Token inválido')) {
        setError('El código ha expirado. Inicia el proceso nuevamente');
        setTimeout(() => {
          navigate('/auth/forgot-password', { replace: true });
        }, 3000);
      } else {
        setError(err?.message || 'Error al actualizar la contraseña');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Vista de éxito
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--vc-bg)] px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <Card className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 shadow-2xl border-0 bg-[var(--vc-card-bg)]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-2xl mb-6">
              <svg
                className="w-10 h-10 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--vc-text)] mb-3">
              ¡Contraseña actualizada!
            </h2>
            <p className="text-[var(--vc-text)] opacity-70 mb-6 text-sm sm:text-base">
              Tu contraseña ha sido cambiada exitosamente.
              <br />
              Redirigiendo al inicio de sesión...
            </p>
            <div className="flex justify-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>
    );
  }

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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">
            Nueva contraseña
          </h1>
          <p className="text-[var(--vc-text)] mt-2 text-sm sm:text-base opacity-70">
            Ingresa tu nueva contraseña segura
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* New Password Input */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-[var(--vc-text)] mb-1"
            >
              Nueva contraseña
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--vc-text)] opacity-40 hover:opacity-100 transition-opacity"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
              <p className="text-xs font-semibold text-[var(--vc-text)] mb-2">
                Requisitos de seguridad:
              </p>
              <ul className="space-y-1">
                {[
                  { key: 'hasMinLength', text: 'Mínimo 8 caracteres' },
                  { key: 'hasUpperCase', text: 'Una letra mayúscula' },
                  { key: 'hasLowerCase', text: 'Una letra minúscula' },
                  { key: 'hasNumber', text: 'Un número' },
                ].map(({ key, text }) => (
                  <li
                    key={key}
                    className="flex items-center gap-2 text-xs"
                  >
                    {passwordStrength[key as keyof typeof passwordStrength] ? (
                      <svg
                        className="w-4 h-4 text-green-600 dark:text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-gray-400 dark:text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span
                      className={
                        passwordStrength[key as keyof typeof passwordStrength]
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-[var(--vc-text)] opacity-60'
                      }
                    >
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirm Password Input */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[var(--vc-text)] mb-1"
            >
              Confirmar contraseña
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--vc-text)] opacity-40 hover:opacity-100 transition-opacity"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
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
              disabled={isLoading || !isPasswordValid || newPassword !== confirmPassword}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
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
      </Card>
    </div>
  );
};
