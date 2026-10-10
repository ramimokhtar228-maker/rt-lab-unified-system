import React, { useState } from 'react';
import {
  Headphones,
  X,
  MessageSquare,
  PhoneCall,
  Send,
  HelpCircle,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  User
} from 'lucide-react';

interface SupportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  text: string;
  time: string;
}

export const SupportCenterModal: React.FC<SupportCenterModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'live_chat' | 'knowledge_base' | 'ticket'>('live_chat');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'support',
      senderName: 'أ.د. رامي مختار - رئيس الدعم السريري',
      text: 'أهلاً بحضرتك في مركز الدعم الفني والاستشاري لمعامل RT على مدار 24 ساعة. كيف يمكننا مساعدتك اليوم بخصوص الأجهزة، المحاليل، أو التفسيرات الطبية؟',
      time: 'الآن'
    }
  ]);

  // Ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'urgent' | 'high' | 'normal'>('urgent');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      senderName: 'فريق المعمل',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Clinical response simulator
    setTimeout(() => {
      const q = userMsg.text.toLowerCase();
      let reply = 'شكراً لتواصلك. فريق الدعم الطبي والفني متواجد لمتابعة طلبك والرد فوراً.';
      if (q.includes('جهاز') || q.includes('معايرة') || q.includes('كاليبريشن') || q.includes('qc')) {
        reply = 'بخصوص ضبط جودة ومعايرة الجهاز: يرجى التأكد من تشغيل كنترولين (Normal & Pathological) والتحقق من قواعد Westgard (1-2s warning أو 1-3s rejection). مهندس الصيانة متاح للمساعدة المباشرة.';
      } else if (q.includes('عين') || q.includes('تجلط') || q.includes('سحب')) {
        reply = 'بخصوص العينات: يرجى التأكد من الالتزام بنسب مانع التجلط المناسبة (1:9 للسترات في السيولة، و EDTA لـ CBC) لمنع تكون الجلطات المجهرية.';
      } else if (q.includes('تقرير') || q.includes('نتيجة') || q.includes('حرجة')) {
        reply = 'للحالات الحرجة: استخدم زر "الإنذار الفوري للطبيب" لإرسال رسالة واتساب عاجلة ومسجلة وفق معيار ISO 15189.';
      }

      setMessages(prev => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          sender: 'support',
          senderName: 'دعم معامل RT (24/7 Hotline)',
          text: reply,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 800);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDescription) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketSubject('');
      setTicketDescription('');
      setActiveTab('live_chat');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-900"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex items-center justify-between border-b border-rose-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Headphones className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  مركز الدعم الفني والاستشاري الطبي (24/7 Support Center)
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  LIVE 24/7
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
                دعم سريري وتقني على مدار الساعة بإشراف نخبة من استشاريي الباثولوجيا الإكلينيكية ومهندسي الأجهزة
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

        {/* Action strip with hotline and tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('live_chat')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'live_chat'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>المحادثة المباشرة (Live Chat)</span>
            </button>
            <button
              onClick={() => setActiveTab('knowledge_base')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'knowledge_base'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>دليل جودة ومعايرة الأجهزة (QC)</span>
            </button>
            <button
              onClick={() => setActiveTab('ticket')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ticket'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>فتح تذكرة طوارئ</span>
            </button>
          </div>

          <a
            href="https://wa.me/201012345678"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>الخط الساخن: 01012345678</span>
          </a>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeTab === 'live_chat' && (
            <div className="flex flex-col h-[52vh] justify-between">
              {/* Messages list */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 mb-3">
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-bold">
                      {m.senderName} • {m.time}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-rose-900 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-100 border border-slate-200 text-slate-900 rounded-bl-none shadow-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="اكتب استفسارك الطبي أو الفني هنا..."
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-900"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white transition cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'knowledge_base' && (
            <div className="space-y-3">
              <h3 className="font-black text-sm text-slate-900">
                قواعد ضبط الجودة (QC) وحل مشاكل أجهزة التحاليل الشائعة
              </h3>

              <div className="space-y-2">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                  <span className="font-bold text-rose-900 block">
                    1. قاعدة Westgard 1-3s (رفض التشغيلة الفوري):
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    تجاوز إحدى قراءات الكنترول 3 انحرافات معيارية (±3 SD) عن المتوسط. الإجراء: إيقاف التحاليل فوراً، إعادة تشغيل الكنترول، وإعادة معايرة الكواشف (Re-calibration).
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                  <span className="font-bold text-rose-900 block">
                    2. أجهزة CBC (ظهور رسالة Platelet Clumps / Flag):
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    اشتباه تراكم صفائح دم ناتج عن EDTA. الإجراء: فحص شريحة دم محيطي مجهرياً فوراً (Microscopy Smear)، أو إعادة سحب العينة في أنبوبة سترات الصوديوم وضرب النتيجة في 1.1.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                  <span className="font-bold text-rose-900 block">
                    3. عينات تكسير الدم (Hemolyzed Samples) وتأثيرها على البوتاسيوم:
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    تكسير كرات الدم يحرر البوتاسيوم الداخلي مسبباً ارتفاعاً زائفاً كبيراً. الإجراء: رفض العينة وطلب إعادة سحب عينة جديدة فوراً.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ticket' && (
            <form onSubmit={handleSubmitTicket} className="space-y-4 max-w-lg mx-auto py-2">
              <h3 className="font-black text-sm text-slate-900">فتح تذكرة دعم فني أو بلاغ عطل طارئ</h3>

              {ticketSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-6 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold">تم تسجيل التذكرة بنجاح برقم #TK-{Date.now().toString().slice(-5)}</p>
                  <p className="text-xs">سيقوم مهندس الدعم بالاتصال بكم خلال دقائق معدودة.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">موضوع التذكرة / الجهاز:</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={e => setTicketSubject(e.target.value)}
                      placeholder="مثال: عطل في مسبار جهاز الكيمياء Mindray أو خطأ معايرة..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">درجة الأهمية:</label>
                    <select
                      value={ticketPriority}
                      onChange={e => setTicketPriority(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold"
                    >
                      <option value="urgent">🔴 عاجل جداً (توقف المعمل أو جهاز رئيسي)</option>
                      <option value="high">🟡 مرتفعة (مشكلة كواشف أو معايرة)</option>
                      <option value="normal">🟢 عادية (استفسار تدريبي أو برمجي)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">تفاصيل المشكلة:</label>
                    <textarea
                      required
                      rows={3}
                      value={ticketDescription}
                      onChange={e => setTicketDescription(e.target.value)}
                      placeholder="اكتب كود الخطأ الذي يظهر على الشاشة أو السلوك غير الطبيعي للجهاز..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold transition cursor-pointer shadow-md"
                  >
                    إرسال التذكرة فوراً لغرفة العمليات
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            فريق الدعم الفني متواجد 24/7 لخدمة كافة فروع معامل RT.
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
