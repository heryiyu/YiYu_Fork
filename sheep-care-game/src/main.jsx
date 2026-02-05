import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/design-tokens.css'
import './index.css'
import './debug.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'
import { ConfirmDialogProvider } from './context/ConfirmContext.jsx'
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ConfirmDialogProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </ConfirmDialogProvider>
    </ErrorBoundary>
  </StrictMode>,
)
