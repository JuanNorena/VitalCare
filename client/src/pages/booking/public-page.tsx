import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Phone, Globe, Facebook, Instagram, Twitter, MessageCircle, Clock, Calendar, User, Mail, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { TimeSelect } from '@/components/appointments/time-select';
import DynamicFormRenderer from '@/components/booking/DynamicFormRenderer';

/**
 * Interfaz que define la estructura de datos para una página de reservas públicas.
 * 
 * Esta interfaz describe toda la información necesaria para renderizar una página
 * de reservas pública, incluyendo configuración de la sede, servicios disponibles,
 * horarios y metadatos de la página.
 * 
 * @interface PublicBookingPageData
 * @since 1.0.0
 */
interface PublicBookingPageData {
  /** 
   * Información de la sede o establecimiento
   */
  branch: {
    /** ID único de la sede */
    id: number;
    /** Nombre de la sede */
    name: string;
    /** Descripción opcional de la sede */
    description?: string;
    /** Dirección física de la sede */
    address?: string;
    /** Número de teléfono de contacto */
    /** Número de teléfono de contacto */
    phone?: string;
    /** Dirección de correo electrónico */
    email?: string;
    /** URL del logo de la sede */
    logoUrl?: string;
    /** Color hexadecimal del header */
    headerColor: string;
    /** Color hexadecimal de la fuente */
    fontColor: string;
    /** Color hexadecimal de acento para botones y elementos destacados */
    accentColor: string;
    /** Color hexadecimal de fondo de la página */
    backgroundColor: string;
    /** Indica si se deben mostrar los enlaces de redes sociales */
    showSocialMedia: boolean;
    /** URL de la página de Facebook */
    facebookUrl?: string;
    /** URL de la página de Instagram */
    instagramUrl?: string;
    /** URL de la página de Twitter */
    twitterUrl?: string;
    /** Indica si WhatsApp está habilitado */
    enableWhatsApp: boolean;
    /** Número de WhatsApp para contacto */
    whatsappNumber?: string;
    /** Mensaje de bienvenida que se muestra en modal */
    welcomeMessage?: string;
  };
  /** 
   * Configuración personalizada de la página de reservas
   */
  customPage: {
    /** Título principal que se muestra en la sección hero */
    heroTitle?: string;
    /** Subtítulo descriptivo bajo el título principal */
    heroSubtitle?: string;
    /** URL de la imagen de fondo para la sección hero */
    heroBackgroundImage?: string;
    /** Texto personalizado que aparece en el pie de página */
    customFooterText?: string;
    /** Título personalizado para el paso 1 del proceso de reserva */
    step1Title?: string;
    /** Título personalizado para el paso 2 del proceso de reserva */
    step2Title?: string;
    /** Título personalizado para el paso 3 del proceso de reserva */
    step3Title?: string;
    /** Indica si es obligatorio aceptar términos y condiciones */
    requireTerms?: boolean;
    /** Texto completo de los términos y condiciones */
    termsText?: string;
    /** URL hacia la política de privacidad externa */
    privacyPolicyUrl?: string;
  };
  /** 
   * Lista de servicios disponibles para reservar en esta sede
   */
  services: Array<{
    /** ID único del servicio */
    id: number;
    /** Nombre del servicio */
    name: string;
    /** Descripción opcional del servicio */
    description?: string;
    /** Duración del servicio en minutos */
    duration: number;
    /** ID del formulario dinámico asociado (opcional) */
    formId?: number | null;
    /** 
     * Formulario dinámico asociado al servicio para recopilar información adicional
     */
    form?: {
      /** ID único del formulario */
      id: number;
      /** Nombre del formulario */
      name: string;
      /** Descripción opcional del formulario */
      description?: string;
      /** Indica si el formulario está activo */
      isActive: boolean;
      /** 
       * Lista de campos del formulario dinámico
       */
      fields: Array<{
        /** ID único del campo */
        id: number;
        /** ID del formulario al que pertenece */
        formId: number;
        /** Nombre interno del campo (usado para almacenar el valor) */
        name: string;
        /** Etiqueta visible del campo para el usuario */
        label: string;
        /** Tipo de campo de entrada */
        type: "text" | "number" | "email" | "date" | "select" | "checkbox" | "textarea";
        /** Indica si el campo es obligatorio */
        required: boolean;
        /** Opciones disponibles para campos de tipo 'select' (en formato JSON) */
        options?: any;
        /** Orden de presentación del campo en el formulario */
        order: number;
        /** Texto de ayuda opcional que se muestra al usuario */
        helperText?: string;
      }>;
    } | null;
  }>;
  /** 
   * Horarios de disponibilidad para los servicios
   */
  schedules: Array<{
    /** ID único del horario */
    id: number;
    /** ID del servicio al que pertenece este horario */
    serviceId: number;
    /** Día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado) */
    dayOfWeek: number;
    /** Hora de inicio en formato HH:MM */
    startTime: string;
    /** Hora de finalización en formato HH:MM */
    endTime: string;
    /** Indica si el horario está activo */
    isActive: boolean;
  }>;
  /** 
   * Metadatos de la página para SEO y navegación
   */
  metadata: {
    /** Título de la página para el navegador */
    title: string;
    /** Descripción meta para SEO (opcional) */
    description?: string;
    /** Identificador único de la página (slug) */
    slug: string;
  };
}

