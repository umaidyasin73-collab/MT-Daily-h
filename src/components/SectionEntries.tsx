import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Trash2, Calendar, FileSpreadsheet, PlusCircle, AlertCircle } from 'lucide-react';
import { captureWithSafeStylesheets } from '../lib/captureUtils';
import { Entry, TranslationSet } from '../types';
import Autocomplete from './Autocomplete';

interface SectionEntriesProps {
  type: 'sale' | 'received' | 'payment';
  entries: Entry[];
  date: string;
  cities: string[];
  prevAmount: number;
  onUpdatePrevAmount: (val: number) => void;
  onAddEntry: (name: string, amount: number) => boolean;
  onDeleteEntry: (id: string) => void;
  t: TranslationSet;
}

export default function SectionEntries({
  type,
  entries,
  date,
  cities,
  prevAmount,
  onUpdatePrevAmount,
  onAddEntry,
  onDeleteEntry,
  t
}: SectionEntriesProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  // Filter entries for today's selected date
  const todayEntries = entries.filter(e => e.date === date && e.type === type);
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = todayTotal + prevAmount;

  // Handle addition
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount < 0) {
      setError(t.errorRequired);
      return;
    }

    const success = onAddEntry(name.trim(), parsedAmount);
    if (success) {
      setName('');
      setAmount('');
      setError(null);
    }
  };

  // Group dates in the selected month for the history log
  const getMonthKey = (d: string) => d.substring(0, 7);
  const currentMonthKey = getMonthKey(date);
  
  const allDatesInMonth = Array.from(new Set(
    entries
      .filter(e => e.type === type && getMonthKey(e.date) === currentMonthKey)
      .map(e => e.date)
  )).sort();

  // Create running history totals
  let runningHistory: { date: string; total: number; prev: number; grand: number }[] = [];
  let currentRunning = 0;
  
  allDatesInMonth.forEach(d => {
    const dayTotal = entries
      .filter(e => e.type === type && e.date === d)
      .reduce((sum, e) => sum + e.amount, 0);
    
    // We check if there's any manual overridden previous amount for the current selected date
    // or if we should display the standard mathematical running previous.
    const prevVal = currentRunning;
    currentRunning += dayTotal;

    runningHistory.push({
      date: d,
      total: dayTotal,
      prev: prevVal,
      grand: currentRunning
    });
  });

  // Handle Capture Section
  const handleCaptureSection = async () => {
    if (!captureRef.current) return;
    setCapturing(true);
    setTimeout(async () => {
      let clone: HTMLDivElement | null = null;
      try {
        const originalEl = captureRef.current!;
        
        // Create a perfect clean clone of the document element to avoid viewport/scrolling cuts
        clone = originalEl.cloneNode(true) as HTMLDivElement;
        clone.classList.add('classic-colors-only');
        
        // Apply inline styles to isolate and render the cloned document perfectly
        clone.style.position = 'fixed';
        clone.style.top = '0';
        clone.style.left = '-9999px'; // Render safely offscreen
        clone.style.width = originalEl.offsetWidth + 'px';
        clone.style.height = originalEl.offsetHeight + 'px';
        clone.style.background = '#ffffff';
        clone.style.color = '#0f172a';
        clone.style.zIndex = '-9999';
        
        document.body.appendChild(clone);

        const canvas = await captureWithSafeStylesheets(clone, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: originalEl.offsetWidth,
          windowHeight: originalEl.offsetHeight,
          imageTimeout: 0,
        });

        const link = document.createElement('a');
        link.download = `Musa-Traders-${type}-${date}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Failed to capture:', err);
        alert('Could not capture image. Please try again.');
      } finally {
        if (clone && clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
        setCapturing(false);
      }
    }, 150);
  };

  const getFormLabel = () => {
    if (type === 'sale') return { title: t.addSaleTitle, field: t.branchName };
    if (type === 'received') return { title: t.addReceivedTitle, field: t.receivedFrom };
    return { title: t.addPaymentTitle, field: t.paidTo };
  };

  const formLabels = getFormLabel();

  // Format currency
  const formatRs = (n: number) => {
    return 'Rs ' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Format date readable
  const formatDateDisplay = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Forms & Inputs card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col gap-4"
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{formLabels.title}</h3>
          </div>

          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
            <div className="sm:col-span-2">
              <Autocomplete
                value={name}
                onChange={setName}
                suggestions={cities}
                placeholder={t.tableName}
                label={formLabels.field}
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                {t.tableAmount}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder={t.amountPlaceholder}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>

            <div className="sm:col-span-1">
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1"
              >
                {t.addBtn}
              </button>
            </div>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-xs text-rose-600 font-semibold"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Editable Previous Amount card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col gap-3 justify-center"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              {t.previousAmount}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={prevAmount === 0 ? '' : prevAmount}
              onChange={e => onUpdatePrevAmount(parseFloat(e.target.value) || 0)}
              placeholder="Auto calculated"
              className="w-full px-3.5 py-2.5 text-base font-bold font-mono text-[#010066] dark:text-indigo-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010066]"
            />
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            ← {t.previousNote}
          </p>
        </motion.div>
      </div>

      {/* Screen capture image row */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCaptureSection}
          disabled={capturing}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-100/50 dark:border-slate-700/50 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          {capturing ? 'Capturing...' : t.downloadBtn}
        </motion.button>
      </div>

      {/* Capture wrapper for image export */}
      <div
        ref={captureRef}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col gap-6"
      >
        {/* Table of today's records */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                <th className="py-3 px-4 w-16">{t.tableSNo}</th>
                <th className="py-3 px-4">{formLabels.field}</th>
                <th className="py-3 px-4 text-right w-48">{t.tableAmount}</th>
                <th className="py-3 px-4 text-center w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {todayEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium italic">
                    {t.tableEmpty}
                  </td>
                </tr>
              ) : (
                todayEntries.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-semibold">{e.name}</td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-800 dark:text-slate-200">
                      {formatRs(e.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(e.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Ledger Summary strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-5">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100/50 dark:border-slate-800/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Today's Logging
            </span>
            <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-200 mt-1 block">
              {formatRs(todayTotal)}
            </span>
          </div>

          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100/50 dark:border-slate-800/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              {t.historyPrev}
            </span>
            <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-200 mt-1 block">
              {formatRs(prevAmount)}
            </span>
          </div>

          <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-xl border-2 border-indigo-500/25">
            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block">
              {t.historyGrandTotal}
            </span>
            <span className="text-xl font-black font-mono text-[#010066] dark:text-indigo-400 mt-1 block">
              {formatRs(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: History table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100">{t.historyTitle}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-500">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                <th className="py-2.5 px-4">{t.historyDate}</th>
                <th className="py-2.5 px-4 text-right">{t.historyTotal}</th>
                <th className="py-2.5 px-4 text-right">{t.historyPrev}</th>
                <th className="py-2.5 px-4 text-right">{t.historyGrandTotal}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/20 font-mono">
              {runningHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                    No history logged for this month yet.
                  </td>
                </tr>
              ) : (
                runningHistory.map(row => (
                  <tr key={row.date} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-400">
                      {formatDateDisplay(row.date)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300">
                      {formatRs(row.total)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {formatRs(row.prev)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {formatRs(row.grand)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
