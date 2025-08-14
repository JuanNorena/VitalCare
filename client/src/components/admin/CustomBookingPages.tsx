import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Eye, Globe, Palette } from 'lucide-react';
import { useCustomBookingPages } from '@/hooks/use-custom-booking-pages';
import { CustomPageEditor } from './custom-pages/CustomPageEditor';
import { CustomPagePreview } from './custom-pages/CustomPagePreview';
import { BranchSelector } from './custom-pages/BranchSelector';
import type { Branch } from '@db/schema';

/**
 * Componente principal para la gestión de páginas de reserva personalizadas.
 * 
 * Permite a los administradores:
 * - Ver todas las sedes y su estado de personalización
 * - Crear nuevas páginas personalizadas
 * - Editar páginas existentes
 * - Ver preview en tiempo real
 * - Gestionar configuración visual
 */
export function CustomBookingPages() {
  const { t } = useTranslation();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'editor' | 'preview'>('overview');

  const { 
    allBranchesWithPages, 
    isLoadingAll, 
    customPage,
    isLoading: isLoadingPage,
    refetchAllBranches 
  } = useCustomBookingPages(selectedBranch?.id);

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    setActiveTab('editor');
  };

  const handleBackToOverview = () => {
    setSelectedBranch(null);
    setActiveTab('overview');
    refetchAllBranches();
  };

  if (isLoadingAll) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('customPages.messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
              {t('customPages.messages.mainTitle')}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1 break-words">
              {t('customPages.messages.mainDescription')}
            </p>
          </div>

          {selectedBranch && (
            <div className="flex-shrink-0">
              <Button variant="outline" onClick={handleBackToOverview} className="w-full sm:w-auto">
                <span className="hidden sm:inline">{t('customPages.messages.backToOverview')}</span>
                <span className="sm:hidden">← {t('common.back')}</span>
              </Button>
            </div>
          )}
        </div>

      {!selectedBranch ? (
        <div className="space-y-6">
          {/* Resumen general */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('customPages.stats.totalBranches')}</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allBranchesWithPages?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('customPages.stats.activePages')}</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allBranchesWithPages?.filter(branch => branch.customPageEnabled && branch.customBookingPage?.isActive).length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('customPages.stats.inConfiguration')}</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allBranchesWithPages?.filter(branch => 
                    branch.customBookingPage && !branch.customPageEnabled
                  ).length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('customPages.stats.notConfigured')}</CardTitle>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allBranchesWithPages?.filter(branch => !branch.customBookingPage).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de sedes */}
          <Card>
            <CardHeader>
              <CardTitle>{t('customPages.messages.branchesListTitle')}</CardTitle>
              <CardDescription>
                {t('customPages.messages.branchesListDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BranchSelector 
                branches={allBranchesWithPages || []}
                onBranchSelect={handleBranchSelect}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t('customPages.tabs.basic')}
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('customPages.preview.title')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t('customPages.messages.editorTitle')} - {selectedBranch.name}
                </CardTitle>
                <CardDescription>
                  {t('customPages.messages.editorDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPage ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <CustomPageEditor 
                    branch={selectedBranch}
                    customPage={customPage}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {t('customPages.messages.previewTitle')} - {selectedBranch.name}
                </CardTitle>
                <CardDescription>
                  {t('customPages.messages.previewDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomPagePreview 
                  branch={selectedBranch}
                  customPage={customPage}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      </div>
    </div>
  );
}

export default CustomBookingPages;
