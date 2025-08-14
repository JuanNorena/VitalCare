import { useState, useRef } from "react";
import { useAppointments } from "@/hooks/use-appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, QrCode, Hash, User, Calendar, Clock, AlertCircle, Camera, Upload } from "lucide-react";
import { format } from "date-fns";
import jsQR from "jsqr";
import { es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Componente principal para realizar check-in de citas médicas.
 * 
 * Este componente permite a los usuarios realizar check-in de sus citas utilizando:
 * - Código QR (escaneado o subido como imagen)
 * - Código de confirmación alfanumérico
 * 
 * Una vez completado el check-in, muestra la información detallada de la cita
 * y permite realizar un nuevo check-in para otra cita.
 * 
 * @component
 * @example
 * ```tsx
 * // Uso básico del componente
 * <CheckIn />
 * 
 * // Se renderiza automáticamente en la ruta /appointments/checkin
 * ```
 * 
 * @returns {JSX.Element} Componente de check-in con formulario y resultado
 * 
 * @see {@link useAppointments} Para la gestión de citas
 */
export default function CheckIn() {
  const { checkinAppointment } = useAppointments();
  const { t } = useTranslation();
    // Estados del componente
  const [qrCode, setQrCode] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedInAppointment, setCheckedInAppointment] = useState<any>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Maneja el envío del formulario de check-in.
   * 
   * Valida que se haya proporcionado al menos un código QR o código de confirmación,
   * luego intenta realizar el check-in de la cita correspondiente.
   * 
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - Evento del formulario
   * @returns {Promise<void>} Promesa que se resuelve cuando se completa el check-in
   * @throws {Error} Si ocurre un error durante el proceso de check-in
   * 
   * @example
   * ```tsx
   * <form onSubmit={handleSubmit}>
   *   // Campos del formulario
   * </form>
   * ```
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      if (!qrCode && !confirmationCode) {
      setError(t("checkin.qrCodeOrConfirmationRequired"));
      return;
    }setIsSubmitting(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const result = await checkinAppointment({
        qrCode: qrCode || undefined,
        confirmationCode: confirmationCode || undefined
      });
      
      setCheckedInAppointment(result);
      setQrCode("");
      setConfirmationCode("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al realizar check-in");
    } finally {
      setIsSubmitting(false);    }
  };    /**
   * Maneja el cambio en el campo de código QR.
   * Si el usuario pega un JSON válido con confirmationCode, lo extrae automáticamente.
   */
  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQrCode(value);
    setError(""); // Limpiar errores previos
    setSuccessMessage(""); // Limpiar mensajes de éxito previos
    
    // Intentar parsear como JSON para extraer confirmationCode
    if (value.trim().startsWith('{') && value.trim().endsWith('}')) {
      try {
        const qrData = JSON.parse(value);
        console.log('📋 Datos del QR parseados desde input:', qrData);
        
        if (qrData && typeof qrData === 'object' && qrData.confirmationCode) {
          setConfirmationCode(qrData.confirmationCode);
          setSuccessMessage(`Código de confirmación extraído automáticamente: ${qrData.confirmationCode}`);
          console.log('✅ Código de confirmación extraído del QR pegado:', qrData.confirmationCode);
        }
      } catch (jsonError) {
        // Si no es un JSON válido, simplemente continuar
        console.log('ℹ️ El texto no es un JSON válido');
      }
    }
  };

  /**
   * Reinicia el formulario y el estado del componente.
   * 
   * Limpia todos los campos del formulario y resetea el estado para permitir
   * realizar un nuevo check-in después de completar uno exitosamente.
   * 
   * @function handleReset
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={handleReset}>Nuevo Check-In</Button>
   * ```
   */  const handleReset = () => {
    setCheckedInAppointment(null);
    setError("");
    setSuccessMessage("");
    setQrCode("");
    setConfirmationCode("");  };

  /**
   * Maneja la subida de archivos de imagen para códigos QR.
   * 
   * Procesa archivos de imagen subidos por el usuario que contengan códigos QR.
   * Actualmente muestra un mensaje instructivo ya que requiere integración
   * con una librería de decodificación de QR como jsQR.
   * 
   * @function handleFileUpload
   * @param {React.ChangeEvent<HTMLInputElement>} event - Evento de cambio del input de archivo
   * @returns {void}
   * 
   * @todo Integrar librería jsQR para decodificar códigos QR de imágenes
   * @todo Agregar validación de tipos de archivo soportados
   * @todo Implementar compresión de imágenes grandes
   * 
   * @example
   * ```tsx
   * <input
   *   type="file"
   *   accept="image/*"
   *   onChange={handleFileUpload}
   * />
   * ```
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError(t("checkin.invalidFileType"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Crear una imagen para procesar con jsQR
      const img = new Image();
      img.onload = () => {
        try {
          // Crear un canvas para extraer los datos de la imagen
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
            if (!ctx) {
            setError(t("checkin.imageProcessingError"));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Obtener los datos de píxeles de la imagen
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Usar jsQR para leer el código QR
          const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
            // Si se encontró un código QR, extraer el contenido
            const qrContent = code.data;
            setQrCode(qrContent);
            setError("");
            
            // Intentar parsear el contenido como JSON para extraer el confirmationCode
            try {
              const qrData = JSON.parse(qrContent);
                if (qrData && typeof qrData === 'object' && qrData.confirmationCode) {
                // Si el QR contiene un JSON con confirmationCode, auto-completar el campo
                setConfirmationCode(qrData.confirmationCode);
                setSuccessMessage(`Código de confirmación extraído automáticamente: ${qrData.confirmationCode}`);
                
                // Mostrar mensaje de éxito al usuario
                setError("");
                // Opcional: podrías mostrar un mensaje de éxito en lugar de error
              } else {
              }
            } catch (jsonError) {
              // Si no es un JSON válido, simplemente continuar
              console.log('ℹ️ El contenido del QR no es un JSON válido:', qrContent);
            }
          } else {
            setError("No se pudo leer el código QR de la imagen. Asegúrese de que la imagen sea clara y contenga un código QR válido.");
          }
        } catch (error) {
          setError("Error al procesar la imagen. Intente con otra imagen.");
        }
      };
      
      img.onerror = () => {
        setError("Error al cargar la imagen. Intente con otro archivo.");
      };
      
      img.src = result;
    };
    
    reader.onerror = () => {
      setError("Error al leer el archivo. Intente nuevamente.");
    };
    
    reader.readAsDataURL(file);
  };

  /**
   * Activa el selector de archivos oculto.
   * 
   * Función auxiliar que simula un clic en el input de archivo oculto
   * para proporcionar una mejor experiencia de usuario con un botón personalizado.
   * 
   * @function triggerFileUpload
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={triggerFileUpload}>
   *   <Upload className="h-4 w-4" />
   *   Subir Imagen QR
   * </Button>
   * ```
   */
  const triggerFileUpload = () => {
    fileInputRef.current?.click();  };

  /**
   * Renderiza la interfaz de check-in con las siguientes secciones:
   * 
   * **Cuando no hay check-in completado:**
   * - Formulario de check-in con campos para QR y código de confirmación
   * - Funcionalidad de subida de archivos para códigos QR
   * - Panel de instrucciones con guía paso a paso
   * - Información sobre estados de citas
   * 
   * **Cuando el check-in está completado:**
   * - Tarjeta de confirmación con información detallada de la cita
   * - Datos del usuario, servicio, fechas y código de confirmación
   * - Botón para realizar un nuevo check-in
   * 
   * @returns {JSX.Element} Elemento JSX que representa la interfaz completa de check-in
   */  return (
    <div className="max-w-4xl mx-auto space-y-6">      {/* Encabezado principal con título y descripción */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t("checkin.title")}</h1>
        <p className="text-muted-foreground">
          {t("checkin.description")}
        </p>
      </div>

      {!checkedInAppointment ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sección del formulario de check-in */}
          <Card>            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {t("checkin.checkInCard")}
              </CardTitle>
            </CardHeader>
            <CardContent>              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Alerta de error si existe */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {/* Alerta de éxito si existe */}
                {successMessage && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                  </Alert>
                )}                

                {/* Campo para código QR con opción de subir archivo */}                
                <div className="space-y-2">
                  <Label htmlFor="qrCode" className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    {t("checkin.qrCode")}
                  </Label>
                  <div className="space-y-2">                    
                    <Input
                      id="qrCode"
                      type="text"
                      placeholder={t("checkin.qrCodePlaceholder")}
                      value={qrCode}
                      onChange={handleQrCodeChange}
                      disabled={isSubmitting}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={triggerFileUpload}
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {t("checkin.uploadQrImage")}
                      </Button>
                    </div>
                    {/* Input de archivo oculto */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>                {/* Separador visual entre opciones */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-muted"></div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("checkin.or")}</span>
                  <div className="flex-1 border-t border-muted"></div>
                </div>

                {/* Campo para código de confirmación */}
                <div className="space-y-2">
                  <Label htmlFor="confirmationCode" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    {t("checkin.confirmationCode")}
                  </Label>
                  <Input
                    id="confirmationCode"
                    type="text"
                    placeholder={t("checkin.confirmationCodePlaceholder")}
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Botón de envío del formulario */}                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || (!qrCode && !confirmationCode)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("checkin.processingCheckin")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {t("checkin.performCheckin")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>          {/* Panel de instrucciones y ayuda */}         
          <Card>
            <CardHeader>
              <CardTitle>{t("checkin.instructions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pasos numerados para el check-in */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    1
                  </div>                  
                  <div>
                    <p className="font-medium">{t("checkin.qrCode")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("checkin.qrCodeInstruction")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">{t("checkin.confirmationCode")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("checkin.confirmationCodeInstruction")}
                    </p>
                  </div>
                </div>                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">{t("checkin.verification", { defaultValue: "Verificación" })}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("checkin.verificationInstruction")}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />              {/* Información sobre estados de citas */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">{t("checkin.appointmentStates")}</h4>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {t("checkin.scheduled")}
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {t("checkin.completed")}
                  </Badge>
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    {t("checkin.cancelled")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("checkin.onlyScheduledCheckin")}
                </p>
              </div>
            </CardContent>
          </Card>       
          </div>
      ) : (
        /* Tarjeta de resultado exitoso del check-in */
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center bg-green-50 border-b">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>            
            <CardTitle className="text-green-800">
              {t("checkin.checkinSuccessful")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">            {/* Información detallada de la cita procesada */}
            <div className="grid gap-4">
              {/* Información del usuario */}              
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="text-muted-foreground font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("checkin.user")}
                </span>
                <span className="font-semibold">
                  {checkedInAppointment.user?.username || 'N/A'}
                </span>
              </div>

              {/* Información del servicio */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="text-muted-foreground font-medium">
                  {t("checkin.service")}
                </span>
                <Badge variant="secondary" className="text-sm font-semibold">
                  {checkedInAppointment.service?.name || 'N/A'}
                </Badge>
              </div>

              {/* Fecha programada de la cita */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="text-muted-foreground font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("checkin.scheduledDate")}
                </span>
                <span className="font-semibold">
                  {format(new Date(checkedInAppointment.scheduledAt), 'PPP, h:mm a', { locale: es })}
                </span>
              </div>

              {/* Hora del check-in realizado */}
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-700 font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("checkin.checkinTime")}
                </span>
                <span className="font-semibold text-green-800">
                  {format(new Date(checkedInAppointment.attendedAt), 'PPP, h:mm a', { locale: es })}
                </span>
              </div>

              {/* Código de confirmación de la cita */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="text-muted-foreground font-medium">
                  {t("checkin.confirmationCodeLabel")}
                </span>
                <code className="px-2 py-1 bg-muted rounded font-mono font-semibold">
                  {checkedInAppointment.confirmationCode}
                </code>
              </div>

              {/* Estado actual de la cita */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="text-muted-foreground font-medium">
                  {t("checkin.status")}
                </span>
                <Badge className="bg-green-100 text-green-800">
                  {t("checkin.completed")}
                </Badge>
              </div>
            </div>

            {/* Botón para realizar nuevo check-in */}            
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleReset}
                className="flex-1"
                variant="outline"
              >
                {t("checkin.newCheckin")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
