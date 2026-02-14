import { useState, useEffect } from "react";
import ProfileSelect from "./components/ProfileSelect";
import DayEntry from "./components/DayEntry";
import Login from "./components/Login";
import VersionBadge from "./components/VersionBadge";

type Screen = "login" | "profiles" | "entry";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [profile, setProfile] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage or sessionStorage
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const savedUsername =
      localStorage.getItem("username") || sessionStorage.getItem("username");

    if (token && savedUsername) {
      setUsername(savedUsername);
      setScreen("profiles");
    }

    setLoading(false);
  }, []);

  function handleLoginSuccess(_token: string, user: string) {
    setUsername(user);
    setScreen("profiles");
  }

  function handleSelectProfile(profileId: string) {
    setProfile(profileId);
    setScreen("entry");
  }

  function handleBack() {
    setProfile(null);
    setScreen("profiles");
  }

  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("username");
    setUsername(null);
    setProfile(null);
    setScreen("login");
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (screen === "login") {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <VersionBadge />
      {screen === "profiles" && (
        <ProfileSelect onSelect={handleSelectProfile} onLogout={handleLogout} username={username} />
      )}
      {screen === "entry" && profile && (
        <DayEntry profileId={profile} onBack={handleBack} />
      )}
    </>
  );
}
