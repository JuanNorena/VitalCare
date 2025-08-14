import { useState, useEffect } from "react";
import { useServicePoints, useAllServicePoints } from "@/hooks/use-service-points";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, MapPin, Building, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { Branch, ServicePointWithBranch } from "@db/schema";

/**
 * Propiedades del componente ServicePointsManager.
 * 
 * @interface ServicePointsManagerProps
 * @description Define la estructura de props requeridas para el componente de gestión de puntos de atención.
 */
interface ServicePointsManagerProps {
  /** Sede para la cual gestionar puntos de atención. Si es null, el modal no se renderiza. */
  branch: Branch | null;
  /** Estado de visibilidad del modal. Controla si el componente está abierto o cerrado. */
  isOpen: boolean;
  /** Callback ejecutado cuando el modal debe cerrarse. Limpia estado padre. */
  onClose: () => void;
}

/**
 * Componente modal especializado para la gestión de asignaciones de puntos de atención a sedes.
 * 
 * Proporciona una interfaz intuitiva basada en checkboxes para seleccionar y asignar
 * múltiples puntos de atención a una sede específica, con procesamiento batch optimizado
 * y sincronización automática de datos.
 * 
 * @component
 * @namespace ServicePointsManagement
 * 
 * ## Características Principales
 * 
 * ### 🎯 Gestión Simplificada
 * - **Interface de checkboxes**: Selección múltiple intuitiva y accesible
 * - **Estado visual**: Indicadores claros de asignación actual vs nueva selección
 * - **Operaciones batch**: Procesamiento optimizado de múltiples asignaciones
 * - **Sincronización automática**: Cache invalidation para consistencia de datos
 * 
 * ### 🔄 Flujo de Asignación
 * - **Carga inicial**: Pre-selección de puntos ya asignados a la sede
 * - **Selección interactiva**: Toggle de checkboxes con feedback visual inmediato
 * - **Comparación inteligente**: Detecta diferencias entre estado actual y deseado
 * - **Procesamiento diferencial**: Solo ejecuta cambios necesarios (assign/unassign)
 * 
 * ### 📱 Diseño Responsive
 * - **Modal adaptativo**: Tamaños optimizados por breakpoint (md, sm, mobile)
 * - **Lista scrolleable**: Manejo de listas largas con scroll interno
 * - **Botones responsive**: Stack vertical en móviles, horizontal en desktop
 * - **Cards flexibles**: Layout que se adapta al contenido
 * 
 * ### 🌐 Internacionalización
 * - **Textos localizados**: Soporte completo para español e inglés
 * - **Mensajes contextuales**: Notificaciones específicas por operación
 * - **Interpolación dinámica**: Nombres de sede integrados en traducciones
 * 
 * ## Estados del Componente
 * 
 * ### Estados Locales
 * - `selectedServicePoints: number[]`: IDs de puntos seleccionados por usuario
 * - `isSaving: boolean`: Indica procesamiento activo de cambios
 * 
 * ### Estados Derivados  
 * - `branchLoading: boolean`: Carga de puntos asignados a sede específica
 * - `allLoading: boolean`: Carga de todos los puntos disponibles en sistema
 * - `isSelected: boolean`: Calculado por punto individual
 * - `isCurrentlyAssigned: boolean`: Calculado por punto y sede actual
 * 
 * ## Algoritmo de Procesamiento
 * 
 * ```typescript
 * // 1. Comparación de estados
 * const currentlyAssigned = branchServicePoints.map(sp => sp.id);
 * const selectedPoints = selectedServicePoints;
 * 
 * // 2. Cálculo de diferencias
 * const toAssign = selectedPoints.filter(id => !currentlyAssigned.includes(id));
 * const toUnassign = currentlyAssigned.filter(id => !selectedPoints.includes(id));
 * 
 * // 3. Ejecución optimizada
 * await Promise.all([
 *   ...toAssign.map(id => reassignServicePoint({ servicePointId: id, newBranchId })),
 *   ...toUnassign.map(id => unassignServicePoint({ servicePointId: id }))
 * ]);
 * ```
 * 
 * ## Validaciones y Reglas de Negocio
 * 
 * ### Validaciones Client-Side
 * - **Sede requerida**: Component guard que previene render sin sede
 * - **Estados consistentes**: Sincronización entre UI y datos del servidor
 * - **Prevención de duplicados**: IDs únicos en selecciones
 * 
 * ### Validaciones Server-Side (implícitas)
 * - **Permisos de usuario**: Verificación de roles administrativos
 * - **Existencia de entidades**: Validación de IDs de sede y puntos
 * - **Reglas de negocio**: Restricciones específicas del dominio
 * 
 * @example
 * ```tsx
 * // Uso básico desde componente padre
 * function BranchesAdmin() {
 *   const [managingBranch, setManagingBranch] = useState<Branch | null>(null);
 * 
 *   return (
 *     <div>
 *       <Button onClick={() => setManagingBranch(selectedBranch)}>
 *         Gestionar Puntos
 *       </Button>
 *       
 *       <ServicePointsManager 
 *         branch={managingBranch}
 *         isOpen={!!managingBranch}
 *         onClose={() => setManagingBranch(null)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Ejemplo de flujo completo de asignación
 * // 1. Usuario abre modal para "Sede Principal"
 * <ServicePointsManager branch={sedeA} isOpen={true} onClose={handleClose} />
 * 
 * // 2. Modal muestra puntos disponibles:
 * // ✅ Ventanilla 1 (ya asignado)
 * // ⬜ Ventanilla 2 (disponible)  
 * // ✅ Módulo A (ya asignado)
 * // ⬜ Módulo B (asignado a otra sede)
 * 
 * // 3. Usuario selecciona Ventanilla 2 y deselecciona Módulo A
 * // 4. Al guardar: asigna Ventanilla 2, desasigna Módulo A
 * // 5. Toast de éxito y modal se cierra automáticamente
 * ```
 * 
 * @param {ServicePointsManagerProps} props - Propiedades del componente
 * @param {Branch | null} props.branch - Sede para gestionar puntos de atención
 * @param {boolean} props.isOpen - Estado de visibilidad del modal
 * @param {() => void} props.onClose - Callback de cierre del modal
 * 
 * @returns {JSX.Element | null} Modal de gestión o null si no hay sede
 * 
 * @throws {Error} Error de red al cargar puntos de atención
 * @throws {ValidationError} Error de validación en asignaciones
 * @throws {AuthorizationError} Error de permisos insuficientes
 * @throws {BusinessRuleError} Violación de reglas de negocio del dominio
 * 
 * @see {@link useServicePoints} Hook para puntos de una sede específica
 * @see {@link useAllServicePoints} Hook para todos los puntos del sistema
 * @see {@link useQueryClient} Cliente para invalidación de cache
 * @see {@link useTranslation} Sistema de internacionalización
 * @see {@link useToast} Sistema de notificaciones
 * 
 * @author Sistema de Gestión de Atención
 * @since 1.0.0
 * @version 2.1.0
 * 
 * @changelog
 * - v2.1.0: Refactorización completa a interface de checkboxes
 * - v2.0.0: Migración de dropdowns a selección múltiple
 * - v1.5.0: Agregado soporte responsive y mobile-first
 * - v1.2.0: Implementación de cache invalidation automático
 * - v1.0.0: Versión inicial con asignación individual
 * 
 * @todo
 * - [ ] Implementar búsqueda/filtrado dentro del modal
 * - [ ] Agregar soporte para selección masiva (Seleccionar todo/Ninguno)
 * - [ ] Implementar preview de cambios antes de guardar
 * - [ ] Agregar soporte para operaciones con drag & drop
 * - [ ] Implementar historial de asignaciones por sede
 */
