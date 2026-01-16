
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SHEEP_TYPES } from '../data/sheepData';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const API_URL = import.meta.env.VITE_API_URL;

    // --- Session Init ---
    const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('sheep_current_session'));

    const getLocalData = (key, fallback) => {
        const user = localStorage.getItem('sheep_current_session');
        if (user) {
            const cache = localStorage.getItem(`sheep_game_data_${user}`);
            if (cache) {
                try { return JSON.parse(cache)[key] || fallback; } catch (e) { }
            }
        }
        return fallback;
    };

    const [sheep, setSheep] = useState(() => getLocalData('sheep', []));
    const [inventory, setInventory] = useState(() => getLocalData('inventory', []));
    const [message, setMessage] = useState(null);

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 3000);
    };

    const hashPassword = async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const generateVisuals = () => {
        const colors = ['#ffffff', '#fff5e6', '#f0f8ff', '#fff0f5', '#e6e6fa', '#f5f5f5'];
        const accessories = ['none', 'none', 'none', 'tie_red', 'tie_blue', 'flower', 'scarf_green'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const accessory = accessories[Math.floor(Math.random() * accessories.length)];
        return { color, accessory };
    };

    // --- Actions ---
    const sendVerificationEntry = async (email) => {
        try {
            const res = await fetch(API_URL, {
                method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'send_code', email })
            });
            return await res.json();
        } catch (e) { return { status: 'error', message: '連線失敗' }; }
    };

    const registerUser = async (name, email, password, code) => {
        try {
            const hashedPassword = await hashPassword(password);
            const res = await fetch(API_URL, {
                method: 'POST', body: JSON.stringify({ action: 'register', name, email, code, password: hashedPassword })
            });
            return await res.json();
        } catch (e) { return { status: 'error', message: '連線失敗' }; }
    };

    // Helper for applying loaded data + decay
    const applyLoadedData = (loadedData) => {
        const now = Date.now();
        const lastSave = loadedData.lastSave || now;
        const diffHours = (now - lastSave) / (1000 * 60 * 60);
        const decayAmount = (diffHours / 24) * 80;

        const decaySheep = (loadedData.sheep || []).map(s => {
            if (s.status === 'dead') return s;

            const newHealth = Math.max(0, s.health - decayAmount);
            let newStatus = s.status;

            if (newHealth <= 0) {
                newStatus = 'dead';
            } else if (newHealth < 50 && s.status === 'healthy') {
                if (Math.random() < 0.5) newStatus = 'sick';
            }
            return { ...s, health: newHealth, status: newStatus };
        });

        setSheep(decaySheep);
        setInventory(loadedData.inventory || []);

        // Save local immediately to reflect decay
        if (currentUser) {
            localStorage.setItem(`sheep_game_data_${currentUser}`, JSON.stringify({
                sheep: decaySheep,
                inventory: loadedData.inventory || [],
                lastSave: now
            }));
        }

        return diffHours;
    };

    const loginUser = async (name, password) => {
        showMessage("登入中...");
        try {
            const hashedPassword = await hashPassword(password);
            const res = await fetch(API_URL, {
                method: 'POST', body: JSON.stringify({ action: 'login', name, password: hashedPassword })
            });
            const result = await res.json();

            if (result.status === 'success') {
                setCurrentUser(name);
                localStorage.setItem('sheep_current_session', name); // Persist Session

                const loaded = result.data;
                if (loaded && loaded.sheep) {
                    const diff = applyLoadedData(loaded);
                    if (diff > 1) showMessage(`您離開了 ${Math.round(diff)} 小時，羊群狀態更新了...`);
                } else {
                    setSheep([]); setInventory([]);
                }
                showMessage(`歡迎回來，${name}! 👋`);
                return { status: 'success' };
            } else {
                showMessage(`❌ ${result.message}`);
                return result;
            }
        } catch (e) { showMessage("⚠️ 連線失敗"); return { status: 'error', message: 'Network Error' }; }
    };

    const logout = async () => {
        await saveToCloud();
        setCurrentUser(null);
        localStorage.removeItem('sheep_current_session'); // Clear Session
        setSheep([]); setInventory([]);
    };

    const saveToCloud = async () => {
        if (!currentUser || !API_URL) return;
        const dataToSave = { sheep, inventory, lastSave: Date.now() };

        // Save Local
        localStorage.setItem(`sheep_game_data_${currentUser}`, JSON.stringify(dataToSave));

        // Save Cloud
        try {
            await fetch(API_URL, {
                method: 'POST', keepalive: true,
                body: JSON.stringify({ action: 'save', user: currentUser, data: dataToSave })
            });
            console.log("Auto-save success");
        } catch (e) { console.error("Auto-save failed", e); }
    };

    // --- Boot Logic: Apply Decay if Restored from Session ---
    useEffect(() => {
        // If we restored a user from localStorage, we should calculate decay based on the cached 'lastSave'
        if (currentUser) {
            const user = localStorage.getItem('sheep_current_session');
            if (user === currentUser) {
                const cache = localStorage.getItem(`sheep_game_data_${currentUser}`);
                if (cache) {
                    try {
                        const parsed = JSON.parse(cache);
                        // Apply decay logic to the restored state
                        // We can just re-set state using helper
                        const diff = applyLoadedData(parsed);
                        if (diff > 0.1) console.log(`Restored session decay: ${diff.toFixed(2)} hours`);
                    } catch (e) { }
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    useEffect(() => {
        if (!currentUser) return;
        const saveInterval = setInterval(() => { saveToCloud(); }, 60000);
        const handleUnload = () => { saveToCloud(); };
        window.addEventListener('beforeunload', handleUnload);
        return () => { clearInterval(saveInterval); window.removeEventListener('beforeunload', handleUnload); };
    }, [sheep, inventory, currentUser]);

    // --- Game Loop ---
    useEffect(() => {
        if (!currentUser) return;
        const tick = setInterval(() => {
            setSheep(prevSheep => {
                return prevSheep.map(s => {
                    if (s.status === 'dead') return s;

                    let { x, y, state, angle, direction } = s;
                    if (y === undefined) y = Math.random() * 50;
                    if (angle === undefined) angle = Math.random() * Math.PI * 2;
                    const speed = 1.0;

                    if (state === 'idle') {
                        if (Math.random() < 0.1) state = 'walking';
                    } else if (state === 'walking') {
                        if (Math.random() < 0.1) { state = 'idle'; } else {
                            angle += (Math.random() - 0.5) * 0.5;
                            x += Math.cos(angle) * speed * 1.5;
                            y += Math.sin(angle) * speed;
                            if (x < 5) { x = 5; angle = Math.PI - angle; }
                            if (x > 95) { x = 95; angle = Math.PI - angle; }
                            if (y < 0) { y = 0; angle = -angle; }
                            if (y > 90) { y = 90; angle = -angle; }
                        }
                    }
                    direction = Math.cos(angle) > 0 ? 1 : -1;

                    const decayRate = s.status === 'sick' ? 0.2 : s.status === 'injured' ? 0.1 : 0.02;
                    const newHealth = Math.max(0, s.health - decayRate);
                    let newStatus = s.status;

                    if (newHealth <= 0) {
                        newStatus = 'dead';
                        showMessage(`🕊️ ${s.name} 不幸離世了...`);
                    } else if (newHealth < 50 && s.status === 'healthy' && Math.random() < 0.005) {
                        newStatus = 'sick';
                    }

                    return { ...s, x, y, angle, state, direction, health: newHealth, status: newStatus };
                });
            });
        }, 100);
        return () => clearInterval(tick);
    }, [currentUser]);

    const adoptSheep = () => {
        const newSheep = {
            id: Date.now(),
            name: '小羊', type: 'LAMB',
            careLevel: 0, health: 100, strength: 0, status: 'healthy',
            state: 'idle', note: '', prayedCount: 0, lastPrayedDate: null,
            resurrectionProgress: 0,
            visual: generateVisuals(),
            x: Math.random() * 80 + 10, y: Math.random() * 80 + 5,
            angle: Math.random() * Math.PI * 2, direction: 1
        };
        setSheep(prev => [...prev, newSheep]);
    };

    const updateSheep = (id, updates) => {
        setSheep(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const prayForSheep = (id) => {
        const today = new Date().toDateString();
        setSheep(prev => prev.map(s => {
            if (s.id !== id) return s;

            if (s.status === 'dead') {
                const newProgress = (s.resurrectionProgress || 0) + 1;
                if (newProgress >= 5) {
                    showMessage(`✨ 奇蹟發生了！${s.name} 復活了！`);
                    return {
                        ...s, status: 'healthy', health: 100,
                        resurrectionProgress: 0,
                        lastPrayedDate: today, prayedCount: 1
                    };
                } else {
                    showMessage(`🙏 復活儀式進行中... (${newProgress}/5)`);
                    return { ...s, resurrectionProgress: newProgress };
                }
            }

            let count = (s.lastPrayedDate === today) ? s.prayedCount : 0;
            if (count >= 3) {
                showMessage("這隻小羊今天已經接受過 3 次禱告了，讓牠休息一下吧！🙏");
                return s;
            }

            const newHealth = Math.min(100, s.health + 20);
            const newStatus = (s.status !== 'healthy') ? 'healthy' : s.status;
            const newCare = s.careLevel + 10;
            let newType = s.type;
            let finalCare = newCare;
            const typeDef = SHEEP_TYPES[s.type];
            if (typeDef.nextStage && newCare >= typeDef.growthThreshold) {
                finalCare = 0;
                newType = typeDef.nextStage.toUpperCase();
            }
            return {
                ...s, status: newStatus, health: newHealth, type: newType, careLevel: finalCare,
                lastPrayedDate: today, prayedCount: count + 1
            };
        }));
    };

    const shepherdSheep = (id) => { };

    return (
        <GameContext.Provider value={{
            currentUser, sheep, inventory, message,
            adoptSheep, prayForSheep, shepherdSheep, updateSheep,
            sendVerificationEntry, registerUser, loginUser, logout, saveToCloud
        }}>
            {children}
        </GameContext.Provider>
    );
};
