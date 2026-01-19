
import React, { useState, useEffect } from 'react';
import { useGame } from './context/GameContext';
import { Field } from './components/Field';
import { Controls } from './components/Controls';
import { DebugEditor } from './components/DebugEditor';
import { Guide } from './components/Guide';
import { Login } from './components/Login';
import { SheepList } from './components/SheepList';
import './App.css';

function App() {
  const { currentUser, message } = useGame();
  const [selectedSheepId, setSelectedSheepId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showList, setShowList] = useState(false);

  // 1. Not Logged In -> Show Login Screen
  if (!currentUser) {
    return <Login />;
  }

  // 2. Logged In -> Show Game
  const handleSelectSheep = (sheep) => {
    setSelectedSheepId(sheep.id);
  };

  const handleSelectFromList = (sheep) => {
    setShowList(false);
    setSelectedSheepId(sheep.id);
  };

  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // 3. Reset state when user changes
  useEffect(() => {
    setSelectedSheepId(null);
    setShowList(false);
    setShowGuide(false);
    setIsControlsCollapsed(false);
  }, [currentUser]);

  return (
    <div className="game-container" key={currentUser}>
      {message && <div className="toast-message">{message}</div>}

      {/* Help Button */}
      <button
        className="icon-btn"
        style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 100,
          width: '40px', height: '40px', fontSize: '1.5rem', opacity: 1
        }}
        onClick={() => setShowGuide(true)}
      >
        📖
      </button>

      <Field onSelectSheep={handleSelectSheep} />

      <Controls
        onOpenList={() => setShowList(true)}
        isCollapsed={isControlsCollapsed}
        onToggleCollapse={() => setIsControlsCollapsed(!isControlsCollapsed)}
      />

      {/* Modals */}
      {showList && (
        <SheepList
          onSelect={handleSelectFromList}
          onClose={() => setShowList(false)}
        />
      )}

      {selectedSheepId && (
        <DebugEditor
          selectedSheepId={selectedSheepId}
          onClose={() => {
            setSelectedSheepId(null);
            setShowList(true);
          }}
        />
      )}

      {showGuide && (
        <Guide onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}

export default App;
