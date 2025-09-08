/**
 * Servicio de autenticación para VitalCare.
 *
 * Este módulo proporciona todas las funciones necesarias para manejar la autenticación
 * de usuarios en la aplicación, incluyendo login, registro de diferentes tipos de usuarios,
 * refresco de tokens y obtención de información del usuario actual. Incluye validaciones
 * exhaustivas y transformación de datos para compatibilidad con el backend Java.
 *
 * @example
 * ```typescript
 * import { authService } from '@/services/auth';
 *
 * // Login de usuario
 * const tokens = await authService.login({ email: 'user@example.com', password: 'password' });
 *
 * // Registro de paciente
 * const user = await authService.registerPatient({
 *   email: 'patient@example.com',
 *   password: 'password123',
 *   cityId: 'uuid-de-ciudad'
 * });
 * ```
 *
 * @description
 * El servicio maneja tres tipos de usuarios:
 * - Pacientes: Campos opcionales adicionales (género, fecha nacimiento, tipo sangre, etc.)
 * - Doctores: Campos requeridos adicionales (apellidos, licencia, especialidad)
 * - Staff: Campos opcionales adicionales (departamento, posición)
 *
 * Todas las funciones incluyen:
 * - Validación de entrada del lado del cliente.
 * - Transformación de datos para el formato esperado por el backend.
 * - Manejo de errores con mensajes descriptivos.
 * - Logging detallado para debugging.
 *
 * @see {@link apiClient} para el cliente HTTP subyacente.
 * @see {@link LoginRequest} para la estructura de datos de login.
 * @see {@link RegistrationRequest} para la estructura de datos de registro.
 * @see {@link JwtResponse} para la respuesta de autenticación.
 * @see {@link User} para la estructura de datos del usuario.
 */

import { apiClient } from './api';
import type {
  LoginRequest,
  RegistrationRequest,
  JwtResponse,
  User
} from '@/types/api';

/**
 * Objeto que contiene todas las funciones del servicio de autenticación.
 * @type {Object}
 */
