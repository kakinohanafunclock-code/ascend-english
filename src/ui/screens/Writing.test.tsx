import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Writing } from './Writing';
import { renderWithApp, mockAi } from '../../../tests/utils/renderApp';

const ESSAY =
  'I agree that students should take courses outside their major because a broad education ' +
  'builds critical thinking and exposes learners to diverse perspectives that strengthen judgement.';

describe('Writing screen', () => {
  it('shows AI feedback parsed from a valid JSON response', async () => {
    const user = userEvent.setup();
    const ai = mockAi(() =>
      JSON.stringify({
        estimatedScore: 4,
        rubric: { taskResponse: 4, coherence: 4, languageUse: 4 },
        strengths: ['clear thesis statement'],
        improvements: ['add one more example'],
        correctedText: 'A polished version.',
      }),
    );
    renderWithApp(<Writing />, { ai });

    const textarea = await screen.findByLabelText('あなたのエッセイ');
    await user.click(textarea);
    await user.paste(ESSAY);
    await user.click(screen.getByRole('button', { name: /AI 添削を受ける/ }));

    expect(await screen.findByText('AI 添削')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument(); // 4/5*30 scaled
    expect(screen.getByText('clear thesis statement')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('falls back to local scoring when the AI returns junk', async () => {
    const user = userEvent.setup();
    const ai = mockAi(() => 'totally not json');
    renderWithApp(<Writing />, { ai });

    const textarea = await screen.findByLabelText('あなたのエッセイ');
    await user.click(textarea);
    await user.paste(ESSAY);
    await user.click(screen.getByRole('button', { name: /AI 添削を受ける/ }));

    expect(await screen.findByText('ローカル簡易採点')).toBeInTheDocument();
  });
});
