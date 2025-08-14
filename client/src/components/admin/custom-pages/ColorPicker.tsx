import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const presetColors = [
  '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'
];

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (color: string) => {
    onChange(color);
  };

  const isValidHex = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-10 h-10 p-0 border-2"
              style={{ backgroundColor: isValidHex(value) ? value : '#000000' }}
              aria-label={t('customPages.branding.selectColor')}
            >
              <span className="sr-only">{t('customPages.branding.selectColor')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="hex-input" className="text-sm">{t('customPages.branding.hexCode')}</Label>
                <Input
                  id="hex-input"
                  value={value}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#000000"
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">{t('customPages.branding.predefinedColors')}</Label>
                <div className="grid grid-cols-5 gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        handleColorChange(color);
                        setIsOpen(false);
                      }}
                      aria-label={`${t('customPages.branding.selectColor')} ${color}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color-input" className="text-sm">{t('customPages.branding.colorSelector')}</Label>
                <input
                  id="color-input"
                  type="color"
                  value={isValidHex(value) ? value : '#000000'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-10 border rounded cursor-pointer"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Input
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          placeholder="#000000"
          className="font-mono text-sm flex-1"
        />
      </div>
      
      {!isValidHex(value) && value && (
        <p className="text-xs text-red-500">{t('customPages.branding.invalidColorFormat')}</p>
      )}
    </div>
  );
}

export default ColorPicker;
