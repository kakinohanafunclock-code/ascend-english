import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, Check, AlertCircle, Trash2, Send, Cloud, RefreshCw, Copy } from 'lucide-react';
import { useApp } from '../../app/store';
import {
  notificationPermission,
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
  showReminderNow,
  notificationSupported,
} from '../../notifications/reminders';
import { pushConfigured, pushSupported, subscribeToPush } from '../../notifications/push';

export function Settings() {
  const { settings, updateSettings, resetAll, cloudConfigured, syncCode, syncNow, enableCloudSync, linkWithCode } =
    useApp();
  const [syncing, setSyncing] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const [permission, setPermission] = useState<NotificationPermission>(notificationPermission());
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const supported = notificationSupported();
  const canPush = pushSupported() && pushConfigured();

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

        {canPush && (
          <div className="border-t border-line pt-4">
            <p className="text-small font-medium">アプリを閉じていても通知（Web Push）</p>
            <p className="text-micro text-ink-subtle mt-0.5 mb-2">
              端末を登録すると、サーバから毎日定刻にプッシュ通知を配信します。
            </p>
            <button
              className="btn-secondary inline-flex w-auto"
              onClick={async () => {
                const sub = await subscribeToPush(settings.reminderTime);
                setPushSubscribed(Boolean(sub));
              }}
            >
              {pushSubscribed ? <Check size={15} className="text-positive" /> : <BellRing size={15} />}
              {pushSubscribed ? 'プッシュ登録済み' : 'この端末をプッシュ登録'}
            </button>
          </div>
        )}
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

      {/* Cloud sync */}
      <section className="card card-pad flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Cloud size={18} className="text-accent" />
          <h2 className="text-h2 font-semibold">クラウド同期（任意）</h2>
        </div>
        {cloudConfigured ? (
          <>
            <label className="flex items-center justify-between">
              <span className="text-small font-medium">クラウド同期を有効にする</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-[color:var(--color-accent)]"
                checked={settings.cloudSyncEnabled}
                onChange={async (e) => {
                  if (e.target.checked) {
                    await enableCloudSync();
                    setSyncMsg('この端末のデータをクラウドに保存しました。');
                  } else {
                    await updateSettings({ cloudSyncEnabled: false });
                    setSyncMsg(null);
                  }
                }}
              />
            </label>

            {settings.cloudSyncEnabled && syncCode && (
              <div className="rounded-token border border-line p-3 flex flex-col gap-2">
                <p className="text-micro text-ink-subtle">この端末の同期コード（他の端末で入力すると同じデータを使えます）</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-small tracking-wide">{syncCode}</code>
                  <button
                    className="btn-ghost inline-flex w-auto px-2 py-1"
                    onClick={() => navigator.clipboard?.writeText(syncCode)}
                  >
                    <Copy size={14} /> コピー
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-line pt-3">
              <label className="field-label" htmlFor="sync-code">別の端末の同期コードを入力して連携</label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="sync-code"
                  className="input w-48 font-mono"
                  placeholder="ABCD-EFGH-JKLM"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                />
                <button
                  className="btn-secondary inline-flex w-auto"
                  disabled={!codeInput.trim() || syncing}
                  onClick={async () => {
                    setSyncing(true);
                    const { pulled } = await linkWithCode(codeInput);
                    setSyncing(false);
                    setCodeInput('');
                    setSyncMsg(pulled ? 'データを取り込みました。' : 'そのコードのデータが見つかりませんでした。');
                  }}
                >
                  連携して取り込む
                </button>
              </div>
            </div>

            <button
              className="btn-secondary inline-flex w-auto"
              disabled={!settings.cloudSyncEnabled || syncing}
              onClick={async () => {
                setSyncing(true);
                await syncNow();
                setSyncing(false);
                setSyncMsg('同期しました。');
              }}
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /> 今すぐ同期
            </button>

            {syncMsg && <p className="text-small text-ink-muted">{syncMsg}</p>}
          </>
        ) : (
          <p className="text-small text-ink-muted">
            未設定です。<code className="text-micro">VITE_SUPABASE_URL</code> と{' '}
            <code className="text-micro">VITE_SUPABASE_ANON_KEY</code> を設定すると、端末間で
            学習データを同期できます（無料枠）。未設定でもアプリは端末内で完全に動作します。
          </p>
        )}
      </section>

      {/* Data */}
      <section className="card card-pad flex flex-col gap-3">
        <h2 className="text-h2 font-semibold">データ</h2>
        <p className="text-small text-ink-muted">
          学習データはこの端末内（IndexedDB）に保存されます{cloudConfigured && settings.cloudSyncEnabled ? '（クラウド同期 有効）' : ''}。
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
