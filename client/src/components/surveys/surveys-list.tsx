import { useSurveys, type Survey } from "@/hooks/use-surveys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, Clock, CheckCircle, XCircle, User, Building, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Props para el componente SurveysList.
 * 
 * @interface SurveysListProps
 */
interface SurveysListProps {
  /** Lista de encuestas a mostrar */
  surveys: Survey[];
  /** Función callback para reenviar email de encuesta */
  onResendEmail: (surveyId: number) => void;
  /** Indica si hay una operación de reenvío en progreso */
  isResending: boolean;
}

/**
 * Componente que renderiza una lista completa de encuestas de satisfacción enviadas.
 * 
 * Este componente proporciona una interfaz para que los administradores y staff
 * puedan gestionar las encuestas enviadas a los usuarios. Permite visualizar el
 * estado de cada encuesta, reenviar emails y acceder a las encuestas para revisión.
 * 
 * @param props - Las propiedades del componente
 * @param props.surveys - Lista de encuestas a mostrar
 * @param props.onResendEmail - Función para reenviar el email de una encuesta
 * @param props.isResending - Estado de carga durante el reenvío de emails
 * @returns Componente React que renderiza la lista de encuestas
 * 
 * @example
 * ```tsx
 * function SurveysManagement() {
 *   const { surveys, resendEmail, isResendingEmail } = useSurveys();
 * 
 *   const handleResendEmail = (surveyId: number) => {
 *     resendEmail(surveyId);
 *   };
 * 
 *   return (
 *     <SurveysList 
 *       surveys={surveys || []}
 *       onResendEmail={handleResendEmail}
 *       isResending={isResendingEmail}
 *     />
 *   );
 * }
 * ```
 * 
 * @remarks
 * ### Funcionalidades principales:
 * 
 * **📋 Información de encuestas:**
 * - Datos del usuario (nombre, email)
 * - Servicio y sede relacionados
 * - Estado de la encuesta (pendiente, completada, expirada)
 * - Fechas de envío y completación
 * 
 * **📧 Gestión de emails:**
 * - Botón para reenviar email (solo para encuestas pendientes)
 * - Estado de carga durante el reenvío
 * - Indicadores visuales del estado de envío
 * 
 * **🔗 Acceso a encuestas:**
 * - Botón para previsualizar la encuesta
 * - Link directo copiable al portapapeles
 * - Apertura en nueva pestaña para revisión
 * 
 * **🎨 Estados visuales:**
 * - Badges con colores según el estado
 * - Iconos descriptivos para cada estado
 * - Layout responsivo y organizado
 * 
 * ### Estados de encuesta:
 * - **Pendiente**: Encuesta enviada pero no completada (amarillo)
 * - **Completada**: Encuesta respondida por el usuario (verde)
 * - **Expirada**: Encuesta que superó el tiempo límite (rojo)
 * 
 * ### Interacciones disponibles:
 * - **Reenviar email**: Para encuestas pendientes únicamente
 * - **Ver encuesta**: Abre la encuesta en nueva pestaña
 * - **Copiar enlace**: Copia el enlace directo al portapapeles
 * 
 * ### Estado vacío:
 * Cuando no hay encuestas, muestra un mensaje informativo con
 * un ícono y descripción sobre cómo se generan las encuestas.
 */
export function SurveysList({ surveys, onResendEmail, isResending }: SurveysListProps) {
  /** Hook de traducción para internacionalización */
  const { t } = useTranslation();

  /**
   * Retorna el ícono apropiado para cada estado de encuesta.
   * 
   * @param status - Estado de la encuesta
   * @returns Componente de ícono correspondiente al estado
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  /**
   * Retorna la etiqueta traducida para cada estado de encuesta.
   * 
   * @param status - Estado de la encuesta
   * @returns Texto traducido del estado
   */
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t('surveys.pending');
      case "completed":
        return t('surveys.completed');
      case "expired":
        return t('surveys.expired');
      default:
        return status;
    }
  };

  /**
   * Retorna la variante de color del badge según el estado de la encuesta.
   * 
   * @param status - Estado de la encuesta
   * @returns Variante de color para el badge (default, secondary, destructive, outline)
   */
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "default";
      case "completed":
        return "secondary";
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Renderizar estado vacío cuando no hay encuestas
  if (surveys.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('surveys.noSurveys')}</h3>
          <p className="text-muted-foreground">
            {t('surveys.noSurveysDescription', 'No se han enviado encuestas aún. Las encuestas se envían automáticamente al completar un servicio.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Renderizar lista de encuestas con toda la información y acciones disponibles
  return (
    <div className="space-y-3 sm:space-y-4">
      {surveys.map((survey) => (
        <Card key={survey.id}>
          {/* Header con información del usuario y estado */}
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Información del usuario */}
                <CardTitle className="text-sm sm:text-base flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{survey.user.username}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-normal text-muted-foreground truncate">
                    {survey.user.email}
                  </span>
                </CardTitle>
                {/* Información del servicio y sede */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Wrench className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{survey.service.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{survey.branch.name}</span>
                  </div>
                </div>
              </div>
              {/* Badge con estado de la encuesta */}
              <div className="flex items-center justify-start sm:justify-end">
                <Badge variant={getStatusVariant(survey.status)} className="flex items-center gap-1 text-xs">
                  {getStatusIcon(survey.status)}
                  <span>{getStatusLabel(survey.status)}</span>
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          {/* Content con fechas y acciones */}
          <CardContent className="pt-0">
            <div className="flex flex-col gap-3">
              {/* Información de fechas */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">{t('surveys.sentAt')}:</span>
                  <span className="ml-1">
                    {format(new Date(survey.createdAt), 'PPp', { locale: es })}
                  </span>
                </div>
                {survey.completedAt && (
                  <div>
                    <span className="font-medium">{t('surveys.completedAt')}:</span>
                    <span className="ml-1">
                      {format(new Date(survey.completedAt), 'PPp', { locale: es })}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Botones de acción en una fila separada */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Botones de acción: reenviar email y ver encuesta */}
                <div className="flex items-center gap-2">
                  {survey.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResendEmail(survey.id)}
                      disabled={isResending}
                      className="flex items-center gap-1 text-xs sm:text-sm h-8"
                    >
                      <Mail className="h-3 w-3" />
                      <span className="hidden sm:inline">{t('surveys.resendEmail')}</span>
                      <span className="sm:hidden">{t('surveys.resendEmailShort')}</span>
                    </Button>
                  )}
                  
                  {/* Botón para ver/previsualizar la encuesta */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Open survey in new tab for preview
                      window.open(`/survey/${survey.token}`, '_blank');
                    }}
                    className="flex items-center gap-1 text-xs sm:text-sm h-8"
                  >
                    <Eye className="h-3 w-3" />
                    <span>{t('surveys.viewSurvey', 'Ver')}</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Sección con enlace copiable de la encuesta */}
            <div className="mt-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="break-all">
                  {t('surveys.surveyLink', 'Enlace de encuesta:')} /survey/{survey.token}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/survey/${survey.token}`);
                  }}
                  className="h-6 text-xs self-start sm:self-center flex-shrink-0"
                >
                  {t('common.copy', 'Copiar')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
