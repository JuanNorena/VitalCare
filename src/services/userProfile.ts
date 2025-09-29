/**
 * Servicio de perfiles de usuario para VitalCare.
 *
 * Este servicio maneja la obtención de información completa de perfiles de usuario,
 * combinando la información básica del usuario con su perfil específico según el rol.
 * Soporta perfiles de pacientes, doctores y personal administrativo (staff).
 *
 * @description
 * Funcionalidades principales:
 * - Obtener información completa del usuario autenticado
 * - Combinar datos básicos de usuario con perfil específico por rol
 * - Manejo de errores robusto con logging detallado
 * - Soporte completo para diferentes tipos de usuario
 *
 * La información se obtiene de múltiples endpoints del backend:
 * - `/api/auth/me` - Información básica del usuario
 * - `/api/patients/profile/{id}` - Perfil específico de paciente
 * - `/api/doctors/profile/{id}` - Perfil específico de doctor
 * - `/api/staff/profile/{id}` - Perfil específico de staff
 *
 * @example
 * ```typescript
 * import { userProfileService } from '@/services/userProfile';
 *
 * // Obtener perfil completo del usuario actual
 * const profile = await userProfileService.getCurrentUserProfile();
 * console.log('Usuario:', profile.firstName, profile.lastName);
 * console.log('Rol:', profile.role);
 * console.log('Email:', profile.email);
 * ```
 *
 * @see {@link User} para información básica del usuario.
 * @see {@link PatientProfile} para perfil de pacientes.
 * @see {@link DoctorProfile} para perfil de doctores.
 * @see {@link StaffProfile} para perfil de staff.
 */

import { apiClient } from './api';
import type { User, PatientProfile, DoctorProfile, StaffProfile } from '@/types/api';

/**
 * Perfil completo de usuario que combina información básica con perfil específico.
 * Esta interfaz representa la vista unificada del perfil de usuario.
 * @interface UserProfile
 */
export interface UserProfile {
  /** ID único del usuario */
  id: string;
  /** Nombre de usuario */
  username?: string;
  /** Correo electrónico */
  email: string;
  /** Rol del usuario (PATIENT, DOCTOR, STAFF) */
  role: string;
  /** Estado de habilitación de la cuenta */
  enabled: boolean;

  // Campos específicos del perfil (dependen del rol)
  /** Primer nombre (para pacientes y staff) */
  firstName?: string;
  /** Apellido (para todos los roles) */
  lastName?: string;
  /** Número de documento (para pacientes) */
  documentNumber?: string;
  /** Número de teléfono */
  phone?: string;
  /** Dirección (para pacientes) */
  address?: string;
  /** Género (para pacientes) */
  gender?: string;
  /** Especialidad médica (para doctores) */
  specialty?: string;
  /** Número de licencia médica (para doctores) */
  licenseNumber?: string;
}

/**
 * DTOs específicos para perfiles según rol.
 * Estos coinciden exactamente con los DTOs del backend y están definidos en @/types/api.
 */

/**
 * Objeto que contiene todas las funciones del servicio de perfiles de usuario.
 * @type {Object}
 */
