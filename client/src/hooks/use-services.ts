import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Service, Schedule } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";

export function useServices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const response = await fetch('/api/services', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    }
  });

  const createServiceMutation = useMutation({
    mutationFn: async (service: Partial<Service>) => {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(service),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: t('services.serviceCreated'),
        description: t('services.addDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ serviceId, data }: { serviceId: number; data: Partial<Service> }) => {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: t('services.serviceUpdated'),
        description: t('services.editDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  const updateServiceStatusMutation = useMutation({
    mutationFn: async ({ serviceId, isActive }: { serviceId: number; isActive: boolean }) => {
      const response = await fetch(`/api/services/${serviceId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: t('services.serviceStatusUpdated'),
        description: variables.isActive 
          ? t('services.serviceActivated')
          : t('services.serviceDeactivated'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });
  const { data: schedules, isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
    queryFn: async () => {
      const response = await fetch('/api/schedules', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      return response.json();
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (schedule: Partial<Schedule>) => {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(schedule),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: t('schedule.scheduleCreated'),
        description: t('schedule.addDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, data }: { scheduleId: number; data: Partial<Schedule> }) => {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: t('schedule.scheduleUpdated'),
        description: t('schedule.editDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  const updateScheduleStatusMutation = useMutation({
    mutationFn: async ({ scheduleId, isActive }: { scheduleId: number; isActive: boolean }) => {
      const response = await fetch(`/api/schedules/${scheduleId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: t('schedule.scheduleStatusUpdated'),
        description: variables.isActive 
          ? t('schedule.scheduleActivated')
          : t('schedule.scheduleDeactivated'),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });    },
  });

  return {
    services,
    isLoading,
    createService: createServiceMutation.mutateAsync,
    updateService: updateServiceMutation.mutateAsync,
    updateServiceStatus: updateServiceStatusMutation.mutateAsync,
    schedules,
    schedulesLoading,
    createSchedule: createScheduleMutation.mutateAsync,
    updateSchedule: updateScheduleMutation.mutateAsync,
    updateScheduleStatus: updateScheduleStatusMutation.mutateAsync,
  };
}

// Hook para obtener un servicio específico con su formulario
export function useServiceWithForm(serviceId: number | null) {
  return useQuery({
    queryKey: [`/api/services/${serviceId}`],
    queryFn: async () => {
      if (!serviceId) return null;
      const response = await apiRequest('GET', `/api/services/${serviceId}`);
      return response.json();
    },
    enabled: !!serviceId,
  });
}