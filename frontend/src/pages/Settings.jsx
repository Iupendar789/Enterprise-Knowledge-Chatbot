import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBell,
  FaComments,
  FaMoon,
  FaSave,
  FaUndo,
  FaUser,
} from "react-icons/fa";
import toast from "react-hot-toast";

function getStoredValue(key) {
  return (
    localStorage.getItem(key) ||
    sessionStorage.getItem(key) ||
    ""
  );
}

function Settings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    notifications: true,
    chatHistory: true,
    sound: false,
    compactMode: false,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedSettings =
      localStorage.getItem("employeeSettings");

    if (!storedSettings) {
      return;
    }

    try {
      const parsedSettings = JSON.parse(storedSettings);

      setSettings((previous) => ({
        ...previous,
        ...parsedSettings,
      }));
    } catch (error) {
      console.error(
        "Could not load saved settings:",
        error
      );
    }
  }, []);

  const handleToggle = (key) => {
    setSettings((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));

    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(
      "employeeSettings",
      JSON.stringify(settings)
    );

    setSaved(true);

    toast.success("Settings saved successfully.");
  };

  const handleReset = () => {
    const defaultSettings = {
      notifications: true,
      chatHistory: true,
      sound: false,
      compactMode: false,
    };

    setSettings(defaultSettings);

    localStorage.setItem(
      "employeeSettings",
      JSON.stringify(defaultSettings)
    );

    setSaved(true);

    toast.success("Settings restored to default.");
  };

  const userName =
    getStoredValue("userName") ||
    getStoredValue("full_name") ||
    "User";

  const userEmail =
    getStoredValue("userEmail") ||
    getStoredValue("email") ||
    "user@company.com";

  return (
    <div className="min-h-screen w-full bg-[#F8F8F8] text-[#171717]">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              border-[#E4E4E4]
              bg-white
              text-[#5F5F5F]
              shadow-sm
              transition
              hover:border-[#D4D4D4]
              hover:bg-[#FAF5F6]
              hover:text-[#7A1F2B]
            "
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <FaArrowLeft className="text-xs" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-[#171717] sm:text-xl">
              Settings
            </h1>

            <p className="mt-1 text-xs text-[#8A8A8A] sm:text-sm">
              Manage your Enterprise Knowledge Assistant preferences.
            </p>
          </div>
        </header>

        <div className="space-y-5">

          {/* Account */}
          <section
            className="
              rounded-2xl
              border
              border-[#E4E4E4]
              bg-white
              p-5
              shadow-sm
              sm:p-7
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#F9EFF0]
                  text-[#7A1F2B]
                "
              >
                <FaUser className="text-xs" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#171717]">
                  Account
                </h2>

                <p className="mt-1 text-[11px] text-[#8A8A8A]">
                  Your current employee account.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                className="
                  rounded-xl
                  border
                  border-[#E4E4E4]
                  bg-[#F8F8F8]
                  p-4
                "
              >
                <p className="text-[10px] uppercase tracking-wider text-[#8A8A8A]">
                  Full Name
                </p>

                <p className="mt-1 truncate text-sm font-medium text-[#171717]">
                  {userName}
                </p>
              </div>

              <div
                className="
                  rounded-xl
                  border
                  border-[#E4E4E4]
                  bg-[#F8F8F8]
                  p-4
                "
              >
                <p className="text-[10px] uppercase tracking-wider text-[#8A8A8A]">
                  Email Address
                </p>

                <p className="mt-1 truncate text-sm font-medium text-[#171717]">
                  {userEmail}
                </p>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section
            className="
              rounded-2xl
              border
              border-[#E4E4E4]
              bg-white
              p-5
              shadow-sm
              sm:p-7
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#F9EFF0]
                  text-[#7A1F2B]
                "
              >
                <FaBell className="text-xs" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#171717]">
                  Notifications
                </h2>

                <p className="mt-1 text-[11px] text-[#8A8A8A]">
                  Control notification preferences.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <SettingToggle
                title="Enable Notifications"
                description="Receive notifications about important assistant activity."
                enabled={settings.notifications}
                onChange={() =>
                  handleToggle("notifications")
                }
              />
            </div>
          </section>

          {/* Chat */}
          <section
            className="
              rounded-2xl
              border
              border-[#E4E4E4]
              bg-white
              p-5
              shadow-sm
              sm:p-7
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#F9EFF0]
                  text-[#7A1F2B]
                "
              >
                <FaComments className="text-xs" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#171717]">
                  Chat Preferences
                </h2>

                <p className="mt-1 text-[11px] text-[#8A8A8A]">
                  Manage how your conversations are handled.
                </p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-[#EEEEEE]">
              <SettingToggle
                title="Save Chat History"
                description="Keep your conversations available in the History section."
                enabled={settings.chatHistory}
                onChange={() =>
                  handleToggle("chatHistory")
                }
              />

              <SettingToggle
                title="Chat Sound"
                description="Play a notification sound when an assistant response is received."
                enabled={settings.sound}
                onChange={() =>
                  handleToggle("sound")
                }
              />

              <SettingToggle
                title="Compact Mode"
                description="Use a more compact layout for chat messages."
                enabled={settings.compactMode}
                onChange={() =>
                  handleToggle("compactMode")
                }
              />
            </div>
          </section>

          {/* Appearance */}
          <section
            className="
              rounded-2xl
              border
              border-[#E4E4E4]
              bg-white
              p-5
              shadow-sm
              sm:p-7
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#F9EFF0]
                  text-[#7A1F2B]
                "
              >
                <FaMoon className="text-xs" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#171717]">
                  Appearance
                </h2>

                <p className="mt-1 text-[11px] text-[#8A8A8A]">
                  Current interface appearance.
                </p>
              </div>
            </div>

            <div
              className="
                mt-5
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-[#E4E4E4]
                bg-[#F8F8F8]
                p-4
              "
            >
              <div>
                <p className="text-sm font-medium text-[#171717]">
                  Dark Mode
                </p>

                <p className="mt-1 text-[11px] text-[#8A8A8A]">
                  The Enterprise Knowledge Assistant currently uses
                  the light enterprise interface.
                </p>
              </div>

              <div
                className="
                  rounded-full
                  border
                  border-[#D8B9BE]
                  bg-[#F9EFF0]
                  px-3
                  py-1
                  text-[10px]
                  font-medium
                  text-[#7A1F2B]
                "
              >
                Active
              </div>
            </div>
          </section>

          {/* Actions */}
          <section
            className="
              flex
              flex-col
              gap-3
              rounded-2xl
              border
              border-[#E4E4E4]
              bg-white
              p-5
              shadow-sm
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:p-7
            "
          >
            <div>
              <p className="text-sm text-[#5F5F5F]">
                {saved
                  ? "Your settings have been saved."
                  : "Make changes and save your preferences."}
              </p>

              <p className="mt-1 text-[11px] text-[#8A8A8A]">
                Settings are stored for this browser.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-[#E4E4E4]
                  bg-white
                  px-3
                  py-2
                  text-xs
                  font-medium
                  text-[#5F5F5F]
                  shadow-sm
                  transition
                  hover:border-[#D4D4D4]
                  hover:bg-[#FAF5F6]
                  hover:text-[#7A1F2B]
                "
              >
                <FaUndo className="text-[10px]" />
                Reset
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-[#7A1F2B]
                  px-4
                  py-2
                  text-xs
                  font-medium
                  text-white
                  shadow-sm
                  transition
                  hover:bg-[#641923]
                "
              >
                <FaSave className="text-[10px]" />
                Save Settings
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        py-4
        first:pt-0
        last:pb-0
      "
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#171717]">
          {title}
        </p>

        <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#8A8A8A]">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onChange}
        className={`
          relative
          h-6
          w-11
          shrink-0
          rounded-full
          transition
          ${
            enabled
              ? "bg-[#7A1F2B]"
              : "bg-[#D4D4D4]"
          }
        `}
        aria-label={`${title}: ${
          enabled ? "On" : "Off"
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`
            absolute
            top-1
            h-4
            w-4
            rounded-full
            bg-white
            shadow-sm
            transition
            ${
              enabled
                ? "left-6"
                : "left-1"
            }
          `}
        />
      </button>
    </div>
  );
}

export default Settings;