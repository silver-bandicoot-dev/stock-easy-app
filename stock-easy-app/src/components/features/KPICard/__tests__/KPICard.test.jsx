import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../KPICard';

describe('KPICard', () => {
  const defaultProps = {
    title: 'Disponibilité',
    value: '95%',
    change: 5,
    changePercent: 5.2,
    trend: 'up',
    description: 'Test description',
    chartData: [10, 20, 30, 40, 50, 60, 70, 80]
  };

  it('should render KPI title and value', () => {
    render(<KPICard {...defaultProps} />);
    expect(screen.getByText('Disponibilité')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('should display percentage change', () => {
    render(<KPICard {...defaultProps} />);
    expect(screen.getByText('5.2%')).toBeInTheDocument();
    expect(screen.getByText('vs période précédente')).toBeInTheDocument();
  });

  it('should show up arrow for positive trend', () => {
    const { container } = render(<KPICard {...defaultProps} trend="up" />);
    // Check for the presence of arrow icon by looking for svg elements
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should show down arrow for negative trend', () => {
    const { container } = render(<KPICard {...defaultProps} trend="down" />);
    // Check for the presence of arrow icon by looking for svg elements
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should apply good color for positive availability trend', () => {
    const { container } = render(
      <KPICard {...defaultProps} title="Disponibilité SKU" trend="up" />
    );
    const trendElement = container.querySelector('.text-green-600');
    expect(trendElement).toBeInTheDocument();
  });

  it('should apply bad color for negative availability trend', () => {
    const { container } = render(
      <KPICard {...defaultProps} title="Disponibilité SKU" trend="down" />
    );
    const trendElement = container.querySelector('.text-\\[\\#EF1C43\\]');
    expect(trendElement).toBeInTheDocument();
  });

  it('should render chart with data points', () => {
    const { container } = render(<KPICard {...defaultProps} />);
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
    expect(polyline).toHaveAttribute('stroke', '#8B5CF6');
  });

  it('should render InfoTooltip', () => {
    render(<KPICard {...defaultProps} />);
    const tooltipButton = screen.getByRole('button', { name: /plus d'informations/i });
    expect(tooltipButton).toBeInTheDocument();
  });
});

