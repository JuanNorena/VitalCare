import { useState, useCallback } from "react";
import { useServices } from "@/hooks/use-services";
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
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Loader2, Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import type { Schedule } from "@db/schema";

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export default function Schedule() {
  const { services, schedules, isLoading, createSchedule, updateSchedule, updateScheduleStatus } = useServices();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    try {
      if (editingSchedule) {
        await updateSchedule({
          scheduleId: editingSchedule.id,
          data: {
            serviceId: parseInt(formData.get("serviceId") as string),
            dayOfWeek: parseInt(formData.get("dayOfWeek") as string),
            startTime: formData.get("startTime") as string,
            endTime: formData.get("endTime") as string,
          },
        });
      } else {
        await createSchedule({
          serviceId: parseInt(formData.get("serviceId") as string),
          dayOfWeek: parseInt(formData.get("dayOfWeek") as string),
          startTime: formData.get("startTime") as string,
          endTime: formData.get("endTime") as string,
          isActive: true,
        });
      }
      setIsOpen(false);
      setEditingSchedule(null);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEdit = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingSchedule(null);
    }
  }, []);

  const handleAddClick = useCallback(() => {
    setEditingSchedule(null);
    setIsOpen(true);
  }, []);

  const handleStatusChange = useCallback(async (scheduleId: number, isActive: boolean) => {
    try {
      await updateScheduleStatus({ scheduleId, isActive });
    } catch (error) {
      console.error("Error updating schedule status:", error);
    }
  }, [updateScheduleStatus]);

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
        <h2 className="text-3xl font-bold">{t('schedule.title')}</h2>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap" onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              {t('schedule.addSchedule')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? t('schedule.editSchedule') : t('schedule.addSchedule')}
              </DialogTitle>
              <DialogDescription>
                {editingSchedule ? t('schedule.editDescription') : t('schedule.addDescription')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="serviceId">{t('schedule.selectService')}</Label>
                <Select
                  name="serviceId"
                  defaultValue={editingSchedule?.serviceId?.toString()}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('schedule.selectService')} />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dayOfWeek">{t('schedule.selectDay')}</Label>
                <Select
                  name="dayOfWeek"
                  defaultValue={editingSchedule?.dayOfWeek?.toString()}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('schedule.selectDay')} />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {t(`schedule.days.${day}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">{t('schedule.startTime')}</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    defaultValue={editingSchedule?.startTime}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">{t('schedule.endTime')}</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    defaultValue={editingSchedule?.endTime}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting
                  ? (editingSchedule ? t('schedule.updating') : t('schedule.creating'))
                  : (editingSchedule ? t('schedule.updateSchedule') : t('schedule.createSchedule'))}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {schedules?.map((schedule) => {
          const service = services?.find(s => s.id === schedule.serviceId);
          return (
            <Card
              key={schedule.id}
              className={`${!schedule.isActive ? "opacity-60" : ""} overflow-hidden`}
            >
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold truncate">{service?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(`schedule.days.${DAYS[schedule.dayOfWeek]}`)}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>
                          {format(new Date(`1970-01-01T${schedule.startTime}`), 'h:mm a')}
                          {" - "}
                          {format(new Date(`1970-01-01T${schedule.endTime}`), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(schedule)}
                      className="h-8 w-8 shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Label htmlFor={`active-${schedule.id}`} className="text-sm">
                    {schedule.isActive ? t('common.active') : t('common.inactive')}
                  </Label>
                  <Switch
                    id={`active-${schedule.id}`}
                    checked={schedule.isActive}
                    onCheckedChange={(checked) => handleStatusChange(schedule.id, checked)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}