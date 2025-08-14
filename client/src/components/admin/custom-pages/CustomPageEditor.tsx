import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Upload, Save, Eye, Palette, Globe, MessageSquare, Shield, Image } from 'lucide-react';
import { useCustomBookingPages } from '@/hooks/use-custom-booking-pages';
import { ImageUpload } from '@/components/ui/image-upload';
import { ColorPicker } from './ColorPicker';
import { LogoUploader } from './LogoUploader';
import type { Branch, CustomBookingPage, CustomPageFormData } from '@db/schema';

interface CustomPageEditorProps {
  branch: Branch;
  customPage?: CustomBookingPage | null;
}

export function CustomPageEditor({ branch, customPage }: CustomPageEditorProps) {
  const { t } = useTranslation();
  
  // Schema de validación para el formulario
  const customPageSchema = z.object({
    // Información básica
    pageSlug: z.string().min(1, t('customPages.validation.slugRequired')).max(50, t('customPages.validation.slugMaxLength')),
    pageTitle: z.string().min(1, t('customPages.validation.titleRequired')).max(100, t('customPages.validation.titleMaxLength')),
    pageDescription: z.string().optional(),
    welcomeMessage: z.string().optional(),
    
    // Configuración visual
    headerColor: z.string().min(1, t('customPages.validation.colorRequired')),
    fontColor: z.string().min(1, t('customPages.validation.colorRequired')),
    accentColor: z.string().min(1, t('customPages.validation.colorRequired')),
    backgroundColor: z.string().min(1, t('customPages.validation.colorRequired')),
    
    // Redes sociales
    showSocialMedia: z.boolean(),
    facebookUrl: z.string().optional(),
    instagramUrl: z.string().optional(),
    twitterUrl: z.string().optional(),
    
    // WhatsApp
    enableWhatsApp: z.boolean(),
    whatsappNumber: z.string().optional(),
    
    // Contenido personalizado
    heroTitle: z.string().optional(),
    heroSubtitle: z.string().optional(),
    heroBackgroundImage: z.string().optional(),
    customFooterText: z.string().optional(),
    
    // Configuración técnica
    requireTermsAcceptance: z.boolean(),
    termsText: z.string().optional(),
    privacyPolicyUrl: z.string().optional(),
    
    // Estado
    customPageEnabled: z.boolean(),
  });

  type FormData = z.infer<typeof customPageSchema>;

  const { updateCustomPage, uploadLogo, removeLogo, generateSlug, getPublicPageUrl, isUpdating, isUploadingLogo, isRemovingLogo, branchData } = useCustomBookingPages(branch.id);
  const [activeTab, setActiveTab] = useState('basic');

  const form = useForm<FormData>({
    resolver: zodResolver(customPageSchema),
    defaultValues: {
      pageSlug: branch.pageSlug || generateSlug(branch.name),
      pageTitle: branch.pageTitle || t('customPages.content.defaultPageTitle', { branchName: branch.name }),
      pageDescription: branch.pageDescription || branch.description || '',
      welcomeMessage: branch.welcomeMessage || '',
      
      headerColor: branch.headerColor || '#1f2937',
      fontColor: branch.fontColor || '#ffffff',
      accentColor: branch.accentColor || '#3b82f6',
      backgroundColor: branch.backgroundColor || '#f9fafb',
      
      showSocialMedia: branch.showSocialMedia ?? true,
      facebookUrl: branch.facebookUrl || '',
      instagramUrl: branch.instagramUrl || '',
      twitterUrl: branch.twitterUrl || '',
      
      enableWhatsApp: branch.enableWhatsApp ?? false,
      whatsappNumber: branch.whatsappNumber || '',
      
      heroTitle: customPage?.heroTitle || t('customPages.content.defaultHeroTitle', { branchName: branch.name }),
      heroSubtitle: customPage?.heroSubtitle || t('customPages.content.defaultHeroSubtitle'),
      heroBackgroundImage: customPage?.heroBackgroundImage || '',
      customFooterText: branch.customFooterText || '',
      
      requireTermsAcceptance: customPage?.requireTermsAcceptance ?? false,
      termsText: customPage?.termsText || '',
      privacyPolicyUrl: customPage?.privacyPolicyUrl || '',
      
      customPageEnabled: branch.customPageEnabled ?? false,
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      await updateCustomPage(data);
      // El toast de éxito se maneja en el hook
    } catch (error) {
      // El toast de error se maneja en el hook
      console.error('Error updating custom page:', error);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      await uploadLogo(file);
      // El toast de éxito se maneja en el hook
    } catch (error) {
      // El toast de error se maneja en el hook
      console.error('Error uploading logo:', error);
    }
  };

  const handleLogoRemove = async () => {
    try {
      await removeLogo();
      // El toast de éxito se maneja en el hook
    } catch (error) {
      // El toast de error se maneja en el hook
      console.error('Error removing logo:', error);
    }
  };

  const watchedSlug = form.watch('pageSlug');
  const watchedEnabled = form.watch('customPageEnabled');

  return (
    <div className="max-w-full overflow-hidden">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header con controles principales */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{t('customPages.basicInfo.configTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('customPages.basicInfo.configDescription')}
            </p>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {watchedEnabled && watchedSlug && (
              <div className="min-w-0 flex-1">
                <Badge variant="outline" className="flex items-center gap-1 w-full justify-start max-w-full">
                  <Globe className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate text-xs" title={getPublicPageUrl(watchedSlug)}>
                    {getPublicPageUrl(watchedSlug)}
                  </span>
                </Badge>
              </div>
            )}
            
            <Button type="submit" disabled={isUpdating} className="flex items-center gap-2 whitespace-nowrap">
              <Save className="h-4 w-4" />
              {isUpdating ? t('customPages.basicInfo.saving') : t('customPages.basicInfo.saveChanges')}
            </Button>
          </div>
        </div>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="grid grid-cols-5 gap-1 min-w-full w-max sm:w-full">
            <TabsTrigger value="basic" className="text-xs px-2 py-2 sm:text-sm sm:px-3">
              <span className="hidden sm:inline">{t('customPages.tabs.basic')}</span>
              <span className="sm:hidden">{t('customPages.tabs.basicShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="text-xs px-2 py-2 sm:text-sm sm:px-3">
              <span className="hidden sm:inline">{t('customPages.tabs.design')}</span>
              <span className="sm:hidden">{t('customPages.tabs.designShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs px-2 py-2 sm:text-sm sm:px-3">
              <span className="hidden sm:inline">{t('customPages.tabs.content')}</span>
              <span className="sm:hidden">{t('customPages.tabs.contentShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs px-2 py-2 sm:text-sm sm:px-3">
              <span className="hidden sm:inline">{t('customPages.tabs.social')}</span>
              <span className="sm:hidden">{t('customPages.tabs.socialShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs px-2 py-2 sm:text-sm sm:px-3">
              <span className="hidden sm:inline">{t('customPages.tabs.advanced')}</span>
              <span className="sm:hidden">{t('customPages.tabs.advancedShort')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Pestaña: Configuración Básica */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('customPages.basicInfo.title')}
              </CardTitle>
              <CardDescription>
                {t('customPages.basicInfo.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageTitle">{t('customPages.basicInfo.pageTitle')}</Label>
                  <Input
                    id="pageTitle"
                    {...form.register('pageTitle')}
                    placeholder={t('customPages.basicInfo.pageTitlePlaceholder')}
                  />
                  {form.formState.errors.pageTitle && (
                    <p className="text-sm text-red-500">{form.formState.errors.pageTitle.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageSlug">{t('customPages.basicInfo.pageSlug')}</Label>
                  <Input
                    id="pageSlug"
                    {...form.register('pageSlug')}
                    placeholder={t('customPages.basicInfo.pageSlugPlaceholder')}
                  />
                  {form.formState.errors.pageSlug && (
                    <p className="text-sm text-red-500">{form.formState.errors.pageSlug.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('customPages.basicInfo.publicUrl')} {getPublicPageUrl(watchedSlug || t('customPages.basicInfo.yourSlugPlaceholder'))}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageDescription">{t('customPages.basicInfo.pageDescription')}</Label>
                <Textarea
                  id="pageDescription"
                  {...form.register('pageDescription')}
                  placeholder={t('customPages.basicInfo.pageDescriptionPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="customPageEnabled" className="text-base font-medium">
                    {t('customPages.basicInfo.enablePage')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('customPages.basicInfo.enablePageDescription')}
                  </p>
                </div>
                <Switch
                  id="customPageEnabled"
                  checked={form.watch('customPageEnabled')}
                  onCheckedChange={(checked) => form.setValue('customPageEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Diseño Visual */}
        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t('customPages.branding.visualDesign')}
              </CardTitle>
              <CardDescription>
                {t('customPages.branding.visualDesignDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-4">
                <Label className="text-base font-medium">{t('customPages.branding.logoLabel')}</Label>
                <LogoUploader
                  currentLogoUrl={branchData?.logoUrl || branch.logoUrl}
                  onUpload={handleLogoUpload}
                  onRemove={handleLogoRemove}
                  isUploading={isUploadingLogo}
                  isRemoving={isRemovingLogo}
                />
              </div>

              <Separator />

              {/* Color Scheme */}
              <div className="space-y-4">
                <Label className="text-base font-medium">{t('customPages.branding.colorScheme')}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <ColorPicker
                      label={t('customPages.branding.headerColor')}
                      value={form.watch('headerColor')}
                      onChange={(color) => form.setValue('headerColor', color)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('customPages.branding.headerColorDescription')}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <ColorPicker
                      label={t('customPages.branding.fontColor')}
                      value={form.watch('fontColor')}
                      onChange={(color) => form.setValue('fontColor', color)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('customPages.branding.fontColorDescription')}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <ColorPicker
                      label={t('customPages.branding.accentColor')}
                      value={form.watch('accentColor')}
                      onChange={(color) => form.setValue('accentColor', color)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('customPages.branding.accentColorDescription')}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <ColorPicker
                      label={t('customPages.branding.backgroundColor')}
                      value={form.watch('backgroundColor')}
                      onChange={(color) => form.setValue('backgroundColor', color)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('customPages.branding.backgroundColorDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Contenido */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('customPages.content.pageContent')}
              </CardTitle>
              <CardDescription>
                {t('customPages.content.pageContentDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heroTitle">{t('customPages.content.heroTitle')}</Label>
                <Input
                  id="heroTitle"
                  {...form.register('heroTitle')}
                  placeholder={t('customPages.content.heroTitlePlaceholder', { branchName: branch.name })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heroSubtitle">{t('customPages.content.heroSubtitle')}</Label>
                <Input
                  id="heroSubtitle"
                  {...form.register('heroSubtitle')}
                  placeholder={t('customPages.content.heroSubtitlePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <ImageUpload
                  branchId={branch.id}
                  currentImageUrl={form.watch('heroBackgroundImage') || customPage?.heroBackgroundImage || ''}
                  onImageUploaded={(imageUrl) => {
                    // La imagen ya fue guardada en el servidor por el endpoint /upload-background
                    // Actualizamos el formulario inmediatamente para reflejar el cambio en la UI
                    form.setValue('heroBackgroundImage', imageUrl);
                  }}
                  onImageRemoved={() => {
                    // Al remover la imagen, limpiamos el campo del formulario inmediatamente
                    form.setValue('heroBackgroundImage', '');
                  }}
                  imageType="background"
                  label={t('customPages.content.backgroundImage')}
                  helpText={t('customPages.content.backgroundImageHelp')}
                  maxSizeMB={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">{t('customPages.basicInfo.welcomeMessage')}</Label>
                <Textarea
                  id="welcomeMessage"
                  {...form.register('welcomeMessage')}
                  placeholder={t('customPages.basicInfo.welcomeMessagePlaceholder')}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {t('customPages.basicInfo.welcomeMessageHelper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customFooterText">{t('customPages.content.customFooterText')}</Label>
                <Input
                  id="customFooterText"
                  {...form.register('customFooterText')}
                  placeholder={t('customPages.content.customFooterTextPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Redes Sociales */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('customPages.socialMedia.socialAndWhatsapp')}</CardTitle>
              <CardDescription>
                {t('customPages.socialMedia.socialAndWhatsappDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">{t('customPages.socialMedia.showSocialMedia')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('customPages.socialMedia.showSocialMediaDescription')}
                  </p>
                </div>
                <Switch
                  checked={form.watch('showSocialMedia')}
                  onCheckedChange={(checked) => form.setValue('showSocialMedia', checked)}
                />
              </div>

              {form.watch('showSocialMedia') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">{t('customPages.socialMedia.facebookUrl')}</Label>
                    <Input
                      id="facebookUrl"
                      {...form.register('facebookUrl')}
                      placeholder={t('customPages.socialMedia.facebookUrlPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">{t('customPages.socialMedia.instagramUrl')}</Label>
                    <Input
                      id="instagramUrl"
                      {...form.register('instagramUrl')}
                      placeholder={t('customPages.socialMedia.instagramUrlPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl">{t('customPages.socialMedia.twitterUrl')}</Label>
                    <Input
                      id="twitterUrl"
                      {...form.register('twitterUrl')}
                      placeholder={t('customPages.socialMedia.twitterUrlPlaceholder')}
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">{t('customPages.whatsapp.enable')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('customPages.whatsapp.enableDescription')}
                  </p>
                </div>
                <Switch
                  checked={form.watch('enableWhatsApp')}
                  onCheckedChange={(checked) => form.setValue('enableWhatsApp', checked)}
                />
              </div>

              {form.watch('enableWhatsApp') && (
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">{t('customPages.whatsapp.number')}</Label>
                  <Input
                    id="whatsappNumber"
                    {...form.register('whatsappNumber')}
                    placeholder={t('customPages.whatsapp.numberPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('customPages.whatsapp.numberHelperShort')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Configuración Avanzada */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('customPages.legal.advanced')}
              </CardTitle>
              <CardDescription>
                {t('customPages.legal.advancedDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">{t('customPages.legal.requireTerms')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('customPages.legal.requireTermsDescription')}
                  </p>
                </div>
                <Switch
                  checked={form.watch('requireTermsAcceptance')}
                  onCheckedChange={(checked) => form.setValue('requireTermsAcceptance', checked)}
                />
              </div>

              {form.watch('requireTermsAcceptance') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="termsText">{t('customPages.legal.termsTextLabel')}</Label>
                    <Textarea
                      id="termsText"
                      {...form.register('termsText')}
                      placeholder={t('customPages.legal.termsTextPlaceholder')}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privacyPolicyUrl">{t('customPages.legal.privacyPolicyUrl')}</Label>
                    <Input
                      id="privacyPolicyUrl"
                      {...form.register('privacyPolicyUrl')}
                      placeholder={t('customPages.legal.privacyPolicyUrlPlaceholder')}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
    </div>
  );
}

export default CustomPageEditor;
