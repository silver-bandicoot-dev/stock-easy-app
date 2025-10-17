import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssignSupplierModal } from '../AssignSupplierModal';

describe('AssignSupplierModal', () => {
  const mockProduct = {
    sku: 'TEST-001',
    name: 'Test Product'
  };

  const mockSuppliers = {
    'Supplier1': { name: 'Supplier1', leadTimeDays: 10, moq: 50 },
    'Supplier2': { name: 'Supplier2', leadTimeDays: 15, moq: 100 }
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    product: mockProduct,
    suppliers: mockSuppliers,
    selectedSupplier: '',
    onSelectSupplier: vi.fn(),
    onAssign: vi.fn()
  };

  it('should render modal when open', () => {
    render(<AssignSupplierModal {...defaultProps} />);
    expect(screen.getByText('🔗 Assigner un fournisseur')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<AssignSupplierModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('🔗 Assigner un fournisseur')).not.toBeInTheDocument();
  });

  it('should display product information', () => {
    render(<AssignSupplierModal {...defaultProps} />);
    expect(screen.getByText(/TEST-001/)).toBeInTheDocument();
    expect(screen.getByText(/Test Product/)).toBeInTheDocument();
  });

  it('should render suppliers in select', () => {
    render(<AssignSupplierModal {...defaultProps} />);
    expect(screen.getByText(/Supplier1.*Délai: 10j.*MOQ: 50/)).toBeInTheDocument();
    expect(screen.getByText(/Supplier2.*Délai: 15j.*MOQ: 100/)).toBeInTheDocument();
  });

  it('should call onSelectSupplier when supplier is selected', () => {
    render(<AssignSupplierModal {...defaultProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Supplier1' } });
    expect(defaultProps.onSelectSupplier).toHaveBeenCalledWith('Supplier1');
  });

  it('should disable assign button when no supplier selected', () => {
    render(<AssignSupplierModal {...defaultProps} selectedSupplier="" />);
    const assignButton = screen.getByText('💾 Assigner');
    expect(assignButton).toBeDisabled();
  });

  it('should enable assign button when supplier is selected', () => {
    render(<AssignSupplierModal {...defaultProps} selectedSupplier="Supplier1" />);
    const assignButton = screen.getByText('💾 Assigner');
    expect(assignButton).not.toBeDisabled();
  });

  it('should call onAssign when assign button is clicked', () => {
    render(<AssignSupplierModal {...defaultProps} selectedSupplier="Supplier1" />);
    const assignButton = screen.getByText('💾 Assigner');
    fireEvent.click(assignButton);
    expect(defaultProps.onAssign).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<AssignSupplierModal {...defaultProps} />);
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show warning when no suppliers available', () => {
    render(<AssignSupplierModal {...defaultProps} suppliers={{}} />);
    expect(screen.getByText(/Aucun fournisseur disponible/)).toBeInTheDocument();
  });
});

