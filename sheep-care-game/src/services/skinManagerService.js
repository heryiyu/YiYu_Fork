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
     * Called on App initialization. Uses LocalStorage caching for high performance.
     */
    async loadManifest() {
        const CACHE_KEY = 'sheep_game_skin_manifest';
        const CACHE_TIME_KEY = 'sheep_game_skin_manifest_timestamp';
        const CACHE_VALID_MS = 1000 * 60 * 60; // 1 Hour

        try {
            // 1. Check LocalStorage Cache
            const cachedManifestStr = localStorage.getItem(CACHE_KEY);
            const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
            const now = Date.now();

            let useCache = false;
            let currentManifest = {};

            if (cachedManifestStr && cachedTime) {
                if (now - parseInt(cachedTime, 10) < CACHE_VALID_MS) {
                    useCache = true;
                    currentManifest = JSON.parse(cachedManifestStr);
                    console.log('[Skin Manager] Loaded manifest from fast cache');
                    this._injectManifestIntoAssets(currentManifest);
                }
            }

            // 2. Fetch latest from Supabase (InBackground if using cache)
            const fetchPromise = (async () => {
                const timestamp = new Date().getTime(); // Cache busting
                const { data, error } = await supabase.storage
                    .from(BUCKET_NAME)
                    .download(`${MANIFEST_FILE}?t=${timestamp}`);

                if (error) {
                    if (error.status === 404 || error.name === 'StorageApiError') {
                        return {};
                    }
                    throw error;
                }

                const text = await data.text();
                const freshManifest = JSON.parse(text);

                // Update Cache
                localStorage.setItem(CACHE_KEY, JSON.stringify(freshManifest));
                localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

                // If we didn't use cache, inject it now
                if (!useCache) {
                    this._injectManifestIntoAssets(freshManifest);
                    console.log('Successfully loaded fresh Custom Skins:', Object.keys(freshManifest).length);
                }

                return freshManifest;
            })();

            // If we have valid cache, return immediately, let fetchPromise complete in background
            if (useCache) {
                // Ignore background errors
                fetchPromise.catch(e => console.warn("Background manifest update failed:", e));
                return currentManifest;
            }

            // Otherwise await the fetch
            return await fetchPromise;

        } catch (err) {
            console.error('Failed to parse loadManifest:', err);
            return {};
        }
    }

    /**
     * Internal helper to inject manifest data into ASSETS registry
     */
    _injectManifestIntoAssets(manifest) {
        if (!manifest || typeof manifest !== 'object') return;

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
                exists.label = skinData.name || id;
            }
        });
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
