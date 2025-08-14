import { useState, useEffect } from "react";
import { useAppointments } from "@/hooks/use-appointments";
import { useServicePoints } from "@/hooks/use-service-points";
import { useSurveys } from "@/hooks/use-surveys";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Calendar, QrCode } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { SurveyQRModal } from "@/components/surveys/survey-qr-modal";

export default function QueueManage() {
    const { appointments, queue, addToQueue, updateQueueStatus, checkedInAppointments, checkedInLoading, transferAppointment } = useAppointments();
    const { servicePoints, servicePointServices } = useServicePoints();
    const { createSurvey, isCreatingSurvey } = useSurveys();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [selectedQueueEntry, setSelectedQueueEntry] = useState<any>(null);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const [surveyData, setSurveyData] = useState<any>(null);
    const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    // Forzar actualización de datos cuando se carga la página
    useEffect(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/checked-in'] });
    }, [queryClient]);

    const handleAddToQueue = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);      const formData = new FormData(e.currentTarget);
      const appointmentId = parseInt(formData.get("appointmentId") as string);
      const servicePointId = parseInt(formData.get("servicePointId") as string);

      console.log('📝 Form data extracted:', { appointmentId, servicePointId });

      if (!appointmentId || !servicePointId) {
        console.log('❌ Validation failed: missing appointmentId or servicePointId');
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: t('queue.selectServicePoint'),
        });
        setIsSubmitting(false);
        return;
      }try {
        await addToQueue({ appointmentId, servicePointId });
        
        // Forzar actualización de datos después de agregar a cola
        queryClient.invalidateQueries({ queryKey: ['/api/queue'] });
        queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/appointments/checked-in'] });
        
        setIsOpen(false);
        setSelectedAppointmentId("");
        toast({
          title: t('common.success'),
          description: t('queue.addToQueueSuccess'),
        });
      }catch (error) {
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: error instanceof Error ? error.message : t('queue.addToQueueError'),
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleStatusUpdate = async (queueId: number, newStatus: string) => {
      try {
        await updateQueueStatus({ queueId, status: newStatus });
        
        // Si el estado es "complete", generar encuesta automáticamente
        if (newStatus === "complete") {
          const queueEntry = queue?.find(q => q.id === queueId);
          if (queueEntry) {
            try {
              const response = await fetch('/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                  queueId: queueEntry.id,
                  appointmentId: queueEntry.appointmentId 
                }),
              });

              if (response.ok) {
                const surveyResult = await response.json();
                setSurveyData(surveyResult);
                setIsSurveyModalOpen(true);
              }
            } catch (error) {
              console.error('Error creating survey:', error);
              // No mostrar error al usuario para no interrumpir el flujo principal
            }
          }
        }
        
        toast({
          title: t('common.success'),
          description: t('queue.statusUpdateSuccess'),
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: error instanceof Error ? error.message : t('queue.statusUpdateError'),
        });
      }
    };

    const handleTransferAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsTransferring(true);

      const formData = new FormData(e.currentTarget);
      const servicePointId = parseInt(formData.get("servicePointId") as string);

      if (!servicePointId || !selectedQueueEntry) {
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: t('queue.selectServicePoint'),
        });
        setIsTransferring(false);
        return;
      }

      try {
        await transferAppointment({ 
          queueId: selectedQueueEntry.id, 
          servicePointId 
        });
        
        setIsTransferOpen(false);
        setSelectedQueueEntry(null);
      } catch (error) {
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: error instanceof Error ? error.message : t('queue.transferError'),
        });
      } finally {
        setIsTransferring(false);
      }
    };

    const handleGenerateSurvey = async (queueEntry: any) => {
      setIsLoadingSurvey(true);
      setSurveyData(null); // Limpiar datos anteriores
      setIsSurveyModalOpen(true); // Abrir modal inmediatamente con estado de carga
      
      try {
        // Primero verificar si ya existe una encuesta para esta cola
        const checkResponse = await fetch(`/api/surveys/queue/${queueEntry.id}`, {
          credentials: 'include',
        });

        if (checkResponse.ok) {
          // Ya existe una encuesta, mostrarla
          const existingSurvey = await checkResponse.json();
          console.log('Existing survey found:', existingSurvey);
          setSurveyData({
            id: existingSurvey.id,
            token: existingSurvey.token,
            qrCode: existingSurvey.qrCode
          });
          
          toast({
            title: t('surveys.surveyFound'),
            description: t('surveys.surveyFoundDescription'),
          });
          return;
        }

        // No existe, crear nueva encuesta
        const response = await fetch('/api/surveys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            queueId: queueEntry.id,
            appointmentId: queueEntry.appointmentId 
          }),
        });

        if (response.ok) {
          const surveyResult = await response.json();
          console.log('New survey created:', surveyResult);
          setSurveyData({
            id: surveyResult.id,
            token: surveyResult.surveyToken || surveyResult.token,
            qrCode: surveyResult.qrCode
          });
          
          toast({
            title: t('surveys.surveyGenerated'),
            description: t('surveys.surveyGeneratedDescription'),
          });
        } else if (response.status === 409) {
          // Ya existe una encuesta, obtener los datos de la respuesta del error
          const errorData = await response.json();
          console.log('Survey already exists:', errorData);
          setSurveyData({
            id: errorData.id,
            token: errorData.surveyToken || errorData.token,
            qrCode: errorData.qrCode
          });
          
          toast({
            title: t('surveys.surveyFound'),
            description: t('surveys.surveyFoundDescription'),
          });
        } else {
          throw new Error('Failed to create survey');
        }
      } catch (error) {
        console.error('Error generating survey:', error);
        setIsSurveyModalOpen(false); // Cerrar modal en caso de error
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: error instanceof Error ? error.message : 'Error al generar la encuesta',
        });
      } finally {
        setIsLoadingSurvey(false);
      }
    };

    const openTransferDialog = (queueEntry: any) => {
      setSelectedQueueEntry(queueEntry);
      setIsTransferOpen(true);
    };

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Usar las citas que han hecho check-in en lugar de filtrar por estado
    const todaysAppointments = checkedInAppointments || [];

    const getAvailableServicePoints = (appointmentId: string) => {
      const appointment = appointments?.find(apt => apt.id === parseInt(appointmentId));
      if (!appointment) return [];

      return servicePoints?.filter(sp => {
        if (!sp.isActive) return false;

        return servicePointServices?.some(
          sps => sps.servicePointId === sp.id && 
                sps.serviceId === appointment.serviceId &&
                sps.isActive
        );
      }) || [];
    };

    const getAppointmentDetails = (appointmentId: number) => {
      return appointments?.find(a => a.id === appointmentId);
    };

    const getAvailableServicePointsForTransfer = (queueEntry: any) => {
      const appointment = getAppointmentDetails(queueEntry.appointmentId);
      if (!appointment) return [];

      return servicePoints?.filter(sp => {
        // Excluir el punto de atención actual
        if (sp.id === appointment.servicePointId) return false;
        
        if (!sp.isActive) return false;

        return servicePointServices?.some(
          sps => sps.servicePointId === sp.id && 
                sps.serviceId === appointment.serviceId &&
                sps.isActive
        );
      }) || [];
    };

    const availableServicePoints = getAvailableServicePoints(selectedAppointmentId);

    const waitingQueue = queue?.filter(q => q.status === "waiting") || [];
    const servingQueue = queue?.filter(q => q.status === "serving") || [];
    const completeQueue = queue?.filter(q => q.status === "complete") || [];

    const getServicePointName = (appointmentId: number) => {
      const appointment = getAppointmentDetails(appointmentId);
      return servicePoints?.find(sp => sp.id === appointment?.servicePointId)?.name || `Punto ${appointment?.servicePointId || 'N/A'}`;
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold">{t('queue.manage')}</h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">{t('queue.addToQueue')}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('queue.addToQueue')}</DialogTitle>
                <DialogDescription>
                  {t('queue.selectAppointment')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddToQueue} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appointmentId">{t('appointments.selectService')}</Label>
                  <Select 
                    name="appointmentId" 
                    value={selectedAppointmentId}
                    onValueChange={(value) => setSelectedAppointmentId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('queue.selectAppointment')} />
                    </SelectTrigger>                    <SelectContent>
                      {todaysAppointments && todaysAppointments.length > 0 ? (                        todaysAppointments.map((apt: any) => (
                          <SelectItem key={apt.id} value={apt.id.toString()}>
                            #{apt.confirmationCode} - {apt.userName} - {apt.serviceName}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1 text-sm text-muted-foreground">
                          {t('queue.noAvailableAppointments')}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="servicePointId">{t('queue.servicePoint')}</Label>
                  <Select name="servicePointId">
                    <SelectTrigger>
                      <SelectValue placeholder={t('queue.selectServicePoint')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServicePoints.map((sp) => (
                        <SelectItem key={sp.id} value={sp.id.toString()}>
                          {sp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('queue.addingToQueue')}
                    </>
                  ) : (
                    t('queue.addToQueue')
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('queue.queueStatus')}</CardTitle>
          </CardHeader>
          <CardContent>            
            <Tabs defaultValue="waiting" className="space-y-4">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="waiting" className="text-xs sm:text-sm">
                  {t('queue.waiting')} ({waitingQueue.length})
                </TabsTrigger>
                <TabsTrigger value="serving" className="text-xs sm:text-sm">
                  {t('queue.serving')} ({servingQueue.length})
                </TabsTrigger>
                <TabsTrigger value="complete" className="text-xs sm:text-sm">
                  {t('queue.complete')} ({completeQueue.length})
                </TabsTrigger>              
                </TabsList>

              <TabsContent value="waiting">                
                <ScrollArea className="h-[400px]">
                  {waitingQueue.map((entry) => {
                    const appointment = getAppointmentDetails(entry.appointmentId);
                    const servicePointName = getServicePointName(entry.appointmentId);
                    return (
                      <div
                        key={entry.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b gap-4"
                      >
                        <div className="space-y-2">
                          <div className="font-medium break-words">
                            {t('queue.appointmentNumber')}{appointment?.confirmationCode}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="break-words">
                              {appointment && format(new Date(appointment.scheduledAt), "PPP, h:mm a", { locale: es })}
                            </span>
                          </div>
                          <div className="text-sm font-medium break-words">
                            {t('queue.servicePoint')}: {servicePointName}
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            onClick={() => openTransferDialog(entry)}
                            className="flex-1 sm:flex-none"
                          >
                            {t('queue.transfer')}
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(entry.id, "serving")}
                            className="flex-1 sm:flex-none"
                          >
                            {t('queue.startService')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {waitingQueue.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      {t('queue.noWaitingCustomers')}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="serving">                
                <ScrollArea className="h-[400px]">
                  {servingQueue.map((entry) => {
                    const appointment = getAppointmentDetails(entry.appointmentId);
                    const servicePointName = getServicePointName(entry.appointmentId);
                    return (
                      <div
                        key={entry.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b gap-4"
                      >
                        <div className="space-y-2">
                          <div className="font-medium break-words">
                            {t('queue.appointmentNumber')}{appointment?.confirmationCode}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="break-words">
                              {appointment && format(new Date(appointment.scheduledAt), "PPP, h:mm a", { locale: es })}
                            </span>
                          </div>
                          <div className="text-sm font-medium break-words">
                            {t('queue.servicePoint')}: {servicePointName}
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            onClick={() => openTransferDialog(entry)}
                            className="flex-1 sm:flex-none"
                          >
                            {t('queue.transfer')}
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(entry.id, "complete")}
                            className="flex-1 sm:flex-none"
                          >
                            {t('queue.completeService')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {servingQueue.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      {t('queue.noCustomersInService')}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="complete">                
                <ScrollArea className="h-[400px]">
                  {completeQueue.map((entry) => {
                    const appointment = getAppointmentDetails(entry.appointmentId);
                    const servicePointName = getServicePointName(entry.appointmentId);
                    return (
                      <div
                        key={entry.id}
                        className="flex flex-col sm:flex-row sm:items-center p-4 border-b gap-4"
                      >
                        <div className="space-y-2">
                          <div className="font-medium break-words">
                            {t('queue.appointmentNumber')}{appointment?.confirmationCode}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="break-words">
                              {appointment && format(new Date(appointment.scheduledAt), "PPP, h:mm a", { locale: es })}
                            </span>
                          </div>
                          <div className="text-sm font-medium break-words">
                            {t('queue.servicePoint')}: {servicePointName}
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            onClick={() => handleGenerateSurvey(entry)}
                            className="flex-1 sm:flex-none"
                            disabled={isCreatingSurvey}
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            {t('surveys.generateSurvey')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {completeQueue.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      {t('queue.noCompletedCustomers')}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Diálogo de transferencia */}
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('queue.transferAppointment')}</DialogTitle>
              <DialogDescription>
                {t('queue.transferDescription')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTransferAppointment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="servicePointId">{t('queue.selectNewServicePoint')}</Label>
                <Select name="servicePointId">
                  <SelectTrigger>
                    <SelectValue placeholder={t('queue.selectNewServicePoint')} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedQueueEntry && getAvailableServicePointsForTransfer(selectedQueueEntry).length > 0 ? (
                      getAvailableServicePointsForTransfer(selectedQueueEntry).map((sp) => (
                        <SelectItem key={sp.id} value={sp.id.toString()}>
                          {sp.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        {t('queue.noAvailableServicePointsForTransfer')}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsTransferOpen(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isTransferring || !selectedQueueEntry || getAvailableServicePointsForTransfer(selectedQueueEntry || {}).length === 0} 
                  className="flex-1"
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('queue.transferring')}
                    </>
                  ) : (
                    t('queue.transfer')
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Encuesta QR */}
        <SurveyQRModal
          isOpen={isSurveyModalOpen}
          onClose={() => {
            setIsSurveyModalOpen(false);
            setSurveyData(null);
            setIsLoadingSurvey(false);
          }}
          surveyData={surveyData}
          isLoading={isLoadingSurvey}
        />
      </div>
    );
}