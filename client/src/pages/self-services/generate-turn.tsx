import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelfServices } from "@/hooks/use-self-services";
import { useServicePoints } from "@/hooks/use-service-points";
import { useServices, useServiceWithForm } from "@/hooks/use-services";
import { useGenerateTurn } from "@/hooks/use-generate-turn";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DynamicForm } from "@/components/appointments/dynamic-form";
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  MapPin, 
  Cog, 
  Printer,
  Users,
  Calendar,
  RotateCcw,
  Maximize,
  Minimize,
  ChevronRight,
  Building2,
  FileText,
  AlertCircle,
  Check
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";
import { useFullscreen } from "@/contexts/fullscreen-context";

/**
 * Interfaz que define los detalles de un turno generado
 * @interface TurnDetails
 */
interface TurnDetails {
  /** Identificador único del turno */
  id: number;
  /** Código de confirmación del turno */
  confirmationCode: string;
  /** Información del punto de atención */
  servicePoint: {
    /** ID del punto de atención */
    id: number;
    /** Nombre del punto de atención */
    name: string;
  };
  /** Información del servicio */
  service: {
    /** ID del servicio */
    id: number;
    /** Nombre del servicio */
    name: string;
  };
  /** Fecha y hora de creación del turno en formato ISO */
  createdAt: string;
  /** Posición en la cola (opcional) */
  queuePosition?: number;
  /** Tiempo estimado de espera en minutos (opcional) */
  estimatedWait?: number;
}

/**
 * Componente principal para la generación de turnos inmediatos desde autoservicios.
 * 
 * Este componente permite a los usuarios generar turnos sin necesidad de programar citas,
 * basándose en la configuración de autoservicios existentes. Incluye:
 * - Selección de autoservicio, servicio y punto de atención
 * - Manejo de formularios dinámicos cuando son requeridos por el servicio
 * - Generación inmediata del turno y entrada automática en la cola
 * - Impresión de comprobante del turno
 * 
 * @component
 * @example
 * ```tsx
 * // Uso básico del componente
 * <GenerateTurn />
 * ```
 * 
 * @returns {JSX.Element} El componente de generación de turnos
 * 
 * @author Sistema de Gestión de Atención
 * @since 1.0.0
 */
