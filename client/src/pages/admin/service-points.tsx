import { useState, useCallback } from "react";
import { useServices } from "@/hooks/use-services";
import { useServicePoints } from "@/hooks/use-service-points";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Edit, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import type { ServicePoint } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

export default function ServicePoints() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { services } = useServices();
  const {
    servicePoints,
    servicePointServices,
    isLoading,
    createServicePoint,
    updateServicePoint,
    updateServicePointStatus,
    updateServicePointServices,
  } = useServicePoints();

  const [isOpen, setIsOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingServicePoint, setEditingServicePoint] = useState<ServicePoint | null>(null);
  const [selectedServicePoint, setSelectedServicePoint] = useState<ServicePoint | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (editingServicePoint) {
        await updateServicePoint({
          servicePointId: editingServicePoint.id,
          data: {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
          },
        });
        toast({
          title: t('servicePoints.pointUpdated'),
          description: t('servicePoints.editDescription'),
        });
      } else {
        await createServicePoint({
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          isActive: true,
        });
        toast({
          title: t('servicePoints.pointCreated'),
          description: t('servicePoints.addDescription'),
        });
      }
      setIsOpen(false);
      setEditingServicePoint(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Error creating service point',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServicesSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedServicePoint) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const selectedServices = services?.reduce<number[]>((acc, service) => {
        if (formData.get(`service-${service.id}`)) {
          acc.push(service.id);
        }
        return acc;
      }, []) || [];

      await updateServicePointServices({
        servicePointId: selectedServicePoint.id,
        serviceIds: selectedServices,
      });

      toast({
        title: t('servicePoints.pointUpdated'),
        description: t('common.success'),
      });

      setIsServicesOpen(false);
      setSelectedServicePoint(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Error updating services',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = useCallback((servicePoint: ServicePoint) => {
    setEditingServicePoint(servicePoint);
    setIsOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingServicePoint(null);
    }
  }, []);

  const handleServicesOpenChange = useCallback((open: boolean) => {
    setIsServicesOpen(open);
    if (!open) {
      setSelectedServicePoint(null);
    }
  }, []);

  const handleStatusChange = useCallback(async (servicePointId: number, isActive: boolean) => {
    try {
      await updateServicePointStatus({ servicePointId, isActive });
      toast({
        title: t('servicePoints.pointStatusUpdated'),
        description: isActive ? t('common.active') : t('common.inactive'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'Error updating status',
      });
    }
  }, [updateServicePointStatus, t, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold">{t('servicePoints.title')}</h2>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap" onClick={() => setEditingServicePoint(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('servicePoints.addServicePoint')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">            
            <DialogHeader>
              <DialogTitle>
                {editingServicePoint ? t('servicePoints.edit') : t('servicePoints.createServicePoint')}
              </DialogTitle>
              <DialogDescription>
                {editingServicePoint 
                  ? t('servicePoints.editDescription') 
                  : t('servicePoints.createWithAutoAssignment')
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('servicePoints.name')}</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingServicePoint?.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">{t('servicePoints.description')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingServicePoint?.description || ""}
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting
                  ? t(editingServicePoint ? 'servicePoints.updating' : 'servicePoints.creating')
                  : t(editingServicePoint ? 'servicePoints.updatePoint' : 'servicePoints.createPoint')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {servicePoints?.map((servicePoint) => (
          <Card
            key={servicePoint.id}
            className={`${!servicePoint.isActive ? "opacity-60" : ""} overflow-hidden`}
          >
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{servicePoint.name}</h3>
                    {servicePoint.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {servicePoint.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(servicePoint)}
                      className="h-8 w-8 shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Dialog open={isServicesOpen && selectedServicePoint?.id === servicePoint.id} onOpenChange={handleServicesOpenChange}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedServicePoint(servicePoint)}
                          className="h-8 w-8 shrink-0"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>{t('servicePoints.assignedServices')}</DialogTitle>
                          <DialogDescription>
                            {t('servicePoints.editDescription')}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleServicesSubmit} className="space-y-4">
                          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                            {services?.map((service) => {
                              const isAssigned = servicePointServices?.some(
                                sps => sps.servicePointId === servicePoint.id && sps.serviceId === service.id
                              );
                              return (
                                <div key={service.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`service-${service.id}`}
                                    name={`service-${service.id}`}
                                    defaultChecked={isAssigned}
                                  />
                                  <Label htmlFor={`service-${service.id}`} className="text-sm">
                                    {service.name}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                          <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? t('servicePoints.updating') : t('servicePoints.updatePoint')}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Label htmlFor={`active-${servicePoint.id}`} className="text-sm">
                  {servicePoint.isActive ? t('common.active') : t('common.inactive')}
                </Label>
                <Switch
                  id={`active-${servicePoint.id}`}
                  checked={servicePoint.isActive}
                  onCheckedChange={(checked) => handleStatusChange(servicePoint.id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}