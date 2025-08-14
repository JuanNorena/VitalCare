import { Download, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * Propiedades para el componente QRDisplay
 * 
 * @interface QRDisplayProps
 */
interface QRDisplayProps {
  /** Código QR en formato base64 o URL de imagen */
  qrCode: string;
  
  /** ID de la cita asociada al código QR (opcional) */
  appointmentId?: number;
  
  /** Código de confirmación de la cita (opcional) */
  confirmationCode?: string;
  
  /** Título personalizado para el componente (opcional) */
  title?: string;
  
  /** Subtítulo o descripción adicional (opcional) */
  subtitle?: string;
  
  /** Determina si se muestran los botones de acción (descargar, compartir, copiar) */
  showActions?: boolean;
  
  /** Clases CSS adicionales para personalizar el estilo */
  className?: string;
}

/**
 * Componente para mostrar códigos QR de citas con funcionalidades de descarga, compartir y copiar.
 * 
 * Este componente renderiza un código QR junto con información de la cita y proporciona
 * acciones para interactuar con el código QR y el código de confirmación.
 * 
 * @component
 * @example
 * ```tsx
 * // Uso básico
 * <QRDisplay qrCode="data:image/png;base64,..." />
 * 
 * // Uso completo con todas las propiedades
 * <QRDisplay
 *   qrCode="data:image/png;base64,..."
 *   appointmentId={123}
 *   confirmationCode="ABC123"
 *   title="Código QR de tu Cita"
 *   subtitle="Escanea este código en el punto de atención"
 *   showActions={true}
 *   className="custom-class"
 * />
 * ```
 * 
 * @param props - Propiedades del componente QRDisplay
 * @returns Componente React que muestra el código QR con las acciones disponibles
 */
export function QRDisplay({
  qrCode,
  appointmentId,
  confirmationCode,
  title,
  subtitle,
  showActions = true,
  className = ""
}: QRDisplayProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  /**
   * Maneja la descarga del código QR como archivo PNG.
   * 
   * Crea un enlace temporal para descargar la imagen del código QR
   * con un nombre de archivo que incluye el ID de la cita.
   * 
   * @function handleDownload
   * @throws {Error} Si ocurre un error durante la descarga
   * @example
   * ```tsx
   * <Button onClick={handleDownload}>Descargar QR</Button>
   * ```
   */
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `appointment-qr-${appointmentId || 'code'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: t('common.success'),
        description: t('appointments.qr.downloadSuccess'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('appointments.qr.downloadError'),
      });
    }
  };

  /**
   * Copia el código de confirmación al portapapeles del usuario.
   * 
   * Utiliza la API del portapapeles del navegador para copiar el código
   * de confirmación y muestra un mensaje de éxito o error.
   * 
   * @async
   * @function handleCopyCode
   * @returns {Promise<void>} Promesa que se resuelve cuando se completa la operación
   * @throws {Error} Si ocurre un error al acceder al portapapeles
   * @example
   * ```tsx
   * <Button onClick={handleCopyCode}>Copiar Código</Button>
   * ```
   */
  const handleCopyCode = async () => {
    if (!confirmationCode) return;
    
    try {
      await navigator.clipboard.writeText(confirmationCode);
      toast({
        title: t('common.success'),
        description: t('appointments.qr.codeCopied'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('appointments.qr.copyError'),
      });
    }
  };

  /**
   * Comparte el código QR utilizando la API nativa de compartir del navegador.
   * 
   * Convierte la imagen base64 del código QR en un archivo y utiliza
   * la API Web Share para compartirlo. Si la API no está disponible,
   * muestra un mensaje de error.
   * 
   * @async
   * @function handleShare
   * @returns {Promise<void>} Promesa que se resuelve cuando se completa la operación de compartir
   * @throws {Error} Si la API de compartir no está disponible o ocurre un error durante el proceso
   * @example
   * ```tsx
   * <Button onClick={handleShare}>Compartir QR</Button>
   * ```
   * 
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share} API Web Share
   */
  const handleShare = async () => {
    if (!navigator.share) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('appointments.qr.shareNotSupported'),
      });
      return;
    }

    try {
      // Convert base64 to blob for sharing
      const response = await fetch(qrCode);
      const blob = await response.blob();
      const file = new File([blob], `appointment-qr-${appointmentId || 'code'}.png`, { type: 'image/png' });

      await navigator.share({
        title: title || t('appointments.qr.shareTitle'),
        text: subtitle || t('appointments.qr.shareText'),
        files: [file]
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('appointments.qr.shareError'),
      });    }
  };

  /**
   * Renderiza el componente QRDisplay con la siguiente estructura:
   * 
   * - **Encabezado**: Título y subtítulo opcionales
   * - **Código QR**: Imagen del código QR centrada con fondo blanco
   * - **Código de Confirmación**: Código alfanumérico con botón para copiar (si está disponible)
   * - **Botones de Acción**: Descargar, compartir (si está habilitado)
   * - **Instrucciones**: Texto de ayuda para el usuario
   * 
   * @returns {JSX.Element} Elemento JSX que representa el componente completo
   */  return (
    <Card className={`text-center ${className}`}>
      {/* Encabezado del componente con título y subtítulo */}
      <CardHeader>
        <CardTitle className="text-lg">
          {title || t('appointments.qr.title')}
        </CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Imagen del código QR centrada con fondo blanco */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg border">
            <img 
              src={qrCode} 
              alt={t('appointments.qr.alt')}
              className="w-48 h-48 object-contain"
            />
          </div>
        </div>

        {/* Sección del código de confirmación con botón para copiar */}
        {confirmationCode && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t('appointments.qr.confirmationCode')}:
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="px-3 py-2 bg-muted rounded font-mono text-lg font-semibold">
                {confirmationCode}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="h-8 w-8 p-0"
                aria-label={t('appointments.qr.copyCode')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Botones de acción: descargar y compartir */}
        {showActions && (
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
              aria-label={t('appointments.qr.downloadAriaLabel')}
            >
              <Download className="h-4 w-4" />
              {t('appointments.qr.download')}
            </Button>            
            {/* Botón de compartir (solo si el navegador lo soporta) */}
            {'share' in navigator && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
                aria-label={t('appointments.qr.shareAriaLabel')}
              >
                <Share2 className="h-4 w-4" />
                {t('appointments.qr.share')}
              </Button>
            )}
          </div>
        )}

        {/* Instrucciones de uso para el usuario */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            {t('appointments.qr.instructions')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
