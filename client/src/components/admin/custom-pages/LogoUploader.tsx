import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Image, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LogoUploaderProps {
  currentLogoUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  isUploading: boolean;
  isRemoving?: boolean;
}

export function LogoUploader({ currentLogoUrl, onUpload, onRemove, isUploading, isRemoving }: LogoUploaderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isMarkedForRemoval, setIsMarkedForRemoval] = useState(false);

  // Actualizar preview cuando cambia currentLogoUrl - exactamente igual que ImageUpload
  useEffect(() => {
    setPreview(currentLogoUrl || null);
    setIsMarkedForRemoval(false);
    // Si currentLogoUrl cambió y tenemos un uploadPreview, limpiarlo
    if (uploadPreview && currentLogoUrl) {
      setUploadPreview(null);
    }
  }, [currentLogoUrl]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('customPages.branding.invalidImageFile')
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('customPages.branding.fileTooLarge')
      });
      return;
    }

    // Crear preview temporal inmediatamente
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir archivo
    try {
      await onUpload(file);
      // El uploadPreview se limpiará cuando currentLogoUrl se actualice
    } catch (error) {
      // Si hay error, limpiar el preview temporal
      setUploadPreview(null);
      console.error('Error uploading file:', error);
    }
  };

  const handleRemoveCurrentLogo = async () => {
    if (!onRemove) return;
    
    // Feedback visual inmediato - igual que ImageUpload
    setPreview(null);
    setUploadPreview(null);
    setIsMarkedForRemoval(true);
    
    try {
      await onRemove();
      // El logo se habrá removido exitosamente del servidor
    } catch (error) {
      // En caso de error, restaurar el preview
      setPreview(currentLogoUrl || null);
      setIsMarkedForRemoval(false);
      console.error('Error removing logo:', error);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const logoToShow = uploadPreview || (isMarkedForRemoval ? null : preview);

  return (
    <div className="space-y-4">
      {/* Preview del logo actual o nuevo */}
      {logoToShow && (
        <Card className="w-fit">
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={logoToShow}
                alt={t('customPages.branding.logoPreview')}
                className="max-w-48 max-h-24 object-contain rounded"
              />
              
              {/* Botón rojo para eliminar logo nuevo (preview) */}
              {uploadPreview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                  onClick={clearPreview}
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              {/* Botón rojo para eliminar logo actual */}
              {!uploadPreview && preview && !isMarkedForRemoval && onRemove && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                  onClick={handleRemoveCurrentLogo}
                  disabled={isUploading || isRemoving}
                  title={t('customPages.branding.removeLogo')}
                >
                  {isRemoving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {uploadPreview ? t('customPages.branding.newLogo') : t('customPages.branding.currentLogo')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando el logo está marcado para eliminar */}
      {isMarkedForRemoval && currentLogoUrl && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 text-orange-700">
            <Image className="h-4 w-4" />
            <p className="text-sm font-medium">{t('customPages.branding.logoWillBeRemoved')}</p>
          </div>
        </Card>
      )}

      {/* Área de upload */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            ) : (
              <div className="p-3 rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isUploading ? t('customPages.branding.uploadingLogo') : t('customPages.branding.uploadNewLogo')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('customPages.branding.dragDropText')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('customPages.branding.fileFormats')}
              </p>
            </div>
            
            {!isUploading && (
              <Button type="button" variant="secondary" size="sm">
                <Image className="h-4 w-4 mr-2" />
                {t('customPages.branding.selectFile')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

export default LogoUploader;
