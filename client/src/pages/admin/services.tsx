import { useState, useCallback } from "react";
import { useServices } from "@/hooks/use-services";
import { useForms } from "@/hooks/use-forms";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Loader2, Plus, Edit, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

type ServiceWithForm = {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  isActive: boolean;
  createdAt: Date;
  formId: number | null;
  form: {
    id: number | null;
    name: string | null;
    description: string | null;
    isActive: boolean | null;
  } | null;
};

export default function Services() {
  const { services, isLoading, createService, updateService, updateServiceStatus } = useServices();
  const { forms, isFormsLoading } = useForms();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<ServiceWithForm | null>(null);
  const { t } = useTranslation();  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const formIdValue = formData.get("formId") as string;
    
    try {
      if (editingService) {
        await updateService({
          serviceId: editingService.id,
          data: {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            duration: parseInt(formData.get("duration") as string),
            formId: formIdValue && formIdValue !== "none" ? parseInt(formIdValue) : null,
          },
        });
      } else {
        await createService({
          name: formData.get("name") as string,
          description: formData.get("description") as string,
          duration: parseInt(formData.get("duration") as string),
          formId: formIdValue && formIdValue !== "none" ? parseInt(formIdValue) : null,
          isActive: true,
        });
      }
      setIsOpen(false);
      setEditingService(null);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEdit = useCallback((service: ServiceWithForm) => {
    setEditingService(service);
    setIsOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingService(null);
    }
  }, []);

  const handleStatusChange = useCallback(async (serviceId: number, isActive: boolean) => {
    try {
      await updateServiceStatus({ serviceId, isActive });
    } catch (error) {
      console.error("Error updating service status:", error);
    }
  }, [updateServiceStatus]);

  const handleAddClick = useCallback(() => {
    setEditingService(null);
    setIsOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('services.title')}</h2>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap" onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              {t('services.addService')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? t('services.editService') : t('services.addService')}
              </DialogTitle>
              <DialogDescription>
                {editingService ? t('services.editDescription') : t('services.addDescription')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('services.serviceName')}</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingService?.name}
                  required 
                />
              </div>              
              <div>
                <Label htmlFor="description">{t('services.description')}</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  defaultValue={editingService?.description || ""}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="duration">{t('services.duration')}</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  defaultValue={editingService?.duration}
                  min="1"
                  step="1"
                  required
                />
              </div>              <div>
                <Label htmlFor="formId">{t('services.form')} ({t('common.optional')})</Label>
                <Select name="formId" defaultValue={editingService?.formId?.toString() || "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('services.selectForm')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('services.noForm')}</SelectItem>
                    {forms?.filter(form => form.isActive).map((form) => (
                      <SelectItem key={form.id} value={form.id.toString()}>
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          {form.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingService ? t('services.updating') : t('services.creating')}
                  </>
                ) : (
                  editingService ? t('services.updateService') : t('services.createService')
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services?.map((service) => (
          <Card 
            key={service.id}
            className={`${!service.isActive ? "opacity-60" : ""} overflow-hidden`}
          >
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{service.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(service as ServiceWithForm)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {service.description}
                </p>                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-4 w-4" />
                  {`${service.duration} ${t('common.minutes')}`}
                </div>                {(service as ServiceWithForm).form?.name && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="mr-1 h-4 w-4" />
                    <span className="truncate">{(service as ServiceWithForm).form?.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Label htmlFor={`active-${service.id}`} className="text-sm">
                  {service.isActive ? t('common.active') : t('common.inactive')}
                </Label>
                <Switch
                  id={`active-${service.id}`}
                  checked={service.isActive}
                  onCheckedChange={(checked) => handleStatusChange(service.id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}