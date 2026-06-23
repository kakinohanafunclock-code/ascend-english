import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Vocabulary } from './Vocabulary';
import { renderWithApp } from '../../../tests/utils/renderApp';
import { Repository } from '../../data/repository';
import { createMemoryStore } from '../../data/kv';

describe('Vocabulary screen', () => {
  it('seeds the base deck and lists words', async () => {
    const user = userEvent.setup();
    const repo = new Repository(createMemoryStore());
    renderWithApp(<Vocabulary />, { repo });

    await user.click(await screen.findByRole('button', { name: /基本デッキを追加/ }));
    await waitFor(async () => {
      expect((await repo.getVocab()).length).toBeGreaterThan(10);
    });
    expect(screen.getByText('mitigate')).toBeInTheDocument();
  });

  it('adds and removes a custom word', async () => {
    const user = userEvent.setup();
    const repo = new Repository(createMemoryStore());
    renderWithApp(<Vocabulary />, { repo });

    await user.type(await screen.findByLabelText('単語'), 'serendipity');
    await user.type(screen.getByLabelText('意味（日本語）'), '思いがけない幸運');
    await user.click(screen.getByRole('button', { name: '追加' }));

    expect(await screen.findByText('serendipity')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'serendipity を削除' }));
    await waitFor(() => {
      expect(screen.queryByText('serendipity')).not.toBeInTheDocument();
    });
  });

  it('runs a flashcard review and schedules the card forward on "覚えた"', async () => {
    const user = userEvent.setup();
    const repo = new Repository(createMemoryStore());
    renderWithApp(<Vocabulary />, { repo });

    await user.type(await screen.findByLabelText('単語'), 'arbitrary');
    await user.type(screen.getByLabelText('意味（日本語）'), '恣意的な');
    await user.click(screen.getByRole('button', { name: '追加' }));

    await user.click(await screen.findByRole('button', { name: /復習を始める/ }));
    await user.click(await screen.findByRole('button', { name: '意味を表示' }));
    expect(screen.getByText('恣意的な')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /覚えた/ }));

    // Card promoted out of box 1 (no longer due today).
    await waitFor(async () => {
      const words = await repo.getVocab();
      expect(words[0].box).toBe(2);
    });
  });
});
