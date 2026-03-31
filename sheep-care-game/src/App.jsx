import React, { useState, useEffect } from 'react';
import { useGameState, useGameActions, useUserAuth } from './context/GameContext/useGame';
import { Field } from './components/ui/Field';

import { UserProfile } from './components/auth/UserProfile';
import { SheepSwipeView } from './components/game/SheepSwipeView';
import { Toast } from './components/ui/Toast';
import { Tooltip } from './components/ui/Tooltip';
import { ConnectionErrorOverlay } from './components/ui/ConnectionErrorOverlay';
import './App.css';

import { Suspense, lazy } from 'react';
const SheepDetailModal = lazy(() => import('./components/modals/SheepDetailModal').then(module => ({ default: module.SheepDetailModal })));
const Guide = lazy(() => import('./components/game/Guide').then(module => ({ default: module.Guide })));
const SettingsModal = lazy(() => import('./components/modals/SettingsModal').then(module => ({ default: module.SettingsModal })));
const ScheduleListModal = lazy(() => import('./components/modals/ScheduleListModal').then(module => ({ default: module.ScheduleListModal })));
const IntroVideo = lazy(() => import('./components/game/IntroVideo').then(module => ({ default: module.IntroVideo })));

import { Login } from './components/auth/Login';
import { NicknameSetup } from './components/auth/NicknameSetup';
import { AssetPreloader } from './components/game/AssetPreloader';
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
  const [showSwipeMode, setShowSwipeMode] = useState(false);
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

  const handleSelectFromSwipe = React.useCallback((sheep) => {
    setSelectedSheepId(sheep.id);
    setShowSwipeMode(false); // optionally close swipe UI when viewing details
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

      {/* --- Unified Top Left Widget matches both modes --- */}
      <UserProfile />

      {settings.liteMode ? (
        <LiteAppLayout
          onSelectSheep={handleSelectSheep}
        />
      ) : (
        <>

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

          {/* Swipe Mode FAB */}
          <div style={{ position: 'absolute', bottom: 'min(40px, 8vh)', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
            <button 
                onClick={() => setShowSwipeMode(true)}
                style={{
                  padding: '16px 32px',
                  borderRadius: '40px',
                  backgroundColor: '#4A463F',
                  color: '#FFF',
                  border: 'none',
                  fontSize: '1.2rem',
                  fontWeight: '800',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s ease, background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ✨ 開始巡視羊群
            </button>
          </div>
        </>
      )}

      {showSwipeMode && (
        <SheepSwipeView 
            sheepList={[...useGameState().sheep].sort((a,b) => {
                const todayStr = new Date().toDateString();
                const aPrayed = a.lastPrayedDate === todayStr;
                const bPrayed = b.lastPrayedDate === todayStr;
                
                // 1. Unprayed sheep at the front
                if (aPrayed !== bPrayed) return aPrayed ? 1 : -1;

                // 2. Secondary sorts (Pinned, Sick, ID)
                const aPinned = settings?.pinnedSheepIds?.includes(a.id);
                const bPinned = settings?.pinnedSheepIds?.includes(b.id);
                if (aPinned !== bPinned) return aPinned ? -1 : 1;
                if (a.status === 'sick' && b.status !== 'sick') return -1;
                if (b.status === 'sick' && a.status !== 'sick') return 1;
                return a.id - b.id;
            })}
            tags={useGameState().tags}
            tagAssignmentsBySheep={useGameState().tagAssignmentsBySheep}
            onSelect={handleSelectFromSwipe}
            onClose={() => setShowSwipeMode(false)}
        />
      )}

      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
}

export default App;
