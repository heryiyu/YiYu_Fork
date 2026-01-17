
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

    const [sheep, setSheep] = useState(() => (getLocalData('sheep', []) || [])
        .filter(s => s && s.type && SHEEP_TYPES[s.type]));
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

    // --- Emotional Blackmail Messages ---
    const GUILT_MESSAGES = {
        login: [
            "喲，大忙人終於想起這裡還有羊了？",
            "你要是再晚點來，我就去隔壁牧場了。",
            "我差點以為這是一個無人島。",
            "你還記得我長什麼樣子嗎？",
            "沒關係，我已經習慣等待了..."
        ],
        neglected: [
            "你的良心不會痛嗎？",
            "我很餓，但我不說。",
            "隔壁的牧羊人好像比較溫柔...",
            "反正我不重要... 🍂",
            "去忙吧，不用管我死活。",
            "希望你玩得開心... 即使我在受苦。",
            "我的肚子在唱歌，你聽到了嗎？"
        ],
        critical: [
            "我看見天堂的阿嬤了...",
            "再見了，無情的世界。",
            "若有來世，我想當隻石頭...",
            "救... 救命...",
            "這就是終點了嗎？"
        ],
        happy: [
            "最喜歡你了！ ❤️",
            "今天天氣真好～ ☀️",
            "咩～ (開心)",
            "你真是個好牧羊人！",
            "又是美好的一天！"
        ]
    };
    const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

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
        const decayAmount = (diffHours / 24) * 80;

        // Robust filtering: Exist AND have Type AND Type is valid
        const decaySheep = (loadedData.sheep || [])
            .filter(s => s && s.type && SHEEP_TYPES[s.type])
            .map(s => {
                if (s.status === 'dead') return s;

                const newHealth = Math.max(0, s.health - decayAmount);
                let newStatus = s.status;

                if (newHealth <= 0) {
                    newStatus = 'dead';
                } else if (newHealth < 50 && s.status === 'healthy') {
                    if (Math.random() < 0.5) newStatus = 'sick';
                }
                // Ensure visual exists
                const safeVisual = s.visual || generateVisuals();
                return { ...s, health: newHealth, status: newStatus, visual: safeVisual };
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
                    // Guilt Trip on Login
                    if (diff > 12) {
                        showMessage(`💔 ${getRandomItem(GUILT_MESSAGES.login)} (離開 ${Math.round(diff)} 小時)`);
                    } else if (diff > 1) {
                        showMessage(`您離開了 ${Math.round(diff)} 小時，羊群狀態更新了...`);
                    } else {
                        showMessage(`歡迎回來，${name}! 👋`);
                    }
                } else {
                    setSheep([]); setInventory([]);
                }
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

        const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

        const tick = setInterval(() => {
            setSheep(prev => prev.filter(s => s).map(s => {
                if (s.status === 'dead') return s;

                let { x, y, state, angle, direction, message, messageTimer } = s;

                // 1. Movement Logic
                if (state === 'walking') {
                    if (Math.random() < 0.05) state = 'idle';
                    else {
                        y = y ?? Math.random() * 50;
                        angle = angle ?? Math.random() * Math.PI * 2;

                        // Smooth random turn
                        angle += (Math.random() - 0.5) * 0.5;
                        x += Math.cos(angle) * 1.5;
                        y += Math.sin(angle);

                        // Bounce off walls
                        if (x < 5 || x > 95) { angle = Math.PI - angle; x = clamp(x, 5, 95); }
                        if (y < 0 || y > 100) { angle = -angle; y = clamp(y, 0, 100); }
                    }
                } else {
                    if (Math.random() < 0.05) state = 'walking';
                }
                direction = Math.cos(angle) > 0 ? 1 : -1;

                // 2. Health & Status Logic
                const decayRate = s.status === 'sick' ? 0.2 : (s.status === 'injured' ? 0.1 : 0.02);
                const newHealth = Math.max(0, s.health - decayRate);
                let newStatus = s.status;

                if (newHealth <= 0) {
                    newStatus = 'dead';
                    showMessage(`🕊️ ${s.name} 不幸離世了...`);
                } else if (newHealth < 50 && s.status === 'healthy' && Math.random() < 0.005) {
                    newStatus = 'sick';
                }

                // 3. Message Logic
                let timer = messageTimer > 0 ? messageTimer - 0.1 : 0;
                let msg = timer > 0 ? message : null;

                if (timer <= 0 && Math.random() < 0.003) {
                    timer = 5;
                    if (newHealth < 30) msg = getRandomItem(GUILT_MESSAGES.critical);
                    else if (newHealth < 60) msg = getRandomItem(GUILT_MESSAGES.neglected);
                    else if (Math.random() < 0.3) msg = getRandomItem(GUILT_MESSAGES.happy);
                }

                return {
                    ...s, x, y, angle, state, direction,
                    health: newHealth, status: newStatus,
                    message: msg, messageTimer: timer
                };
            }));
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
