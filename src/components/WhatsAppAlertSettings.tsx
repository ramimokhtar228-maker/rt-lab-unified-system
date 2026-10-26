import React, { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import {
  getWhatsAppAlertConfig,
  saveWhatsAppAlertConfig,
  sendWhatsAppTestAlert
} from '../utils/whatsappNotify';
import type { WhatsAppAlertConfig } from '../utils/whatsappNotify';

export const WhatsAppAlertSettings: React.FC = () => {
  const [config, setConfig] = useState<WhatsAppAlertConfig>(() => getWhatsAppAlertConfig());
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const update = (patch: Partial<WhatsAppAlertConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveWhatsAppAlertConfig(next);
    setStatus(null);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setStatus(null);
    const ok = await sendWhatsAppTestAlert();
    setStatus(
      ok
        ? { ok: true, message: 'تم إرسال رسالة تجريبية، تحقق من واتساب على رقمك خلال لحظات.' }
        : { ok: false, message: 'تعذر الإرسال. تأكد من إدخال الرقم ومفتاح CallMeBot بشكل صحيح.' }
    );
    setIsTesting(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>إشعارات واتساب عند اعتماد التقارير</span>
        </h3>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={e => update({ enabled: e.target.checked })}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>{config.enabled ? 'مُفعّل' : 'متوقف'}</span>
        </label>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        ستصل رسالة واتساب تلقائية على رقمك بمجرد اعتماد أي تقرير طبي (اسم المريض، رقم الملف، والفحوصات) عبر خدمة CallMeBot المجانية.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-slate-700 font-bold mb-1">رقم الواتساب (مثال: 01000000000):</label>
          <input
            type="tel"
            value={config.phone}
            onChange={e => update({ phone: e.target.value })}
            placeholder="01xxxxxxxxx"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-600 bg-white"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-bold mb-1">مفتاح CallMeBot (API Key):</label>
          <input
            type="text"
            value={config.apiKey}
            onChange={e => update({ apiKey: e.target.value })}
            placeholder="123456"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-600 bg-white"
          />
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-1">
        <div className="font-bold text-slate-800">طريقة الحصول على المفتاح (مرة واحدة فقط):</div>
        <div>1. احفظ رقم الخدمة <span className="font-mono font-bold">+34 644 51 95 23</span> على واتساب.</div>
        <div>2. أرسل له الرسالة: <span className="font-mono">I allow callmebot to send me messages</span></div>
        <div>3. سيصلك رد بالمفتاح (API Key) — الصقه في الخانة أعلاه.</div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleTest}
          disabled={isTesting}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>{isTesting ? 'جارٍ الإرسال...' : 'إرسال رسالة تجريبية'}</span>
        </button>
        {status && (
          <span className={`text-xs font-bold ${status.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{status.message}</span>
        )}
      </div>
    </div>
  );
};
