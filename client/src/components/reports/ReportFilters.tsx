/**
 * @fileoverview Componente de filtros para reportes de tiempos de espera
 * 
 * Este componente proporciona una interfaz completa para filtrar reportes,
 * incluyendo selección de fechas, sedes, servicios y puntos de atención.
 * 
 * @version 1.0.0
 * @since 2025-01-30
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar, CalendarIcon, Filter, RotateCcw, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { WaitTimeReportFilters } from "@/types/reports";
import { useReportMetadata, useReportFiltersValidation } from "@/hooks/use-wait-time-reports";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// =========================================================================
// TIPOS E INTERFACES
// =========================================================================

/**
 * Props del componente ReportFilters
 */
interface ReportFiltersProps {
  /** Filtros actuales */
  filters: Partial<WaitTimeReportFilters>;
  /** Callback cuando los filtros cambian */
  onFiltersChange: (filters: WaitTimeReportFilters) => void;
  /** Si está cargando datos */
  isLoading?: boolean;
  /** Si mostrar filtros avanzados */
  showAdvancedFilters?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Filtros predefinidos para fechas
 */
interface DatePreset {
  label: string;
  startDate: Date;
  endDate: Date;
}

// =========================================================================
// COMPONENTE PRINCIPAL
// =========================================================================

/**
 * Componente de filtros para reportes de tiempos de espera
 * 
 * Proporciona una interfaz completa para configurar filtros de reportes,
 * incluyendo validación en tiempo real y presets de fechas comunes.
 * 
 * @component
 * @example
 * ```tsx
 * const [filters, setFilters] = useState<Partial<WaitTimeReportFilters>>({
 *   startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
 *   endDate: format(new Date(), 'yyyy-MM-dd')
 * });
 * 
 * <ReportFilters
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   showAdvancedFilters={true}
 * />
 * ```
 */
export function ReportFilters({
  filters,
  onFiltersChange,
  isLoading = false,
  showAdvancedFilters = true,
  className
}: ReportFiltersProps) {
  const { t } = useTranslation();
  const { data: metadata, isLoading: isLoadingMetadata } = useReportMetadata();
  const { isValid, errors } = useReportFiltersValidation(filters);

  // Estados locales
  const [localFilters, setLocalFilters] = useState<Partial<WaitTimeReportFilters>>(filters);
  const [showDatePresets, setShowDatePresets] = useState(false);

  // Sincronizar filtros locales cuando cambien los props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // =========================================================================
  // PRESETS DE FECHAS
  // =========================================================================

  const datePresets: DatePreset[] = [
    {
      label: t('reports.filters.presets.today'),
      startDate: new Date(),
      endDate: new Date()
    },
    {
      label: t('reports.filters.presets.yesterday'),
      startDate: subDays(new Date(), 1),
      endDate: subDays(new Date(), 1)
    },
    {
      label: t('reports.filters.presets.lastWeek'),
      startDate: subDays(new Date(), 7),
      endDate: new Date()
    },
    {
      label: t('reports.filters.presets.lastMonth'),
      startDate: subDays(new Date(), 30),
      endDate: new Date()
    },
    {
      label: t('reports.filters.presets.thisMonth'),
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    },
    {
      label: t('reports.filters.presets.lastThreeMonths'),
      startDate: subDays(new Date(), 90),
      endDate: new Date()
    }
  ];

  // =========================================================================
  // HANDLERS
  // =========================================================================

  /**
   * Aplica un preset de fecha
   */
  const handleDatePreset = (preset: DatePreset) => {
    const newFilters = {
      ...localFilters,
      startDate: format(preset.startDate, 'yyyy-MM-dd'),
      endDate: format(preset.endDate, 'yyyy-MM-dd')
    };
    setLocalFilters(newFilters);
    setShowDatePresets(false);
  };

  /**
   * Actualiza un filtro específico
   */
  const updateFilter = (key: keyof WaitTimeReportFilters, value: any) => {
    const newFilters = {
      ...localFilters,
      [key]: value === 'all' ? undefined : value
    };
    setLocalFilters(newFilters);
  };

  /**
   * Aplica los filtros
   */
  const handleApplyFilters = () => {
    if (isValid && localFilters.startDate && localFilters.endDate) {
      onFiltersChange(localFilters as WaitTimeReportFilters);
    }
  };

  /**
   * Resetea los filtros
   */
  const handleResetFilters = () => {
    const resetFilters = {
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    };
    setLocalFilters(resetFilters);
  };

  /**
   * Maneja cambios cuando se selecciona una sede
   */
  const handleBranchChange = (branchId: string) => {
    const newFilters = {
      ...localFilters,
      branchId: branchId === 'all' ? undefined : parseInt(branchId),
      serviceId: undefined, // Reset service when branch changes
      servicePointId: undefined // Reset service point when branch changes
    };
    setLocalFilters(newFilters);
  };

  /**
   * Maneja cambios cuando se selecciona un servicio
   */
  const handleServiceChange = (serviceId: string) => {
    const newFilters = {
      ...localFilters,
      serviceId: serviceId === 'all' ? undefined : parseInt(serviceId),
      servicePointId: undefined // Reset service point when service changes
    };
    setLocalFilters(newFilters);
  };

  // =========================================================================
  // FILTROS DE DATOS
  // =========================================================================

  // Filtrar servicios por sede seleccionada
  const filteredServices = metadata?.data.services.filter(service => 
    !localFilters.branchId || 
    metadata.data.servicePoints.some(sp => 
      sp.branchId === localFilters.branchId && 
      metadata.data.services.find(s => s.id === service.id)
    )
  ) || [];

  // Filtrar puntos de atención por sede y servicio seleccionados
  const filteredServicePoints = metadata?.data.servicePoints.filter(sp => {
    if (localFilters.branchId && sp.branchId !== localFilters.branchId) {
      return false;
    }
    // TODO: Agregar filtro por servicio cuando tengamos la relación en los datos
    return true;
  }) || [];

  // =========================================================================
  // RENDERIZADO
  // =========================================================================

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t('reports.filters.title')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filtros de Fecha */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t('reports.filters.dateRange')}
            </Label>
            <Popover open={showDatePresets} onOpenChange={setShowDatePresets}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  {t('reports.filters.presets.title')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="space-y-1">
                  {datePresets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleDatePreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                {t('reports.filters.startDate')}
              </Label>
              <Input
                id="startDate"
                type="date"
                value={localFilters.startDate || ''}
                onChange={(e) => updateFilter('startDate', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">
                {t('reports.filters.endDate')}
              </Label>
              <Input
                id="endDate"
                type="date"
                value={localFilters.endDate || ''}
                onChange={(e) => updateFilter('endDate', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Filtros Avanzados */}
        {showAdvancedFilters && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                {t('reports.filters.advanced')}
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro de Sede */}
                <div className="space-y-2">
                  <Label htmlFor="branch">
                    {t('reports.filters.branch')}
                  </Label>
                  <Select
                    value={localFilters.branchId?.toString() || 'all'}
                    onValueChange={handleBranchChange}
                    disabled={isLoadingMetadata}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('reports.filters.selectBranch')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('reports.filters.allBranches')}
                      </SelectItem>
                      {metadata?.data.branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Servicio */}
                <div className="space-y-2">
                  <Label htmlFor="service">
                    {t('reports.filters.service')}
                  </Label>
                  <Select
                    value={localFilters.serviceId?.toString() || 'all'}
                    onValueChange={handleServiceChange}
                    disabled={isLoadingMetadata}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('reports.filters.selectService')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('reports.filters.allServices')}
                      </SelectItem>
                      {filteredServices.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Punto de Atención */}
                <div className="space-y-2">
                  <Label htmlFor="servicePoint">
                    {t('reports.filters.servicePoint')}
                  </Label>
                  <Select
                    value={localFilters.servicePointId?.toString() || 'all'}
                    onValueChange={(value) => updateFilter('servicePointId', value)}
                    disabled={isLoadingMetadata}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('reports.filters.selectServicePoint')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('reports.filters.allServicePoints')}
                      </SelectItem>
                      {filteredServicePoints.map((servicePoint) => (
                        <SelectItem key={servicePoint.id} value={servicePoint.id.toString()}>
                          {servicePoint.name} ({servicePoint.branchName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Errores de Validación */}
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((error, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {error}
              </Badge>
            ))}
          </div>
        )}

        {/* Filtros Activos */}
        {(localFilters.branchId || localFilters.serviceId || localFilters.servicePointId) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('reports.filters.activeFilters')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {localFilters.branchId && (
                <Badge variant="secondary" className="text-xs">
                  {t('reports.filters.branch')}: {metadata?.data.branches.find(b => b.id === localFilters.branchId)?.name}
                </Badge>
              )}
              {localFilters.serviceId && (
                <Badge variant="secondary" className="text-xs">
                  {t('reports.filters.service')}: {metadata?.data.services.find(s => s.id === localFilters.serviceId)?.name}
                </Badge>
              )}
              {localFilters.servicePointId && (
                <Badge variant="secondary" className="text-xs">
                  {t('reports.filters.servicePoint')}: {metadata?.data.servicePoints.find(sp => sp.id === localFilters.servicePointId)?.name}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button 
            onClick={handleApplyFilters}
            disabled={!isValid || isLoading}
            className="flex-1"
          >
            <Search className="h-4 w-4 mr-2" />
            {t('reports.filters.apply')}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleResetFilters}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('reports.filters.reset')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
