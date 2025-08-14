import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Settings, Eye, Plus, ExternalLink } from 'lucide-react';
import type { BranchWithCustomPage, Branch } from '@db/schema';

interface BranchSelectorProps {
  branches: BranchWithCustomPage[];
  onBranchSelect: (branch: Branch) => void;
}

export function BranchSelector({ branches, onBranchSelect }: BranchSelectorProps) {
  const { t } = useTranslation();
  
  const getStatusBadge = (branch: BranchWithCustomPage) => {
    if (!branch.customBookingPage) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Plus className="h-3 w-3" />
          {t('customPages.messages.notConfigured')}
        </Badge>
      );
    }

    if (branch.customPageEnabled && branch.customBookingPage.isActive) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <Eye className="h-3 w-3" />
          {t('customPages.messages.active')}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Settings className="h-3 w-3" />
        {t('customPages.messages.inConfiguration')}
      </Badge>
    );
  };

  const getPublicUrl = (branch: BranchWithCustomPage) => {
    if (branch.pageSlug && branch.customPageEnabled) {
      return `${window.location.origin}/booking/${branch.pageSlug}`;
    }
    return null;
  };

  if (!branches || branches.length === 0) {
    return (
      <div className="text-center py-8">
        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t('customPages.messages.noBranches')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {branches.map((branch) => {
        const publicUrl = getPublicUrl(branch);
        
        return (
          <Card key={branch.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              {/* Layout móvil-first con flexbox responsivo */}
              <div className="flex flex-col space-y-3 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
                <div className="min-w-0 flex-1">
                  {/* Título y badge en layout responsivo */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <CardTitle className="text-lg truncate min-w-0">
                      {branch.name}
                    </CardTitle>
                    {getStatusBadge(branch)}
                  </div>
                  <CardDescription className="break-words">
                    {branch.description || t('customPages.messages.noDescription')}
                  </CardDescription>
                </div>
                
                {/* Botones en layout responsivo */}
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                  {publicUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(publicUrl, '_blank')}
                      className="flex items-center justify-center gap-1 w-full sm:w-auto"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="hidden sm:inline">{t('customPages.messages.viewPublicPage')}</span>
                      <span className="sm:hidden">{t('customPages.messages.view')}</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => onBranchSelect(branch)}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {branch.customBookingPage ? t('customPages.messages.edit') : t('customPages.messages.configure')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {branch.customBookingPage && (
              <CardContent className="pt-0">
                {/* Grid responsivo que se adapta a diferentes tamaños */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-muted-foreground mb-1">{t('customPages.messages.pageTitle')}</p>
                    <p className="truncate text-foreground">
                      {branch.customBookingPage.heroTitle || t('customPages.messages.notConfigured')}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-muted-foreground mb-1">{t('customPages.messages.slug')}</p>
                    <p className="truncate font-mono text-xs break-all">
                      {branch.pageSlug || t('customPages.messages.notConfigured')}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-muted-foreground mb-1">{t('customPages.messages.lastModified')}</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {branch.customBookingPage.updatedAt ? 
                        new Date(branch.customBookingPage.updatedAt).toLocaleDateString() : 
                        t('common.notAvailable')
                      }
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-muted-foreground mb-1">WhatsApp</p>
                    <p className="text-muted-foreground text-xs sm:text-sm truncate">
                      {branch.enableWhatsApp ? 
                        (branch.whatsappNumber || t('customPages.messages.whatsappEnabled')) : 
                        t('customPages.messages.whatsappDisabled')
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default BranchSelector;
