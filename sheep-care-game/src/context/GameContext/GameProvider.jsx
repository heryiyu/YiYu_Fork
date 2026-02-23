import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameActionsContext, GameStateContext, UserAuthContext } from './contexts';
import { SHEEP_TYPES } from '../../data/sheepData';
import {
    calculateTick, generateVisuals, getSheepMessage, calculateSheepState,
    calculateOfflineDecay, isSleeping, getAwakeningProgress
} from '../../utils/gameLogic';
import { gameState } from '../../services/gameState';
import { tagService } from '../../services/tagService';
import { supabase, supabaseUrl } from '../../services/supabaseClient';
import { sheepTickerstore } from '../../utils/sheepTickerStore';
import { skinManagerService } from '../../services/skinManagerService';

// Helper for Local ISO String
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

export const GameProvider = ({ children }) => {
    const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID || "2008919632-15fCJTqb";

    // --- 1. Core State Definition ---
    const [currentUser, setCurrentUser] = useState(null);
    const [nickname, setNickname] = useState(null);
    const [userAvatarUrl, setUserAvatarUrl] = useState(null);
    const [lineId, setLineId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isInClient, setIsInClient] = useState(false);
    const [isAuthRestored, setIsAuthRestored] = useState(false);
    const [loginStatus, setLoginStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, TIMEOUT, ERROR

    const [sheep, setSheep] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [message, setMessage] = useState(null);
    const [weather, setWeather] = useState({ type: 'sunny', isDay: true, temp: 25 });
    const [introWatched, setIntroWatched] = useState(true);
    const [showIntroVideo, setShowIntroVideo] = useState(false);
    const [tags, setTags] = useState([]);
    const [tagAssignmentsBySheep, setTagAssignmentsBySheep] = useState({});
    const [lastScheduleUpdate, setLastScheduleUpdate] = useState(0);
    const [focusedSheepId, setFocusedSheepId] = useState(null);

    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('sheep_game_settings');
            const defaults = { maxVisibleSheep: 15, notify: false, pinnedSheepIds: [], hiddenFilters: [], sheepListViewMode: 'card' };
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return { maxVisibleSheep: 15, notify: false, pinnedSheepIds: [], hiddenFilters: [], sheepListViewMode: 'card' };
        }
    });

    const [location, setLocation] = useState(() => {
        const saved = localStorage.getItem('sheep_user_location');
        return saved ? JSON.parse(saved) : { name: 'Taipei', lat: 25.0330, lon: 121.5654 };
    });

    // --- 2. Context Sync Refs (The key to performance - stable access) ---
    const lastSaveTimeRef = useRef(0);
    const lastSyncCheckRef = useRef(0);
    const stateRef = useRef({
        sheep: [], inventory: [], settings: {}, nickname: '',
        currentUser: null, userAvatarUrl: null, introWatched: true,
        focusedSheepId: null, userId: null, lineId: null, isDataLoaded: false
    });

    // Keep ref in sync
    useEffect(() => {
        stateRef.current = {
            sheep, inventory, settings, nickname, currentUser,
            userAvatarUrl, introWatched, focusedSheepId, userId,
            lineId, isDataLoaded
        };
    }, [sheep, inventory, settings, nickname, currentUser, userAvatarUrl, introWatched, focusedSheepId, userId, lineId, isDataLoaded]);

    // --- 3. Base stable helpers ---
    const showMessage = useCallback((msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 3000);
    }, []);

    const setGlobalMessage = useCallback((msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 5000);
    }, []);

    const notifyScheduleUpdate = useCallback(() => setLastScheduleUpdate(Date.now()), []);

    // --- 4. Game Logic Sync Loop (Every 60s instead of 1s) ---
    useEffect(() => {
        if (!lineId) return;

        // Sync the ticker store whenever the logical 'sheep' array completely changes
        // (like on initial load or force load)
        sheepTickerstore.syncWithLogicalState(sheep);

        // Slow logical tick to check for sleepers or large decay asynchronously
        const tick = setInterval(() => {
            // Get latest visual coordinates from store before doing logical checks
            const latestSheepState = sheepTickerstore.getAllLatestState();

            setSheep(prev => {
                let hasChanges = false;
                const next = prev.map(s => {
                    // Update bounds from ticker
                    const latest = latestSheepState.find(ls => ls.id === s.id);
                    const merged = latest ? { ...s, x: latest.x, y: latest.y, angle: latest.angle, direction: latest.direction, message: latest.message, messageTimer: latest.messageTimer, state: latest.state } : s;

                    // Note: Health/Decay is mostly handled offline or on action now, 
                    // but we can enforce sleeping status here slowly
                    if (merged.health <= 0 && !isSleeping(merged)) {
                        merged.status = 'sleeping'; // enforce
                        showMessage(`🕊️ ${merged.name} 進入沉睡了...`);
                        hasChanges = true;
                    }

                    // Only flag change if major logical state differs to avoid cascading renders
                    if (merged.status !== s.status || merged.health !== s.health || merged.type !== s.type) {
                        hasChanges = true;
                    }
                    return merged;
                });

                // If nothing major changed, just return previous array reference to skip React re-render!
                if (!hasChanges) {
                    // We still want to lazily update coordinates in the background, 
                    // so we periodically update it, maybe every 60s
                    return next;
                }
                return next;
            });
        }, 60000); // 60 seconds

        return () => {
            clearInterval(tick);
            sheepTickerstore.stop();
        };
    }, [lineId, sheep, showMessage]);

    // Weather loop
    useEffect(() => {
        const fetchWeather = async () => {
            const importWeather = await import('../../utils/weatherService');
            const w = await importWeather.getWeather(location.lat, location.lon);
            setWeather(w);
            setGlobalMessage(`當地天氣 (${location.name}): ${w.type === 'snow' ? '下雪中 ❄️' : (w.type === 'rain' ? '下雨中 🌧️' : (w.type === 'cloudy' ? '多雲 ☁️' : '晴朗 ☀️'))} (${w.temp}°C)`);
        };
        fetchWeather();
        const interval = setInterval(fetchWeather, 3600000);
        return () => clearInterval(interval);
    }, [location, setGlobalMessage]);

    // --- 5. Auth & Login Functions ---
    const handleLoginSuccess = useCallback(async (profile) => {
        setIsLoading(true);
        setLoginStatus('LOADING');
        const { userId: lineIdVal, displayName, pictureUrl } = profile;
        setLineId(lineIdVal);

        // 1. Setup Timeout protection (12s)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Login Timeout")), 12000)
        );

        try {
            // 2. Parallel initialization
            const shadowEmail = `${lineIdVal}@line.shadow`.toLowerCase();
            const urlSuffix = (supabaseUrl || '').split('.').shift()?.slice(-4) || 'fixed';
            const shadowPass = `p@ss_${lineIdVal}_${urlSuffix}`.toLowerCase();

            // 2. Perform Shadow Auth SEQUENTIALLY first to ensure RLS permissions
            const authTask = (async () => {
                try {
                    // --- Precise Identity Recognition Strategy ---
                    // 1. Pre-check: Does this line_id exist in our data records?
                    const { data: existingUser } = await supabase
                        .from('users')
                        .select('id')
                        .eq('line_id', lineIdVal)
                        .single();

                    const isOldFriend = !!existingUser;
                    console.log(`[Auth] Identity: ${isOldFriend ? 'Existing User' : 'New User'}. Suffix: ${urlSuffix}`);

                    // Attempt 1: New Standard
                    let { error: authError } = await supabase.auth.signInWithPassword({
                        email: shadowEmail,
                        password: shadowPass
                    });

                    // Attempt 2: Compatibility救援 (Only if Attempt 1 fails)
                    if (authError && (authError.message.includes('Invalid') || authError.status === 400)) {
                        console.log("[Auth] Standard pass failed, trying compatibility mode...");
                        const legacyPasses = [
                            `p@ss_${lineIdVal}_${urlSuffix}`,
                            `p@ss_${lineIdVal}_fixed`.toLowerCase(),
                        ];

                        for (const legacyPass of legacyPasses) {
                            if (legacyPass === shadowPass) continue;
                            const { error: retryError } = await supabase.auth.signInWithPassword({
                                email: shadowEmail,
                                password: legacyPass
                            });
                            if (!retryError) {
                                console.log("[Auth] Legacy login success! Auto-upgrading password...");
                                await supabase.auth.updateUser({ password: shadowPass });
                                authError = null;
                                break;
                            }
                        }
                    }

                    // Attempt 3: Strict Branching
                    if (authError && (authError.message.includes('Invalid') || authError.status === 400)) {
                        if (isOldFriend) {
                            // CRITICAL PROTECTION: If you are an old friend, but all passwords failed,
                            // WE DO NOT SIGN UP. We block entry to protect your current data.
                            console.error("[Auth] SECURITY ALERT: Password mismatch for existing user. Blocking entry to prevent data corruption.");
                            throw new Error("身分驗證失敗：舊帳號密碼不符。請聯繫管理員或確認部署環境。");
                        } else {
                            // Only new users get to sign up
                            console.log("[Auth] New user detected. Performing secure signup...");
                            const { error: signUpError } = await supabase.auth.signUp({
                                email: shadowEmail, password: shadowPass,
                                options: { data: { display_name: displayName } }
                            });

                            if (signUpError) {
                                console.error("[Auth] Signup failed:", signUpError.message);
                                throw signUpError;
                            } else {
                                const { error: finalSignInError } = await supabase.auth.signInWithPassword({
                                    email: shadowEmail, password: shadowPass
                                });
                                if (!finalSignInError) authError = null;
                            }
                        }
                    }

                    if (authError) throw authError;
                    console.log("[Auth] Identity verified successfully.");
                    return true;
                } catch (e) {
                    console.error("[Auth] Verification Error:", e.message);
                    throw e;
                }
            })();

            // Wait for authentication to finish (protected by timeout)
            const authResult = await Promise.race([authTask, timeoutPromise]);

            // 3. ONLY AFTER auth is successful, load Game Data and Tags in PARALLEL
            const [gameDataParams, manifestData] = await Promise.race([
                Promise.all([
                    // Strategy A: Extreme performance RPC call (Batch user, sheep, tags)
                    gameState.loadGameDataRPC(lineIdVal, { displayName, pictureUrl }),
                    // Strategy B: Cached skin manifest load (Near instant if cached)
                    skinManagerService.loadManifest()
                ]),
                timeoutPromise
            ]);

            // 4. Process Results
            setCurrentUser(displayName);
            setUserAvatarUrl(pictureUrl && String(pictureUrl).trim() ? pictureUrl : null);

            if (gameDataParams && gameDataParams.user) {
                const { user, sheep: loadedSheep, tags, assignments } = gameDataParams;
                setSheep(loadedSheep);
                sheepTickerstore.syncWithLogicalState(loadedSheep);
                setUserId(user.id);
                const effectiveNickname = user.nickname?.trim() || user.name?.trim() || displayName;
                setNickname(effectiveNickname);
                setUserAvatarUrl(user.avatar?.trim() || (pictureUrl && String(pictureUrl).trim() ? pictureUrl : null));

                if (user.game_data) {
                    setInventory(user.game_data.inventory || []);
                    if (user.game_data.settings) {
                        setSettings(prev => ({ ...prev, ...user.game_data.settings }));
                    }
                }

                setTags(tags || []);
                setTagAssignmentsBySheep(assignments || {});
                setIsDataLoaded(true);
                setLoginStatus('SUCCESS');
                showMessage(`歡迎回來，${effectiveNickname}! 👋`);
            } else {
                // Fallback for missing user data (Should be rare with RPC)
                setIsDataLoaded(true);
                setLoginStatus('SUCCESS');
            }
        } catch (e) {
            console.error("Login Initialization Error:", e);
            if (e.message === "Login Timeout") {
                setLoginStatus('TIMEOUT');
                showMessage("⏳ 載入超時，請檢查網路連線");
            } else {
                setLoginStatus('ERROR');
                showMessage("⚠️ 同步失敗，請嘗試重新整理");
            }
            // Do NOT setIsDataLoaded(true) here - we want to block the game
        } finally {
            setIsLoading(false);
        }
    }, [showMessage]);

    const loginWithLine = useCallback(() => {
        if (import.meta.env.DEV && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            const mockProfile = { userId: 'admin', displayName: 'Admin', pictureUrl: '' };
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
    }, [handleLoginSuccess, showMessage]);

    const loginAsAdmin = useCallback(() => {
        handleLoginSuccess({
            userId: 'admin',
            displayName: 'Administrator',
            pictureUrl: null
        });
    }, [handleLoginSuccess]);

    const logout = useCallback(async () => {
        // Use ref for cloud save to ensure latest data is used
        const currentLineId = stateRef.current.lineId;
        const currentDataLoaded = stateRef.current.isDataLoaded;
        if (currentLineId && currentDataLoaded) {
            // Manual call to saveToCloud logic or a ref-based saver
            // For simplicity, let's just trigger current implementation
        }

        if (window.liff && window.liff.isLoggedIn()) {
            window.liff.logout();
        }
        setCurrentUser(null);
        setNickname(null);
        setUserAvatarUrl(null);
        if (lineId) await gameState.clearData?.(lineId);
        setLineId(null);
        setSheep([]); setInventory([]);
        sheepTickerstore.syncWithLogicalState([]);
        setTags([]); setTagAssignmentsBySheep({});
        setIsDataLoaded(false);
        window.location.reload();
    }, [lineId]);

    // --- 6. Data Persistence Functions ---
    const saveToCloud = useCallback(async (overrides = {}) => {
        const { lineId: cLineId, isDataLoaded: cDataLoaded, isLoading: cLoading } = stateRef.current;
        if (!cLineId || !cDataLoaded || cLoading) return;

        try {
            // Use sheep from TickerStore if we have it, so we save the latest visual positions
            const latestVisualSheep = sheepTickerstore.getAllLatestState();
            let currentSheep = stateRef.current.sheep;

            if (latestVisualSheep && latestVisualSheep.length > 0) {
                currentSheep = currentSheep.map(s => {
                    const visual = latestVisualSheep.find(v => v.id === s.id);
                    return visual ? { ...s, ...visual } : s;
                });
            }
            if (overrides.sheep) currentSheep = overrides.sheep;

            const currentInventory = overrides.inventory || stateRef.current.inventory;
            const currentNickname = overrides.nickname !== undefined ? overrides.nickname : stateRef.current.nickname;
            const currentIntroWatched = overrides.introWatched !== undefined ? overrides.introWatched : stateRef.current.introWatched;
            const rawSettings = overrides.settings || stateRef.current.settings;

            const currentSettings = {
                maxVisibleSheep: 15,
                notify: false,
                hiddenFilters: [],
                stampLabels: {},
                sheepListViewMode: 'card',
                isSheepListExpanded: false,
                prayedCount: 0,
                ...rawSettings
            };

            const gameData = {
                inventory: currentInventory,
                settings: currentSettings,
                introWatched: currentIntroWatched,
                lastSave: Date.now()
            };

            await Promise.all([
                gameState.saveAllSheep(currentSheep),
                gameState.saveUserProfile(cLineId, {
                    game_data: gameData,
                    nickname: currentNickname,
                    last_login: getLocalISOString(),
                    name: stateRef.current.currentUser || undefined,
                    avatar: stateRef.current.userAvatarUrl || undefined
                })
            ]);

            lastSaveTimeRef.current = Date.now();
        } catch (e) { console.error("Auto-save failed", e); }
    }, []);

    const forceLoadFromCloud = useCallback(async () => {
        const cLineId = stateRef.current.lineId;
        if (!cLineId) {
            showMessage("⚠️ 無法連線：使用者未登入");
            return;
        }
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('users').select('*').eq('line_id', cLineId).single();
            if (error) throw error;
            if (data && data.game_data) {
                // Decay logic logic...
                const loadedData = data.game_data;
                const now = Date.now();
                const lastSave = loadedData.lastSave || now;
                const diffHours = (now - lastSave) / (1000 * 60 * 60);

                const seenIds = new Set();
                const decaySheep = (loadedData.sheep || [])
                    .map(s => {
                        if (seenIds.has(s.id)) {
                            const newId = `${s.id}_${Math.random().toString(36).substr(2, 5)}`;
                            return { ...s, id: newId };
                        }
                        seenIds.add(s.id);
                        return s;
                    })
                    .map(s => calculateOfflineDecay(s, diffHours));

                setSheep(decaySheep);
                setInventory(loadedData.inventory || []);
                if (loadedData.settings) setSettings(prev => ({ ...prev, ...loadedData.settings }));
                if (loadedData.introWatched) setIntroWatched(true);

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
    }, [showMessage]);

    // --- 7. Sheep & Game Actions ---
    const updateSheep = useCallback((id, updates) => {
        setSheep(prev => {
            const next = prev.map(s => s.id === id ? { ...s, ...updates } : s);
            const target = next.find(s => s.id === id);
            if (target) gameState.saveSheep(target);
            return next;
        });
    }, []);

    const updateMultipleSheep = useCallback((ids, changes) => {
        setSheep(prev => {
            const next = prev.map(s => ids.includes(s.id) ? { ...s, ...changes } : s);
            saveToCloud({ sheep: next }).catch(console.error);
            return next;
        });
    }, [saveToCloud]);

    const adoptSheep = useCallback(async (data = {}) => {
        const cUserId = stateRef.current.userId;
        if (!cUserId) return;
        const { name = '小羊', spiritualMaturity = '', visual, skinId } = data;
        const safeVisual = { ...generateVisuals(), ...(visual || {}) };
        const { health: initHealth, status: initStatus, type: initType } = calculateSheepState(60, 'healthy');

        const newSheepProto = {
            name, type: initType, spiritualMaturity, careLevel: 0, health: initHealth, status: initStatus,
            state: 'idle', note: '', prayedCount: 0, lastPrayedDate: null, resurrectionProgress: 0, awakeningProgress: 0,
            visual: safeVisual, skinId: skinId || null, x: Math.random() * 60 + 20, y: Math.random() * 60 + 20,
            angle: Math.random() * Math.PI * 2, direction: 1, user_id: cUserId
        };

        try {
            const created = await gameState.createSheep(newSheepProto);
            if (created) {
                const newSheepWithId = { ...newSheepProto, id: created.id };
                setSheep(prev => {
                    const next = [...prev, newSheepWithId];
                    sheepTickerstore.syncWithLogicalState(next);
                    return next;
                });
            }
        } catch (e) { console.error("Adopt failed", e); }
    }, []);

    const prayForSheep = useCallback((id) => {
        const today = new Date().toDateString();
        const cIsAdmin = stateRef.current.lineId === 'admin';

        setSheep(prev => {
            const nextState = prev.map(s => {
                if (s.id !== id) return s;
                if (isSleeping(s)) {
                    const todayDate = new Date(today);
                    const lastDate = s.lastPrayedDate ? new Date(s.lastPrayedDate) : null;
                    let diffDays = lastDate ? Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) : -1;
                    const isContinuous = diffDays === 1 || diffDays === -1;

                    if (!cIsAdmin && diffDays === 0) {
                        showMessage("今天已經為這隻小羊禱告過了，請明天再來！🙏");
                        return s;
                    }

                    const currentProgress = getAwakeningProgress(s);
                    let newProgress = (isContinuous || cIsAdmin) ? currentProgress + 1 : 1;

                    if (newProgress >= 5) {
                        showMessage(`✨ 奇蹟發生了！${s.name} 甦醒了！`);
                        return {
                            ...s, status: 'healthy', health: 40, type: 'LAMB', careLevel: 0,
                            resurrectionProgress: 0, awakeningProgress: 0, lastPrayedDate: today, prayedCount: 0
                        };
                    } else {
                        showMessage(`🙏 ${(!cIsAdmin && diffDays > 1) ? "禱告中斷了，重新開始..." : "喚醒禱告進行中..."} (${newProgress}/5)`);
                        return { ...s, resurrectionProgress: newProgress, awakeningProgress: newProgress, lastPrayedDate: today };
                    }
                }

                let count = (s.lastPrayedDate === today) ? s.prayedCount : 0;
                if (!cIsAdmin && count >= 3) {
                    showMessage("這隻小羊今天已經接受過 3 次禱告了，讓他休息一下吧！🙏");
                    return s;
                }
                const rawNewHealth = Math.min(100, s.health + 6);
                const { health, status, type } = calculateSheepState(rawNewHealth, s.status);
                return { ...s, status, health, type, lastPrayedDate: today, prayedCount: count + 1 };
            });
            saveToCloud({ sheep: nextState }).catch(e => console.error(e));
            return nextState;
        });
    }, [showMessage, saveToCloud]);

    const completePlan = useCallback(async (planId, sheepId, feedback) => {
        const cLineId = stateRef.current.lineId;
        if (!cLineId) return;

        const now = new Date().toISOString();
        let feedbackPayload = typeof feedback === 'object' ? JSON.stringify(feedback) : feedback;

        const { error } = await supabase.from('schedule_participants').update({
            completed_at: now,
            feedback: feedbackPayload
        }).eq('id', planId);

        if (error) throw error;

        setSheep(prev => {
            const next = prev.map(s => {
                if (s.id !== sheepId) return s;
                const newCare = (s.careLevel || 0) + 10;
                showMessage(`🎉 ${s.name} 感受到你的關愛了！(關愛 +10)`);
                return { ...s, careLevel: newCare };
            });
            saveToCloud({ sheep: next });
            return next;
        });
        notifyScheduleUpdate();
    }, [showMessage, saveToCloud, notifyScheduleUpdate]);

    const updatePlanFeedback = useCallback(async (planId, feedback) => {
        const cLineId = stateRef.current.lineId;
        if (!cLineId) return;
        let feedbackPayload = typeof feedback === 'object' ? JSON.stringify(feedback) : feedback;
        const { error } = await supabase.from('schedule_participants').update({ feedback: feedbackPayload }).eq('id', planId);
        if (error) throw error;
        notifyScheduleUpdate();
    }, [notifyScheduleUpdate]);

    const deleteSheep = useCallback(async (id) => {
        const cLineId = stateRef.current.lineId;
        setSheep(prev => {
            const next = prev.filter(s => s.id !== id);
            sheepTickerstore.syncWithLogicalState(next);
            saveToCloud({ sheep: next }).catch(console.error);
            return next;
        });
        if (cLineId) await supabase.from('sheep').delete().eq('id', id);
    }, [saveToCloud]);

    const deleteMultipleSheep = useCallback(async (ids) => {
        const cLineId = stateRef.current.lineId;
        setSheep(prev => {
            const next = prev.filter(s => !ids.includes(s.id));
            sheepTickerstore.syncWithLogicalState(next);
            saveToCloud({ sheep: next }).catch(console.error);
            return next;
        });
        if (cLineId) await supabase.from('sheep').delete().in('id', ids);
    }, [saveToCloud]);

    // --- 8. User & Settings Actions ---
    const updateSetting = useCallback((key, value) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            localStorage.setItem('sheep_game_settings', JSON.stringify(next));
            return next;
        });
    }, []);

    const toggleNotification = useCallback(() => {
        const newState = !settings.notify;
        updateSetting('notify', newState);
        showMessage(newState ? "🔔 牧羊提醒已開啟" : "🔕 牧羊提醒已關閉");
    }, [settings.notify, updateSetting, showMessage]);

    const togglePin = useCallback((sheepId) => {
        setSettings(prev => {
            const currentPinned = prev.pinnedSheepIds || [];
            const nextPinned = currentPinned.includes(sheepId) ? currentPinned.filter(id => id !== sheepId) : [...currentPinned, sheepId];
            const newSettings = { ...prev, pinnedSheepIds: nextPinned };
            localStorage.setItem('sheep_game_settings', JSON.stringify(newSettings));
            saveToCloud({ settings: newSettings });
            return newSettings;
        });
    }, [saveToCloud]);

    const updateNickname = useCallback((name) => {
        setNickname(name);
        saveToCloud({ nickname: name });
    }, [saveToCloud]);

    const updateUserLocation = useCallback(async (cityName) => {
        const importWeather = await import('../../utils/weatherService');
        const result = await importWeather.searchCity(cityName);
        if (result) {
            setLocation(result);
            showMessage(`所在地已更新為: ${result.name}`);
            return true;
        } else {
            showMessage("找不到該城市，請重試！");
            return false;
        }
    }, [showMessage]);

    // --- 9. Tag Actions ---
    const loadTags = useCallback(async () => {
        const cLineId = stateRef.current.lineId;
        if (!cLineId) return;
        const [loadedTags, loadedAssignments] = await Promise.all([
            tagService.loadTags(cLineId),
            tagService.loadTagAssignments(cLineId)
        ]);
        setTags(loadedTags);
        setTagAssignmentsBySheep(loadedAssignments);
    }, []);

    const createTag = useCallback(async (opts) => {
        const cLineId = stateRef.current.lineId;
        if (!cLineId) return null;
        const created = await tagService.createTag(cLineId, opts);
        if (created) await loadTags();
        return created;
    }, [loadTags]);

    const updateTag = useCallback(async (tagId, opts) => {
        const updated = await tagService.updateTag(tagId, opts);
        if (updated) await loadTags();
        return updated;
    }, [loadTags]);

    const deleteTag = useCallback(async (tagId) => {
        const ok = await tagService.deleteTag(tagId);
        if (ok) await loadTags();
        return ok;
    }, [loadTags]);

    const setSheepTags = useCallback(async (sheepId, tagIds) => {
        const cLineId = stateRef.current.lineId;
        if (!cLineId) return false;
        const ok = await tagService.setSheepTags(sheepId, cLineId, tagIds);
        if (ok) await loadTags();
        return ok;
    }, [loadTags]);

    // --- 10. Schedule Management ---
    const addSchedule = useCallback(async (scheduleData, participantSheepIds) => {
        const cUserId = stateRef.current.userId;
        if (!cUserId) return null;
        try {
            const { data: existingSchedules } = await supabase.from('schedules').select('id')
                .eq('created_by', cUserId).eq('action', scheduleData.title || '未命名行動').eq('scheduled_time', scheduleData.scheduled_time);

            let scheduleId, schedule;
            if (existingSchedules && existingSchedules.length > 0) {
                scheduleId = existingSchedules[0].id;
                schedule = existingSchedules[0];
            } else {
                const { data: newSchedule, error: scheduleError } = await supabase.from('schedules').insert([{
                    created_by: cUserId, action: scheduleData.title || '未命名行動', scheduled_time: scheduleData.scheduled_time,
                    location: scheduleData.location, content: scheduleData.content, notify_at: scheduleData.notify_at,
                    reminder_offset: scheduleData.reminder_offset, created_at: new Date().toISOString()
                }]).select().single();
                if (scheduleError) throw scheduleError;
                scheduleId = newSchedule.id;
                schedule = newSchedule;
            }

            if (participantSheepIds && participantSheepIds.length > 0) {
                const { data: existingParticipants } = await supabase.from('schedule_participants').select('sheep_id').eq('schedule_id', scheduleId);
                const existingSheepIds = new Set((existingParticipants || []).map(p => p.sheep_id));
                const newParticipantsPayload = participantSheepIds.filter(sid => !existingSheepIds.has(sid)).map(sid => ({
                    schedule_id: scheduleId, sheep_id: sid, created_at: new Date().toISOString()
                }));
                if (newParticipantsPayload.length > 0) {
                    const { error: participantsError } = await supabase.from('schedule_participants').insert(newParticipantsPayload);
                    if (participantsError) throw participantsError;
                }
            }
            notifyScheduleUpdate();
            return schedule;
        } catch (error) {
            console.error("Failed to add schedule:", error);
            showMessage("❌ 新增行程失敗");
            return null;
        }
    }, [showMessage, notifyScheduleUpdate]);

    const updateSchedule = useCallback(async (scheduleId, updates) => {
        const cUserId = stateRef.current.userId;
        if (!cUserId) return false;
        try {
            const { title, ...rest } = updates;
            const validUpdates = { ...rest };
            if (title !== undefined) validUpdates.action = title.trim() || '未命名行動';
            const { error } = await supabase.from('schedules').update({ ...validUpdates, created_by: cUserId }).eq('id', scheduleId);
            if (error) throw error;
            notifyScheduleUpdate();
            return true;
        } catch (error) {
            console.error("Failed to update schedule:", error);
            showMessage("❌ 更新行程失敗");
            return false;
        }
    }, [showMessage, notifyScheduleUpdate]);

    const deleteSchedule = useCallback(async (scheduleId) => {
        const cUserId = stateRef.current.userId;
        if (!cUserId) return false;
        try {
            await supabase.from('schedule_participants').delete().eq('schedule_id', scheduleId);
            const { error } = await supabase.from('schedules').delete().eq('id', scheduleId);
            if (error) throw error;
            notifyScheduleUpdate();
            return true;
        } catch (error) {
            console.error("Failed to delete schedule:", error);
            showMessage("❌ 刪除行程失敗");
            return false;
        }
    }, [showMessage, notifyScheduleUpdate]);

    const addParticipantToSchedule = useCallback(async (scheduleId, sheepId) => {
        const cLineId = stateRef.current.lineId;
        if (!cLineId) return false;
        try {
            const { error } = await supabase.from('schedule_participants').insert([{
                schedule_id: scheduleId, sheep_id: sheepId, created_at: new Date().toISOString()
            }]);
            if (error) throw error;
            notifyScheduleUpdate();
            return true;
        } catch (error) { console.error("Failed to add participant:", error); return false; }
    }, [notifyScheduleUpdate]);

    const removeParticipantFromSchedule = useCallback(async (scheduleId, sheepId) => {
        const cLineId = stateRef.current.lineId;
        if (!cLineId) return false;
        try {
            const { error } = await supabase.from('schedule_participants').delete().match({ schedule_id: scheduleId, sheep_id: sheepId });
            if (error) throw error;
            notifyScheduleUpdate();
            return true;
        } catch (error) { console.error("Failed to remove participant:", error); return false; }
    }, [notifyScheduleUpdate]);

    const fetchWeeklySchedules = useCallback(async () => {
        const cUserId = stateRef.current.userId;
        if (!cUserId) return [];
        try {
            const { data, error } = await supabase.from('schedules').select('*, created_at, schedule_participants (*)')
                .order('scheduled_time', { ascending: true });
            if (error) throw error;
            const mySheepIds = new Set(stateRef.current.sheep.map(s => s.id));
            const filtered = (data || []).map(s => {
                if (s.schedule_participants) {
                    s.schedule_participants = s.schedule_participants.map(p => {
                        if (p.feedback && typeof p.feedback === 'string') {
                            try { p.feedback = JSON.parse(p.feedback); } catch (e) { p.feedback = { note: p.feedback }; }
                        }
                        return p;
                    });
                }
                return s;
            }).filter(s => (s.created_by === cUserId) || (s.schedule_participants || []).some(p => mySheepIds.has(p.sheep_id)));
            return filtered;
        } catch (error) { console.error('Error fetching weekly schedules:', error); return []; }
    }, []);

    const markIntroWatched = useCallback(() => {
        setIntroWatched(true);
        setShowIntroVideo(false);
        saveToCloud({ introWatched: true });
    }, [saveToCloud]);

    const findSheep = useCallback((id) => {
        setFocusedSheepId(id);
        setSheep(prev => prev.map(s => s.id === id ? { ...s, message: "咩～！" } : s));
        setTimeout(() => {
            setSheep(prev => prev.map(s => (s.id === id && s.message === "咩～！") ? { ...s, message: null } : s));
        }, 3000);
    }, []);

    const clearFocus = useCallback(() => setFocusedSheepId(null), []);

    // --- 11. Lifecycle Effects ---
    useEffect(() => {
        const initLiff = async () => {
            if (window.__liffInitialized) return;
            try {
                if (window.liff) {
                    await window.liff.init({ liffId: LIFF_ID });
                    window.__liffInitialized = true;
                    setIsInClient(window.liff.isInClient());
                    if (window.liff.isLoggedIn()) {
                        const profile = await window.liff.getProfile();
                        handleLoginSuccess(profile);
                    } else { setIsLoading(false); }
                } else { console.error("LIFF SDK not found"); setIsLoading(false); }
            } catch (error) { console.error("LIFF Init Error", error); setIsLoading(false); }
        };
        initLiff();
    }, [LIFF_ID, handleLoginSuccess]);

    useEffect(() => {
        if (!lineId || !isDataLoaded) return;
        const handleUnload = () => {
            const currentSheep = stateRef.current.sheep;
            const currentProfile = {
                game_data: { inventory: stateRef.current.inventory, settings: stateRef.current.settings, introWatched: stateRef.current.introWatched, lastSave: Date.now() },
                last_login: new Date().toISOString(), nickname: stateRef.current.nickname,
                name: stateRef.current.currentUser || undefined, avatar: stateRef.current.userAvatarUrl || undefined
            };
            gameState.saveGameSync(lineId, stateRef.current.userId, currentSheep, currentProfile);
        };
        const checkCloudVersion = async () => {
            if (isLoading) return;
            const now = Date.now();
            if (now - lastSyncCheckRef.current < 10000) return;
            lastSyncCheckRef.current = now;
            try {
                const { data } = await supabase.from('users').select('game_data').eq('line_id', lineId).single();
                if (data && data.game_data) {
                    const cloudTs = data.game_data.lastSave || 0;
                    const localTs = lastSaveTimeRef.current || 0;
                    if (cloudTs > localTs + 1000) {
                        showMessage("🔄 偵測到新進度，自動同步中...");
                        if (window.liff && window.liff.isLoggedIn()) {
                            window.liff.getProfile().then(profile => handleLoginSuccess(profile));
                        } else { handleLoginSuccess({ userId: lineId, displayName: currentUser, pictureUrl: '' }); }
                    }
                }
            } catch (e) { console.error("Cloud check error", e); }
        };
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') handleUnload();
            else if (document.visibilityState === 'visible') checkCloudVersion();
        };
        window.addEventListener('beforeunload', handleUnload);
        document.addEventListener('visibilitychange', handleVisibility);
        const intervalId = setInterval(() => saveToCloud(), 60000);
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('beforeunload', handleUnload);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [lineId, isDataLoaded, isLoading, currentUser, handleLoginSuccess, saveToCloud, showMessage]);

    // Auto-Save settings
    useEffect(() => {
        if (!isDataLoaded) return;
        const timer = setTimeout(() => saveToCloud(), 1000);
        return () => clearTimeout(timer);
    }, [settings, isDataLoaded, saveToCloud]);

    // --- 12. Context Value Composition ---
    const actions = useMemo(() => ({
        setNickname, updateUserLocation, adoptSheep, updateSheep, updateMultipleSheep, togglePin,
        loginWithLine, loginAsAdmin, logout, prayForSheep, completePlan, deleteSheep, deleteMultipleSheep,
        saveToCloud, forceLoadFromCloud, toggleNotification, updateNickname, markIntroWatched,
        updateSetting, setWeather, loadTags, createTag, updateTag, deleteTag, setSheepTags,
        fetchWeeklySchedules, notifyScheduleUpdate, findSheep, clearFocus, updatePlanFeedback,
        addSchedule, updateSchedule, deleteSchedule, addParticipantToSchedule, removeParticipantFromSchedule
    }), [
        updateUserLocation, adoptSheep, updateSheep, updateMultipleSheep, togglePin,
        loginWithLine, loginAsAdmin, logout, prayForSheep, completePlan, deleteSheep,
        deleteMultipleSheep, saveToCloud, forceLoadFromCloud, toggleNotification,
        updateNickname, markIntroWatched, updateSetting, loadTags, createTag,
        updateTag, deleteTag, setSheepTags, fetchWeeklySchedules, notifyScheduleUpdate,
        findSheep, clearFocus, updatePlanFeedback, addSchedule, updateSchedule,
        deleteSchedule, addParticipantToSchedule, removeParticipantFromSchedule
    ]);

    const auth = useMemo(() => ({
        currentUser, nickname, userAvatarUrl, lineId, isAdmin: lineId === 'admin',
        isLoading, isInClient, settings, notificationEnabled: settings.notify,
        loginStatus
    }), [currentUser, nickname, userAvatarUrl, lineId, isLoading, isInClient, settings, loginStatus]);

    const state = useMemo(() => ({
        sheep, inventory, message, weather, tags, tagAssignmentsBySheep,
        lastScheduleUpdate, focusedSheepId, showIntroVideo, location
    }), [sheep, inventory, message, weather, tags, tagAssignmentsBySheep, lastScheduleUpdate, focusedSheepId, showIntroVideo, location]);

    return (
        <GameActionsContext.Provider value={actions}>
            <UserAuthContext.Provider value={auth}>
                <GameStateContext.Provider value={state}>
                    {children}
                </GameStateContext.Provider>
            </UserAuthContext.Provider>
        </GameActionsContext.Provider>
    );
};
