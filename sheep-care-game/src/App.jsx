import React, { useState, useEffect } from 'react';
import { useGame } from './context/GameContext';
import { Field } from './components/Field';

import { DebugEditor } from './components/DebugEditor';
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

function App() {
  const { currentUser, message, isLoading, nickname, notificationEnabled, toggleNotification, sheep, isAdmin, weather } = useGame();
  const [selectedSheepId, setSelectedSheepId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  // showList removed - permanent dock
  const [showSettings, setShowSettings] = useState(false);
  const [showSkinManager, setShowSkinManager] = useState(false);

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
      <AdminWeatherControl />

      {/* --- HUD: Top Right System Buttons --- */}
      <div className="hud-right">
        {/* Bell */}
        <button
          className="hud-btn"
          style={{ background: notificationEnabled ? '#fff' : '#eee' }}
          onClick={toggleNotification}
          title={notificationEnabled ? "關閉提醒" : "開啟提醒"}
        >
          {notificationEnabled ? '🔔' : '🔕'}
        </button>

        {/* Guide */}
        <button
          className="hud-btn"
          onClick={() => setShowGuide(true)}
        >
          📖
        </button>

        {/* Display Settings (Sheep Count) */}
        <button
          className="hud-btn"
          onClick={() => setShowSettings(true)}
        >
          ⚙️
        </button>

        {/* Admin Skin Manager Button */}
        {isAdmin && (
          <button
            className="hud-btn"
            style={{ background: '#e3f2fd', border: '1px solid #90caf9' }}
            onClick={() => setShowSkinManager(true)}
            title="皮膚管理"
          >
            🎨
          </button>
        )}
      </div>

      <Field onSelectSheep={handleSelectSheep} />



      {/* Permanent Foreground Dock */}
      <SheepList
        onSelect={handleSelectFromList}
      />

      {selectedSheepId && (
        <DebugEditor
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
    </div>
  );
}

export default App;
