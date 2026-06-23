import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Diagnostic } from './Diagnostic';
import { DIAGNOSTIC } from '../../content';
import { renderWithApp } from '../../../tests/utils/renderApp';
import { Repository } from '../../data/repository';
import { createMemoryStore } from '../../data/kv';

describe('Diagnostic flow', () => {
  it('grades the diagnostic, shows an estimate, and creates a profile + curriculum', async () => {
    const user = userEvent.setup();
    const repo = new Repository(createMemoryStore());
    renderWithApp(<Diagnostic />, { repo, route: '/diagnostic' });

    // Answer every item correctly.
    for (const q of DIAGNOSTIC) {
      const option = await screen.findByText(q.options[q.answerIndex]);
      await user.click(option);
    }
    await user.click(screen.getByRole('button', { name: '診断する' }));
    await user.click(screen.getByRole('button', { name: '結果を見る' }));

    expect(await screen.findByText('推定スコア')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /学習を始める/ }));

    await waitFor(async () => {
      expect(await repo.getProfile()).toBeTruthy();
    });
    const profile = await repo.getProfile();
    expect(profile?.goalScore).toBe(105);
    const curriculum = await repo.getCurriculum();
    expect(curriculum?.weeks.length).toBeGreaterThan(0);
  });
});
