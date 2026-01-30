import { supabase, supabaseUrl, supabaseKey } from './supabaseClient';
import { calculateOfflineDecay, sanitizeSheep } from '../utils/gameLogic';

export const gameState = {
    // Load all data (User + Sheep) and apply offline logic
    // Now accepts userId (LINE ID string) directly
    async loadGame(userId) {
        if (!userId) return null;

        // 1. Get User Profile (Using 'line_id' from user schema)
        let { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('line_id', userId)
            .single();

        if (!profile) {
            // Create profile if missing
            const { data: newProfile, error } = await supabase
                .from('users')
                .insert([{ line_id: userId, name: 'Shepherd', coins: 0 }])
                .select()
                .single();

            if (error) {
                console.error('Error creating profile:', error);
                // Return fallback structure
                return { user: { line_id: userId, name: 'Shepherd', coins: 0 }, sheep: [] };
            }
            profile = newProfile;
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
            if (s.visual_attrs) {
                combinedVisual = { ...combinedVisual, ...s.visual_attrs };
            }

            sheep.visual = combinedVisual;

            // Schema has 'last_login'
            const lastTime = new Date(sheep.updated_at || profile.last_login || now);
            const diffHours = (now - lastTime) / (1000 * 60 * 60);

            if (diffHours > 0.1) {
                if (sheep.status !== 'dead') {
                    sheep = calculateOfflineDecay(sheep, diffHours);
                }
            }

            sheep = sanitizeSheep(sheep);
            return sheep;
        });

        // 4. Update Last Login (Schema: 'last_login')
        await supabase
            .from('users')
            .update({ last_login: now.toISOString() })
            .eq('line_id', userId);

        return { user: profile, sheep: updatedSheepList };
    },

    // Helper: Ensure a skin exists for the sheep (Programmatic)
    // Helper: Ensure a skin exists for the sheep (Programmatic)
    // V13 Update: For Programmatic sheep, we DON'T create new skins anymore.
    // We only create skins for IMAGES.
    // For Programmatic, we return the Master Skin ID.
    async _ensureSkin(sheep) {
        if (sheep.skinId) return sheep.skinId;

        // V13 Pivot: Always link new sheep to the 'Standard Sheep Template'
        // We assume this template was created by migration_v13.
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

    /* OLD LOGIC REMOVED
    async _ensureSkin_OLD(sheep) {
        if (sheep.skinId) return sheep.skinId;
        if (!sheep.visual) return null;

        // Clean visual data
        const cleanVisual = { ...sheep.visual };
    */

    const { data, error } = await supabase
        .from('sheep_skins')
        .insert([{
            name: 'Sheep ' + (sheep.name || '') + ' Visual',
            type: 'programmatic',
            data: cleanVisual
        }])
        .select('id')
        .single();

    if(error) {
        console.error("Error creating skin:", error);
        return null;
    }
        return data.id;
},

    // Helper: Map Sheep to DB (camel -> snake)
    _toDbSheep(sheep) {
        return {
            id: sheep.id,
            user_id: sheep.user_id,
            name: sheep.name,
            type: sheep.type,
            status: sheep.status,
            health: sheep.health,
            // visual: sheep.visual, // REMOVED
            // visual_data: sheep.visual, // REMOVED
            visual_attrs: sheep.visual, // V13: Save attributes here

            // New Columns (Snake Case)
            x: sheep.x,
            y: sheep.y,
            angle: sheep.angle,
            direction: sheep.direction,
            care_level: sheep.careLevel,
            spiritual_maturity: sheep.spiritualMaturity,
            prayed_count: sheep.prayedCount,
            last_prayed_date: sheep.lastPrayedDate,
            resurrection_progress: sheep.resurrectionProgress,
            skin_id: sheep.skinId,
            note: sheep.note,
            state: sheep.state,

            updated_at: new Date().toISOString()
        };
    },

        // Helper: Map DB to Sheep (snake -> camel)
        _fromDbSheep(row) {
    return {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        type: row.type,
        status: row.status,
        health: row.health,
        status: row.status,
        health: row.health,
        // V13: Load from new flow. (This helper is for raw row conversion)
        // But _fromDbSheep is mostly used inside loadGame where we handle the merge.
        // If used standalone, we might miss the joined skin data.
        // For safety, we map what we have.
        visual: row.visual_attrs || {},
        visual_attrs: row.visual_attrs,

        x: row.x ?? 50,
        y: row.y ?? 50,
        angle: row.angle ?? 0,
        direction: row.direction ?? 1,

        careLevel: row.care_level ?? 0,
        spiritualMaturity: row.spiritual_maturity ?? 0,
        prayedCount: row.prayed_count ?? 0,
        lastPrayedDate: row.last_prayed_date,
        resurrectionProgress: row.resurrection_progress ?? 0,
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
    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('line_id', userId);

    if (error) console.error('Error saving user profile:', error);
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
        created_at: new Date().toISOString()
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
saveGameSync(userId, sheepList, userProfile) {
    if (!userId) return;

    // 1. Save Profile
    if (userProfile) {
        try {
            const url = `${supabaseUrl}/rest/v1/users?line_id=eq.${userId}`;
            const xhr = new XMLHttpRequest();
            xhr.open('PATCH', url, false); // FALSE = Synchronous
            xhr.setRequestHeader('apikey', supabaseKey);
            xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Prefer', 'return=minimal');
            xhr.send(JSON.stringify(userProfile));
        } catch (e) {
            console.error("Sync Save Profile Failed", e);
        }
    }

    // 2. Save Sheep
    if (sheepList && sheepList.length > 0) {
        try {
            // Ensure user_id is injected IF missing (though logic handles it)
            const sheepPayload = sheepList.map(s => {
                const mapped = this._toDbSheep(s);
                // Force user_id injection if the helper didn't pick it up (e.g. if s.user_id was missing but userId is present)
                if (!mapped.user_id) mapped.user_id = userId;
                return mapped;
            });

            const url = `${supabaseUrl}/rest/v1/sheep`;
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, false); // FALSE = Synchronous
            xhr.setRequestHeader('apikey', supabaseKey);
            xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Prefer', 'resolution=merge-duplicates,return=minimal');
            xhr.send(JSON.stringify(sheepPayload));
        } catch (e) {
            console.error("Sync Save Sheep Failed", e);
        }
    }
}
};
