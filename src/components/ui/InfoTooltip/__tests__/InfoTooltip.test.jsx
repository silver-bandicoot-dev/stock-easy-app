import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InfoTooltip, tooltips } from '../InfoTooltip';

describe('InfoTooltip', () => {
  it('should render info icon', () => {
    render(<InfoTooltip content="Test content" />);
    const button = screen.getByRole('button', { name: /plus d'informations/i });
    expect(button).toBeInTheDocument();
  });

  it('should show tooltip on mouse enter', () => {
    render(<InfoTooltip content="Test tooltip content" />);
    const button = screen.getByRole('button', { name: /plus d'informations/i });
    
    // Initialement, le tooltip n'est pas visible
    expect(screen.queryByText('Test tooltip content')).not.toBeInTheDocument();
    
    // Au survol, le tooltip apparaît
    fireEvent.mouseEnter(button);
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
  });

  it('should hide tooltip on mouse leave', () => {
    render(<InfoTooltip content="Test tooltip content" />);
    const button = screen.getByRole('button', { name: /plus d'informations/i });
    
    // Afficher le tooltip
    fireEvent.mouseEnter(button);
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
    
    // Cacher le tooltip
    fireEvent.mouseLeave(button);
    expect(screen.queryByText('Test tooltip content')).not.toBeInTheDocument();
  });

  it('should have predefined tooltip texts', () => {
    expect(tooltips).toBeDefined();
    expect(tooltips.toOrder).toContain('point de commande');
    expect(tooltips.watch).toContain('surveiller');
    expect(tooltips.inTransit).toContain('en cours');
  });
});









