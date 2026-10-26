import type { LabReport } from '../types';
import { formatEgyptianPhoneForWhatsApp } from './whatsapp';

export interface WhatsAppAlertConfig {
  enabled: boolean;
  phone: string;
  apiKey: string;
}

const CONFIG_KEY = 'rt-whatsapp-alert';
const SENT_KEY = 'rt-whatsapp-alert-sent';
const REPEAT_GUARD_MS = 10 * 60 * 1000;

export function getWhatsAppAlertConfig(): WhatsAppAlertConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { enabled: false, phone: '', apiKey: '' };
    const parsed = JSON.parse(raw) || {};
    return {
      enabled: !!parsed.enabled,
      phone: String(parsed.phone || ''),
      apiKey: String(parsed.apiKey || '')
    };
  } catch {
    return { enabled: false, phone: '', apiKey: '' };
  }
}

export function saveWhatsAppAlertConfig(config: WhatsAppAlertConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // التخزين المحلي غير متاح
  }
}

export function isWhatsAppAlertReady(): boolean {
  const config = getWhatsAppAlertConfig();
  return config.enabled && !!config.phone.trim() && !!config.apiKey.trim();
}

export function formatApprovedReportAlert(report: LabReport): string {
  const patient = report.patient;
  const tests = (report.profiles || []).map(profile => `• ${profile.titleAr || profile.titleEn}`);
  const now = new Date();
  const approvedAt = `${now.toLocaleDateString('en-GB')} — ${now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;

  return [
    '✅ *تم اعتماد تقرير طبي جديد*',
    `👤 المريض: *${patient.fullName}*`,
    `🧾 رقم الملف: *${patient.labNumber}*${patient.barcode ? ` | باركود: ${patient.barcode}` : ''}`,
    `🧪 عدد الفحوصات: ${(report.profiles || []).length}`,
    tests.join('\n'),
    `🕒 وقت الاعتماد: ${approvedAt}`,
    `👨‍⚕️ بواسطة: ${report.staff?.verifiedBy || 'فريق المعمل'}`,
    '— نظام RT Lab'
  ].filter(Boolean).join('\n');
}

async function sendWhatsAppText(config: WhatsAppAlertConfig, text: string): Promise<boolean> {
  const phone = formatEgyptianPhoneForWhatsApp(config.phone);
  if (!phone || !config.apiKey.trim()) return false;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(config.apiKey.trim())}`;

  try {
    await fetch(url, { mode: 'no-cors' });
    return true;
  } catch {
    return false;
  }
}

export async function sendWhatsAppTestAlert(): Promise<boolean> {
  const config = getWhatsAppAlertConfig();
  if (!config.phone.trim() || !config.apiKey.trim()) return false;
  return sendWhatsAppText(
    config,
    '🔔 *تجربة إشعارات RT Lab*\nستصل رسالة مثل هذه تلقائياً على واتساب عند اعتماد أي تقرير طبي جديد.'
  );
}

export async function notifyReportApproved(report: LabReport): Promise<boolean> {
  const config = getWhatsAppAlertConfig();
  if (!config.enabled || !config.phone.trim() || !config.apiKey.trim()) return false;

  try {
    const raw = localStorage.getItem(SENT_KEY);
    const sent: Record<string, number> = raw ? JSON.parse(raw) || {} : {};
    if (Date.now() - (sent[report.id] || 0) < REPEAT_GUARD_MS) return false;
    sent[report.id] = Date.now();
    localStorage.setItem(SENT_KEY, JSON.stringify(sent));
  } catch {
    // تجاهل حارس التكرار عند تعذر الوصول للتخزين
  }

  return sendWhatsAppText(config, formatApprovedReportAlert(report));
}
