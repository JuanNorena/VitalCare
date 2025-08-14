import { useState, useEffect } from "react";
import { BookingWizard } from "@/components/appointments/booking-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function BookAppointment() {
  const [, navigate] = useLocation();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<number | null>(null);
  const { t } = useTranslation();

  // Obtener el ID del servicio de la URL si está presente
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const serviceId = searchParams.get('serviceId');
    if (serviceId && !isNaN(parseInt(serviceId))) {
      setPreselectedServiceId(parseInt(serviceId));
      setIsWizardOpen(true);
    }
  }, []);

  const handleStartBooking = () => {
    setPreselectedServiceId(null);
    setIsWizardOpen(true);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setPreselectedServiceId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/")}
          className="flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back')}
        </Button>
        <h2 className="text-3xl font-bold">{t('appointments.book')}</h2>
      </div>

      {/* Opción principal para sacar cita */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            {t('appointments.bookAppointment')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('appointments.bookAppointmentDescription')}
          </p>
          <Button 
            onClick={handleStartBooking}
            className="w-full sm:w-auto"
            size="lg"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {t('appointments.startBooking')}
          </Button>
        </CardContent>
      </Card>

      <BookingWizard
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        preselectedServiceId={preselectedServiceId}
      />
    </div>
  );
}