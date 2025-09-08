/**
 * Hook para manejo de autenticación
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import type { 
  User, 
  LoginRequest
} from '@/types/api';
import {useNavigate} from "react-router-dom";

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Query para obtener el usuario actual
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['current-user'],
    queryFn: async () => {
      return await authService.getCurrentUser();
    },
    enabled: !!localStorage.getItem('accessToken'), // Solo ejecuta si hay token
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });


  // Mutation para login
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

      // Redirigir al login
      navigate('/login');
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
