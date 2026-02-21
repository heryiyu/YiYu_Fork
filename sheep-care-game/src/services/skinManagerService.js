import { supabase, supabaseUrl } from './supabaseClient';
import { ASSETS } from '../utils/AssetRegistry';

const BUCKET_NAME = 'skins';
const ADMIN_FOLDER = 'admin';
const MANIFEST_FILE = `${ADMIN_FOLDER}/manifest.json`;

class SkinManagerService {
    /**
     * Helper to get public URL for a file in the skins bucket
     */
    getPublicUrl(path) {
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        return data.publicUrl;
    }

    /**
     * Download and merge the manifest.json into ASSETS.
     * Called on App initialization.
     */
    async loadManifest() {
        try {
            // Include cache-busting timestamp to always get the latest manifest
            const timestamp = new Date().getTime();
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .download(`${MANIFEST_FILE}?t=${timestamp}`);

            if (error) {
                if (error.status === 404 || error.name === 'StorageApiError') {
                    // It's normal if it doesn't exist yet, we just start with empty
                    console.log('No custom skin manifest found yet. Starting fresh.');
                    return {};
                }
                console.error('Error downloading skin manifest:', error);
                return {};
            }

            const text = await data.text();
            const manifest = JSON.parse(text);

            // Dynamically inject into ASSETS
            if (manifest && typeof manifest === 'object') {
                Object.keys(manifest).forEach(id => {
                    const skinData = manifest[id];

                    // 1. Add to SHEEP_VARIANTS
                    ASSETS.SHEEP_VARIANTS[id] = {
                        HEALTHY: this.getPublicUrl(skinData.healthyPath),
                        SICK: skinData.sickPath ? this.getPublicUrl(skinData.sickPath) : this.getPublicUrl(skinData.healthyPath),
                    };

                    // 2. Add to VARIANT_OPTIONS if not already there
                    const exists = ASSETS.VARIANT_OPTIONS.find(opt => opt.id === id);
                    if (!exists) {
                        ASSETS.VARIANT_OPTIONS.push({
                            id: id,
                            label: skinData.name || id
                        });
                    } else {
                        // Update label if it changed
                        exists.label = skinData.name || id;
                    }
                });
                console.log('Successfully loaded and injected Custom Skins:', Object.keys(manifest).length);
            }

            return manifest;

        } catch (err) {
            console.error('Failed to parse loadManifest:', err);
            return {};
        }
    }

    /**
     * Save the updated manifest.json to the bucket
     */
    async _saveManifest(manifestObj) {
        const jsonStr = JSON.stringify(manifestObj, null, 2);
        const file = new Blob([jsonStr], { type: 'application/json' });

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(MANIFEST_FILE, file, {
                cacheControl: '0',
                upsert: true
            });

        if (error) {
            console.error('Failed to save manifest:', error);
            throw error;
        }
    }

    /**
     * Create or Update a Skin
     */
    async uploadSkin(id, name, healthyFile, sickFile) {
        // 1. Fetch current manifest
        const currentManifest = await this.loadManifest();

        // 2. Upload healthy image
        const healthyExt = healthyFile.name.split('.').pop();
        const healthyPath = `${ADMIN_FOLDER}/${id}_healthy_${Date.now()}.${healthyExt}`;
        const { error: hError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(healthyPath, healthyFile, { upsert: true });

        if (hError) throw new Error(`上傳健康狀態圖片失敗: ${hError.message}`);

        // 3. Upload sick image (if provided)
        let sickPath = null;
        if (sickFile) {
            const sickExt = sickFile.name.split('.').pop();
            sickPath = `${ADMIN_FOLDER}/${id}_sick_${Date.now()}.${sickExt}`;
            const { error: sError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(sickPath, sickFile, { upsert: true });

            if (sError) throw new Error(`上傳生病狀態圖片失敗: ${sError.message}`);
        }

        // 4. Update manifest
        currentManifest[id] = {
            id,
            name,
            healthyPath,
            sickPath: sickPath || healthyPath,
            updatedAt: new Date().toISOString()
        };

        // 5. Save manifest back to storage
        await this._saveManifest(currentManifest);

        // 6. Reload into memory
        await this.loadManifest();
    }

    /**
     * Delete a Skin
     */
    async deleteSkin(id) {
        // 1. Fetch current manifest
        const currentManifest = await this.loadManifest();
        const skinData = currentManifest[id];

        if (!skinData) return;

        // 2. Delete files from storage
        const filesToDelete = [skinData.healthyPath];
        if (skinData.sickPath && skinData.sickPath !== skinData.healthyPath) {
            filesToDelete.push(skinData.sickPath);
        }

        const { error: delError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(filesToDelete);

        if (delError) {
            console.error('Warning: could not delete physical files', delError);
        }

        // 3. Remove from manifest
        delete currentManifest[id];

        // 4. Save manifest
        await this._saveManifest(currentManifest);

        // 5. Remove from in-memory ASSETS (need to find index for VARIANT_OPTIONS)
        delete ASSETS.SHEEP_VARIANTS[id];
        const index = ASSETS.VARIANT_OPTIONS.findIndex(opt => opt.id === id);
        if (index > -1) {
            ASSETS.VARIANT_OPTIONS.splice(index, 1);
        }
    }
}

export const skinManagerService = new SkinManagerService();
