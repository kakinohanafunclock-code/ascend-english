import { describe, it, expect } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Settings } from './Settings';
import { renderWithApp } from '../../../tests/utils/renderApp';
import { Repository } from '../../data/repository';
import { createMemoryStore } from '../../data/kv';

describe('Settings screen', () => {
  it('persists a changed reminder time', async () => {
    const repo = new Repository(createMemoryStore());
    renderWithApp(<Settings />, { repo });

    const timeInput = await screen.findByLabelText('通知時刻（毎日）');
    fireEvent.change(timeInput, { target: { value: '07:30' } });

    await waitFor(async () => {
      expect((await repo.getSettings()).reminderTime).toBe('07:30');
    });
  });

  it('persists the goal score', async () => {
    const repo = new Repository(createMemoryStore());
    renderWithApp(<Settings />, { repo });

    const goal = await screen.findByLabelText(/目標 TOEFL 合計/);
    fireEvent.change(goal, { target: { value: '110' } });

    await waitFor(async () => {
      expect((await repo.getSettings()).goalScore).toBe(110);
    });
  });

  it('reflects the persisted reminder time in the input', async () => {
    const repo = new Repository(createMemoryStore());
    await repo.saveSettings({ reminderTime: '06:15' });
    renderWithApp(<Settings />, { repo });
    const timeInput = (await screen.findByLabelText('通知時刻（毎日）')) as HTMLInputElement;
    expect(timeInput.value).toBe('06:15');
  });
});
