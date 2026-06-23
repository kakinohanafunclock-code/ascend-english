import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import { Writing } from './Writing';
import { renderWithApp, mockAi } from '../../../tests/utils/renderApp';
import { Repository } from '../../data/repository';
import { createMemoryStore } from '../../data/kv';

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

  it('adds a glossary word from feedback to the word-book', async () => {
    const user = userEvent.setup();
    const repo = new Repository(createMemoryStore());
    const ai = mockAi(() =>
      JSON.stringify({
        estimatedScore: 3,
        rubric: { taskResponse: 3, coherence: 3, languageUse: 3 },
        strengths: ['ok'],
        improvements: ['more detail'],
        translationJa: '日本語訳の例。',
        glossary: [{ term: 'cohesion', meaning: '結束性' }],
      }),
    );
    renderWithApp(<Writing />, { repo, ai });

    const textarea = await screen.findByLabelText('あなたのエッセイ');
    await user.click(textarea);
    await user.paste(ESSAY);
    await user.click(screen.getByRole('button', { name: /AI 添削を受ける/ }));

    expect(await screen.findByText('日本語訳')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'cohesion を単語帳に追加' }));

    await waitFor(async () => {
      const words = await repo.getVocab();
      expect(words.map((w) => w.term)).toContain('cohesion');
    });
  });
});
