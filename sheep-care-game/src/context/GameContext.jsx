
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SHEEP_TYPES } from '../data/sheepData';
import { calculateTick, generateVisuals, getSheepMessage, calculateSheepState, calculateOfflineDecay, isSleeping, getAwakeningProgress, SLEEPING_STATUS } from '../utils/gameLogic';
import { gameState } from '../services/gameState';
import { tagService } from '../services/tagService';
import { supabase } from '../services/supabaseClient';

const defaultGameContext = {
    currentUser: null,
    nickname: null,
    userAvatarUrl: null,
    lineId: null,
    isLoading: true,
    sheep: [],
    inventory: [],
    message: null,
    weather: { type: 'sunny', isDay: true, temp: 25 },
    settings: { maxVisibleSheep: 15, notify: false, pinnedSheepIds: [], hiddenFilters: [] },
    notificationEnabled: false,
    toggleNotification: () => { },
    isAdmin: false,
    introWatched: false,
    showIntroVideo: false,
    markIntroWatched: () => { },
    tags: [],
    tagAssignmentsBySheep: {},
    loadTags: () => { },
    createTag: () => null,
    updateTag: () => null,
    deleteTag: () => false,
    setSheepTags: () => false,
    focusedSheepId: null,
    findSheep: () => { },
    clearFocus: () => { },
};

const GameContext = createContext(defaultGameContext);

export const useGame = () => {
    const ctx = useContext(GameContext);
    return ctx ?? defaultGameContext;
};

// Supabase client is managed in services/supabaseClient

