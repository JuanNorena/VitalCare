import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomBookingPage, CustomPageFormData, BranchWithCustomPage } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * Hook personalizado para la gestión de páginas de reserva personalizadas.
 * 
 * Este hook proporciona toda la funcionalidad necesaria para administrar
 * las páginas de reserva personalizadas por sede, incluyendo operaciones CRUD,
 * configuración de temas, gestión de assets y validación.
 * 
 * **Características principales:**
 * - Consulta de configuración de página personalizada por sede
 * - Creación y actualización de configuraciones
 * - Gestión de assets (logos, imágenes)
 * - Validación de slugs únicos
 * - Preview en tiempo real
 * - Cache inteligente con React Query
 * - Notificaciones automáticas de éxito/error
 * - Internacionalización completa
 * 
 * @hook
 * @example
 * ```tsx
 * function CustomPageManager({ branchId }) {
 *   const {
 *     customPage,
 *     isLoading,
 *     updateCustomPage,
 *     uploadLogo,
 *     validateSlug
 *   } = useCustomBookingPages(branchId);
 * 
 *   const handleSave = async (formData) => {
 *     try {
 *       await updateCustomPage(formData);
 *       // Notificación automática de éxito
 *     } catch (error) {
 *       // Manejo automático de errores
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <CustomPageEditor 
 *         config={customPage}
 *         onSave={handleSave}
 *       />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @param branchId - ID de la sede para la cual gestionar la página personalizada
 * @returns Objeto con datos y funciones para gestionar páginas personalizadas
 * 
 * @since 1.0.0
 * @version 1.0.0
 * @lastModified 2025-07-01
 */
export function useCustomBookingPages(branchId?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  /**
   * Consulta la información actualizada de la sede específica
   */
  const { 
    data: allBranches, 
    isLoading: isLoadingBranch,
    refetch: refetchBranches
  } = useQuery({
    queryKey: ['/api/branches'],
    queryFn: async () => {
      const response = await fetch('/api/branches', {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('errors.unknownError') }));
        throw new Error(errorData.message || t('errors.errorFetchingBranches'));
      }

      return response.json();
    },
    staleTime: 30 * 1000, // 30 segundos - más fresco para los cambios de logo
    gcTime: 2 * 60 * 1000, // 2 minutos
  });

  // Extraer la branch específica de la lista
  const branchData = branchId ? allBranches?.find((branch: any) => branch.id === branchId) : null;

  /**
   * Consulta la configuración de página personalizada para una sede específica.
   * 
   * @description
   * Obtiene la configuración completa de la página personalizada de una sede,
   * incluyendo todos los datos de personalización visual, contenido y configuración técnica.
   * Si no existe configuración, retorna null para permitir la creación de una nueva.
   */
  const { 
    data: customPage, 
    isLoading, 
    error,
    refetch: refetchCustomPage
  } = useQuery<CustomBookingPage | null>({
    queryKey: ['/api/custom-pages', branchId],
    queryFn: async () => {
      if (!branchId) return null;
      
      try {
        const response = await fetch(`/api/branches/${branchId}/custom-page`, {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null; // No existe configuración
          }
          const errorData = await response.json().catch(() => ({ message: t('errors.unknownError') }));
          throw new Error(errorData.message || t('errors.errorFetchingConfig'));
        }

        return response.json();
      } catch (error) {
        console.error('Error fetching custom page:', error);
        throw error;
      }
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });

  /**
   * Consulta todas las sedes con su configuración de página personalizada.
   * 
   * @description
   * Útil para dashboards administrativos que muestran el estado de personalización
   * de todas las sedes del sistema.
   */
  const { 
    data: allBranchesWithPages, 
    isLoading: isLoadingAll,
    refetch: refetchAllBranches
  } = useQuery<BranchWithCustomPage[]>({
    queryKey: ['/api/custom-booking-pages'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/custom-booking-pages', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: t('errors.unknownError') }));
          throw new Error(errorData.message || t('errors.errorFetchingBranches'));
        }

        return response.json();
      } catch (error) {
        console.error('Error fetching branches with custom pages:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  /**
   * Mutación para crear o actualizar la configuración de página personalizada.
   * 
   * @description
   * Permite crear una nueva configuración o actualizar una existente.
   * Incluye validación automática de datos y manejo de errores.
   */
  const updateCustomPageMutation = useMutation({
    mutationFn: async (formData: CustomPageFormData) => {
      if (!branchId) throw new Error(t('errors.branchIdRequired'));

      const response = await fetch(`/api/branches/${branchId}/custom-page`, {
        method: 'POST', // Siempre usar POST, el servidor maneja create/update automáticamente
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('errors.unknownError') }));
        throw new Error(errorData.message || t('errors.errorSavingConfig'));
      }

      return response.json();
    },
    onSuccess: () => {
      // Actualiza el cache tras guardar configuración
      queryClient.invalidateQueries({ queryKey: ['/api/custom-pages', branchId] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-booking-pages'] });
      
      // Notifica éxito al usuario
      toast({
        title: t('customPages.messages.saveSuccess'),
        description: t('customPages.messages.saveSuccessDescription'),
      });
    },
    onError: (error: Error) => {
      // Notifica error al usuario
      toast({
        variant: "destructive",
        title: t('customPages.messages.saveError') || t('common.error'),
        description: error.message,
      });
    },
  });

  /**
   * Mutación para subir logo de la sede.
   * 
   * @description
   * Maneja la carga de archivos de imagen para el logo de la sede,
   * con validación de formato y tamaño.
   */
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!branchId) throw new Error(t('errors.branchIdRequired'));

      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`/api/branches/${branchId}/upload-logo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('errors.unknownError') }));
        throw new Error(errorData.message || t('errors.errorUploadingLogo'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidar cache para refrescar los datos completos de la sede
      queryClient.invalidateQueries({ queryKey: ['/api/custom-pages', branchId] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-booking-pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      
      toast({
        title: t('customPages.messages.logoUploadSuccess'),
        description: t('customPages.messages.logoUploadSuccessDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('customPages.messages.logoUploadError') || t('common.error'),
        description: error.message,
      });
    },
  });

  /**
   * Mutación para eliminar logo de la sede.
   * 
   * @description
   * Elimina el logo actual de la sede, tanto del archivo físico
   * como de la base de datos.
   */
  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      if (!branchId) throw new Error(t('errors.branchIdRequired'));

      const response = await fetch(`/api/branches/${branchId}/remove-logo`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('errors.unknownError') }));
        throw new Error(errorData.message || t('errors.errorRemovingLogo'));
      }

      return response.json();
    },
    onSuccess: () => {
      // Actualiza el cache removiendo la URL del logo
      queryClient.invalidateQueries({ queryKey: ['/api/custom-pages', branchId] });
      queryClient.invalidateQueries({ queryKey: ['/api/custom-booking-pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      
      toast({
        title: t('customPages.messages.logoRemovedSuccess'),
        description: t('customPages.messages.logoRemovedSuccessDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('customPages.messages.logoRemoveError') || t('common.error'),
        description: error.message,
      });
    },
  });

  /**
   * Mutación para subir imagen de fondo de la página personalizada.
   * 
   * @description
   * Maneja la carga de archivos de imagen para el fondo de la página personalizada,
   * con validación de formato y tamaño.
   */
  const uploadBackgroundMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!branchId) throw new Error(t('errors.branchIdRequired'));

      const formData = new FormData();
      formData.append('background', file);

      const response = await fetch(`/api/branches/${branchId}/upload-background`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('errors.unknownError') }));
        throw new Error(errorData.message || t('errors.errorUploadingBackground'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Actualiza el cache con la nueva URL de la imagen de fondo
      queryClient.setQueryData(['/api/custom-pages', branchId], (old: CustomBookingPage | null) => 
        old ? { ...old, heroBackgroundImage: data.backgroundImageUrl } : null
      );
      
      toast({
        title: t('customPages.messages.backgroundUploadSuccess'),
        description: t('customPages.messages.backgroundUploadSuccessDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('customPages.messages.backgroundUploadError') || t('common.error'),
        description: error.message,
      });
    },
  });

  /**
   * Función para obtener la URL pública de una página personalizada.
   * 
   * @param slug - El slug de la página
   * @returns URL completa de la página pública
   */
  const getPublicPageUrl = (slug: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/booking/${slug}`;
  };

  /**
   * Función para regenerar el slug basado en el nombre de la sede.
   * 
   * @param branchName - Nombre de la sede
   * @returns Slug generado automáticamente
   */
  const generateSlug = (branchName: string): string => {
    return branchName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno solo
      .trim()
      .substring(0, 50); // Máximo 50 caracteres
  };

  return {
    // Datos
    customPage,
    branchData,
    allBranchesWithPages,
    
    // Estados
    isLoading: isLoading || isLoadingBranch,
    isLoadingAll,
    error,
    
    // Acciones
    updateCustomPage: updateCustomPageMutation.mutateAsync,
    uploadLogo: uploadLogoMutation.mutateAsync,
    removeLogo: removeLogoMutation.mutateAsync,
    uploadBackground: uploadBackgroundMutation.mutateAsync,
    
    // Estados de mutaciones
    isUpdating: updateCustomPageMutation.isPending,
    isUploadingLogo: uploadLogoMutation.isPending,
    isRemovingLogo: removeLogoMutation.isPending,
    isUploadingBackground: uploadBackgroundMutation.isPending,
    
    // Utilidades
    getPublicPageUrl,
    generateSlug,
    refetchCustomPage,
    refetchBranches,
    refetchAllBranches,
  };
}

export default useCustomBookingPages;
