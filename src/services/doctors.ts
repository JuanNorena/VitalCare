/**
 * Servicio para gestión de doctores en VitalCare.
 *
 * Este módulo proporciona funciones para obtener información de doctores
 * desde el backend Java. Está diseñado para ser 100% conforme con el
 * DoctorProfileController del backend.
 *
 * @description
 * Funcionalidades principales:
 * - Obtener lista completa de doctores registrados
 * - Información detallada de cada doctor (ID, nombre, especialidad, etc.)
 * - Soporte para select components y formularios
 * - Manejo de errores robusto
 * - Logging detallado para debugging
 *
 * @example
 * ```typescript
 * import { doctorService } from '@/services/doctors';
 *
 * // Obtener todos los doctores para un select
 * const doctors = await doctorService.getAllDoctors();
 * console.log(doctors); // [{ id: 'uuid', lastName: 'Dr. Smith', specialty: 'Cardiology', ... }]
 *
 * // Uso en componente React
 * const DoctorSelect = () => {
 *   const [doctors, setDoctors] = useState([]);
 *   
 *   useEffect(() => {
 *     doctorService.getAllDoctors()
 *       .then(setDoctors)
 *       .catch(console.error);
 *   }, []);
 *
 *   return (
 *     <select>
 *       {doctors.map(doctor => (
 *         <option key={doctor.id} value={doctor.id}>
 *           {doctor.lastName} - {doctor.specialty}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * };
 * ```
 *
 * @see {@link DoctorProfileDTO} para la estructura de datos del doctor.
 * @see {@link apiClient} para el cliente HTTP subyacente.
 */

import { apiClient } from './api';

// ========================================
// TIPOS EXACTOS SEGÚN EL BACKEND
// ========================================

/**
 * Representa un perfil de doctor según el DoctorProfileDTO del backend.
 * Esta interfaz debe mantenerse sincronizada con el backend Java.
 * @interface DoctorProfileDTO
 */
export interface DoctorProfileDTO {
  /** ID único del doctor (UUID) - DoctorProfile.id */
  id: string;
  /** Nombre del usuario (User.name) */
  name?: string;
  /** Número de identificación del usuario (User.idNumber) */
  idNumber?: string;
  /** Apellido del doctor */
  lastName: string;
  /** Especialidad médica del doctor */
  specialty: string;
  /** Número de licencia médica */
  licenseNumber: string;
  /** Número de teléfono del doctor */
  phone?: string;
  /** Email del usuario (User.email) */
  email: string;
}

/**
 * Versión simplificada para selects y listas.
 * Contiene solo la información esencial para mostrar en componentes UI.
 * @interface DoctorSelectOption
 */
export interface DoctorSelectOption {
  /** ID único del doctor */
  id: string;
  /** Nombre completo para mostrar */
  displayName: string;
  /** Especialidad médica */
  specialty: string;
  /** Email del doctor */
  email: string;
}

// ========================================
// SERVICIO CONFORME AL BACKEND
// ========================================

/**
 * Objeto que contiene todas las funciones del servicio de doctores.
 * @type {Object}
 */
