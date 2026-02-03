import { useState, useRef, useEffect } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  compact?: boolean;
}

const SunIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MoonIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const SystemIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export function ThemeToggle({ theme, onThemeChange, compact = false }: ThemeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon />;
      case 'dark':
        return <MoonIcon />;
      case 'system':
        return <SystemIcon />;
    }
  };

  const getThemeLabel = (t: ThemePreference) => {
    switch (t) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  const themes: ThemePreference[] = ['light', 'dark', 'system'];

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={`Theme: ${getThemeLabel(theme)}`}
        >
          {getCurrentIcon()}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              {themes.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    onThemeChange(t);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                    theme === t
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {t === 'light' && <SunIcon className="w-4 h-4" />}
                  {t === 'dark' && <MoonIcon className="w-4 h-4" />}
                  {t === 'system' && <SystemIcon className="w-4 h-4" />}
                  {getThemeLabel(t)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => onThemeChange(t)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            theme === t
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          aria-label={getThemeLabel(t)}
        >
          {t === 'light' && <SunIcon className="w-4 h-4" />}
          {t === 'dark' && <MoonIcon className="w-4 h-4" />}
          {t === 'system' && <SystemIcon className="w-4 h-4" />}
          <span className="hidden sm:inline">{getThemeLabel(t)}</span>
        </button>
      ))}
    </div>
  );
}