export default function GenerateTurn() {  // ============================================================================
  // HOOKS DE DATOS
  // ============================================================================
  
  /** Hook para obtener información del usuario actual */
  const { user } = useUser();
  
  /** Hook para obtener los autoservicios disponibles */
  const { selfServices, isLoading: isSelfServicesLoading } = useSelfServices();
  
  /** Hook para obtener los puntos de atención */
  const { servicePoints } = useServicePoints();
  
  /** Hook para obtener los servicios globales */
  const { services } = useServices();
  
  /** Hook para generar turnos */
  const { generateTurn, isGenerating } = useGenerateTurn();
  
  /** Hook para manejo de pantalla completa */
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  
  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================
  
  /** ID del autoservicio seleccionado */
  const [selectedSelfServiceId, setSelectedSelfServiceId] = useState<number | null>(null);
  
  /** ID del servicio seleccionado */
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  
  /** ID del punto de atención seleccionado */
  const [selectedServicePointId, setSelectedServicePointId] = useState<number | null>(null);
  
  /** Detalles del turno generado */
  const [generatedTurn, setGeneratedTurn] = useState<TurnDetails | null>(null);
  
  /** Indica si debe mostrarse el formulario dinámico */
  const [showForm, setShowForm] = useState(false);
  
  /** Datos del formulario completado por el usuario */
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
    /** Estado para controlar la visibilidad de los controles en pantalla completa */
  const [showControls, setShowControls] = useState(true);
  
  // ============================================================================
  // HOOKS DE UTILIDAD
  // ============================================================================
  
  /** Hook de traducción para internacionalización */
  const { t } = useTranslation();
  
  /** Hook para mostrar notificaciones toast */
  const { toast } = useToast();
  
  /** Hook de navegación */
  const [, navigate] = useLocation();
  // ============================================================================
  // DATOS DERIVADOS
  // ============================================================================
    /** Obtiene detalles del servicio con información del formulario asociado */
  const { data: serviceWithForm } = useServiceWithForm(selectedServiceId);

  /** Autoservicio actualmente seleccionado */
  const selectedSelfService = selfServices?.find(ss => ss.id === selectedSelfServiceId);
    /** 
   * Servicios disponibles para el autoservicio seleccionado:
   * Para ambos roles (admin y selfservice), mostramos los servicios asignados al autoservicio
   * ya que los autoservicios ya están filtrados por sede para usuarios selfservice
   */
  const availableServices = useMemo(() => {
    // Mostrar servicios del autoservicio seleccionado (solo activos)
    return selectedSelfService?.services?.filter(s => s.isActive) || [];
  }, [selectedSelfService?.services]);
  
  /** Servicio seleccionado con información completa (incluye datos del formulario) */
  const selectedService = serviceWithForm || availableServices.find(s => s.id === selectedServiceId);
    /** 
   * Puntos de atención disponibles para el autoservicio seleccionado:
   * Para ambos roles, mostramos los puntos asignados al autoservicio
   * ya que los autoservicios ya están filtrados por sede para usuarios selfservice
   */
  const availableServicePoints = useMemo(() => {
    // Mostrar puntos del autoservicio seleccionado (solo activos)
    return selectedSelfService?.servicePoints?.filter(sp => sp.isActive) || [];
  }, [selectedSelfService?.servicePoints]);  /**
   * Verifica si un servicio tiene un formulario asociado
   * @param serviceId - ID del servicio a verificar
   * @returns True si el servicio tiene formulario, false en caso contrario
   */
  const getServiceHasForm = (serviceId: number) => {
    // Buscar en los servicios disponibles del autoservicio
    const availableService = availableServices.find(s => s.id === serviceId);
    if (availableService && 'formId' in availableService) {
      return availableService.formId != null;
    }
    
    // Fallback a servicios globales
    const globalService = services?.find(s => s.id === serviceId);
    return globalService?.formId != null;
  };

  // ============================================================================
  // EFECTOS
  // ============================================================================
  
  /**
   * Resetea las selecciones dependientes cuando cambia el autoservicio
   * Preserva formData para mantener los datos del formulario
   */
  useEffect(() => {
    setSelectedServiceId(null);
    setSelectedServicePointId(null);
    setShowForm(false);
  }, [selectedSelfServiceId]);
  /**
   * Resetea el punto de atención cuando cambia el servicio
   * Preserva formData para mantener los datos del formulario
   */
  useEffect(() => {
    setSelectedServicePointId(null);
    setShowForm(false);
  }, [selectedServiceId]);

  /**
   * Maneja teclas de acceso directo para pantalla completa
   */
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
      // Mostrar controles al presionar cualquier tecla en pantalla completa
      if (isFullscreen) {
        setShowControls(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen, toggleFullscreen]);

  /**
   * Auto-hide controles en pantalla completa después de 3 segundos de inactividad
   */
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isFullscreen && showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    const handleMouseMove = () => {
      if (isFullscreen) {
        setShowControls(true);
      }
    };

    if (isFullscreen) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isFullscreen, showControls]);// ============================================================================
  // VALORES COMPUTADOS
  // ============================================================================
  
  /** Indica si el servicio seleccionado tiene un formulario asociado */
  const serviceHasForm = serviceWithForm?.formId != null;

  /**
   * Datos iniciales memoizados para el formulario dinámico
   * Previene re-renders innecesarios del componente DynamicForm
   */
  const memoizedInitialData = useMemo(() => {
    return formData || {};
  }, [formData]);

  // ============================================================================
  // FUNCIONES PRINCIPALES
  // ============================================================================

  /**
   * Maneja la generación del turno principal
   * Valida las selecciones requeridas y muestra el formulario si es necesario
   * @async
   * @function
   */
  const handleGenerateTurn = async () => {
    if (!selectedServiceId || !selectedServicePointId) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("generateTurn.selectAllFields"),
      });
      return;
    }

    if (serviceHasForm && !formData) {
      setShowForm(true);
      return;
    }

    try {
      const result = await generateTurn({
        serviceId: selectedServiceId,
        servicePointId: selectedServicePointId,
        formData: formData || undefined
      });

      const turnDetails: TurnDetails = {
        id: result.appointment.id,
        confirmationCode: result.appointment.confirmationCode,
        servicePoint: {
          id: result.servicePoint.id,
          name: result.servicePoint.name
        },
        service: {
          id: result.service.id,
          name: result.service.name
        },
        createdAt: result.appointment.scheduledAt,
        queuePosition: result.queuePosition,
        estimatedWait: result.estimatedWait
      };

      setGeneratedTurn(turnDetails);
      
      toast({
        title: t("generateTurn.turnGenerated"),
        description: t("generateTurn.turnGeneratedDescription"),
      });

    } catch (error) {
      console.error("Error generating turn:", error);      
    }
  };
  
  /**
   * Maneja el envío del formulario dinámico
   * Genera el turno inmediatamente con los datos del formulario
   * @async
   * @param data - Datos del formulario completado por el usuario
   */
  const handleFormSubmit = async (data: Record<string, any>) => {
    console.log("Form submitted with data:", data);
    setFormData(data);
    setShowForm(false);
    
    // Generate turn immediately with the form data
    try {
      const result = await generateTurn({
        serviceId: selectedServiceId!,
        servicePointId: selectedServicePointId!,
        formData: data
      });

      // Create turn details for display
      const turnDetails: TurnDetails = {
        id: result.appointment.id,
        confirmationCode: result.appointment.confirmationCode,
        servicePoint: {
          id: result.servicePoint.id,
          name: result.servicePoint.name
        },
        service: {
          id: result.service.id,
          name: result.service.name
        },
        createdAt: result.appointment.scheduledAt,
        queuePosition: result.queuePosition,
        estimatedWait: result.estimatedWait
      };

      setGeneratedTurn(turnDetails);
      
      toast({
        title: t("generateTurn.turnGenerated"),
        description: t("generateTurn.turnGeneratedDescription"),
      });    } catch (error) {
      console.error("Error generating turn:", error);
    }
  };

  /**
   * Maneja la cancelación del formulario dinámico
   * Oculta el formulario sin limpiar los datos para preservar la información
   * @callback
   */
  const handleFormCancel = useCallback(() => {
    setShowForm(false);
  }, []);
  
  /**
   * Reinicia el proceso para generar un nuevo turno
   * Limpia todas las selecciones y datos del formulario
   * @callback
   */
  const handleNewTurn = useCallback(() => {
    setSelectedSelfServiceId(null);
    setSelectedServiceId(null);
    setSelectedServicePointId(null);
    setGeneratedTurn(null);
    setShowForm(false);    
    setFormData(null);
  }, []);

  /**
   * Maneja la impresión del comprobante del turno
   * Abre una nueva ventana con el ticket formateado para impresión
   * @function
   */
  const handlePrintTurn = () => {
    if (!generatedTurn) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('generateTurn.printTurn')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .turn-ticket { border: 2px dashed #333; padding: 20px; max-width: 300px; margin: 0 auto; }
            .turn-number { font-size: 48px; font-weight: bold; margin: 20px 0; }
            .details { font-size: 14px; margin: 10px 0; }
            .header { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="turn-ticket">
            <div class="header">${t('generateTurn.turnDetails')}</div>
            <div class="turn-number">#${generatedTurn.confirmationCode}</div>
            <div class="details"><strong>${t('generateTurn.serviceName')}</strong> ${generatedTurn.service.name}</div>
            <div class="details"><strong>${t('generateTurn.servicePoint')}</strong> ${generatedTurn.servicePoint.name}</div>
            <div class="details"><strong>${t('generateTurn.generatedAt')}</strong> ${format(new Date(generatedTurn.createdAt), "PPp", { locale: es })}</div>
            ${generatedTurn.estimatedWait ? `<div class="details"><strong>${t('generateTurn.estimatedWait')}</strong> ${generatedTurn.estimatedWait} ${t('generateTurn.minutes')}</div>` : ''}
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);    
    printWindow.document.close();
  };  // ============================================================================
  // COMPONENTES AUXILIARES
  // ============================================================================

  /**
   * Componente para mostrar el progreso de la generación del turno
   */
  const ProgressIndicator = () => {
    const steps = [
      { 
        id: 1, 
        label: t('generateTurn.selectSelfService'), 
        completed: !!selectedSelfServiceId,
        icon: Building2
      },
      { 
        id: 2, 
        label: t('generateTurn.selectService'), 
        completed: !!selectedServiceId,
        icon: Cog
      },
      { 
        id: 3, 
        label: t('generateTurn.selectServicePoint'), 
        completed: !!selectedServicePointId,
        icon: MapPin
      },
      ...(serviceHasForm ? [{ 
        id: 4, 
        label: t('generateTurn.completeForm'), 
        completed: !!formData,
        icon: FileText
      }] : [])
    ];

    return (
      <div className={`mb-6 ${isFullscreen ? 'mb-8' : ''}`}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isActive = (step.id === 1 && !selectedSelfServiceId) ||
                           (step.id === 2 && selectedSelfServiceId && !selectedServiceId) ||
                           (step.id === 3 && selectedServiceId && !selectedServicePointId) ||
                           (step.id === 4 && selectedServicePointId && !formData);
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    flex items-center justify-center rounded-full border-2 transition-all duration-300
                    ${isFullscreen ? 'w-12 h-12' : 'w-10 h-10'}
                    ${step.completed 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : isActive 
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-muted-foreground/30 text-muted-foreground'
                    }
                  `}>
                    {step.completed ? (
                      <Check className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'}`} />
                    ) : (
                      <IconComponent className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'}`} />
                    )}
                  </div>
                  <span className={`
                    mt-2 text-center font-medium transition-colors duration-300
                    ${isFullscreen ? 'text-sm' : 'text-xs'}
                    ${step.completed 
                      ? 'text-primary' 
                      : isActive 
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }
                  `}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-3 transition-colors duration-300
                    ${step.completed ? 'bg-primary' : 'bg-muted-foreground/30'}
                    ${isFullscreen ? 'mx-4' : ''}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Componente para el botón de pantalla completa
   */
  const FullscreenButton = () => (
    <Button
      onClick={toggleFullscreen}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
        isFullscreen && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      title={`${t('visualizer.pressF11')} (F11)`}
    >
      {isFullscreen ? (
        <>
          <Minimize className="h-4 w-4" />
          {t('visualizer.exitFullscreen')}
        </>
      ) : (
        <>
          <Maximize className="h-4 w-4" />
          {t('visualizer.enterFullscreen')}
        </>
      )}
    </Button>
  );

  // ============================================================================
  // RENDERIZADO CONDICIONAL
  // ============================================================================
  /**
   * Muestra el indicador de carga mientras se obtienen los autoservicios
   */
  if (isSelfServicesLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${isFullscreen ? 'min-h-screen' : ''}`}>
        <Loader2 className={`animate-spin text-border ${isFullscreen ? 'h-12 w-12' : 'h-8 w-8'}`} />
      </div>
    );
  }
  /**
   * Muestra los detalles del turno generado exitosamente
   * Incluye información completa del turno y opciones de acción
   */
  if (generatedTurn) {
    return (
      <div className={`space-y-6 ${isFullscreen ? 'p-6 min-h-screen' : ''}`}>
        <div className="flex items-center justify-between relative">
          <h2 className={`font-bold ${isFullscreen ? 'text-4xl' : 'text-3xl'}`}>{t('generateTurn.title')}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleNewTurn}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('generateTurn.newTurn')}
            </Button>
            <FullscreenButton />
          </div>
        </div>

        <Card className={`mx-auto ${isFullscreen ? 'max-w-4xl' : 'max-w-2xl'}`}>
          <CardHeader className="text-center bg-green-50">
            <div className="flex justify-center mb-4">
              <div className={`bg-green-100 rounded-full flex items-center justify-center ${isFullscreen ? 'w-20 h-20' : 'w-16 h-16'}`}>
                <CheckCircle className={`text-green-600 ${isFullscreen ? 'h-10 w-10' : 'h-8 w-8'}`} />
              </div>
            </div>
            <CardTitle className={`text-green-800 ${isFullscreen ? 'text-3xl' : 'text-2xl'}`}>
              {t('generateTurn.turnGenerated')}
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-6 ${isFullscreen ? 'p-8' : 'p-6'}`}>
            {/* Turn Number */}
            <div className="text-center">
              <div className={`font-bold text-primary mb-2 ${isFullscreen ? 'text-8xl' : 'text-6xl'}`}>
                #{generatedTurn.confirmationCode}
              </div>
              <p className={`text-muted-foreground ${isFullscreen ? 'text-xl' : ''}`}>{t('generateTurn.turnNumber')}</p>
            </div>

            <Separator />

            {/* Turn Details */}
            <div className={`space-y-4 ${isFullscreen ? 'space-y-6' : ''}`}>
              <div className={`flex items-center justify-between rounded-lg bg-muted/20 ${isFullscreen ? 'p-4' : 'p-3'}`}>
                <div className="flex items-center gap-2">
                  <Cog className={`text-muted-foreground ${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  <span className={`font-medium ${isFullscreen ? 'text-lg' : ''}`}>{t('generateTurn.serviceName')}</span>
                </div>
                <Badge variant="secondary" className={`${isFullscreen ? 'text-base px-3 py-1' : ''}`}>{generatedTurn.service.name}</Badge>
              </div>

              <div className={`flex items-center justify-between rounded-lg bg-muted/20 ${isFullscreen ? 'p-4' : 'p-3'}`}>
                <div className="flex items-center gap-2">
                  <MapPin className={`text-muted-foreground ${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  <span className={`font-medium ${isFullscreen ? 'text-lg' : ''}`}>{t('generateTurn.servicePoint')}</span>
                </div>
                <Badge variant="outline" className={`${isFullscreen ? 'text-base px-3 py-1' : ''}`}>{generatedTurn.servicePoint.name}</Badge>
              </div>

              <div className={`flex items-center justify-between rounded-lg bg-muted/20 ${isFullscreen ? 'p-4' : 'p-3'}`}>
                <div className="flex items-center gap-2">
                  <Calendar className={`text-muted-foreground ${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  <span className={`font-medium ${isFullscreen ? 'text-lg' : ''}`}>{t('generateTurn.generatedAt')}</span>
                </div>
                <span className={`${isFullscreen ? 'text-base' : 'text-sm'}`}>
                  {format(new Date(generatedTurn.createdAt), "PPp", { locale: es })}
                </span>
              </div>

              {generatedTurn.estimatedWait && (
                <div className={`flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg ${isFullscreen ? 'p-4' : 'p-3'}`}>
                  <div className="flex items-center gap-2">
                    <Clock className={`text-blue-600 ${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                    <span className={`font-medium text-blue-800 ${isFullscreen ? 'text-lg' : ''}`}>{t('generateTurn.estimatedWait')}</span>
                  </div>
                  <span className={`text-blue-800 font-semibold ${isFullscreen ? 'text-lg' : ''}`}>
                    {generatedTurn.estimatedWait} {t('generateTurn.minutes')}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className={`grid gap-4 ${user?.role === "selfservice" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"} ${isFullscreen ? 'gap-6' : ''}`}>
              <Button onClick={handlePrintTurn} variant="outline" className={`w-full ${isFullscreen ? 'text-lg py-3' : ''}`}>
                <Printer className={`mr-2 ${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                {t('generateTurn.printTurn')}
              </Button>
              
              {/* Only show "View Queue" button for non-selfservice users */}
              {user?.role !== "selfservice" && (
                <Button 
                  onClick={() => navigate('/queue/manage')} 
                  variant="outline" 
                  className={`w-full ${isFullscreen ? 'text-lg py-3' : ''}`}
                >
                  <Users className={`mr-2 ${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  {t('generateTurn.goToQueue')}
                </Button>
              )}

              <Button onClick={handleNewTurn} className={`w-full ${isFullscreen ? 'text-lg py-3' : ''}`}>
                <RotateCcw className={`mr-2 ${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                {t('generateTurn.newTurn')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  /**
   * Muestra el formulario dinámico cuando es requerido por el servicio
   * El formulario se basa en la configuración definida para el servicio específico
   */
  if (showForm && serviceWithForm?.form) {
    return (
      <div className={`space-y-6 ${isFullscreen ? 'p-6 min-h-screen' : ''}`}>
        <div className="flex items-center justify-between">
          <h2 className={`font-bold ${isFullscreen ? 'text-4xl' : 'text-3xl'}`}>{t('generateTurn.title')}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleFormCancel}>
              {t('common.cancel')}
            </Button>
            <FullscreenButton />
          </div>
        </div>

        <Card className={`mx-auto ${isFullscreen ? 'max-w-4xl' : 'max-w-2xl'}`}>
          <CardHeader>
            <CardTitle className={`${isFullscreen ? 'text-2xl' : ''}`}>{t('generateTurn.formRequired')}</CardTitle>
            <p className={`text-muted-foreground ${isFullscreen ? 'text-lg' : ''}`}>
              {t('generateTurn.completeForm')} - {serviceWithForm.name}
            </p>
          </CardHeader>
          <CardContent className={`${isFullscreen ? 'p-8' : ''}`}>
            <DynamicForm
              form={serviceWithForm.form}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isSubmitting={isGenerating}
              initialData={memoizedInitialData} 
            />
          </CardContent>
        </Card>
      </div>
    );
  }  /**
   * Interfaz principal de generación de turnos
   * Muestra los selectores para autoservicio, servicio y punto de atención
   * Incluye validaciones y indicadores del estado del proceso
   */
  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-6 min-h-screen bg-gradient-to-br from-background to-muted/20' : ''}`}>
      {/* Header mejorado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full bg-primary/10 ${isFullscreen ? 'p-4' : ''}`}>
            <Clock className={`text-primary ${isFullscreen ? 'h-10 w-10' : 'h-8 w-8'}`} />
          </div>
          <div>
            <h1 className={`font-bold ${isFullscreen ? 'text-4xl' : 'text-3xl'}`}>
              {t('generateTurn.title')}
            </h1>
            <p className={`text-muted-foreground mt-1 ${isFullscreen ? 'text-lg' : ''}`}>
              {t('generateTurn.description')}
            </p>
          </div>
        </div>
        <FullscreenButton />
      </div>

      {/* Card principal con mejor diseño */}
      <Card className={`mx-auto shadow-lg border-0 ${isFullscreen ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-2 ${isFullscreen ? 'text-2xl' : 'text-xl'}`}>
              <FileText className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'}`} />
              {t('generateTurn.title')}
            </CardTitle>
            {(selectedSelfServiceId || selectedServiceId || selectedServicePointId) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleNewTurn}
                className="text-muted-foreground hover:text-foreground"
              >                
              <RotateCcw className="h-4 w-4 mr-1" />
                {t('generateTurn.restart')}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className={`${isFullscreen ? 'p-8' : 'p-6'}`}>
          {/* Indicador de progreso */}
          <ProgressIndicator />
          
          <div className="space-y-6">
            {/* Paso 1: Selección de Autoservicio */}
            <div className={`
              space-y-4 p-4 rounded-lg border-2 transition-all duration-300
              ${!selectedSelfServiceId 
                ? 'border-primary/30 bg-primary/5' 
                : 'border-muted/30 bg-background'
              }
            `}>
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-full transition-colors duration-300
                  ${selectedSelfServiceId ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}
                `}>
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <Label className={`font-semibold ${isFullscreen ? 'text-lg' : ''}`}>
                    1. {t('generateTurn.selectSelfService')}
                  </Label>                  
                  <p className={`text-muted-foreground ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                    {t('generateTurn.selectSelfServiceDescription')}
                  </p>
                </div>
                {selectedSelfServiceId && (
                  <Check className="h-5 w-5 text-green-600 ml-auto" />
                )}
              </div>
              
              <Select 
                value={selectedSelfServiceId?.toString() || ""} 
                onValueChange={(value) => setSelectedSelfServiceId(parseInt(value))}
              >
                <SelectTrigger className={`
                  transition-all duration-300
                  ${isFullscreen ? 'h-14 text-lg' : 'h-12'}
                  ${!selectedSelfServiceId ? 'border-primary shadow-sm' : ''}
                `}>
                  <SelectValue placeholder={t('generateTurn.selectSelfServicePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {selfServices?.filter(ss => ss.isActive).map((selfService) => (
                    <SelectItem key={selfService.id} value={selfService.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {selfService.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {!selfServices?.length && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <p className={`text-orange-700 ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                    {t('generateTurn.noSelfServicesAvailable')}
                  </p>
                </div>
              )}
            </div>

            {/* Paso 2: Selección de Servicio */}
            {selectedSelfServiceId && (
              <div className={`
                space-y-4 p-4 rounded-lg border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2
                ${!selectedServiceId 
                  ? 'border-primary/30 bg-primary/5' 
                  : 'border-muted/30 bg-background'
                }
              `}>
                <div className="flex items-center gap-3">
                  <div className={`
                    p-2 rounded-full transition-colors duration-300
                    ${selectedServiceId ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}
                  `}>
                    <Cog className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className={`font-semibold ${isFullscreen ? 'text-lg' : ''}`}>
                      2. {t('generateTurn.selectService')}
                    </Label>                    
                    <p className={`text-muted-foreground ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                      {t('generateTurn.selectServiceDescription')}
                    </p>
                  </div>
                  {selectedServiceId && (
                    <Check className="h-5 w-5 text-green-600 ml-auto" />
                  )}
                </div>
                
                <Select 
                  value={selectedServiceId?.toString() || ""} 
                  onValueChange={(value) => setSelectedServiceId(parseInt(value))}
                >
                  <SelectTrigger className={`
                    transition-all duration-300
                    ${isFullscreen ? 'h-14 text-lg' : 'h-12'}
                    ${!selectedServiceId ? 'border-primary shadow-sm' : ''}
                  `}>
                    <SelectValue placeholder={t('generateTurn.selectServicePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Cog className="h-4 w-4" />
                            <span>{service.name}</span>
                          </div>
                          {getServiceHasForm(service.id) && (                            
                            <Badge variant="outline" className="ml-2 text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {t('generateTurn.form')}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {!availableServices.length && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <p className={`text-orange-700 ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                      {t('generateTurn.noServicesAvailable')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Paso 3: Selección de Punto de Atención */}
            {selectedServiceId && (
              <div className={`
                space-y-4 p-4 rounded-lg border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2
                ${!selectedServicePointId 
                  ? 'border-primary/30 bg-primary/5' 
                  : 'border-muted/30 bg-background'
                }
              `}>
                <div className="flex items-center gap-3">
                  <div className={`
                    p-2 rounded-full transition-colors duration-300
                    ${selectedServicePointId ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}
                  `}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className={`font-semibold ${isFullscreen ? 'text-lg' : ''}`}>
                      3. {t('generateTurn.selectServicePoint')}
                    </Label>                    
                    <p className={`text-muted-foreground ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                      {t('generateTurn.selectServicePointDescription')}
                    </p>
                  </div>
                  {selectedServicePointId && (
                    <Check className="h-5 w-5 text-green-600 ml-auto" />
                  )}
                </div>
                
                <Select 
                  value={selectedServicePointId?.toString() || ""} 
                  onValueChange={(value) => setSelectedServicePointId(parseInt(value))}
                >
                  <SelectTrigger className={`
                    transition-all duration-300
                    ${isFullscreen ? 'h-14 text-lg' : 'h-12'}
                    ${!selectedServicePointId ? 'border-primary shadow-sm' : ''}
                  `}>
                    <SelectValue placeholder={t('generateTurn.selectServicePointPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServicePoints.map((servicePoint: any) => (
                      <SelectItem key={servicePoint.id} value={servicePoint.id.toString()}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {servicePoint.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {!availableServicePoints.length && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <p className={`text-orange-700 ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                      {t('generateTurn.noServicePointsAvailable')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Indicador de Formulario */}
            {serviceWithForm?.formId && (
              <div className={`
                p-4 rounded-lg border transition-all duration-300 animate-in fade-in slide-in-from-bottom-2
                ${formData 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-amber-50 border-amber-200'
                }
              `}>
                <div className={`flex items-center gap-3 ${formData ? 'text-green-800' : 'text-amber-800'}`}>
                  <div className={`
                    p-2 rounded-full
                    ${formData ? 'bg-green-100' : 'bg-amber-100'}
                  `}>
                    {formData ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                      {formData ? t('generateTurn.formCompleted') : t('generateTurn.formRequired')}
                    </p>                    
                    <p className={`${isFullscreen ? 'text-sm' : 'text-xs'} opacity-75`}>
                      {formData 
                        ? t('generateTurn.formCompletedCorrectly')
                        : t('generateTurn.serviceRequiresAdditionalInfo')
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de Generar Turno */}
            <div className="pt-4">
              <Button 
                onClick={handleGenerateTurn}
                disabled={!selectedServiceId || !selectedServicePointId || isGenerating}
                className={`
                  w-full transition-all duration-300 shadow-lg hover:shadow-xl
                  ${isFullscreen ? 'text-lg py-6 h-auto' : 'h-12'}
                  ${(!selectedServiceId || !selectedServicePointId) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-[1.02]'
                  }
                `}
                size={isFullscreen ? "lg" : "default"}
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className={`animate-spin ${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                    <span>{t('generateTurn.generating')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                    <span>
                      {serviceHasForm && !formData 
                        ? t('generateTurn.completeForm') 
                        : t('generateTurn.generateTurnButton')
                      }
                    </span>
                    <ChevronRight className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
