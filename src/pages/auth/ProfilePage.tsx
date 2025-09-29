/**
 * Página de Perfil de Usuario - VitalCare.
 *
 * Esta página muestra la información completa del perfil del usuario autenticado,
 * combinando datos básicos del usuario con información específica según su rol.
 * Incluye características de accesibilidad y diseño responsivo.
 *
 * @description
 * Funcionalidades principales:
 * - Visualización de información básica del usuario (email, rol, estado)
 * - Información específica por rol (paciente, doctor, staff)
 * - Diseño responsivo con tarjetas organizadas
 * - Soporte para modo oscuro y escala de fuente
 * - Navegación integrada con el sidebar
 *
 * Información mostrada por rol:
 *
 * Para Pacientes:
 * - Nombre completo, documento, teléfono, dirección, género
 *
 * Para Doctores:
 * - Apellidos, especialidad, número de licencia, teléfono
 *
 * Para Personal Administrativo:
 * - Nombre completo, rol específico, teléfono
 *
 * @example
 * ```tsx
 * // La página se renderiza en la ruta /profile
 * // Accesible desde el sidebar haciendo click en el email del usuario
 * ```
 *
 * @see {@link userProfileService} para el servicio de obtención de datos.
 * @see {@link AccessibilityContext} para características de accesibilidad.
 * @see {@link Sidebar} para la navegación integrada.
 */

import { useQuery } from '@tanstack/react-query';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { userProfileService } from '@/services/userProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, FileText, Stethoscope, Users, Shield, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Página de Perfil de Usuario.
 *
 * @component
 * @returns {JSX.Element} Página con información completa del perfil del usuario.
 */
