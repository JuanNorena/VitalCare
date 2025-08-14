import { useState, useCallback } from "react";
import { useSelfServices } from "@/hooks/use-self-services";
import { useServicePoints } from "@/hooks/use-service-points";
import { useServices } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Edit, MapPin, Cog } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

/**
 * Datos del formulario para crear o actualizar un autoservicio
 * @interface SelfServiceFormData
 */
interface SelfServiceFormData {
  /** Nombre del autoservicio */
  name: string;
  /** Descripción del autoservicio */
  description: string;
  /** Lista de IDs de puntos de servicio asociados */
  servicePointIds: number[];
  /** Lista de IDs de servicios asociados */
  serviceIds: number[];
}

/**
 * Componente principal para la gestión de autoservicios
 * 
 * Este componente permite administrar autoservicios del sistema, incluyendo
 * operaciones CRUD completas (crear, leer, actualizar, eliminar) y gestión
 * de relaciones con puntos de servicio y servicios. Los autoservicios permiten
 * a los usuarios generar turnos de forma autónoma sin intervención del personal.
 * 
 * Características principales:
 * - Vista en grid responsiva de autoservicios
 * - Modal para crear/editar autoservicios
 * - Selección múltiple de servicios y puntos de servicio
 * - Activación/desactivación de autoservicios
 * - Validación de formularios
 * - Manejo de estados de carga
 * 
 * @component
 * @returns {JSX.Element} Interfaz de gestión de autoservicios
 * 
 * @example
 * ```tsx
 * import SelfServices from '@/pages/admin/self-services';
 * 
 * function AdminPanel() {
 *   return (
 *     <div>
 *       <SelfServices />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @author Sistema de Gestión de Atención Plus
 * @since 1.0.0
 * @version 1.0.0
 */
