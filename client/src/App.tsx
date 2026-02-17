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
import { useState, useEffect } from "react";
import ProfileSelect from "./components/ProfileSelect";
import DayEntry from "./components/DayEntry";
import Dashboard from "./components/Dashboard";
import VersionBadge from "./components/VersionBadge";
import { checkAccess } from "./api";

/** The three possible screens in the app */
type Screen = "profiles" | "entry" | "dashboard";

/** Auth states: loading while checking, authorized if allowed, denied if not */
type AuthState = "loading" | "authorized" | "denied";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [screen, setScreen] = useState<Screen>("profiles");
  const [profile, setProfile] = useState<string | null>(null);

  // Check authorization on app load before rendering any content
  useEffect(() => {
    checkAccess()
      .then(() => setAuthState("authorized"))
      .catch(() => setAuthState("denied"));
  }, []);

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

  if (authState === "loading") {
    return <p style={{ textAlign: "center", marginTop: "4rem" }}>Loading…</p>;
  }

  if (authState === "denied") {
    return (
      <div style={{ textAlign: "center", marginTop: "4rem" }}>
        <h1>Access Denied</h1>
        <p>Your Microsoft account is not authorised to use this app.</p>
      </div>
    );
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