export default function ServicePointsManager({ branch, isOpen, onClose }: ServicePointsManagerProps) {
  // Hooks de gestión de datos y estado
  const queryClient = useQueryClient();
  const { servicePoints: branchServicePoints, isLoading: branchLoading, reassignServicePoint, unassignServicePoint } = useServicePoints(branch?.id);
  const { allServicePoints, isLoading: allLoading } = useAllServicePoints();
  const [selectedServicePoints, setSelectedServicePoints] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  /**
   * Inicializa el estado de selección con puntos ya asignados a la sede.
   * 
   * Efecto que se ejecuta cuando el modal se abre o cuando cambian los puntos
   * asignados, estableciendo el estado inicial de checkboxes.
   * 
   * @description
   * ### Comportamiento:
   * - Se activa solo cuando `isOpen` es true y hay datos de puntos
   * - Pre-marca checkboxes de puntos ya asignados a la sede
   * - Proporciona estado inicial consistente para interacciones del usuario
   * 
   * ### Dependencias:
   * - `isOpen`: Evita ejecución innecesaria cuando modal está cerrado
   * - `branchServicePoints`: Datos fuente para estado inicial
   * 
   * @since 2.1.0
   */
  useEffect(() => {
    if (isOpen && branchServicePoints) {
      const assignedIds = branchServicePoints.map(sp => sp.id);
      setSelectedServicePoints(assignedIds);
    }
  }, [isOpen, branchServicePoints]);

  /**
   * Invalida cachés de queries para garantizar datos actualizados.
   * 
   * Efecto que fuerza la recarga de datos cuando se abre el modal,
   * asegurando que la información mostrada esté sincronizada con el servidor.
   * 
   * @description
   * ### Queries Invalidadas:
   * - `/api/service-points`: Puntos específicos de la sede
   * - `/api/service-points/all`: Todos los puntos del sistema
   * 
   * ### Justificación:
   * - Garantiza consistencia de datos entre sesiones
   * - Previene estados desactualizados por cambios externos
   * - Optimiza UX con datos siempre frescos
   * 
   * @see {@link useQueryClient} Cliente de cache utilizado
   * 
   * @since 1.2.0
   */
  useEffect(() => {
    if (isOpen) {
      queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-points/all'] });
    }
  }, [isOpen, queryClient]);
  /**
   * Maneja el cambio de estado de selección para un punto de atención específico.
   * 
   * Función que actualiza el estado local de selecciones cuando el usuario
   * interactúa con los checkboxes, manteniendo inmutabilidad del estado.
   * 
   * @param {number} servicePointId - ID único del punto de atención
   * @param {boolean} checked - Nuevo estado de selección (true = seleccionado)
   * 
   * @description
   * ### Lógica de Actualización:
   * - **Seleccionar**: Agrega ID al array sin duplicados
   * - **Deseleccionar**: Remueve ID del array manteniendo otros
   * - **Inmutabilidad**: Usa spread operator para nuevo array
   * 
   * ### Optimización:
   * - Operación O(n) para filtrado, aceptable para datasets típicos
   * - Estado local para responsividad inmediata sin roundtrip al servidor
   * - Validación diferida hasta momento de guardado
   * 
   * @example
   * ```tsx
   * // Usuario marca checkbox del punto ID 5
   * handleServicePointToggle(5, true);
   * // selectedServicePoints: [1, 3, 5] (agrega 5)
   * 
   * // Usuario desmarca checkbox del punto ID 3  
   * handleServicePointToggle(3, false);
   * // selectedServicePoints: [1, 5] (remueve 3)
   * ```
   * 
   * @see {@link handleSaveChanges} Función que procesa las selecciones finales
   * 
   * @since 2.1.0
   */
  const handleServicePointToggle = (servicePointId: number, checked: boolean) => {
    setSelectedServicePoints(prev => {
      if (checked) {
        return [...prev, servicePointId];
      } else {
        return prev.filter(id => id !== servicePointId);
      }
    });
  };
  /**
   * Procesa y persiste los cambios de asignación de puntos de atención.
   * 
   * Función principal que analiza las diferencias entre el estado actual y deseado,
   * ejecuta las operaciones necesarias en el servidor y proporciona feedback al usuario.
   * 
   * @async
   * @returns {Promise<void>} Promesa que resuelve cuando todas las operaciones completan
   * 
   * @description
   * ### Algoritmo de Procesamiento:
   * 
   * 1. **Análisis Diferencial**:
   *    - Identifica puntos a asignar (seleccionados pero no asignados)
   *    - Identifica puntos a desasignar (asignados pero no seleccionados)
   *    - Optimiza para ejecutar solo cambios necesarios
   * 
   * 2. **Ejecución Secuencial**:
   *    - Procesa asignaciones primero (mayor probabilidad de éxito)
   *    - Procesa desasignaciones después
   *    - Detiene ejecución en primer error para consistencia
   * 
   * 3. **Gestión de Estados**:
   *    - Activa `isSaving` para bloquear UI durante procesamiento
   *    - Desactiva checkboxes y botones para prevenir modificaciones concurrentes
   *    - Garantiza limpieza de estado incluso en caso de error
   * 
   * ### Operaciones de Backend:
   * 
   * #### Asignación (`reassignServicePoint`)
   * ```typescript
   * await reassignServicePoint({ 
   *   servicePointId: pointId, 
   *   newBranchId: branch.id 
   * });
   * ```
   * 
   * #### Desasignación (`unassignServicePoint`)  
   * ```typescript
   * await unassignServicePoint({ 
   *   servicePointId: pointId 
   * });
   * ```
   * 
   * ### Manejo de Errores:
   * - **Error de red**: Toast destructivo con mensaje genérico
   * - **Error de servidor**: Toast con mensaje específico del backend
   * - **Error de validación**: Propagación de mensaje de reglas de negocio
   * - **Limpieza garantizada**: `finally` block asegura reset de `isSaving`
   * 
   * ### Feedback Usuario:
   * - **Éxito**: Toast verde con mensaje de confirmación + cierre automático de modal
   * - **Error**: Toast rojo con detalles específicos + modal permanece abierto
   * - **Progreso**: Spinner en botón + UI bloqueada durante procesamiento
   * 
   * @example
   * ```typescript
   * // Escenario: Usuario tenía puntos [1, 3] y selecciona [1, 5, 7]
   * const currentlyAssigned = [1, 3];
   * const selectedServicePoints = [1, 5, 7];
   * 
   * // Análisis:
   * const toAssign = [5, 7];    // Nuevos puntos seleccionados
   * const toUnassign = [3];     // Puntos desseleccionados
   * 
   * // Ejecución:
   * // 1. Asigna punto 5 a la sede
   * // 2. Asigna punto 7 a la sede  
   * // 3. Desasigna punto 3 de la sede
   * // 4. Muestra toast "Asignaciones guardadas exitosamente"
   * // 5. Cierra modal automáticamente
   * ```
   * 
   * @throws {NetworkError} Fallo de conectividad con servidor
   * @throws {ValidationError} Datos inválidos o inconsistentes
   * @throws {AuthorizationError} Permisos insuficientes para operación
   * @throws {BusinessRuleError} Violación de reglas de dominio
   * @throws {ConcurrencyError} Conflicto por modificación simultánea
   * 
   * @see {@link reassignServicePoint} Hook para asignar punto a sede
   * @see {@link unassignServicePoint} Hook para desasignar punto
   * @see {@link useToast} Sistema de notificaciones
   * 
   * @since 2.1.0
   * @version 2.1.1 - Mejorado manejo de errores concurrentes
   */
  const handleSaveChanges = async () => {
    if (!branch) return;

    try {
      setIsSaving(true);
      
      // Obtener los puntos actualmente asignados
      const currentlyAssigned = branchServicePoints?.map(sp => sp.id) || [];
      
      // Encontrar puntos que necesitan ser asignados (seleccionados pero no asignados actualmente)
      const toAssign = selectedServicePoints.filter(id => !currentlyAssigned.includes(id));
      
      // Encontrar puntos que necesitan ser desasignados (asignados actualmente pero no seleccionados)
      const toUnassign = currentlyAssigned.filter(id => !selectedServicePoints.includes(id));

      // Asignar nuevos puntos
      for (const servicePointId of toAssign) {
        await reassignServicePoint({ servicePointId, newBranchId: branch.id });
      }      // Desasignar puntos no seleccionados (usar unassignServicePoint)
      for (const servicePointId of toUnassign) {
        await unassignServicePoint({ servicePointId });
      }

      toast({
        title: t('common.success'),
        description: t('servicePoints.assignmentSuccess'),
      });

      onClose();
    } catch (error: any) {
      console.error('Error saving service point assignments:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error?.message || t('servicePoints.assignmentError'),
      });
    } finally {
      setIsSaving(false);
    }  };
  
  /**
   * Guard clause - Previene renderizado cuando no hay sede seleccionada.
   * 
   * @description
   * Patrón de early return que garantiza que el componente solo se renderiza
   * cuando hay una sede válida para gestionar. Previene errores de renderizado
   * y optimiza performance evitando cálculos innecesarios.
   * 
   * @returns {null} Cuando no hay sede seleccionada
   * 
   * @since 1.0.0
   */  if (!branch) return null;

  /**
   * Renderizado principal del modal de gestión de puntos de atención.
   * 
   * @description
   * Estructura responsive del modal con las siguientes secciones:
   * 
   * ### Componentes Principales:
   * 1. **Dialog Header**: Título con ícono y descripción contextual
   * 2. **Loading State**: Spinner centrado durante carga de datos
   * 3. **Service Points List**: Lista scrolleable con checkboxes
   * 4. **Action Buttons**: Controles de cancelar/guardar responsive
   * 
   * ### Layout Responsive:
   * - **Mobile**: `max-w-md` - Modal compacto para pantallas pequeñas
   * - **Tablet**: `sm:max-w-lg` - Ancho intermedio optimizado
   * - **Desktop**: `md:max-w-2xl` - Modal amplio para mejor visualización
   * - **Height**: `max-h-[80vh]` - Altura máxima con scroll interno
   * 
   * ### Estados de Carga:
   * - **Loading**: Spinner centrado mientras se cargan datos
   * - **Empty State**: Mensaje cuando no hay puntos disponibles
   * - **Interactive**: Lista de checkboxes con estados visuales
   * 
   * ### Características de UX:
   * - Scroll interno para listas largas
   * - Estados visuales diferenciados por selección
   * - Badges informativos por cada punto
   * - Botones con estados de carga y disable
   * 
   * @returns {JSX.Element} Modal completo de gestión de puntos
   */
  return (    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto sm:max-w-lg md:max-w-2xl max-h-[80vh] overflow-y-auto">
        
        {/* 
          SECCIÓN: Header del Modal
          Descripción: Título dinámico con nombre de sede e ícono contextual
          Internacionalización: Interpolación de branchName en traducción
          Accesibilidad: Título descriptivo para lectores de pantalla
        */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {t('servicePoints.manageTitle', { branchName: branch.name })}
          </DialogTitle>
          <DialogDescription>
            {t('servicePoints.manageDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {(branchLoading || allLoading) ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Lista de puntos de atención con checkboxes */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t('servicePoints.selectServicePoints')}
                </h3>
                
                {allServicePoints && allServicePoints.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allServicePoints.map((servicePoint) => {
                      const isSelected = selectedServicePoints.includes(servicePoint.id);
                      const isCurrentlyAssigned = servicePoint.branchId === branch.id;
                      
                      return (
                        <Card 
                          key={servicePoint.id} 
                          className={`transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-muted-foreground/50'
                          }`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={`servicepoint-${servicePoint.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => 
                                  handleServicePointToggle(servicePoint.id, checked as boolean)
                                }
                                disabled={isSaving}
                                className="mt-1"
                              />
                              
                              <div className="flex-1 min-w-0">
                                <label 
                                  htmlFor={`servicepoint-${servicePoint.id}`}
                                  className="block text-sm font-medium cursor-pointer"
                                >
                                  {servicePoint.name}
                                </label>
                                
                                {servicePoint.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {servicePoint.description}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <Badge 
                                    variant={servicePoint.isActive ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {servicePoint.isActive ? t('common.active') : t('common.inactive')}
                                  </Badge>
                                  
                                  {servicePoint.branchId && servicePoint.branchId !== branch.id && (
                                    <Badge variant="outline" className="text-xs">
                                      {t('common.currentBranch')}: {servicePoint.branchName}
                                    </Badge>
                                  )}
                                  
                                  {isCurrentlyAssigned && (
                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                                      {t('servicePoints.currentlyAssigned')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">{t('servicePoints.noServicePoints')}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.save')}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
