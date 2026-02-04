import React, { useState, useEffect } from 'react';
import { useGame } from './context/GameContext';
import { Field } from './components/Field';

import { SheepDetailModal } from './components/SheepDetailModal';
import { Guide } from './components/Guide';
import { Login } from './components/Login';
import { NicknameSetup } from './components/NicknameSetup';
import { SheepList } from './components/SheepList';
import { SettingsModal } from './components/SettingsModal';
import { SkinManager } from './components/SkinManager';
import { UserProfile } from './components/UserProfile';
import { AdminWeatherControl } from './components/AdminWeatherControl';
import './App.css';

import { AssetPreloader } from './components/AssetPreloader';
import { Bell, BellOff, BookOpen, Settings, Menu } from 'lucide-react';

function App() {
  const { currentUser, message, isLoading, nickname, notificationEnabled, toggleNotification, sheep, isAdmin, weather, showIntroVideo, markIntroWatched } = useGame();
  const [selectedSheepId, setSelectedSheepId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  // showList removed - permanent dock
  const [showSettings, setShowSettings] = useState(false);
  const [showSkinManager, setShowSkinManager] = useState(false);
  const [isHudMenuOpen, setIsHudMenuOpen] = useState(false);

  // Reset state when user changes
  useEffect(() => {
    setSelectedSheepId(null);
    setShowGuide(false);
    setShowSettings(false);
    setShowSkinManager(false);
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
      {message && <div key={message} className="toast-message">{message}</div>}

      {/* --- Unified Top Left Widget --- */}
      <UserProfile />
      {/* Weather Control temporarily retired */}
      {false && <AdminWeatherControl />}

      {/* --- HUD: Top Right System Buttons (Lucide icons) --- */}
      <div className="hud-right">
        <button
          className="hud-btn hud-menu-btn"
          onClick={() => setIsHudMenuOpen((prev) => !prev)}
          title="選單"
          aria-expanded={isHudMenuOpen}
          aria-haspopup="true"
        >
          <Menu size={18} strokeWidth={2.5} />
        </button>

        <div className={`hud-right-actions ${isHudMenuOpen ? 'hud-right-actions--open' : ''}`}>
          {/* Bell */}
          <button
            className="hud-btn"
            style={{ background: notificationEnabled ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.45)' }}
            onClick={() => {
              toggleNotification();
              setIsHudMenuOpen(false);
            }}
            title={notificationEnabled ? "關閉提醒" : "開啟提醒"}
          >
            {notificationEnabled ? <Bell size={18} strokeWidth={2.5} /> : <BellOff size={18} strokeWidth={2.5} />}
          </button>

          {/* Guide */}
          <button
            className="hud-btn"
            onClick={() => {
              setShowGuide(true);
              setIsHudMenuOpen(false);
            }}
            title="使用說明"
          >
            <BookOpen size={18} strokeWidth={2.5} />
          </button>

          {/* Display Settings (Sheep Count) */}
          <button
            className="hud-btn"
            onClick={() => {
              setShowSettings(true);
              setIsHudMenuOpen(false);
            }}
            title="設定"
          >
            <Settings size={18} strokeWidth={2.5} />
          </button>

          {/* Skin Manager button hidden – not in use anymore */}
          {false && isAdmin && (
            <button
              className="hud-btn"
              style={{ background: '#e3f2fd', border: '1px solid #90caf9' }}
              onClick={() => {
                setShowSkinManager(true);
                setIsHudMenuOpen(false);
              }}
              title="皮膚管理"
            >
              🎨
            </button>
          )}
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

      {showSkinManager && (
        <SkinManager onClose={() => setShowSkinManager(false)} />
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
