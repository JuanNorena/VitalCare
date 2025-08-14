import { useState, useEffect } from "react";
import { useServices, useServiceWithForm } from "@/hooks/use-services";
import { useAppointments } from "@/hooks/use-appointments";
import { useBranches } from "@/hooks/use-branches";
import { useBranchServices } from "@/hooks/use-branch-services";
import { ServiceSelect } from "@/components/appointments/service-select";
import { TimeSelect } from "@/components/appointments/time-select";
import { DynamicForm } from "@/components/appointments/dynamic-form";
import { QRDisplay } from "@/components/ui/qr-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  CheckCircle, 
  User,
  FileText,
  ArrowRight,
  QrCode
} from "lucide-react";
import { useLocation } from "wouter";
import { parse, format } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslation } from "react-i18next";

   /**
 * Propiedades del componente BookingWizard
 * @interface BookingWizardProps
 */
export interface BookingWizardProps {
  /** Indica si el modal del asistente está abierto */
  isOpen: boolean;
  /** Función callback que se ejecuta al cerrar el asistente */
  onClose: () => void;
  /** ID del servicio preseleccionado (opcional) */
  preselectedServiceId?: number | null;
}

/**
 * Tipos de pasos disponibles en el asistente de reserva
 * @typedef {string} WizardStep
 */
type WizardStep = 'branch' | 'service' | 'datetime' | 'form' | 'confirmation' | 'success';

/**
 * Componente de asistente para el agendamiento de citas
 * 
 * Maneja el proceso completo de reserva de citas a través de un asistente de múltiples pasos:
 * 1. Selección de servicio
 * 2. Selección de fecha y hora
 * 3. Llenado de formulario (opcional)
 * 4. Confirmación y creación de la cita
 * 
 * @component
 * @param {BookingWizardProps} props - Las propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal del asistente está abierto
 * @param {() => void} props.onClose - Función callback que se ejecuta al cerrar el asistente
 * @param {number | null} [props.preselectedServiceId] - ID del servicio preseleccionado (opcional)
 * 
 * @returns {JSX.Element} El componente del asistente de reserva de citas
 * 
 * @example
 * ```tsx
 * <BookingWizard
 *   isOpen={isWizardOpen}
 *   onClose={() => setIsWizardOpen(false)}
 *   preselectedServiceId={selectedServiceId}
 * />
 * ```
 */
