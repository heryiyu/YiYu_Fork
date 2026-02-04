import { supabase, supabaseUrl, supabaseKey } from './supabaseClient';
import { calculateOfflineDecay, sanitizeSheep, isSleeping, SLEEPING_STATUS } from '../utils/gameLogic';

export const gameState = {
    // Helper: Get ISO string with local timezone offset (e.g. +08:00)
    _getLocalISOString() {
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
    },

    // Load all data (User + Sheep) and apply offline logic
    // Accepts userId (LINE ID string) and optional lineProfile { displayName, pictureUrl }
    async loadGame(userId, lineProfile = {}) {
        if (!userId) return null;

        const { displayName, pictureUrl } = lineProfile;
        const defaultNickname = (displayName && String(displayName).trim()) || 'Shepherd';

        // 1. Get User Profile (Using 'line_id' from user schema)
        let { data: profile, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('line_id', userId)
            .single();

        // FIX: Check for errors distinct from "Not Found"
        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("Critical Login Error:", fetchError);
            throw new Error(`Login failed due to network or server error: ${fetchError.message}`);
        }

        if (!profile) {
            // Create profile if missing - use LINE displayName as default nickname
            // Leverage existing columns: line_id, nickname, name/display_name, avatar, coins
            const insertPayload = {
                line_id: userId,
                nickname: defaultNickname,
                name: displayName && String(displayName).trim() ? displayName : null,
                avatar: pictureUrl && String(pictureUrl).trim() ? pictureUrl : null,
                coins: 0
            };
            const { data: newProfile, error } = await supabase
                .from('users')
                .insert([insertPayload])
                .select()
                .single();

            if (error) {
                console.error('Error creating profile:', error);
                return { user: { line_id: userId, nickname: defaultNickname, name: displayName, avatar: pictureUrl }, sheep: [] };
            }
            profile = newProfile;
            return { user: profile, sheep: [], isNewUser: true };
        } else {
            // Returning user: optionally update name/nickname/avatar if stale (null in DB but we have from LINE)
            const updates = {};
            if ((!profile.name || !profile.name.trim()) && displayName && String(displayName).trim()) {
                updates.name = displayName;
            }
            if ((!profile.avatar || !profile.avatar.trim()) && pictureUrl && String(pictureUrl).trim()) {
                updates.avatar = pictureUrl;
            }
            if ((!profile.nickname || !profile.nickname.trim()) && defaultNickname !== 'Shepherd') {
                updates.nickname = defaultNickname;
            }
            if (Object.keys(updates).length > 0) {
                await supabase
                    .from('users')
                    .update(updates)
                    .eq('line_id', userId);
                profile = { ...profile, ...updates };
            }
        }

        // 2. Get Sheep (Using 'user_id' text)
        // Join with 'sheep_skins' (User specified table name)
        const { data: sheepList, error: sheepError } = await supabase
            .from('sheep')
            .select(`
                *,
                skins:skin_id (
                    id, type, data
                )
            `)
            .eq('user_id', userId);

        if (sheepError) {
            console.error('Error loading sheep:', sheepError);
            return { user: profile, sheep: [] };
        }

        // 3. Calculate Offline Decay
        const now = new Date();
        const updatedSheepList = sheepList.map(s => {
            // Restore from DB format
            let sheep = this._fromDbSheep(s);

            // V13: Parametric Skins Logic
            // We have 'skins.data' (Template) and 'sheep.visual_attrs' (Attributes)

            // 1. Start with Template (if any)
            let combinedVisual = {};
            if (s.skins && s.skins.data) {
                combinedVisual = { ...s.skins.data };
            }

            // 2. Merge Instance Attributes (This overrides template defaults)
            // User renamed to Spiritual_Journey_Planning
            const rawCol = s.Spiritual_Journey_Planning || s.visual_attrs || {}; // Fallback for transition
            const { plan, ...instanceVisuals } = rawCol;

            if (instanceVisuals) {
                combinedVisual = { ...combinedVisual, ...instanceVisuals };
            }

            sheep.visual = combinedVisual;
            sheep.plan = plan || {}; // Assign plan to sheep object

            // Schema has 'last_login'
            const lastTime = new Date(sheep.updated_at || profile.last_login || now);
            const diffHours = (now - lastTime) / (1000 * 60 * 60);

            if (diffHours > 0.1) {
                if (!isSleeping(sheep)) {
                    sheep = calculateOfflineDecay(sheep, diffHours);
                }
            }

            sheep = sanitizeSheep(sheep);
            return sheep;
        });

        // 4. Update Last Login (Schema: 'last_login')
        await supabase
            .from('users')
            .update({ last_login: this._getLocalISOString() })
            .eq('line_id', userId);

        return { user: profile, sheep: updatedSheepList, isNewUser: false };
    },

    // Helper: Ensure a skin exists for the sheep (Programmatic)
    // Helper: Ensure a skin exists for the sheep (Programmatic)
    // V13 Update: For Programmatic sheep, we DON'T create new skins anymore.
    // We only create skins for IMAGES.
    // For Programmatic, we return the Master Skin ID.
    async _ensureSkin(sheep) {
        if (sheep.skinId) return sheep.skinId;

        // V13 Pivot: Always link new sheep to the 'Standard Sheep Template'
        // We assume this template was created by supabase/migrations/013_parametric_skins.sql.
        const { data: masterSkin } = await supabase
            .from('sheep_skins')
            .select('id')
            .eq('name', 'Standard Sheep Template')
            .single();

        if (masterSkin) return masterSkin.id;

        // Fallback: This should technically not happen if V13 ran.
        // We return null to avoid creating junk data.
        return null;
    },



    // Helper: Map Sheep to DB (camel -> snake)
    _toDbSheep(sheep) {
        const status = (sheep.status === SLEEPING_STATUS || sheep.status === 'dead') ? 'dead' : sheep.status;
        const awakeningProgress = sheep.awakeningProgress ?? sheep.resurrectionProgress ?? 0;
        return {
            id: sheep.id,
            user_id: sheep.user_id,
            name: sheep.name,
            type: sheep.type,
            status,
            health: sheep.health,

            // V13: Save attributes here
            // User renamed 'visual_attrs' to 'Spiritual_Journey_Planning'
            // We store visual attributes AND spiritual plan here.
            Spiritual_Journey_Planning: { ...sheep.visual, plan: sheep.plan },

            // New Columns (Snake Case)
            x: sheep.x,
            y: sheep.y,
            angle: sheep.angle,
            direction: sheep.direction,
            care_level: sheep.careLevel,
            spiritual_maturity: sheep.spiritualMaturity,
            prayed_count: sheep.prayedCount,
            last_prayed_date: sheep.lastPrayedDate,
            resurrection_progress: awakeningProgress,
            skin_id: sheep.skinId,
            note: sheep.note,
            state: sheep.state,

            updated_at: new Date().toISOString()
        };
    },

    // Helper: Map DB to Sheep (snake -> camel)
    _fromDbSheep(row) {
        const rawStatus = row.status;
        const status = (rawStatus === 'dead' || rawStatus === SLEEPING_STATUS) ? SLEEPING_STATUS : rawStatus;
        const awakeningProgress = row.resurrection_progress ?? row.awakening_progress ?? 0;
        return {
            id: row.id,
            user_id: row.user_id,
            name: row.name,
            type: row.type,
            status,
            health: row.health,
            // V13: Load from new flow. (This helper is for raw row conversion)
            // But _fromDbSheep is mostly used inside loadGame where we handle the merge.
            // If used standalone, we might miss the joined skin data.
            // For safety, we map what we have.
            // visual: row.visual_attrs || {}, // OLD

            // NEW: Parse Spiritual_Journey_Planning
            // It contains { ...visual, plan: { ... } }
            visual: (() => {
                const raw = row.Spiritual_Journey_Planning || {};
                const { plan, ...vis } = raw;
                return vis; // Return just visual parts for 'visual' prop
            })(),

            // Extract Plan
            plan: (row.Spiritual_Journey_Planning && row.Spiritual_Journey_Planning.plan) || {},

            // We iterate on 'visual_attrs' for compatibility if needed, but row likely has new col
            // visual_attrs: row.visual_attrs, 

            x: row.x ?? 50,
            y: row.y ?? 50,
            angle: row.angle ?? 0,
            direction: row.direction ?? 1,

            careLevel: row.care_level ?? 0,
            spiritualMaturity: row.spiritual_maturity ?? 0,
            prayedCount: row.prayed_count ?? 0,
            lastPrayedDate: row.last_prayed_date,
            awakeningProgress,
            resurrectionProgress: awakeningProgress,
            skinId: row.skin_id,
            note: row.note || '',
            state: row.state || 'idle',

            updated_at: row.updated_at
        };
    },

    async saveSheep(sheep) {
        const payload = this._toDbSheep(sheep);
        const { error } = await supabase
            .from('sheep')
            .upsert(payload);

        if (error) console.error('Error saving sheep:', error);
    },

    async saveAllSheep(sheepList) {
        if (!sheepList || sheepList.length === 0) return;
        const payload = sheepList.map(s => this._toDbSheep(s));

        const { error } = await supabase
            .from('sheep')
            .upsert(payload);

        if (error) console.error('Error batch saving sheep:', error);
    },

    async saveUserProfile(userId, updates) {
        if (!userId) {
            console.error("saveUserProfile called with null userId");
            return;
        }

        // Strategy: UPSERT (Insert or Update) - Matches Sheep Logic
        // NOW WORKS because we added UNIQUE constraint to line_id in V16.
        const payload = {
            line_id: userId,
            ...updates
            // updated_at removed as column does not exist
        };

        const { error } = await supabase
            .from('users')
            .upsert(payload, { onConflict: 'line_id' })
            .select();

        if (error) {
            console.error('Error saving user profile:', error);
        } else {
            console.log(`User profile saved for ${userId} (Upsert)`);
        }
    },

    async createSheep(sheep) {
        if (!sheep.user_id) {
            console.error("createSheep requires user_id");
            return null;
        }

        // Ensure Skin Exists
        let skinId = sheep.skinId;
        if (!skinId) {
            skinId = await this._ensureSkin(sheep);
        }

        const payload = {
            ...this._toDbSheep({ ...sheep, skinId }),
            created_at: this._getLocalISOString()
        };
        if (!payload.id) delete payload.id;

        // Insert
        const { data, error } = await supabase
            .from('sheep')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('Error creating sheep:', error);
            return null;
        }
        return data;
    },

    async deleteSheep(id) {
        const { error } = await supabase
            .from('sheep')
            .delete()
            .eq('id', id);
        if (error) console.error('Error deleting sheep:', error);
    },

    // NUCLEAR OPTION: Synchronous XHR for absolute reliability on close
    // Reliable Save on Exit (Using fetch with keepalive)
    saveGameSync(userId, sheepList, userProfile) {
        if (!userId) return;

        const headers = {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal' // Don't need response
        };

        // 1. Save Profile
        if (userProfile) {
            try {
                // Strategy: REST UPSERT (POST)
                // Now works thanks to V16 Unique Constraint
                // Must specify on_conflict for REST upsert to work on non-PK
                const url = `${supabaseUrl}/rest/v1/users?on_conflict=line_id`;
                const payload = {
                    line_id: userId,
                    ...userProfile
                    // updated_at removed
                };

                fetch(url, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
                    body: JSON.stringify(payload),
                    keepalive: true
                }).catch(e => console.error("Keepalive Save Profile Failed", e));

            } catch (e) { console.error("Keepalive Save Profile Error", e); }
        }

        // 2. Save Sheep
        if (sheepList && sheepList.length > 0) {
            try {
                const sheepPayload = sheepList.map(s => {
                    const mapped = this._toDbSheep(s);
                    if (!mapped.user_id) mapped.user_id = userId;
                    return mapped;
                });

                const url = `${supabaseUrl}/rest/v1/sheep`;
                fetch(url, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
                    body: JSON.stringify(sheepPayload),
                    keepalive: true
                }).catch(e => console.error("Keepalive Save Sheep Failed", e));

            } catch (e) { console.error("Keepalive Save Sheep Error", e); }
        }
    }
};
