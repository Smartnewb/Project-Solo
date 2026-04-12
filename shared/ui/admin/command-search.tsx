'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NAV_CATEGORIES } from './sidebar';

interface FlatItem {
  href: string;
  label: string;
  category: string;
  icon: string;
}

function flattenNav(): FlatItem[] {
  const flat: FlatItem[] = [];
  for (const cat of NAV_CATEGORIES) {
    for (const item of cat.items) {
      if ('children' in item) {
        for (const child of item.children) {
          flat.push({
            href: child.href,
            label: child.label,
            category: cat.label,
            icon: cat.icon,
          });
        }
      } else {
        flat.push({
          href: item.href,
          label: item.label,
          category: cat.label,
          icon: cat.icon,
        });
      }
    }
  }
  return flat;
}

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo(() => flattenNav(), []);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [query, allItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const activeEl = listRef.current?.querySelector('[data-selected="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) {
          navigate(filtered[selectedIndex].href);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메뉴 검색..."
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              검색 결과가 없습니다
            </div>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.href}
                data-selected={index === selectedIndex}
                onClick={() => navigate(item.href)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="ml-2 text-xs text-gray-400">{item.category}</span>
                </div>
                {index === selectedIndex && (
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-gray-400 bg-white rounded border border-gray-200">
                    Enter
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200">↑</kbd>
            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200">↓</kbd>
            탐색
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200">Enter</kbd>
            이동
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200">Esc</kbd>
            닫기
          </span>
        </div>
      </div>
    </div>
  );
}
