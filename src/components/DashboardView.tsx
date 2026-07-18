import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Activity, 
  MapPin, 
  Percent, 
  Building, 
  ArrowRight,
  Info,
  BadgeAlert,
  Zap,
  TrendingDown,
  Clock
} from 'lucide-react';
import { Entry, TranslationSet } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface DashboardViewProps {
  entries: Entry[];
  date: string; // YYYY-MM-DD
  t: TranslationSet;
  setActiveTab: (tab: 'dashboard' | 'sale' | 'received' | 'payment' | 'summary' | 'cities') => void;
}

const COLORS = ['#FFCB05', '#10b981', '#f43f5e', '#6366f1', '#a855f7', '#06b6d4', '#f97316'];

export default function DashboardView({ entries, date, t, setActiveTab }: DashboardViewProps) {
  // Parse year & month
  const [yearStr, monthStr, dayStr] = date ? date.split('-') : ['', '', ''];
  const currentMonthKey = (yearStr && monthStr) ? `${yearStr}-${monthStr}` : '';

  // Calculate days in the selected month
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = (year && month) ? new Date(year, month, 0).getDate() : 30;

  // Filter entries for the selected month
  const monthlyEntries = useMemo(() => {
    return currentMonthKey ? entries.filter(e => e.date.startsWith(currentMonthKey)) : [];
  }, [entries, currentMonthKey]);

  // Today's entries
  const todayEntries = useMemo(() => {
    return entries.filter(e => e.date === date);
  }, [entries, date]);

  // MTD sums
  const salesMTD = useMemo(() => {
    return monthlyEntries.filter(e => e.type === 'sale').reduce((sum, e) => sum + e.amount, 0);
  }, [monthlyEntries]);

  const receivedMTD = useMemo(() => {
    return monthlyEntries.filter(e => e.type === 'received').reduce((sum, e) => sum + e.amount, 0);
  }, [monthlyEntries]);

  const paymentsMTD = useMemo(() => {
    return monthlyEntries.filter(e => e.type === 'payment').reduce((sum, e) => sum + e.amount, 0);
  }, [monthlyEntries]);

  const netCashflow = receivedMTD - paymentsMTD;
  const collectionRate = salesMTD > 0 ? (receivedMTD / salesMTD) * 100 : 0;

  // Format month display name
  const monthDisplay = useMemo(() => {
    const dt = new Date(`${currentMonthKey}-01T00:00:00`);
    if (isNaN(dt.getTime())) return currentMonthKey;
    return dt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [currentMonthKey]);

  // Daily trends for the selected month
  const trendData = useMemo(() => {
    if (!currentMonthKey) return [];
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dStr = String(day).padStart(2, '0');
      const fullDate = `${currentMonthKey}-${dStr}`;

      const dayEntries = monthlyEntries.filter(e => e.date === fullDate);
      const sales = dayEntries.filter(e => e.type === 'sale').reduce((sum, e) => sum + e.amount, 0);
      const received = dayEntries.filter(e => e.type === 'received').reduce((sum, e) => sum + e.amount, 0);
      const payments = dayEntries.filter(e => e.type === 'payment').reduce((sum, e) => sum + e.amount, 0);

      return {
        day: String(day),
        [t.chartSales]: sales,
        [t.chartReceived]: received,
        [t.chartPayments]: payments,
      };
    });
  }, [monthlyEntries, currentMonthKey, daysInMonth, t]);

  // City / Branch-wise sales distribution
  const branchSalesData = useMemo(() => {
    const branchMap: Record<string, number> = {};
    monthlyEntries.filter(e => e.type === 'sale').forEach(e => {
      branchMap[e.name] = (branchMap[e.name] || 0) + e.amount;
    });

    return Object.entries(branchMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyEntries]);

  // Top branches limit for display
  const topBranches = useMemo(() => branchSalesData.slice(0, 5), [branchSalesData]);

  // Average transaction sizing
  const stats = useMemo(() => {
    const sales = monthlyEntries.filter(e => e.type === 'sale');
    const avgSale = sales.length > 0 ? sales.reduce((sum, e) => sum + e.amount, 0) / sales.length : 0;
    const busyDay = trendData.reduce((max, day) => {
      const totalSales = day[t.chartSales] || 0;
      return totalSales > max.sales ? { day: day.day, sales: totalSales } : max;
    }, { day: '-', sales: 0 });

    return {
      avgSale,
      busyDay: busyDay.sales > 0 ? `${t.chartDay} ${busyDay.day}` : '-',
      busyDayAmount: busyDay.sales,
      totalEntriesCount: monthlyEntries.length
    };
  }, [monthlyEntries, trendData, t]);

  // Helper formatting for currency
  const formatRs = (value: number) => {
    return 'Rs ' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const formatShortRs = (value: number) => {
    if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `Rs ${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `Rs ${(value / 1000).toFixed(1)}k`;
    return `Rs ${value}`;
  };

  // Custom tooltips
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xl font-sans text-xs">
          <p className="font-extrabold text-slate-800 dark:text-slate-100 mb-2 border-b border-slate-100 dark:border-slate-800/80 pb-1">
            {t.chartDay} {label} ({monthDisplay})
          </p>
          <div className="flex flex-col gap-1.5">
            {payload.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-1.5 font-bold" style={{ color: p.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}:
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-slate-100">
                  {formatRs(p.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6" id="dashboard-tab-view">
      {/* Date banner & Monthly context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#010066] text-white shadow-md">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
              {monthDisplay}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Active Dashboard Month context
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-900">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {t.dbTotalTransactions}: <strong className="font-mono text-slate-800 dark:text-slate-100">{stats.totalEntriesCount}</strong>
          </span>
        </div>
      </div>

      {/* Main KPI Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Sales */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t.dbTotalSales}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 block">
              {formatRs(salesMTD)}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
              Month to Date (MTD) Sales
            </span>
          </div>
        </motion.div>

        {/* KPI 2: Received */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t.dbTotalReceived}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
              <ArrowUpRight className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 block">
              {formatRs(receivedMTD)}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-semibold">
              <Percent className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Collection: <strong className="text-emerald-600 dark:text-emerald-400">{collectionRate.toFixed(1)}%</strong></span>
            </div>
          </div>
        </motion.div>

        {/* KPI 3: Payments */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t.dbTotalPayments}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500">
              <ArrowDownLeft className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 block">
              {formatRs(paymentsMTD)}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
              Month to Date Expense / Payments
            </span>
          </div>
        </motion.div>

        {/* KPI 4: Net Cash Balance */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-[#010066]/5 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-950/35 p-5 rounded-3xl shadow-sm flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#010066] dark:text-indigo-400 uppercase tracking-widest">
              {t.dbNetBalance}
            </span>
            <div className={`p-2 rounded-xl ${netCashflow >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {netCashflow >= 0 ? <TrendingUp className="w-4.5 h-4.5" /> : <TrendingDown className="w-4.5 h-4.5" />}
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-2xl font-black font-mono block ${netCashflow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              {formatRs(netCashflow)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-1">
              {t.dbBalanceTitle}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts Section: Daily Trend + Branch Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main trend chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                  {t.dbDailyTrend}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Flow Comparison across {daysInMonth} Days
                </p>
              </div>
            </div>
          </div>

          <div className="w-full h-[280px] font-mono text-[9px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFCB05" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#FFCB05" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/30" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis tickFormatter={(val) => formatShortRs(val).replace('Rs ', '')} tickLine={false} axisLine={false} stroke="#94a3b8" />
                <Tooltip content={<CustomAreaTooltip />} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', fontFamily: 'sans-serif', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey={t.chartSales} stroke="#FFCB05" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey={t.chartReceived} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReceived)" />
                <Area type="monotone" dataKey={t.chartPayments} stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorPayments)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch / City sales share */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                  {t.dbTopBranches}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Share of Sales of Top Branches
                </p>
              </div>
            </div>
          </div>

          {branchSalesData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <BadgeAlert className="w-10 h-10 stroke-1 text-slate-300 mb-2" />
              <p className="text-xs font-semibold">No branch sales data recorded for this month.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-around gap-4">
              {/* Mini donut chart */}
              <div className="w-full h-[140px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topBranches}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={58}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {topBranches.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatRs(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Sales</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200">Share</span>
                </div>
              </div>

              {/* Top 5 list */}
              <div className="flex flex-col gap-2">
                {topBranches.map((b, idx) => {
                  const pct = salesMTD > 0 ? (b.value / salesMTD) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-800/20 pb-1.5 last:border-none">
                      <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        {b.name}
                      </span>
                      <div className="flex items-center gap-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        <span>{formatRs(b.value)}</span>
                        <span className="text-[10px] font-semibold text-slate-400">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insights Row & Today's Activity Log */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick statistics / Analytical Insights */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm pb-3 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            {t.dbQuickInsights}
          </h3>

          <div className="flex flex-col gap-4 flex-1 justify-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {t.dbAverageSale}
                </span>
                <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {formatRs(stats.avgSale)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-2xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Busiest Day Sales
                </span>
                <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {stats.busyDayAmount > 0 ? (
                    <>
                      {formatRs(stats.busyDayAmount)}{" "}
                      <span className="text-xs font-semibold text-slate-400">({stats.busyDay})</span>
                    </>
                  ) : '-'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Collection Ratio
                </span>
                <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {collectionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Transactions Log */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                  {t.dbRecentTransactions}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Entries logged on {date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer select-none" onClick={() => setActiveTab('sale')}>
              <span>Manage Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {todayEntries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Info className="w-9 h-9 text-slate-300 stroke-1 mb-1.5" />
              <p className="text-xs font-semibold">No transactions entered today.</p>
              <button 
                onClick={() => setActiveTab('sale')}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
              >
                + Add Today's First Record
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[190px] pr-1 flex flex-col gap-2">
              {todayEntries.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/60 dark:bg-slate-950/40 dark:hover:bg-slate-950/60 border border-slate-100 dark:border-slate-900 rounded-2xl transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono font-black text-slate-400 w-5">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-black text-slate-800 dark:text-slate-100 text-xs block">
                        {item.name}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider mt-0.5 block">
                        {item.type === 'sale' && <span className="text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-md">{t.tabSale}</span>}
                        {item.type === 'received' && <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-md">{t.tabReceived}</span>}
                        {item.type === 'payment' && <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded-md">{t.tabPayment}</span>}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-xs">
                    {formatRs(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