export const GameProvider = ({ children }) => {
    // Use env var for LIFF ID, fallback to the known ID if missing
    const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID || "2008919632-15fCJTqb";

    // --- Session Init (SessionStorage for Auto-Logout on Close) ---
    const [currentUser, setCurrentUser] = useState(null); // Line Name
    const [nickname, setNickname] = useState(null); // User Nickname
    const [userAvatarUrl, setUserAvatarUrl] = useState(null); // LINE profile picture (login-time)
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

    const [weather, setWeather] = useState({ type: 'sunny', isDay: true, temp: 25 });
    const [introWatched, setIntroWatched] = useState(true); // Default true to avoid flash on init, set to false if confirmed new
    const [showIntroVideo, setShowIntroVideo] = useState(false);

    const [tags, setTags] = useState([]);
    const [tagAssignmentsBySheep, setTagAssignmentsBySheep] = useState({});

    // Focusing / Find Logic (locate sheep on canvas)
    const [focusedSheepId, setFocusedSheepId] = useState(null);

    const findSheep = (id) => {
        setFocusedSheepId(id);

        // Visual Response
        setSheep(prev => prev.map(s => {
            if (s.id === id) {
                return { ...s, message: "咩～！" };
            }
            return s;
        }));

        // Clear message after delay
        setTimeout(() => {
            setSheep(prev => prev.map(s => {
                if (s.id === id && s.message === "咩～！") {
                    return { ...s, message: null };
                }
                return s;
            }));
        }, 3000);
    };

    const clearFocus = () => {
        setFocusedSheepId(null);
    };


    // --- SETTINGS (Device Specific) ---
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('sheep_game_settings');
            // Default: maxVisibleSheep 15, notify false, pinnedSheepIds []
            const defaults = { maxVisibleSheep: 15, notify: false, pinnedSheepIds: [], hiddenFilters: [] };
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return { maxVisibleSheep: 15, notify: false, pinnedSheepIds: [], hiddenFilters: [] };
        }
    });

    const updateSetting = (key, value) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            localStorage.setItem('sheep_game_settings', JSON.stringify(next));

            // Immediate Auto-Save on Setting Change
            // Note: We need to use 'next' because state update is async
            // But we can't call saveToCloud directly gracefully here without being inside the component flow or using ref.
            // Using the useEffect (Sync State Refs) + Auto-Save loop is safer, OR explicit call.
            // Let's explicit call via helper if we solve the circular dependency. 
            // Actually, we'll rely on the Ref-Updated Save.
            return next;
        });
    };

    // --- Sync State Refs ---
    const lastSaveTimeRef = React.useRef(0); // Tracks the timestamp of current data
    const lastSyncCheckRef = React.useRef(0); // For debouncing visibility checks

    // ... (Existing useEffects)





    // --- LIFF & Login Logic ---
    // ...
    const handleLoginSuccess = async (profile) => {
        setIsLoading(true);
        const { userId, displayName, pictureUrl } = profile;
        setLineId(userId);
        setCurrentUser(displayName);
        setUserAvatarUrl(pictureUrl && String(pictureUrl).trim() ? pictureUrl : null);
        showMessage(`設定羊群中... (Hi, ${displayName})`);

        try {
            // New GameState Logic - pass LINE profile for persistence
            const data = await gameState.loadGame(userId, { displayName, pictureUrl });

            if (data && data.user) {
                // Apply loaded data
                const { user, sheep: loadedSheep } = data;

                setSheep(loadedSheep);
                // Use nickname from DB; fallback to name or LINE displayName
                const effectiveNickname = user.nickname?.trim() || user.name?.trim() || displayName;
                setNickname(effectiveNickname);

                // Restore avatar from DB if available (persists across sessions)
                setUserAvatarUrl(user.avatar?.trim() || (pictureUrl && String(pictureUrl).trim() ? pictureUrl : null));

                // Load Game Data (Inventory, Settings)
                const gameData = user.game_data || {};
                setInventory(gameData.inventory || []);
                // Update Settings from Cloud (Merge with local default structure)
                // Update Settings from Cloud (Merge with local default structure)
                if (gameData.settings) {
                    setSettings(prev => ({ ...prev, ...gameData.settings }));
                }

                // Intro Video Logic
                // Only show for BRAND NEW users (Registration session)
                // Existing users rely on Manual to see it if they want.
                if (data.isNewUser) {
                    setShowIntroVideo(true);
                } else {
                    // Start introWatched as true for existing users so they don't see it
                    setIntroWatched(true);
                }

                setIsDataLoaded(true);
                const [loadedTags, loadedAssignments] = await Promise.all([
                    tagService.loadTags(userId),
                    tagService.loadTagAssignments(userId)
                ]);
                setTags(loadedTags);
                setTagAssignmentsBySheep(loadedAssignments);
                showMessage(`歡迎回來，${effectiveNickname}! 👋`);
            } else {
                // Fallback for edge cases
                const [loadedTags, loadedAssignments] = await Promise.all([
                    tagService.loadTags(userId),
                    tagService.loadTagAssignments(userId)
                ]);
                setTags(loadedTags);
                setTagAssignmentsBySheep(loadedAssignments);
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
            // notificationEnabled is removed. We rely on settings object now.
            const currentNickname = overrides.nickname !== undefined ? overrides.nickname : nickname;
            const currentIntroWatched = overrides.introWatched !== undefined ? overrides.introWatched : introWatched;

            // Construct gameData object
            // If overrides.settings exists, use it as the authoritative source.
            // Otherwise use Ref.
            const rawSettings = overrides.settings || stateRef.current.settings;

            // HEAL ON SAVE: Force merge with defaults to ensure keys like maxVisibleSheep are never lost.
            // Even if state was partial, this restores structure.
            const currentSettings = {
                maxVisibleSheep: 20, // Default Safety Net
                notify: false,
                hiddenFilters: [],
                ...rawSettings
            };

            const gameData = {
                inventory: currentInventory,
                settings: currentSettings,
                introWatched: currentIntroWatched,
                lastSave: Date.now()
            };

            // Parallel execute for faster close handling

            // Debug: Log the exact data being sent
            console.log("Saving to Cloud:", { userId: lineId, gameData, currentSheep });

            // Helper for Local ISO String (Inline)
            const getLocalISOString = () => {
                const date = new Date();
                const tzo = -date.getTimezoneOffset();
                const dif = tzo >= 0 ? '+' : '-';
                const pad = (num) => (num < 10 ? '0' : '') + num;
                return date.getFullYear() +
                    '-' + pad(date.getMonth() + 1) +
                    '-' + pad(date.getDate()) +
                    'T' + pad(date.getHours()) +
                    ':' + pad(date.getMinutes()) +
                    ':' + pad(date.getSeconds()) +
                    '.' + String((date.getMilliseconds() / 1000).toFixed(3)).slice(2, 5) +
                    dif + pad(Math.floor(Math.abs(tzo) / 60)) + ':' + pad(Math.abs(tzo) % 60);
            };

            await Promise.all([
                gameState.saveAllSheep(currentSheep),
                gameState.saveUserProfile(lineId, {
                    game_data: gameData,
                    nickname: currentNickname,
                    last_login: getLocalISOString(),
                    name: currentUser && String(currentUser).trim() ? currentUser : undefined,
                    avatar: userAvatarUrl && String(userAvatarUrl).trim() ? userAvatarUrl : undefined
                })
            ]);

            lastSaveTimeRef.current = Date.now();
        } catch (e) { console.error("Auto-save failed", e); }
    };

    // ...

    // Adopt Sheep (Updated)
    const adoptSheep = async (data = {}) => {
        const { name = '小羊', spiritualMaturity = '', visual, skinId } = data; // visual from modal

        const safeVisual = {
            ...generateVisuals(), // Fallback randoms
            ...(visual || {})     // Overrides from modal
        };

        // Use Helper to determine initial state from raw health (60)
        const { health: initHealth, status: initStatus, type: initType } = calculateSheepState(60, 'healthy');

        // Prepare Object for DB
        const newSheepProto = {
            name, type: initType,
            spiritualMaturity,
            careLevel: 0, health: initHealth, status: initStatus,
            state: 'idle', note: '', prayedCount: 0, lastPrayedDate: null,
            resurrectionProgress: 0, awakeningProgress: 0,
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

    // Auto-Save Settings Logic (Debounced)
    useEffect(() => {
        if (!isDataLoaded) return; // Don't save defaults over cloud data on boot

        const timer = setTimeout(() => {
            // console.log("Auto-saving settings change...", settings);
            saveToCloud(); // Uses Ref, which is synced by the other effect
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [settings, isDataLoaded]);

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



    const toggleNotification = () => {
        const newState = !settings.notify;
        updateSetting('notify', newState);
        showMessage(newState ? "🔔 牧羊提醒已開啟" : "🔕 牧羊提醒已關閉");
    };

    const togglePin = (sheepId) => {
        setSettings(prev => {
            const currentPinned = prev.pinnedSheepIds || [];
            let nextPinned;
            if (currentPinned.includes(sheepId)) {
                nextPinned = currentPinned.filter(id => id !== sheepId);
            } else {
                nextPinned = [...currentPinned, sheepId];
            }
            const newSettings = { ...prev, pinnedSheepIds: nextPinned };

            // Trigger save
            localStorage.setItem('sheep_game_settings', JSON.stringify(newSettings));
            // Trigger Cloud Save (Debounced is fine)
            // Ideally we should use saveToCloud here too for consistency if possible,
            // but for now local invalidation + next sync is okay, or just force it.
            // Let's use saveToCloud({ settings: newSettings }) pattern if supported?
            // Actually saveToCloud args usage is a bit mixed, let's Stick to setSettings + explicit logic or just trust next save.
            // But user wants persistence.
            // Let's just do:
            saveToCloud({ settings: newSettings });
            return newSettings;
        });
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
        // Localhost Bypass (Dev Only)
        if (import.meta.env.DEV && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
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
        setUserAvatarUrl(null);
        if (lineId) await clearData(lineId); // Clear IDB
        setLineId(null);
        setSheep([]); setInventory([]);
        setTags([]); setTagAssignmentsBySheep({});
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

        if (loadedData.settings) {
            setSettings(prev => ({ ...prev, ...loadedData.settings }));
        }

        if (loadedData.introWatched) {
            setIntroWatched(true);
        }

        lastSaveTimeRef.current = lastSave; // Update Ref with loaded time

        // Cache Locally
        if (targetUser) {
            localStorage.setItem(`sheep_game_data_${targetUser}`, JSON.stringify({
                sheep: decaySheep,
                inventory: loadedData.inventory || [],
                settings: loadedData.settings || { notify: false }, // Save setting
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

    // Ref Sync: Keep Ref up to date for saveToCloud and handleUnload (async access)
    useEffect(() => {
        stateRef.current = { sheep, inventory, settings, nickname, currentUser, userAvatarUrl, introWatched, focusedSheepId };
        lastSaveTimeRef.current = Date.now(); // Optional: track local changes? No, unsafe.
    }, [sheep, inventory, settings, nickname, currentUser, userAvatarUrl, introWatched]);

    useEffect(() => {
        // Setup only
    }, []);

    // Auto-Save Logic (Visibility Change + Periodic)
    useEffect(() => {
        if (!lineId || !isDataLoaded) return;

        const handleUnload = () => {
            // Reliable Save on Close using KeepAlive Fetch
            const currentSheep = stateRef.current.sheep;
            const profileRef = stateRef.current;
            const currentProfile = {
                game_data: {
                    inventory: profileRef.inventory,
                    settings: profileRef.settings,
                    introWatched: profileRef.introWatched,
                    lastSave: Date.now()
                },
                last_login: new Date().toISOString(),
                nickname: profileRef.nickname,
                name: profileRef.currentUser && String(profileRef.currentUser).trim() ? profileRef.currentUser : undefined,
                avatar: profileRef.userAvatarUrl && String(profileRef.userAvatarUrl).trim() ? profileRef.userAvatarUrl : undefined
            };

            // Using KeepAlive fetch for reliable save
            gameState.saveGameSync(lineId, currentSheep, currentProfile);
        };

        const handleSave = () => {
            // Use Ref for latest state
            saveToCloud({
                sheep: stateRef.current.sheep,
                inventory: stateRef.current.inventory,
                settings: stateRef.current.settings,
                introWatched: stateRef.current.introWatched
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
                if (isSleeping(updated) && !isSleeping(s)) {
                    showMessage(`🕊️ ${s.name} 進入沉睡了...`);
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

    const updateMultipleSheep = (ids, changes) => {
        setSheep(prev => {
            const next = prev.map(s => ids.includes(s.id) ? { ...s, ...changes } : s);
            saveToCloud({ sheep: next }).catch(console.error);
            return next;
        });
    };

    const isAdmin = lineId === 'admin';

    const prayForSheep = (id) => {
        const today = new Date().toDateString();
        setSheep(prev => {
            const nextState = prev.map(s => {
                if (s.id !== id) return s;
                if (isSleeping(s)) {
                    const todayDate = new Date(today);
                    const lastDate = s.lastPrayedDate ? new Date(s.lastPrayedDate) : null;
                    let diffDays = -1;
                    if (lastDate) {
                        diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                    }
                    const isContinuous = diffDays === 1 || diffDays === -1;

                    // Admin Bypass: Allow unlimited awakening progress per day if needed
                    if (!isAdmin && diffDays === 0) {
                        showMessage("今天已經為這隻小羊禱告過了，請明天再來！🙏");
                        return s;
                    }

                    const currentProgress = getAwakeningProgress(s);
                    let newProgress = (isContinuous || isAdmin) ? currentProgress + 1 : 1;

                    if (newProgress >= 5) {
                        showMessage(`✨ 奇蹟發生了！${s.name} 甦醒了！`);
                        return {
                            ...s, status: 'healthy', health: 40, type: 'LAMB', careLevel: 0,
                            resurrectionProgress: 0, awakeningProgress: 0, lastPrayedDate: today, prayedCount: 0
                        };
                    } else {
                        const statusMsg = (!isAdmin && diffDays > 1) ? "禱告中斷了，重新開始..." : "喚醒禱告進行中...";
                        showMessage(`🙏 ${statusMsg} (${newProgress}/5)`);
                        return { ...s, resurrectionProgress: newProgress, awakeningProgress: newProgress, lastPrayedDate: today };
                    }
                }

                let count = (s.lastPrayedDate === today) ? s.prayedCount : 0;
                if (!isAdmin && count >= 3) {
                    showMessage("這隻小羊今天已經接受過 3 次禱告了，讓他休息一下吧！🙏");
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

    const loadTags = async () => {
        if (!lineId) return;
        const [loadedTags, loadedAssignments] = await Promise.all([
            tagService.loadTags(lineId),
            tagService.loadTagAssignments(lineId)
        ]);
        setTags(loadedTags);
        setTagAssignmentsBySheep(loadedAssignments);
    };

    const createTag = async (opts) => {
        if (!lineId) return null;
        const created = await tagService.createTag(lineId, opts);
        if (created) await loadTags();
        return created;
    };

    const updateTag = async (tagId, opts) => {
        const updated = await tagService.updateTag(tagId, opts);
        if (updated) await loadTags();
        return updated;
    };

    const deleteTag = async (tagId) => {
        const ok = await tagService.deleteTag(tagId);
        if (ok) await loadTags();
        return ok;
    };

    const setSheepTags = async (sheepId, tagIds) => {
        if (!lineId) return false;
        const ok = await tagService.setSheepTags(sheepId, lineId, tagIds);
        if (ok) await loadTags();
        return ok;
    };

    const fetchWeeklySchedules = async () => {
        if (!lineId) return [];
        try {
            const { data, error } = await supabase
                .from('spiritual_plans')
                .select('*, sheep:sheep_id(name, visual)')
                .eq('user_id', lineId)
                .order('scheduled_time', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching weekly schedules:', error);
            return [];
        }
    };

    return (
        <GameContext.Provider value={{
            currentUser, nickname, setNickname, userAvatarUrl, lineId, isAdmin,
            isLoading, // Exposed for App.jsx loading screen
            sheep, inventory, message, weather,
            location, updateUserLocation, isInClient, // Exposed
            adoptSheep, updateSheep, updateMultipleSheep, togglePin,
            loginWithLine, loginAsAdmin, logout, // Exposed
            prayForSheep, deleteSheep, deleteMultipleSheep,
            saveToCloud, forceLoadFromCloud, // Exposed
            notificationEnabled: settings.notify, toggleNotification, // Exposed (Mapped)
            updateNickname, // Exposed
            showIntroVideo,
            markIntroWatched: () => {
                setIntroWatched(true);
                setShowIntroVideo(false);
                saveToCloud({ introWatched: true });
            },
            settings, // expose settings
            updateSetting, // expose updateSetting
            setWeather, // Exposed for Admin Control
            tags,
            tagAssignmentsBySheep,
            loadTags,
            createTag,
            updateTag,
            deleteTag,
            setSheepTags,
            fetchWeeklySchedules, // Exposed
            focusedSheepId,
            findSheep,
            clearFocus
        }}>
            {children}
        </GameContext.Provider>
    );
};
