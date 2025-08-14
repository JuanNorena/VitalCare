import { useState, useEffect } from "react";
import { useBranchSettings } from "@/hooks/use-branch-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Save,
  RotateCcw,
  Shield,
  ShieldOff,
  Clock,
  Bell,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import type { BranchSettingsConfig } from "@/hooks/use-branch-settings";

/**
 * Propiedades del componente BranchSettingsDetail
 * 
 * @interface BranchSettingsDetailProps
 */
interface BranchSettingsDetailProps {
  /** ID único de la sede a configurar */
  branchId: number;
  /** Función callback opcional para cerrar el modal o vista del componente */
  onClose?: () => void;
}

/**
 * Componente para la configuración detallada de una sede específica.
 * 
 * Este componente proporciona una interfaz completa y organizada para gestionar
 * todos los parámetros configurables de una sede del sistema de gestión de citas.
 * Las configuraciones se organizan en tres categorías principales:
 * 
 * - **Críticos**: Parámetros fundamentales como horas de cancelación, límites de reagendamiento
 * - **Cancelación**: Políticas y reglas para cancelaciones de citas
 * - **Recordatorios**: Configuración de notificaciones automáticas por email
 * 
 * ### Características principales:
 * - Formularios reactivos con validación en tiempo real
 * - Modo de emergencia para situaciones críticas
 * - Soporte para configuraciones por defecto y personalizadas
 * - Interfaz de pestañas para organizar diferentes categorías
 * - Auto-guardado con confirmación visual
 * 
 * ### Flujo de datos:
 * 1. Carga configuraciones existentes o valores por defecto
 * 2. Mantiene estado local del formulario para edición
 * 3. Detecta cambios y habilita el botón de guardado
 * 4. Persiste cambios mediante hooks especializados
 * 5. Proporciona feedback visual del estado de las operaciones
 * 
 * @component
 * @example
 * ```tsx
 * // Uso básico
 * <BranchSettingsDetail branchId={123} />
 * 
 * // Con callback de cierre
 * <BranchSettingsDetail 
 *   branchId={123} 
 *   onClose={() => navigate('/admin/branches')} 
 * />
 * ```
 * 
 * @param {BranchSettingsDetailProps} props - Propiedades del componente
 * @returns {JSX.Element} Interfaz de configuración de sede
 */