export const userProfileService = {
  /**
   * Obtiene el perfil completo del usuario actualmente autenticado.
   *
   * Esta función combina la información básica del usuario obtenida de `/api/auth/me`
   * con el perfil específico según su rol (paciente, doctor, o staff).
   *
   * @returns {Promise<UserProfile>} Perfil completo del usuario autenticado.
   * @throws {Error} Si no se puede obtener la información del usuario o perfil.
   *
   * @description
   * Proceso de obtención:
   * 1. Obtiene información básica del usuario vía `/api/auth/me`
   * 2. Según el rol, obtiene el perfil específico:
   *    - PATIENT: `/api/patients/profile/{userId}`
   *    - DOCTOR: `/api/doctors/profile/{userId}`
   *    - STAFF: `/api/staff/profile/{userId}`
   * 3. Combina ambas fuentes de información en un UserProfile unificado
   *
   * @example
   * ```typescript
   * try {
   *   const profile = await userProfileService.getCurrentUserProfile();
   *   console.log('Perfil obtenido:', profile);
   * } catch (error) {
   *   console.error('Error al obtener perfil:', error);
   * }
   * ```
   */
  async getCurrentUserProfile(): Promise<UserProfile> {
    try {
      console.log('🔍 [UserProfileService] Obteniendo perfil del usuario actual...');

      // 1. Obtener información básica del usuario
      const userData = await apiClient.get<User>('/auth/me');

      console.log('✅ [UserProfileService] Información básica obtenida:', userData);

      // 2. Obtener perfil específico según el rol
      let profileData: PatientProfile | DoctorProfile | StaffProfile | null = null;

      try {
        switch (userData.role?.toUpperCase()) {
          case 'PATIENT':
            console.log('🔍 [UserProfileService] Obteniendo perfil de paciente...');
            profileData = await apiClient.get<PatientProfile>(`/patients/profile/${userData.id}`);
            break;

          case 'DOCTOR':
            console.log('🔍 [UserProfileService] Obteniendo perfil de doctor...');
            profileData = await apiClient.get<DoctorProfile>(`/doctors/profile/${userData.id}`);
            break;

          case 'STAFF':
            console.log('🔍 [UserProfileService] Obteniendo perfil de staff...');
            profileData = await apiClient.get<StaffProfile>(`/staff/profile/${userData.id}`);
            break;

          default:
            console.warn('⚠️ [UserProfileService] Rol desconocido:', userData.role);
        }
      } catch (profileError) {
        console.warn('⚠️ [UserProfileService] No se pudo obtener perfil específico:', profileError);
        // Continuar sin perfil específico - algunos usuarios pueden no tener perfil extendido
      }

      // 3. Combinar información básica con perfil específico
      const userProfile: UserProfile = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role || 'UNKNOWN',
        enabled: userData.enabled,

        // Campos del perfil específico (si existen)
        ...(profileData && {
          firstName: 'firstName' in profileData ? profileData.firstName : undefined,
          lastName: 'lastName' in profileData ? profileData.lastName : undefined,
          phone: profileData.phone,
          email: profileData.email, // Sobreescribe el email básico si existe en perfil

          // Campos específicos por rol
          ...(userData.role?.toUpperCase() === 'PATIENT' && profileData && {
            documentNumber: (profileData as PatientProfile).documentNumber,
            address: (profileData as PatientProfile).address,
            gender: (profileData as PatientProfile).gender,
          }),

          ...(userData.role?.toUpperCase() === 'DOCTOR' && profileData && {
            specialty: (profileData as DoctorProfile).specialty,
            licenseNumber: (profileData as DoctorProfile).licenseNumber,
          }),

          ...(userData.role?.toUpperCase() === 'STAFF' && profileData && {
            role: (profileData as StaffProfile).role, // Rol específico de staff
          }),
        }),
      };

      console.log('[UserProfileService] Perfil completo obtenido:', userProfile);
      return userProfile;

    } catch (error) {
      console.error('[UserProfileService] Error al obtener perfil del usuario:', error);
      throw new Error(`Error al obtener perfil del usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  },

  /**
   * Verifica si un usuario tiene un perfil específico disponible.
   *
   * @param {string} userId - ID del usuario.
   * @param {string} role - Rol del usuario.
   * @returns {Promise<boolean>} true si el perfil está disponible, false en caso contrario.
   *
   * @description
   * Esta función verifica la existencia de un perfil específico sin obtener todos los datos.
   * Útil para determinar si mostrar secciones adicionales en la UI.
   *
   * @example
   * ```typescript
   * const hasProfile = await userProfileService.hasProfile(userId, 'PATIENT');
   * if (hasProfile) {
   *   // Mostrar información adicional del perfil
   * }
   * ```
   */
  async hasProfile(userId: string, role: string): Promise<boolean> {
    try {
      let endpoint = '';
      switch (role?.toUpperCase()) {
        case 'PATIENT':
          endpoint = `/patients/profile/${userId}`;
          break;
        case 'DOCTOR':
          endpoint = `/doctors/profile/${userId}`;
          break;
        case 'STAFF':
          endpoint = `/staff/profile/${userId}`;
          break;
        default:
          return false;
      }

      await apiClient.get(endpoint);
      return true;
    } catch (error) {
      return false;
    }
  },
};