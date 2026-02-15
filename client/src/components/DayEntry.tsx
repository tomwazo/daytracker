import { useState, useEffect } from "react";
import WordInput from "./WordInput";
import { fetchEntry, fetchWords, submitEntry } from "../api";
import "./DayEntry.css";

interface DayEntryProps {
  profileId: string;
  onBack: () => void;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getScoreColor(score: number): string {
  if (score <= 3) return "var(--color-score-low)";
  if (score <= 6) return "var(--color-score-mid)";
  return "var(--color-score-high)";
}

export default function DayEntry({ profileId, onBack }: DayEntryProps) {
  const [score, setScore] = useState(5);
  const [words, setWords] = useState(["", "", ""]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = getToday();
  const profileLabel = profileId.charAt(0).toUpperCase() + profileId.slice(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [existing, pastWords] = await Promise.all([
          fetchEntry(profileId, today),
          fetchWords(profileId),
        ]);
        setSuggestions(pastWords);
        if (existing) {
          setScore(existing.score);
          setWords(existing.words);
          setSubmitted(true);
        }
      } catch {
        // Ignore fetch errors for now — user can still submit
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profileId, today]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = words.map((w) => w.trim());
    if (trimmed.some((w) => w.length === 0)) {
      setError("Please enter all three words.");
      return;
    }

    // Check for spaces in words
    if (trimmed.some((w) => /\s/.test(w))) {
      setError("Words cannot contain spaces.");
      return;
    }

    // Check for duplicate words
    const uniqueWords = new Set(trimmed.map((w) => w.toLowerCase()));
    if (uniqueWords.size !== trimmed.length) {
      setError("Each word must be unique.");
      return;
    }

    setSubmitting(true);
    try {
      await submitEntry({ profileId, date: today, score, words: trimmed });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

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
      <div className="day-entry-header">
        <button className="back-button" onClick={onBack}>
          &larr; Back
        </button>
        <h2>{profileLabel}'s Day</h2>
        <span className="day-entry-date">{today}</span>
      </div>

      {submitted ? (
        <div className="day-entry-done">
          <p className="done-score" style={{ color: getScoreColor(score) }}>
            {score}/10
          </p>
          <p className="done-words">{words.join(" \u2022 ")}</p>
          <p className="done-message">Entry saved!</p>
        </div>
      ) : (
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
