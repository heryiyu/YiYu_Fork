import { useContext } from 'react';
import { GameActionsContext, GameStateContext, UserAuthContext } from './contexts';

export const useGame = () => {
    const actions = useContext(GameActionsContext);
    const state = useContext(GameStateContext);
    const auth = useContext(UserAuthContext);

    if (!actions || !state || !auth) {
        // Fallback for safety, though it should be wrapped in Provider
        return {};
    }

    return {
        ...actions,
        ...state,
        ...auth
    };
};
