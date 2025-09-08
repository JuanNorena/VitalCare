/**
 * Página de inicio de sesión de VitalCare.
 *
 * Esta página permite a los usuarios autenticarse en el sistema médico.
 * Maneja diferentes tipos de usuarios (pacientes, doctores, staff) y
 * redirige automáticamente según el rol del usuario después del login.
 *
 * @example
 * ```tsx
 * // La página se renderiza automáticamente en la ruta /login
 * // No requiere instanciación manual
 * ```
 *
 * @description
 * Funcionalidades principales:
 * - Formulario de login con email y contraseña
 * - Validación de campos requeridos
 * - Manejo de estados de carga y error
 * - Redirección automática basada en rol del usuario:
 *   - Doctores: /dashboard (vista completa de citas)
 *   - Pacientes: /appointments (vista para agendar citas)
 *   - Staff: /dashboard (panel administrativo)
 * - Notificaciones de éxito/error con toast
 * - Diseño responsivo con tema adaptable
 * - Enlace a página de registro
 *
 * El componente maneja:
 * - Estado del formulario con useState
 * - Navegación con useNavigate de React Router
 * - Autenticación con el hook useAuth
 * - Notificaciones con el contexto ToastContext
 *
 * @see {@link useAuth} para la lógica de autenticación.
 * @see {@link LoginRequest} para la estructura de datos del formulario.
 * @see {@link RegisterPage} para la página de registro relacionada.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { LoginRequest } from '@/types/api';
import { useToast } from '@/contexts/ToastContext';

/**
 * Página de inicio de sesión de VitalCare.
 *
 * @component
 * @returns {JSX.Element} Formulario de login con diseño responsivo.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoginPending, error, user } = useAuth();
  const { showError, showSuccess } = useToast();

  /**
   * Estado del formulario de login.
   * Contiene los campos email y password según LoginRequest.
   * @type {LoginRequest}
   */
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  /**
   * Maneja los cambios en los inputs del formulario.
   * Actualiza el estado formData con el nuevo valor del campo modificado.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento del cambio de input.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Determina la ruta de redirección después del login basado en el rol del usuario.
   *
   * @param {string} [userRole] - Rol del usuario (opcional).
   * @returns {string} Ruta de redirección apropiada.
   *
   * @description
   * Lógica de redirección:
   * - Doctores: /dashboard (acceso completo a citas)
   * - Pacientes: /appointments (solo agendar/ver sus citas)
   * - Staff: /dashboard (panel administrativo)
   * - Default: /dashboard
   */
  const getRedirectPath = (userRole?: string) => {
    if (!userRole) return '/dashboard';

    const role = userRole.toLowerCase();

    if (role.includes('doctor')) {
      return '/dashboard'; // Dashboard con todas las citas para doctores
    } else if (role.includes('patient')) {
      return '/appointments'; // Vista para agendar citas para pacientes
    } else if (role.includes('staff')) {
      return '/dashboard'; // Dashboard para empleados
    }

    return '/dashboard'; // Ruta por defecto
  };

  /**
   * Maneja el envío del formulario de login.
   * Valida los datos, realiza la autenticación y redirige al usuario.
   *
   * @param {React.FormEvent} e - Evento del formulario.
   * @returns {Promise<void>} No retorna valor.
   *
   * @description
   * Proceso de login:
   * 1. Previene el envío por defecto del formulario
   * 2. Llama al método login del hook useAuth
   * 3. Espera 500ms para que se actualice la info del usuario
   * 4. Determina la ruta de redirección basada en el rol
   * 5. Muestra notificación de éxito
   * 6. Redirige al usuario a la ruta apropiada
   *
   * Manejo de errores:
   * - Captura cualquier error durante el proceso
   * - Registra el error en consola
   * - Muestra notificación de error al usuario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(formData);

      // Esperar un momento para que se actualice la información del usuario
      setTimeout(() => {
        const redirectPath = getRedirectPath(user?.role);
        showSuccess('¡Bienvenido!', 'Has iniciado sesión correctamente');
        navigate(redirectPath);
      }, 500);

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
        {/* ======================================== */}
        {/* HEADER CON LOGO Y TÍTULO */}
        {/* ======================================== */}
        <div className="text-center mb-6 sm:mb-8">
          {/* Logo de VitalCare */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--vc-text)]">VitalCare</h1>
          <p className="text-[var(--vc-text)] mt-2 text-sm sm:text-base">Accede a tu cuenta médica</p>
        </div>

        {/* ======================================== */}
        {/* FORMULARIO DE LOGIN */}
        {/* ======================================== */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Campo de email */}
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

          {/* Campo de contraseña */}
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

          {/* Mensaje de error si existe */}
          {error && (
            <div className="rounded-md bg-[var(--vc-error-bg)] border border-red-200 dark:border-red-800 p-3 sm:p-4">
              <div className="text-sm text-[var(--vc-error-text)]">
                Error al iniciar sesión. Por favor verifica tus credenciales.
              </div>
            </div>
          )}

          {/* Botón de envío */}
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

          {/* Enlace a registro */}
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
