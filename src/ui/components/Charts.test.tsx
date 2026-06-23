import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBar, ProgressRing, LineChart, StatCard } from './Charts';

describe('Charts (SVG, no image assets)', () => {
  it('ScoreBar shows the label and rounded value', () => {
    render(<ScoreBar label="Reading" score={23.6} />);
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('ProgressRing renders an SVG', () => {
    const { container } = render(<ProgressRing percent={40} />);
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelectorAll('circle').length).toBe(2);
  });

  it('LineChart renders a path for the series', () => {
    const { container } = render(
      <LineChart series={[{ name: 'total', points: [60, 70, 80] }]} max={120} />,
    );
    expect(screen.getByRole('img', { name: /score trend/i })).toBeInTheDocument();
    expect(container.querySelector('path')).toBeTruthy();
  });

  it('StatCard renders value and sub', () => {
    render(<StatCard label="推定 TOEFL" value={88} sub="目標 105" />);
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('目標 105')).toBeInTheDocument();
  });
});
