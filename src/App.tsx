import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  Settings,
  Globe,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Building
} from 'lucide-react';

import MusaLogo from './components/MusaLogo';
import BackgroundCanvas from './components/BackgroundCanvas';
import SectionEntries from './components/SectionEntries';
import SummaryPage from './components/SummaryPage';
import ManageCities from './components/ManageCities';

import { translations } from './utils/translations';
import {
  loadCitiesFromStorage,
  saveCitiesToStorage,
  loadEntriesFromStorage,
  saveEntriesToStorage
} from './utils/localStorage';
import { Entry, BackgroundStyle, Language } from './types';

export default function App() {
  // Primary State
  const [entries, setEntries] = useState<Entry[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  
  // Date State - Default to 2026-07-17 (matching context time)
  const [selectedDate, setSelectedDate] = useState('2026-07-17');
  
  // Custom previous amount overrides indexed by date and entry type
  const [prevOverrides, setPrevOverrides] = useState<Record<string, { sale?: number; received?: number; payment?: number }>>({});
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'sale' | 'received' | 'payment' | 'summary' | 'cities'>('sale');
  
  // Visual Theme States
  const [language, setLanguage] = useState<Language>('en');
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>('aurora');
  
  // Interactive toast alert system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Load Initial Storage
  useEffect(() => {
    setEntries(loadEntriesFromStorage());
    setCities(loadCitiesFromStorage());
    try {
      const raw = localStorage.getItem('musa_traders_prev_overrides_v2');
      if (raw) {
        setPrevOverrides(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to load overrides from storage', e);
    }
  }, []);

  // Setup keyboard shortcuts for tab navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.hasAttribute('contenteditable')
      );

      const TABS: ('sale' | 'received' | 'payment' | 'summary' | 'cities')[] = [
        'sale',
        'received',
        'payment',
        'summary',
        'cities'
      ];

      // Handle Alt + Number (1-5) switches tabs even when typing
      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('sale');
          return;
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('received');
          return;
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('payment');
          return;
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTab('summary');
          return;
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveTab('cities');
          return;
        }
      }

      if (isTyping) {
        return;
      }

      // Arrow keys navigation when NOT typing
      if (e.key === 'ArrowRight' || e.key === 'Right') {
        e.preventDefault();
        setActiveTab(prev => {
          const currIdx = TABS.indexOf(prev);
          const nextIdx = (currIdx + 1) % TABS.length;
          return TABS[nextIdx];
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        e.preventDefault();
        setActiveTab(prev => {
          const currIdx = TABS.indexOf(prev);
          const nextIdx = (currIdx - 1 + TABS.length) % TABS.length;
          return TABS[nextIdx];
        });
      } else if (e.key === '1') {
        setActiveTab('sale');
      } else if (e.key === '2') {
        setActiveTab('received');
      } else if (e.key === '3') {
        setActiveTab('payment');
      } else if (e.key === '4') {
        setActiveTab('summary');
      } else if (e.key === '5') {
        setActiveTab('cities');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Save changes to storage whenever state updates
  const handleUpdateEntries = (updated: Entry[]) => {
    setEntries(updated);
    saveEntriesToStorage(updated);
  };

  const handleUpdateCities = (updated: string[]) => {
    setCities(updated);
    saveCitiesToStorage(updated);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      entries: loadEntriesFromStorage(),
      cities: loadCitiesFromStorage(),
      prevOverrides: (() => {
        try {
          const raw = localStorage.getItem('musa_traders_prev_overrides_v2');
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      })()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `musa_traders_backup_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(language === 'en' ? 'Backup file downloaded successfully!' : 'بیک اپ فائل کامیابی سے ڈاؤن لوڈ ہو گئی!', 'success');
  };

  const handleImportBackup = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rawText = e.target?.result;
          if (typeof rawText !== 'string') throw new Error('Invalid content');
          
          const parsed = JSON.parse(rawText);
          
          if (!parsed || (typeof parsed !== 'object')) {
            throw new Error('Invalid JSON structure');
          }
          
          const importedEntries = Array.isArray(parsed.entries) ? parsed.entries : null;
          const importedCities = Array.isArray(parsed.cities) ? parsed.cities : null;
          const importedOverrides = (parsed.prevOverrides && typeof parsed.prevOverrides === 'object') ? parsed.prevOverrides : {};
          
          if (!importedEntries && !importedCities) {
            throw new Error('Required fields missing');
          }
          
          if (importedEntries) {
            saveEntriesToStorage(importedEntries);
            setEntries(importedEntries);
          }
          
          if (importedCities) {
            saveCitiesToStorage(importedCities);
            setCities(importedCities);
          }
          
          localStorage.setItem('musa_traders_prev_overrides_v2', JSON.stringify(importedOverrides));
          setPrevOverrides(importedOverrides);
          
          showToast(t.importSuccess, 'success');
          resolve(true);
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
        } catch (err) {
          console.error(err);
          showToast(t.importError, 'info');
          resolve(false);
        }
      };
      reader.onerror = () => {
        showToast(t.importError, 'info');
        resolve(false);
      };
      reader.readAsText(file);
    });
  };

  // Helper for displaying notifications
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const t = translations[language];

  // Group Year-Month strings
  const getMonthKey = (d: string) => d.substring(0, 7);
  const currentMonthKey = getMonthKey(selectedDate);

  // Date Shift Utilities
  const handleMonthShift = (delta: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    const target = new Date(current.getFullYear(), current.getMonth() + delta, 1);
    // Clamp the target date day to the last valid day of the shifted month
    const lastDayOfMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(current.getDate(), lastDayOfMonth));

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Helper: auto-calculate actual monthly previous totals
  const getAutoPreviousAmount = (type: 'sale' | 'received' | 'payment') => {
    return entries
      .filter(e => e.type === type && getMonthKey(e.date) === currentMonthKey && e.date < selectedDate)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  // Helper: get the previous amount (checking if user set manual override for this date)
  const getPreviousAmount = (type: 'sale' | 'received' | 'payment') => {
    const dayOverride = prevOverrides[selectedDate]?.[type];
    if (dayOverride !== undefined) {
      return dayOverride;
    }
    return getAutoPreviousAmount(type);
  };

  const updatePrevAmountOverride = (type: 'sale' | 'received' | 'payment', value: number) => {
    const updated = {
      ...prevOverrides,
      [selectedDate]: {
        ...prevOverrides[selectedDate],
        [type]: value
      }
    };
    setPrevOverrides(updated);
    localStorage.setItem('musa_traders_prev_overrides_v2', JSON.stringify(updated));
  };

  // Actions: Add Entry
  const handleAddEntry = (type: 'sale' | 'received' | 'payment', name: string, amount: number) => {
    const newRecord: Entry = {
      id: `${type}-${Date.now()}`,
      date: selectedDate,
      name,
      amount,
      type
    };
    const updated = [...entries, newRecord];
    handleUpdateEntries(updated);
    showToast(t.toastAdded, 'success');
    return true;
  };

  // Actions: Delete Entry
  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    handleUpdateEntries(updated);
    showToast(t.toastDeleted, 'info');
  };

  // Actions: Manage Cities
  const handleAddCity = (name: string) => {
    if (cities.some(c => c.toLowerCase() === name.toLowerCase())) {
      return t.cityErrorExists;
    }
    const updated = [...cities, name].sort((a, b) => a.localeCompare(b));
    handleUpdateCities(updated);
    showToast(t.toastCityAdded, 'success');
    return true;
  };

  const handleDeleteCity = (name: string) => {
    const updated = cities.filter(c => c !== name);
    handleUpdateCities(updated);
    showToast(t.toastCityDeleted, 'info');
  };

  // Compute month totals for overview banner (sum of current selected month logs + custom manual override of the selected date's previous value)
  const getMonthTotal = (type: 'sale' | 'received' | 'payment') => {
    const currentDayAmount = entries
      .filter(e => e.type === type && e.date === selectedDate)
      .reduce((sum, e) => sum + e.amount, 0);
    const prevAmount = getPreviousAmount(type);
    return prevAmount + currentDayAmount;
  };

  const monthSaleTotal = getMonthTotal('sale');
  const monthReceivedTotal = getMonthTotal('received');
  const monthPaymentTotal = getMonthTotal('payment');

  return (
    <main className="relative min-h-screen w-full bg-slate-50 text-slate-800 font-sans antialiased overflow-x-hidden p-3 md:p-6 lg:p-8 flex flex-col items-center">
      {/* Dynamic Animated Layer */}
      <BackgroundCanvas style={bgStyle} />

      {/* Floating Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-5 z-[9999] flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold tracking-wide ${
              toast.type === 'success'
                ? 'bg-[#010066] text-[#FFCB05] border-[#FFCB05]/20'
                : 'bg-indigo-50 text-[#010066] border-indigo-100'
            }`}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-6xl flex flex-col gap-6">
        {/* Top Header Actions / Language / Animation Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white/70 backdrop-blur-md border border-slate-100 rounded-2xl p-3.5 shadow-sm gap-3">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <MusaLogo size={42} className="filter drop-shadow-sm" />
            <div>
              <h2 className="text-lg font-black text-[#010066] leading-none font-display">
                {t.title}
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                {t.subtitle}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Ambient Backdrop Style selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-500">{t.bgSelect}:</span>
              <select
                value={bgStyle}
                onChange={e => setBgStyle(e.target.value as BackgroundStyle)}
                className="bg-transparent font-bold text-[#010066] focus:outline-none cursor-pointer"
              >
                <option value="aurora">Aurora</option>
                <option value="particles">Particles</option>
                <option value="bokeh">Bokeh</option>
                <option value="none">Solid</option>
              </select>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-500">{t.languageSelect}:</span>
              <button
                onClick={() => setLanguage(l => (l === 'en' ? 'ur' : 'en'))}
                className="font-bold text-[#010066] hover:underline cursor-pointer"
              >
                {language === 'en' ? 'اردو' : 'English'}
              </button>
            </div>
          </div>
        </div>

        {/* Date Selector & Month Navigation Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 bg-[#010066] text-white rounded-3xl p-4 shadow-lg gap-4 items-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMonthShift(-1)}
            className="w-full py-2 px-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs font-bold tracking-wide transition-colors cursor-pointer"
          >
            {t.prevMonth}
          </motion.button>

          <div className="flex flex-col items-center justify-center text-center gap-1.5 px-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-extrabold text-amber-400 tracking-wider uppercase">
                {t.dateLabel}
              </span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-[#010066] border border-white/25 focus:border-transparent rounded-xl px-3 py-1.5 text-sm font-bold font-mono focus:outline-none transition-all cursor-pointer text-center w-40"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMonthShift(1)}
            className="w-full py-2 px-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs font-bold tracking-wide transition-colors cursor-pointer"
          >
            {t.nextMonth}
          </motion.button>
        </div>

        {/* Month Stats Overview Cards Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-sm flex items-center justify-between group hover:border-[#010066]/30 transition-colors"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {t.ovSale}
              </span>
              <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-100 leading-none mt-1.5 block">
                Rs {monthSaleTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-[#010066]/10 text-[#010066] rounded-xl shrink-0">
              <Building className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/80 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-sm flex items-center justify-between group hover:border-emerald-600/30 transition-colors"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {t.ovReceived}
              </span>
              <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-100 leading-none mt-1.5 block">
                Rs {monthReceivedTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-sm flex items-center justify-between group hover:border-rose-600/30 transition-colors"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {t.ovPayment}
              </span>
              <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-100 leading-none mt-1.5 block">
                Rs {monthPaymentTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded-xl shrink-0">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </motion.div>
        </div>

        {/* Section Tabs Navigation */}
        <div className="flex flex-wrap border-b border-slate-200/80 gap-1.5">
          <button
            onClick={() => setActiveTab('sale')}
            className={`px-4.5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'sale'
                ? 'border-[#010066] text-[#010066] bg-indigo-50/20 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabSale}
          </button>

          <button
            onClick={() => setActiveTab('received')}
            className={`px-4.5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'received'
                ? 'border-[#1A1A7A] text-[#1A1A7A] bg-indigo-50/20 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabReceived}
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4.5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'payment'
                ? 'border-[#33339a] text-[#33339a] bg-indigo-50/20 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabPayment}
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4.5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'border-[#010066] text-[#010066] bg-indigo-50/20 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabSummary}
          </button>

          <button
            onClick={() => setActiveTab('cities')}
            className={`px-4.5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ml-auto cursor-pointer ${
              activeTab === 'cities'
                ? 'border-[#010066] text-[#010066] bg-indigo-50/20 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabManageCities}
          </button>
        </div>

        {/* Keyboard Shortcut Info */}
        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-xl text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none shadow-sm" data-html2canvas-ignore="true">
          <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-bold font-mono text-[9px] text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700/60">Alt + 1-5</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-bold font-mono text-[9px] text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700/60">← / →</span>
          <span className="ml-1 text-slate-500 dark:text-slate-400">{t.shortcutHint}</span>
        </div>

        {/* Tab Content Staggered Animations Container */}
        <div className="min-h-96 mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'sale' && (
                <SectionEntries
                  type="sale"
                  entries={entries}
                  date={selectedDate}
                  cities={cities}
                  prevAmount={getPreviousAmount('sale')}
                  onUpdatePrevAmount={val => updatePrevAmountOverride('sale', val)}
                  onAddEntry={(name, amt) => handleAddEntry('sale', name, amt)}
                  onDeleteEntry={handleDeleteEntry}
                  t={t}
                />
              )}

              {activeTab === 'received' && (
                <SectionEntries
                  type="received"
                  entries={entries}
                  date={selectedDate}
                  cities={cities}
                  prevAmount={getPreviousAmount('received')}
                  onUpdatePrevAmount={val => updatePrevAmountOverride('received', val)}
                  onAddEntry={(name, amt) => handleAddEntry('received', name, amt)}
                  onDeleteEntry={handleDeleteEntry}
                  t={t}
                />
              )}

              {activeTab === 'payment' && (
                <SectionEntries
                  type="payment"
                  entries={entries}
                  date={selectedDate}
                  cities={cities}
                  prevAmount={getPreviousAmount('payment')}
                  onUpdatePrevAmount={val => updatePrevAmountOverride('payment', val)}
                  onAddEntry={(name, amt) => handleAddEntry('payment', name, amt)}
                  onDeleteEntry={handleDeleteEntry}
                  t={t}
                />
              )}

              {activeTab === 'summary' && (
                <SummaryPage
                  date={selectedDate}
                  entries={entries}
                  prevSale={getPreviousAmount('sale')}
                  prevReceived={getPreviousAmount('received')}
                  prevPayment={getPreviousAmount('payment')}
                  t={t}
                />
              )}

              {activeTab === 'cities' && (
                <ManageCities
                  cities={cities}
                  onAddCity={handleAddCity}
                  onDeleteCity={handleDeleteCity}
                  onExportBackup={handleExportBackup}
                  onImportBackup={handleImportBackup}
                  t={t}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
