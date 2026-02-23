import React, { useState, useEffect } from 'react';
import { useGameState, useGameActions, useUserAuth } from './context/GameContext/useGame';
import { Field } from './components/ui/Field';

import { SheepDetailModal } from './components/modals/SheepDetailModal';
import { Guide } from './components/game/Guide';
import { Login } from './components/auth/Login';
import { NicknameSetup } from './components/auth/NicknameSetup';
import { SheepList } from './components/game/SheepList';
import { SettingsModal } from './components/modals/SettingsModal';
import { UserProfile } from './components/auth/UserProfile';
import { Toast } from './components/ui/Toast';
import { Tooltip } from './components/ui/Tooltip';
import { ConnectionErrorOverlay } from './components/ui/ConnectionErrorOverlay';
import './App.css';

import { AssetPreloader } from './components/game/AssetPreloader';
import { IntroVideo } from './components/game/IntroVideo';
import { ScheduleListModal } from './components/modals/ScheduleListModal';
import { LiteAppLayout } from './components/layout/LiteAppLayout';
import { Bell, BellOff, BookOpen, Settings, Menu, Calendar } from 'lucide-react';

function App() {
  // Use specialized hooks to prevent unnecessary rerenders from high-frequency game state (like sheep movement)
  const { currentUser, nickname, notificationEnabled, isAdmin, isLoading, loginStatus, settings } = useUserAuth();
  const { toggleNotification, markIntroWatched } = useGameActions();
  const { message, weather, showIntroVideo } = useGameState();
  const [selectedSheepId, setSelectedSheepId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  // showList removed - permanent dock
  const [showSettings, setShowSettings] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isHudMenuOpen, setIsHudMenuOpen] = useState(false);

  const [prevUser, setPrevUser] = useState(currentUser);
  if (currentUser !== prevUser) {
    setPrevUser(currentUser);
    setSelectedSheepId(null);
    setSelectedPlanId(null);
    setShowGuide(false);
    setShowSettings(false);
    setShowSchedule(false);
  }

  // Synchronize Lite Mode class to document.body for Portal compatibility
  useEffect(() => {
    if (settings?.liteMode) {
      document.body.classList.add('lite-mode');
    } else {
      document.body.classList.remove('lite-mode');
    }
  }, [settings?.liteMode]);

  // Handlers (Moved up to satisfy Rules of Hooks)
  const handleSelectSheep = React.useCallback((sheep) => {
    setSelectedSheepId(sheep.id);
  }, []);

  const handleSelectFromList = React.useCallback((sheep) => {
    setSelectedSheepId(sheep.id);
  }, []);

  // 0. Global Loading & Error Interception
  if (loginStatus === 'TIMEOUT' || loginStatus === 'ERROR') {
    return <ConnectionErrorOverlay type={loginStatus} />;
  }

  if (isLoading) {
    return <AssetPreloader onLoaded={() => { }} />;
  }

  // 1. Not Logged In
  if (!currentUser) {
    return <Login />;
  }

  // 1.5. No Nickname
  if (!nickname) {
    return <NicknameSetup />;
  }


  return (
    <div className={`game-container ${settings.liteMode ? 'lite-mode' : ''}`} key={currentUser} data-theme={weather?.timeStatus || 'day'}>
      <Toast key={message || 'toast'} message={message} />

      {settings.liteMode ? (
        <LiteAppLayout
          onSelectSheep={handleSelectFromList}
        />
      ) : (
        <>
          {/* --- Unified Top Left Widget --- */}
          <UserProfile />

          {/* --- HUD: Top Right System Buttons (Lucide icons) --- */}
          <div className="hud-right">
            <Tooltip content="選單" side="bottom">
              <button
                className="hud-btn hud-menu-btn"
                onClick={() => setIsHudMenuOpen((prev) => !prev)}
                aria-expanded={isHudMenuOpen}
                aria-haspopup="true"
              >
                <Menu size={18} strokeWidth={2.5} />
              </button>
            </Tooltip>

            <div className={`hud-right-actions ${isHudMenuOpen ? 'hud-right-actions--open' : ''}`}>
              {/* Bell */}
              <div className="hud-tooltip-container">
                <Tooltip content={notificationEnabled ? "關閉提醒" : "開啟提醒"} side="bottom">
                  <button
                    className="hud-btn"
                    style={{ background: notificationEnabled ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.45)' }}
                    onClick={() => {
                      toggleNotification();
                      setIsHudMenuOpen(false);
                    }}
                  >
                    {notificationEnabled ? <Bell size={18} strokeWidth={2.5} /> : <BellOff size={18} strokeWidth={2.5} />}
                  </button>
                </Tooltip>
                <div className="hud-tooltip">
                  將會在以下時段提醒要認領禱告：{'\n'}
                  早上：8:00{'\n'}
                  中午：12:00{'\n'}
                  晚上：18:30
                </div>
              </div>

              {/* Guide */}
              <Tooltip content="使用說明" side="bottom">
                <button
                  className="hud-btn"
                  onClick={() => {
                    setShowGuide(true);
                    setIsHudMenuOpen(false);
                  }}
                >
                  <BookOpen size={18} strokeWidth={2.5} />
                </button>
              </Tooltip>

              {/* Schedule */}
              <Tooltip content="牧羊人週記" side="bottom">
                <button
                  className="hud-btn"
                  onClick={() => {
                    setShowSchedule(true);
                    setIsHudMenuOpen(false);
                  }}
                >
                  <Calendar size={18} strokeWidth={2.5} />
                </button>
              </Tooltip>

              {/* Display Settings (Sheep Count) */}
              <Tooltip content="設定" side="bottom">
                <button
                  className="hud-btn"
                  onClick={() => {
                    setShowSettings(true);
                    setIsHudMenuOpen(false);
                  }}
                >
                  <Settings size={18} strokeWidth={2.5} />
                </button>
              </Tooltip>

            </div>
          </div>

          <Field onSelectSheep={handleSelectSheep} />

          <SheepList onSelect={handleSelectFromList} />
        </>
      )}

      {selectedSheepId && !settings.liteMode && (
        <SheepDetailModal
          selectedSheepId={selectedSheepId}
          initialPlanId={selectedPlanId}
          onClose={() => {
            setSelectedSheepId(null);
            setSelectedPlanId(null);
          }}
        />
      )}

      {showGuide && !settings.liteMode && (
        <Guide onClose={() => setShowGuide(false)} />
      )}

      {showSettings && !settings.liteMode && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showSchedule && (
        <ScheduleListModal
          onClose={() => setShowSchedule(false)}
          onSelectSheep={(sheepId, planId) => {
            setSelectedSheepId(sheepId);
            if (planId) setSelectedPlanId(planId);
          }}
        />
      )}

      {showIntroVideo && (
        <IntroVideo
          onClose={markIntroWatched}
          onComplete={markIntroWatched}
        />
      )}
    </div>
  );
}

export default App;
