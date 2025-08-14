import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ServicePoint, ServicePointService, ServicePointWithBranch } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface CreateServicePointData {
  name: string;
  description?: string;
  branchId?: number;
  isActive: boolean;
}

interface UpdateServicePointData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Hook para obtener todos los puntos de atención del sistema
export function useAllServicePoints() {
  const { data: allServicePoints, isLoading } = useQuery<ServicePointWithBranch[]>({
    queryKey: ['/api/service-points/all'],
    queryFn: async () => {
      const response = await fetch('/api/service-points/all', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch all service points');
      }
      return response.json();
    }
  });

  return {
    allServicePoints,
    isLoading
  };
}

// Hook principal para puntos de atención de una sede específica
export function useServicePoints(branchId?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();  const { data: servicePoints, isLoading } = useQuery<ServicePoint[] | ServicePointWithBranch[]>({
    queryKey: branchId ? ['/api/service-points', branchId] : ['/api/service-points/all'],
    queryFn: async () => {
      const url = branchId 
        ? `/api/branches/${branchId}/service-points` 
        : '/api/service-points/all';
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch service points');
      }
      return response.json();
    }
  });

  const { data: servicePointServices, isLoading: servicesLoading } = useQuery<ServicePointService[]>({
    queryKey: ['/api/service-point-services'],
    queryFn: async () => {
      const response = await fetch('/api/service-point-services', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch service point services');
      }
      return response.json();
    }
  });

  const createServicePoint = useMutation({
    mutationFn: async (data: CreateServicePointData) => {
      const response = await fetch('/api/service-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage: string;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || text;
        } catch {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
      toast({
        title: t('servicePoints.pointCreated'),
        description: t('servicePoints.addDescription'),
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

  const updateServicePoint = useMutation({
    mutationFn: async ({ servicePointId, data }: { servicePointId: number; data: UpdateServicePointData }) => {
      const response = await fetch(`/api/service-points/${servicePointId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage: string;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || text;
        } catch {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
      toast({
        title: t('servicePoints.pointUpdated'),
        description: t('servicePoints.editDescription'),
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

  const updateServicePointStatus = useMutation({
    mutationFn: async ({ servicePointId, isActive }: { servicePointId: number; isActive: boolean }) => {
      const response = await fetch(`/api/service-points/${servicePointId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage: string;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || text;
        } catch {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
      toast({
        title: t('servicePoints.pointStatusUpdated'),
        description: variables.isActive 
          ? t('servicePoints.pointActivated')
          : t('servicePoints.pointDeactivated'),
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

  const updateServicePointServices = useMutation({
    mutationFn: async ({ servicePointId, serviceIds }: { servicePointId: number; serviceIds: number[] }) => {
      const response = await fetch(`/api/service-points/${servicePointId}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ serviceIds }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage: string;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || text;
        } catch {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-point-services'] });
      toast({
        title: t('servicePoints.pointUpdated'),
        description: t('common.success'),
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

  const reassignServicePoint = useMutation({
    mutationFn: async ({ servicePointId, newBranchId }: { servicePointId: number; newBranchId: number }) => {
      const response = await fetch(`/api/service-points/${servicePointId}/reassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ branchId: newBranchId }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage: string;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || text;
        } catch {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-points/all'] });
      toast({
        title: t('common.success'),
        description: t('servicePoints.reassignSuccess'),
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

  const unassignServicePoint = useMutation({
    mutationFn: async ({ servicePointId }: { servicePointId: number }) => {
      const response = await fetch(`/api/service-points/${servicePointId}/unassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage: string;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || text;
        } catch {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-points/all'] });
      toast({
        title: t('common.success'),
        description: t('servicePoints.unassignSuccess'),
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

  return {
    servicePoints,
    isLoading,
    createServicePoint: createServicePoint.mutateAsync,
    updateServicePoint: updateServicePoint.mutateAsync,
    updateServicePointStatus: updateServicePointStatus.mutateAsync,
    servicePointServices,
    servicesLoading,
    updateServicePointServices: updateServicePointServices.mutateAsync,
    reassignServicePoint: reassignServicePoint.mutateAsync,
    unassignServicePoint: unassignServicePoint.mutateAsync,
  };
}