import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, Check, AlertCircle, Trash2, Send } from 'lucide-react';
import { useApp } from '../../app/store';
import {
  notificationPermission,
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
  showReminderNow,
  notificationSupported,
} from '../../notifications/reminders';

export function Settings() {
  const { settings, updateSettings, resetAll } = useApp();
  const navigate = useNavigate();
  const [permission, setPermission] = useState<NotificationPermission>(notificationPermission());
  const supported = notificationSupported();

  // Keep the in-app daily scheduler in sync with settings + permission.
  useEffect(() => {
    if (settings.reminderEnabled && permission === 'granted') {
      scheduleDailyReminder(settings.reminderTime);
    } else {
      cancelDailyReminder();
    }
    return () => cancelDailyReminder();
  }, [settings.reminderEnabled, settings.reminderTime, permission]);

  async function enableNotifications() {
    const p = await requestNotificationPermission();
    setPermission(p);
    if (p === 'granted') await updateSettings({ reminderEnabled: true });
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {/* Reminders */}
      <section className="card card-pad flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-accent" />
          <h2 className="text-h2 font-semibold">毎日のリマインド</h2>
        </div>

        {!supported && (
          <p className="text-small text-warning flex items-center gap-1.5">
            <AlertCircle size={14} /> このブラウザは通知に未対応です。
          </p>
        )}

        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <p className="text-small font-medium">通知の許可</p>
            <p className="text-micro text-ink-subtle mt-0.5">
              状態: {permission === 'granted' ? '許可済み' : permission === 'denied' ? '拒否' : '未設定'}
            </p>
          </div>
          {permission === 'granted' ? (
            <span className="tag text-positive border-positive">
              <Check size={12} /> 許可済み
            </span>
          ) : (
            <button className="btn-primary inline-flex w-auto" onClick={enableNotifications} disabled={!supported}>
              <BellRing size={15} /> 通知を有効化
            </button>
          )}
        </div>

        <label className="flex items-center justify-between">
          <span className="text-small font-medium">リマインドを受け取る</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-[color:var(--color-accent)]"
            checked={settings.reminderEnabled}
            onChange={(e) => updateSettings({ reminderEnabled: e.target.checked })}
          />
        </label>

        <div>
          <label className="field-label" htmlFor="reminder-time">
            通知時刻（毎日）
          </label>
          <input
            id="reminder-time"
            type="time"
            className="input w-40"
            value={settings.reminderTime}
            onChange={(e) => updateSettings({ reminderTime: e.target.value })}
          />
        </div>

        <button
          className="btn-secondary inline-flex w-auto"
          onClick={() => showReminderNow()}
          disabled={permission !== 'granted'}
        >
          <Send size={15} /> テスト通知を送る
        </button>
      </section>

      {/* Goal */}
      <section className="card card-pad flex flex-col gap-3">
        <h2 className="text-h2 font-semibold">目標スコア</h2>
        <div>
          <label className="field-label" htmlFor="goal">
            目標 TOEFL 合計（0–120）
          </label>
          <input
            id="goal"
            type="number"
            min={0}
            max={120}
            className="input w-40"
            value={settings.goalScore}
            onChange={(e) => updateSettings({ goalScore: Number(e.target.value) })}
          />
        </div>
      </section>

      {/* Data */}
      <section className="card card-pad flex flex-col gap-3">
        <h2 className="text-h2 font-semibold">データ</h2>
        <p className="text-small text-ink-muted">
          学習データはこの端末内（IndexedDB）にのみ保存されます。
        </p>
        <button
          className="btn-secondary inline-flex w-auto text-critical border-critical"
          onClick={async () => {
            await resetAll();
            navigate('/diagnostic');
          }}
        >
          <Trash2 size={15} /> すべてのデータを消去して最初からやり直す
        </button>
      </section>
    </div>
  );
}