export const authService = {
  /**
   * Valida si una cadena es un UUID válido (formato estándar).
   * @param {string} str - La cadena a validar.
   * @returns {boolean} True si es un UUID válido, false en caso contrario.
   */
  isValidUUID: (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  },

  /**
   * Valida si una cadena representa una fecha válida en formato YYYY-MM-DD.
   * @param {string} dateStr - La cadena de fecha a validar.
   * @returns {boolean} True si es una fecha válida, false en caso contrario.
   */
  isValidDate: (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  },

  /**
   * Formatea un UUID eliminando espacios en blanco.
   * @param {string} uuidStr - La cadena UUID a formatear.
   * @returns {string} El UUID formateado.
   */
  formatUUID: (uuidStr: string): string => {
    return uuidStr.trim();
  },

  /**
   * Valida si una cadena es un email válido usando expresión regular.
   * @param {string} email - La cadena de email a validar.
   * @returns {boolean} True si es un email válido, false en caso contrario.
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Realiza el login de un usuario.
   * Envía credenciales al endpoint /api/auth/login y almacena los tokens JWT.
   * @param {LoginRequest} data - Las credenciales de login.
   * @returns {Promise<JwtResponse>} Los tokens de autenticación.
   * @throws {Error} Si las credenciales son inválidas o hay error de conexión.
   */
  login: async (data: LoginRequest): Promise<JwtResponse> => {
    const response = await apiClient.post<JwtResponse>('/auth/login', {
      email: data.email,
      password: data.password,
    });

    // guardar tokens
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    return response;
  },

  /**
   * Registra un usuario genérico (no recomendado usar directamente).
   * @deprecated Use registerPatient, registerDoctor o registerStaff en su lugar.
   * @param {RegistrationRequest} data - Los datos de registro.
   * @returns {Promise<User>} El usuario registrado.
   */
  register: async (data: RegistrationRequest): Promise<User> => {
    return apiClient.post<User>('/auth/register', {
      email: data.email,
      password: data.password
    });
  },

  /**
   * Registra un nuevo paciente en el sistema.
   * Realiza validaciones exhaustivas de campos opcionales y transforma los datos
   * para el formato esperado por el backend.
   * @param {RegistrationRequest} data - Los datos de registro del paciente.
   * @returns {Promise<User>} El paciente registrado.
   * @throws {Error} Si los datos no pasan las validaciones.
   */
  registerPatient: async (data: RegistrationRequest): Promise<User> => {
    console.log('=== VALIDACIÓN REGISTRO PACIENTE ===');
    console.log('Datos recibidos:', data);

    // 1. VALIDAR CAMPOS BÁSICOS REQUERIDOS
    if (!data.email || !authService.isValidEmail(data.email)) {
      throw new Error('Email válido es requerido');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Contraseña debe tener al menos 6 caracteres');
    }

    // 2. VALIDAR CAMPOS ESPECÍFICOS DE PACIENTE

    // Validar UUID de ciudad si se proporciona
    if (data.cityId) {
      if (!authService.isValidUUID(data.cityId)) {
        throw new Error('Debe seleccionar una ciudad válida');
      }
    }

    // Validar fecha de nacimiento si se proporciona
    if (data.birthDate) {
      if (!authService.isValidDate(data.birthDate)) {
        throw new Error('Fecha de nacimiento debe tener formato YYYY-MM-DD');
      }
    }

    // Validar género si se proporciona
    if (data.gender && !['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
      throw new Error('Género debe ser MALE, FEMALE o OTHER');
    }

    // Validar tipo de sangre si se proporciona
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (data.bloodType && !validBloodTypes.includes(data.bloodType)) {
      throw new Error('Tipo de sangre debe ser uno de: ' + validBloodTypes.join(', '));
    }

    // 3. TRANSFORMAR DATOS SEGÚN BACKEND RegistrationRequest
    const transformedData: any = {
      // Campos básicos (requeridos)
      email: data.email.trim(),
      password: data.password,

      // Campos específicos de paciente (opcionales pero validados)
      ...(data.gender && { gender: data.gender }),
      ...(data.birthDate && { birthDate: data.birthDate }), // Backend espera LocalDate
      ...(data.bloodType && { bloodType: data.bloodType }),
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address && { address: data.address.trim() }),
      ...(data.cityId && { cityId: authService.formatUUID(data.cityId) }), // Backend espera UUID
    };

    console.log('Datos transformados para backend:', transformedData);
    console.log('=== ENVIANDO A /register/patient ===');

    return apiClient.post<User>('/register/patient', transformedData);
  },

  /**
   * Registra un nuevo doctor en el sistema.
   * Requiere campos específicos como apellidos, número de licencia y especialidad.
   * Realiza validaciones exhaustivas y transformación de datos.
   * @param {RegistrationRequest} data - Los datos de registro del doctor.
   * @returns {Promise<User>} El doctor registrado.
   * @throws {Error} Si los datos no pasan las validaciones o faltan campos requeridos.
   */
  registerDoctor: async (data: RegistrationRequest): Promise<User> => {
    console.log('=== VALIDACIÓN REGISTRO DOCTOR ===');
    console.log('Datos recibidos:', data);

    // 1. VALIDAR CAMPOS BÁSICOS REQUERIDOS
    if (!data.email || !authService.isValidEmail(data.email)) {
      throw new Error('Email válido es requerido');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Contraseña debe tener al menos 6 caracteres');
    }

    // 2. VALIDAR CAMPOS ESPECÍFICOS DE DOCTOR (REQUERIDOS)
    if (!data.lastName || data.lastName.trim().length === 0) {
      throw new Error('Apellidos son requeridos para doctores');
    }
    if (!data.licenseNumber || data.licenseNumber.trim().length === 0) {
      throw new Error('Número de licencia médica es requerido para doctores');
    }
    if (!data.specialty || data.specialty.trim().length === 0) {
      throw new Error('Especialidad es requerida para doctores');
    }

    // 3. VALIDAR CAMPOS OPCIONALES
    if (data.cityId && !authService.isValidUUID(data.cityId)) {
      throw new Error('Debe seleccionar una ciudad válida');
    }
    if (data.birthDate && !authService.isValidDate(data.birthDate)) {
      throw new Error('Fecha de nacimiento debe tener formato YYYY-MM-DD');
    }
    if (data.gender && !['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
      throw new Error('Género debe ser MALE, FEMALE o OTHER');
    }

    // 4. TRANSFORMAR DATOS SEGÚN BACKEND RegistrationRequest
    const transformedData: any = {
      // Campos básicos (requeridos)
      email: data.email.trim(),
      password: data.password,

      // Campos específicos de doctor (requeridos)
      lastName: data.lastName.trim(),
      licenseNumber: data.licenseNumber.trim(),
      specialty: data.specialty.trim(),

      // Campos opcionales
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address && { address: data.address.trim() }),
      ...(data.birthDate && { birthDate: data.birthDate }),
      ...(data.gender && { gender: data.gender }),
      ...(data.cityId && { cityId: authService.formatUUID(data.cityId) }),
    };

    console.log('Datos transformados para backend:', transformedData);
    console.log('=== ENVIANDO A /register/doctor ===');

    return apiClient.post<User>('/register/doctor', transformedData);
  },

  /**
   * Registra un nuevo miembro del personal administrativo en el sistema.
   * Campos específicos opcionales como departamento y posición.
   * Realiza validaciones y transformación de datos.
   * @param {RegistrationRequest} data - Los datos de registro del personal.
   * @returns {Promise<User>} El miembro del personal registrado.
   * @throws {Error} Si los datos no pasan las validaciones.
   */
  registerStaff: async (data: RegistrationRequest): Promise<User> => {
    console.log('=== VALIDACIÓN REGISTRO STAFF ===');
    console.log('Datos recibidos:', data);

    // 1. VALIDAR CAMPOS BÁSICOS REQUERIDOS
    if (!data.email || !authService.isValidEmail(data.email)) {
      throw new Error('Email válido es requerido');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Contraseña debe tener al menos 6 caracteres');
    }

    // 2. VALIDAR CAMPOS OPCIONALES
    if (data.cityId && !authService.isValidUUID(data.cityId)) {
      throw new Error('Debe seleccionar una ciudad válida');
    }
    if (data.birthDate && !authService.isValidDate(data.birthDate)) {
      throw new Error('Fecha de nacimiento debe tener formato YYYY-MM-DD');
    }
    if (data.gender && !['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
      throw new Error('Género debe ser MALE, FEMALE o OTHER');
    }

    // 3. TRANSFORMAR DATOS SEGÚN BACKEND RegistrationRequest
    const transformedData: any = {
      // Campos básicos (requeridos)
      email: data.email.trim(),
      password: data.password,

      // Campos opcionales
      ...(data.phone && { phone: data.phone.trim() }),
      ...(data.address && { address: data.address.trim() }),
      ...(data.birthDate && { birthDate: data.birthDate }),
      ...(data.gender && { gender: data.gender }),
      ...(data.cityId && { cityId: authService.formatUUID(data.cityId) }),

      // Campos específicos de staff (opcionales)
      ...(data.department && { department: data.department.trim() }),
      ...(data.position && { position: data.position.trim() }),
    };

    console.log('Datos transformados para backend:', transformedData);
    console.log('=== ENVIANDO A /register/staff ===');

    return apiClient.post<User>('/register/staff', transformedData);
  },

  /**
   * Refresca el token de acceso usando el refresh token.
   * @param {string} refreshToken - El refresh token para obtener un nuevo access token.
   * @returns {Promise<JwtResponse>} Los nuevos tokens de autenticación.
   */
  refreshToken: async (refreshToken: string): Promise<JwtResponse> => {
    return apiClient.post<JwtResponse>('/auth/refresh?refreshToken=' + refreshToken);
  },

  /**
   * Obtiene la información del usuario actualmente autenticado.
   * @returns {Promise<User>} Los datos del usuario actual.
   * @throws {Error} Si no hay token válido o el usuario no existe.
   */
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },

  /**
   * Realiza el logout del usuario eliminando los tokens almacenados.
   * @returns {Promise<void>}
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