/**
 * Componente principal para la página pública de reserva de citas.
 * 
 * Este componente proporciona una interfaz completa para que los usuarios anónimos
 * puedan reservar citas utilizando un formulario dinámico de 3 pasos:
 * 1. Selección de servicio
 * 2. Selección de fecha y hora
 * 3. Ingreso de información personal
 * 
 * Características principales:
 * - Formularios dinámicos basados en configuración JSON
 * - Validación en tiempo real de disponibilidad
 * - Modal de términos y condiciones
 * - Confirmación por código único
 * - Generación de códigos QR para confirmación
 * - Envío de emails de confirmación
 * - Soporte completo de internacionalización
 * - Diseño responsivo optimizado para móviles
 * 
 * @returns {JSX.Element} Interfaz completa de reserva pública
 * 
 * @example
 * ```tsx
 * // El componente se renderiza automáticamente en la ruta /booking/:slug
 * <Route path="/booking/:slug" element={<PublicBookingPage />} />
 * ```
 */
export function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [pageData, setPageData] = useState<PublicBookingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    acceptTerms: false
  });
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
  const [dynamicFormErrors, setDynamicFormErrors] = useState<Record<string, string>>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [appointmentSuccess, setAppointmentSuccess] = useState<{
    confirmationCode: string;
    serviceName: string;
    branchName: string;
    scheduledAt: string;
  } | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/booking/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError(t('publicBooking.pageNotFound'));
          } else {
            setError(t('publicBooking.errorLoadingPage'));
          }
          return;
        }

        const data = await response.json();
        setPageData(data);
        
        // Mostrar modal de bienvenida si hay mensaje configurado
        if (data.branch?.welcomeMessage && data.branch.welcomeMessage.trim()) {
          // Pequeño delay para que se renderice primero la página
          setTimeout(() => {
            setShowWelcomeModal(true);
          }, 500);
        }
        
        // Configurar título de la página
        document.title = data.metadata.title;
        if (data.metadata.description) {
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute('content', data.metadata.description);
          }
        }
      } catch (err) {
        setError(t('publicBooking.connectionError'));
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPageData();
    }
  }, [slug]);

  /**
   * Maneja los cambios en los campos del formulario dinámico.
   * 
   * Actualiza el estado del formulario dinámico y limpia automáticamente
   * los errores de validación cuando un campo obtiene un valor válido.
   * 
   * @param {string} fieldName - Nombre del campo que está siendo modificado
   * @param {any} value - Nuevo valor del campo
   */
  const handleDynamicFormChange = (fieldName: string, value: any) => {
    setDynamicFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Limpiar errores del campo si tiene valor
    if (value && dynamicFormErrors[fieldName]) {
      setDynamicFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  /**
   * Valida los campos del formulario dinámico según las reglas definidas en la configuración del servicio.
   * 
   * Revisa cada campo del formulario asociado al servicio seleccionado y verifica:
   * - Campos obligatorios no estén vacíos
   * - Valores de tipo string no sean solo espacios en blanco
   * - Aplica las validaciones específicas por tipo de campo
   * 
   * @param {any} selectedServiceObj - Objeto del servicio seleccionado que contiene la configuración del formulario
   * @returns {Record<string, string>} Objeto con los errores encontrados, donde la clave es el nombre del campo y el valor es el mensaje de error
   * 
   * @example
   * ```tsx
   * const errors = validateDynamicForm(selectedService);
   * if (Object.keys(errors).length > 0) {
   *   setDynamicFormErrors(errors);
   *   return;
   * }
   * ```
   */
  const validateDynamicForm = (selectedServiceObj: any) => {
    const errors: Record<string, string> = {};
    
    if (!selectedServiceObj?.form?.fields) return errors;

    selectedServiceObj.form.fields.forEach((field: any) => {
      if (field.required) {
        const value = dynamicFormData[field.name];
        
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors[field.name] = t('common.fieldRequired', { field: field.label });
        }
      }
    });

    return errors;
  };

  /**
   * Maneja la selección de un servicio en el primer paso del formulario.
   * 
   * Al seleccionar un servicio, resetea automáticamente la fecha y hora seleccionadas
   * para asegurar que el usuario vuelva a elegir horarios compatibles con el nuevo servicio.
   * 
   * @param {number} serviceId - ID único del servicio seleccionado
   */
  const handleServiceSelect = (serviceId: number) => {
    setSelectedService(serviceId);
    // Resetear fecha y hora al cambiar de servicio
    setSelectedDate(undefined);
    setSelectedTime(null);
    
    // Resetear formulario dinámico al cambiar de servicio
    setDynamicFormData({});
    setDynamicFormErrors({});
    
    setCurrentStep(2);
  };

  /**
   * Avanza al siguiente paso del formulario de reserva con validaciones apropiadas.
   * 
   * Valida los requisitos específicos de cada paso antes de permitir el avance:
   * - Paso 2: Verifica que se haya seleccionado fecha y hora
   * - Paso 3: (final) no requiere validación adicional
   * 
   * Muestra mensajes de error mediante toast si las validaciones fallan.
   */
  const handleNextStep = () => {
    if (currentStep === 2) {
      // Validar que se haya seleccionado fecha y hora antes de continuar
      if (!selectedDate || !selectedTime) {
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: t('publicBooking.pleaseSelectDateTime')
        });
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Retrocede al paso anterior del formulario de reserva.
   * 
   * Permite la navegación hacia atrás sin restricciones hasta el primer paso.
   * No pierde los datos ya ingresados en pasos anteriores.
   */
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Procesa el envío final del formulario de reserva y crea la cita.
   * 
   * Realiza las siguientes validaciones y operaciones:
   * 1. Valida todos los campos del formulario base
   * 2. Valida el formulario dinámico del servicio seleccionado
   * 3. Verifica la aceptación de términos y condiciones
   * 4. Envía los datos al servidor para crear la cita
   * 5. Maneja la respuesta con código de confirmación
   * 6. Muestra mensaje de éxito o error según corresponda
   * 
   * @param {React.FormEvent} e - Evento del formulario que se está enviando
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedDate || !selectedTime) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('publicBooking.pleaseCompleteAllFields')
      });
      return;
    }

    const selectedServiceObj = pageData?.services.find(s => s.id === selectedService);
    
    // Validar formulario dinámico si existe
    if (selectedServiceObj?.form) {
      const dynamicErrors = validateDynamicForm(selectedServiceObj);
      if (Object.keys(dynamicErrors).length > 0) {
        setDynamicFormErrors(dynamicErrors);
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: t('publicBooking.pleaseCompleteRequiredFields')
        });
        return;
      }
    }

    // Validar términos y condiciones si están habilitados
    if (customPage.requireTerms && !formData.acceptTerms) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('publicBooking.pleaseAcceptTerms')
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/booking/${slug}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: selectedService,
          date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
          time: selectedTime,
          customerData: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            notes: formData.notes
          },
          dynamicFormData: Object.keys(dynamicFormData).length > 0 ? dynamicFormData : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar la reserva');
      }

      const result = await response.json();
      
      // Si la respuesta incluye datos de la cita, mostrar confirmación
      if (result.appointment) {
        setAppointmentSuccess({
          confirmationCode: result.appointment.confirmationCode,
          serviceName: result.appointment.serviceName,
          branchName: result.appointment.branchName,
          scheduledAt: result.appointment.scheduledAt
        });
        
        toast({
          title: t('publicBooking.appointmentCreated'),
          description: t('publicBooking.appointmentCreatedDescription')
        });
      } else {
        // Fallback para respuestas sin datos de cita
        toast({
          title: t('publicBooking.reservationSent'),
          description: t('publicBooking.reservationSentDescription')
        });
      }
      
      // Reset form
      setCurrentStep(1);
      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedTime(null);
      setFormData({ name: '', email: '', phone: '', notes: '', acceptTerms: false });
      setDynamicFormData({});
      setDynamicFormErrors({});
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('publicBooking.errorSendingReservation')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-5 w-5" />;
      case 'instagram': return <Instagram className="h-5 w-5" />;
      case 'twitter': return <Twitter className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white/95 backdrop-blur-sm rounded-lg p-8 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('publicBooking.loadingPage')}</p>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundColor: '#f9fafb' }}>
        <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-lg relative z-10">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('publicBooking.pageNotFound')}</h1>
            <p className="text-gray-600 mb-4">{error || t('publicBooking.pageNotFoundDescription')}</p>
            <Button onClick={() => window.location.href = '/'}>
              {t('publicBooking.goHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { branch, customPage, services } = pageData;

  return (
    <div 
      className={`min-h-screen relative ${customPage.heroBackgroundImage ? 'bg-fixed md:bg-fixed bg-scroll' : ''}`}
      style={{ 
        backgroundColor: branch.backgroundColor,
        backgroundImage: customPage.heroBackgroundImage ? `url(${customPage.heroBackgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability when image is present */}
      {customPage.heroBackgroundImage && (
        <div className="absolute inset-0 bg-black/20 z-0"></div>
      )}
      {/* Header */}
      <header 
        className="shadow-sm relative z-10"
        style={{ 
          backgroundColor: branch.headerColor,
          color: branch.fontColor 
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          {/* Header principal para desktop */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-4">
              {branch.logoUrl && (
                <img 
                  src={branch.logoUrl} 
                  alt={t('publicBooking.logoAlt', { branchName: branch.name })}
                  className="h-12 w-auto object-contain bg-white/10 rounded p-1"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: branch.fontColor }}>
                  {branch.name}
                </h1>
                {branch.description && (
                  <p className="text-sm opacity-90" style={{ color: branch.fontColor }}>
                    {branch.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Sección derecha: Redes sociales, WhatsApp e Iniciar Sesión */}
            <div className="flex items-center gap-3">
              {/* Redes sociales */}
              {branch.showSocialMedia && (
                <div className="flex items-center gap-2">
                  {branch.facebookUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-white/10"
                      style={{ color: branch.fontColor }}
                      onClick={() => window.open(branch.facebookUrl, '_blank')}
                    >
                      {getSocialIcon('facebook')}
                    </Button>
                  )}
                  {branch.instagramUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-white/10"
                      style={{ color: branch.fontColor }}
                      onClick={() => window.open(branch.instagramUrl, '_blank')}
                    >
                      {getSocialIcon('instagram')}
                    </Button>
                  )}
                  {branch.twitterUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-white/10"
                      style={{ color: branch.fontColor }}
                      onClick={() => window.open(branch.twitterUrl, '_blank')}
                    >
                      {getSocialIcon('twitter')}
                    </Button>
                  )}
                </div>
              )}

              {/* WhatsApp */}
              {branch.enableWhatsApp && branch.whatsappNumber && (
                <Button 
                  style={{ 
                    backgroundColor: branch.accentColor,
                    color: 'white',
                    border: 'none'
                  }}
                  className="hover:opacity-90 transition-opacity"
                  onClick={() => window.open(`https://wa.me/${(branch.whatsappNumber || '').replace(/[^0-9]/g, '')}`, '_blank')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t('customPages.preview.whatsapp')}
                </Button>
              )}

            </div>
          </div>

          {/* Header móvil */}
          <div className="sm:hidden space-y-4">
            {/* Primera fila: Logo y nombre */}
            <div className="flex items-center gap-3">
              {branch.logoUrl && (
                <img 
                  src={branch.logoUrl} 
                  alt={t('publicBooking.logoAlt', { branchName: branch.name })}
                  className="h-10 w-auto object-contain bg-white/10 rounded p-1 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate" style={{ color: branch.fontColor }}>
                  {branch.name}
                </h1>
                {branch.description && (
                  <p className="text-xs opacity-90 truncate" style={{ color: branch.fontColor }}>
                    {branch.description}
                  </p>
                )}
              </div>
            </div>

            {/* Segunda fila: Acciones principales */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Redes sociales compactas solo iconos en móvil */}
                {branch.showSocialMedia && (
                  <div className="flex items-center gap-1">
                    {branch.facebookUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1.5 hover:bg-white/10"
                        style={{ color: branch.fontColor }}
                        onClick={() => window.open(branch.facebookUrl, '_blank')}
                      >
                        {getSocialIcon('facebook')}
                      </Button>
                    )}
                    {branch.instagramUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1.5 hover:bg-white/10"
                        style={{ color: branch.fontColor }}
                        onClick={() => window.open(branch.instagramUrl, '_blank')}
                      >
                        {getSocialIcon('instagram')}
                      </Button>
                    )}
                    {branch.twitterUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1.5 hover:bg-white/10"
                        style={{ color: branch.fontColor }}
                        onClick={() => window.open(branch.twitterUrl, '_blank')}
                      >
                        {getSocialIcon('twitter')}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* WhatsApp */}
                {branch.enableWhatsApp && branch.whatsappNumber && (
                  <Button 
                    style={{ 
                      backgroundColor: branch.accentColor,
                      color: 'white',
                      border: 'none'
                    }}
                    className="hover:opacity-90 transition-opacity"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/${(branch.whatsappNumber || '').replace(/[^0-9]/g, '')}`, '_blank')}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 
            className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4" 
            style={{ 
              color: customPage.heroBackgroundImage ? '#ffffff' : branch.headerColor,
              textShadow: customPage.heroBackgroundImage ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
            }}
          >
            {customPage.heroTitle || t('publicBooking.welcome', { branchName: branch.name })}
          </h2>
          <p 
            className="text-base sm:text-xl mb-4 sm:mb-6"
            style={{
              color: customPage.heroBackgroundImage ? '#ffffff' : '#6b7280',
              textShadow: customPage.heroBackgroundImage ? '1px 1px 3px rgba(0,0,0,0.7)' : 'none'
            }}
          >
            {customPage.heroSubtitle || t('publicBooking.defaultSubtitle')}
          </p>
        </div>

        {/* Booking Form */}
        <Card className="mb-8 sm:mb-12 bg-white/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-center text-lg sm:text-xl">{t('publicBooking.bookYourAppointment')}</CardTitle>
            
            {/* Progress Steps */}
            <div className="flex justify-center items-center space-x-4 sm:space-x-8 mt-4 sm:mt-6">
              <div className="flex items-center">
                <div 
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold ${
                    currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  style={{ backgroundColor: currentStep >= 1 ? branch.accentColor : undefined }}
                >
                  1
                </div>
                <span className={`ml-2 text-xs sm:text-sm font-medium ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-500'} hidden sm:inline`}>
                  {customPage.step1Title || t('customPages.preview.selectService')}
                </span>
              </div>
              <div className="flex items-center">
                <div 
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold ${
                    currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  style={{ backgroundColor: currentStep >= 2 ? branch.accentColor : undefined }}
                >
                  2
                </div>
                <span className={`ml-2 text-xs sm:text-sm font-medium ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-500'} hidden sm:inline`}>
                  {customPage.step2Title || t('customPages.preview.chooseDateTime')}
                </span>
              </div>
              <div className="flex items-center">
                <div 
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold ${
                    currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  style={{ backgroundColor: currentStep >= 3 ? branch.accentColor : undefined }}
                >
                  3
                </div>
                <span className={`ml-2 text-xs sm:text-sm font-medium ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-500'} hidden sm:inline`}>
                  {customPage.step3Title || t('customPages.preview.completeData')}
                </span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Step 1: Service Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold mb-4">{t('publicBooking.selectServiceStep')}</h3>
                <div className="grid gap-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors hover:border-blue-300 ${
                        selectedService === service.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => handleServiceSelect(service.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base">{service.name}</h4>
                          {service.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{service.description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {service.duration} {t('common.minutes')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Date and Time Selection */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold mb-4">{t('publicBooking.dateTimeStep')}</h3>
                
                {/* Mostrar el servicio seleccionado */}
                {selectedService && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{t('publicBooking.selectedService')}:</p>
                    <p className="font-medium text-blue-900 text-sm sm:text-base break-words">
                      {pageData.services.find(s => s.id === selectedService)?.name}
                    </p>
                  </div>
                )}

                {/* Integrar el componente TimeSelect */}
                {(() => {
                  const serviceSchedules = pageData.schedules.filter(schedule => 
                    schedule.serviceId === selectedService && schedule.isActive
                  );

                  if (serviceSchedules.length === 0) {
                    return (
                      <div className="text-center py-6 sm:py-8">
                        <div className="bg-yellow-50 rounded-lg p-4 sm:p-6 max-w-md mx-auto border border-yellow-200">
                          <p className="text-yellow-800 font-medium mb-2 text-sm sm:text-base">
                            {t('publicBooking.noSchedulesAvailable')}
                          </p>
                          <p className="text-yellow-600 text-xs sm:text-sm">
                            {t('publicBooking.contactForSchedule')}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <TimeSelect
                      schedules={serviceSchedules}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      selectedService={selectedService ? {
                        id: selectedService,
                        duration: pageData.services.find(s => s.id === selectedService)?.duration || 30,
                        name: pageData.services.find(s => s.id === selectedService)?.name || '',
                        description: pageData.services.find(s => s.id === selectedService)?.description || null,
                        isActive: true,
                        createdAt: new Date(),
                        formId: null
                      } : null}
                      onSelectDate={setSelectedDate}
                      onSelectTime={setSelectedTime}
                    />
                  );
                })()}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevStep}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    {t('publicBooking.previous')}
                  </Button>
                  <Button 
                    onClick={handleNextStep} 
                    disabled={!selectedDate || !selectedTime || submitting}
                    style={{ 
                      backgroundColor: (!selectedDate || !selectedTime || submitting) ? '#9ca3af' : branch.accentColor,
                      color: 'white',
                      border: 'none'
                    }}
                    className="flex-1 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('publicBooking.continue')}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">{t('publicBooking.completeDataStep')}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t('publicBooking.fullName')} *</Label>
                    <Input
                      id="name"
                      required
                      disabled={submitting}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('publicBooking.placeholders.fullName')}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t('publicBooking.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      disabled={submitting}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={t('publicBooking.placeholders.email')}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">{t('publicBooking.phone')} *</Label>
                  <Input
                    id="phone"
                    required
                    disabled={submitting}
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={t('publicBooking.placeholders.phone')}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">{t('publicBooking.additionalNotes')}</Label>
                  <Textarea
                    id="notes"
                    disabled={submitting}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('publicBooking.additionalNotesPlaceholder')}
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>

                {/* Formulario Dinámico del Servicio */}
                {(() => {
                  const selectedServiceObj = pageData?.services.find(s => s.id === selectedService);
                  if (!selectedServiceObj?.form) return null;
                  
                  return (
                    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedServiceObj.form.name}
                      </h4>
                      <DynamicFormRenderer
                        form={selectedServiceObj.form}
                        values={dynamicFormData}
                        onChange={handleDynamicFormChange}
                        errors={dynamicFormErrors}
                        disabled={submitting}
                      />
                    </div>
                  );
                })()}

                {/* Términos y Condiciones */}
                {customPage.requireTerms && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, acceptTerms: !!checked }))
                        }
                        disabled={submitting}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                          {t('publicBooking.acceptTermsPrefix')}{' '}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                          >
                            {t('publicBooking.termsAndConditions')}
                          </button>
                          {customPage.privacyPolicyUrl && (
                            <>
                              {' '}{t('publicBooking.andThe')}{' '}
                              <a 
                                href={customPage.privacyPolicyUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {t('publicBooking.privacyPolicy')}
                              </a>
                            </>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePrevStep}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    {t('publicBooking.previous')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting || (customPage.requireTerms && !formData.acceptTerms)}
                    style={{ 
                      backgroundColor: submitting 
                        ? '#9ca3af' 
                        : (customPage.requireTerms && !formData.acceptTerms)
                          ? '#9ca3af'
                          : branch.accentColor,
                      color: 'white',
                      border: 'none'
                    }}
                    className="flex-1 sm:flex-1 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">{t('publicBooking.sendingReservation')}</span>
                        <span className="sm:hidden">{t('publicBooking.sending')}</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">{t('publicBooking.sendReservationRequest')}</span>
                        <span className="sm:hidden">{t('publicBooking.sendReservation')}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer 
        className="mt-12 sm:mt-16 relative z-10"
        style={{ 
          backgroundColor: branch.headerColor,
          color: branch.fontColor 
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          {/* Footer Desktop */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4" style={{ color: branch.fontColor }}>
                {t('publicBooking.contact')}
              </h3>
              <div className="space-y-2 text-sm opacity-90">
                {branch.address && <p style={{ color: branch.fontColor }}>{branch.address}</p>}
                {branch.phone && (
                  <p className="flex items-center gap-2" style={{ color: branch.fontColor }}>
                    <Phone className="h-4 w-4" />
                    {branch.phone}
                  </p>
                )}
                {branch.email && (
                  <p className="flex items-center gap-2" style={{ color: branch.fontColor }}>
                    <Mail className="h-4 w-4" />
                    {branch.email}
                  </p>
                )}
              </div>
            </div>
            
            {branch.showSocialMedia && (
              <div>
                <h3 className="font-semibold mb-4" style={{ color: branch.fontColor }}>
                  {t('publicBooking.followUs')}
                </h3>
                <div className="flex gap-3">
                  {branch.facebookUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-white/10"
                      style={{ color: branch.fontColor }}
                      onClick={() => window.open(branch.facebookUrl, '_blank')}
                    >
                      {getSocialIcon('facebook')}
                    </Button>
                  )}
                  {branch.instagramUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-white/10"
                      style={{ color: branch.fontColor }}
                      onClick={() => window.open(branch.instagramUrl, '_blank')}
                    >
                      {getSocialIcon('instagram')}
                    </Button>
                  )}
                  {branch.twitterUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-white/10"
                      style={{ color: branch.fontColor }}
                      onClick={() => window.open(branch.twitterUrl, '_blank')}
                    >
                      {getSocialIcon('twitter')}
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold mb-4" style={{ color: branch.fontColor }}>
                {t('publicBooking.information')}
              </h3>
              <p className="text-sm opacity-90" style={{ color: branch.fontColor }}>
                {customPage.customFooterText || t('publicBooking.defaultFooterText', { branchName: branch.name })}
              </p>
            </div>
          </div>

          {/* Footer Mobile */}
          <div className="md:hidden space-y-6">
            {/* Contacto */}
            <div className="text-center">
              <h3 className="font-semibold mb-3 text-sm" style={{ color: branch.fontColor }}>
                {t('publicBooking.contact')}
              </h3>
              <div className="space-y-2 text-xs opacity-90">
                {branch.address && (
                  <p style={{ color: branch.fontColor }} className="break-words">
                    {branch.address}
                  </p>
                )}
                {branch.phone && (
                  <p className="flex items-center justify-center gap-2" style={{ color: branch.fontColor }}>
                    <Phone className="h-3 w-3" />
                    <a href={`tel:${branch.phone}`} className="hover:underline">
                      {branch.phone}
                    </a>
                  </p>
                )}
                {branch.email && (
                  <p className="flex items-center justify-center gap-2" style={{ color: branch.fontColor }}>
                    <Mail className="h-3 w-3" />
                    <a href={`mailto:${branch.email}`} className="hover:underline break-all">
                      {branch.email}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Redes Sociales */}
            {branch.showSocialMedia && (
              <div className="text-center">
                <h3 className="font-semibold mb-3 text-sm" style={{ color: branch.fontColor }}>
                  {t('publicBooking.followUs')}
                </h3>
                <div className="flex justify-center gap-2">
                  {branch.facebookUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-white/10"
                      style={{ color: branch.fontColor }}
                      onClick={() => window.open(branch.facebookUrl, '_blank')}
                    >
                      {getSocialIcon('facebook')}
                    </Button>
                  )}
                  {branch.instagramUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-white/10"
                      style={{ color: branch.fontColor }}
                      onClick={() => window.open(branch.instagramUrl, '_blank')}
                    >
                      {getSocialIcon('instagram')}
                    </Button>
                  )}
                  {branch.twitterUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 hover:bg-white/10"
                      style={{ color: branch.fontColor }}
                      onClick={() => window.open(branch.twitterUrl, '_blank')}
                    >
                      {getSocialIcon('twitter')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Información */}
            <div className="text-center">
              <h3 className="font-semibold mb-3 text-sm" style={{ color: branch.fontColor }}>
                {t('publicBooking.information')}
              </h3>
              <p className="text-xs opacity-90 px-4" style={{ color: branch.fontColor }}>
                {customPage.customFooterText || t('publicBooking.defaultFooterText', { branchName: branch.name })}
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Confirmación de Cita */}
      <Dialog open={!!appointmentSuccess} onOpenChange={(open) => !open && setAppointmentSuccess(null)}>
        <DialogContent className="max-w-md mx-auto bg-white rounded-lg shadow-xl border-0">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-green-700 mb-2">
              {t('publicBooking.appointmentConfirmed')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('publicBooking.appointmentConfirmedDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {appointmentSuccess && (
            <div className="px-6 pb-6">
              {/* Icono de éxito */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              {/* Detalles de la cita */}
              <div className="text-center mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {appointmentSuccess.serviceName}
                </h3>
                <p className="text-gray-600 text-sm mb-1">
                  {appointmentSuccess.branchName}
                </p>
                <p className="text-gray-600 text-sm">
                  {new Date(appointmentSuccess.scheduledAt).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {/* Código de confirmación */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-green-700 mb-2 font-medium">
                    {t('publicBooking.confirmationCode')}
                  </p>
                  <p className="text-2xl font-bold text-green-800 tracking-wider">
                    {appointmentSuccess.confirmationCode}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    {t('publicBooking.confirmationCodeInstructions')}
                  </p>
                </div>
              </div>
              
              {/* Instrucciones */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {t('publicBooking.emailSentInstructions')}
                </p>
              </div>
              
              {/* Botón de cerrar */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setAppointmentSuccess(null)}
                  className="px-6 py-2 font-medium"
                  style={{ 
                    backgroundColor: branch.accentColor,
                    color: 'white'
                  }}
                >
                  {t('common.understood')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Bienvenida */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-md mx-auto bg-white rounded-lg shadow-xl border-0">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-900 mb-2">
              {t('publicBooking.welcomeModal.title', { branchName: branch.name })}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('publicBooking.welcomeModal.description', { branchName: branch.name })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pb-6">
            {/* Logo del branch si está disponible */}
            {branch.logoUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={branch.logoUrl}
                  alt={t('publicBooking.logoAlt', { branchName: branch.name })}
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
            
            {/* Mensaje de bienvenida */}
            <div className="text-center mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {branch.welcomeMessage}
              </p>
            </div>
            
            {/* Botón de continuar */}
            <div className="flex justify-center">
              <Button
                onClick={() => setShowWelcomeModal(false)}
                className="px-6 py-2 font-medium"
                style={{ 
                  backgroundColor: branch.accentColor,
                  color: 'white'
                }}
              >
                {t('publicBooking.welcomeModal.continue')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Términos y Condiciones */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="w-[95vw] max-w-2xl mx-2 sm:mx-4 lg:mx-auto bg-white rounded-lg shadow-xl border-0 max-h-[90vh] sm:max-h-[85vh] lg:max-h-[80vh] overflow-hidden">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
            <DialogTitle className="text-center text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
              {t('publicBooking.termsAndConditions')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('publicBooking.termsModalDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
            {/* Contenido de los términos y condiciones */}
            <div className="max-h-[45vh] sm:max-h-[50vh] lg:max-h-[55vh] overflow-y-auto pr-1 sm:pr-2">
              <div className="text-gray-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm lg:text-sm">
                {customPage.termsText || t('publicBooking.defaultTermsContent')}
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col space-y-2 sm:space-y-3 mt-3 sm:mt-4 lg:mt-6 pt-3 sm:pt-3 lg:pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowTermsModal(false)}
                className="w-full text-xs sm:text-sm lg:text-base py-2 px-3 sm:py-2.5 sm:px-4 min-h-[36px] sm:min-h-[40px]"
              >
                {t('publicBooking.termsModal.close')}
              </Button>
              <Button
                onClick={() => {
                  setFormData(prev => ({ ...prev, acceptTerms: true }));
                  setShowTermsModal(false);
                }}
                className="w-full font-medium text-xs sm:text-sm lg:text-base py-2 px-3 sm:py-2.5 sm:px-4 min-h-[36px] sm:min-h-[40px]"
                style={{ 
                  backgroundColor: branch.accentColor,
                  color: 'white'
                }}
              >
                {t('publicBooking.termsModal.acceptAndClose')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PublicBookingPage;
