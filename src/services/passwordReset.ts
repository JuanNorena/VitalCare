/**
 * Password Reset Service
 * Maneja todas las peticiones relacionadas con la recuperación de contraseñas
 */

import { apiClient } from './api';

/**
 * Paso 1: Solicitar código de recuperación
 * Envía un código de 6 dígitos al email del usuario
 */
export const requestPasswordReset = async (email: string): Promise<string> => {
  const response = await apiClient.post<string>('/auth/request-password-reset', {
    email,
  });
  return response;
};

/**
 * Paso 2: Verificar código de recuperación
 * Valida el código y retorna un token temporal para cambiar la contraseña
 */
export const verifyResetCode = async (
  email: string,
  code: string
): Promise<{ refreshToken: string }> => {
  const response = await apiClient.post<{ refreshToken: string }>(
    '/auth/verify-reset-code',
    {
      email,
      code,
    }
  );
  return response;
};

/**
 * Paso 3: Restablecer contraseña
 * Actualiza la contraseña usando el token temporal obtenido en el paso 2
 */
export const resetPassword = async (
  email: string,
  newPassword: string,
  refreshToken: string
): Promise<string> => {
  console.log('🔐 [PASSWORD RESET] Datos a enviar:', {
    email,
    newPasswordLength: newPassword.length,
    refreshTokenLength: refreshToken.length,
    refreshTokenPreview: refreshToken.substring(0, 20) + '...',
  });

  const response = await apiClient.post<string>('/auth/reset-password', {
    email,
    newPassword,
    refreshToken,
  });
  
  console.log('✅ [PASSWORD RESET] Respuesta exitosa:', response);
  return response;
};
