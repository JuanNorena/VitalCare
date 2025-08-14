import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Service } from "@db/schema";
import { Clock, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ServiceSelectProps {
  services: Service[];
  selectedService: number | null;
  onSelectService: (serviceId: number) => void;
}

/**
 * ServiceSelect component for displaying and selecting available services.
 * Shows an empty state message when no services are available.
 * 
 * @param services - Array of available services to display
 * @param selectedService - ID of the currently selected service
 * @param onSelectService - Callback function when a service is selected
 */
export function ServiceSelect({ 
  services, 
  selectedService, 
  onSelectService 
}: ServiceSelectProps) {
  const { t } = useTranslation();

  // Show empty state when no services are available
  if (services.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />        
        <AlertDescription>
          {t('appointments.noServicesAvailable')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <RadioGroup
      value={selectedService?.toString()}
      onValueChange={(value) => onSelectService(parseInt(value))}
    >
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card 
            key={service.id}
            className={`cursor-pointer transition-colors hover:shadow-md ${
              selectedService === service.id 
                ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
                : "hover:border-primary/50"
            }`}
          >
            <CardContent className="p-4 sm:p-6">
              <RadioGroupItem
                value={service.id.toString()}
                id={`service-${service.id}`}
                className="sr-only"
              />
              <Label
                htmlFor={`service-${service.id}`}
                className="space-y-2 sm:space-y-3 cursor-pointer block"
              >
                <h3 className="font-semibold text-sm sm:text-base overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                >
                  {service.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground overflow-hidden"
                   style={{
                     display: '-webkit-box',
                     WebkitLineClamp: 3,
                     WebkitBoxOrient: 'vertical'
                   }}
                >
                  {service.description}
                </p>
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  {`${service.duration} ${t('common.minutes')}`}
                </div>
              </Label>
            </CardContent>
          </Card>
        ))}
      </div>
    </RadioGroup>
  );
}