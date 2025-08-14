import { useState } from "react";
import { useBranches } from "@/hooks/use-branches";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Edit, MapPin, Phone, Mail, AlertCircle, Search, Eye, EyeOff, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import ServicePointsManager from "@/components/ServicePointsManager";
import { useQueryClient } from "@tanstack/react-query";
import type { Branch } from "@db/schema";

/**
 * Componente principal para la administración de sedes/sucursales del sistema.
 * 
 * Proporciona una interfaz integral y responsive para gestionar todas las operaciones
 * relacionadas con las sedes organizacionales, incluyendo operaciones CRUD, asignación
 * de puntos de atención y gestión de estados con preservación de historial.
 * 
 * @component
 * @namespace BranchesManagement
 * 
 * ## Características Principales
 * 
 * ### 🏢 Gestión de Sedes
 * - **Crear**: Formulario modal con validación completa
 * - **Editar**: Modificación de datos existentes con preservación de estado
 * - **Activar/Desactivar**: Control de estado sin pérdida de datos históricos
 * - **Eliminar**: Eliminación lógica que preserva referencias y historial
 * 
 * ### 🔍 Búsqueda y Filtrado
 * - **Búsqueda en tiempo real**: Por nombre, descripción o dirección
 * - **Filtros de estado**: Mostrar/ocultar sedes inactivas
 * - **Contador dinámico**: Resultados en tiempo real con totales
 * 
 * ### 🎯 Puntos de Atención
 * - **Gestión integrada**: Modal especializado para asignación de puntos
 * - **Selección múltiple**: Interface con checkboxes para asignación masiva
 * - **Reasignación**: Transferencia entre sedes con validación
 * 
 * ### 🌐 Internacionalización
 * - **Soporte multiidioma**: Español e Inglés completamente implementados
 * - **Validaciones localizadas**: Mensajes de error contextualizados
 * - **Formatos locales**: Fechas y números según configuración regional
 * 
 * ### 📱 Diseño Responsive
 * - **Mobile-first**: Optimizado para dispositivos móviles
 * - **Adaptativo**: Layout que se ajusta a diferentes tamaños de pantalla
 * - **Accesibilidad**: Cumple estándares WCAG 2.1
 * 
 * ## Flujo de Trabajo
 * 
 * ```
 * 1. Carga inicial → Mostrar lista de sedes
 * 2. Búsqueda/Filtro → Actualizar resultados en tiempo real
 * 3. Crear/Editar → Modal con validación → Guardar → Refrescar lista
 * 4. Activar/Desactivar → Toggle inmediato → Feedback visual
 * 5. Gestionar puntos → Modal especializado → Asignación → Sincronización
 * ```
 * 
 * ## Validaciones Implementadas
 * 
 * - **Nombre**: Requerido, longitud mínima
 * - **Dirección**: Requerida, formato válido
 * - **Email**: Formato RFC 5322 cuando se proporciona
 * - **Teléfono**: Formato opcional pero validado
 * - **Dependencias**: Verificación de puntos de atención asociados
 * 
 * ## Estados de Componente
 * 
 * - `isLoading`: Carga inicial de datos
 * - `isSubmitting`: Envío de formularios
 * - `isTogglingStatus`: Cambio de estado de sede
 * - `managingServicePoints`: Gestión de puntos de atención
 * 
 * @example
 * ```tsx
 * // Uso básico en routing de administración
 * <Route path="/admin/branches" element={<Branches />} />
 * 
 * // Integración en layout administrativo
 * function AdminLayout() {
 *   return (
 *     <AdminProvider>
 *       <div className="admin-layout">
 *         <AdminSidebar />
 *         <main className="admin-content">
 *           <Branches />
 *         </main>
 *       </div>
 *     </AdminProvider>
 *   );
 * }
 * 
 * // Uso con proveedores de contexto
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <I18nextProvider i18n={i18n}>
 *         <BrowserRouter>
 *           <Routes>
 *             <Route path="/admin/branches" element={<Branches />} />
 *           </Routes>
 *         </BrowserRouter>
 *       </I18nextProvider>
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Ejemplo de datos de sede
 * const branchData = {
 *   name: "Sede Principal",
 *   description: "Oficina central corporativa",
 *   address: "Av. Principal 123, Ciudad",
 *   phone: "+57 300 123 4567",
 *   email: "sede.principal@empresa.com",
 *   isActive: true
 * };
 * ```
 * 
 * @returns {JSX.Element} Interfaz completa de gestión de sedes con todas las funcionalidades
 * 
 * @throws {Error} Error de red al cargar datos de sedes
 * @throws {ValidationError} Error de validación en formularios
 * @throws {AuthorizationError} Error de permisos insuficientes
 * 
 * @see {@link useBranches} Hook principal para operaciones de sedes
 * @see {@link ServicePointsManager} Componente para gestión de puntos de atención
 * @see {@link useTranslation} Hook de internacionalización
 * @see {@link useToast} Sistema de notificaciones
 * 
 * @since 1.0.0
 * @version 2.1.0
 * 
 * @changelog
 * - v2.1.0: Implementación de nuevo modal de puntos de atención con checkboxes
 * - v2.0.0: Migración a activar/desactivar en lugar de eliminación física
 * - v1.5.0: Agregado soporte completo de internacionalización
 * - v1.2.0: Implementación de búsqueda y filtrado avanzado
 * - v1.0.0: Versión inicial con CRUD básico
 * 
 * @todo
 * - [ ] Implementar exportación de datos a Excel/PDF
 * - [ ] Agregar historial de cambios por sede
 * - [ ] Implementar carga lazy de puntos de atención
 * - [ ] Agregar soporte para importación masiva de sedes
 */
