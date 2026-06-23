import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Quiz } from './Quiz';
import type { MCQuestion } from '../../content';

const q: MCQuestion = {
  id: 'q1',
  skill: 'reading',
  difficulty: 3,
  prompt: 'Pick B',
  options: ['A', 'B'],
  answerIndex: 1,
  explanation: 'because B',
};

describe('Quiz', () => {
  it('grades answers and reports accuracy on completion', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Quiz questions={[q]} onComplete={onComplete} />);

    // Submit disabled until answered.
    expect(screen.getByRole('button', { name: '採点する' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /B/ }));
    await user.click(screen.getByRole('button', { name: '採点する' }));

    // Explanation shows after grading.
    expect(screen.getByText('because B')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '完了' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ correctCount: 1, accuracy: 1 });
  });

  it('marks a wrong answer as incorrect', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Quiz questions={[q]} onComplete={onComplete} />);
    await user.click(screen.getByRole('button', { name: /A/ }));
    await user.click(screen.getByRole('button', { name: '採点する' }));
    await user.click(screen.getByRole('button', { name: '完了' }));
    expect(onComplete.mock.calls[0][0]).toMatchObject({ correctCount: 0, accuracy: 0 });
  });
});
