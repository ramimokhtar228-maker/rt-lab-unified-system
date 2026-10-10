/**
 * Laboratory Critical (Panic) Value Alert System & Doctor Notification Engine
 * Complies with ISO 15189:2022 Clause 7.3.7 (Critical Result Notification & Log)
 */

import { LabReport, TestParameter } from '../types/lab';

export interface PanicParameterAlert {
  id: string;
  parameterName: string;
  parameterNameAr?: string;
  value: string | number;
  unit: string;
  normalRange: string;
  panicThreshold: string;
  conditionType: 'panic_high' | 'panic_low' | 'critical_finding';
  clinicalRiskAr: string;
  clinicalRiskEn: string;
  emergencyActionAr: string;
}

export interface DoctorNotificationLogEntry {
  id: string;
  reportId: string;
  patientName: string;
  patientLabNumber: string;
  doctorName: string;
  doctorPhone?: string;
  alertTimestamp: string;
  criticalParameters: string[];
  notifiedByStaff: string;
  communicationChannel: 'whatsapp' | 'phone_call' | 'sms' | 'emergency_portal';
  acknowledgmentStatus: 'acknowledged' | 'dispatched' | 'pending';
  doctorResponseNotes?: string;
}

// Standard International Panic Value Reference Cutoffs
const PANIC_DEFINITIONS = [
  {
    aliases: ['potassium', 'بوتاسيوم', 'k+'],
    nameAr: 'البوتاسيوم في مصل الدم',
    panicLow: 2.8,
    panicHigh: 6.2,
    unit: 'mmol/L',
    riskLowAr: 'هبوط حاد في البوتاسيوم يهدد باضطراب نظم القلب القلبي وشلل العضلات التنفسية.',
    riskHighAr: 'فرط حاد في البوتاسيوم يهدد بالرجفان البطيني والتوقف القلبي الفوري.',
    emergencyActionAr: 'إيقاف أي تسريب للبوتاسيوم، وتجهيز جلوكونات الكالسيوم وإنسولين/جلوكوز وريدي فوراً.'
  },
  {
    aliases: ['fasting blood sugar', 'random blood sugar', 'glucose', 'fbs', 'rbs', 'سكر'],
    nameAr: 'جلوكوز الدم',
    panicLow: 45,
    panicHigh: 450,
    unit: 'mg/dL',
    riskLowAr: 'هبوط حاد في السكر مهدد للحياة يسبب غيبوبة هبوط السكر وتلف خلايا الدماغ.',
    riskHighAr: 'ارتفاع سكري مفرط يهدد بالحماض الكيتوني السكري (DKA) أو الغيبوبة التناضحية (HHS).',
    emergencyActionAr: 'في الهبوط: إعطاء جلوكوز 25% وريدياً أو جلوكاجون فوراً. في الارتفاع: محاليل وريدية وإنسولين منظم.'
  },
  {
    aliases: ['platelet', 'plt', 'صفائح'],
    nameAr: 'الصفائح الدموية',
    panicLow: 20000,
    panicHigh: 1000000,
    unit: '/µL',
    riskLowAr: 'نقص حاد جداً في الصفائح يهدد بالنزف الدماغي العفوي ونزف الجهاز الهضمي.',
    riskHighAr: 'فرط شديد في الصفائح يهدد بالجلطات الشريانية الحادة.',
    emergencyActionAr: 'تجنب أي حقن عضلي، ونقل صفائح دموية عاجل للمريض تحت إشراف أمراض الدم.'
  },
  {
    aliases: ['hemoglobin', 'hgb', 'هيموجلوبين', 'hb'],
    nameAr: 'الهيموجلوبين',
    panicLow: 6.5,
    panicHigh: 20.0,
    unit: 'g/dL',
    riskLowAr: 'أنيميا حادة شديدة تهدد بنقص تروية عضلة القلب وصدمة نقص الأكسجين.',
    riskHighAr: 'فرط لزوجة الدم وداء الحمر يهدد بالاحتشاءات الوعائية والجلطات.',
    emergencyActionAr: 'في الانخفاض: نقل كرات دم حمراء مكدسة (Packed RBCs) فوراً بعد عمل التوافق.'
  },
  {
    aliases: ['sodium', 'صوديوم', 'na+'],
    nameAr: 'الصوديوم',
    panicLow: 120,
    panicHigh: 160,
    unit: 'mmol/L',
    riskLowAr: 'نقص صوديوم حاد مهدد باستسقاء الدماغ والتشنجات والغيبوبة.',
    riskHighAr: 'فرط صوديوم شديد يسبب جفاف الخلايا العصبية والنزف السحائي.',
    emergencyActionAr: 'تصحيح بطيء محسوب للمحاليل الملحية لتفادي متلازمة تحلل الميالين الجسري.'
  },
  {
    aliases: ['troponin', 'تروبونين'],
    nameAr: 'التروبونين القلبي',
    panicLow: null,
    panicHigh: 0.05,
    unit: 'ng/mL',
    riskLowAr: '',
    riskHighAr: 'إيجابية صريحة للتروبونين تدل على احتشاء حاد في عضلة القلب (Myocardial Infarction).',
    emergencyActionAr: 'إحالة فورية لطوارئ القلب لعمل رسم قلب عاجل وقسطرة قلبية.'
  },
  {
    aliases: ['inr'],
    nameAr: 'مؤشر السيولة الدولية (INR)',
    panicLow: null,
    panicHigh: 5.0,
    unit: '',
    riskLowAr: '',
    riskHighAr: 'سيولة مفرطة وخطيرة تهدد بنزيف مميت.',
    emergencyActionAr: 'إيقاف مضادات التخثر فوراً وإعطاء فيتامين K1 بالفم أو البلازما الطازجة المجمدة (FFP).'
  },
  {
    aliases: ['creatinine', 'كرياتينين'],
    nameAr: 'الكرياتينين',
    panicLow: null,
    panicHigh: 5.5,
    unit: 'mg/dL',
    riskLowAr: '',
    riskHighAr: 'فشل كلوي حاد متقدم مع احتباس شديد للسموم النيتروجينية.',
    emergencyActionAr: 'تقييم فوري للغسيل الكلوي الطارئ وفحص البوتاسيوم وغازات الدم.'
  },
  {
    aliases: ['wbc', 'white blood', 'كرات الدم البيضاء'],
    nameAr: 'كرات الدم البيضاء',
    panicLow: 1500,
    panicHigh: 40000,
    unit: '/µL',
    riskLowAr: 'نقص حاد في كرات الدم البيضاء يهدد بالصدمة الإنتانية القاتلة.',
    riskHighAr: 'تفاعل ابيضاضي شديد أو اشتباه لوكيميا حادة (Blast Crisis).',
    emergencyActionAr: 'عزل وقائي للمريض، وفحص شريحة دم تفريقي عاجل واستشارة استشاري أمراض الدم.'
  }
];

