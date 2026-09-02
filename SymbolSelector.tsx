import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Globe, Layers, Search, TrendingUp, Zap } from 'lucide-react';
import { getClientSymbolInfo } from '../../config/symbols';
import { terminalStore } from '../../store/terminalStore';
import { AssetCategory, SymbolInfo } from '../../types/market';

interface SymbolSelectorProps {
  currentSymbol: string;
  availableSymbols: SymbolInfo[];
  isRealData: boolean;
}

const CATEGORIES: { id: AssetCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'forex', label: 'FOREX' },
  { id: 'metals', label: 'METALS' },
  { id: 'indices', label: 'INDICES' },
  { id: 'crypto', label: 'CRYPTO' },
  { id: 'stocks', label: 'STOCKS' },
];

export const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  currentSymbol,
  availableSymbols,
  isRealData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'all'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeSymbolInfo = useMemo(() => {
    return getClientSymbolInfo(currentSymbol);
  }, [currentSymbol]);

  const filteredSymbols = useMemo(() => {
    return availableSymbols.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.displaySymbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [availableSymbols, activeCategory, searchQuery]);

  // Open / Close handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut 'S' when not in input
      if ((e.key === 's' || e.key === 'S') && !isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-focus search input on modal open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (symbolId: string) => {
    terminalStore.setSymbol(symbolId);
    setIsOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredSymbols.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredSymbols.length) % Math.max(1, filteredSymbols.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSymbols[selectedIndex]) {
        handleSelect(filteredSymbols[selectedIndex].id);
      }
    }
  };

  const getCategoryBadgeColor = (cat: AssetCategory) => {
    switch (cat) {
      case 'crypto':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'forex':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'metals':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';
      case 'indices':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'stocks':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Symbol Trigger Button */}
      <button
        id="symbol-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Select Instrument [Key: S]"
        className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-100 font-mono font-bold text-xs transition-colors group"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold tracking-tight">
            {activeSymbolInfo.displaySymbol}
          </span>
          <span className={`px-1 py-0.2 text-[9px] uppercase font-sans font-semibold rounded border ${getCategoryBadgeColor(activeSymbolInfo.category)}`}>
            {activeSymbolInfo.category}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-200 transition-transform duration-200" />
      </button>

      {/* Symbol Modal / Dropdown */}
      {isOpen && (
        <div
          id="symbol-modal"
          className="absolute top-full left-0 mt-1.5 w-80 sm:w-96 bg-[#0f141c] border border-[#30363d] rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search Header */}
          <div className="p-2.5 border-b border-[#21262d] bg-[#161b22]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search symbol (e.g. EUR/USD, BTC, Gold, US30, AAPL)..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded pl-8 pr-3 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedIndex(0);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-[#0d1117] text-slate-400 hover:text-slate-200 border border-[#21262d]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symbols List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-[#21262d]/50 custom-scrollbar">
            {filteredSymbols.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No matching symbols found.
              </div>
            ) : (
              filteredSymbols.map((item, idx) => {
                const isSelected = item.id === currentSymbol;
                const isHighlighted = idx === selectedIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs font-mono transition-colors ${
                      isHighlighted
                        ? 'bg-[#1f242c]'
                        : isSelected
                        ? 'bg-cyan-950/25'
                        : 'hover:bg-[#161b22]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              isSelected ? 'text-cyan-400' : 'text-slate-200'
                            }`}
                          >
                            {item.displaySymbol}
                          </span>
                          <span
                            className={`px-1 py-0.2 text-[8px] uppercase font-sans font-semibold rounded border ${getCategoryBadgeColor(
                              item.category
                            )}`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {item.name}
                        </span>
                      </div>
                    </div>

                    {/* Data Mode & Precision badge */}
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1">
                        {item.isDecentralizedOrQuoteOnly ? (
                          <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Derived Tick Vol
                          </span>
                        ) : (
                          <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Real Aggressors
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">
                        Tick: {item.tickSize}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-[#0d1117] border-t border-[#21262d] flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Use ↑↓ keys + Enter</span>
            <span>Shortcut: [S]</span>
          </div>
        </div>
      )}
    </div>
  );
};
