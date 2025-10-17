import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MappingSKUFournisseur } from '../MappingSKUFournisseur';

describe('MappingSKUFournisseur', () => {
  const mockSuppliers = {
    'Supplier1': {
      name: 'Supplier1',
      email: 'supplier1@example.com',
      leadTimeDays: 10,
      moq: 50
    }
  };

  const mockProducts = [
    { sku: 'SKU1', name: 'Product 1', stock: 100, supplier: 'Supplier1' },
    { sku: 'SKU2', name: 'Product 2', stock: 50, supplier: null },
    { sku: 'SKU3', name: 'Product 3', stock: 75, supplier: 'Supplier1' }
  ];

  const defaultProps = {
    products: mockProducts,
    suppliers: mockSuppliers,
    onOpenAssignModal: vi.fn(),
    onRemoveSupplier: vi.fn()
  };

  it('should render title and description', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    expect(screen.getByText('🔗 Mapping Produits ↔ Fournisseurs')).toBeInTheDocument();
    expect(screen.getByText('Associez chaque produit à son fournisseur principal')).toBeInTheDocument();
  });

  it('should display correct statistics', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    expect(screen.getByText('3')).toBeInTheDocument(); // Total
    expect(screen.getByText('2')).toBeInTheDocument(); // With supplier
    expect(screen.getByText('1')).toBeInTheDocument(); // Without supplier
  });

  it('should render search input', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    expect(screen.getByPlaceholderText('🔍 Rechercher un produit...')).toBeInTheDocument();
  });

  it('should render filter dropdown', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render all products by default', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    expect(screen.getByText('SKU1')).toBeInTheDocument();
    expect(screen.getByText('SKU2')).toBeInTheDocument();
    expect(screen.getByText('SKU3')).toBeInTheDocument();
  });

  it('should filter products by search term', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('🔍 Rechercher un produit...');
    
    fireEvent.change(searchInput, { target: { value: 'SKU1' } });
    
    expect(screen.getByText('SKU1')).toBeInTheDocument();
    expect(screen.queryByText('SKU2')).not.toBeInTheDocument();
  });

  it('should filter products without supplier', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    const filterSelect = screen.getByRole('combobox');
    
    fireEvent.change(filterSelect, { target: { value: 'without_supplier' } });
    
    expect(screen.queryByText('SKU1')).not.toBeInTheDocument();
    expect(screen.getByText('SKU2')).toBeInTheDocument();
    expect(screen.queryByText('SKU3')).not.toBeInTheDocument();
  });

  it('should filter products with supplier', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    const filterSelect = screen.getByRole('combobox');
    
    fireEvent.change(filterSelect, { target: { value: 'with_supplier' } });
    
    expect(screen.getByText('SKU1')).toBeInTheDocument();
    expect(screen.queryByText('SKU2')).not.toBeInTheDocument();
    expect(screen.getByText('SKU3')).toBeInTheDocument();
  });

  it('should show "no supplier" message for products without supplier', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    expect(screen.getByText('Aucun fournisseur assigné')).toBeInTheDocument();
  });

  it('should display supplier details for assigned products', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    // Use getAllByText because 2 products have the same supplier
    const emails = screen.getAllByText('supplier1@example.com');
    expect(emails.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Délai: 10j').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MOQ: 50').length).toBeGreaterThan(0);
  });

  it('should call onOpenAssignModal when assign button clicked', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    const assignButton = screen.getByText('Assigner');
    fireEvent.click(assignButton);
    expect(defaultProps.onOpenAssignModal).toHaveBeenCalledWith(mockProducts[1]);
  });

  it('should call onRemoveSupplier when remove button clicked', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    const removeButtons = screen.getAllByTitle('Retirer le fournisseur');
    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemoveSupplier).toHaveBeenCalledWith('SKU1');
  });

  it('should call onOpenAssignModal when change supplier button clicked', () => {
    render(<MappingSKUFournisseur {...defaultProps} />);
    const changeButtons = screen.getAllByTitle('Changer de fournisseur');
    fireEvent.click(changeButtons[0]);
    expect(defaultProps.onOpenAssignModal).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('should show empty state when no products match', () => {
    render(<MappingSKUFournisseur {...defaultProps} products={[]} />);
    expect(screen.getByText('Aucun produit trouvé')).toBeInTheDocument();
  });
});

