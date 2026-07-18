import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, MapPin, Search } from 'lucide-react';
import { TranslationSet } from '../types';

interface ManageCitiesProps {
  cities: string[];
  onAddCity: (city: string) => boolean | string; // Returns true/err string
  onDeleteCity: (city: string) => void;
  t: TranslationSet;
}

export default function ManageCities({
  cities,
  onAddCity,
  onDeleteCity,
  t
}: ManageCitiesProps) {
  const [newCity, setNewCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCity.trim();
    if (!trimmed) {
      setError(t.cityErrorEmpty);
      return;
    }

    const result = onAddCity(trimmed);
    if (result === true) {
      setNewCity('');
      setError(null);
    } else {
      setError(typeof result === 'string' ? result : t.cityErrorExists);
    }
  };

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="manage-cities-root">
      {/* Left Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4 self-start"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {t.manageCitiesTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.manageCitiesSubtitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col gap-3 mt-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
              {t.cityInputLabel}
            </label>
            <div className="relative">
              <input
                type="text"
                value={newCity}
                onChange={e => {
                  setNewCity(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Faisalabad"
                className="w-full pl-3.5 pr-11 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-rose-600 font-medium mt-1 leading-snug"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </motion.div>

      {/* Right Grid Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {t.cityCountLabel}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
              {cities.length}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.citySearchPlaceholder}
              className="w-full sm:w-56 pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* City Chips */}
        <div className="min-h-48 flex flex-col justify-between">
          {filteredCities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <MapPin className="w-10 h-10 opacity-30 stroke-[1.5]" />
              <p className="text-sm font-medium">No locations found</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 content-start max-h-96 overflow-y-auto pr-1">
              <AnimatePresence>
                {filteredCities.map((city, idx) => (
                  <motion.div
                    key={city}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center gap-2 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-950/40 dark:hover:bg-indigo-950/20 border border-slate-100 dark:border-slate-800/60 rounded-full pl-3.5 pr-2 py-1.5 transition-colors group"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {city}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteCity(city)}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                      title={`Delete ${city}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
