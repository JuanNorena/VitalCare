/**
 * @vitest-environment jsdom
 * 
 * Pruebas unitarias para los componentes de Card.
 * 
 * Este archivo contiene tests exhaustivos para verificar:
 * - Renderizado correcto de todos los subcomponentes
 * - Composición de Card completo
 * - Clases CSS personalizadas
 * - Accesibilidad
 * - Props HTML estándar
 * 
 * @group ui-components
 * @group card
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../helpers/testUtils';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('debe renderizar el Card correctamente', () => {
      renderWithProviders(<Card>Card Content</Card>);
      
      const card = screen.getByText('Card Content');
      expect(card).toBeInTheDocument();
    });

    it('debe aplicar clases CSS base', () => {
      renderWithProviders(<Card data-testid="card">Content</Card>);
      
      const card = screen.getByTestId('card');
      // Verificar clases principales
      expect(card).toHaveClass('rounded-xl', 'border', 'shadow-sm');
      expect(card.className).toContain('bg-[var(--vc-card-bg)]');
    });

    it('debe aplicar className personalizado', () => {
      renderWithProviders(
        <Card className="custom-class" data-testid="card">Content</Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-xl'); // Mantiene clases base
    });

    it('debe renderizar como un div por defecto', () => {
      renderWithProviders(<Card data-testid="card">Content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card.tagName).toBe('DIV');
    });
  });

  describe('CardHeader', () => {
    it('debe renderizar el CardHeader correctamente', () => {
      renderWithProviders(<CardHeader>Header Content</CardHeader>);
      
      const header = screen.getByText('Header Content');
      expect(header).toBeInTheDocument();
    });

    it('debe aplicar clases CSS base', () => {
      renderWithProviders(
        <CardHeader data-testid="header">Content</CardHeader>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
    });

    it('debe aplicar className personalizado', () => {
      renderWithProviders(
        <CardHeader className="custom-header" data-testid="header">
          Content
        </CardHeader>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('flex'); // Mantiene clases base
    });
  });

  describe('CardTitle', () => {
    it('debe renderizar el CardTitle correctamente', () => {
      renderWithProviders(<CardTitle>Card Title</CardTitle>);
      
      const title = screen.getByText('Card Title');
      expect(title).toBeInTheDocument();
    });

    it('debe aplicar clases CSS base con tamaño de fuente', () => {
      renderWithProviders(
        <CardTitle data-testid="title">Title</CardTitle>
      );
      
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight');
    });

    it('debe renderizar como h3 por defecto', () => {
      renderWithProviders(
        <CardTitle data-testid="title">Title</CardTitle>
      );
      
      const title = screen.getByTestId('title');
      expect(title.tagName).toBe('H3');
    });
  });

  describe('CardDescription', () => {
    it('debe renderizar el CardDescription correctamente', () => {
      renderWithProviders(
        <CardDescription>Card Description</CardDescription>
      );
      
      const description = screen.getByText('Card Description');
      expect(description).toBeInTheDocument();
    });

    it('debe aplicar estilos de texto gris', () => {
      renderWithProviders(
        <CardDescription data-testid="description">
          Description
        </CardDescription>
      );
      
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-sm');
    });

    it('debe renderizar como p por defecto', () => {
      renderWithProviders(
        <CardDescription data-testid="description">
          Description
        </CardDescription>
      );
      
      const description = screen.getByTestId('description');
      expect(description.tagName).toBe('P');
    });
  });

  describe('CardContent', () => {
    it('debe renderizar el CardContent correctamente', () => {
      renderWithProviders(<CardContent>Card Content</CardContent>);
      
      const content = screen.getByText('Card Content');
      expect(content).toBeInTheDocument();
    });

    it('debe aplicar padding', () => {
      renderWithProviders(
        <CardContent data-testid="content">Content</CardContent>
      );
      
      const content = screen.getByTestId('content');
      // Verifica padding responsivo (p-4 base, sm:p-6 para pantallas grandes)
      expect(content).toHaveClass('p-4', 'pt-0');
      expect(content.className).toContain('sm:p-6');
    });

    it('debe renderizar como div por defecto', () => {
      renderWithProviders(
        <CardContent data-testid="content">Content</CardContent>
      );
      
      const content = screen.getByTestId('content');
      expect(content.tagName).toBe('DIV');
    });
  });

  describe('CardFooter', () => {
    it('debe renderizar el CardFooter correctamente', () => {
      renderWithProviders(<CardFooter>Footer Content</CardFooter>);
      
      const footer = screen.getByText('Footer Content');
      expect(footer).toBeInTheDocument();
    });

    it('debe aplicar flexbox y padding', () => {
      renderWithProviders(
        <CardFooter data-testid="footer">Footer</CardFooter>
      );
      
      const footer = screen.getByTestId('footer');
      // Verifica flexbox y padding responsivo
      expect(footer).toHaveClass('flex', 'items-center', 'p-4', 'pt-0');
      expect(footer.className).toContain('sm:p-6');
    });

    it('debe renderizar como div por defecto', () => {
      renderWithProviders(
        <CardFooter data-testid="footer">Footer</CardFooter>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer.tagName).toBe('DIV');
    });
  });

  describe('Composición Completa', () => {
    it('debe renderizar una Card completa con todos sus componentes', () => {
      renderWithProviders(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      );
      
      expect(screen.getByTestId('full-card')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });

    it('debe mantener la estructura jerárquica correcta', () => {
      renderWithProviders(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');
      const content = screen.getByTestId('content');
      
      // Verificar que header y content son hijos de card
      expect(card).toContainElement(header);
      expect(card).toContainElement(content);
      
      // Verificar que title es hijo de header
      expect(header).toContainElement(title);
    });

    it('debe permitir composición parcial sin todos los componentes', () => {
      renderWithProviders(
        <Card data-testid="partial-card">
          <CardTitle>Only Title</CardTitle>
          <CardContent>Only Content</CardContent>
        </Card>
      );
      
      expect(screen.getByTestId('partial-card')).toBeInTheDocument();
      expect(screen.getByText('Only Title')).toBeInTheDocument();
      expect(screen.getByText('Only Content')).toBeInTheDocument();
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });
  });

  describe('Props HTML Estándar', () => {
    it('Card debe soportar data-attributes', () => {
      renderWithProviders(
        <Card data-testid="card" data-custom="value">
          Content
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('data-custom', 'value');
    });

    it('Card debe soportar id', () => {
      renderWithProviders(
        <Card id="my-card" data-testid="card">Content</Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'my-card');
    });

    it('CardContent debe soportar aria-label', () => {
      renderWithProviders(
        <CardContent aria-label="Main content" data-testid="content">
          Content
        </CardContent>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toHaveAttribute('aria-label', 'Main content');
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar children undefined sin errores', () => {
      renderWithProviders(<Card>{undefined}</Card>);
      
      expect(document.body).toBeInTheDocument();
    });

    it('debe manejar múltiples CardContent', () => {
      renderWithProviders(
        <Card data-testid="card">
          <CardContent>Content 1</CardContent>
          <CardContent>Content 2</CardContent>
        </Card>
      );
      
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('debe permitir anidación de Cards', () => {
      renderWithProviders(
        <Card data-testid="outer-card">
          <CardContent>
            <Card data-testid="inner-card">
              <CardContent>Nested Content</CardContent>
            </Card>
          </CardContent>
        </Card>
      );
      
      const outerCard = screen.getByTestId('outer-card');
      const innerCard = screen.getByTestId('inner-card');
      
      expect(outerCard).toContainElement(innerCard);
      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });
  });
});