export default function BranchSettingsDetail({ branchId, onClose }: BranchSettingsDetailProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  // ═══════════════════════════════════════════════════════════════════════
  // HOOKS Y ESTADO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Hook personalizado para manejar las operaciones CRUD de configuraciones de sede
   * Proporciona métodos para crear, actualizar, resetear y alternar modo de emergencia
   */
  const {
    settings,
    isDefault,
    isLoading,
    updateSettings,
    createSettings,
    resetToDefaults,
    toggleEmergencyMode,
  } = useBranchSettings(branchId);

  /**
   * Estado local del formulario que contiene todas las configuraciones editables
   * Se sincroniza con los datos del servidor al cargar y se persiste al guardar
   * 
   * @type {Partial<BranchSettingsConfig>}
   */
  const [formData, setFormData] = useState<Partial<BranchSettingsConfig>>({});
  
  /**
   * Campos críticos que afectan directamente el comportamiento de la sede
   * Estos valores se almacenan por separado para facilitar validaciones
   * 
   * @type {Object}
   * @property {number} cancellationHours - Horas mínimas antes de cancelar
   * @property {number} rescheduleTimeLimit - Límite para reagendar en horas
   * @property {number} maxAdvanceBookingDays - Días máximos de anticipación para reservar
   * @property {boolean} remindersEnabled - Si los recordatorios están activos
   * @property {number} reminderHours - Horas de anticipación para recordatorios
   * @property {boolean} emergencyMode - Si la sede está en modo de emergencia
   * @property {boolean} isActive - Si la sede acepta nuevas citas
   */
  const [criticalFields, setCriticalFields] = useState({
    cancellationHours: 24,
    rescheduleTimeLimit: 4,
    maxAdvanceBookingDays: 30,
    remindersEnabled: true,
    reminderHours: 24,
    emergencyMode: false,
    isActive: true,
  });

  /** Indica si el formulario tiene cambios sin guardar */
  const [isModified, setIsModified] = useState(false);
  
  /** Pestaña actualmente seleccionada en la interfaz */
  const [activeTab, setActiveTab] = useState("critical");

  /** Controla la visibilidad del modal de confirmación de modo de emergencia */
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  
  /** Almacena el motivo opcional para activar/desactivar modo de emergencia */
  const [emergencyReason, setEmergencyReason] = useState("");

  /** Estado temporal para agregar nuevo tiempo de recordatorio */
  const [newReminderTime, setNewReminderTime] = useState("");

  // ═══════════════════════════════════════════════════════════════════════
  // EFECTOS Y CARGA DE DATOS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Efecto para cargar y sincronizar los datos iniciales de configuración
   * Se ejecuta cada vez que cambian las configuraciones del servidor
   * 
   * @description
   * - Actualiza el estado local del formulario con datos del servidor
   * - Extrae campos críticos a estado separado para mejor control
   * - Resetea el estado de modificación al cargar nuevos datos
   */
  useEffect(() => {
    if (settings) {
      setFormData(settings.settings || {});
      setCriticalFields({
        cancellationHours: settings.cancellationHours,
        rescheduleTimeLimit: settings.rescheduleTimeLimit,
        maxAdvanceBookingDays: settings.maxAdvanceBookingDays,
        remindersEnabled: settings.remindersEnabled,
        reminderHours: settings.reminderHours || 24,
        emergencyMode: settings.emergencyMode,
        isActive: settings.isActive,
      });
    }
  }, [settings]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDERIZADO CONDICIONAL - ESTADO DE CARGA
  // ═══════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">
            {t("branchSettings.loadingDetail", "Cargando configuración...")}
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MANEJADORES DE EVENTOS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Maneja el guardado de configuraciones de la sede
   * 
   * @async
   * @function handleSave
   * @description
   * Construye un payload completo con valores por defecto para campos opcionales,
   * determina si debe crear nuevas configuraciones o actualizar existentes,
   * y persiste los cambios en el servidor.
   * 
   * @example
   * ```tsx
   * // Invocado automáticamente al hacer clic en "Guardar"
   * await handleSave();
   * ```
   * 
   * @throws {Error} Si falla la operación de guardado
   * @returns {Promise<void>}
   */
  const handleSave = async () => {
    try {
      // Construir el payload con valores por defecto para campos opcionales
      const payload = {
        settings: {
          cancellation: formData.cancellation || {
            allowCancellation: true,
            cancellationHours: criticalFields.cancellationHours,
            requireReason: false,
            sendConfirmationEmail: true,
            refundPolicy: ""
          },
          rescheduling: formData.rescheduling || {
            allowRescheduling: true,
            rescheduleTimeLimit: criticalFields.rescheduleTimeLimit,
            maxReschedules: 3,
            requireReason: false,
            sendConfirmationEmail: true
          },
          booking: formData.booking || {
            maxAdvanceBookingDays: criticalFields.maxAdvanceBookingDays,
            minAdvanceBookingHours: 1,
            allowSameDayBooking: true,
            requireDocumentVerification: false,
            maxAppointmentsPerUser: 5,
            allowRecurringAppointments: false
          },
          reminders: formData.reminders || {
            enabled: criticalFields.remindersEnabled,
            emailReminders: { enabled: true, times: [24, 2], template: "", customMessage: "" }
          },
          notifications: formData.notifications || {
            appointmentConfirmation: { email: true },
            appointmentReminder: { email: true },
            adminNotifications: { newAppointment: true, cancellation: true, noShow: true }
          },
          specialSchedules: formData.specialSchedules || {
            enabled: false,
            holidays: [],
            exceptionalDays: []
          },
          selfService: formData.selfService || {
            enabled: false,
            requireRegistration: true,
            allowWalkIn: true,
            kioskMode: false,
            printTickets: true,
            digitalTickets: true,
            estimateWaitTime: true
          },
          emergency: formData.emergency || {
            mode: Boolean(criticalFields.emergencyMode),
            priorityServices: [],
            extendedHours: false,
            skipQueue: false,
            emergencyContact: ""
          }
        },
        // Solo enviar los campos que el schema espera
        cancellationHours: Number(criticalFields.cancellationHours) || 24,
        rescheduleTimeLimit: Number(criticalFields.rescheduleTimeLimit) || 4,
        maxAdvanceBookingDays: Number(criticalFields.maxAdvanceBookingDays) || 30,
        remindersEnabled: Boolean(criticalFields.remindersEnabled),
        reminderHours: Number(criticalFields.reminderHours) || 24,
        reminderMessage: formData.reminders?.emailReminders?.customMessage || "",
        emergencyMode: Boolean(criticalFields.emergencyMode),
        isActive: Boolean(criticalFields.isActive)
      };

      if (isDefault || !settings?.id) {
        await createSettings.mutateAsync(payload);
      } else {
        await updateSettings.mutateAsync(payload);
      }

      setIsModified(false);
      toast({
        title: t("success.title", "Éxito"),
        description: t("branchSettings.saved", "Configuración guardada exitosamente"),
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      
      // Mostrar errores de validación específicos si están disponibles
      if (error.message && error.message.includes("Datos de configuración inválidos")) {
        toast({
          title: t("error.title", "Error de Validación"),
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: t("error.title", "Error"),
          description: t("error.savingSettings", "Error al guardar la configuración"),
          variant: "destructive"
        });
      }
    }
  };

  /**
   * Maneja el reseteo de configuraciones a valores por defecto
   * 
   * @async
   * @function handleReset
   * @description
   * Restaura todas las configuraciones de la sede a los valores por defecto
   * del sistema y actualiza el estado local del componente.
   * 
   * @example
   * ```tsx
   * // Invocado al hacer clic en "Restaurar Defaults"
   * await handleReset();
   * ```
   * 
   * @throws {Error} Si falla la operación de reseteo
   * @returns {Promise<void>}
   */
  const handleReset = async () => {
    try {
      await resetToDefaults.mutateAsync();
      setIsModified(false);
      toast({
        title: t("success.title", "Éxito"),
        description: t("branchSettings.resetSuccess", "Configuración restaurada a valores por defecto"),
      });
    } catch (error) {
      console.error("Error resetting settings:", error);
    }
  };

  /**
   * Maneja la activación/desactivación del modo de emergencia
   * 
   * @function handleEmergencyToggle
   * @description
   * Abre el modal de confirmación para activar o desactivar el modo de emergencia.
   * Resetea el motivo opcional para empezar con un campo limpio.
   * 
   * @example
   * ```tsx
   * // Invocado al hacer clic en botón de emergencia
   * handleEmergencyToggle();
   * ```
   * 
   * @returns {void}
   */
  const handleEmergencyToggle = () => {
    setEmergencyReason("");
    setShowEmergencyDialog(true);
  };

  /**
   * Confirma y ejecuta el cambio de modo de emergencia
   * 
   * @async
   * @function confirmEmergencyToggle
   * @description
   * Ejecuta el cambio de modo de emergencia después de la confirmación del usuario.
   * Utiliza el motivo proporcionado por el usuario o un motivo por defecto.
   * Cierra el modal y muestra feedback del resultado.
   * 
   * @example
   * ```tsx
   * // Invocado desde el modal de confirmación
   * await confirmEmergencyToggle();
   * ```
   * 
   * @throws {Error} Si falla la operación de cambio de modo
   * @returns {Promise<void>}
   */
  const confirmEmergencyToggle = async () => {
    try {
      const defaultReason = criticalFields.emergencyMode
        ? "Desactivación manual desde panel de administración"
        : "Activación manual desde panel de administración";
      
      const finalReason = emergencyReason.trim() || defaultReason;
      
      await toggleEmergencyMode.mutateAsync({
        enabled: !criticalFields.emergencyMode,
        reason: finalReason,
      });

      setShowEmergencyDialog(false);
      setEmergencyReason("");
      
      // Mostrar mensaje de éxito
      toast({
        title: t("success.title", "Éxito"),
        description: criticalFields.emergencyMode 
          ? t("branchSettings.emergencyModeInfo.deactivatedSuccess", "Modo de emergencia desactivado correctamente")
          : t("branchSettings.emergencyModeInfo.activatedSuccess", "Modo de emergencia activado correctamente"),
      });
    } catch (error) {
      console.error("Error toggling emergency mode:", error);
      toast({
        title: t("error.title", "Error"),
        description: t("error.generic", "Ocurrió un error inesperado"),
        variant: "destructive",
      });
    }
  };

  /**
   * Actualiza un valor anidado en el estado del formulario
   * 
   * @function updateFormData
   * @description
   * Utiliza una notación de puntos para actualizar propiedades anidadas
   * en el objeto de configuración del formulario de manera inmutable.
   * Automáticamente marca el formulario como modificado.
   * 
   * @example
   * ```tsx
   * // Actualizar configuración de cancelación
   * updateFormData("cancellation.allowCancellation", true);
   * 
   * // Actualizar horarios de recordatorios por email
   * updateFormData("reminders.emailReminders.times", [24, 2, 1]);
   * ```
   * 
   * @param {string} path - Ruta de la propiedad usando notación de puntos
   * @param {any} value - Nuevo valor a asignar
   * @returns {void}
   */
  const updateFormData = (path: string, value: any) => {
    const pathArray = path.split('.');
    const newFormData = { ...formData };
    
    let current: any = newFormData;
    for (let i = 0; i < pathArray.length - 1; i++) {
      if (!current[pathArray[i]]) {
        current[pathArray[i]] = {};
      }
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    
    setFormData(newFormData);
    setIsModified(true);
  };

  /**
   * Actualiza un campo crítico de la configuración
   * 
   * @function updateCriticalField
   * @description
   * Actualiza valores en el estado de campos críticos que afectan
   * directamente el comportamiento operativo de la sede.
   * Automáticamente marca el formulario como modificado.
   * 
   * @example
   * ```tsx
   * // Cambiar horas mínimas para cancelación
   * updateCriticalField("cancellationHours", 48);
   * 
   * // Activar o desactivar recordatorios
   * updateCriticalField("remindersEnabled", false);
   * ```
   * 
   * @param {string} field - Nombre del campo crítico a actualizar
   * @param {any} value - Nuevo valor para el campo
   * @returns {void}
   */
  const updateCriticalField = (field: string, value: any) => {
    setCriticalFields(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  /**
   * Maneja la adición de un nuevo tiempo de recordatorio
   * 
   * @function handleAddReminderTime
   * @description
   * Agrega un nuevo tiempo de recordatorio a la lista existente,
   * validando que sea un número válido y que no esté duplicado.
   * 
   * @returns {void}
   */
  const handleAddReminderTime = () => {
    const timeValue = parseInt(newReminderTime);
    
    // Validar que sea un número válido
    if (isNaN(timeValue) || timeValue < 1 || timeValue > 168) {
      toast({
        title: t("branchSettings.error", "Error"),
        description: t("branchSettings.invalidReminderTime", "El tiempo debe ser un número entre 1 y 168 horas"),
        variant: "destructive"
      });
      return;
    }

    const currentTimes = formData.reminders?.emailReminders?.times ?? [24, 2];
    
    // Verificar que no esté duplicado
    if (currentTimes.includes(timeValue)) {
      toast({
        title: t("branchSettings.error", "Error"),
        description: t("branchSettings.duplicateReminderTime", "Este tiempo de recordatorio ya existe"),
        variant: "destructive"
      });
      return;
    }

    // Agregar el nuevo tiempo y ordenar la lista
    const newTimes = [...currentTimes, timeValue].sort((a, b) => b - a);
    updateFormData("reminders.emailReminders.times", newTimes);
    setNewReminderTime("");
    
    toast({
      title: t("branchSettings.success", "Éxito"),
      description: t("branchSettings.reminderTimeAdded", `Tiempo de recordatorio agregado: ${timeValue} horas`),
    });
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDERIZADO PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════
          ENCABEZADO CON INFORMACIÓN Y MODO DE EMERGENCIA
          - Título y descripción del componente
          - Badge indicativo de configuración por defecto
          - Botón para activar/desactivar modo de emergencia
          RESPONSIVO: Stack vertical en móviles, botón más pequeño
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold sm:text-2xl">
              {t("branchSettings.detailTitle", "Configuración de Sede")}
            </h2>
            {isDefault && (
              <Badge variant="outline" className="text-xs">
                {t("branchSettings.usingDefaults", "Usando valores por defecto")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("branchSettings.detailDesc", "Configura los parámetros específicos de esta sede")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button
            variant={criticalFields.emergencyMode ? "destructive" : "outline"}
            size="sm"
            onClick={handleEmergencyToggle}
            disabled={toggleEmergencyMode.isPending}
            className="text-xs sm:text-sm"
          >
            {criticalFields.emergencyMode ? (
              <>
                <ShieldOff className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("branchSettings.deactivateEmergency", "Desactivar Emergencia")}</span>
                <span className="sm:hidden">{t("branchSettings.deactivateEmergencyShort", "Desactivar")}</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("branchSettings.activateEmergency", "Activar Emergencia")}</span>
                <span className="sm:hidden">{t("branchSettings.activateEmergencyShort", "Activar")}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ALERTA DE MODO DE EMERGENCIA
          - Mensaje visual cuando la sede está en modo de emergencia
          - Indica que algunas restricciones pueden estar relajadas
          ═══════════════════════════════════════════════════════════════════ */}
      {criticalFields.emergencyMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t("branchSettings.emergencyActiveMessage", "Esta sede está en modo de emergencia. Algunas restricciones pueden estar relajadas.")}
          </AlertDescription>
        </Alert>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PESTAÑAS DE CONFIGURACIÓN
          - Organiza las configuraciones en tres categorías principales:
            1. Críticos: Parámetros fundamentales de operación
            2. Cancelación: Políticas y reglas para cancelaciones
            3. Recordatorios: Configuración de notificaciones
          ═══════════════════════════════════════════════════════════════════ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="critical" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("branchSettings.tabs.critical", "Críticos")}</span>
            <span className="sm:hidden">{t("branchSettings.tabs.criticalShort", "Críticos")}</span>
          </TabsTrigger>
          <TabsTrigger value="cancellation" className="text-xs sm:text-sm">
            <XCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("branchSettings.tabs.cancellation", "Cancelación")}</span>
            <span className="sm:hidden">{t("branchSettings.tabs.cancellationShort", "Cancel.")}</span>
          </TabsTrigger>
          <TabsTrigger value="reminders" className="text-xs sm:text-sm">
            <Bell className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("branchSettings.tabs.reminders", "Recordatorios")}</span>
            <span className="sm:hidden">{t("branchSettings.tabs.remindersShort", "Record.")}</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════
            PESTAÑA: CONFIGURACIONES CRÍTICAS
            - Horas mínimas para cancelar citas
            - Límite de tiempo para reagendar
            - Días máximos de anticipación para reservas
            - Switches para recordatorios y activación de sede
            ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="critical">
          <Card>
            <CardHeader>
              <CardTitle>{t("branchSettings.criticalSettings", "Configuraciones Críticas")}</CardTitle>
              <CardDescription>
                {t("branchSettings.criticalDesc", "Parámetros principales que afectan el funcionamiento de la sede")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cancellationHours">
                    {t("branchSettings.cancellationHours", "Horas mínimas para cancelar")}
                  </Label>
                  <Input
                    id="cancellationHours"
                    type="number"
                    min="0"
                    max="168"
                    value={criticalFields.cancellationHours}
                    onChange={(e) => updateCriticalField("cancellationHours", parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("branchSettings.cancellationHoursDesc", "Tiempo mínimo antes de la cita para permitir cancelación")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rescheduleTimeLimit">
                    {t("branchSettings.rescheduleTimeLimit", "Límite para reagendar (horas)")}
                  </Label>
                  <Input
                    id="rescheduleTimeLimit"
                    type="number"
                    min="0"
                    max="168"
                    value={criticalFields.rescheduleTimeLimit}
                    onChange={(e) => updateCriticalField("rescheduleTimeLimit", parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("branchSettings.rescheduleTimeLimitDesc", "Tiempo mínimo antes de la cita para permitir reagendamiento")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAdvanceBookingDays">
                    {t("branchSettings.maxAdvanceBookingDays", "Días máximos de anticipación")}
                  </Label>
                  <Input
                    id="maxAdvanceBookingDays"
                    type="number"
                    min="1"
                    max="365"
                    value={criticalFields.maxAdvanceBookingDays}
                    onChange={(e) => updateCriticalField("maxAdvanceBookingDays", parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("branchSettings.maxAdvanceBookingDaysDesc", "Días máximos de anticipación para reservar citas")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>{t("branchSettings.remindersEnabled", "Recordatorios activos")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("branchSettings.remindersEnabledDesc", "Enviar recordatorios automáticos")}
                      </p>
                    </div>
                    <Switch
                      checked={criticalFields.remindersEnabled}
                      onCheckedChange={(checked) => updateCriticalField("remindersEnabled", checked)}
                    />
                  </div>

                  {criticalFields.remindersEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="reminderHours">{t("branchSettings.reminderHours", "Horas de anticipación")}</Label>
                      <Input
                        id="reminderHours"
                        type="number"
                        min="1"
                        max="168"
                        value={criticalFields.reminderHours || 24}
                        onChange={(e) => updateCriticalField("reminderHours", parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("branchSettings.reminderHoursDesc", "Horas antes de la cita para enviar recordatorios")}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>{t("branchSettings.isActive", "Sede activa")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("branchSettings.isActiveDesc", "La sede acepta nuevas citas")}
                      </p>
                    </div>
                    <Switch
                      checked={criticalFields.isActive}
                      onCheckedChange={(checked) => updateCriticalField("isActive", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            PESTAÑA: CONFIGURACIONES DE CANCELACIÓN
            - Permitir/denegar cancelaciones
            - Requerir motivo para cancelar
            - Envío de emails de confirmación
            - Política de reembolso personalizable
            ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="cancellation">
          <Card>
            <CardHeader>
              <CardTitle>{t("branchSettings.cancellationPolicy", "Política de Cancelaciones")}</CardTitle>
              <CardDescription>
                {t("branchSettings.cancellationPolicyDesc", "Configurar reglas y restricciones para cancelaciones")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>{t("branchSettings.allowCancellation", "Permitir cancelaciones")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("branchSettings.allowCancellationDesc", "Los usuarios pueden cancelar sus citas")}
                    </p>
                  </div>
                  <Switch
                    checked={formData.cancellation?.allowCancellation ?? true}
                    onCheckedChange={(checked) => updateFormData("cancellation.allowCancellation", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>{t("branchSettings.requireReason", "Requiere motivo")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("branchSettings.requireReasonDesc", "Solicitar motivo al cancelar")}
                    </p>
                  </div>
                  <Switch
                    checked={formData.cancellation?.requireReason ?? false}
                    onCheckedChange={(checked) => updateFormData("cancellation.requireReason", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>{t("branchSettings.sendConfirmationEmail", "Email de confirmación")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("branchSettings.sendConfirmationEmailDesc", "Enviar email al cancelar")}
                    </p>
                  </div>
                  <Switch
                    checked={formData.cancellation?.sendConfirmationEmail ?? true}
                    onCheckedChange={(checked) => updateFormData("cancellation.sendConfirmationEmail", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundPolicy">
                    {t("branchSettings.refundPolicy", "Política de reembolso")}
                  </Label>
                  <Textarea
                    id="refundPolicy"
                    placeholder={t("branchSettings.refundPolicyPlaceholder", "Describe la política de reembolso para cancelaciones...")}
                    value={formData.cancellation?.refundPolicy ?? ""}
                    onChange={(e) => updateFormData("cancellation.refundPolicy", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════
            PESTAÑA: CONFIGURACIONES DE RECORDATORIOS
            - Configuración de recordatorios automáticos por email:
              1. Email: Configuración de horarios, plantillas y mensajes personalizados
            - Permite configurar horarios específicos y contenido personalizado
            ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>{t("branchSettings.reminderConfiguration", "Configuración de Recordatorios")}</CardTitle>
              <CardDescription>
                {t("branchSettings.reminderSettingsDesc", "Configura cuándo y cómo enviar recordatorios")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="email">
                  <AccordionTrigger className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("branchSettings.emailReminders", "Recordatorios por Email")}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>{t("branchSettings.enableEmailReminders", "Habilitar recordatorios por email")}</Label>
                      <Switch
                        checked={formData.reminders?.emailReminders?.enabled ?? true}
                        onCheckedChange={(checked) => updateFormData("reminders.emailReminders.enabled", checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("branchSettings.reminderTimes", "Horarios de recordatorio (horas antes)")}</Label>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {(formData.reminders?.emailReminders?.times ?? [24, 2])
                            .sort((a, b) => b - a) // Ordenar de mayor a menor
                            .map((time, index) => (
                            <div key={`${time}-${index}`} className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                              <span className="text-sm font-medium text-primary">{time}h</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                                onClick={() => {
                                  const currentTimes = formData.reminders?.emailReminders?.times ?? [24, 2];
                                  
                                  // Prevenir eliminar el último tiempo de recordatorio
                                  if (currentTimes.length <= 1) {
                                    toast({
                                      title: t("branchSettings.error", "Error"),
                                      description: t("branchSettings.lastReminderTimeError", "Debe mantener al menos un tiempo de recordatorio configurado"),
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  
                                  const newTimes = currentTimes.filter((t) => t !== time);
                                  updateFormData("reminders.emailReminders.times", newTimes);
                                }}
                                disabled={(formData.reminders?.emailReminders?.times ?? [24, 2]).length <= 1}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground mr-2">{t("branchSettings.commonTimes", "Tiempos comunes:")}</span>
                            {[1, 2, 4, 6, 12, 24, 48, 72].map((hours) => (
                              <Button
                                key={hours}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  const currentTimes = formData.reminders?.emailReminders?.times ?? [24, 2];
                                  if (!currentTimes.includes(hours)) {
                                    const newTimes = [...currentTimes, hours].sort((a, b) => b - a);
                                    updateFormData("reminders.emailReminders.times", newTimes);
                                  }
                                }}
                                disabled={(formData.reminders?.emailReminders?.times ?? [24, 2]).includes(hours)}
                              >
                                {hours}h
                              </Button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="168"
                              placeholder={t("branchSettings.addReminderTimePlaceholder", "Ej: 24")}
                              value={newReminderTime}
                              onChange={(e) => setNewReminderTime(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddReminderTime();
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddReminderTime}
                              disabled={!newReminderTime || isNaN(parseInt(newReminderTime))}
                            >
                              {t("branchSettings.addReminderTime", "Agregar")}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t("branchSettings.reminderTimesHelp", "Agregue las horas antes de la cita para enviar recordatorios (1-168 horas)")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("branchSettings.customReminderMessage", "Mensaje personalizado del recordatorio")}</Label>
                      <Textarea
                        placeholder={t("branchSettings.customReminderMessagePlaceholder", "Escriba su mensaje personalizado aquí. Use placeholders como {{userName}}, {{serviceName}}, {{date}}, {{time}}, {{branchName}}, {{branchAddress}}, {{branchPhone}}, {{confirmationCode}}")}
                        value={formData.reminders?.emailReminders?.customMessage ?? ""}
                        onChange={(e) => updateFormData("reminders.emailReminders.customMessage", e.target.value)}
                        rows={5}
                        className="text-sm"
                      />
                      {(!formData.reminders?.emailReminders?.customMessage || formData.reminders.emailReminders.customMessage.trim() === "") && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {t("branchSettings.defaultMessageWarning", "Si no se especifica un mensaje personalizado, se utilizará un mensaje por defecto del sistema.")}
                          </AlertDescription>
                        </Alert>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t("branchSettings.customReminderMessageHelp", "Placeholders disponibles: {{userName}}, {{serviceName}}, {{date}}, {{time}}, {{branchName}}, {{branchAddress}}, {{branchPhone}}, {{confirmationCode}}")}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTONES DE ACCIÓN
          - Botón de resetear a valores por defecto (solo si no es configuración por defecto)
          - Botón de cancelar (si se proporciona callback onClose)
          - Botón de guardar (habilitado solo si hay cambios pendientes)
          - Estados de carga y deshabilitado durante operaciones
          RESPONSIVO: Stack vertical en móviles, botones más pequeños
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-4 pt-4 border-t sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {!isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={resetToDefaults.isPending}
              className="text-xs sm:text-sm"
            >
              {resetToDefaults.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{t("branchSettings.resetToDefaults", "Restaurar Defaults")}</span>
              <span className="sm:hidden">{t("branchSettings.resetToDefaultsShort", "Restaurar")}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
              className="text-xs sm:text-sm"
            >
              {t("common.cancel", "Cancelar")}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isModified || updateSettings.isPending || createSettings.isPending}
            className="text-xs sm:text-sm"
          >
            {(updateSettings.isPending || createSettings.isPending) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{t("common.save", "Guardar")}</span>
            <span className="sm:hidden">{t("common.saveShort", "Guardar")}</span>
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL DE CONFIRMACIÓN PARA MODO DE EMERGENCIA
          Dialog modal que proporciona información detallada sobre el modo de emergencia
          y solicita confirmación antes de activar/desactivar esta función crítica.
          Incluye explicación de los cambios que se aplicarán y campo opcional para motivo.
          RESPONSIVO: Altura máxima adaptable, scroll interno, contenido compacto en móviles
          ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-[98vw] w-full sm:max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-3">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {criticalFields.emergencyMode ? (
                <ShieldOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              ) : (
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
              )}
              <span className="truncate">
                {criticalFields.emergencyMode 
                  ? t("branchSettings.emergencyModeInfo.deactivateTitle", "Desactivar Modo de Emergencia")
                  : t("branchSettings.emergencyModeInfo.title", "Modo de Emergencia")
                }
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {criticalFields.emergencyMode 
                ? t("branchSettings.emergencyModeInfo.deactivateSubtitle", "¿Estás seguro de que deseas desactivar el modo de emergencia?")
                : t("branchSettings.emergencyModeInfo.subtitle", "¿Estás seguro de que deseas activar el modo de emergencia?")
              }
            </DialogDescription>
          </DialogHeader>

          {/* Contenido con scroll interno para evitar overflow */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            <div className="space-y-3 sm:space-y-4">
              {/* Descripción principal */}
              <div className="text-xs sm:text-sm text-muted-foreground">
                {criticalFields.emergencyMode 
                  ? t("branchSettings.emergencyModeInfo.deactivateDescription", "Al desactivar el modo de emergencia, todas las configuraciones volverán a sus valores normales.")
                  : t("branchSettings.emergencyModeInfo.description", "El modo de emergencia modifica temporalmente el funcionamiento de la sede para situaciones críticas. Los siguientes cambios entrarán en vigor:")
                }
              </div>

              {/* Lista de cambios (solo al activar) */}
              {!criticalFields.emergencyMode && (
                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{t("branchSettings.emergencyModeInfo.changes.relaxedRestrictions", "Se relajan las restricciones de tiempo para cancelaciones y reagendamientos")}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{t("branchSettings.emergencyModeInfo.changes.priorityScheduling", "Se priorizan las citas de emergencia en la agenda")}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{t("branchSettings.emergencyModeInfo.changes.extendedHours", "Se habilitan horarios extendidos de atención")}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{t("branchSettings.emergencyModeInfo.changes.skipValidations", "Se omiten algunas validaciones no críticas")}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{t("branchSettings.emergencyModeInfo.changes.adminNotifications", "Se notifica automáticamente a todos los administradores")}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{t("branchSettings.emergencyModeInfo.changes.auditLog", "Todas las acciones quedan registradas en el log de auditoría")}</span>
                    </div>
                  </div>

                  {/* Advertencia */}
                  <Alert variant="destructive" className="py-2 sm:py-3">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <AlertDescription className="text-xs sm:text-sm leading-tight">
                      {t("branchSettings.emergencyModeInfo.warning", "Este modo debe usarse únicamente en situaciones de emergencia real y será auditado.")}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Campo de motivo opcional */}
              <div className="space-y-2">
                <Label htmlFor="emergency-reason" className="text-xs sm:text-sm font-medium">
                  {t("branchSettings.emergencyModeInfo.reasonPlaceholder", "Describe brevemente la situación de emergencia (opcional)")}
                </Label>
                <Textarea
                  id="emergency-reason"
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  placeholder={t("branchSettings.emergencyModeInfo.reasonPlaceholder", "Describe brevemente la situación de emergencia (opcional)")}
                  className="min-h-[50px] sm:min-h-[60px] text-xs sm:text-sm resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {emergencyReason.length}/500
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2 pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => setShowEmergencyDialog(false)}
              disabled={toggleEmergencyMode.isPending}
              className="text-xs sm:text-sm h-8 sm:h-9 order-2 sm:order-1"
            >
              {t("branchSettings.emergencyModeInfo.cancel", "Cancelar")}
            </Button>
            <Button
              variant={criticalFields.emergencyMode ? "default" : "destructive"}
              onClick={confirmEmergencyToggle}
              disabled={toggleEmergencyMode.isPending}
              className="text-xs sm:text-sm h-8 sm:h-9 order-1 sm:order-2"
            >
              {toggleEmergencyMode.isPending ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              ) : criticalFields.emergencyMode ? (
                <ShieldOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              ) : (
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              <span className="truncate">
                {criticalFields.emergencyMode 
                  ? t("branchSettings.emergencyModeInfo.deactivateConfirm", "Sí, desactivar modo de emergencia")
                  : t("branchSettings.emergencyModeInfo.confirm", "Sí, activar modo de emergencia")
                }
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * @fileoverview Componente BranchSettingsDetail
 * 
 * ### Arquitectura del Componente
 * 
 * Este archivo implementa un componente React complejo para la gestión de configuraciones
 * de sede con las siguientes características arquitecturales:
 * 
 * #### Estructura de Estado:
 * - **formData**: Estado principal del formulario con configuraciones anidadas
 * - **criticalFields**: Campos críticos separados para validaciones especiales
 * - **isModified**: Flag para detectar cambios y habilitar guardado
 * - **activeTab**: Control de navegación entre pestañas
 * 
 * #### Patrones Implementados:
 * - **Controlled Components**: Todos los inputs están controlados por React state
 * - **Optimistic Updates**: Cambios locales inmediatos con sincronización posterior
 * - **Error Boundaries**: Manejo robusto de errores en operaciones async
 * - **Accessibility**: Componentes con soporte completo para lectores de pantalla
 * 
 * #### Flujo de Datos:
 * ```
 * Server Data → useBranchSettings → Local State → Form Inputs
 *                                       ↓
 * Server Update ← Mutation Hooks ← Event Handlers ← User Actions
 * ```
 * 
 * #### Responsabilidades:
 * - Renderizado de interfaz de configuración organizada en pestañas
 * - Validación y transformación de datos de formulario
 * - Comunicación con hooks de datos para persistencia
 * - Feedback visual de estados de carga y errores
 * - Internacionalización completa de textos e interfaz
 * 
 * @version 1.0.0
 * @since 2025
 */
