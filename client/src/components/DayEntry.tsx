/**
 * DayEntry.tsx — Daily entry form for a single family member.
 *
 * This is the main interaction screen where a user:
 *   1. Selects a date (defaults to today, can pick past dates)
 *   2. Rates their day on a 1-10 slider
 *   3. Enters three descriptive words (with autocomplete from past entries)
 *   4. Submits the entry
 *
 * If an entry already exists for the selected date, it shows a read-only
 * confirmation view with the saved score and words instead of the form.
 *
 * The component re-fetches data whenever the selected date changes,
 * allowing users to navigate between dates and see/submit entries.
 */
import { useState, useEffect } from "react";
import WordInput from "./WordInput";
import { fetchEntry, fetchWords, submitEntry } from "../api";
import "./DayEntry.css";

interface DayEntryProps {
  profileId: string;
  onBack: () => void;
}

/** Returns today's date as YYYY-MM-DD string */
function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Maps a score to a CSS colour variable for visual feedback:
 *   1-3 → red (low), 4-6 → amber (mid), 7-10 → green (high)
 */
function getScoreColor(score: number): string {
  if (score <= 3) return "var(--color-score-low)";
  if (score <= 6) return "var(--color-score-mid)";
  return "var(--color-score-high)";
}

export default function DayEntry({ profileId, onBack }: DayEntryProps) {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [score, setScore] = useState(5);
  const [words, setWords] = useState(["", "", ""]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Capitalise first letter of profileId for display (e.g. "daddy" → "Daddy") */
  const profileLabel = profileId.charAt(0).toUpperCase() + profileId.slice(1);

  // Load existing entry and past words whenever profileId or date changes
  useEffect(() => {
    async function load() {
      setLoading(true);
      setJustSubmitted(false);
      try {
        const [existing, pastWords] = await Promise.all([
          fetchEntry(profileId, selectedDate),
          fetchWords(profileId),
        ]);
        setSuggestions(pastWords);
        if (existing) {
          // Entry already exists — show read-only confirmation view
          setScore(existing.score);
          setWords(existing.words);
          setSubmitted(true);
        } else {
          // No entry yet — reset form for fresh submission
          setScore(5);
          setWords(["", "", ""]);
          setSubmitted(false);
        }
      } catch (err) {
        // Re-throw auth errors so the user sees the denial.
        // Other fetch errors (e.g. network issues) are non-fatal —
        // the user can still fill in and submit a new entry.
        if (err instanceof Error && err.message.includes("Access denied")) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profileId, selectedDate]);

  /** Validates input and submits the entry to the API */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = words.map((w) => w.trim());

    // Frontend validation (mirrors backend rules)
    if (trimmed.some((w) => w.length === 0)) {
      setError("Please enter all three words.");
      return;
    }

    if (trimmed.some((w) => /\s/.test(w))) {
      setError("Words cannot contain spaces.");
      return;
    }

    const uniqueWords = new Set(trimmed.map((w) => w.toLowerCase()));
    if (uniqueWords.size !== trimmed.length) {
      setError("Each word must be unique.");
      return;
    }

    setSubmitting(true);
    try {
      await submitEntry({ profileId, date: selectedDate, score, words: trimmed });
      setJustSubmitted(true);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  /** Updates a single word in the words array by index */
  function updateWord(index: number, value: string) {
    setWords((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  if (loading) {
    return <div className="day-entry"><p>Loading...</p></div>;
  }

  return (
    <div className="day-entry">
      {/* Header: back button, profile name, and date picker */}
      <div className="day-entry-header">
        <button className="back-button" onClick={onBack}>
          &larr; Back
        </button>
        <h2>{profileLabel}'s Day</h2>
        <input
              type="date"
              className="day-entry-date-picker"
              value={selectedDate}
              max={getToday()}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
      </div>

      {submitted ? (
        /* Read-only confirmation view — shown when an entry already exists */
        <div className="day-entry-done">
          <p className="done-score" style={{ color: getScoreColor(score) }}>
            {score}/10
          </p>
          <p className="done-words">{words.join(" \u2022 ")}</p>
          <p className="done-message">
            {justSubmitted ? "Entry saved!" : "Entry already submitted for this date!"}
          </p>
        </div>
      ) : (
        /* Entry form — score slider + three word inputs */
        <form className="day-entry-form" onSubmit={handleSubmit}>
          <div className="score-section">
            <label className="score-label">
              How was your day?
              <span className="score-value" style={{ color: getScoreColor(score) }}>
                {score}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="score-slider"
            />
            <div className="score-range">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          <div className="words-section">
            <label className="words-label">Three words to describe your day</label>
            {[0, 1, 2].map((i) => (
              <WordInput
                key={i}
                value={words[i] ?? ""}
                onChange={(v) => updateWord(i, v)}
                suggestions={suggestions}
                placeholder={`Word ${i + 1}`}
              />
            ))}
          </div>

          {error && <p className="entry-error">{error}</p>}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? "Saving..." : "Save Entry"}
          </button>
        </form>
      )}
    </div>
  );
}
