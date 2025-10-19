/**
 * Hook personalizado para el manejo completo de autenticación en VitalCare.
 *
 * Este hook proporciona una interfaz unificada para todas las operaciones de autenticación,
 * incluyendo login, registro de diferentes tipos de usuarios, logout y gestión del estado
 * de autenticación. Utiliza React Query para el manejo de estado y caché.
 *
 * @returns {Object} Objeto con estado de autenticación y funciones de manejo.
 * @property {User | null} user - Usuario actualmente autenticado o null.
 * @property {boolean} isLoading - Indica si se está cargando la información del usuario.
 * @property {Error | null} error - Error ocurrido al obtener el usuario actual.
 * @property {boolean} isAuthenticated - Indica si hay un usuario autenticado.
 * @property {Function} login - Función asíncrona para iniciar sesión.
 * @property {Function} registerPatient - Función asíncrona para registrar paciente.
 * @property {Function} registerDoctor - Función asíncrona para registrar doctor.
 * @property {Function} registerStaff - Función asíncrona para registrar personal.
 * @property {Function} logout - Función asíncrona para cerrar sesión.
 * @property {boolean} isLoginPending - Indica si el login está en proceso.
 * @property {boolean} isRegisterPending - Indica si algún registro está en proceso.
 * @property {boolean} isLogoutPending - Indica si el logout está en proceso.
 *
 * @example
 * ```tsx
 * import { useAuth } from '@/hooks/useAuth';
 *
 * function LoginForm() {
 *   const { login, isLoginPending, error } = useAuth();
 *
 *   const handleSubmit = async (data) => {
 *     try {
 *       await login(data);
 *       // Login exitoso, redirección automática
 *     } catch (err) {
 *       console.error('Error en login:', err);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {/* Campos del formulario * /}
 *     </form>
 *   );
 * }
 * ```
 *
 * @description
 * El hook maneja automáticamente:
 * - Almacenamiento de tokens JWT en localStorage.
 * - Invalidación de caché al hacer logout.
 * - Redirección automática después del logout.
 * - Estados de carga para todas las operaciones.
 * - Reintentos automáticos para obtener usuario actual.
 *
 * Utiliza React Query para:
 * - Cache de datos del usuario por 5 minutos.
 * - Invalidación automática de queries relacionadas.
 * - Manejo de estados de carga y error.
 *
 * @see {@link authService} para los servicios de autenticación subyacentes.
 * @see {@link User} para la estructura de datos del usuario.
 * @see {@link LoginRequest} para la estructura de datos de login.
 */

import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import type {
  User,
  LoginRequest
} from '@/types/api';

/**
 * Hook personalizado que proporciona todas las funcionalidades de autenticación.
 * @returns {Object} Estado y funciones de autenticación.
 */
export function useAuth() {
  /**
   * Cliente de React Query para gestión de caché.
   * @type {QueryClient}
   */
  const queryClient = useQueryClient();

  /**
   * Hook de navegación de React Router para redirecciones.
   * @type {NavigateFunction}
   */
  const navigate = useNavigate();

  /**
   * Query para obtener el usuario actualmente autenticado.
   * Solo se ejecuta si existe un token de acceso en localStorage.
   * @type {UseQueryResult<User | null>}
   */
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const user = await authService.getCurrentUser();
      
      // ✅ VALIDACIÓN: Advertir si doctor/paciente no tiene profileId
      if (user && (user.role.includes('DOCTOR') || user.role.includes('PATIENT'))) {
        if (!user.profileId) {
          console.warn(
            '⚠️ ADVERTENCIA: Usuario de tipo',
            user.role,
            'no tiene profileId.',
            '\n📋 Esto puede causar que no se carguen las citas correctamente.',
            '\n🔧 Solución: Actualizar el backend para incluir profileId en UserDTO.',
            '\n📖 Ver: SOLUCION_DOCTOR_APPOINTMENTS.md'
          );
        } else {
          console.log('✅ Usuario con profileId correcto:', {
            userId: user.id,
            profileId: user.profileId,
            role: user.role
          });
        }
      }
      
      return user;
    },
    enabled: !!localStorage.getItem('accessToken'), // Solo ejecuta si hay token
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  /**
   * Mutación para el proceso de login.
   * Almacena tokens, obtiene datos del usuario y actualiza la caché.
   * @type {UseMutationResult}
   */
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const result = await authService.login(data);

      // Guardar tokens en localStorage
      console.log('Storing tokens:', result);
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);

      // Obtener datos completos del usuario actual
      const user = await authService.getCurrentUser();

      // Actualizar la query de 'current-user' con los datos recién obtenidos
      queryClient.setQueryData(['current-user'], user);

      return result;
    },
  });

  /**
   * Mutación para el registro de pacientes.
   * @type {UseMutationResult}
   */
  const registerPatientMutation = useMutation({
    mutationFn: authService.registerPatient,
  });

  /**
   * Mutación para el registro de doctores.
   * @type {UseMutationResult}
   */
  const registerDoctorMutation = useMutation({
    mutationFn: authService.registerDoctor,
  });

  /**
   * Mutación para el registro de personal administrativo.
   * @type {UseMutationResult}
   */
  const registerStaffMutation = useMutation({
    mutationFn: authService.registerStaff,
  });

  /**
   * Mutación para el proceso de logout.
   * Limpia la caché, elimina datos del usuario y redirige al login.
   * @type {UseMutationResult}
   */
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Forzar estado de usuario a null
      queryClient.setQueryData(['current-user'], null);

      // Limpiar otras queries si es necesario
      queryClient.clear();

      // Redirigir al login
      navigate('/login', { replace: true });
    },
  });

  return {
    // Estado del usuario
    user,
    isLoading,
    error,
    isAuthenticated: !!user,

    // Funciones de autenticación
    login: loginMutation.mutateAsync,
    registerPatient: registerPatientMutation.mutateAsync,
    registerDoctor: registerDoctorMutation.mutateAsync,
    registerStaff: registerStaffMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,

    // Estados de carga para UI
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerPatientMutation.isPending ||
                       registerDoctorMutation.isPending ||
                       registerStaffMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  };
}
