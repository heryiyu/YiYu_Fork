import React, { useState, useEffect } from 'react';
import { useGame } from './context/GameContext';
import { Field } from './components/Field';

import { SheepDetailModal } from './components/SheepDetailModal';
import { Guide } from './components/Guide';
import { Login } from './components/Login';
import { NicknameSetup } from './components/NicknameSetup';
import { SheepList } from './components/SheepList';
import { SettingsModal } from './components/SettingsModal';
import { UserProfile } from './components/UserProfile';
import { Toast } from './components/ui/Toast';
import { Tooltip } from './components/ui/Tooltip';
import './App.css';

import { AssetPreloader } from './components/AssetPreloader';
import { Bell, BellOff, BookOpen, Settings, Menu } from 'lucide-react';

function App() {
  const { currentUser, message, isLoading, nickname, notificationEnabled, toggleNotification, sheep, isAdmin, weather, showIntroVideo, markIntroWatched } = useGame();
  const [selectedSheepId, setSelectedSheepId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  // showList removed - permanent dock
  const [showSettings, setShowSettings] = useState(false);
  const [isHudMenuOpen, setIsHudMenuOpen] = useState(false);

  // Reset state when user changes
  useEffect(() => {
    setSelectedSheepId(null);
    setShowGuide(false);
    setShowSettings(false);
  }, [currentUser]);

  // 0. Global Loading (Use AssetPreloader for consistency)
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

  // 2. Main Game
  const handleSelectSheep = (sheep) => {
    setSelectedSheepId(sheep.id);
  };

  const handleSelectFromList = (sheep) => {
    setSelectedSheepId(sheep.id);
  };

  return (
    <div className="game-container" key={currentUser} data-theme={weather?.timeStatus || 'day'}>
      <Toast key={message || 'toast'} message={message} />

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

          {/* Skin Manager button hidden – not in use anymore */}

        </div>
      </div>

      <Field onSelectSheep={handleSelectSheep} />



      {/* Permanent Foreground Dock */}
      <SheepList
        onSelect={handleSelectFromList}
      />

      {selectedSheepId && (
        <SheepDetailModal
          selectedSheepId={selectedSheepId}
          onClose={() => setSelectedSheepId(null)}
        />
      )}

      {showGuide && (
        <Guide onClose={() => setShowGuide(false)} />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showIntroVideo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.9)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{ width: '90%', maxWidth: '640px', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src="https://www.youtube.com/embed/tqupdMUIVWQ?start=16&autoplay=1"
                title="Intro Video"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
          <button
            onClick={markIntroWatched}
            style={{
              marginTop: '30px', padding: '10px 30px', fontSize: '1.1rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.5)',
              color: '#fff',
              borderRadius: '30px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.borderColor = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
          >
            略過 (Skip)
          </button>
          <p style={{ color: '#888', marginTop: '12px', fontSize: '0.9rem' }}>
            ※ 日後可至「牧羊人手冊」重溫
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
