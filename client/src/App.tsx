import { useState } from "react";
import Login from "./components/Login";
import ProfileSelect from "./components/ProfileSelect";
import DayEntry from "./components/DayEntry";
import VersionBadge from "./components/VersionBadge";

type Screen = "login" | "profiles" | "entry";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [profile, setProfile] = useState<string | null>(null);

  function handleLogin() {
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

  return (
    <>
      <VersionBadge />
      {screen === "login" && <Login onLogin={handleLogin} />}
      {screen === "profiles" && (
        <ProfileSelect onSelect={handleSelectProfile} />
      )}
      {screen === "entry" && profile && (
        <DayEntry profileId={profile} onBack={handleBack} />
      )}
    </>
  );
}