export default function SelfServices() {  // ================================================================================
  // HOOKS DE DATOS
  // ================================================================================
  
  /**
   * Hook para gestionar autoservicios con operaciones CRUD
   */
  const {
    selfServices,
    isLoading,
    createSelfService,
    updateSelfService,
    updateSelfServiceStatus,
  } = useSelfServices();

  /** Hook para obtener puntos de servicio disponibles */
  const { servicePoints, isLoading: isServicePointsLoading } = useServicePoints();
  
  /** Hook para obtener servicios disponibles */
  const { services, isLoading: isServicesLoading } = useServices();

  // ================================================================================
  // ESTADO LOCAL DEL COMPONENTE
  // ================================================================================
  
  /** Estado para controlar la visibilidad del modal */
  const [isOpen, setIsOpen] = useState(false);
  
  /** Estado para controlar el proceso de envío del formulario */
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /** Autoservicio actualmente en edición (null para crear nuevo) */
  const [editingSelfService, setEditingSelfService] = useState<any>(null);
  
  /** IDs de servicios seleccionados en el formulario */
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  
  /** IDs de puntos de servicio seleccionados en el formulario */
  const [selectedServicePointIds, setSelectedServicePointIds] = useState<number[]>([]);

  // ================================================================================
  // HOOKS DE UTILIDADES
  // ================================================================================
  
  /** Hook para internacionalización de textos */
  const { t } = useTranslation();
  
  /** Hook para mostrar notificaciones toast */
  const { toast } = useToast();

  // ================================================================================
  // FUNCIÓN PRINCIPAL DE ENVÍO DEL FORMULARIO
  // ================================================================================
  
  /**
   * Maneja el envío del formulario para crear o actualizar un autoservicio
   * @async
   * @function handleSubmit
   * @param {React.FormEvent<HTMLFormElement>} e - Evento del formulario
   * @description Procesa los datos del formulario y ejecuta la operación correspondiente
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data: SelfServiceFormData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      servicePointIds: selectedServicePointIds,
      serviceIds: selectedServiceIds,
    };

    try {
      if (editingSelfService) {
        await updateSelfService({
          selfServiceId: editingSelfService.id,
          data,
        });
      } else {
        await createSelfService(data);
      }
      handleClose();
    } catch (error) {
      console.error("Error managing self service:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================================================================================
  // FUNCIONES DE MANEJO DE EVENTOS
  // ================================================================================
  
  /**
   * Prepara el formulario para editar un autoservicio existente
   * @function handleEdit
   * @callback
   * @param {any} selfService - Autoservicio a editar
   * @description Carga los datos del autoservicio en el formulario y abre el modal
   */
  const handleEdit = useCallback((selfService: any) => {
    setEditingSelfService(selfService);
    setSelectedServiceIds(selfService.services?.map((s: any) => s.id) || []);
    setSelectedServicePointIds(selfService.servicePoints?.map((sp: any) => sp.id) || []);
    setIsOpen(true);
  }, []);

  /**
   * Prepara el formulario para crear un nuevo autoservicio
   * @function handleAdd
   * @callback
   * @description Limpia el formulario y abre el modal en modo creación
   */
  const handleAdd = useCallback(() => {
    setEditingSelfService(null);
    setSelectedServiceIds([]);
    setSelectedServicePointIds([]);
    setIsOpen(true);
  }, []);

  /**
   * Cierra el modal y limpia el estado del formulario
   * @function handleClose
   * @callback
   * @description Resetea todos los estados relacionados con el formulario
   */
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setEditingSelfService(null);
    setSelectedServiceIds([]);
    setSelectedServicePointIds([]);
  }, []);

  /**
   * Cambia el estado de activación de un autoservicio
   * @async
   * @function handleStatusChange
   * @callback
   * @param {number} selfServiceId - ID del autoservicio
   * @param {boolean} isActive - Nuevo estado de activación
   * @description Actualiza el estado activo/inactivo del autoservicio
   */
  const handleStatusChange = useCallback(
    async (selfServiceId: number, isActive: boolean) => {
      try {
        await updateSelfServiceStatus({ selfServiceId, isActive });
      } catch (error) {
        console.error("Error updating self service status:", error);
      }
    },
    [updateSelfServiceStatus]
  );

  /**
   * Maneja la selección/deselección de servicios en el formulario
   * @function handleServiceToggle
   * @param {number} serviceId - ID del servicio
   * @param {boolean} checked - Estado de selección
   * @description Agrega o quita servicios de la lista de seleccionados
   */
  const handleServiceToggle = (serviceId: number, checked: boolean) => {
    if (checked) {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    } else {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
    }
  };

  /**
   * Maneja la selección/deselección de puntos de servicio en el formulario
   * @function handleServicePointToggle
   * @param {number} servicePointId - ID del punto de servicio
   * @param {boolean} checked - Estado de selección
   * @description Agrega o quita puntos de servicio de la lista de seleccionados
   */
  const handleServicePointToggle = (servicePointId: number, checked: boolean) => {
    if (checked) {
      setSelectedServicePointIds([...selectedServicePointIds, servicePointId]);
    } else {
      setSelectedServicePointIds(selectedServicePointIds.filter((id) => id !== servicePointId));
    }
  };

  // ================================================================================
  // RENDERIZADO CONDICIONAL - ESTADO DE CARGA
  // ================================================================================
  
  /**
   * Muestra indicador de carga mientras se obtienen los datos
   */
  if (isLoading || isServicePointsLoading || isServicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // ================================================================================
  // RENDERIZADO PRINCIPAL DEL COMPONENTE
  // ================================================================================
  
  /**
   * Renderiza la interfaz principal de gestión de autoservicios
   * @returns {JSX.Element} Interfaz completa con header, modal y grid de autoservicios
   */
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ========================================================================== */}
      {/* HEADER CON TÍTULO Y BOTÓN DE AGREGAR */}
      {/* ========================================================================== */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold">{t("selfServices.title")}</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {t("selfServices.pageDescription")}
          </p>
        </div>
        
        {/* Modal para crear/editar autoservicio */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="w-full sm:w-auto whitespace-nowrap">
              <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t("selfServices.add")}</span>
              <span className="sm:hidden">{t("selfServices.addShort", "Nuevo")}</span>
            </Button>
          </DialogTrigger>
          
          {/* ====================================================================== */}
          {/* CONTENIDO DEL MODAL - FORMULARIO DE AUTOSERVICIO */}
          {/* ====================================================================== */}
          <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingSelfService
                  ? t("selfServices.edit")
                  : t("selfServices.add")}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingSelfService
                  ? t("selfServices.editDescription")
                  : t("selfServices.addDescription")}
              </DialogDescription>
            </DialogHeader>
            
            {/* Formulario principal */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo de nombre */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">{t("selfServices.name")}</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingSelfService?.name || ""}
                  className="w-full"
                  required
                />
              </div>
              
              {/* Campo de descripción */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">{t("selfServices.description")}</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingSelfService?.description || ""}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>
              
              {/* Selección de puntos de servicio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("selfServices.servicePoints")}</Label>
                <div className="mt-2 space-y-2 max-h-32 sm:max-h-48 overflow-y-auto border rounded-md p-3">
                  {servicePoints
                    ?.filter((sp) => sp.isActive)
                    .map((servicePoint) => (
                      <div key={servicePoint.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`servicePoint-${servicePoint.id}`}
                          checked={selectedServicePointIds.includes(servicePoint.id)}
                          onCheckedChange={(checked) =>
                            handleServicePointToggle(servicePoint.id, !!checked)
                          }
                          className="mt-1 flex-shrink-0"
                        />
                        <Label
                          htmlFor={`servicePoint-${servicePoint.id}`}
                          className="flex-1 cursor-pointer text-sm leading-relaxed"
                        >
                          <div className="space-y-1">
                            <div className="font-medium">{servicePoint.name}</div>
                            {servicePoint.description && (
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {servicePoint.description}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                </div>
                {selectedServicePointIds.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("selfServices.selectServicePoints")}
                  </p>
                )}
              </div>
              
              {/* Selección de servicios */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("selfServices.services")}</Label>
                <div className="mt-2 space-y-2 max-h-32 sm:max-h-48 overflow-y-auto border rounded-md p-3">
                  {services
                    ?.filter((service) => service.isActive)
                    .map((service) => (
                      <div key={service.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={selectedServiceIds.includes(service.id)}
                          onCheckedChange={(checked) =>
                            handleServiceToggle(service.id, !!checked)
                          }
                          className="mt-1 flex-shrink-0"
                        />
                        <Label
                          htmlFor={`service-${service.id}`}
                          className="flex-1 cursor-pointer text-sm leading-relaxed"
                        >
                          <div className="space-y-1">
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                </div>
                {selectedServiceIds.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("selfServices.selectServices")}
                  </p>
                )}
              </div>
              
              {/* Botón de envío */}
              <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="text-sm">
                      {editingSelfService
                        ? t("selfServices.updating")
                        : t("selfServices.creating")}
                    </span>
                  </>
                ) : (
                  <span className="text-sm">
                    {editingSelfService ? t("selfServices.update") : t("selfServices.create")}
                  </span>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ========================================================================== */}
      {/* GRID DE AUTOSERVICIOS */}
      {/* ========================================================================== */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">        {/* Mapeo de autoservicios en cards */}
        {selfServices?.map((selfService) => (
          <Card
            key={selfService.id}
            className={`${!selfService.isActive ? "opacity-60" : ""} overflow-hidden`}
          >
            {/* Header del card con título y botón de editar */}
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-sm sm:text-base leading-tight flex-1 min-w-0 pr-2">
                  <span className="line-clamp-2">{selfService.name}</span>
                </CardTitle>
                <div className="flex space-x-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(selfService)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {/* Contenido del card */}
            <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Descripción del autoservicio */}
              {selfService.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                  {selfService.description}
                </p>
              )}
              
              {/* Información de puntos de servicio y servicios */}
              <div className="space-y-3">
                {/* Puntos de servicio */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      {t("selfServices.servicePoints")}:
                    </span>
                  </div>
                  {selfService.servicePoints && selfService.servicePoints.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selfService.servicePoints.slice(0, 3).map((servicePoint) => (
                        <Badge key={servicePoint.id} variant="outline" className="text-xs truncate max-w-full">
                          {servicePoint.name}
                        </Badge>
                      ))}
                      {selfService.servicePoints.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{selfService.servicePoints.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Servicios asociados */}
                {selfService.services && selfService.services.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Cog className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium truncate">
                        {t("selfServices.assignedServices")}:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selfService.services.slice(0, 2).map((service) => (
                        <Badge key={service.id} variant="secondary" className="text-xs truncate max-w-full">
                          {service.name}
                        </Badge>
                      ))}
                      {selfService.services.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{selfService.services.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Control de activación/desactivación */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Label htmlFor={`active-${selfService.id}`} className="text-xs sm:text-sm font-medium">
                  {selfService.isActive ? t("common.active") : t("common.inactive")}
                </Label>
                <Switch
                  id={`active-${selfService.id}`}
                  checked={selfService.isActive}
                  onCheckedChange={(checked) =>
                    handleStatusChange(selfService.id, checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ========================================================================== */}
      {/* ESTADO VACÍO - NO HAY AUTOSERVICIOS */}
      {/* ========================================================================== */}
      {selfServices?.length === 0 && (
        <Card>
          <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Cog className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              {t("selfServices.noSelfServices")}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-md">
              {t("selfServices.noSelfServicesDescription")}
            </p>
            <Button onClick={handleAdd} className="w-full sm:w-auto">
              <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-sm">{t("selfServices.add")}</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
