import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ParametresGeneraux } from '../ParametresGeneraux';

describe('ParametresGeneraux', () => {
  const defaultProps = {
    seuilSurstock: 90,
    onUpdateSeuil: vi.fn().mockResolvedValue(true),
    devise: 'EUR',
    onUpdateDevise: vi.fn().mockResolvedValue(true),
    multiplicateur: 1.0,
    onUpdateMultiplicateur: vi.fn().mockResolvedValue(true)
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all sections', () => {
    render(<ParametresGeneraux {...defaultProps} />);
    expect(screen.getByText('💰 Devise par défaut')).toBeInTheDocument();
    expect(screen.getByText('📊 Seuil Surstock Profond')).toBeInTheDocument();
    expect(screen.getByText('📈 Multiplicateur par défaut')).toBeInTheDocument();
  });

  it('should display current currency', () => {
    render(<ParametresGeneraux {...defaultProps} />);
    expect(screen.getByText(/Devise sélectionnée :/)).toBeInTheDocument();
    expect(screen.getByText((content, element) => 
      element?.textContent === 'Devise sélectionnée : EUR'
    )).toBeInTheDocument();
  });

  it('should display current seuil', () => {
    render(<ParametresGeneraux {...defaultProps} />);
    expect(screen.getByText(/Valeur sélectionnée :/)).toBeInTheDocument();
    expect(screen.getByText((content, element) => 
      element?.textContent === 'Valeur sélectionnée : 90 jours'
    )).toBeInTheDocument();
  });

  it('should display current multiplicateur', () => {
    render(<ParametresGeneraux {...defaultProps} multiplicateur={1.5} />);
    expect(screen.getByText('1.5')).toBeInTheDocument();
  });

  it('should show save button when changes are made', () => {
    render(<ParametresGeneraux {...defaultProps} />);
    
    // Initially, no save button
    expect(screen.queryByText('Sauvegarder les paramètres')).not.toBeInTheDocument();
    
    // Change currency
    const usdButton = screen.getByText('USD');
    fireEvent.click(usdButton);
    
    // Save button should appear
    expect(screen.getByText('Sauvegarder les paramètres')).toBeInTheDocument();
    expect(screen.getByText('Vous avez des modifications non sauvegardées')).toBeInTheDocument();
  });

  it('should allow changing currency', () => {
    render(<ParametresGeneraux {...defaultProps} />);
    
    const usdButton = screen.getByText('USD');
    fireEvent.click(usdButton);
    
    expect(screen.getByText((content, element) => 
      element?.textContent === 'Devise sélectionnée : USD'
    )).toBeInTheDocument();
  });

  it('should allow changing seuil', () => {
    render(<ParametresGeneraux {...defaultProps} />);
    
    const button60 = screen.getByText('60 jours');
    fireEvent.click(button60);
    
    expect(screen.getByText((content, element) => 
      element?.textContent === 'Valeur sélectionnée : 60 jours'
    )).toBeInTheDocument();
  });

  it('should increment multiplicateur', () => {
    render(<ParametresGeneraux {...defaultProps} multiplicateur={1.0} />);
    
    const plusButton = screen.getByText('+').closest('button');
    fireEvent.click(plusButton);
    
    expect(screen.getByText('1.1')).toBeInTheDocument();
  });

  it('should decrement multiplicateur', () => {
    render(<ParametresGeneraux {...defaultProps} multiplicateur={1.0} />);
    
    const minusButton = screen.getByText('-').closest('button');
    fireEvent.click(minusButton);
    
    expect(screen.getByText('0.9')).toBeInTheDocument();
  });

  it('should not go below 0.1 for multiplicateur', () => {
    render(<ParametresGeneraux {...defaultProps} multiplicateur={0.2} />);
    
    const minusButton = screen.getByText('-').closest('button');
    fireEvent.click(minusButton);
    fireEvent.click(minusButton);
    
    expect(screen.getByText('0.1')).toBeInTheDocument();
  });

  it('should not go above 5 for multiplicateur', () => {
    render(<ParametresGeneraux {...defaultProps} multiplicateur={4.9} />);
    
    const plusButton = screen.getByText('+').closest('button');
    fireEvent.click(plusButton);
    fireEvent.click(plusButton);
    
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });

  it('should save changes when save button is clicked', async () => {
    render(<ParametresGeneraux {...defaultProps} />);
    
    // Make a change
    const usdButton = screen.getByText('USD');
    fireEvent.click(usdButton);
    
    // Click save
    const saveButton = screen.getByText('Sauvegarder les paramètres');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(defaultProps.onUpdateDevise).toHaveBeenCalledWith('USD');
    });
  });

  it('should show success message after save', async () => {
    render(<ParametresGeneraux {...defaultProps} />);
    
    // Make a change
    const usdButton = screen.getByText('USD');
    fireEvent.click(usdButton);
    
    // Click save
    const saveButton = screen.getByText('Sauvegarder les paramètres');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('✅ Paramètres sauvegardés avec succès !')).toBeInTheDocument();
    });
  });

  it('should cancel changes', () => {
    render(<ParametresGeneraux {...defaultProps} />);
    
    // Make a change
    const usdButton = screen.getByText('USD');
    fireEvent.click(usdButton);
    
    expect(screen.getByText('Vous avez des modifications non sauvegardées')).toBeInTheDocument();
    
    // Click cancel
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);
    
    // Should revert to EUR
    expect(screen.getByText((content, element) => 
      element?.textContent === 'Devise sélectionnée : EUR'
    )).toBeInTheDocument();
    
    // Warning should disappear
    expect(screen.queryByText('Vous avez des modifications non sauvegardées')).not.toBeInTheDocument();
  });

  it('should disable buttons while saving', async () => {
    const slowOnUpdate = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<ParametresGeneraux {...defaultProps} onUpdateDevise={slowOnUpdate} />);
    
    const usdButton = screen.getByText('USD');
    fireEvent.click(usdButton);
    
    const saveButton = screen.getByText('Sauvegarder les paramètres');
    fireEvent.click(saveButton);
    
    // Button should be disabled and show loading text
    expect(screen.getByText('Sauvegarde...')).toBeInTheDocument();
  });
});

