/**
 * @vitest-environment jsdom
 * 
 * Pruebas unitarias para la utilidad cn (className).
 * 
 * Este archivo contiene tests para verificar:
 * - Combinación básica de clases
 * - Clases condicionales
 * - Resolución de conflictos de Tailwind
 * - Manejo de arrays y objetos
 * - Edge cases
 * 
 * @group utils
 * @group cn
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/utils/cn';

describe('cn Utility', () => {
  describe('Combinación Básica', () => {
    it('debe combinar múltiples strings de clases', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('debe manejar un solo string', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });

    it('debe retornar string vacío cuando no hay clases', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('debe combinar clases de Tailwind típicas', () => {
      const result = cn('px-4 py-2 bg-blue-500 text-white rounded');
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('bg-blue-500');
    });
  });

  describe('Clases Condicionales', () => {
    it('debe incluir clases cuando la condición es true', () => {
      const isActive = true;
      const result = cn('base', isActive && 'active');
      expect(result).toContain('base');
      expect(result).toContain('active');
    });

    it('debe excluir clases cuando la condición es false', () => {
      const isActive = false;
      const result = cn('base', isActive && 'active');
      expect(result).toBe('base');
      expect(result).not.toContain('active');
    });

    it('debe manejar múltiples condiciones', () => {
      const isPrimary = true;
      const isDisabled = false;
      const isLarge = true;
      
      const result = cn(
        'btn',
        isPrimary && 'btn-primary',
        isDisabled && 'btn-disabled',
        isLarge && 'btn-lg'
      );
      
      expect(result).toContain('btn');
      expect(result).toContain('btn-primary');
      expect(result).not.toContain('btn-disabled');
      expect(result).toContain('btn-lg');
    });

    it('debe manejar operador ternario', () => {
      const variant = 'primary';
      const result = cn(
        'btn',
        variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'
      );
      
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('bg-gray-500');
    });
  });

  describe('Resolución de Conflictos de Tailwind', () => {
    it('debe resolver conflictos de padding (última clase gana)', () => {
      const result = cn('px-2', 'px-4');
      expect(result).toBe('px-4');
    });

    it('debe resolver conflictos de background color', () => {
      const result = cn('bg-blue-500', 'bg-red-500');
      expect(result).toBe('bg-red-500');
    });

    it('debe resolver conflictos de text size', () => {
      const result = cn('text-sm', 'text-lg');
      expect(result).toBe('text-lg');
    });

    it('debe mantener clases no conflictivas', () => {
      const result = cn('px-4 py-2', 'px-8 text-white');
      expect(result).toContain('px-8');
      expect(result).toContain('py-2');
      expect(result).toContain('text-white');
    });

    it('debe resolver conflictos de margin', () => {
      const result = cn('m-2', 'm-4', 'mx-6');
      expect(result).toBe('m-4 mx-6');
    });
  });

  describe('Arrays y Objetos', () => {
    it('debe manejar arrays de clases', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('debe manejar objetos con valores booleanos', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true
      });
      
      expect(result).toContain('class1');
      expect(result).not.toContain('class2');
      expect(result).toContain('class3');
    });

    it('debe manejar mix de arrays, objetos y strings', () => {
      const result = cn(
        'base',
        ['array1', 'array2'],
        { 'obj1': true, 'obj2': false },
        'final'
      );
      
      expect(result).toContain('base');
      expect(result).toContain('array1');
      expect(result).toContain('array2');
      expect(result).toContain('obj1');
      expect(result).not.toContain('obj2');
      expect(result).toContain('final');
    });

    it('debe manejar arrays anidados', () => {
      const result = cn(['class1', ['class2', 'class3']]);
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });
  });

  describe('Casos de Uso Reales', () => {
    it('debe funcionar para variantes de botones', () => {
      // Simular props dinámicas que podrían venir de un componente
      type ButtonVariant = 'primary' | 'secondary';
      type ButtonSize = 'sm' | 'lg';
      
      const getButtonClasses = (variant: ButtonVariant, size: ButtonSize, disabled: boolean) => {
        return cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
          variant === 'secondary' && 'bg-gray-200 text-gray-900',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'lg' && 'px-8 py-3 text-lg',
          disabled && 'opacity-50 cursor-not-allowed'
        );
      };
      
      const result = getButtonClasses('primary', 'lg', false);
      
      expect(result).toContain('bg-blue-600');
      expect(result).toContain('px-8');
      expect(result).not.toContain('opacity-50');
    });

    it('debe funcionar para estados de input', () => {
      const hasError = true;
      const isFocused = false;
      const isDisabled = false;
      
      const result = cn(
        'w-full rounded-md border px-3 py-2',
        hasError && 'border-red-500 focus:ring-red-500',
        !hasError && 'border-gray-300 focus:ring-blue-500',
        isFocused && 'ring-2',
        isDisabled && 'bg-gray-100 cursor-not-allowed'
      );
      
      expect(result).toContain('border-red-500');
      expect(result).not.toContain('ring-2');
      expect(result).not.toContain('bg-gray-100');
    });

    it('debe funcionar para cards con variantes', () => {
      type CardVariant = 'flat' | 'elevated';
      
      const getCardClasses = (variant: CardVariant, interactive: boolean) => {
        return cn(
          'rounded-lg border bg-white p-6',
          variant === 'flat' && 'shadow-none',
          variant === 'elevated' && 'shadow-lg',
          interactive && 'hover:shadow-xl transition-shadow cursor-pointer'
        );
      };
      
      const result = getCardClasses('elevated', true);
      
      expect(result).toContain('shadow-lg');
      expect(result).toContain('hover:shadow-xl');
      expect(result).not.toContain('shadow-none');
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar undefined', () => {
      const result = cn('class1', undefined, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('debe manejar null', () => {
      const result = cn('class1', null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('debe manejar strings vacíos', () => {
      const result = cn('class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('debe manejar valores falsy', () => {
      const result = cn('class1', false, 0, '', null, undefined, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('debe manejar espacios extras', () => {
      const result = cn('  class1  ', '  class2  ');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('debe manejar duplicados', () => {
      const result = cn('class1 class2', 'class2 class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('debe manejar solo valores falsy', () => {
      const result = cn(false, null, undefined, '');
      expect(result).toBe('');
    });

    it('debe manejar arrays vacíos', () => {
      const result = cn([], 'class1', []);
      expect(result).toBe('class1');
    });

    it('debe manejar objetos vacíos', () => {
      const result = cn({}, 'class1', {});
      expect(result).toBe('class1');
    });
  });

  describe('Performance Cases', () => {
    it('debe manejar muchas clases eficientemente', () => {
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class${i}`);
      const result = cn(...manyClasses);
      
      expect(result).toContain('class0');
      expect(result).toContain('class99');
    });

    it('debe resolver múltiples conflictos eficientemente', () => {
      const result = cn(
        'px-1', 'px-2', 'px-3', 'px-4',
        'py-1', 'py-2', 'py-3',
        'bg-red-100', 'bg-red-200', 'bg-red-300'
      );
      
      expect(result).toBe('px-4 py-3 bg-red-300');
    });
  });
});
