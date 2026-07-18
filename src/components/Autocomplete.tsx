import React, { useState, useEffect, useRef } from 'react';

interface AutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  label?: string;
  id?: string;
}

export default function Autocomplete({
  value,
  onChange,
  suggestions,
  placeholder = '',
  label,
  id
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestions as input changes
  useEffect(() => {
    if (!value.trim()) {
      setFiltered(suggestions);
    } else {
      const q = value.toLowerCase();
      setFiltered(suggestions.filter(s => s.toLowerCase().includes(q)));
    }
    setActiveIdx(-1);
  }, [value, suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filtered.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = Math.min(activeIdx + 1, filtered.length - 1);
      setActiveIdx(nextIdx);
      scrollIntoView(nextIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = Math.max(activeIdx - 1, 0);
      setActiveIdx(prevIdx);
      scrollIntoView(prevIdx);
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && activeIdx < filtered.length) {
        e.preventDefault();
        onChange(filtered[activeIdx]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const scrollIntoView = (index: number) => {
    if (!dropdownRef.current) return;
    const item = dropdownRef.current.children[index] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: 'nearest' });
    }
  };

  // Helper to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return <span>{text}</span>;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <span>
        {before}
        <mark className="bg-yellow-100 text-amber-950 font-bold px-0.5 rounded-sm">{match}</mark>
        {after}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full flex flex-col gap-1.5" id={id}>
      {label && <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(true);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 py-1 divide-y divide-slate-50 dark:divide-slate-800/50"
        >
          {filtered.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(item);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-between ${
                idx === activeIdx
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-medium'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              {highlightMatch(item, value)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
