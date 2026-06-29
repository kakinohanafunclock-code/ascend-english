import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Today } from './Today';
import { renderWithApp } from '../../../tests/utils/renderApp';
import { Repository } from '../../data/repository';
import { createMemoryStore } from '../../data/kv';
import { generateCurriculum } from '../../domain';
import { todayISO } from '../../app/selectors';
import { makeAttempt } from '../lib/record';

async function seedCurriculum(repo: Repository) {
  const curriculum = generateCurriculum({
    startScores: { reading: 18, listening: 18, speaking: 18, writing: 18 },
    goalScore: 105,
    weeks: 1,
    startDateISO: todayISO(),
  });
  await repo.saveCurriculum(curriculum);
  return curriculum;
}

describe('Today screen — completion distinction', () => {
  it('shows 0 completed when no attempts exist today', async () => {
    const repo = new Repository(createMemoryStore());
    const curriculum = await seedCurriculum(repo);
    const total = curriculum.weeks[0].days[0].tasks.length;

    renderWithApp(<Today />, { repo });

    expect(await screen.findByText(new RegExp(`本日の進捗 0 / ${total} 完了`))).toBeInTheDocument();
    expect(screen.queryByText('完了', { selector: '.tag' })).not.toBeInTheDocument();
  });

  it('marks a task completed once an attempt of that skill is recorded today', async () => {
    const repo = new Repository(createMemoryStore());
    const curriculum = await seedCurriculum(repo);
    const firstSkill = curriculum.weeks[0].days[0].tasks[0].skill;
    await repo.addAttempt(
      makeAttempt({ skill: firstSkill, taskId: 't', durationMin: 15, score: 20 }),
    );

    renderWithApp(<Today />, { repo });

    // Progress now reflects at least one completed task and a 完了 tag is shown.
    expect(await screen.findByText(/本日の進捗 [1-9]\d* \//)).toBeInTheDocument();
    expect(screen.getAllByText('完了').length).toBeGreaterThan(0);
  });
});
