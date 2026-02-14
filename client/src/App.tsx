import { useState, useEffect } from "react";
import ProfileSelect from "./components/ProfileSelect";
import DayEntry from "./components/DayEntry";
import VersionBadge from "./components/VersionBadge";

type Screen = "profiles" | "entry";

const ALLOWED_EMAILS = [
  "tom87moore@gmail.com",
  "laura_j_bates87@hotmail.com"
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("profiles");
  const [profile, setProfile] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/.auth/me");
        const data = await response.json();

        const userEmail = data.clientPrincipal?.userDetails?.toLowerCase();

        if (!userEmail || !ALLOWED_EMAILS.includes(userEmail)) {
          setAuthError(
            `Access denied. This app is restricted to authorized family members only. Your email (${userEmail || "unknown"}) is not authorized.`
          );
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthError("Failed to verify authentication. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  function handleSelectProfile(profileId: string) {
    setProfile(profileId);
    setScreen("entry");
  }

  function handleBack() {
    setProfile(null);
    setScreen("profiles");
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", maxWidth: "500px", margin: "0 auto" }}>
        <h2>Access Denied</h2>
        <p>{authError}</p>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
          If you believe this is an error, please contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <>
      <VersionBadge />
      {screen === "profiles" && (
        <ProfileSelect onSelect={handleSelectProfile} />
      )}
      {screen === "entry" && profile && (
        <DayEntry profileId={profile} onBack={handleBack} />
      )}
    </>
  );
}
