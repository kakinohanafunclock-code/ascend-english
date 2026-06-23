import { test, expect } from '@playwright/test';
import { DIAGNOSTIC } from '../../src/content';

const ESSAY =
  'I agree that universities should require courses outside the major because a broad ' +
  'education develops critical thinking, exposes students to diverse perspectives, and ' +
  'prepares graduates for a complex world where problems rarely fit one discipline. ' +
  'For example, an engineer who studies ethics builds safer and more humane systems.';

test('full journey: diagnostic → today → writing AI correction → dashboard → reminders', async ({
  page,
}) => {
  await page.goto('/');
  // Redirects to the diagnostic on first run.
  await expect(page.getByText('レベル診断')).toBeVisible();

  // Answer every diagnostic item with the correct option.
  for (const q of DIAGNOSTIC) {
    const optionText = q.options[q.answerIndex];
    await page.locator('button', { hasText: optionText }).first().click();
  }
  await page.getByRole('button', { name: '診断する' }).click();
  await page.getByRole('button', { name: '結果を見る' }).click();
  await expect(page.getByText('推定スコア')).toBeVisible();
  await page.getByRole('button', { name: /学習を始める/ }).click();

  // Dashboard.
  await expect(page.getByText('推定 TOEFL')).toBeVisible();
  await expect(page.getByText('技能別スコア')).toBeVisible();

  // Today's plan exists. (Labels appear in both the sidebar and mobile bottom nav,
  // so match exactly and take the first/visible one.)
  await page.getByRole('link', { name: '今日のタスク', exact: true }).first().click();
  await expect(page.getByText('本日の30分プラン')).toBeVisible();

  // Writing → AI correction (falls back to local scoring when no API key in CI).
  await page.getByRole('link', { name: 'Writing', exact: true }).first().click();
  await page.getByLabel('あなたのエッセイ').fill(ESSAY);
  await page.getByRole('button', { name: /AI 添削を受ける/ }).click();
  await expect(page.getByRole('heading', { name: 'AI 添削', exact: true })).toBeVisible();
  await expect(page.getByText('/ 30 換算スコア目安')).toBeVisible();

  // Dashboard reflects the completed writing attempt (study time recorded).
  await page.getByRole('link', { name: 'ダッシュボード', exact: true }).first().click();
  await expect(page.getByText('総学習時間')).toBeVisible();

  // Vocabulary: seed the base deck and verify a word appears + review is offered.
  await page.getByRole('link', { name: '単語', exact: true }).first().click();
  await page.getByRole('button', { name: /基本デッキを追加/ }).click();
  await expect(page.getByText('mitigate')).toBeVisible();
  await expect(page.getByRole('button', { name: /復習を始める/ })).toBeEnabled();

  // Reminder settings + notification permission flow.
  await page.getByRole('link', { name: '設定', exact: true }).first().click();
  await expect(page.getByText('毎日のリマインド')).toBeVisible();
  // Drive the permission flow: the context grants notifications, so requesting
  // resolves to "granted". If already granted, the enable button is absent.
  const enableBtn = page.getByRole('button', { name: '通知を有効化' });
  if (await enableBtn.count()) {
    await enableBtn.click();
  }
  await expect(page.getByText('許可済み').first()).toBeVisible();
  await page.getByLabel('通知時刻（毎日）').fill('07:30');
  await page.getByRole('button', { name: 'テスト通知を送る' }).click();
  // No crash, value persisted in the input.
  await expect(page.getByLabel('通知時刻（毎日）')).toHaveValue('07:30');
});
