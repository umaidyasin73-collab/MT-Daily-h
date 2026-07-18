import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Calendar, CheckCircle2, TrendingUp, ArrowDownCircle, ArrowUpCircle, BarChart3, LineChart, PieChart } from 'lucide-react';
import { captureWithSafeStylesheets } from '../lib/captureUtils';
import { Entry, TranslationSet } from '../types';
import MusaLogo from './MusaLogo';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SummaryPageProps {
  date: string;
  entries: Entry[];
  prevSale: number;
  prevReceived: number;
  prevPayment: number;
  t: TranslationSet;
}

export default function SummaryPage({
  date,
  entries,
  prevSale,
  prevReceived,
  prevPayment,
  t
}: SummaryPageProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  // Selected Month calculations for the chart
  const [yearStr, monthStr] = date ? date.split('-') : ['', ''];
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const selectedMonthKey = (yearStr && monthStr) ? `${yearStr}-${monthStr}` : '';

  // Calculate days in the selected month
  const daysInMonth = (year && month) ? new Date(year, month, 0).getDate() : 30;

  // Filter entries for the selected month
  const monthlyEntries = selectedMonthKey 
    ? entries.filter(e => e.date.startsWith(selectedMonthKey))
    : [];

  const monthlySalesTotal = monthlyEntries.filter(e => e.type === 'sale').reduce((sum, e) => sum + e.amount, 0);
  const monthlyReceivedTotal = monthlyEntries.filter(e => e.type === 'received').reduce((sum, e) => sum + e.amount, 0);
  const monthlyPaymentsTotal = monthlyEntries.filter(e => e.type === 'payment').reduce((sum, e) => sum + e.amount, 0);

  // Format month name for display
  const formatMonthDisplay = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  // Generate chart data for each day of the month
  const chartData = selectedMonthKey ? Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${selectedMonthKey}-${dayStr}`;

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
  }) : [];

  // Y-Axis Formatter for PKR Lakhs / Thousands
  const formatYAxis = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return String(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg font-sans">
          <p className="font-extrabold text-slate-800 dark:text-slate-100 mb-1.5 text-xs border-b border-slate-100 dark:border-slate-800 pb-1">
            {t.chartDay}: {label}
          </p>
          <div className="flex flex-col gap-1.5 text-xs">
            {payload.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5 font-bold" style={{ color: p.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}:
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-slate-100">
                  Rs {p.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Format currency
  const formatRs = (n: number) => {
    return 'Rs ' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Format Date for report
  const formatDateDisplay = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Group entries for this specific date
  const todaySales = entries.filter(e => e.date === date && e.type === 'sale');
  const todayReceived = entries.filter(e => e.date === date && e.type === 'received');
  const todayPayment = entries.filter(e => e.date === date && e.type === 'payment');

  const todaySaleTotal = todaySales.reduce((sum, e) => sum + e.amount, 0);
  const todayReceivedTotal = todayReceived.reduce((sum, e) => sum + e.amount, 0);
  const todayPaymentTotal = todayPayment.reduce((sum, e) => sum + e.amount, 0);

  const grandSaleTotal = todaySaleTotal + prevSale;
  const grandReceivedTotal = todayReceivedTotal + prevReceived;
  const grandPaymentTotal = todayPaymentTotal + prevPayment;

  // Handle Capture
  const handleCapture = async () => {
    if (!summaryRef.current) return;
    setCapturing(true);

    // Minor delay to let state render clean
    setTimeout(async () => {
      try {
        const originalEl = summaryRef.current!;
        
        // Temporarily add classic styling class to guarantee black/slate colors instead of oklch
        originalEl.classList.add('classic-colors-only');

        const canvas = await captureWithSafeStylesheets(originalEl, {
          backgroundColor: '#ffffff',
          scale: 2.5, // High resolution crisp export
          useCORS: true,
          allowTaint: false,
          logging: false,
          imageTimeout: 0,
        });

        const link = document.createElement('a');
        link.download = `Musa-Traders-Summary-${date}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Failed to capture report:', err);
        alert('Could not capture image. Please try again.');
      } finally {
        if (summaryRef.current) {
          summaryRef.current.classList.remove('classic-colors-only');
        }
        setCapturing(false);
      }
    }, 150);
  };

  // Generate repeating watermark tiles
  const watermarks = Array.from({ length: 18 });

  return (
    <div className="flex flex-col gap-5">
      {/* Action Row */}
      <div className="flex justify-end items-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCapture}
          disabled={capturing}
          className={`flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10 cursor-pointer transition-all ${
            capturing ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <Camera className="w-4 h-4" />
          {capturing ? 'Generating Image...' : t.downloadBtn}
        </motion.button>
      </div>

      {/* Printable Sheet Wrapper */}
      <div
        ref={summaryRef}
        className="relative bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl overflow-hidden max-w-4xl mx-auto w-full select-none"
      >
        {/* Tiled Watermark Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-[0.03] grid grid-cols-3 md:grid-cols-6 gap-y-16 gap-x-12 p-8">
          {watermarks.map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center transform -rotate-12">
              <MusaLogo size={45} />
              <span className="text-[8px] font-extrabold text-[#010066] tracking-wider mt-1">MUSA TRADERS</span>
            </div>
          ))}
        </div>

        {/* Center Giant Watermark Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.045] pointer-events-none select-none z-0 transform -rotate-12">
          <MusaLogo size={350} />
        </div>

        {/* Header Block */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-b-4 border-[#010066] pb-5 mb-6 gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <MusaLogo size={70} className="filter drop-shadow-sm" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#010066] font-serif tracking-tight leading-tight">
                {t.summaryTitle}
              </h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center justify-center sm:justify-start gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> OFFICIAL SYSTEM RECORD
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#010066]/5 px-4 py-2.5 rounded-xl border border-[#010066]/10">
            <Calendar className="w-5 h-5 text-[#010066]" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.summaryDate}
              </p>
              <p className="text-base font-black text-[#010066] font-mono leading-none mt-0.5">
                {formatDateDisplay(date)}
              </p>
            </div>
          </div>
        </div>

        {/* Main 3 Blocks Layout */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Section 1: Sale */}
          <div className="flex flex-col border border-slate-200/80 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="bg-[#010066] px-4 py-2.5 text-white font-bold text-sm tracking-wide flex justify-between items-center shadow-inner">
              <span>{t.tabSale}</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            </div>
            <div className="flex-1 p-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-1.5 text-left w-8">{t.tableSNo}</th>
                    <th className="py-1.5 text-left">{t.tableName}</th>
                    <th className="py-1.5 text-right">{t.tableAmount}</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySales.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 italic">
                        {t.tableEmpty}
                      </td>
                    </tr>
                  ) : (
                    todaySales.map((e, idx) => (
                      <tr key={e.id} className="border-b border-slate-100 hover:bg-[#010066]/5">
                        <td className="py-1.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-1.5 font-medium text-slate-800">{e.name}</td>
                        <td className="py-1.5 text-right font-mono font-semibold">{e.amount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Totals panel */}
            <div className="bg-slate-50 border-t border-slate-200 text-[11px] p-3 flex flex-col gap-1.5 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Today Total:</span>
                <span className="font-semibold">{formatRs(todaySaleTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t.historyPrev}:</span>
                <span className="font-semibold">{formatRs(prevSale)}</span>
              </div>
              <div className="flex justify-between text-[#010066] font-bold text-xs pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>{formatRs(grandSaleTotal)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Received */}
          <div className="flex flex-col border border-slate-200/80 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="bg-[#1A1A7A] px-4 py-2.5 text-white font-bold text-sm tracking-wide flex justify-between items-center shadow-inner">
              <span>{t.tabReceived}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="flex-1 p-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-1.5 text-left w-8">{t.tableSNo}</th>
                    <th className="py-1.5 text-left">{t.tableName}</th>
                    <th className="py-1.5 text-right">{t.tableAmount}</th>
                  </tr>
                </thead>
                <tbody>
                  {todayReceived.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 italic">
                        {t.tableEmpty}
                      </td>
                    </tr>
                  ) : (
                    todayReceived.map((e, idx) => (
                      <tr key={e.id} className="border-b border-slate-100 hover:bg-[#1A1A7A]/5">
                        <td className="py-1.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-1.5 font-medium text-slate-800">{e.name}</td>
                        <td className="py-1.5 text-right font-mono font-semibold">{e.amount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Totals panel */}
            <div className="bg-slate-50 border-t border-slate-200 text-[11px] p-3 flex flex-col gap-1.5 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Today Total:</span>
                <span className="font-semibold">{formatRs(todayReceivedTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t.historyPrev}:</span>
                <span className="font-semibold">{formatRs(prevReceived)}</span>
              </div>
              <div className="flex justify-between text-[#1A1A7A] font-bold text-xs pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>{formatRs(grandReceivedTotal)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Payment */}
          <div className="flex flex-col border border-slate-200/80 rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="bg-[#33339A] px-4 py-2.5 text-white font-bold text-sm tracking-wide flex justify-between items-center shadow-inner">
              <span>{t.tabPayment}</span>
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
            </div>
            <div className="flex-1 p-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-1.5 text-left w-8">{t.tableSNo}</th>
                    <th className="py-1.5 text-left">{t.tableName}</th>
                    <th className="py-1.5 text-right">{t.tableAmount}</th>
                  </tr>
                </thead>
                <tbody>
                  {todayPayment.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 italic">
                        {t.tableEmpty}
                      </td>
                    </tr>
                  ) : (
                    todayPayment.map((e, idx) => (
                      <tr key={e.id} className="border-b border-slate-100 hover:bg-[#33339A]/5">
                        <td className="py-1.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-1.5 font-medium text-slate-800">{e.name}</td>
                        <td className="py-1.5 text-right font-mono font-semibold">{e.amount.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Totals panel */}
            <div className="bg-slate-50 border-t border-slate-200 text-[11px] p-3 flex flex-col gap-1.5 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Today Total:</span>
                <span className="font-semibold">{formatRs(todayPaymentTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t.historyPrev}:</span>
                <span className="font-semibold">{formatRs(prevPayment)}</span>
              </div>
              <div className="flex justify-between text-[#33339A] font-bold text-xs pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>{formatRs(grandPaymentTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Footer Ledger Stats */}
        <div className="relative z-10 bg-slate-50/95 border-2 border-[#010066]/20 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="w-8 h-8 text-[#010066] shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                {t.ovSale}
              </p>
              <p className="text-base font-black font-mono text-slate-800 leading-tight">
                {formatRs(grandSaleTotal)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-x border-slate-200 pt-3 sm:pt-0 sm:px-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                {t.ovReceived}
              </p>
              <p className="text-base font-black font-mono text-slate-800 leading-tight">
                {formatRs(grandReceivedTotal)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
            <ArrowDownCircle className="w-8 h-8 text-rose-600 shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                {t.ovPayment}
              </p>
              <p className="text-base font-black font-mono text-slate-800 leading-tight">
                {formatRs(grandPaymentTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Business Day Balance Banner */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center mt-5 p-3.5 bg-indigo-50/90 border border-indigo-100 rounded-2xl">
          <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider">
            NET LIQUID BALANCE (RECEIVED - PAYMENT)
          </span>
          <span className="text-xl font-extrabold font-mono text-indigo-900 mt-1">
            {formatRs(grandReceivedTotal - grandPaymentTotal)}
          </span>
        </div>
      </div>

      {/* Monthly Financial Chart Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl max-w-4xl mx-auto w-full mt-2 flex flex-col gap-6"
        id="monthly-chart-card"
        data-html2canvas-ignore="true"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                {t.chartTitle} ({formatMonthDisplay(date)})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                {t.chartSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Mini Month-to-Date Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-amber-100 dark:border-amber-950/30 bg-amber-50/30 dark:bg-amber-950/10 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {t.tabSale} - MTD
            </span>
            <span className="text-lg font-black font-mono text-amber-950 dark:text-amber-200 mt-1">
              {formatRs(monthlySalesTotal)}
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50/30 dark:bg-emerald-950/10 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {t.tabReceived} - MTD
            </span>
            <span className="text-lg font-black font-mono text-emerald-950 dark:text-emerald-200 mt-1">
              {formatRs(monthlyReceivedTotal)}
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-rose-100 dark:border-rose-950/30 bg-rose-50/30 dark:bg-rose-950/10 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {t.tabPayment} - MTD
            </span>
            <span className="text-lg font-black font-mono text-rose-950 dark:text-rose-200 mt-1">
              {formatRs(monthlyPaymentsTotal)}
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="w-full h-[350px] font-mono mt-2" id="recharts-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
              <XAxis 
                dataKey="day" 
                tickLine={false}
                axisLine={false}
                stroke="#64748b"
                fontSize={10}
                dy={8}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                tickLine={false}
                axisLine={false}
                stroke="#64748b"
                fontSize={10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontFamily: 'sans-serif', fontWeight: 'bold' }}
              />
              <Bar dataKey={t.chartSales} fill="#FFCB05" radius={[4, 4, 0, 0]} maxBarSize={12} />
              <Bar dataKey={t.chartReceived} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={12} />
              <Bar dataKey={t.chartPayments} fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
