import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export interface SuggestionItem {
  label: string;
  value: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fetchSuggestions: (query: string) => Promise<SuggestionItem[]>;
  required?: boolean;
}

export const AutocompleteField: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder = '',
  fetchSuggestions,
  required = false
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSuggestions = async (q: string) => {
    setLoading(true);
    try {
      const results = await fetchSuggestions(q);
      setSuggestions(results);
      setSelectedIndex(-1);
    } catch (e) {
      console.error('Failed to load suggestions:', e);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setIsOpen(true);
    loadSuggestions(val);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (suggestions.length === 0) {
      loadSuggestions(value);
    }
  };

  const handleSelect = (item: SuggestionItem) => {
    onChange(item.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
      <label className="form-label">{label} {required && '*'}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          className="form-input"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          style={{ width: '100%', paddingRight: '32px' }}
        />
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '10px', pointerEvents: 'none' }} />
      </div>

      {isOpen && (suggestions.length > 0 || loading) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
            zIndex: 1000,
            marginTop: '4px'
          }}
        >
          {loading ? (
            <div style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Searching live API suggestions...
            </div>
          ) : (
            suggestions.map((item, index) => (
              <div
                key={`${item.value}-${index}`}
                onClick={() => handleSelect(item)}
                style={{
                  padding: '9px 14px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: index === selectedIndex ? 'var(--bg-secondary, #f1f5f9)' : 'transparent',
                  borderBottom: index < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span>{item.label}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