export function ProfilePage() {
  const { fontScale } = useAccessibility();

  /**
   * Query para obtener el perfil completo del usuario.
   * Incluye reintentos automáticos y manejo de errores.
   */
  const {
    data: profile,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userProfileService.getCurrentUserProfile,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  /**
   * Maneja el reintento de carga del perfil.
   */
  const handleRetry = () => {
    refetch();
  };

  /**
   * Determina el icono correspondiente al rol del usuario.
   */
  const getRoleIcon = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'PATIENT':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'DOCTOR':
        return <Stethoscope className="w-5 h-5 text-green-600" />;
      case 'STAFF':
        return <Shield className="w-5 h-5 text-purple-600" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  /**
   * Obtiene el nombre completo del usuario según su rol.
   */
  const getFullName = (profile: any) => {
    if (!profile) return 'Usuario';

    switch (profile.role?.toUpperCase()) {
      case 'PATIENT':
        return profile.firstName && profile.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : profile.email;
      case 'DOCTOR':
        return profile.lastName || profile.email;
      case 'STAFF':
        return profile.firstName && profile.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : profile.email;
      default:
        return profile.email;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--vc-bg)] text-[var(--vc-text)] p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--vc-hover)] rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-[var(--vc-hover)] rounded-lg"></div>
              <div className="h-64 bg-[var(--vc-hover)] rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--vc-bg)] text-[var(--vc-text)] p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <CardTitle className="text-red-800 dark:text-red-200">
                  Error al cargar el perfil
                </CardTitle>
              </div>
              <CardDescription className="text-red-700 dark:text-red-300">
                No se pudo cargar la información de tu perfil. Por favor, intenta nuevamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={handleRetry} variant="outline">
                  Reintentar
                </Button>
                <Link to="/dashboard">
                  <Button variant="default">
                    Ir al Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--vc-bg)] text-[var(--vc-text)] p-4 md:p-6 lg:p-8"
      style={{ fontSize: `${fontScale}rem` }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--vc-text)]">
              Mi Perfil
            </h1>
            <p className="text-[var(--vc-text)]/70 mt-1">
              Información completa de tu cuenta en VitalCare
            </p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">
              ← Volver al Dashboard
            </Button>
          </Link>
        </div>

        {/* Información Básica */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {getRoleIcon(profile?.role)}
              <div>
                <CardTitle className="flex items-center gap-2 text-[var(--vc-text)]">
                  Información Básica
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </CardTitle>
                <CardDescription className="text-[var(--vc-text)]/70">
                  Datos principales de tu cuenta de usuario
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[var(--vc-text)]/60" />
                <div>
                  <p className="text-sm text-[var(--vc-text)]/70">Correo electrónico</p>
                  <p className="font-medium text-[var(--vc-text)]">{profile?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[var(--vc-text)]/60" />
                <div>
                  <p className="text-sm text-[var(--vc-text)]/70">Rol</p>
                  <p className="font-medium text-[var(--vc-text)] capitalize">{profile?.role?.toLowerCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-[var(--vc-text)]/60" />
                <div>
                  <p className="text-sm text-[var(--vc-text)]/70">Estado de cuenta</p>
                  <p className="font-medium text-[var(--vc-text)]">
                    {profile?.enabled ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
              </div>
              {profile?.username && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-[var(--vc-text)]/60" />
                  <div>
                    <p className="text-sm text-[var(--vc-text)]/70">Nombre de usuario</p>
                    <p className="font-medium text-[var(--vc-text)]">{profile.username}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información Específica por Rol */}
        {profile?.role?.toUpperCase() === 'PATIENT' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <CardTitle className="text-[var(--vc-text)]">Perfil de Paciente</CardTitle>
                  <CardDescription className="text-[var(--vc-text)]/70">
                    Información médica y personal específica
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(profile.firstName || profile.lastName) && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Nombre completo</p>
                      <p className="font-medium text-[var(--vc-text)]">{getFullName(profile)}</p>
                    </div>
                  </div>
                )}
                {profile.documentNumber && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Número de documento</p>
                      <p className="font-medium text-[var(--vc-text)]">{profile.documentNumber}</p>
                    </div>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Teléfono</p>
                      <p className="font-medium text-[var(--vc-text)]">{profile.phone}</p>
                    </div>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Dirección</p>
                      <p className="font-medium text-[var(--vc-text)]">{profile.address}</p>
                    </div>
                  </div>
                )}
                {profile.gender && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Género</p>
                      <p className="font-medium text-[var(--vc-text)]">{profile.gender}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.role?.toUpperCase() === 'DOCTOR' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <CardTitle className="text-[var(--vc-text)]">Perfil de Doctor</CardTitle>
                  <CardDescription className="text-[var(--vc-text)]/70">
                    Información profesional y de especialización
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.lastName && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Apellidos</p>
                      <p className="font-medium text-[var(--vc-text)]">{profile.lastName}</p>
                    </div>
                  </div>
                )}
                {profile.specialty && (
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Especialidad</p>
                      <p className="font-medium text-[var(--vc-text)]">{profile.specialty}</p>
                    </div>
                  </div>
                )}
                {profile.licenseNumber && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Número de licencia</p>
                      <p className="font-medium text-[var(--vc-text)]">{profile.licenseNumber}</p>
                    </div>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Teléfono</p>
                      <p className="font-medium text-[var(--vc-text)]">{profile.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {profile?.role?.toUpperCase() === 'STAFF' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <CardTitle className="text-[var(--vc-text)]">Perfil Administrativo</CardTitle>
                  <CardDescription className="text-[var(--vc-text)]/70">
                    Información del personal administrativo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(profile.firstName || profile.lastName) && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Nombre completo</p>
                      <p className="font-medium text-[var(--vc-text)]">{getFullName(profile)}</p>
                    </div>
                  </div>
                )}
                {profile.role && (
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Rol específico</p>
                      <p className="font-medium text-[var(--vc-text)]">{profile.role}</p>
                    </div>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-[var(--vc-text)]/60" />
                    <div>
                      <p className="text-sm text-[var(--vc-text)]/70">Teléfono</p>
                      <p className="font-medium text-[var(--vc-text)]">{profile.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}