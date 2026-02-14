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

  const filtered = value.trim()
    ? suggestions.filter(
        (s) => s.startsWith(value.toLowerCase()) && s !== value.toLowerCase()
      )
    : [];

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
          // Remove spaces from input
          const valueWithoutSpaces = e.target.value.replace(/\s/g, '');
          onChange(valueWithoutSpaces);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
      />
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
