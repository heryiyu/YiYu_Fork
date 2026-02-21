import { useContext } from 'react';
import { GameActionsContext, GameStateContext, UserAuthContext } from './contexts';

/**
 * useGameActions - Access stable functions without rerendering on state changes.
 * Use this for buttons, forms, and async operations.
 */
export const useGameActions = () => {
    const context = useContext(GameActionsContext);
    if (!context) throw new Error('useGameActions must be used within GameProvider');
    return context;
};

/**
 * useGameState - Access high-frequency data (sheep, weather, tags).
 * Use this for Canvas, Lists, and display-only elements.
 */
export const useGameState = () => {
    const context = useContext(GameStateContext);
    if (!context) throw new Error('useGameState must be used within GameProvider');
    return context;
};

/**
 * useUserAuth - Access authentication and global user settings.
 * Use this for Login, Profile, and Settings UI.
 */
export const useUserAuth = () => {
    const context = useContext(UserAuthContext);
    if (!context) throw new Error('useUserAuth must be used within GameProvider');
    return context;
};

/**
 * useGame - Unified hook for backward compatibility.
 * WARNING: Using this hook will cause rerenders on EVERY state update (including sheep movement).
 */
export const useGame = () => {
    const actions = useGameActions();
    const state = useGameState();
    const auth = useUserAuth();

    return {
        ...actions,
        ...state,
        ...auth
    };
};
