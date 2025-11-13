import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GestionFournisseurs } from '../GestionFournisseurs';

describe('GestionFournisseurs', () => {
  const mockSuppliers = {
    'Supplier1': {
      name: 'Supplier1',
      email: 'supplier1@example.com',
      leadTimeDays: 10,
      moq: 50,
      notes: 'Test notes'
    },
    'Supplier2': {
      name: 'Supplier2',
      email: 'supplier2@example.com',
      leadTimeDays: 15,
      moq: 100
    }
  };

  const mockProducts = [
    { sku: 'SKU1', supplier: 'Supplier1' },
    { sku: 'SKU2', supplier: 'Supplier1' },
    { sku: 'SKU3', supplier: 'Supplier2' }
  ];

  const defaultProps = {
    suppliers: mockSuppliers,
    products: mockProducts,
    onOpenModal: vi.fn(),
    onDelete: vi.fn()
  };

  it('should render title and count', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    expect(screen.getByText('🏭 Gestion des Fournisseurs')).toBeInTheDocument();
    expect(screen.getByText('2 fournisseur(s) actif(s)')).toBeInTheDocument();
  });

  it('should render new supplier button', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    expect(screen.getByText('Nouveau fournisseur')).toBeInTheDocument();
  });

  it('should call onOpenModal with null when new button clicked', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    const newButton = screen.getByText('Nouveau fournisseur');
    fireEvent.click(newButton);
    expect(defaultProps.onOpenModal).toHaveBeenCalledWith(null);
  });

  it('should render search input', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    expect(screen.getByPlaceholderText('🔍 Rechercher un fournisseur...')).toBeInTheDocument();
  });

  it('should render all suppliers', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    expect(screen.getByText('Supplier1')).toBeInTheDocument();
    expect(screen.getByText('Supplier2')).toBeInTheDocument();
  });

  it('should display supplier details', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    expect(screen.getByText('supplier1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Délai: 10j')).toBeInTheDocument();
    expect(screen.getByText('MOQ: 50 unités')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
  });

  it('should display product count for each supplier', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    const productCounts = screen.getAllByText(/\d+ produit\(s\) assigné\(s\)/);
    expect(productCounts).toHaveLength(2);
  });

  it('should filter suppliers by search term', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('🔍 Rechercher un fournisseur...');
    
    fireEvent.change(searchInput, { target: { value: 'Supplier1' } });
    
    expect(screen.getByText('Supplier1')).toBeInTheDocument();
    expect(screen.queryByText('Supplier2')).not.toBeInTheDocument();
  });

  it('should show no results message when no match', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('🔍 Rechercher un fournisseur...');
    
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    
    expect(screen.getByText('Aucun fournisseur trouvé')).toBeInTheDocument();
  });

  it('should show empty state when no suppliers', () => {
    render(<GestionFournisseurs {...defaultProps} suppliers={{}} />);
    expect(screen.getByText('Aucun fournisseur créé')).toBeInTheDocument();
  });

  it('should call onOpenModal with supplier when edit clicked', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[0]);
    expect(defaultProps.onOpenModal).toHaveBeenCalledWith(mockSuppliers.Supplier1);
  });

  it('should call onDelete when delete button clicked', () => {
    render(<GestionFournisseurs {...defaultProps} />);
    const deleteButtons = screen.getAllByTitle('Supprimer');
    fireEvent.click(deleteButtons[0]);
    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockSuppliers.Supplier1);
  });

  it('should log an error when callbacks are missing instead of throwing', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <GestionFournisseurs
        suppliers={mockSuppliers}
        products={mockProducts}
      />
    );

    fireEvent.click(screen.getByText('Nouveau fournisseur'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('onOpenModal'));

    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[0]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('onOpenModal'));

    const deleteButtons = screen.getAllByTitle('Supprimer');
    fireEvent.click(deleteButtons[0]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('onDelete'));

    consoleSpy.mockRestore();
  });
});

