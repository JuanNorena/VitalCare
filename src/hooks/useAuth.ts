/**
 * Hook para manejo de autenticación
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import type { 
  User, 
  LoginRequest, 
  RegistrationRequest, 
  JwtResponse 
} from '@/types/api';

export function useAuth() {
  const queryClient = useQueryClient();

  // Query para obtener el usuario actual
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;

      try {
        return await authService.getCurrentUser();
      } catch (error) {
        // Si el token es inválido, limpiamos el localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const result = await authService.login(data);
      
      // Guardar tokens en localStorage
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      
      return result;
    },
    onSuccess: async () => {
      // Invalidar y recargar datos del usuario
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });

  // Mutation para registro de paciente
  const registerPatientMutation = useMutation({
    mutationFn: authService.registerPatient,
  });

  // Mutation para registro de doctor
  const registerDoctorMutation = useMutation({
    mutationFn: authService.registerDoctor,
  });

  // Mutation para registro de staff
  const registerStaffMutation = useMutation({
    mutationFn: authService.registerStaff,
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Limpiar todas las queries
      queryClient.clear();
    },
  });

  return {
    // Estado
    user,
    isLoading,
    error,
    isAuthenticated: !!user,

    // Acciones
    login: loginMutation.mutateAsync,
    registerPatient: registerPatientMutation.mutateAsync,
    registerDoctor: registerDoctorMutation.mutateAsync,
    registerStaff: registerStaffMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,

    // Estados de carga
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerPatientMutation.isPending || 
                       registerDoctorMutation.isPending || 
                       registerStaffMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  };
}
