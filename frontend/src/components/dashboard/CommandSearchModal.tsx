import React, { useEffect, useState } from 'react';
import { Search, X, Sparkles, ArrowRight, Zap, FileText, Target, History } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  category: 'Resumes' | 'Analysis' | 'Actions';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  href: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: '1',
    category: 'Resumes',
    title: 'Software Engineer Resume v3.pdf',
    subtitle: 'Resume Score: 82/100 • Processed 2 days ago',
    badge: 'Active',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    href: '/profile/resumes',
  },
  {
    id: '2',
    category: 'Analysis',
    title: 'ATS Match — Senior Frontend Developer @ Google',
    subtitle: '85% Match Score • 12 matched skills • 4 missing',
    badge: '85% Match',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    href: '/profile/resumes',
  },
  {
    id: '3',
    category: 'Analysis',
    title: 'ATS Match — Full Stack Engineer @ Stripe',
    subtitle: '78% Match Score • 9 matched skills • 6 missing',
    badge: '78% Match',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    href: '/profile/resumes',
  },
  {
    id: '4',
    category: 'Actions',
    title: 'Run ATS Job Match Analysis',
    subtitle: 'Paste a job description to get your match score',
    badge: 'Quick Action',
    badgeColor: 'bg-[#F0EBFF] text-[#6E44FF] border-purple-200',
    href: '/profile/resumes',
  },
  {
    id: '5',
    category: 'Actions',
    title: 'View AI Improvement Suggestions',
    subtitle: 'Review AI-powered recommendations to improve resume score',
    badge: 'AI Powered',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    href: '/profile/resumes',
  },
  {
    id: '6',
    category: 'Actions',
    title: 'Save Resume Version Snapshot',
    subtitle: 'Create a version checkpoint to track improvements over time',
    badge: 'Version Control',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    href: '/profile/resumes',
  },
];

export function CommandSearchModal({ isOpen, onClose }: CommandSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ['All', 'Resumes', 'Analysis', 'Actions'];

  const filteredItems = SEARCH_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesQuery =
      query.trim() === '' ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10">
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-[#6E44FF] mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search resumes, analyses, actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-sm font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#6E44FF] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No matching items found.</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for &quot;resume&quot;, &quot;ATS&quot;, or &quot;suggestions&quot;.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-purple-50/60 dark:hover:bg-purple-950/20 group transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 text-slate-600 dark:text-slate-300 group-hover:text-[#6E44FF] transition-colors">
                    {item.category === 'Resumes' && <FileText className="w-4 h-4" />}
                    {item.category === 'Analysis' && <Target className="w-4 h-4" />}
                    {item.category === 'Actions' && <Zap className="w-4 h-4" />}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#6E44FF] truncate">
                        {item.title}
                      </p>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#6E44FF] group-hover:translate-x-0.5 transition-all ml-2 flex-shrink-0" />
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Pro tip:</span> Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono shadow-2xs">ESC</kbd> to exit search
          </div>
          <div className="flex items-center gap-1 text-[#6E44FF] font-medium">
            <Sparkles className="w-3.5 h-3.5" /> UpSkilr Intelligence
          </div>
        </div>
      </div>
    </div>
  );
}
