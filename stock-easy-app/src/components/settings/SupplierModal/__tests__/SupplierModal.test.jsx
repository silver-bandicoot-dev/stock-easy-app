import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SupplierModal } from '../SupplierModal';

describe('SupplierModal', () => {
  const mockFormData = {
    name: 'Test Supplier',
    email: 'test@example.com',
    leadTimeDays: 14,
    moq: 100,
    notes: 'Test notes'
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    formData: mockFormData,
    onChange: vi.fn(),
    onSave: vi.fn(),
    isEditing: false
  };

  it('should render modal when open', () => {
    render(<SupplierModal {...defaultProps} />);
    expect(screen.getByText('➕ Nouveau fournisseur')).toBeInTheDocument();
  });

  it('should show edit title when editing', () => {
    render(<SupplierModal {...defaultProps} isEditing={true} />);
    expect(screen.getByText('✏️ Modifier le fournisseur')).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(<SupplierModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Ex: Fournisseur France')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('contact@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Notes diverses...')).toBeInTheDocument();
  });

  it('should display form data values', () => {
    render(<SupplierModal {...defaultProps} />);
    expect(screen.getByDisplayValue('Test Supplier')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('14')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
  });

  it('should call onChange when name field changes', () => {
    render(<SupplierModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('Ex: Fournisseur France');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('name', 'New Name');
  });

  it('should call onChange when email field changes', () => {
    render(<SupplierModal {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('contact@example.com');
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('email', 'new@example.com');
  });

  it('should disable name field when editing', () => {
    render(<SupplierModal {...defaultProps} isEditing={true} />);
    const nameInput = screen.getByDisplayValue('Test Supplier');
    expect(nameInput).toBeDisabled();
  });

  it('should show info message when editing', () => {
    render(<SupplierModal {...defaultProps} isEditing={true} />);
    expect(screen.getByText(/Le nom ne peut pas être modifié/)).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', () => {
    render(<SupplierModal {...defaultProps} />);
    const saveButton = screen.getByText('💾 Enregistrer');
    fireEvent.click(saveButton);
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<SupplierModal {...defaultProps} />);
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should not render when closed', () => {
    render(<SupplierModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('➕ Nouveau fournisseur')).not.toBeInTheDocument();
  });
});

