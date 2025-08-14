import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageChange = (value: 'es' | 'en') => {
    changeLanguage(value);
    toast({
      title: t('settings.languageChanged'),
      duration: 2000,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{t('settings.title')}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentLanguage}
            onValueChange={(value) => handleLanguageChange(value as 'es' | 'en')}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="es" id="es" />
              <Label htmlFor="es">{t('settings.spanish')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="en" id="en" />
              <Label htmlFor="en">{t('settings.english')}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}