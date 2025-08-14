import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, X, Image, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  /** ID de la sucursal */
  branchId: number;
  /** URL actual de la imagen (si existe) */
  currentImageUrl?: string;
  /** Callback cuando se sube una nueva imagen */
  onImageUploaded: (imageUrl: string) => void;
  /** Callback cuando se elimina la imagen */
  onImageRemoved?: () => void;
  /** Tipo de imagen: 'logo' o 'background' */
  imageType: 'logo' | 'background';
  /** Etiqueta personalizada */
  label?: string;
  /** Texto de ayuda */
  helpText?: string;
  /** Tamaño máximo en MB */
  maxSizeMB?: number;
}

/**
 * Componente para subir imágenes (logos o fondos)
 * 
 * Permite seleccionar y subir archivos de imagen al servidor,
 * con preview en tiempo real y validación de formato/tamaño.
 */
export function ImageUpload({
  branchId,
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  imageType,
  label,
  helpText,
  maxSizeMB = 5
}: ImageUploadProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMarkedForRemoval, setIsMarkedForRemoval] = useState(false);

  // Actualizar preview cuando cambia currentImageUrl
  useEffect(() => {
    setPreview(currentImageUrl || null);
    setIsMarkedForRemoval(false);
  }, [currentImageUrl]);

  const endpoint = imageType === 'logo' 
    ? `/api/branches/${branchId}/upload-logo`
    : `/api/branches/${branchId}/upload-background`;

  const fieldName = imageType === 'logo' ? 'logo' : 'background';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('customPages.upload.invalidFileType')
      });
      return;
    }

    // Validar tamaño
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('customPages.upload.fileTooLarge', { maxSize: maxSizeMB })
      });
      return;
    }

    setSelectedFile(file);
    setIsMarkedForRemoval(false);

    // Crear preview inmediatamente
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append(fieldName, selectedFile);

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t('errors.unknownError') }));
        throw new Error(errorData.message || t('customPages.upload.uploadError'));
      }

      const result = await response.json();
      const imageUrl = imageType === 'logo' ? result.logoUrl : result.backgroundImageUrl;

      // Invalidar cache para refrescar los datos de la página personalizada
      queryClient.invalidateQueries({ queryKey: ['/api/custom-pages', branchId] });
      
      // Actualizar preview con la URL del servidor inmediatamente
      setPreview(imageUrl);
      
      onImageUploaded(imageUrl);
      setSelectedFile(null);
      setIsMarkedForRemoval(false);

      toast({
        title: t('common.success'),
        description: t('customPages.upload.uploadSuccess')
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      // En caso de error, restaurar el preview anterior
      setPreview(currentImageUrl || null);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('customPages.upload.uploadError')
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    // Remover preview inmediatamente
    setPreview(null);
    setSelectedFile(null);
    setIsMarkedForRemoval(true);
    
    // Notificar al componente padre que se removió la imagen
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{label || t(`customPages.upload.${imageType}Label`)}</Label>
        {helpText && (
          <p className="text-sm text-muted-foreground">{helpText}</p>
        )}
      </div>

      {/* Preview de la imagen */}
      {preview && (
        <Card className="p-4">
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className={`rounded-lg object-cover w-full ${
                imageType === 'logo' ? 'h-32' : 'h-48'
              }`}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {/* Botón para quitar la imagen (temporal) */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                title={t('customPages.upload.removeBackground')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Información sobre la imagen */}
          <div className="mt-2 text-xs text-muted-foreground">
            {currentImageUrl && preview === currentImageUrl && (
              <p>{t('customPages.upload.currentBackgroundImage')}</p>
            )}
            {selectedFile && (
              <p>{t('customPages.branding.newLogo')}</p>
            )}
          </div>
        </Card>
      )}

      {/* Mensaje cuando la imagen está marcada para eliminar */}
      {isMarkedForRemoval && currentImageUrl && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 text-orange-700">
            <Image className="h-4 w-4" />
            <p className="text-sm font-medium">{t('customPages.upload.willBeRemovedOnSave')}</p>
          </div>
        </Card>
      )}

      {/* Selector de archivo personalizado */}
      <div className="space-y-2">
        <div className="relative">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="sr-only"
            id={`file-input-${imageType}`}
          />
          <Label
            htmlFor={`file-input-${imageType}`}
            className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-600">
              <Upload className="h-5 w-5" />
              <span className="text-sm font-medium">
                {selectedFile ? selectedFile.name : t('customPages.upload.chooseFile')}
              </span>
            </div>
          </Label>
        </div>
        
        {!selectedFile && (
          <p className="text-xs text-gray-500 text-center">
            {t('customPages.upload.noFileChosen')}
          </p>
        )}
        
        {selectedFile && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
            <Button 
              onClick={handleUpload}
              disabled={isUploading}
              size="sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('customPages.upload.uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('customPages.upload.upload')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>{t('customPages.upload.allowedFormats')}: JPEG, PNG, GIF, WebP</p>
        <p>{t('customPages.upload.maxSize')}: {maxSizeMB}MB</p>
        {imageType === 'background' && (
          <p>{t('customPages.upload.recommendedSize')}: 1920x1080px</p>
        )}
      </div>
    </div>
  );
}
