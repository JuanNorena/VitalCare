/**
 * VerifyResetCodePage
 * 
 * Página para recuperación de contraseña - Paso 2: Verificar código
 * El usuario ingresa el código de 6 dígitos recibido por email
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyResetCode, requestPasswordReset } from '../../services/passwordReset';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const VerifyResetCodePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false); // ← Bandera para prevenir múltiples submits

  // Referencias para los inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirigir si no hay email
  useEffect(() => {
    if (!email) {
      navigate('/auth/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  // Cooldown para reenviar código
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Enfocar primer input al cargar
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit cuando se completan los 6 dígitos
    if (index === 5 && value && !isSubmitting) {  // ← Agregar check de isSubmitting
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace: borrar y volver al anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Paste: distribuir el código
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const newCode = [...code];
        digits.forEach((digit, i) => {
          if (i < 6) newCode[i] = digit;
        });
        setCode(newCode);
        if (digits.length === 6 && !isSubmitting) {  // ← Agregar check de isSubmitting
          handleVerifyCode(newCode.join(''));
        } else {
          inputRefs.current[Math.min(digits.length, 5)]?.focus();
        }
      });
    }
  };

  const handleVerifyCode = async (fullCode: string) => {
    // Prevenir múltiples submissions
    if (isSubmitting || isLoading) {
      console.log('⚠️ [VERIFY CODE] Ya hay una verificación en proceso');
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 [VERIFY CODE] Iniciando verificación...');
      const response = await verifyResetCode(email, fullCode);
      
      console.log('✅ [VERIFY CODE] Verificación exitosa, redirigiendo...');
      // Redirigir a la página de nueva contraseña con el token
      navigate('/auth/reset-password', {
        state: {
          email,
          refreshToken: response.refreshToken,
        },
        replace: true,
      });
    } catch (err: any) {
      console.error('❌ [VERIFY CODE] Error al verificar código:', err);

      // Mensajes de error mejorados
      let errorMessage = 'Error al verificar el código';
      
      if (err?.message?.includes('conexión') || err?.message?.includes('internet')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente';
      } else if (err?.message?.includes('expirado')) {
        errorMessage = 'El código ha expirado. Solicita uno nuevo';
      } else if (err?.message?.includes('inválido') || err?.message?.includes('incorrecto')) {
        errorMessage = 'Código incorrecto. Verifica e intenta nuevamente';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);

      // Limpiar el código
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError('');

    try {
      await requestPasswordReset(email);
      setResendCooldown(60); // 60 segundos de cooldown
      
      // Limpiar código actual
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('Error al reenviar código:', err);
      setError('Error al reenviar el código. Intenta nuevamente');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Por favor ingresa el código completo');
      return;
    }

    handleVerifyCode(fullCode);
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">
            Verifica tu código
          </h1>
          <p className="text-[var(--vc-text)] mt-2 text-sm sm:text-base opacity-70">
            Ingresa el código de 6 dígitos enviado a
          </p>
          <p className="text-blue-600 dark:text-blue-400 font-medium mt-1 text-sm sm:text-base">
            {email}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Code Inputs */}
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-[var(--vc-input-bg)] text-[var(--vc-text)] border-2 border-[var(--vc-border)] rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Dígito ${index + 1}`}
              />
            ))}
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
              disabled={isLoading || code.join('').length !== 6}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Verificando...' : 'Verificar código'}
            </Button>
          </div>

          {/* Resend Code */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending || resendCooldown > 0}
              className="text-sm font-medium text-[var(--vc-accent)] hover:text-[var(--vc-button-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                'Reenviando...'
              ) : resendCooldown > 0 ? (
                `Reenviar código en ${resendCooldown}s`
              ) : (
                '¿No recibiste el código? Reenviar'
              )}
            </button>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <p className="text-sm text-[var(--vc-text)]">
              <Link
                to="/auth/forgot-password"
                className="font-medium text-[var(--vc-accent)] hover:text-[var(--vc-button-primary)] transition-colors"
              >
                ← Cambiar correo electrónico
              </Link>
            </p>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-4 sm:mt-6 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-[var(--vc-text)] opacity-70 text-center">
            💡 Revisa tu carpeta de spam si no ves el correo
          </p>
        </div>
      </Card>
    </div>
  );
};
