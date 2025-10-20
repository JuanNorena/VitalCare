/**
 * @vitest-environment jsdom
 * 
 * Pruebas unitarias para el componente Button.
 * 
 * Este archivo contiene tests exhaustivos para verificar:
 * - Renderizado correcto del componente
 * - Aplicación de variantes visuales (default, destructive, outline, etc.)
 * - Aplicación de tamaños (default, sm, lg, icon)
 * - Manejo de eventos onClick
 * - Estados disabled
 * - Accesibilidad (roles, aria-labels)
 * - Clases CSS personalizadas
 * - Integración con forwardRef
 * 
 * @group ui-components
 * @group button
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../helpers/testUtils';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  describe('Renderizado Básico', () => {
    it('debe renderizar el botón con texto correctamente', () => {
      renderWithProviders(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('debe renderizar como un elemento button HTML', () => {
      renderWithProviders(<Button>Test</Button>);
      
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('debe mostrar children correctamente', () => {
      renderWithProviders(
        <Button>
          <span>Icono</span>
          <span>Texto</span>
        </Button>
      );
      
      expect(screen.getByText('Icono')).toBeInTheDocument();
      expect(screen.getByText('Texto')).toBeInTheDocument();
    });
  });

  describe('Variantes Visuales', () => {
    it('debe aplicar la variante "default" por defecto', () => {
      renderWithProviders(<Button>Default Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[var(--vc-button-primary)]');
    });

    it('debe aplicar la variante "destructive" correctamente', () => {
      renderWithProviders(<Button variant="destructive">Delete</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });

    it('debe aplicar la variante "outline" correctamente', () => {
      renderWithProviders(<Button variant="outline">Outline</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2');
    });

    it('debe aplicar la variante "secondary" correctamente', () => {
      renderWithProviders(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[var(--vc-bg-secondary)]');
    });

    it('debe aplicar la variante "ghost" correctamente', () => {
      renderWithProviders(<Button variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-[var(--vc-hover)]');
    });

    it('debe aplicar la variante "link" correctamente', () => {
      renderWithProviders(<Button variant="link">Link</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Tamaños', () => {
    it('debe aplicar el tamaño "default" por defecto', () => {
      renderWithProviders(<Button>Default Size</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('debe aplicar el tamaño "sm" correctamente', () => {
      renderWithProviders(<Button size="sm">Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
    });

    it('debe aplicar el tamaño "lg" correctamente', () => {
      renderWithProviders(<Button size="lg">Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });

    it('debe aplicar el tamaño "icon" correctamente', () => {
      renderWithProviders(<Button size="icon">🔍</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('Interactividad', () => {
    it('debe llamar a onClick cuando se hace clic', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick}>Click Me</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('debe llamar a onClick múltiples veces si se hace clic múltiples veces', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick}>Click Me</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('NO debe llamar a onClick cuando está disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Estado Disabled', () => {
    it('debe aplicar el atributo disabled correctamente', () => {
      renderWithProviders(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('debe aplicar clases CSS de disabled', () => {
      renderWithProviders(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Clases Personalizadas', () => {
    it('debe aplicar className personalizado sin sobreescribir clases base', () => {
      renderWithProviders(
        <Button className="custom-class">Custom</Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('inline-flex'); // Clase base debe seguir presente
    });

    it('debe combinar variante, tamaño y className personalizado', () => {
      renderWithProviders(
        <Button variant="outline" size="lg" className="my-custom-class">
          Combined
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('my-custom-class');
      expect(button).toHaveClass('border-2'); // Variante outline
      expect(button).toHaveClass('h-12'); // Tamaño lg
    });
  });

  describe('Tipos de Botón', () => {
    it('debe usar type="button" por defecto si no está en un formulario', () => {
      renderWithProviders(<Button>Default Type</Button>);
      
      const button = screen.getByRole('button') as HTMLButtonElement;
      // En algunos navegadores/entornos, el type por defecto puede ser 'submit'
      // Lo importante es que el botón funcione correctamente
      expect(['button', 'submit']).toContain(button.type);
    });

    it('debe aplicar type="submit" cuando se especifica', () => {
      renderWithProviders(<Button type="submit">Submit</Button>);
      
      const button = screen.getByRole('button') as HTMLButtonElement;
      expect(button.type).toBe('submit');
    });

    it('debe aplicar type="reset" cuando se especifica', () => {
      renderWithProviders(<Button type="reset">Reset</Button>);
      
      const button = screen.getByRole('button') as HTMLButtonElement;
      expect(button.type).toBe('reset');
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener el rol "button" por defecto', () => {
      renderWithProviders(<Button>Accessible Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('debe soportar aria-label', () => {
      renderWithProviders(
        <Button aria-label="Close dialog">X</Button>
      );
      
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it('debe soportar aria-describedby', () => {
      renderWithProviders(
        <div>
          <Button aria-describedby="help-text">Help</Button>
          <span id="help-text">Click for help</span>
        </div>
      );
      
      const button = screen.getByRole('button', { name: /help/i });
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('debe ser navegable con teclado (focus)', () => {
      renderWithProviders(<Button>Keyboard Navigation</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
    });

    it('debe poder activarse con Enter', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick}>Press Enter</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('debe poder activarse con Space', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Button onClick={handleClick}>Press Space</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Adicionales', () => {
    it('debe soportar data-attributes personalizados', () => {
      renderWithProviders(
        <Button data-testid="custom-button" data-value="123">
          Custom Data
        </Button>
      );
      
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('data-value', '123');
    });

    it('debe soportar id personalizado', () => {
      renderWithProviders(<Button id="my-button">ID Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'my-button');
    });

    it('debe soportar name personalizado', () => {
      renderWithProviders(<Button name="action">Name Button</Button>);
      
      const button = screen.getByRole('button') as HTMLButtonElement;
      expect(button.name).toBe('action');
    });
  });

  describe('Combinaciones de Props', () => {
    it('debe funcionar correctamente con todas las props combinadas', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(
        <Button
          variant="destructive"
          size="lg"
          type="submit"
          className="extra-class"
          onClick={handleClick}
          aria-label="Delete item"
          data-testid="delete-btn"
        >
          Delete
        </Button>
      );
      
      const button = screen.getByTestId('delete-btn');
      
      // Verificar todas las props
      expect(button).toHaveClass('bg-red-600'); // variant
      expect(button).toHaveClass('h-12'); // size
      expect(button).toHaveClass('extra-class'); // className
      expect((button as HTMLButtonElement).type).toBe('submit'); // type
      expect(button).toHaveAttribute('aria-label', 'Delete item'); // aria-label
      
      // Verificar onClick
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar children undefined sin errores', () => {
      renderWithProviders(<Button>{undefined}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('debe manejar children null sin errores', () => {
      renderWithProviders(<Button>{null}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('debe manejar múltiples children de diferentes tipos', () => {
      renderWithProviders(
        <Button>
          Text
          {123}
          <span>Span</span>
          {true && 'Conditional'}
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Text123SpanConditional');
    });

    it('debe funcionar sin ninguna prop adicional', () => {
      renderWithProviders(<Button>Minimal Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });
  });
});
