
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SHEEP_TYPES } from '../data/sheepData';
import { sanitizeSheep, calculateTick, generateVisuals, getSheepMessage } from '../utils/gameLogic';

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

    const [sheep, setSheep] = useState(() => (getLocalData('sheep', []) || [])
        .filter(s => s && s.type && SHEEP_TYPES[s.type]));
    const [inventory, setInventory] = useState(() => getLocalData('inventory', []));
    const [message, setMessage] = useState(null);
    const [weather, setWeather] = useState({ type: 'sunny', isDay: true, temp: 25 });

    // User Location State (Persisted)
    const [location, setLocation] = useState(() => {
        const saved = localStorage.getItem('sheep_user_location');
        return saved ? JSON.parse(saved) : { name: 'Taipei', lat: 25.0330, lon: 121.5654 };
    });

    // Save location changes
    useEffect(() => {
        localStorage.setItem('sheep_user_location', JSON.stringify(location));
    }, [location]);

    const updateUserLocation = async (cityName) => {
        const importWeather = await import('../utils/weatherService');
        const result = await importWeather.searchCity(cityName);
        if (result) {
            setLocation(result);
            showMessage(`所在地已更新為: ${result.name}`);
            // Trigger immediate weather update logic handled by useEffect dep? 
            // Better to just let the effect run or call fetch directly.
            // Let's rely on effect dependency.
            return true;
        } else {
            showMessage("找不到該城市，請重試！");
            return false;
        }
    };

    // Weather Fetch Loop
    useEffect(() => {
        const fetchWeather = async () => {
            const importWeather = await import('../utils/weatherService');
            // Use current location state
            const w = await importWeather.getWeather(location.lat, location.lon);
            setWeather(w);
            setGlobalMessage(`當地天氣 (${location.name}): ${w.type === 'snow' ? '下雪中 ❄️' : (w.type === 'rain' ? '下雨中 🌧️' : (w.type === 'cloudy' ? '多雲 ☁️' : '晴朗 ☀️'))} (${w.temp}°C)`);
        };

        fetchWeather(); // Initial run on mount or location change
        const interval = setInterval(fetchWeather, 3600000); // 1 Hour

        return () => clearInterval(interval);
    }, [location]); // Re-run when location changes

    const setGlobalMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 5000); // Slightly longer for weather
    };

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
    const applyLoadedData = (loadedData, targetUser) => {
        const now = Date.now();
        const lastSave = loadedData.lastSave || now;
        const diffHours = (now - lastSave) / (1000 * 60 * 60);
        // User requested max 20% drop per day (24 hours)
        const decayAmount = (diffHours / 24) * 20;

        // Robust filtering & Logic
        const decaySheep = (loadedData.sheep || [])
            .filter(s => s && s.type && SHEEP_TYPES[s.type])
            .map(s => {
                if (s.status === 'dead') return s;
                // Decay
                const newHealth = Math.max(0, s.health - decayAmount);
                let newStatus = s.status;
                if (newHealth <= 0) newStatus = 'dead';
                else if (newHealth < 50 && s.status === 'healthy' && Math.random() < 0.5) newStatus = 'sick';

                // Sanitize & Return
                return sanitizeSheep({ ...s, health: newHealth, status: newStatus });
            });

        setSheep(decaySheep);
        setInventory(loadedData.inventory || []);

        if (targetUser) {
            localStorage.setItem(`sheep_game_data_${targetUser}`, JSON.stringify({
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
                localStorage.setItem('sheep_current_session', name);

                const loaded = result.data;
                if (loaded && loaded.sheep) {
                    const diff = applyLoadedData(loaded, name);
                    // Welcome Message on Login
                    if (diff > 12) {
                        showMessage(`✨ ${getSheepMessage('login')} (離開 ${Math.round(diff)} 小時)`);
                    } else if (diff > 1) {
                        showMessage(`您離開了 ${Math.round(diff)} 小時，羊群狀態更新了...`);
                    } else {
                        showMessage(`歡迎回來，${name}! 👋`);
                    }
                } else {
                    setSheep([]); setInventory([]);
                }

                // Force reload to ensure clean UI state as requested
                setTimeout(() => {
                    window.location.reload();
                }, 500);

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
        localStorage.removeItem('sheep_current_session');
        setSheep([]); setInventory([]);
        // Force reload on logout too for safety
        window.location.reload();
    };

    const saveToCloud = async () => {
        if (!currentUser || !API_URL) return;
        const dataToSave = { sheep, inventory, lastSave: Date.now() };
        localStorage.setItem(`sheep_game_data_${currentUser}`, JSON.stringify(dataToSave));
        try {
            await fetch(API_URL, {
                method: 'POST', keepalive: true,
                body: JSON.stringify({ action: 'save', user: currentUser, data: dataToSave })
            });
            console.log("Auto-save success");
        } catch (e) { console.error("Auto-save failed", e); }
    };

    useEffect(() => {
        if (currentUser) {
            const user = localStorage.getItem('sheep_current_session');
            if (user === currentUser) {
                const cache = localStorage.getItem(`sheep_game_data_${currentUser}`);
                if (cache) {
                    try {
                        const parsed = JSON.parse(cache);
                        const diff = applyLoadedData(parsed, currentUser);
                        if (diff > 0.1) console.log(`Restored session decay: ${diff.toFixed(2)} hours`);
                    } catch (e) { }
                }
            }
        }
    }, []);

    // Auto-Save: Debounced on change + Unload
    useEffect(() => {
        if (!currentUser) return;

        const handleUnload = () => { saveToCloud(); };
        window.addEventListener('beforeunload', handleUnload);

        // Debounce save (2 seconds after last change)
        const timeoutId = setTimeout(() => {
            saveToCloud();
        }, 2000);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [sheep, inventory, currentUser]);

    // --- Game Loop ---
    useEffect(() => {
        if (!currentUser) return;

        const tick = setInterval(() => {
            setSheep(prev => prev.filter(s => s).map(s => {
                const updated = calculateTick(s);
                if (updated.status === 'dead' && s.status !== 'dead') {
                    showMessage(`🕊️ ${s.name} 不幸離世了...`);
                }
                return updated;
            }));
        }, 100);
        return () => clearInterval(tick);
    }, [currentUser]);

    const adoptSheep = (data = {}) => {
        const { name = '小羊', spiritualMaturity = '' } = data;
        const newSheep = {
            id: Date.now(),
            name, type: 'LAMB',
            spiritualMaturity,
            careLevel: 0, health: 100, strength: 0, status: 'healthy',
            state: 'idle', note: '', prayedCount: 0, lastPrayedDate: null,
            resurrectionProgress: 0,
            visual: generateVisuals(),
            x: Math.random() * 90 + 5, y: Math.random() * 90 + 5,
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
                const todayDate = new Date(today);
                const lastDate = s.lastPrayedDate ? new Date(s.lastPrayedDate) : null;

                // Calculate day difference
                let diffDays = -1;
                if (lastDate) {
                    const diffTime = todayDate - lastDate;
                    diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                }

                // Logic:
                // 1. Same day -> Show message, do nothing
                if (diffDays === 0) {
                    showMessage("今天已經為這隻小羊禱告過了，請明天再來！🙏");
                    return s;
                }

                // 2. Consecutive day (diff === 1) or First time (diff === -1) -> Increment
                // 3. Broken chain (diff > 1) -> Reset to 1
                let newProgress = (diffDays === 1 || diffDays === -1) ? (s.resurrectionProgress || 0) + 1 : 1;

                // Check resurrection
                if (newProgress >= 5) {
                    showMessage(`✨ 奇蹟發生了！${s.name} 復活了！`);
                    return {
                        ...s, status: 'healthy', health: 100,
                        resurrectionProgress: 0,
                        lastPrayedDate: today, prayedCount: 1
                    };
                } else {
                    const statusMsg = diffDays > 1 ? "禱告中斷了，重新開始..." : "迫切認領禱告進行中...";
                    showMessage(`🙏 ${statusMsg} (${newProgress}/5)`);
                    return { ...s, resurrectionProgress: newProgress, lastPrayedDate: today };
                }
            }

            let count = (s.lastPrayedDate === today) ? s.prayedCount : 0;
            if (count >= 3) {
                showMessage("這隻小羊今天已經接受過 3 次禱告了，讓牠休息一下吧！🙏");
                return s;
            }

            // Max increase 20% per day. 3 prayers allowed -> ~6.6% per prayer.
            // Using 6 HP per prayer = 18 HP/day max.
            const newHealth = Math.min(100, s.health + 6);
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

    const deleteSheep = (id) => {
        setSheep(prev => prev.filter(s => s.id !== id));
    };

    return (
        <GameContext.Provider value={{
            currentUser, sheep, inventory, message, weather, location,
            adoptSheep, prayForSheep, shepherdSheep, updateSheep, deleteSheep, updateUserLocation,
            sendVerificationEntry, registerUser, loginUser, logout, saveToCloud
        }}>
            {children}
        </GameContext.Provider>
    );
};
