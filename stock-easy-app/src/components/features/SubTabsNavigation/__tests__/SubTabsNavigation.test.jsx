import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubTabsNavigation } from '../SubTabsNavigation';

describe('SubTabsNavigation', () => {
  const mockOnSubTabChange = vi.fn();

  beforeEach(() => {
    mockOnSubTabChange.mockClear();
  });

  it('should render all sub tabs', () => {
    render(<SubTabsNavigation activeSubTab="general" onSubTabChange={mockOnSubTabChange} />);
    
    expect(screen.getByText('Général')).toBeInTheDocument();
    expect(screen.getByText('Produits')).toBeInTheDocument();
    expect(screen.getByText('Fournisseurs')).toBeInTheDocument();
    expect(screen.getByText('Mapping')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    const { container } = render(
      <SubTabsNavigation activeSubTab="products" onSubTabChange={mockOnSubTabChange} />
    );
    
    const productsButton = screen.getByText('Produits').closest('button');
    expect(productsButton.className).toContain('text-[#8B5CF6]');
    expect(productsButton.className).toContain('border-[#8B5CF6]');
  });

  it('should call onSubTabChange when tab is clicked', () => {
    render(<SubTabsNavigation activeSubTab="general" onSubTabChange={mockOnSubTabChange} />);
    
    const suppliersTab = screen.getByText('Fournisseurs');
    fireEvent.click(suppliersTab);
    
    expect(mockOnSubTabChange).toHaveBeenCalledWith('suppliers');
  });

  it('should render icons for each tab', () => {
    const { container } = render(
      <SubTabsNavigation activeSubTab="general" onSubTabChange={mockOnSubTabChange} />
    );
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(4); // At least 4 tabs = 4 icons
  });

  it('should not highlight inactive tabs', () => {
    render(<SubTabsNavigation activeSubTab="general" onSubTabChange={mockOnSubTabChange} />);
    
    const productsButton = screen.getByText('Produits').closest('button');
    expect(productsButton.className).toContain('text-[#666663]');
    expect(productsButton.className).not.toContain('border-[#8B5CF6]');
  });
});

