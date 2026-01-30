
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SHEEP_TYPES } from '../data/sheepData';
import { calculateTick, generateVisuals, getSheepMessage, calculateSheepState, calculateOfflineDecay } from '../utils/gameLogic';
import { gameState } from '../services/gameState';
import { supabase } from '../services/supabaseClient';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

// Supabase client is managed in services/supabaseClient

export const GameProvider = ({ children }) => {
    const LIFF_ID = "2008919632-15fCJTqb";

    // --- Session Init (SessionStorage for Auto-Logout on Close) ---
    const [currentUser, setCurrentUser] = useState(null); // Line Name
    const [nickname, setNickname] = useState(null); // User Nickname
    const [lineId, setLineId] = useState(null); // Line User ID
    const [isLoading, setIsLoading] = useState(true);
    const [isInClient, setIsInClient] = useState(false); // New state to track if in LINE Client

    const [isDataLoaded, setIsDataLoaded] = useState(false);

    const getLocalData = (key, fallback) => {
        // We only load data if we have a valid session user
        const storedUser = localStorage.getItem('sheep_current_session');
        if (storedUser) {
            const cache = localStorage.getItem(`sheep_game_data_${storedUser}`);
            if (cache) {
                try { return JSON.parse(cache)[key] || fallback; } catch (e) { }
            }
        }
        return fallback;
    };

    // ... (Existing state)
    const [sheep, setSheep] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [message, setMessage] = useState(null);
    const [notificationEnabled, setNotificationEnabled] = useState(false);
    const [weather, setWeather] = useState({ type: 'sunny', isDay: true, temp: 25 });

    const [skins, setSkins] = useState([]); // New Skins State

    // --- SETTINGS (Device Specific) ---
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('sheep_game_settings');
            return saved ? JSON.parse(saved) : { maxVisibleSheep: 15 };
        } catch {
            return { maxVisibleSheep: 15 };
        }
    });

    const updateSetting = (key, value) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            localStorage.setItem('sheep_game_settings', JSON.stringify(next));
            return next;
        });
    };

    // --- Sync State Refs ---
    const lastSaveTimeRef = React.useRef(0); // Tracks the timestamp of current data
    const lastSyncCheckRef = React.useRef(0); // For debouncing visibility checks

    // ... (Existing useEffects)

    // --- SKINS LOGIC ---
    const loadSkins = async (userId) => {
        try {
            let query = supabase.from('sheep_skins').select('*');

            // If Admin, load ALL skins. If normal user, load public OR own.
            if (userId !== 'admin') {
                query = query.or(`is_public.eq.true,created_by.eq.${userId}`);
            }

            const { data, error } = await query;

            if (error) {
                // If table doesn't exist yet, just ignore
                console.warn("Could not load skins (Table might not exist yet)", error);
                return;
            }
            if (data) setSkins(data);
        } catch (e) { console.error("Load Skins Error", e); }
    };

    const toggleSkinPublic = async (skinId, isPublic) => {
        if (!lineId || !isAdmin) return;
        try {
            const { error } = await supabase
                .from('sheep_skins')
                .update({ is_public: isPublic })
                .eq('id', skinId);

            if (error) throw error;

            // Update Local State
            setSkins(prev => prev.map(s => s.id === skinId ? { ...s, is_public: isPublic } : s));
            showMessage(isPublic ? "已設為公開 ✅" : "已設為私有 🔒");
        } catch (e) {
            console.error("Toggle Public Error", e);
            showMessage("設定失敗 ❌");
        }
    };

    const createSkin = async (name, fileOrUrl) => {
        if (!lineId) return null;
        try {
            let finalUrl = fileOrUrl;

            // 1. Upload if it's a File
            if (fileOrUrl instanceof File) {
                const fileExt = fileOrUrl.name.split('.').pop();
                // Path: userId/timestamp.ext
                const fileName = `${lineId}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('skins')
                    .upload(fileName, fileOrUrl);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('skins')
                    .getPublicUrl(fileName);

                finalUrl = data.publicUrl;
            }

            // 2. Insert DB Record
            const newSkin = {
                name,
                type: 'image',
                data: { url: finalUrl },
                is_public: lineId === 'admin', // Admin uploads are public by default
                created_by: lineId
            };
            const { data, error } = await supabase
                .from('sheep_skins')
                .insert([newSkin])
                .select()
                .single();

            if (error) throw error;
            setSkins(prev => [...prev, data]);
            return data;
        } catch (e) {
            alert("創建失敗: " + e.message);
            return null;
        }
    };

    // --- LIFF & Login Logic ---
    // ...
    const handleLoginSuccess = async (profile) => {
        setIsLoading(true);
        const { userId, displayName, pictureUrl } = profile;
        setLineId(userId);
        setCurrentUser(displayName);
        showMessage(`設定羊群中... (Hi, ${displayName})`);

        try {
            // New GameState Logic
            await loadSkins(userId);
            const data = await gameState.loadGame(userId);

            if (data && data.user) {
                // Apply loaded data
                const { user, sheep: loadedSheep } = data;

                setSheep(loadedSheep);
                setNickname(user.nickname); // or display_name? DB column 'nickname' exists? V2 migration said yes.

                // Load Game Data (Inventory, Settings)
                const gameData = user.game_data || {};
                setInventory(gameData.inventory || []);
                setNotificationEnabled(gameData.settings?.notify || false);

                setIsDataLoaded(true);
                showMessage(`歡迎回來，${user.nickname || displayName}! 👋`);
            } else {
                // Should not happen as loadGame creates user
                showMessage("設定完成！");
                setIsDataLoaded(true);
            }
        } catch (e) {
            console.error(e);
            showMessage("同步失敗");
        } finally {
            setIsLoading(false);
        }
    };

    // Save To Cloud
    const saveToCloud = async (overrides = {}) => {
        if (!lineId || !isDataLoaded || isLoading) return;

        try {
            const currentSheep = overrides.sheep || sheep;
            const currentInventory = overrides.inventory || inventory;
            const notifySetting = overrides.notificationEnabled ?? notificationEnabled;
            const currentNickname = overrides.nickname !== undefined ? overrides.nickname : nickname;

            // Construct gameData object (Fix: was missing)
            // Construct gameData object (Fix: Merge settings, don't overwrite)
            // We use stateRef.current.settings as base, then apply overrides if any (currently only notify passes override)
            // Actually, we should merge the override into the base.

            const currentSettings = {
                ...stateRef.current.settings, // Base: existing settings (e.g. maxVisibleSheep)
                notify: notifySetting         // Override/Update: notification status
            };

            const gameData = {
                inventory: currentInventory,
                settings: currentSettings,
                lastSave: Date.now()
            };

            // Parallel execute for faster close handling
            // Show simple toast if window is visible (not closing)
            if (document.visibilityState === 'visible') {
                setMessage("☁️ 儲存中...");
            }

            await Promise.all([
                gameState.saveAllSheep(currentSheep),
                gameState.saveUserProfile(lineId, {
                    game_data: gameData,
                    nickname: currentNickname,
                    last_login: new Date().toISOString()
                })
            ]);

            lastSaveTimeRef.current = Date.now();
            if (document.visibilityState === 'visible') {
                setTimeout(() => setMessage(null), 1000);
            }
        } catch (e) { console.error("Auto-save failed", e); }
    };

    // ...

    // Adopt Sheep (Updated)
    const adoptSheep = async (data = {}) => {
        const { name = '小羊', spiritualMaturity = '', visual, skinId } = data; // visual from modal

        // Optimistic UI
        let skinData = null;
        if (skinId && skins.length > 0) {
            skinData = skins.find(s => s.id === skinId);
        }

        const safeVisual = {
            ...generateVisuals(), // Fallback randoms
            ...(visual || {})     // Overrides from modal
        };
        if (skinData) safeVisual.skinData = skinData;

        // Use Helper to determine initial state from raw health (60)
        const { health: initHealth, status: initStatus, type: initType } = calculateSheepState(60, 'healthy');

        // Prepare Object for DB
        const newSheepProto = {
            name, type: initType,
            spiritualMaturity,
            careLevel: 0, health: initHealth, status: initStatus,
            state: 'idle', note: '', prayedCount: 0, lastPrayedDate: null,
            resurrectionProgress: 0,
            visual: safeVisual,
            skinId: skinId || null,
            x: Math.random() * 60 + 20, y: Math.random() * 60 + 20,
            angle: Math.random() * Math.PI * 2, direction: 1,
            user_id: lineId, // Essential for DB
        };

        try {
            // Create via Service
            const created = await gameState.createSheep(newSheepProto);
            if (created) {
                // Adapt back to UI model
                const uiSheep = {
                    ...newSheepProto,
                    id: created.id,
                    // ensure visual has skinData if needed for current session
                };
                setSheep(prev => [...prev, uiSheep]);
            }
        } catch (e) { console.error("Adopt failed", e); }
    };

    // ... (Location state omitted for brevity, logic unchanged) ...

    // User Location State (Persisted in LocalStorage - Device Preference)
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
            const w = await importWeather.getWeather(location.lat, location.lon);
            setWeather(w);
            setGlobalMessage(`當地天氣 (${location.name}): ${w.type === 'snow' ? '下雪中 ❄️' : (w.type === 'rain' ? '下雨中 🌧️' : (w.type === 'cloudy' ? '多雲 ☁️' : '晴朗 ☀️'))} (${w.temp}°C)`);
        };
        fetchWeather();
        const interval = setInterval(fetchWeather, 3600000);
        return () => clearInterval(interval);
    }, [location]);

    const setGlobalMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 5000);
    };

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 3000);
    };

    // --- Session Restoration (User Requested Removal for Strict Cloud Truth) ---
    // User wants to clear cache on exit, so we DO NOT restore from localStorage on mount.
    // Logic: Login -> Fetch Cloud -> Render.
    // If we restore here, we might get stale data that conflicts or duplicates with Cloud data later.
    useEffect(() => {
        // Just clear any lingering session if we want "Fresh on Refresh"
        // But Line Login might redirect. 
        // If we want "Persistence across Refresh", we keep localStorage but rely entirely on Cloud for "Truth".
        // The problem of "Duplication" comes from MERGING. We must NOT merge in handleLoginSuccess.
    }, []);

    const toggleNotification = async () => {
        const newState = !notificationEnabled;
        setNotificationEnabled(newState);
        showMessage(newState ? "🔔 牧羊提醒已開啟" : "🔕 牧羊提醒已關閉");

        // Immediate Save
        await saveToCloud({ notificationEnabled: newState });
    };

    // --- LIFF & Login Logic ---
    useEffect(() => {
        const initLiff = async () => {
            try {
                if (window.liff) {
                    await window.liff.init({ liffId: LIFF_ID });
                    console.log("LIFF Init Success");
                    setIsInClient(window.liff.isInClient());

                    if (window.liff.isLoggedIn()) {
                        const profile = await window.liff.getProfile();
                        handleLoginSuccess(profile);
                    } else {
                        setIsLoading(false);
                    }
                } else {
                    console.error("LIFF SDK not found");
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("LIFF Init Error or Not in LIFF", error);
                setIsLoading(false);
            }
        };
        initLiff();
    }, []);

    const loginWithLine = () => {
        // Localhost Bypass
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const mockProfile = {
                userId: 'admin', // Fixed ID for Admin
                displayName: 'Admin',
                pictureUrl: ''
            };
            handleLoginSuccess(mockProfile);
            return;
        }

        if (!window.liff) {
            showMessage("LIFF SDK 未載入");
            return;
        }
        if (!window.liff.isLoggedIn()) {
            window.liff.login();
        }
    };



    const logout = async () => {
        await saveToCloud();
        if (window.liff && window.liff.isLoggedIn()) {
            window.liff.logout();
        }
        setCurrentUser(null);
        setNickname(null);
        if (lineId) await clearData(lineId); // Clear IDB
        setLineId(null);
        setSheep([]); setInventory([]);
        setIsDataLoaded(false);
        window.location.reload();
    };


    // Helper for applying loaded data + decay
    const applyLoadedData = (loadedData, targetUser) => {
        const now = Date.now();
        const lastSave = loadedData.lastSave || now;
        const diffHours = (now - lastSave) / (1000 * 60 * 60);

        // Deduplicate Logic: ensure all IDs are unique
        const seenIds = new Set();
        const decaySheep = (loadedData.sheep || [])
            .map(s => {
                if (seenIds.has(s.id)) {
                    // Collision found! generate new ID
                    const newId = `${s.id}_${Math.random().toString(36).substr(2, 5)}`;
                    return { ...s, id: newId };
                }
                seenIds.add(s.id);
                return s;
            })
            .filter(s => s && (s.type && SHEEP_TYPES[s.type] || s.health >= 0)) // Relaxed check
            .map(s => {
                // Use Centralized Logic
                return calculateOfflineDecay(s, diffHours);
            });

        setSheep(decaySheep);
        setInventory(loadedData.inventory || []);
        setNotificationEnabled(loadedData.settings?.notify || false); // Load setting

        lastSaveTimeRef.current = lastSave; // Update Ref with loaded time

        // Cache Locally
        if (targetUser) {
            localStorage.setItem(`sheep_game_data_${targetUser}`, JSON.stringify({
                sheep: decaySheep,
                inventory: loadedData.inventory || [],
                settings: { notify: loadedData.settings?.notify || false }, // Save setting
                lastSave: now
            }));
        }

        return diffHours;
    };

    const forceLoadFromCloud = async () => {
        if (!lineId) {
            showMessage("⚠️ 無法連線：使用者未登入");
            return;
        }
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('users').select('*').eq('id', lineId).single();
            if (error) throw error;
            if (data && data.game_data) {
                applyLoadedData(data.game_data, lineId);
                // Also update nickname if changed in DB
                if (data.nickname) setNickname(data.nickname);
                setIsDataLoaded(true);
                showMessage("✅ 雲端資料讀取成功！(已覆蓋本地進度)");
            } else {
                showMessage("⚠️ 雲端無資料可讀取");
            }
        } catch (e) {
            console.error(e);
            showMessage("❌ 讀取失敗：" + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper Effect to keep Refs updated for AutoSave (Prevents Stale Closure in Interval)
    const stateRef = React.useRef({ sheep, inventory, settings });

    // Ref Sync: Keep Ref up to date for saveToCloud (async access)
    useEffect(() => {
        stateRef.current = { sheep, inventory, settings };
        lastSaveTimeRef.current = Date.now(); // Optional: track local changes? No, unsafe.
    }, [sheep, inventory, settings]);

    // Auto-Save Logic (Visibility Change + Periodic)
    useEffect(() => {
        // if (!lineId || !isDataLoaded) return; // This check was wrapping nested effects, causing syntax error.

        // Let's rely on individual handlers to check loading state.
    }, []); // Empty dependency for setup, handlers use Ref.

    // Auto-Save Logic (Visibility Change + Periodic)
    useEffect(() => {
        if (!lineId || !isDataLoaded) return;

        const handleUnload = () => {
            // Reliable Save on Close using KeepAlive Fetch
            const currentSheep = stateRef.current.sheep;
            const currentProfile = {
                game_data: {
                    inventory: stateRef.current.inventory,
                    settings: stateRef.current.settings,
                    lastSave: Date.now()
                },
                last_login: new Date().toISOString()
            };

            // We use nickname from component state directly if possible, or omit it to avoid overwrite
            // Actually, keepAlive is 'fire and forget', we trust Refs.
            // Using Sync version to force browser to wait
            gameState.saveGameSync(lineId, currentSheep, currentProfile);
        };

        const handleSave = () => {
            // Use Ref for latest state
            saveToCloud({
                sheep: stateRef.current.sheep,
                inventory: stateRef.current.inventory,
                settings: stateRef.current.settings
            });
        };

        const checkCloudVersion = async () => {
            if (isLoading) return;
            const now = Date.now();
            // Debounce: 10s
            if (now - lastSyncCheckRef.current < 10000) return;
            lastSyncCheckRef.current = now;

            try {
                // Fetch ONLY game_data metadata (avoid large payload)
                const { data, error } = await supabase
                    .from('users')
                    .select('game_data')
                    .eq('id', lineId)
                    .single();

                if (data && data.game_data) {
                    const cloudTs = data.game_data.lastSave || 0;
                    const localTs = lastSaveTimeRef.current || 0;

                    // If Cloud is effectively newer (1s buffer)
                    if (cloudTs > localTs + 1000) {
                        showMessage("🔄 偵測到新進度，自動同步中...");

                        // Trigger Full Sync by calling handleLoginSuccess again
                        // We need the full profile usually, but we can reuse info?
                        // Actually handleLoginSuccess re-fetches everything.
                        // We need to pass the profile object.
                        // Alternatively, we create a specialized sync function.
                        if (window.liff && window.liff.isLoggedIn()) {
                            window.liff.getProfile().then(profile => {
                                handleLoginSuccess(profile);
                            });
                        } else {
                            // Fallback if no LIFF profile (e.g. dev mode or weird state)
                            // Just re-run logic with current IDs
                            handleLoginSuccess({ userId: lineId, displayName: currentUser, pictureUrl: '' });
                        }
                    } else {
                        // Local is up to date
                    }
                }
            } catch (e) { console.error("Cloud check error", e); }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') {
                // Backgrounding on Mobile: Treat as Close
                handleUnload();
            } else if (document.visibilityState === 'visible') {
                checkCloudVersion();
            }
        };

        window.addEventListener('beforeunload', handleUnload);
        document.addEventListener('visibilitychange', handleVisibility);

        // Periodic Save (Every 60s)
        const intervalId = setInterval(() => {
            handleSave();
        }, 60000);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('beforeunload', handleUnload);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [lineId, isDataLoaded]);



    // Game Loop
    useEffect(() => {
        if (!lineId) return;
        const tick = setInterval(() => {
            setSheep(prev => prev.filter(s => s).map(s => {
                const updated = calculateTick(s, prev); // Pass 'prev' (all sheep) for flocking
                if (updated.status === 'dead' && s.status !== 'dead') {
                    showMessage(`🕊️ ${s.name} 不幸離世了...`);
                }
                return updated;
            }));
        }, 500); // Optimized to 500ms (2 FPS) for low power mode
        return () => clearInterval(tick);
    }, [lineId]);

    // Actions


    const updateSheep = (id, updates) => {
        setSheep(prev => {
            const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
            // Non-blocking save of the specific sheep
            const target = next.find(s => s.id === id);
            if (target) gameState.saveSheep(target);
            return next;
        });
    };

    const isAdmin = lineId === 'admin';

    const prayForSheep = (id) => {
        const today = new Date().toDateString();
        setSheep(prev => {
            const nextState = prev.map(s => {
                if (s.id !== id) return s;
                if (s.status === 'dead') {
                    const todayDate = new Date(today);
                    const lastDate = s.lastPrayedDate ? new Date(s.lastPrayedDate) : null;
                    let diffDays = -1;
                    if (lastDate) {
                        diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                    }
                    const isContinuous = diffDays === 1 || diffDays === -1;

                    // Admin Bypass: Allow unlimited resurrection progress per day if needed? 
                    // User requirement said "Unlimited Prayers", usually implies the daily limit.
                    // Let's allow Admin to spam resurrection too if they want
                    if (!isAdmin && diffDays === 0) {
                        showMessage("今天已經為這隻小羊禱告過了，請明天再來！🙏");
                        return s;
                    }

                    let newProgress = (isContinuous || isAdmin) ? (s.resurrectionProgress || 0) + 1 : 1;

                    if (newProgress >= 5) {
                        showMessage(`✨ 奇蹟發生了！${s.name} 復活了！`);
                        return {
                            ...s, status: 'healthy', health: 100, type: 'LAMB', careLevel: 0,
                            resurrectionProgress: 0, lastPrayedDate: today, prayedCount: 0
                        };
                    } else {
                        const statusMsg = (!isAdmin && diffDays > 1) ? "禱告中斷了，重新開始..." : "迫切認領禱告進行中...";
                        showMessage(`🙏 ${statusMsg} (${newProgress}/5)`);
                        return { ...s, resurrectionProgress: newProgress, lastPrayedDate: today };
                    }
                }

                let count = (s.lastPrayedDate === today) ? s.prayedCount : 0;
                if (!isAdmin && count >= 3) {
                    showMessage("這隻小羊今天已經接受過 3 次禱告了，讓牠休息一下吧！🙏");
                    return s;
                }
                const rawNewHealth = Math.min(100, s.health + 6);

                // Use Centralized Helper to update Status & Type based on new Health
                const { health, status, type } = calculateSheepState(rawNewHealth, s.status);

                const newCare = s.careLevel + 10;

                return {
                    ...s, status, health, type, careLevel: newCare,
                    lastPrayedDate: today, prayedCount: count + 1
                };
            });

            // Immediate Save
            saveToCloud({ sheep: nextState }).catch(e => console.error(e));
            return nextState;
        });
    };

    const deleteSheep = async (id) => {
        setSheep(prev => {
            const next = prev.filter(s => s.id !== id);
            saveToCloud({ sheep: next }).catch(console.error);
            return next;
        });
        if (lineId) await supabase.from('sheep').delete().eq('id', id);
    };
    const deleteMultipleSheep = async (ids) => {
        setSheep(prev => {
            const next = prev.filter(s => !ids.includes(s.id));
            saveToCloud({ sheep: next }).catch(console.error);
            return next;
        });
        if (lineId) await supabase.from('sheep').delete().in('id', ids);
    };

    const updateNickname = (name) => {
        setNickname(name);
        saveToCloud({ nickname: name }); // Pass override to ensure immediate save
    };

    const loginAsAdmin = () => {
        handleLoginSuccess({
            userId: 'admin',
            displayName: 'Administrator',
            pictureUrl: null
        });
    };

    return (
        <GameContext.Provider value={{
            currentUser, nickname, setNickname, lineId, isAdmin,
            isLoading, // Exposed for App.jsx loading screen
            sheep, skins, inventory, message, weather, // skins exposed
            location, updateUserLocation, isInClient, // Exposed
            adoptSheep, updateSheep, createSkin, toggleSkinPublic, // createSkin exposed
            loginWithLine, loginAsAdmin, logout, // Exposed
            prayForSheep, deleteSheep, deleteMultipleSheep,
            saveToCloud, forceLoadFromCloud, // Exposed
            notificationEnabled, toggleNotification, // Exposed
            updateNickname, // Exposed
            settings, updateSetting, // Exposed Settings
            setWeather // Exposed for Admin Control
        }}>
            {children}
        </GameContext.Provider>
    );
};
