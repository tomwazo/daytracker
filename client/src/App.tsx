/**
 * App.tsx — Root component and screen router for the Day Tracker app.
 *
 * Manages navigation between the three main screens using simple state
 * (no routing library needed for this small app):
 *   - "profiles"  → ProfileSelect — the landing page where the user picks who they are
 *   - "entry"     → DayEntry      — the daily score + words form for the selected profile
 *   - "dashboard" → Dashboard     — analytics charts and stats for the whole family
 *
 * The VersionBadge is rendered on every screen as a fixed overlay.
 */
import { useState } from "react";
import ProfileSelect from "./components/ProfileSelect";
import DayEntry from "./components/DayEntry";
import Dashboard from "./components/Dashboard";
import VersionBadge from "./components/VersionBadge";

/** The three possible screens in the app */
type Screen = "profiles" | "entry" | "dashboard";

export default function App() {
  const [screen, setScreen] = useState<Screen>("profiles");
  const [profile, setProfile] = useState<string | null>(null);

  /** Navigate to the DayEntry screen for the chosen profile */
  function handleSelectProfile(profileId: string) {
    setProfile(profileId);
    setScreen("entry");
  }

  /** Return to the profile selection screen and clear the active profile */
  function handleBack() {
    setProfile(null);
    setScreen("profiles");
  }

  /** Navigate to the analytics dashboard */
  function handleViewInsights() {
    setScreen("dashboard");
  }

  return (
    <>
      <VersionBadge />
      {screen === "profiles" && (
        <ProfileSelect
          onSelect={handleSelectProfile}
          onViewInsights={handleViewInsights}
        />
      )}
      {screen === "entry" && profile && (
        <DayEntry profileId={profile} onBack={handleBack} />
      )}
      {screen === "dashboard" && <Dashboard onBack={handleBack} />}
    </>
  );
}
