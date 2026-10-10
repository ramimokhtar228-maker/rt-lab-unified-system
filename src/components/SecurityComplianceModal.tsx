import React, { useState } from 'react';
import { LabReport } from '../types/lab';
import {
  encryptMedicalData,
  decryptMedicalData,
  calculateSha256,
  deIdentifyReportForResearch,
  EncryptedVaultPayload
} from '../utils/securityAndEncryption';
import {
  ShieldCheck,
  X,
  Lock,
  Unlock,
  KeyRound,
  FileCheck2,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  UserX,
  FileText
} from 'lucide-react';

interface SecurityComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: LabReport[];
  onRestoreReports?: (reports: LabReport[]) => void;
}

export const SecurityComplianceModal: React.FC<SecurityComplianceModalProps> = ({
  isOpen,
  onClose,
  reports,
  onRestoreReports
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'vault' | 'de_identify' | 'compliance'>('vault');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // De-identification state
  const [deIdentifiedSample, setDeIdentifiedSample] = useState<LabReport | null>(null);

  const handleExportEncryptedVault = async () => {
    if (!passphrase || passphrase.length < 6) {
      alert('يرجى إدخال كلمة مرور قوية للتشفير لا تقل عن 6 أحرف.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      alert('كلمتا المرور غير متطابقتين.');
      return;
    }

    try {
      setIsProcessing(true);
      const vault = await encryptMedicalData(reports, passphrase);
      const json = JSON.stringify(vault, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rt-lab-encrypted-vault-${new Date().toISOString().split('T')[0]}.rtvault.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsSuccess(true);
      setStatusMessage(`تم تشفير وحفظ ${reports.length} تقريراً طبياً بنجاح بخوارزمية AES-GCM 256-bit.`);
    } catch (err: any) {
      alert(`فشل التشفير: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportEncryptedVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!passphrase) {
      alert('يرجى إدخال كلمة المرور أولاً لفك تشفير الملف المستورد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        setIsProcessing(true);
        const raw = event.target?.result as string;
        const vault: EncryptedVaultPayload = JSON.parse(raw);
        const decryptedReports: LabReport[] = await decryptMedicalData(vault, passphrase);

        if (Array.isArray(decryptedReports) && onRestoreReports) {
          onRestoreReports(decryptedReports);
          setIsSuccess(true);
          setStatusMessage(`تم فك التشفير واستعادة ${decryptedReports.length} تقرير بنجاح والتحقق من بصمة SHA-256.`);
        } else {
          alert('الملف المفكوك غير صالح أو بنية البيانات غير متطابقة.');
        }
      } catch (err: any) {
        alert(`فشل فك التشفير: تحقق من صحة كلمة المرور أو سلامة الملف.`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleTestDeIdentify = () => {
    if (reports.length === 0) return;
    const deIdentified = deIdentifyReportForResearch(reports[0]);
    setDeIdentifiedSample(deIdentified);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-900"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  مركز التشفير الكامل وحماية خصوصية بيانات المرضى
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono">
                  AES-256-GCM • HIPAA • GDPR
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                تشفير طرفي كامل (End-to-End Encryption) للبيانات الصحية الحساسة مع آليات إخفاء الهوية للأبحاث
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vault'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>خزينة التشفير (Encrypted Vault)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('de_identify');
              handleTestDeIdentify();
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'de_identify'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>إخفاء الهوية للأبحاث (HIPAA Safe Harbor)</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'compliance'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مؤشرات الامتثال الدولي (HIPAA & GDPR)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {activeTab === 'vault' && (
            <div className="space-y-4 max-w-xl mx-auto py-2">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 leading-relaxed text-indigo-950">
                <span className="font-bold block mb-0.5">التشفير العسكري AES-GCM 256-bit:</span>
                تشفير محلي مباشر في متصفحك عبر Web Crypto API، حيث يتم تشفير كافة سجلات المرضى والتحاليل بمفتاح مشتق من كلمة مرورك عبر خوارزمية PBKDF2 بـ 100,000 تكرار، مع توليد بصمة سلامة SHA-256 لمنع التلاعب.
              </div>

              {statusMessage && (
                <div className={`p-4 rounded-2xl border text-center font-bold flex items-center justify-center gap-2 ${
                  isSuccess ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كلمة مرور الخزينة المشفرة:</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    placeholder="أدخل كلمة مرور قوية..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تأكيد كلمة المرور:</label>
                  <input
                    type="password"
                    value={confirmPassphrase}
                    onChange={e => setConfirmPassphrase(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور للتأكيد..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleExportEncryptedVault}
                  disabled={isProcessing}
                  className="py-3 px-4 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير خزينة مشفرة (.rtvault)</span>
                </button>

                <label className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-center">
                  <Upload className="w-4 h-4" />
                  <span>استيراد وفك تشفير خزينة</span>
                  <input
                    type="file"
                    accept=".rtvault.json,.json"
                    onChange={handleImportEncryptedVault}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'de_identify' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700">
                <span className="font-bold text-slate-900 block mb-1">
                  معيار HIPAA Safe Harbor لإزالة الهوية المباشرة:
                </span>
                يتم استبدال الاسم والرقم القومي والهاتف بهوية عشوائية مشفرة (Pseudonym) لحماية خصوصية المريض تماماً عند مشاركة البيانات مع جهات بحثية أو أكاديمية.
              </div>

              {deIdentifiedSample && (
                <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 font-mono text-xs border border-slate-800 space-y-2" dir="ltr">
                  <div className="text-emerald-400 font-bold mb-1">// HIPAA De-identified Result Sample</div>
                  <div>Patient Name: {deIdentifiedSample.patient.fullName}</div>
                  <div>Phone: {deIdentifiedSample.patient.phone}</div>
                  <div>National ID: [REDACTED / STRIPPED]</div>
                  <div>Report Code: {deIdentifiedSample.reportNumber}</div>
                  <div>Age: {deIdentifiedSample.patient.age} years | Gender: {deIdentifiedSample.patient.gender}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-3">
              <h3 className="font-black text-sm text-slate-900">
                قائمة التحقق من الامتثال لمعايير الخصوصية الصحية العالمية
              </h3>

              <div className="space-y-2">
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950 block">التشفير التام للبيانات أثناء الراحة (Encryption at Rest):</span>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      تشفير AES-GCM 256-bit للبيانات الحساسة بقوة تشفير تتوافق مع توصيات NIST و HIPAA.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950 block">مبدأ تقليل البيانات وفق GDPR Article 9:</span>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      لا يتم تخزين أي بيانات سريرية دون غرض تشخيصي صريح وموافقة المريض الموثقة.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950 block">سجل التدقيق الإلكتروني غير القابل للتعديل (Audit Logging):</span>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      توثيق كافة عمليات التعديل، الطباعة، والإرسال مع اسم المستخدم والتوقيت الدقيق بالثانية.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            تتم كافة العمليات الحسابية والتشفيرية داخل متصفحك محلياً دون تسريب المفاتيح لأي مخدم خارجي.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
