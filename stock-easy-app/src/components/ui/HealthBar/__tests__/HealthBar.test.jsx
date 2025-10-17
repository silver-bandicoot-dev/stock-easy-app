import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthBar } from '../HealthBar';

describe('HealthBar', () => {
  it('should render progressbar', () => {
    render(<HealthBar percentage={50} status="healthy" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('should have correct aria attributes', () => {
    render(<HealthBar percentage={75} status="warning" />);
    const progressbar = screen.getByRole('progressbar');
    
    expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should apply healthy color class', () => {
    const { container } = render(<HealthBar percentage={80} status="healthy" />);
    const bar = container.querySelector('.bg-green-600');
    expect(bar).toBeInTheDocument();
  });

  it('should apply warning color class', () => {
    const { container } = render(<HealthBar percentage={50} status="warning" />);
    const bar = container.querySelector('.bg-orange-500');
    expect(bar).toBeInTheDocument();
  });

  it('should apply urgent color class', () => {
    const { container } = render(<HealthBar percentage={20} status="urgent" />);
    const bar = container.querySelector('.bg-red-600');
    expect(bar).toBeInTheDocument();
  });

  it('should clamp percentage between 5 and 100', () => {
    const { rerender, container } = render(<HealthBar percentage={0} status="urgent" />);
    let bar = container.querySelector('[role="progressbar"]');
    // Minimum width is 5%
    expect(bar.style.width).toBe('5%');

    rerender(<HealthBar percentage={150} status="healthy" />);
    bar = container.querySelector('[role="progressbar"]');
    // Maximum width is 100%
    expect(bar.style.width).toBe('100%');
  });
});