export function detectPanicValues(report: LabReport): PanicParameterAlert[] {
  const alerts: PanicParameterAlert[] = [];
  const allParams: TestParameter[] = [];

  report.profiles.forEach(prof => {
    if (Array.isArray(prof.parameters)) {
      allParams.push(...prof.parameters);
    }
  });

  allParams.forEach(param => {
    const pName = (param.name || '').toLowerCase();
    const numVal = parseFloat(String(param.result).replace(/[^0-9.-]/g, ''));
    if (isNaN(numVal)) return;

    for (const def of PANIC_DEFINITIONS) {
      const isMatch = def.aliases.some(a => pName.includes(a.toLowerCase()));
      if (isMatch) {
        if (def.panicLow !== null && numVal <= def.panicLow) {
          alerts.push({
            id: `panic-${param.id}-low`,
            parameterName: param.name,
            parameterNameAr: def.nameAr,
            value: param.result,
            unit: param.unit || def.unit,
            normalRange: param.textReference || `${param.minNormal || ''}-${param.maxNormal || ''}`,
            panicThreshold: `≤ ${def.panicLow} ${def.unit}`,
            conditionType: 'panic_low',
            clinicalRiskAr: def.riskLowAr,
            clinicalRiskEn: `Critically low value demanding emergent clinical action.`,
            emergencyActionAr: def.emergencyActionAr
          });
        } else if (def.panicHigh !== null && numVal >= def.panicHigh) {
          alerts.push({
            id: `panic-${param.id}-high`,
            parameterName: param.name,
            parameterNameAr: def.nameAr,
            value: param.result,
            unit: param.unit || def.unit,
            normalRange: param.textReference || `${param.minNormal || ''}-${param.maxNormal || ''}`,
            panicThreshold: `≥ ${def.panicHigh} ${def.unit}`,
            conditionType: 'panic_high',
            clinicalRiskAr: def.riskHighAr,
            clinicalRiskEn: `Critically high value demanding emergent clinical action.`,
            emergencyActionAr: def.emergencyActionAr
          });
        }
        break;
      }
    }
  });

  return alerts;
}

export function formatDoctorCriticalWhatsApp(
  report: LabReport,
  panicAlerts: PanicParameterAlert[],
  labName = 'معامل RT للتحاليل الطبية'
): string {
  const p = report.patient;
  const docName = p.referringDoctorName || 'الطبيب المعالج';

  let text = `🚨 *إشعار طوارئ معملي عاجل - قيم حرجة (Panic Values)*\n`;
  text += `من: *${labName}*\n`;
  text += `إلى: *د. ${docName}*\n`;
  text += `─────────────────────\n`;
  text += `نحيط سيادتكم علماً بوجود نتائج حرجة تتطلب تدخلاً طبياً عاجلاً للمريض:\n`;
  text += `👤 المريض: *${p.fullName}*\n`;
  text += `📊 رقم الملف المعملي: *#${p.labNumber}*\n`;
  text += `⏳ العمر / الجنس: *${p.age} سنة - ${p.gender === 'male' ? 'ذكر' : 'أنثى'}*\n`;
  text += `📅 وقت صدور النتيجة: *${new Date().toLocaleTimeString('ar-EG')}*\n`;
  text += `─────────────────────\n`;
  text += `⚠️ *المؤشرات الحرجة المكتشفة:*\n`;

  panicAlerts.forEach((a, i) => {
    text += `\n${i + 1}. *${a.parameterName} (${a.parameterNameAr || ''})*\n`;
    text += `   • النتيجة المسجلة: *${a.value} ${a.unit}* ‼️\n`;
    text += `   • المعدل الطبيعي: ${a.normalRange}\n`;
    text += `   • الخطورة: ${a.clinicalRiskAr}\n`;
    text += `   • الإجراء العاجل: ${a.emergencyActionAr}\n`;
  });

  text += `\n─────────────────────\n`;
  text += `📞 هاتف طوارئ المعمل المباشر: *01012345678*\n`;
  text += `يرجى تأكيد استلام الإشعار واتخاذ اللازم سريرياً.`;

  return text;
}