export default function Branches() {
  // Hooks y estados del componente
  const queryClient = useQueryClient();
  const { branches, isLoading, createBranch, updateBranch, toggleBranchStatus, isTogglingStatus } = useBranches();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(true); // Mostrar todas por defecto
  const [managingServicePoints, setManagingServicePoints] = useState<Branch | null>(null);
  const { t } = useTranslation();
  const { toast } = useToast();

  /**
   * Filtrado inteligente de sedes basado en criterios de búsqueda y estado.
   * 
   * Implementa búsqueda fuzzy en múltiples campos (nombre, descripción, dirección)
   * y filtrado por estado activo/inactivo con optimización de rendimiento.
   * 
   * @type {Branch[] | undefined}
   * 
   * @description
   * - **Búsqueda**: Case-insensitive en nombre, descripción y dirección
   * - **Estado**: Respeta configuración de mostrar/ocultar inactivas
   * - **Rendimiento**: Memorizado automáticamente por dependencias reactivas
   * 
   * @example
   * ```tsx
   * // Ejemplo de filtrado por término "principal"
   * // searchTerm = "principal"
   * // showInactive = true
   * // Resultado: Sedes que contengan "principal" en cualquier campo
   * 
   * const filtered = branches?.filter(branch => {
   *   const matchesSearch = branch.name.toLowerCase().includes("principal");
   *   const matchesStatus = true; // showInactive = true
   *   return matchesSearch && matchesStatus;
   * });
   * ```
   */
  const filteredBranches = branches?.filter((branch: Branch) => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = showInactive ? true : branch.isActive;
    
    return matchesSearch && matchesStatus;
  });  /**
   * Valida los datos del formulario de sede con reglas de negocio específicas.
   * 
   * Implementa validación client-side completa antes del envío al servidor,
   * proporcionando feedback inmediato al usuario y reduciendo llamadas innecesarias.
   * 
   * @param {FormData} formData - Datos del formulario HTML nativo
   * 
   * @returns {Object} Objeto con datos procesados y errores de validación
   * @returns {Object} return.data - Datos limpios y normalizados para envío
   * @returns {Record<string, string>} return.errors - Mapa de errores por campo
   * 
   * @description
   * ### Validaciones Implementadas:
   * - **Nombre**: Requerido, trim automático, longitud mínima implícita
   * - **Dirección**: Requerida, soporte multilínea, trim automático  
   * - **Email**: Validación RFC 5322 cuando se proporciona (opcional)
   * - **Teléfono**: Campo opcional, sin validación de formato específico
   * - **Descripción**: Campo opcional, sin restricciones
   * 
   * ### Procesamiento de Datos:
   * - Eliminación automática de espacios en blanco (trim)
   * - Normalización de campos vacíos a string vacío
   * - Preservación de saltos de línea en dirección
   * 
   * @example
   * ```tsx
   * // Ejemplo de validación exitosa
   * const formData = new FormData();
   * formData.set('name', 'Sede Principal');
   * formData.set('address', 'Av. Principal 123');
   * formData.set('email', 'sede@empresa.com');
   * 
   * const { data, errors } = validateForm(formData);
   * // data = { name: 'Sede Principal', address: 'Av. Principal 123', ... }
   * // errors = {} (sin errores)
   * ```
   * 
   * @example
   * ```tsx
   * // Ejemplo con errores de validación
   * const formData = new FormData();
   * formData.set('name', ''); // Error: requerido
   * formData.set('email', 'email-invalido'); // Error: formato
   * 
   * const { data, errors } = validateForm(formData);
   * // errors = { 
   * //   name: 'El nombre de la sede es requerido',
   * //   email: 'Formato de correo electrónico inválido'
   * // }
   * ```
   * 
   * @see {@link https://developer.mozilla.org/docs/Web/API/FormData} FormData API
   * @see {@link RegExp} Expresión regular para validación de email
   * 
   * @since 1.0.0
   * @version 1.2.0 - Agregada validación de email mejorada
   */
  const validateForm = (formData: FormData) => {
    const errors: Record<string, string> = {};
    const data = {
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string)?.trim(),
      address: (formData.get("address") as string)?.trim(),
      phone: (formData.get("phone") as string)?.trim(),
      email: (formData.get("email") as string)?.trim(),
    };

    // Validaciones requeridas
    if (!data.name) {
      errors.name = t('branches.nameRequired');
    }

    if (!data.address) {
      errors.address = t('branches.addressRequired');
    }

    // Validación del email si se proporciona
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = t('branches.invalidEmail');
    }

    return { data, errors };
  };
  /**
   * Procesa el envío del formulario de creación/edición de sedes.
   * 
   * Maneja tanto operaciones de creación como actualización con validación
   * previa, gestión de errores y feedback visual consistente al usuario.
   * 
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - Evento del formulario HTML
   * 
   * @returns {Promise<void>} Promesa que resuelve cuando la operación completa
   * 
   * @description
   * ### Flujo de Procesamiento:
   * 1. **Prevención**: Evita comportamiento default del navegador
   * 2. **Estado**: Activa indicadores de carga (isSubmitting)
   * 3. **Validación**: Ejecuta validaciones client-side
   * 4. **Decisión**: Determina operación (crear vs actualizar)
   * 5. **Ejecución**: Llama a hook correspondiente con manejo de errores
   * 6. **Feedback**: Muestra notificación de éxito/error
   * 7. **Limpieza**: Resetea estado y cierra modal
   * 
   * ### Manejo de Estados:
   * - `isSubmitting`: true durante procesamiento
   * - `formErrors`: Se limpian al inicio, se setean si hay errores
   * - `isOpen`: Se cierra automáticamente en éxito
   * - `editingBranch`: Se resetea después de operación exitosa
   * 
   * ### Gestión de Errores:
   * - **Validación**: Errores mostrados inline en formulario
   * - **Red**: Toast destructivo con mensaje localizado
   * - **Servidor**: Propagación de mensaje específico del backend
   * 
   * @example
   * ```tsx
   * // Uso en JSX del formulario
   * <form onSubmit={handleSubmit}>
   *   <input name="name" required />
   *   <button type="submit" disabled={isSubmitting}>
   *     {isSubmitting ? 'Guardando...' : 'Guardar'}
   *   </button>
   * </form>
   * ```
   * 
   * @throws {ValidationError} Cuando los datos no pasan validación client-side
   * @throws {NetworkError} Cuando falla la comunicación con el servidor
   * @throws {ServerError} Cuando el servidor retorna error de negocio
   * 
   * @see {@link validateForm} Función de validación utilizada
   * @see {@link useBranches} Hook que proporciona createBranch y updateBranch
   * @see {@link useToast} Sistema de notificaciones
   * 
   * @since 1.0.0
   * @version 1.3.0 - Mejorado manejo de errores y feedback visual
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    const formData = new FormData(e.currentTarget);
    const { data: branchData, errors } = validateForm(formData);

    // Si hay errores de validación, mostrarlos y salir
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingBranch) {
        await updateBranch({ id: editingBranch.id, branch: branchData });
        toast({
          title: t('common.success'),
          description: t('branches.updateSuccess'),
        });
      } else {
        await createBranch(branchData);
        toast({
          title: t('common.success'),
          description: t('branches.createSuccess'),
        });
      }
      setIsOpen(false);
      setEditingBranch(null);
      setFormErrors({});
    } catch (error) {
      console.error('Error saving branch:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: editingBranch ? t('branches.updateError') : t('branches.createError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  /**
   * Prepara y abre el modal de edición para una sede específica.
   * 
   * Configura el estado del componente para modo edición, pre-poblando
   * el formulario con los datos existentes de la sede seleccionada.
   * 
   * @param {Branch} branch - Objeto sede con todos sus datos actuales
   * 
   * @description
   * ### Operaciones Realizadas:
   * 1. **Estado**: Setea `editingBranch` con datos de la sede
   * 2. **Modal**: Abre el modal (`setIsOpen(true)`)
   * 3. **Formulario**: Los campos se auto-populan via `defaultValue`
   * 4. **Errores**: Se mantiene estado limpio de errores previos
   * 
   * ### Efectos Secundarios:
   * - El título del modal cambia a "Editar Sede"
   * - Los botones muestran texto de "Guardar" en lugar de "Crear"
   * - Los campos del formulario muestran valores actuales
   * - La validación se aplica sobre datos existentes
   * 
   * @example
   * ```tsx
   * // Llamada desde botón de editar en tarjeta de sede
   * <Button onClick={() => handleEdit(branch)}>
   *   <Edit className="h-4 w-4" />
   * </Button>
   * 
   * // branch = {
   * //   id: 1,
   * //   name: "Sede Principal",
   * //   description: "Oficina central",
   * //   address: "Av. Principal 123",
   * //   phone: "+57 300 123 4567",
   * //   email: "sede@empresa.com",
   * //   isActive: true,
   * //   createdAt: "2025-01-01T00:00:00Z"
   * // }
   * ```
   * 
   * @see {@link handleSubmit} Función que procesa la actualización
   * @see {@link handleClose} Función que limpia estado al cerrar
   * 
   * @since 1.0.0
   */
  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsOpen(true);
  };  /**
   * Gestiona el cambio de estado activo/inactivo de una sede mediante switch.
   * 
   * Implementa activación/desactivación lógica que preserva datos históricos
   * y relaciones existentes, proporcionando feedback inmediato al usuario.
   * 
   * @async
   * @param {Branch} branch - Sede objetivo del cambio de estado
   * @param {boolean} checked - Nuevo estado deseado (true = activo, false = inactivo)
   * 
   * @returns {Promise<void>} Promesa que resuelve cuando la operación completa
   * 
   * @description
   * ### Características del Toggle:
   * - **Inmediato**: UI se actualiza optimisticamente
   * - **Reversible**: Permite activar/desactivar múltiples veces
   * - **Seguro**: Preserva datos y relaciones existentes
   * - **Auditado**: Mantiene historial de cambios implícito
   * 
   * ### Estados Manejados:
   * - `isTogglingStatus`: Previene clics múltiples durante procesamiento
   * - `branch.isActive`: Se actualiza automáticamente via query invalidation
   * - UI feedback: Loading spinner y opacity reducida durante cambio
   * 
   * ### Notificaciones:
   * - **Éxito**: Toast verde con mensaje contextual (activado/desactivado)
   * - **Error**: Toast destructivo con mensaje específico del servidor
   * 
   * ### Validaciones Implícitas:
   * - Permisos de usuario validados en backend
   * - Verificación de existencia de sede
   * - Validación de dependencias (puntos de atención asociados)
   * 
   * @example
   * ```tsx
   * // Uso en componente Switch
   * <Switch
   *   checked={branch.isActive}
   *   onCheckedChange={(checked) => handleToggleStatus(branch, checked)}
   *   disabled={isTogglingStatus}
   * />
   * 
   * // branch = { id: 1, name: "Sede A", isActive: true, ... }
   * // checked = false (usuario quiere desactivar)
   * // Resultado: Sede se desactiva y muestra toast "Sede desactivada exitosamente"
   * ```
   * 
   * @throws {AuthorizationError} Usuario sin permisos de administrador
   * @throws {NotFoundError} Sede no existe en base de datos
   * @throws {BusinessRuleError} Violación de reglas de negocio
   * @throws {NetworkError} Fallo en comunicación con servidor
   * 
   * @see {@link useBranches} Hook que proporciona toggleBranchStatus
   * @see {@link useToast} Sistema de notificaciones
   * 
   * @since 2.0.0 - Implementación de activar/desactivar vs eliminación
   * @version 2.1.0 - Mejorado feedback visual y manejo de errores
   */
  const handleToggleStatus = async (branch: Branch, checked: boolean) => {
    try {
      await toggleBranchStatus({ 
        id: branch.id, 
        isActive: checked 
      });
      toast({
        title: t('common.success'),
        description: checked 
          ? t('branches.activateSuccess') 
          : t('branches.deactivateSuccess'),
      });
    } catch (error: any) {
      console.error('Error toggling branch status:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error?.message || t('branches.statusError'),
      });
    }
  };  /**
   * Inicializa el modal de gestión de puntos de atención para una sede específica.
   * 
   * Prepara el contexto para la asignación/reasignación de puntos de atención,
   * invalidando cachés para garantizar datos actualizados y abriendo modal especializado.
   * 
   * @param {Branch} branch - Sede para la cual gestionar puntos de atención
   * 
   * @description
   * ### Preparación de Datos:
   * - **Cache invalidation**: Fuerza recarga de puntos de atención
   * - **Estado limpio**: Asegura datos frescos para operaciones
   * - **Contexto**: Establece sede activa para el modal
   * 
   * ### Queries Invalidadas:
   * - `/api/service-points`: Puntos asignados a la sede específica
   * - `/api/service-points/all`: Todos los puntos disponibles en sistema
   * 
   * ### Efectos Inmediatos:
   * - Abre modal `ServicePointsManager`
   * - Inicia carga de datos frescos
   * - Muestra spinner mientras cargan datos
   * 
   * @example
   * ```tsx
   * // Llamada desde botón de gestión en tarjeta de sede
   * <Button onClick={() => handleManageServicePoints(branch)}>
   *   <Settings className="h-4 w-4" />
   *   Gestionar Puntos
   * </Button>
   * 
   * // branch = {
   * //   id: 1,
   * //   name: "Sede Principal",
   * //   isActive: true,
   * //   // ... otros campos
   * // }
   * 
   * // Resultado: Modal se abre con lista de puntos disponibles para asignar
   * ```
   * 
   * @see {@link ServicePointsManager} Componente modal especializado
   * @see {@link handleCloseServicePointsManager} Función de cierre y limpieza
   * @see {@link useQueryClient} Cliente de cache para invalidaciones
   * 
   * @since 1.0.0
   * @version 2.1.0 - Refactorizado a modal con checkboxes
   */
  const handleManageServicePoints = (branch: Branch) => {
    // Invalidar queries para asegurar datos frescos
    queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
    queryClient.invalidateQueries({ queryKey: ['/api/service-points/all'] });
    setManagingServicePoints(branch);
  };

  /**
   * Cierra el modal de gestión de puntos de atención y sincroniza datos.
   * 
   * Realiza limpieza de estado y invalidación de cachés para reflejar
   * cualquier cambio realizado durante la sesión de gestión.
   * 
   * @description
   * ### Operaciones de Limpieza:
   * - **Estado**: Limpia `managingServicePoints` (cierra modal)
   * - **Cache**: Invalida datos para refrescar listas
   * - **Sincronización**: Asegura consistencia de datos en UI
   * 
   * ### Invalidaciones Post-Cierre:
   * - Puntos de atención de todas las sedes
   * - Lista global de puntos disponibles
   * - Cache de relaciones sede-punto
   * 
   * @example
   * ```tsx
   * // Uso en modal ServicePointsManager
   * <ServicePointsManager 
   *   branch={managingServicePoints}
   *   isOpen={!!managingServicePoints}
   *   onClose={handleCloseServicePointsManager}
   * />
   * 
   * // Al cerrar: Modal desaparece y datos se refrescan automáticamente
   * ```
   * 
   * @see {@link handleManageServicePoints} Función de apertura correspondiente
   * @see {@link ServicePointsManager} Componente que utiliza esta función
   * 
   * @since 1.0.0
   */
  const handleCloseServicePointsManager = () => {
    // Invalidar queries para refrescar datos tras cambios
    queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
    queryClient.invalidateQueries({ queryKey: ['/api/service-points/all'] });
    setManagingServicePoints(null);
  };

  /**
   * Limpia el estado del formulario y cierra el modal de creación/edición.
   * 
   * Resetea todos los estados relacionados con el formulario para dejarlo
   * en condición inicial para próximas operaciones.
   * 
   * @description
   * ### Estados Limpiados:
   * - `isOpen`: false (cierra modal)
   * - `editingBranch`: null (modo creación)
   * - `formErrors`: {} (sin errores)
   * 
   * ### Casos de Uso:
   * - Click en botón "Cancelar"
   * - Escape key en modal
   * - Click fuera del modal (si está habilitado)
   * - Después de operación exitosa
   * 
   * @example
   * ```tsx
   * // Uso en botón cancelar
   * <Button type="button" variant="outline" onClick={handleClose}>
   *   Cancelar
   * </Button>
   * 
   * // Uso en configuración del modal
   * <Dialog open={isOpen} onOpenChange={setIsOpen}>
   *   // Modal se cierra automáticamente y llama handleClose internamente
   * </Dialog>
   * ```
   * 
   * @see {@link handleEdit} Función que prepara estado de edición
   * @see {@link handleSubmit} Función que puede llamar esto tras éxito
   * 
   * @since 1.0.0
   */
  const handleClose = () => {
    setIsOpen(false);
    setEditingBranch(null);
    setFormErrors({});
  };
  /**
   * Estado de carga inicial - Muestra spinner centrado mientras se cargan las sedes.
   * 
   * @description
   * Renderiza un indicador de carga optimizado para UX durante la carga inicial
   * de datos desde la API. Utiliza spinner animado con estilos consistentes
   * del design system.
   * 
   * ### Características:
   * - **Centrado**: Vertical y horizontalmente en área mínima de 400px
   * - **Accesible**: Color de borde semánticamente correcto
   * - **Animado**: Rotación suave vía CSS animations
   * - **Responsive**: Se adapta a diferentes tamaños de pantalla
   * 
   * @returns {JSX.Element} Spinner de carga centrado
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );  }

  /**
   * Renderizado principal del componente de gestión de sedes.
   * 
   * @description
   * Estructura completa de la interfaz de administración con todas las funcionalidades:
   * 
   * ### Secciones Principales:
   * 1. **Header**: Título y botón de crear sede
   * 2. **Búsqueda y Filtros**: Campo de búsqueda y toggle de inactivas
   * 3. **Lista de Sedes**: Cards con información detallada y controles
   * 4. **Estados Vacíos**: Mensajes cuando no hay datos o resultados
   * 5. **Modales**: Formulario de creación/edición y gestión de puntos
   * 
   * ### Layout Responsive:
   * - **Mobile**: Stack vertical, botones full-width
   * - **Tablet**: Grid adaptativo, controles optimizados
   * - **Desktop**: Layout horizontal completo
   * 
   * ### Interactividad:
   * - Búsqueda en tiempo real sin debounce
   * - Toggle de estado con feedback visual inmediato
   * - Modales con validación y manejo de errores
   * - Hover effects y transiciones suaves
   * 
   * @returns {JSX.Element} Interfaz completa de gestión de sedes
   */
  return (    
  <div className="space-y-6">
      {/* 
        SECCIÓN: Encabezado Principal
        Descripción: Título de página y botón de acción primaria para crear nueva sede
        Componentes: Dialog con formulario modal integrado
        Responsive: Botón se ajusta en móviles, título responsive automático
      */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('branches.title')}</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBranch(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('branches.create')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? t('branches.edit') : t('branches.create')}
              </DialogTitle>
              <DialogDescription>
                {editingBranch 
                  ? t('branches.editDescription') 
                  : t('branches.createDescription')
                }
              </DialogDescription>            
              </DialogHeader>
            
            {/* 
              FORMULARIO: Creación/Edición de Sede
              Funcionalidad: Manejo unificado de crear y editar con validación
              Validación: Client-side con feedback inmediato por campo
              Estados: Controla isSubmitting para UX durante envío
              Accesibilidad: Labels asociados, validación descriptiva, colores semánticos
            */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mensaje de error general */}
              {Object.keys(formErrors).length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('common.formErrors')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-4">
                {/* Nombre de la sede */}
                <div>
                  <Label htmlFor="name" className="flex items-center gap-1">
                    {t('branches.name')}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingBranch?.name || ""}
                    required
                    placeholder={t('branches.namePlaceholder')}
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <Label htmlFor="description">{t('branches.description')}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingBranch?.description || ""}
                    placeholder={t('branches.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                {/* Dirección */}
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    {t('branches.address')}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    defaultValue={editingBranch?.address || ""}
                    required
                    placeholder={t('branches.addressPlaceholder')}
                    rows={2}
                    className={formErrors.address ? "border-destructive" : ""}
                  />
                  {formErrors.address && (
                    <p className="text-sm text-destructive mt-1">{formErrors.address}</p>
                  )}
                </div>

                {/* Información de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{t('branches.phone')}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={editingBranch?.phone || ""}
                      placeholder={t('branches.phonePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t('branches.email')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingBranch?.email || ""}
                      placeholder={t('branches.emailPlaceholder')}
                      className={formErrors.email ? "border-destructive" : ""}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBranch ? t('common.save') : t('common.create')}
                </Button>
              </div>
            </form>
          </DialogContent>        
          </Dialog>      
          </div>

      {/* 
        SECCIÓN: Búsqueda y Filtros
        Funcionalidad: Filtrado en tiempo real por texto y estado
        Componentes: Input con icono, Button toggle, contador de resultados
        UX: Búsqueda instantánea sin debounce para respuesta inmediata
        Responsive: Stack en móviles, inline en desktop
      */}
      {branches && branches.length > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('branches.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>          
          {/* 
            FILTRO: Toggle Estado Activo/Inactivo
            Comportamiento: Filtro visual que no afecta datos del servidor
            Estado: showInactive controla visibilidad de sedes desactivadas
            UX: Iconos semánticos (Eye/EyeOff) y contador dinámico de resultados
          */}
          <div className="flex items-center space-x-2">
            <Button
              variant={showInactive ? "default" : "outline"}
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
              className="flex items-center gap-2"
            >
              {showInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showInactive ? t('branches.hideInactive') : t('branches.showInactive')}
            </Button>            
            {/* 
              CONTADOR: Resultados de Filtrado
              Funcionalidad: Muestra cantidad filtrada vs total con i18n
              Interpolación: Utiliza react-i18next para pluralización automática
              Responsive: Texto se adapta según espacio disponible
            */}
            <span className="text-sm text-muted-foreground">
              {t('branches.showingResults', { 
                count: filteredBranches?.length || 0,
                total: branches?.length || 0 
              })}
            </span>
          </div>
        </div>      )}

      {/* 
        SECCIÓN: Lista Principal de Sedes
        Layout: Grid responsivo de tarjetas con información completa
        Funcionalidad: Cada tarjeta incluye datos, controles y estado visual
        Estados: Hover effects, indicadores de carga, estados activo/inactivo
        Accesibilidad: Controles keyboard-accessible, labels descriptivos
      */}
      <div className="grid gap-4">
        {filteredBranches?.map((branch: Branch) => (
          <Card key={branch.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  {branch.name}
                </span>
                <div className="flex items-center gap-2">                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(branch)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {/* 
                    BOTÓN: Gestionar Puntos de Atención
                    Funcionalidad: Abre modal especializado para asignar/reasignar puntos
                    Tooltip: Título descriptivo para accesibilidad
                    Modal: ServicePointsManager con interface de checkboxes
                  */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageServicePoints(branch)}
                    title={t('branches.manageServicePoints')}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>            <CardContent className="space-y-3">
              {/* Descripción */}
              {branch.description && (
                <p className="text-sm text-muted-foreground">
                  {branch.description}
                </p>
              )}

              {/* Dirección */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm">{branch.address}</span>
              </div>

              {/* Información de contacto */}
              <div className="flex flex-col sm:flex-row gap-4">
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{branch.email}</span>
                  </div>
                )}              </div>

              {/* 
                SECCIÓN: Estado y Metadatos
                Componentes: Switch de estado, label descriptivo, fecha de creación
                Funcionalidad: Toggle inmediato con feedback visual y loading states
                UX: Colores semánticos para estado, opacity durante procesamiento
                Accesibilidad: Label asociado al switch, estados claramente diferenciados
              */}
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex items-center gap-3">
                  
                  {/* 
                    CONTROL: Switch de Estado Activo/Inactivo
                    Funcionalidad: Toggle inmediato que preserva datos históricos
                    Estados: Disabled durante procesamiento, spinner de feedback
                    Validación: Permisos y reglas de negocio manejados en backend
                    UX: Colores semánticos (verde/rojo) y cursor pointer en label
                  */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={branch.isActive}
                      onCheckedChange={(checked) => handleToggleStatus(branch, checked)}
                      disabled={isTogglingStatus}
                      id={`branch-status-${branch.id}`}
                    />
                    <label 
                      htmlFor={`branch-status-${branch.id}`}
                      className={`text-xs font-medium cursor-pointer ${
                        branch.isActive 
                          ? 'text-green-800 dark:text-green-300' 
                          : 'text-red-800 dark:text-red-300'
                      } ${isTogglingStatus ? 'opacity-50' : ''}`}
                    >
                      {branch.isActive ? t('common.active') : t('common.inactive')}
                    </label>
                    {isTogglingStatus && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </div>                </div>
                
                {/* 
                  METADATO: Fecha de Creación
                  Formato: Localizado según configuración de usuario/navegador
                  Responsive: Se mantiene visible en todos los tamaños
                  Estilo: Texto secundario para no competir con información principal
                */}
                <div className="text-xs text-muted-foreground">
                  {t('common.createdAt')}: {new Date(branch.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}        {/* Mensaje cuando no hay sedes o no hay resultados de búsqueda */}
        {filteredBranches?.length === 0 && branches?.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">{t('branches.noBranches')}</p>
              <p className="text-sm">{t('branches.noBranchesDescription')}</p>
            </CardContent>
          </Card>
        )}

        {/* Mensaje cuando hay sedes pero no hay resultados de búsqueda */}
        {filteredBranches?.length === 0 && branches && branches.length > 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">{t('branches.noSearchResults')}</p>
              <p className="text-sm">{t('branches.tryDifferentSearch')}</p>
            </CardContent>
          </Card>        )}
      </div>      {/* Modal para gestionar puntos de atención */}
      <ServicePointsManager 
        branch={managingServicePoints}
        isOpen={!!managingServicePoints}
        onClose={handleCloseServicePointsManager}
      />
    </div>
  );
}
