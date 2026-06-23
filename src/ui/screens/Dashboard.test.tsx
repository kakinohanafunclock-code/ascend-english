import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { renderWithApp } from '../../../tests/utils/renderApp';
import { Repository, type Profile } from '../../data/repository';
import { createMemoryStore } from '../../data/kv';
import { makeAttempt } from '../lib/record';

const profile: Profile = {
  goalScore: 105,
  createdAt: '2026-06-23T00:00:00.000Z',
  diagnostic: { reading: 20, listening: 18, speaking: 16, writing: 22 },
  estimatedToefl: 76,
  estimatedSections: { reading: 20, listening: 18, speaking: 16, writing: 22 },
};

describe('Dashboard screen', () => {
  it('prompts for diagnostic when there is no profile', async () => {
    renderWithApp(<Dashboard />);
    expect(await screen.findByText(/まだ診断を受けていません/)).toBeInTheDocument();
  });

  it('renders stats, skill bars and a trend once a profile and attempts exist', async () => {
    const repo = new Repository(createMemoryStore());
    await repo.saveProfile(profile);
    await repo.addAttempt(makeAttempt({ skill: 'reading', taskId: 't', durationMin: 30, score: 24 }));

    renderWithApp(<Dashboard />, { repo });

    expect(await screen.findByText('推定 TOEFL')).toBeInTheDocument();
    expect(screen.getByText('技能別スコア')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('連続学習')).toBeInTheDocument();
    // trend chart present
    expect(screen.getByRole('img', { name: /score trend/i })).toBeInTheDocument();
  });
});