export const doctorService = {
  /**
   * Obtiene todos los doctores registrados en el sistema.
   * 
   * @returns {Promise<DoctorProfileDTO[]>} Lista completa de doctores.
   * 
   * @description
   * Esta función realiza una petición GET al endpoint '/api/doctors'
   * que corresponde al método getAllDoctors() del DoctorProfileController.
   * 
   * Incluye:
   * - Logging detallado de la petición
   * - Manejo de errores específicos
   * - Validación de datos recibidos
   * - Timeout de 10 segundos
   * 
   * @example
   * ```typescript
   * try {
   *   const doctors = await doctorService.getAllDoctors();
   *   console.log(`Encontrados ${doctors.length} doctores`);
   *   doctors.forEach(doctor => {
   *     console.log(`${doctor.lastName} - ${doctor.specialty}`);
   *   });
   * } catch (error) {
   *   console.error('Error al obtener doctores:', error.message);
   * }
   * ```
   * 
   * @throws {Error} Si la petición falla o los datos son inválidos.
   */
  async getAllDoctors(): Promise<DoctorProfileDTO[]> {
    try {
      console.log('[DoctorService] Obteniendo lista de doctores...');
      
      const doctors = await apiClient.get<DoctorProfileDTO[]>('/doctors');
      
      console.log(`[DoctorService] ${doctors.length} doctores obtenidos exitosamente`);
      
      // Validar estructura de datos
      if (!Array.isArray(doctors)) {
        throw new Error('La respuesta del servidor no es un array válido');
      }
      
      // Validar que cada doctor tenga los campos requeridos
      doctors.forEach((doctor, index) => {
        if (!doctor.id || !doctor.lastName) {
          console.warn(`[DoctorService] Doctor en índice ${index} tiene datos incompletos:`, doctor);
        }
      });
      
      return doctors;
      
    } catch (error) {
      console.error('[DoctorService] Error al obtener doctores:', error);
      
      // Mejorar mensaje de error según el tipo
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          throw new Error('Error de conexión al obtener doctores. Verifica tu internet.');
        } else if (error.message.includes('404')) {
          throw new Error('Endpoint de doctores no encontrado. Contacta al administrador.');
        } else if (error.message.includes('401')) {
          throw new Error('No autorizado para obtener doctores. Inicia sesión nuevamente.');
        }
      }
      
      throw new Error(`Error al obtener doctores: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  },

  /**
   * Convierte la lista de doctores a opciones simplificadas para selects.
   * 
   * @param {DoctorProfileDTO[]} doctors - Lista completa de doctores.
   * @returns {DoctorSelectOption[]} Lista de opciones para select components.
   * 
   * @description
   * Esta función utilitaria procesa la lista de doctores para crear
   * opciones optimizadas para componentes de selección como <select> o
   * componentes de UI como Combobox, Autocomplete, etc.
   * 
   * Características:
   * - Crea un displayName legible combinando información relevante
   * - Incluye specialty para filtrado y agrupación
   * - Mantiene el ID original para referencias
   * - Maneja casos donde faltan datos opcionales
   * 
   * @example
   * ```typescript
   * const doctors = await doctorService.getAllDoctors();
   * const options = doctorService.formatForSelect(doctors);
   * 
   * // Resultado: [
   * //   {
   * //     id: 'uuid-1',
   * //     displayName: 'Dr. García - Cardiología',
   * //     specialty: 'Cardiología',
   * //     email: 'garcia@hospital.com'
   * //   },
   * //   ...
   * // ]
   * ```
   */
  formatForSelect(doctors: DoctorProfileDTO[]): DoctorSelectOption[] {
    return doctors.map(doctor => ({
      id: doctor.id,
      displayName: `Dr. ${doctor.lastName}${doctor.specialty ? ` - ${doctor.specialty}` : ''}`,
      specialty: doctor.specialty || 'Sin especialidad',
      email: doctor.email || ''
    }));
  },

  /**
   * Obtiene doctores ya formateados para uso directo en selects.
   * 
   * @returns {Promise<DoctorSelectOption[]>} Lista de opciones listas para usar.
   * 
   * @description
   * Función de conveniencia que combina getAllDoctors() y formatForSelect()
   * en una sola llamada. Ideal para casos donde solo necesitas las opciones
   * para un componente de selección.
   * 
   * @example
   * ```typescript
   * // En lugar de:
   * const doctors = await doctorService.getAllDoctors();
   * const options = doctorService.formatForSelect(doctors);
   * 
   * // Simplemente:
   * const options = await doctorService.getDoctorsForSelect();
   * ```
   */
  async getDoctorsForSelect(): Promise<DoctorSelectOption[]> {
    const doctors = await this.getAllDoctors();
    return this.formatForSelect(doctors);
  },

  /**
   * Busca un doctor por su email usando el endpoint del backend.
   * 
   * @param {string} email - Email del doctor a buscar
   * @returns {Promise<DoctorProfileDTO | null>} Perfil del doctor o null si no se encuentra
   * 
   * @description
   * Esta función busca un doctor específico por su email usando el endpoint
   * GET /api/doctors/by-email?email={email} del backend.
   * 
   * El backend realiza un JOIN entre DoctorProfile y User para obtener
   * todos los datos necesarios, incluyendo el DoctorProfile.id que es
   * esencial para consultar las citas del doctor.
   * 
   * Endpoint del backend:
   * - GET /api/doctors/by-email?email={email}
   * - Controller: DoctorProfileController.getDoctorByEmail()
   * - Service: DoctorProfileService.getDoctorByEmail()
   * - Repository: DoctorProfileRepository.findDoctorProfileDtoByUserEmail()
   * 
   * Características:
   * - Consulta directa al backend (más eficiente que getAllDoctors)
   * - Retorna DoctorProfileDTO completo con todos los campos
   * - Maneja errores 404 cuando no se encuentra el doctor
   * - Logging detallado para debugging
   * - Validación de email
   * 
   * @example
   * ```typescript
   * // Buscar doctor por email del usuario logueado
   * const { user } = useAuth();
   * const doctorProfile = await doctorService.getDoctorByEmail(user.email);
   * 
   * if (doctorProfile) {
   *   console.log('DoctorProfile.id:', doctorProfile.id);
   *   // Guardar en localStorage para uso posterior
   *   localStorage.setItem(`doctorProfileId_${user.id}`, doctorProfile.id);
   * }
   * ```
   */
  async getDoctorByEmail(email: string): Promise<DoctorProfileDTO | null> {
    console.log('🔍 [DoctorService] Buscando doctor por email:', email);
    
    if (!email) {
      console.warn('⚠️ [DoctorService] Email vacío, no se puede buscar doctor');
      return null;
    }

    try {
      // Llamar al endpoint específico del backend
      const doctor = await apiClient.get<DoctorProfileDTO>(`/doctors/by-email?email=${encodeURIComponent(email)}`);
      
      console.log('✅ [DoctorService] Doctor encontrado:', {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        lastName: doctor.lastName,
        specialty: doctor.specialty,
        licenseNumber: doctor.licenseNumber
      });
      
      return doctor;
      
    } catch (error: any) {
      // Si el error es 404, el doctor no existe (no es un error crítico)
      if (error?.response?.status === 404 || error?.message?.includes('404')) {
        console.warn('⚠️ [DoctorService] No se encontró doctor con email:', email);
        return null;
      }
      
      // Para otros errores, loggear y relanzar
      console.error('❌ [DoctorService] Error al buscar doctor por email:', error);
      throw error;
    }
  }
};

export default doctorService;
