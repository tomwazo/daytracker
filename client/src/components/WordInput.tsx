/**
 * WordInput.tsx — Text input with autocomplete dropdown for descriptive words.
 *
 * Used in the DayEntry form for each of the three word fields. As the user
 * types, it filters the suggestions list (past words from the API) and
 * shows matching options in a dropdown. Selecting a suggestion fills the
 * input and re-focuses it for quick entry.
 *
 * Key behaviours:
 *   - Spaces are stripped on input (words must be single words)
 *   - Suggestions filter by prefix match (case-insensitive)
 *   - Maximum of 6 suggestions shown at a time
 *   - Dropdown closes on blur with a 150ms delay to allow click events
 *   - onMouseDown preventDefault on suggestions prevents input blur
 */
import { useState, useRef } from "react";
import "./WordInput.css";

interface WordInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder: string;
}

export default function WordInput({
  value,
  onChange,
  suggestions,
  placeholder,
}: WordInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions: must start with current input and not be an exact match
  const filtered = value.trim()
    ? suggestions.filter(
        (s) => s.startsWith(value.toLowerCase()) && s !== value.toLowerCase()
      )
    : [];

  /** Select a suggestion: fill the input and re-focus */
  function handleSelect(word: string) {
    onChange(word);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  return (
    <div className="word-input-wrapper">
      <input
        ref={inputRef}
        type="text"
        className="word-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          // Strip spaces — words must be single words (no whitespace)
          const valueWithoutSpaces = e.target.value.replace(/\s/g, '');
          onChange(valueWithoutSpaces);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
      />
      {/* Autocomplete dropdown — only shown when there are matching suggestions */}
      {showSuggestions && filtered.length > 0 && (
        <ul className="word-suggestions">
          {filtered.slice(0, 6).map((word) => (
            <li key={word}>
              <button
                type="button"
                className="word-suggestion"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(word)}
              >
                {word}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