export function BookingWizard({ isOpen, onClose, preselectedServiceId }: BookingWizardProps) {
  // Hooks de navegación y datos
  const [, navigate] = useLocation();
  const { services, schedules, isLoading } = useServices();
  const { createAppointment } = useAppointments();
  const { branches } = useBranches();
  
  // Estados del asistente
  /** Estado actual del paso del asistente */
  const [currentStep, setCurrentStep] = useState<WizardStep>('branch');
  /** ID de la sede seleccionada */
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  /** ID del servicio seleccionado */
  const [selectedService, setSelectedService] = useState<number | null>(preselectedServiceId || null);
  /** Fecha seleccionada para la cita */
  const [selectedDate, setSelectedDate] = useState<Date>();
  /** Hora seleccionada para la cita en formato HH:mm */
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  /** Estado de envío del formulario */
  const [isSubmitting, setIsSubmitting] = useState(false);  /** Datos del formulario dinámico completado */
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  /** Datos de la cita creada (incluyendo QR) */
  const [createdAppointment, setCreatedAppointment] = useState<any | null>(null);

  const { t } = useTranslation();
  
  // Obtener servicios disponibles en la sede seleccionada
  const { branchServices, isLoading: branchServicesLoading } = useBranchServices(selectedBranch || undefined);
  /** Obtener información detallada del servicio con formulario asociado */
  const { data: serviceWithForm, isLoading: isServiceLoading } = useServiceWithForm(selectedService);  /**
   * Efecto para reiniciar el estado del asistente cuando se abre/cierra
   * Resetea todos los estados a sus valores iniciales cuando el modal se abre
   */
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('branch');
      setSelectedBranch(null);
      setSelectedService(preselectedServiceId || null);
      setSelectedDate(undefined);
      setSelectedTime(null);
      setFormData(null);
      setCreatedAppointment(null);
    }
  }, [isOpen, preselectedServiceId]);

  /**
   * Efecto para reiniciar los pasos posteriores cuando cambia la sede
   * Limpia el servicio, fecha, hora y datos de formulario cuando se selecciona una sede diferente
   */
  useEffect(() => {
    if (currentStep !== 'branch') {
      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedTime(null);
      setFormData(null);
    }
  }, [selectedBranch]);

  /**
   * Efecto para reiniciar los pasos posteriores cuando cambia el servicio
   * Limpia la fecha, hora y datos de formulario cuando se selecciona un servicio diferente
   */
  useEffect(() => {
    if (currentStep !== 'service') {
      setSelectedDate(undefined);
      setSelectedTime(null);
      setFormData(null);
    }  }, [selectedService]);
  /**
   * Configuración de los pasos del asistente
   * Define la estructura y estado de cada paso en el proceso de reserva
   */
  const steps = [
    {
      id: 'branch' as WizardStep,
      title: t('appointments.wizard.step0.title'),
      description: t('appointments.wizard.step0.description'),
      icon: User,
      completed: !!selectedBranch
    },
    {
      id: 'service' as WizardStep,
      title: t('appointments.wizard.step1.title'),
      description: t('appointments.wizard.step1.description'),
      icon: User,
      completed: !!selectedService
    },
    {
      id: 'datetime' as WizardStep,
      title: t('appointments.wizard.step2.title'),
      description: t('appointments.wizard.step2.description'),
      icon: Calendar,
      completed: !!(selectedDate && selectedTime)
    },
    {
      id: 'form' as WizardStep,
      title: t('appointments.wizard.step3.title'),
      description: t('appointments.wizard.step3.description'),
      icon: FileText,
      completed: !serviceWithForm?.formId || !!formData,
      optional: !serviceWithForm?.formId
    },    {
      id: 'confirmation' as WizardStep,
      title: t('appointments.wizard.step4.title'),
      description: t('appointments.wizard.step4.description'),
      icon: CheckCircle,
      completed: false
    },
    {
      id: 'success' as WizardStep,
      title: t('appointments.qr.title'),
      description: t('appointments.wizard.step5.description'),
      icon: QrCode,
      completed: false
    }];
  /** Índice del paso actual en el array de pasos */
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  /** Porcentaje de progreso del asistente (excluyendo el paso de éxito) */
  const progressPercentage = currentStep === 'success' 
    ? 100 
    : ((currentStepIndex + 1) / (steps.length - 1)) * 100;

  /** Horarios disponibles filtrados por el servicio seleccionado */
  const serviceSchedules = schedules?.filter(
    (s) => s.serviceId === selectedService
  ) || [];

  /** Datos completos del servicio seleccionado */
  const selectedServiceData = services?.find(s => s.id === selectedService) || null;
  /**
   * Determina si se puede proceder al siguiente paso
   * Valida que los datos requeridos estén completos para cada paso
   * @returns {boolean} true si se puede avanzar al siguiente paso
   */
  const canProceedToNext = () => {
    switch (currentStep) {
      case 'branch':
        return !!selectedBranch;
      case 'service':
        return !!selectedService;
      case 'datetime':
        return !!(selectedDate && selectedTime);
      case 'form':
        return !serviceWithForm?.formId || !!formData;
      case 'confirmation':
        return false;
      default:
        return false;    }
  };

  /**
   * Maneja la navegación al siguiente paso del asistente
   * Omite automáticamente el paso de formulario si no es requerido
   */
  const handleNext = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      // Omitir paso de formulario si no se requiere
      if (steps[nextStepIndex].id === 'form' && !serviceWithForm?.formId) {
        setCurrentStep('confirmation');
      } else {
        setCurrentStep(steps[nextStepIndex].id);
      }
    }
  };

  /**
   * Maneja la navegación al paso anterior del asistente
   * Omite automáticamente el paso de formulario si no es requerido
   */
  const handlePrevious = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      // Omitir paso de formulario al retroceder si no se requiere
      if (steps[prevStepIndex].id === 'form' && !serviceWithForm?.formId) {
        setCurrentStep('datetime');
      } else {
        setCurrentStep(steps[prevStepIndex].id);
      }
    }  };  /**
   * Maneja el envío final del formulario y creación de la cita
   * Valida que todos los datos requeridos estén presentes y crea la cita
   * Maneja tanto datos de formulario del estado como del sessionStorage (para autoservicio)
   */
  const handleSubmit = async () => {
    if (!selectedBranch || !selectedService || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      const scheduledDateTime = parse(selectedTime, 'HH:mm', selectedDate);

      // Usar formData del estado o datos del sessionStorage (para autoservicio)
      const sessionFormDataString = sessionStorage.getItem('selfServiceFormData');
      const sessionFormData = sessionFormDataString ? JSON.parse(sessionFormDataString) : null;
      const finalFormData = formData || sessionFormData;

      const appointmentResponse = await createAppointment({
        branchId: selectedBranch,
        serviceId: selectedService,
        scheduledAt: scheduledDateTime,
        formData: finalFormData
      });

      // Guardar la respuesta de la cita creada
      setCreatedAppointment(appointmentResponse);

      // Limpiar los datos del formulario después de crear la cita
      sessionStorage.removeItem('selfServiceFormData');

      // Ir al paso de éxito
      setCurrentStep('success');
    } catch (error) {
      // El error ya se maneja en el hook useAppointments con onError
      // No necesitamos hacer nada aquí, solo evitar que se propague
      console.log('Error handled by useAppointments hook:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Maneja el envío del formulario dinámico
   * Guarda los datos del formulario en el estado y avanza al siguiente paso
   * @param {Record<string, any>} data - Datos del formulario completado
   */
  const handleFormSubmit = (data: Record<string, any>) => {
    setFormData(data);
    handleNext();
  };

  /**
   * Maneja la cancelación del formulario dinámico
   * Retrocede al paso anterior sin guardar datos
   */
  const handleFormCancel = () => {
    handlePrevious();  };

  /**
   * Renderiza el contenido específico de cada paso del asistente
   * Maneja la lógica de renderizado condicional basada en el paso actual
   * @returns {JSX.Element | null} El contenido JSX del paso actual o null si no hay contenido
   */  const renderStepContent = () => {
    if (isLoading || isServiceLoading || branchServicesLoading) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      );
    }

    switch (currentStep) {
      case 'branch':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-lg md:text-xl font-semibold">{t('appointments.wizard.step0.subtitle')}</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                {t('appointments.wizard.step0.instruction')}
              </p>
            </div>
            <div className="max-w-6xl mx-auto px-2">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {branches?.filter(branch => branch.isActive).map((branch) => (
                  <Card 
                    key={branch.id} 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedBranch === branch.id 
                        ? 'ring-2 ring-primary bg-primary/5 border-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedBranch(branch.id)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold text-base md:text-lg mb-2 overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                      >
                        {branch.name}
                      </h3>
                      {branch.description && (
                        <p className="text-xs md:text-sm text-muted-foreground mb-2 overflow-hidden"
                           style={{
                             display: '-webkit-box',
                             WebkitLineClamp: 2,
                             WebkitBoxOrient: 'vertical'
                           }}
                        >
                          {branch.description}
                        </p>
                      )}
                      <p className="text-xs md:text-sm text-muted-foreground overflow-hidden"
                         style={{
                           display: '-webkit-box',
                           WebkitLineClamp: 2,
                           WebkitBoxOrient: 'vertical'
                         }}
                      >
                        {branch.address}
                      </p>
                      {branch.phone && (
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">{branch.phone}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {!branches?.filter(branch => branch.isActive).length && (
                <div className="text-center text-muted-foreground py-8 px-4">
                  {t('branches.noActiveBranches')}
                </div>
              )}
            </div>
          </div>
        );

      case 'service':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-lg md:text-xl font-semibold">{t('appointments.wizard.step1.subtitle')}</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                {t('appointments.wizard.step1.instruction')}
              </p>
              {selectedBranch && (
                <div className="flex justify-center mt-4">
                  <Badge variant="secondary" className="text-xs md:text-sm px-2 md:px-3 py-1">
                    {branches?.find(b => b.id === selectedBranch)?.name}
                  </Badge>
                </div>
              )}
            </div>
            <div className="max-w-6xl mx-auto px-2">
              <ServiceSelect
                services={branchServices || []}
                selectedService={selectedService}
                onSelectService={setSelectedService}
              />
            </div>
          </div>
        );

      case 'datetime':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-lg md:text-xl font-semibold">{t('appointments.wizard.step2.subtitle')}</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                {t('appointments.wizard.step2.instruction')}
              </p>
              {selectedServiceData && (
                <div className="flex justify-center mt-4">
                  <Badge variant="secondary" className="text-xs md:text-sm px-2 md:px-3 py-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{selectedServiceData.name}</span>
                  </Badge>
                </div>
              )}
            </div>
            <div className="max-w-6xl mx-auto px-2">
              <TimeSelect
                schedules={serviceSchedules}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedService={selectedServiceData}
                onSelectDate={setSelectedDate}
                onSelectTime={setSelectedTime}
              />
            </div>
          </div>
        );      case 'form':
        if (!serviceWithForm?.formId || !serviceWithForm.form?.fields) {
          return null;
        }
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-lg md:text-xl font-semibold">{t('appointments.wizard.step3.subtitle')}</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                {t('appointments.wizard.step3.instruction')}
              </p>
            </div>
            <div className="max-w-2xl mx-auto px-2">
              <DynamicForm
                form={{
                  id: serviceWithForm.form.id,
                  name: serviceWithForm.form.name,
                  description: serviceWithForm.form.description,
                  fields: serviceWithForm.form.fields
                }}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 md:h-20 w-16 md:w-20 mx-auto text-green-500" />
              <h3 className="text-lg md:text-xl font-semibold px-4">{t('appointments.wizard.step4.subtitle')}</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                {t('appointments.wizard.step4.instruction')}
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto px-2">
              <Card className="shadow-lg">
                <CardHeader className="text-center bg-muted/30 py-4">
                  <CardTitle className="flex items-center justify-center gap-2 text-base md:text-lg">
                    <Calendar className="h-4 md:h-5 w-4 md:w-5" />
                    {t('appointments.wizard.confirmation.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
                  <div className="grid gap-3 md:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/20 rounded-lg gap-2">
                      <span className="text-muted-foreground font-medium text-sm md:text-base">
                        {t('appointments.selectService')}:
                      </span>
                      <Badge variant="secondary" className="text-xs md:text-sm font-semibold self-start sm:self-auto max-w-full">
                        <span className="truncate">{selectedServiceData?.name}</span>
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/20 rounded-lg gap-2">
                      <span className="text-muted-foreground font-medium text-sm md:text-base">
                        {t('appointments.selectDate')}:
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {selectedDate && format(selectedDate, 'PPP', { locale: es })}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/20 rounded-lg gap-2">
                      <span className="text-muted-foreground font-medium text-sm md:text-base">
                        {t('appointments.selectTime')}:
                      </span>
                      <span className="font-semibold text-lg md:text-xl">{selectedTime}</span>
                    </div>
                    {selectedServiceData?.duration && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/20 rounded-lg gap-2">
                        <span className="text-muted-foreground font-medium text-sm md:text-base">
                          {t('services.duration')}:
                        </span>
                        <span className="font-semibold text-sm md:text-base">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {selectedServiceData.duration} {t('common.minutes')}
                        </span>
                      </div>
                    )}
                    {serviceWithForm?.formId && formData && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-green-50 border border-green-200 rounded-lg gap-2">
                        <span className="text-green-700 font-medium text-sm md:text-base">
                          {t('appointments.wizard.confirmation.formCompleted')}:
                        </span>
                        <CheckCircle className="h-5 w-5 text-green-600 self-start sm:self-auto" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>        );

      case 'success':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 md:h-20 w-16 md:w-20 mx-auto text-green-500" />
              <h3 className="text-lg md:text-xl font-semibold px-4">{t('appointments.wizard.step5.title')}</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                {t('appointments.wizard.step5.subtitle')}
              </p>
            </div>
            
            <div className="max-w-md mx-auto px-2">
              {createdAppointment?.qrCode ? (
                <QRDisplay
                  qrCode={createdAppointment.qrCode}
                  appointmentId={createdAppointment.id}
                  confirmationCode={createdAppointment.confirmationCode}
                  title={t('appointments.qr.title')}
                  subtitle={t('appointments.qr.subtitle')}
                />
              ) : (
                <Card className="text-center">
                  <CardContent className="p-4 md:p-6">
                    <CheckCircle className="h-12 md:h-16 w-12 md:w-16 mx-auto text-green-500 mb-4" />
                    <h4 className="text-base md:text-lg font-semibold mb-2">{t('appointments.wizard.confirmed')}</h4>
                    <p className="text-sm md:text-base text-muted-foreground">
                      {t('appointments.wizard.step5.subtitle')}
                    </p>
                    {createdAppointment?.confirmationCode && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">{t('appointments.confirmationCode')}:</p>
                        <code className="text-base md:text-lg font-mono font-semibold break-all">
                          {createdAppointment.confirmationCode}
                        </code>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="text-center space-y-3 md:space-y-4 px-2">
              <Button 
                onClick={() => {
                  onClose();
                  navigate("/appointments/view");
                }}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                <span className="hidden sm:inline">{t('appointments.viewMyAppointments')}</span>
                <span className="sm:hidden">{t('appointments.view')}</span>
              </Button>
              <div className="block sm:inline-block sm:ml-3">
                <Button 
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  {t('common.close')}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }  };

  /**
   * Renderiza los botones de navegación del asistente
   * Maneja la lógica condicional para mostrar botones de anterior/siguiente o confirmar
   * @returns {JSX.Element} Los botones de navegación del asistente
   */
  const renderNavigationButtons = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4 sm:pt-6">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 ? onClose : handlePrevious}
          disabled={isSubmitting}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {currentStepIndex === 0 ? t('common.cancel') : t('appointments.wizard.previous')}
        </Button>

        {currentStep === 'confirmation' ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto order-1 sm:order-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('appointments.booking')}
              </>
            ) : (
              <>
                <span className="hidden sm:inline">{t('appointments.wizard.confirmBooking')}</span>
                <span className="sm:hidden">{t('appointments.confirm')}</span>
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceedToNext() || isSubmitting}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            <span className="hidden sm:inline">{t('appointments.wizard.next')}</span>
            <span className="sm:hidden">{t('common.continue')}</span>
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    );  };

  /**
   * Verificación temprana: No renderizar navegación del paso de formulario si no se requiere formulario
   * Esto evita mostrar el asistente cuando no hay formulario que completar
   */
  if (currentStep === 'form' && !serviceWithForm?.formId) {
    return null;
  }

  /**
   * Renderizado principal del componente
   * Estructura completa del modal del asistente con indicadores de progreso,
   * pasos navegables, contenido dinámico y botones de navegación
   */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[95vh] w-full h-full md:h-auto overflow-hidden flex flex-col p-4 md:p-6">
        <DialogHeader className="flex-shrink-0 pb-3 md:pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Calendar className="h-5 w-5" />
            {t('appointments.wizard.title')}
          </DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            {t('appointments.wizard.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        {currentStep !== 'success' && (
          <div className="space-y-2 md:space-y-3 flex-shrink-0 px-1">
            <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
              <span className="truncate">{t('appointments.wizard.step')} {currentStepIndex + 1} {t('appointments.wizard.of')} {steps.length - 1}</span>
              <span className="truncate ml-2">{Math.round(progressPercentage)}% {t('appointments.wizard.complete')}</span>
            </div>
            <Progress value={progressPercentage} className="w-full h-2" />
          </div>
        )}

        {/* Steps Indicator - Responsive Design */}
        {currentStep !== 'success' && (
          <div className="flex-shrink-0 py-2 md:py-4 px-1">
            {/* Mobile: Sliding 3-step view with arrows */}
            <div className="md:hidden">
              <div className="flex items-center justify-center space-x-2 max-w-full overflow-hidden">
                {(() => {
                  const allSteps = steps.filter(step => step.id !== 'success');
                  const totalSteps = allSteps.length;
                  
                  // Determinar qué 3 pasos mostrar basado en el paso actual
                  let startIndex = Math.max(0, currentStepIndex - 1);
                  if (currentStepIndex >= totalSteps - 1) {
                    startIndex = Math.max(0, totalSteps - 3);
                  }
                  
                  const visibleSteps = allSteps.slice(startIndex, startIndex + 3);
                  
                  return visibleSteps.map((step, index) => {
                    const actualIndex = startIndex + index;
                    const StepIcon = step.icon;
                    const isActive = step.id === currentStep;
                    const isCompleted = step.completed;
                    const isAccessible = actualIndex <= currentStepIndex;
                    const isLast = index === visibleSteps.length - 1;

                    return (
                      <div key={step.id} className="flex items-center">
                        <div
                          className={`flex flex-col items-center space-y-1 ${
                            isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                          }`}
                          onClick={() => {
                            if (isAccessible && !isSubmitting) {
                              setCurrentStep(step.id);
                            }
                          }}
                        >
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                              isCompleted
                                ? 'bg-green-500 border-green-500 text-white'
                                : isActive
                                ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110'
                                : isAccessible
                                ? 'border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary'
                                : 'border-muted text-muted'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                              <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                          </div>
                          <div className="text-center min-w-0">
                            <div className={`text-xs sm:text-sm font-medium leading-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                              {step.title}
                            </div>
                            {step.optional && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs mt-1 px-1 py-0">
                                {t('appointments.wizard.optional')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Arrow between steps */}
                        {!isLast && (
                          <div className="mx-2 sm:mx-3">
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
              
              {/* Step indicator dots for context */}
              <div className="flex justify-center mt-3 space-x-1">
                {steps.filter(step => step.id !== 'success').map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStepIndex
                        ? 'bg-primary'
                        : index < currentStepIndex
                        ? 'bg-green-500'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop: Traditional horizontal layout with improved arrows */}
            <div className="hidden md:flex justify-center items-center max-w-4xl mx-auto">
              {steps.filter(step => step.id !== 'success').map((step, index) => {
                const StepIcon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.completed;
                const isAccessible = index <= currentStepIndex;
                const isLast = index === steps.filter(step => step.id !== 'success').length - 1;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex flex-col items-center space-y-2 ${
                        isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                      }`}
                      onClick={() => {
                        if (isAccessible && !isSubmitting) {
                          setCurrentStep(step.id);
                        }
                      }}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white shadow-lg'
                            : isActive
                            ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110'
                            : isAccessible
                            ? 'border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary hover:scale-105'
                            : 'border-muted text-muted'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <StepIcon className="h-6 w-6" />
                        )}
                      </div>
                      <div className="text-center min-w-0 max-w-[120px]">
                        <div className={`text-sm font-medium leading-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          {step.title}
                        </div>
                        {step.optional && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {t('appointments.wizard.optional')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Arrow connector */}
                    {!isLast && (
                      <div className="mx-4 lg:mx-6">
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto px-1 md:px-2 py-2 md:py-4 min-h-0">
          <div className="min-h-[350px] md:min-h-[400px] w-full">
            {renderStepContent()}
          </div>
        </div>

        {/* Navigation Buttons - Fixed at bottom */}
        {currentStep !== 'form' && currentStep !== 'success' && (
          <div className="flex-shrink-0 pt-4 border-t bg-background">
            {renderNavigationButtons()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
