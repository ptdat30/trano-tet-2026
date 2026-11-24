import React, { useState } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Upload,
  Download
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  fetchCloudPlan,
  pushCloudPlan,
  getDeviceId
} from '../lib/supabase';
import type { DayData, FinanceSettings, FixedScheduleItem } from '../types/finance';
import { soundFx } from '../utils/sound';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  days: DayData[];
  settings: FinanceSettings;
  schedules: FixedScheduleItem[];
  onApplyCloudData: (days: DayData[], settings: FinanceSettings, schedules: FixedScheduleItem[]) => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'unconfigured' | 'error';
  lastSyncedAt: Date | null;
}

const SQL_INIT_SCRIPT = `-- Chạy script này trong tab SQL Editor trên Supabase (an toàn chạy lại nhiều lần):
create table if not exists public.app_sync (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cấp toàn quyền truy cập cho anon (Publishable Key)
grant all on table public.app_sync to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated;

-- Cho phép đọc ghi đầy đủ
alter table public.app_sync enable row level security;
drop policy if exists "Allow all on app_sync" on public.app_sync;
create policy "Allow all on app_sync"
  on public.app_sync for all
  using (true)
  with check (true);

-- Bật đồng bộ Realtime qua WebSocket
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'app_sync'
  ) then
    alter publication supabase_realtime add table public.app_sync;
  end if;
end $$;
`;

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  days,
  settings,
  schedules,
  onApplyCloudData,
  syncStatus,
  lastSyncedAt
}) => {
  if (!isOpen) return null;

  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig?.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig?.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isCopiedSql, setIsCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_INIT_SCRIPT);
    setIsCopiedSql(true);
    setTimeout(() => setIsCopiedSql(false), 2000);
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setMessage({ text: 'Vui lòng điền đủ Supabase Project URL và Anon Key!', type: 'error' });
      return;
    }

    setIsTesting(true);
    setMessage({ text: 'Đang kết nối đến Supabase...', type: 'info' });

    saveSupabaseConfig(url.trim(), anonKey.trim());

    // Test connection by pushing current local plan
    const success = await pushCloudPlan({
      days,
      settings,
      schedules,
      updatedAt: new Date().toISOString(),
      deviceId: getDeviceId()
    });

    setIsTesting(false);

    if (success) {
      soundFx.playVictoryFanfare();
      setMessage({
        text: 'Kết nối thành công! Dữ liệu đã được đồng bộ lên Cloud. Mọi thiết bị khác nhập cùng URL & Key sẽ cập nhật tức thì!',
        type: 'success'
      });
    } else {
      setMessage({
        text: 'Kết nối thất bại. Hãy kiểm tra lại URL, Anon Key hoặc đảm bảo bạn đã chạy đoạn SQL tạo bảng "app_sync" bên dưới!',
        type: 'error'
      });
    }
  };

  const handleManualPush = async () => {
    setIsTesting(true);
    const success = await pushCloudPlan({
      days,
      settings,
      schedules,
      updatedAt: new Date().toISOString(),
      deviceId: getDeviceId()
    });
    setIsTesting(false);

    if (success) {
      soundFx.playCoinSound();
      setMessage({ text: 'Đã đẩy dữ liệu máy này lên Cloud thành công!', type: 'success' });
    } else {
      setMessage({ text: 'Lỗi khi đẩy dữ liệu lên Cloud!', type: 'error' });
    }
  };

  const handleManualPull = async () => {
    setIsTesting(true);
    const cloudData = await fetchCloudPlan();
    setIsTesting(false);

    if (cloudData && cloudData.days && cloudData.settings) {
      onApplyCloudData(cloudData.days, cloudData.settings, cloudData.schedules || schedules);
      soundFx.playCoinSound();
      setMessage({ text: 'Đã tải và áp dụng dữ liệu mới nhất từ Cloud!', type: 'success' });
    } else {
      setMessage({ text: 'Chưa có dữ liệu nào trên Cloud hoặc kết nối lỗi!', type: 'error' });
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setMessage({ text: 'Đã ngắt kết nối Cloud. Dữ liệu vẫn được lưu an toàn trên máy này.', type: 'info' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl text-zinc-100 max-h-[92vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Cloud className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Đồng Bộ Đám Mây (PC ⇄ Điện Thoại)</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                1 nguồn dữ liệu duy nhất qua Supabase Realtime • Sửa ở đâu cập nhật ở đó
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-sm rounded-lg hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Status banner */}
        <div className="mt-3.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {syncStatus === 'synced' ? (
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            ) : syncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            ) : syncStatus === 'error' ? (
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
            )}
            <div>
              <span className="text-xs font-bold text-zinc-200 block">
                Trạng thái:{' '}
                <span
                  className={
                    syncStatus === 'synced'
                      ? 'text-emerald-400'
                      : syncStatus === 'syncing'
                      ? 'text-amber-400'
                      : syncStatus === 'error'
                      ? 'text-rose-400'
                      : 'text-zinc-400'
                  }
                >
                  {syncStatus === 'synced'
                    ? 'Đã kết nối & Đồng bộ Realtime'
                    : syncStatus === 'syncing'
                    ? 'Đang đồng bộ...'
                    : syncStatus === 'error'
                    ? 'Lỗi kết nối'
                    : 'Chưa cấu hình Cloud'}
                </span>
              </span>
              <span className="text-[10px] text-zinc-400">
                {lastSyncedAt
                  ? `Lần cuối: ${lastSyncedAt.toLocaleTimeString('vi-VN')} (${lastSyncedAt.toLocaleDateString('vi-VN')})`
                  : 'Chưa có lượt đồng bộ nào'}
              </span>
            </div>
          </div>

          {currentConfig && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleManualPush}
                disabled={isTesting}
                title="Đẩy dữ liệu máy này lên Cloud"
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-lg flex items-center gap-1 border border-zinc-700"
              >
                <Upload className="w-3 h-3 text-sky-400" />
                <span>Đẩy lên</span>
              </button>
              <button
                type="button"
                onClick={handleManualPull}
                disabled={isTesting}
                title="Tải dữ liệu mới nhất từ Cloud về"
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded-lg flex items-center gap-1 border border-zinc-700"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Tải về</span>
              </button>
            </div>
          )}
        </div>

        {/* Message notification */}
        {message && (
          <div
            className={`mt-3 p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : message.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-sky-950/40 border-sky-500/40 text-sky-300'
            }`}
          >
            {message.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSaveAndTest} className="mt-3.5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Supabase Project URL:
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Supabase Anon / Public Key:
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-sky-500"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Lấy tại: Supabase Dashboard ➔ Project Settings ➔ API ➔ Project URL & anon/public key.
            </p>
          </div>

          {/* Quick 3-Step Setup Guide */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-300 font-bold">
              <span>Hướng dẫn kết nối Supabase (2 phút):</span>
              <button
                type="button"
                onClick={() => setShowSql(!showSql)}
                className="text-[11px] text-sky-400 hover:text-sky-300 underline"
              >
                {showSql ? 'Ẩn SQL' : 'Xem SQL tạo bảng'}
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400">
              <li>
                Vào{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 underline inline-flex items-center gap-0.5"
                >
                  supabase.com <ExternalLink className="w-2.5 h-2.5" />
                </a>{' '}
                bấm <b>Start your project</b> (Đăng nhập bằng GitHub <b>ptdat30</b>).
              </li>
              <li>
                Tạo 1 Project mới (Đặt tên: <code>trano-tet</code>, mật khẩu database tùy ý).
              </li>
              <li>
                Vào mục <b>SQL Editor</b> ➔ Dán script SQL dưới đây ➔ Bấm <b>Run</b>.
              </li>
              <li>
                Vào <b>Project Settings</b> ➔ <b>API</b> ➔ Copy URL & anon public key dán vào ô trên.
              </li>
            </ol>

            {showSql && (
              <div className="relative mt-2">
                <pre className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-300 font-mono overflow-x-auto leading-relaxed">
                  {SQL_INIT_SCRIPT}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute right-2 top-2 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 border border-zinc-700 shadow"
                >
                  {isCopiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedSql ? 'Đã copy!' : 'Copy SQL'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={isTesting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-zinc-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-sky-950/40 flex items-center justify-center gap-1.5"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang kết nối...</span>
                </>
              ) : (
                <>
                  <CloudCheck className="w-4 h-4" />
                  <span>Lưu & Kết Nối Đám Mây</span>
                </>
              )}
            </button>

            {currentConfig && (
              <button
                type="button"
                onClick={handleDisconnect}
                title="Ngắt kết nối Cloud"
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-400 border border-zinc-700 hover:border-rose-500/40 transition"
              >
                <CloudOff className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
