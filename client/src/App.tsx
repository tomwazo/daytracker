import { useState } from "react";
import ProfileSelect from "./components/ProfileSelect";
import DayEntry from "./components/DayEntry";
import VersionBadge from "./components/VersionBadge";

type Screen = "profiles" | "entry";

export default function App() {
  const [screen, setScreen] = useState<Screen>("profiles");
  const [profile, setProfile] = useState<string | null>(null);

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
      {screen === "profiles" && (
        <ProfileSelect onSelect={handleSelectProfile} />
      )}
      {screen === "entry" && profile && (
        <DayEntry profileId={profile} onBack={handleBack} />
      )}
    </>
  );
}
