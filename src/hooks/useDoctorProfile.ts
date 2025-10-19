/**
 * Hook personalizado para obtener el DoctorProfile.id correcto.
 * 
 * Este hook resuelve el problema de que User.id ≠ DoctorProfile.id
 * buscando el perfil del doctor en el backend y guardándolo en localStorage.
 * 
 * @description
 * PROBLEMA:
 * - Usuario doctor tiene User.id en la tabla `users`
 * - Pero las citas se relacionan con DoctorProfile.id en la tabla `doctors`
 * - User.id ≠ DoctorProfile.id (son UUIDs diferentes)
 * 
 * SOLUCIÓN:
 * 1. Al hacer login, buscar el DoctorProfile por email del usuario
 * 2. Guardar DoctorProfile.id en localStorage
 * 3. Usar DoctorProfile.id para consultar citas
 * 
 * @example
 * ```typescript
 * function DoctorAppointmentsPage() {
 *   const { user } = useAuth();
 *   const { doctorProfileId, isLoading, error } = useDoctorProfile(user);
 *   const { data: appointments } = useDoctorAppointments(doctorProfileId);
 *   
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *   
 *   return <AppointmentsList appointments={appointments} />;
 * }
 * ```
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorService } from '@/services/doctors';
import type { User } from '@/types/api';

/**
 * Hook que obtiene el DoctorProfile.id correcto para el usuario actual.
 * 
 * @param {User | null} user - Usuario autenticado (de useAuth)
 * @returns {Object} Objeto con doctorProfileId, isLoading y error
 * 
 * @property {string | null} doctorProfileId - ID del DoctorProfile (UUID)
 * @property {boolean} isLoading - Indica si se está cargando el perfil
 * @property {string | null} error - Mensaje de error si ocurrió algún problema
 */
export function useDoctorProfile(user: User | null) {
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);

  // ✅ OPCIÓN 1: Usar profileId si el backend lo proporciona
  useEffect(() => {
    if (user?.profileId) {
      console.log('✅ [useDoctorProfile] Usando profileId del backend:', user.profileId);
      setDoctorProfileId(user.profileId);
      
      // Guardar en localStorage para cache
      localStorage.setItem(`doctorProfileId_${user.id}`, user.profileId);
    }
  }, [user]);

  // ✅ OPCIÓN 2: Intentar obtener de localStorage
  useEffect(() => {
    if (!user) return;
    if (doctorProfileId) return; // Ya lo tenemos
    
    const storedId = localStorage.getItem(`doctorProfileId_${user.id}`);
    if (storedId) {
      console.log('✅ [useDoctorProfile] Usando doctorProfileId de localStorage:', storedId);
      setDoctorProfileId(storedId);
    }
  }, [user, doctorProfileId]);

  // ✅ OPCIÓN 3: Buscar en el backend por email
  const { data: doctorProfile, isLoading, error } = useQuery({
    queryKey: ['doctor-profile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      
      console.log('🔍 [useDoctorProfile] Buscando DoctorProfile por email:', user.email);
      const profile = await doctorService.getDoctorByEmail(user.email);
      
      if (profile) {
        // Guardar en localStorage para próximas sesiones
        localStorage.setItem(`doctorProfileId_${user.id}`, profile.id);
        console.log('💾 [useDoctorProfile] DoctorProfile.id guardado en localStorage:', profile.id);
      }
      
      return profile;
    },
    enabled: !!user?.email && !doctorProfileId && !user?.profileId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });

  // Actualizar doctorProfileId cuando se obtenga del backend
  useEffect(() => {
    if (doctorProfile?.id && !doctorProfileId) {
      console.log('✅ [useDoctorProfile] DoctorProfile obtenido del backend:', doctorProfile.id);
      setDoctorProfileId(doctorProfile.id);
    }
  }, [doctorProfile, doctorProfileId]);

  return {
    doctorProfileId: doctorProfileId || user?.profileId || null,
    isLoading,
    error: error ? 'Error al obtener perfil del doctor' : null
  };
}

/**
 * Hook simplificado que devuelve solo el doctorProfileId.
 * 
 * @param {User | null} user - Usuario autenticado
 * @returns {string} DoctorProfile.id o string vacío si no está disponible
 * 
 * @example
 * ```typescript
 * function DoctorDashboard() {
 *   const { user } = useAuth();
 *   const doctorProfileId = useDoctorProfileId(user);
 *   const { data: appointments } = useDoctorAppointments(doctorProfileId);
 *   
 *   return <Dashboard appointments={appointments} />;
 * }
 * ```
 */
export function useDoctorProfileId(user: User | null): string {
  const { doctorProfileId } = useDoctorProfile(user);
  return doctorProfileId || '';
}
