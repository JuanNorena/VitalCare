import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Branch, CustomBookingPage } from '@db/schema';

interface CustomPagePreviewProps {
  branch: Branch;
  customPage?: CustomBookingPage | null;
}

export function CustomPagePreview({ branch, customPage }: CustomPagePreviewProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  // Configuración básica
  const config = {
    logoUrl: branch.logoUrl,
    pageSlug: branch.pageSlug,
    customPageEnabled: branch.customPageEnabled ?? false,
    enableWhatsApp: branch.enableWhatsApp ?? false,
    showSocialMedia: branch.showSocialMedia ?? true,
  };

  // URL pública de la página
  const publicUrl = config.pageSlug ? `${window.location.origin}/booking/${config.pageSlug}` : null;

  // Handlers para el iframe
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const refreshPreview = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setIframeKey(prev => prev + 1);
  }, []);

  // Componente de fallback cuando no hay URL o está deshabilitada
  const PreviewFallback = () => (
    <div className="flex flex-col items-center justify-center h-[400px] sm:h-[500px] lg:h-[600px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
      <div className="text-center max-w-sm mx-auto p-4 sm:p-6">
        <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          {!config.customPageEnabled 
            ? t('customPages.preview.pageDisabled')
            : !publicUrl 
              ? t('customPages.preview.noSlugConfigured') 
              : t('customPages.preview.previewUnavailable')
          }
        </h3>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          {!config.customPageEnabled 
            ? t('customPages.preview.enablePageDescription')
            : !publicUrl 
              ? t('customPages.preview.configureSlugDescription')
              : t('customPages.preview.previewUnavailableDescription')
          }
        </p>
        {!config.customPageEnabled && (
          <Badge variant="secondary" className="text-xs">
            {t('customPages.preview.inactive')}
          </Badge>
        )}
      </div>
    </div>
  );

  // Componente de error
  const ErrorFallback = () => (
    <div className="flex flex-col items-center justify-center h-[400px] sm:h-[500px] lg:h-[600px] bg-red-50 border-2 border-dashed border-red-200 rounded-lg">
      <div className="text-center max-w-sm mx-auto p-4 sm:p-6">
        <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-red-400 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-2">
          {t('customPages.preview.loadError')}
        </h3>
        <p className="text-sm text-red-600 mb-4 leading-relaxed">
          {t('customPages.preview.loadErrorDescription')}
        </p>
        <Button 
          onClick={refreshPreview}
          variant="outline"
          size="sm"
          className="text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('customPages.preview.retry')}
        </Button>
      </div>
    </div>
  );

  // Componente de carga
  const LoadingOverlay = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10">
      <div className="text-center px-4">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 animate-spin mx-auto mb-3 sm:mb-4" />
        <p className="text-sm font-medium text-gray-600">
          {t('customPages.preview.loadingPreview')}
        </p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          {t('customPages.preview.loadingDescription')}
        </p>
      </div>
    </div>
  );
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Controles de preview */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1 min-w-0">
          <h4 className="text-lg font-semibold">{t('customPages.preview.pagePreviewTitle')}</h4>
          <p className="text-sm text-muted-foreground">
            {config.customPageEnabled && publicUrl 
              ? t('customPages.preview.realTimePreview')
              : t('customPages.preview.pagePreviewDescription')
            }
          </p>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          {/* Botón de refrescar */}
          {config.customPageEnabled && publicUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPreview}
              disabled={isLoading}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{t('customPages.preview.refresh')}</span>
            </Button>
          )}

          {/* Botón de ver página real */}
          {config.customPageEnabled && publicUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(publicUrl, '_blank')}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">{t('customPages.preview.viewRealPage')}</span>
              <span className="sm:hidden">{t('customPages.preview.viewPage')}</span>
            </Button>
          )}
          
          {/* Badge de estado */}
          <Badge variant={config.customPageEnabled ? "default" : "secondary"} className="w-full sm:w-auto justify-center">
            {config.customPageEnabled ? t('customPages.preview.active') : t('customPages.preview.inactive')}
          </Badge>
        </div>
      </div>

      {/* Alerta informativa */}
      {config.customPageEnabled && publicUrl && (
        <Alert className="w-full">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="break-words">
            <div className="flex flex-col gap-2">
              <span>{t('customPages.preview.realTimeAlert')}</span>
              <code className="block px-2 py-1 bg-gray-100 rounded text-xs break-all overflow-hidden">
                {publicUrl}
              </code>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Contenedor del preview */}
      <Card className="overflow-hidden w-full">
        <div className="relative w-full">
          {/* Mostrar fallback si no hay condiciones para iframe */}
          {(!config.customPageEnabled || !publicUrl) ? (
            <PreviewFallback />
          ) : hasError ? (
            <ErrorFallback />
          ) : (
            <>
              {/* Overlay de carga */}
              {isLoading && <LoadingOverlay />}
              
              {/* Iframe con la página real */}
              <iframe
                key={iframeKey}
                src={publicUrl}
                className="w-full border-0 h-[400px] sm:h-[500px] lg:h-[600px]"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                loading="lazy"
                title={t('customPages.preview.pagePreview')}
                style={{
                  minHeight: '400px',
                  backgroundColor: '#f9fafb',
                  maxWidth: '100%'
                }}
              />
            </>
          )}
        </div>
      </Card>

      {/* Información adicional */}
      <Card className="w-full">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {/* URL Pública */}
            <div className="min-w-0">
              <p className="font-medium text-muted-foreground">{t('customPages.preview.publicUrl')}</p>
              {publicUrl ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                  <code className="font-mono text-xs break-all bg-gray-100 px-2 py-1 rounded flex-1 min-w-0 overflow-hidden">
                    {publicUrl}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 shrink-0 self-start sm:self-center"
                    onClick={() => navigator.clipboard.writeText(publicUrl)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  {t('customPages.preview.notConfigured')}
                </p>
              )}
            </div>

            {/* Estado */}
            <div>
              <p className="font-medium text-muted-foreground">{t('customPages.preview.status')}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  config.customPageEnabled ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <p className={`text-sm ${config.customPageEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {config.customPageEnabled ? t('customPages.preview.pageActive') : t('customPages.preview.pageInactive')}
                </p>
              </div>
            </div>

            {/* Características */}
            <div className="sm:col-span-2 lg:col-span-1">
              <p className="font-medium text-muted-foreground">{t('customPages.preview.features')}</p>
              <div className="flex gap-1 flex-wrap mt-1">
                {config.logoUrl && (
                  <Badge variant="outline" className="text-xs">
                    {t('customPages.preview.logo')}
                  </Badge>
                )}
                {config.enableWhatsApp && (
                  <Badge variant="outline" className="text-xs">
                    {t('customPages.preview.whatsapp')}
                  </Badge>
                )}
                {config.showSocialMedia && (
                  <Badge variant="outline" className="text-xs">
                    {t('customPages.preview.socialMedia')}
                  </Badge>
                )}
                {(!config.logoUrl && !config.enableWhatsApp && !config.showSocialMedia) && (
                  <span className="text-xs text-gray-500">
                    {t('customPages.preview.basicFeatures')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información técnica para desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed w-full">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs text-gray-500">
              <p className="font-medium mb-2">{t('customPages.preview.debugInfo')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="truncate">Branch ID: {branch.id}</div>
                <div className="truncate">Slug: {config.pageSlug || 'N/A'}</div>
                <div className="truncate">Enabled: {config.customPageEnabled.toString()}</div>
                <div className="truncate">Has Logo: {Boolean(config.logoUrl).toString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CustomPagePreview;
