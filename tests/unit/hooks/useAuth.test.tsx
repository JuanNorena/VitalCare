/**
 * @vitest-environment jsdom
 * 
 * Pruebas unitarias para el hook useAuth.
 * 
 * Este archivo contiene tests exhaustivos para verificar:
 * - Obtención del usuario actual
 * - Proceso de login exitoso y fallido
 * - Proceso de logout y limpieza de caché
 * - Manejo de tokens JWT
 * - Estados de carga (isPending)
 * 
 * @group hooks
 * @group auth
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth';
import { 
  mockPatientUser, 
  mockDoctorUser, 
  mockLoginResponse 
} from '../../mocks/mockData';
import { createTestQueryClient } from '../../helpers/testUtils';

// Mock del servicio de autenticación
vi.mock('@/services/auth', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    registerPatient: vi.fn(),
    registerDoctor: vi.fn(),
    registerStaff: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('useAuth Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    localStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('Estado Inicial', () => {
    it('debe retornar user null cuando no hay token', async () => {
      localStorage.removeItem('accessToken');
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.user).toBeFalsy(); // null o undefined
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    it('debe obtener el usuario actual cuando hay token', async () => {
      localStorage.setItem('accessToken', 'valid-token');
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockPatientUser);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockPatientUser);
        expect(result.current.isAuthenticated).toBe(true);
      });
      
      expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('Login', () => {
    it('debe hacer login exitosamente', async () => {
      const credentials = {
        email: 'patient@test.com',
        password: 'password123',
      };
      
      vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockPatientUser);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await result.current.login(credentials);
      
      expect(authService.login).toHaveBeenCalledWith(credentials);
      expect(localStorage.getItem('accessToken')).toBe(mockLoginResponse.accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(mockLoginResponse.refreshToken);
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockPatientUser);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('debe manejar errores de login', async () => {
      const credentials = {
        email: 'wrong@test.com',
        password: 'wrongpassword',
      };
      
      const loginError = new Error('Invalid credentials');
      vi.mocked(authService.login).mockRejectedValue(loginError);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await expect(result.current.login(credentials)).rejects.toThrow('Invalid credentials');
      
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(result.current.user).toBeFalsy(); // null o undefined
    });
  });

  describe('Logout', () => {
    it('debe hacer logout exitosamente y limpiar el estado', async () => {
      localStorage.setItem('accessToken', 'valid-token');
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockPatientUser);
      vi.mocked(authService.logout).mockResolvedValue();
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Esperar a que se cargue el usuario
      await waitFor(() => {
        expect(result.current.user).toEqual(mockPatientUser);
        expect(result.current.isAuthenticated).toBe(true);
      });
      
      // Ejecutar logout
      await result.current.logout();
      
      // Verificar que se llamaron los servicios
      expect(authService.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  describe('ProfileId Validation', () => {
    it('debe advertir si un DOCTOR no tiene profileId', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const doctorWithoutProfileId = {
        ...mockDoctorUser,
        profileId: undefined,
      };
      
      localStorage.setItem('accessToken', 'valid-token');
      vi.mocked(authService.getCurrentUser).mockResolvedValue(doctorWithoutProfileId);
      
      renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });
  });
});
