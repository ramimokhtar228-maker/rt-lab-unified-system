import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Building2, Users, Printer, TrendingUp, Wallet } from 'lucide-react';

const fmt = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export const ManagementReportsModule: React.FC = () => {
  const { incomeRecords, expenses, employees, attendance, payroll, staffMembers, facilities } = useApp();
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const [branchFilter, setBranchFilter] = useState('all');

  const fromTs = new Date(from + 'T00:00:00').getTime();
  const toTs = new Date(to + 'T23:59:59').getTime();

  const inRange = (value?: string) => {
    if (!value) return false;
    const ts = new Date(value).getTime();
    return !isNaN(ts) && ts >= fromTs && ts <= toTs;
  };

  const branchIdOfInvoice = (inv: any): string => {
    if (inv.branchId) return inv.branchId;
    const found = facilities.find((f: any) => f.nameAr === inv.branch || f.nameEn === inv.branch);
    return found ? found.id : 'unassigned';
  };

  const branchOfEmployee = (employeeId: string): string => {
    const emp = employees.find((e: any) => e.id === employeeId);
    if (!emp) return 'unassigned';
    const found = facilities.find((f: any) => f.nameAr === emp.branch || f.id === emp.branch);
    return found ? found.id : 'unassigned';
  };

  const invoicesInRange = useMemo(
    () => incomeRecords.filter((i: any) => inRange(i.createdAt || i.updatedAt)),
    [incomeRecords, fromTs, toTs]
  );

  const visibleInvoices = useMemo(
    () => invoicesInRange.filter((inv: any) => branchFilter === 'all' || branchIdOfInvoice(inv) === branchFilter),
    [invoicesInRange, branchFilter, facilities]
  );

  const expensesInRange = useMemo(
    () => expenses.filter((e: any) => inRange(e.date || e.createdAt)),
    [expenses, fromTs, toTs]
  );

  const attendanceInRange = useMemo(
    () => attendance.filter((a: any) => inRange(a.date)),
    [attendance, fromTs, toTs]
  );

  const paidPayroll = useMemo(
    () => payroll.filter((p: any) => p.paymentStatus === 'paid' && inRange(p.paymentDate)),
    [payroll, fromTs, toTs]
  );

  const totalPaid = visibleInvoices.reduce((sum: number, i: any) => sum + (i.paidAmount || 0), 0);
  const totalDue = visibleInvoices.reduce((sum: number, i: any) => sum + (i.remainingAmount || 0), 0);
  const totalExpenses = expensesInRange.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const totalPayroll = paidPayroll.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
  const netProfit = totalPaid - totalExpenses - totalPayroll;
  const avgInvoice = visibleInvoices.length > 0 ? totalPaid / visibleInvoices.length : 0;

  const branchRows = useMemo(() => {
    const ids = new Set(facilities.map((f: any) => f.id));
    const rows: any[] = facilities.map((f: any) => ({ id: f.id, name: f.nameAr, isMainBranch: !!f.isMainBranch }));
    const hasUnassigned = visibleInvoices.some((i: any) => !ids.has(branchIdOfInvoice(i)));
    if (hasUnassigned) rows.push({ id: 'unassigned', name: 'بدون فرع', isMainBranch: false });
    return rows.map((row: any) => {
      const invs = visibleInvoices.filter((inv: any) => branchIdOfInvoice(inv) === row.id);
      const paid = invs.reduce((s: number, i: any) => s + (i.paidAmount || 0), 0);
      const due = invs.reduce((s: number, i: any) => s + (i.remainingAmount || 0), 0);
      const staff = staffMembers.filter((s: any) => s.isActive !== false && s.branchId === row.id).length;
      const emps = employees.filter((e: any) => branchOfEmployee(e.id) === row.id).length;
      const present = attendanceInRange.filter((a: any) => branchOfEmployee(a.employeeId) === row.id && a.status === 'present').length;
      const absent = attendanceInRange.filter((a: any) => branchOfEmployee(a.employeeId) === row.id && a.status === 'absent').length;
      const late = attendanceInRange.filter((a: any) => branchOfEmployee(a.employeeId) === row.id && a.status === 'late').length;
      const salaries = paidPayroll.filter((p: any) => branchOfEmployee(p.employeeId) === row.id).reduce((s: number, p: any) => s + (p.netSalary || 0), 0);
      return { id: row.id, name: row.name, isMainBranch: row.isMainBranch, invoices: invs.length, paid, due, avg: invs.length ? paid / invs.length : 0, staff, emps, present, absent, late, salaries };
    });
  }, [facilities, visibleInvoices, staffMembers, employees, attendanceInRange, paidPayroll]);

  const departmentRows = useMemo(() => {
    const map = new Map<string, { staff: number; expenses: number }>();
    employees.forEach((e: any) => {
      const key = e.department || 'غير محدد';
      const cur = map.get(key) || { staff: 0, expenses: 0 };
      cur.staff += 1;
      map.set(key, cur);
    });
    expensesInRange.forEach((e: any) => {
      const key = e.department || 'غير محدد';
      const cur = map.get(key) || { staff: 0, expenses: 0 };
      cur.expenses += e.amount || 0;
      map.set(key, cur);
    });
    return Array.from(map.entries()).map(([name, v]) => ({ name, staff: v.staff, expenses: v.expenses })).sort((a, b) => b.expenses - a.expenses);
  }, [employees, expensesInRange]);

  const card = (label: string, value: string, note: string, tone: string) => (
    <div className={'rounded-2xl border p-4 shadow-sm ' + tone}>
      <div className="text-[11px] font-bold opacity-70">{label}</div>
      <div className="text-xl font-extrabold font-mono mt-1">{value}</div>
      <div className="text-[10px] opacity-60 mt-1">{note}</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-rose-900 text-white flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">تقارير الإدارة</h2>
            <p className="text-[11px] text-slate-500">أداء الفروع والإدارات والحضور والرواتب في فترة محددة</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono" />
          <span className="text-slate-400 text-xs">إلى</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono" />
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold">
            <option value="all">كل الفروع</option>
            {facilities.map((f: any) => (
              <option key={f.id} value={f.id}>{f.nameAr}</option>
            ))}
          </select>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
            <Printer className="w-3.5 h-3.5" /> طباعة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {card('المحصّل', fmt(totalPaid) + ' ج.م', visibleInvoices.length + ' فاتورة', 'bg-emerald-50 border-emerald-200 text-emerald-900')}
        {card('غير محصّل', fmt(totalDue) + ' ج.م', 'متبقي على المرضى', 'bg-amber-50 border-amber-200 text-amber-900')}
        {card('المصروفات', fmt(totalExpenses) + ' ج.م', 'خلال الفترة', 'bg-rose-50 border-rose-200 text-rose-900')}
        {card('الرواتب المصروفة', fmt(totalPayroll) + ' ج.م', paidPayroll.length + ' مفرد رواتب', 'bg-indigo-50 border-indigo-200 text-indigo-900')}
        {card('صافي الربح', fmt(netProfit) + ' ج.م', 'بعد المصروفات والرواتب', netProfit >= 0 ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-red-50 border-red-200 text-red-900')}
        {card('متوسط الفاتورة', fmt(avgInvoice) + ' ج.م', 'لكل فاتورة', 'bg-slate-100 border-slate-300 text-slate-900')}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
          <Building2 className="w-4 h-4 text-rose-800" />
          <h3 className="font-extrabold text-sm text-slate-900">أداء الفروع</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 text-slate-600 font-bold">
              <tr>
                <th className="px-3 py-2">الفرع</th>
                <th className="px-3 py-2">فواتير</th>
                <th className="px-3 py-2">محصّل</th>
                <th className="px-3 py-2">غير محصّل</th>
                <th className="px-3 py-2">متوسط الفاتورة</th>
                <th className="px-3 py-2">كوادر الفروع</th>
                <th className="px-3 py-2">موظفو HR</th>
                <th className="px-3 py-2">رواتب مصروفة</th>
              </tr>
            </thead>
            <tbody>
              {branchRows.map((row: any) => (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-bold text-slate-800">{row.name}{row.isMainBranch ? ' (رئيسي)' : ''}</td>
                  <td className="px-3 py-2 font-mono">{fmt(row.invoices)}</td>
                  <td className="px-3 py-2 font-mono text-emerald-700 font-bold">{fmt(row.paid)}</td>
                  <td className="px-3 py-2 font-mono text-amber-700">{fmt(row.due)}</td>
                  <td className="px-3 py-2 font-mono">{fmt(row.avg)}</td>
                  <td className="px-3 py-2 font-mono">{fmt(row.staff)}</td>
                  <td className="px-3 py-2 font-mono">{fmt(row.emps)}</td>
                  <td className="px-3 py-2 font-mono text-indigo-700">{fmt(row.salaries)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
            <Wallet className="w-4 h-4 text-rose-800" />
            <h3 className="font-extrabold text-sm text-slate-900">الإدارات والمصروفات</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 text-slate-600 font-bold">
                <tr>
                  <th className="px-3 py-2">الإدارة</th>
                  <th className="px-3 py-2">عدد الموظفين</th>
                  <th className="px-3 py-2">المصروفات</th>
                  <th className="px-3 py-2">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {departmentRows.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">لا توجد بيانات في هذه الفترة</td></tr>
                )}
                {departmentRows.map((row: any) => (
                  <tr key={row.name} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-bold text-slate-800">{row.name}</td>
                    <td className="px-3 py-2 font-mono">{fmt(row.staff)}</td>
                    <td className="px-3 py-2 font-mono text-rose-700">{fmt(row.expenses)}</td>
                    <td className="px-3 py-2 font-mono">{totalExpenses > 0 ? Math.round((row.expenses / totalExpenses) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
            <Users className="w-4 h-4 text-rose-800" />
            <h3 className="font-extrabold text-sm text-slate-900">الحضور والانصراف حسب الفرع</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 text-slate-600 font-bold">
                <tr>
                  <th className="px-3 py-2">الفرع</th>
                  <th className="px-3 py-2">حضور</th>
                  <th className="px-3 py-2">غياب</th>
                  <th className="px-3 py-2">تأخير</th>
                </tr>
              </thead>
              <tbody>
                {branchRows.map((row: any) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-bold text-slate-800">{row.name}</td>
                    <td className="px-3 py-2 font-mono text-emerald-700">{fmt(row.present)}</td>
                    <td className="px-3 py-2 font-mono text-rose-700">{fmt(row.absent)}</td>
                    <td className="px-3 py-2 font-mono text-amber-700">{fmt(row.late)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-100 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> المصروفات تُحسب على مستوى الإدارة لأنها غير مرتبطة بفرع محدد
          </div>
        </div>
      </div>
    </div>
  );
};
