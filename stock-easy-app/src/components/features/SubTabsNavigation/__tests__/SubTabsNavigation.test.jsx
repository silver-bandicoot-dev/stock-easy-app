import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubTabsNavigation } from '../SubTabsNavigation';

const DummyIcon = () => <svg data-testid="dummy-icon" />;

const tabs = [
  { id: 'general', label: 'Général', icon: DummyIcon },
  { id: 'products', label: 'Produits', icon: DummyIcon },
  { id: 'suppliers', label: 'Fournisseurs', icon: DummyIcon },
  { id: 'mapping', label: 'Mapping', icon: DummyIcon }
];

describe('SubTabsNavigation', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render all sub tabs', () => {
    render(
      <SubTabsNavigation
        tabs={tabs}
        activeTab="general"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Général')).toBeInTheDocument();
    expect(screen.getByText('Produits')).toBeInTheDocument();
    expect(screen.getByText('Fournisseurs')).toBeInTheDocument();
    expect(screen.getByText('Mapping')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    const { container } = render(
      <SubTabsNavigation
        tabs={tabs}
        activeTab="products"
        onChange={mockOnChange}
      />
    );

    const productsButton = screen.getByText('Produits').closest('button');
    expect(productsButton?.className).toContain('text-[#8B5CF6]');
    expect(productsButton?.className).toContain('border-[#8B5CF6]');

    const generalButton = screen.getByText('Général').closest('button');
    expect(generalButton?.className).not.toContain('border-[#8B5CF6]');

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(tabs.length);
  });

  it('should call onChange when tab is clicked', () => {
    render(
      <SubTabsNavigation
        tabs={tabs}
        activeTab="general"
        onChange={mockOnChange}
      />
    );

    const suppliersTab = screen.getByText('Fournisseurs');
    fireEvent.click(suppliersTab);

    expect(mockOnChange).toHaveBeenCalledWith('suppliers');
  });

  it('should render icons for each tab', () => {
    const { container } = render(
      <SubTabsNavigation
        tabs={tabs}
        activeTab="general"
        onChange={mockOnChange}
      />
    );

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(tabs.length);
  });

  it('should not highlight inactive tabs', () => {
    render(
      <SubTabsNavigation
        tabs={tabs}
        activeTab="general"
        onChange={mockOnChange}
      />
    );

    const productsButton = screen.getByText('Produits').closest('button');
    expect(productsButton?.className).toContain('text-[#666663]');
    expect(productsButton?.className).not.toContain('border-[#8B5CF6]');
  });
});
