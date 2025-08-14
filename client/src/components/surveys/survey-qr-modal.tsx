import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { QrCode, ExternalLink, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Propiedades del componente SurveyQRModal
 */
interface SurveyQRModalProps {
  /** Indica si el modal está abierto o cerrado */
  isOpen: boolean;
  /** Función que se ejecuta cuando se cierra el modal */
  onClose: () => void;
  /** Datos de la encuesta que incluyen ID, token y código QR opcional */
  surveyData: {
    /** Identificador único de la encuesta */
    id: number;
    /** Token único para acceder a la encuesta de forma pública */
    token: string;
    /** Código QR en formato base64 (opcional) */
    qrCode?: string;
  } | null;
  /** Indica si se está cargando la información de la encuesta */
  isLoading?: boolean;
}

/**
 * Componente modal que muestra el código QR y enlace de una encuesta de satisfacción.
 * 
 * Este componente permite al personal mostrar a los usuarios un código QR y enlace
 * para acceder a la encuesta de satisfacción de forma pública, sin necesidad de
 * autenticación. Incluye funcionalidades para copiar el enlace y abrir la encuesta
 * directamente en una nueva pestaña.
 * 
 * @param props - Las propiedades del componente
 * @param props.isOpen - Controla si el modal está visible
 * @param props.onClose - Función callback que se ejecuta al cerrar el modal
 * @param props.surveyData - Objeto con los datos de la encuesta (ID, token, QR)
 * @param props.isLoading - Estado de carga para mostrar un spinner mientras se obtienen los datos
 * 
 * @returns Componente React que renderiza un modal con el QR y enlace de la encuesta
 * 
 * @example
 * ```tsx
 * <SurveyQRModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   surveyData={{
 *     id: 123,
 *     token: "abc123def456",
 *     qrCode: "data:image/png;base64,iVBORw0KGgo..."
 *   }}
 *   isLoading={false}
 * />
 * ```
 * 
 * @remarks
 * - El componente maneja tres estados: carga, con QR disponible, y sin QR
 * - Si no hay QR disponible, muestra un mensaje indicando que no hay preguntas configuradas
 * - El enlace generado usa la estructura `/survey/{token}` para acceso público
 * - Incluye funcionalidad de copia al portapapeles y apertura en nueva pestaña
 * - Todos los textos están internacionalizados usando react-i18next
 */
export function SurveyQRModal({ isOpen, onClose, surveyData, isLoading = false }: SurveyQRModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  /** URL completa de la encuesta pública generada a partir del token */
  const surveyUrl = surveyData?.token ? `${window.location.origin}/survey/${surveyData.token}` : '';

  /**
   * Copia el enlace de la encuesta al portapapeles del usuario.
   * Muestra una notificación de éxito o error según el resultado.
   * 
   * @returns Promise<void>
   */
  const handleCopyLink = async () => {
    if (!surveyUrl) return;
    
    try {
      await navigator.clipboard.writeText(surveyUrl);
      toast({
        title: t('common.success'),
        description: t('common.copied'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('common.copyError'),
      });
    }
  };

  /**
   * Abre la encuesta directamente en una nueva pestaña del navegador.
   * Permite al personal probar o mostrar la encuesta inmediatamente.
   */
  const handleOpenDirectly = () => {
    if (surveyUrl) {
      window.open(surveyUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t('surveys.surveyQRTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('surveys.surveyQRDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado de carga: Muestra spinner mientras se obtienen los datos de la encuesta */}
          {isLoading && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
          )}

          {/* Visualización del código QR: Se muestra cuando hay un QR disponible */}
          {!isLoading && surveyData?.qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <img
                  src={surveyData.qrCode}
                  alt={t('surveys.qrCodeAlt')}
                  className="w-48 h-48"
                />
              </div>
              <Badge variant="secondary" className="text-sm">
                {t('surveys.surveyId')}: {surveyData.id}
              </Badge>
            </div>
          )}

          {/* Estado sin QR: Cuando la encuesta existe pero no tiene preguntas configuradas */}
          {!isLoading && surveyData && !surveyData.qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                <QrCode className="h-24 w-24 mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {t('surveys.noQuestionsConfigured')}
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {t('surveys.surveyId')}: {surveyData.id}
              </Badge>
            </div>
          )}

          {/* Campo de URL: Permite copiar el enlace de la encuesta */}
          {!isLoading && surveyData && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('surveys.surveyLink')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={surveyUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-gray-50 text-gray-700"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                  disabled={!surveyUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Instrucciones: Información adicional para el usuario sobre cómo usar el QR */}
          {!isLoading && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                {t('surveys.surveyQRInstructions')}
              </p>
            </div>
          )}

          {/* Botones de acción: Opciones para abrir directamente o cerrar el modal */}
          {!isLoading && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleOpenDirectly}
                className="flex-1"
                disabled={!surveyUrl}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('surveys.openSurveyDirectly')}
              </Button>
              <Button
                onClick={onClose}
                className="flex-1"
              >
                {t('surveys.closeSurveyModal')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
