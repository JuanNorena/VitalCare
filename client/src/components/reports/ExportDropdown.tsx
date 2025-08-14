/**
 * @fileoverview Componente dropdown para exportación de reportes
 * 
 * Proporciona un menú desplegable con opciones para exportar reportes
 * en diferentes formatos (PDF, Excel, CSV).
 * 
 * @version 1.0.0
 * @since 2025-01-30
 */

import React, { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileSpreadsheet, 
  File,
  Loader2
} from "lucide-react";
import { useTranslation } from "react-i18next";

// =========================================================================
// TIPOS E INTERFACES
// =========================================================================

/**
 * Formato de exportación disponible
 */
export type ExportFormat = 'excel' | 'csv';

/**
 * Estado de exportación
 */
export interface ExportState {
  isExporting: boolean;
  format: ExportFormat | null;
}

/**
 * Props del componente ExportDropdown
 */
export interface ExportDropdownProps {
  /** Función que se ejecuta al seleccionar un formato */
  onExport: (format: ExportFormat) => void | Promise<void>;
  /** Estado de carga/exportación */
  isLoading?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
  /** Variante del botón */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  /** Tamaño del botón */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Texto personalizado del botón */
  buttonText?: string;
  /** Ocultar opciones específicas */
  hideFormats?: ExportFormat[];
  /** Clase CSS adicional */
  className?: string;
}

// =========================================================================
// COMPONENTE PRINCIPAL
// =========================================================================

/**
 * Componente dropdown para exportación de reportes
 * 
 * @component
 * @example
 * ```tsx
 * <ExportDropdown 
 *   onExport={handleExport}
 *   isLoading={isExporting}
 *   disabled={!hasData}
 * />
 * ```
 */
export function ExportDropdown({
  onExport,
  isLoading = false,
  disabled = false,
  variant = 'outline',
  size = 'default',
  buttonText,
  hideFormats = [],
  className = ''
}: ExportDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    format: null
  });

  /**
   * Maneja la selección de un formato de exportación
   */
  const handleFormatSelect = async (format: ExportFormat) => {
    try {
      setExportState({
        isExporting: true,
        format
      });
      
      await onExport(format);
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error durante la exportación:', error);
    } finally {
      setExportState({
        isExporting: false,
        format: null
      });
    }
  };

  /**
   * Obtiene el icono según el formato
   */
  const getFormatIcon = (format: ExportFormat) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (format) {
      case 'excel':
        return <FileSpreadsheet {...iconProps} />;
      case 'csv':
        return <File {...iconProps} />;
      default:
        return <Download {...iconProps} />;
    }
  };

  /**
   * Obtiene el texto según el formato
   */
  const getFormatText = (format: ExportFormat) => {
    switch (format) {
      case 'excel':
        return t('reports.export.formats.excel');
      case 'csv':
        return t('reports.export.formats.csv');
    }
  };

  /**
   * Obtiene la descripción según el formato
   */
  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case 'excel':
        return t('reports.export.descriptions.excel');
      case 'csv':
        return t('reports.export.descriptions.csv');
      default:
        return '';
    }
  };

  // Formatos disponibles
  const availableFormats: ExportFormat[] = (['excel', 'csv'] as ExportFormat[]).filter(
    format => !hideFormats.includes(format)
  );

  const isCurrentlyExporting = isLoading || exportState.isExporting;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant}
          size={size}
          disabled={disabled || isCurrentlyExporting}
          className={className}
        >
          {isCurrentlyExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          <span className="truncate">
            {isCurrentlyExporting && exportState.format
              ? t('reports.export.exporting', { format: getFormatText(exportState.format) })
              : buttonText || t('reports.export.button')
            }
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="px-2 py-1.5 text-sm font-medium">
          {t('reports.export.selectFormat')}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {availableFormats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleFormatSelect(format)}
            disabled={isCurrentlyExporting}
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getFormatIcon(format)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">
                {getFormatText(format)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {getFormatDescription(format)}
              </div>
            </div>
            {exportState.isExporting && exportState.format === format && (
              <Loader2 className="h-3 w-3 animate-spin flex-shrink-0 mt-1" />
            )}
          </DropdownMenuItem>
        ))}
        
        {availableFormats.length === 0 && (
          <DropdownMenuItem disabled className="p-3 text-center text-muted-foreground">
            {t('reports.export.noFormatsAvailable')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportDropdown;
