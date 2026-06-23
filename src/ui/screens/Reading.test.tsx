import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Reading } from './Reading';
import { READING_LESSONS } from '../../content';
import { renderWithApp } from '../../../tests/utils/renderApp';
import { Repository } from '../../data/repository';
import { createMemoryStore } from '../../data/kv';

describe('Reading screen', () => {
  it('records study time as the lesson estimated minutes (not elapsed time)', async () => {
    const user = userEvent.setup();
    const repo = new Repository(createMemoryStore());
    renderWithApp(<Reading />, { repo });

    const lesson = READING_LESSONS[0];
    for (const q of lesson.questions) {
      await user.click(await screen.findByText(q.options[q.answerIndex]));
    }
    await user.click(screen.getByRole('button', { name: '採点する' }));
    await user.click(screen.getByRole('button', { name: '完了' }));

    await waitFor(async () => {
      const attempts = await repo.getAttempts();
      expect(attempts).toHaveLength(1);
      expect(attempts[0].durationMin).toBe(lesson.estimatedMinutes);
      expect(attempts[0].skill).toBe('reading');
    });
  });
});
