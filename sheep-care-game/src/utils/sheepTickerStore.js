/**
 * sheepTickerStore.js
 * 
 * A vanilla JS PubSub store designed to handle high-frequency (1s) visual state updates
 * for sheep (coordinates, animations) without triggering global React Context re-renders.
 */
import { calculateTick, isSleeping } from './gameLogic';

class SheepTickerStore {
    constructor() {
        this.sheepState = new Map(); // id -> current visual state
        this.listeners = new Map();  // id -> Set of callbacks
        this.globalListeners = new Set(); // Global callbacks (if any needed for debugging)
        this.intervalId = null;
    }

    // --- Core Lifecycle ---

    /**
     * Initializes the ticker with base logical sheep data from GameProvider.
     * This should be called whenever the source of truth (DB) changes significantly
     * (e.g., loaded from cloud, adopted new sheep, deleted sheep).
     */
    syncWithLogicalState(logicalSheepArray) {
        if (!logicalSheepArray) return;

        const newKeys = new Set(logicalSheepArray.map(s => s.id));

        // Remove dead tracking
        for (const [id] of this.sheepState) {
            if (!newKeys.has(id)) {
                this.sheepState.delete(id);
                this.listeners.delete(id);
            }
        }

        // Add or update living tracking, but PRESERVE existing visual state (x,y,angle,state) 
        // to avoid jarring teleportations if the logical state doesn't have the newest coords.
        logicalSheepArray.forEach(logicalSheep => {
            const existing = this.sheepState.get(logicalSheep.id);
            if (existing) {
                // Merge logical updates (health, status, type) into existing visual state
                this.sheepState.set(logicalSheep.id, {
                    ...existing,
                    ...logicalSheep,
                    x: existing.x !== undefined ? existing.x : logicalSheep.x,
                    y: existing.y !== undefined ? existing.y : logicalSheep.y,
                    angle: existing.angle !== undefined ? existing.angle : logicalSheep.angle,
                    state: existing.state !== undefined ? existing.state : logicalSheep.state,
                    direction: existing.direction !== undefined ? existing.direction : logicalSheep.direction,
                    message: existing.message !== undefined ? existing.message : logicalSheep.message,
                    messageTimer: existing.messageTimer !== undefined ? existing.messageTimer : logicalSheep.messageTimer
                });
            } else {
                this.sheepState.set(logicalSheep.id, { ...logicalSheep });
            }
        });

        // Ensure tick loop is running if we have sheep
        if (this.sheepState.size > 0 && !this.intervalId) {
            this.start();
        } else if (this.sheepState.size === 0 && this.intervalId) {
            this.stop();
        }
    }

    start() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => this.tick(), 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    tick() {
        if (this.sheepState.size === 0) return;

        // We need an array snapshot for flock separation math
        const allCurrent = Array.from(this.sheepState.values());

        for (const [id, currentSheep] of this.sheepState) {
            // Calculate new position based on logic rules
            const nextSheep = calculateTick(currentSheep, allCurrent);
            this.sheepState.set(id, nextSheep);

            // Notify local subscribers (the Sheep.jsx component)
            if (this.listeners.has(id)) {
                this.listeners.get(id).forEach(cb => cb(nextSheep));
            }
        }

        this.globalListeners.forEach(cb => cb());
    }

    // --- Actions ---

    getLatestState(id) {
        return this.sheepState.get(id);
    }

    getAllLatestState() {
        return Array.from(this.sheepState.values());
    }

    // Allow forcing a specific state update (like showing "咩～" when clicking finding)
    updateSheep(id, updates) {
        const existing = this.sheepState.get(id);
        if (existing) {
            const next = { ...existing, ...updates };
            this.sheepState.set(id, next);
            if (this.listeners.has(id)) {
                this.listeners.get(id).forEach(cb => cb(next));
            }
        }
    }

    // --- PubSub API ---

    subscribe(id, callback) {
        if (!this.listeners.has(id)) {
            this.listeners.set(id, new Set());
        }
        this.listeners.get(id).add(callback);

        // Immediately fire with current state
        if (this.sheepState.has(id)) {
            callback(this.sheepState.get(id));
        }

        return () => {
            if (this.listeners.has(id)) {
                this.listeners.get(id).delete(callback);
            }
        };
    }

    subscribeGlobal(callback) {
        this.globalListeners.add(callback);
        return () => this.globalListeners.delete(callback);
    }
}

// Export singleton instance
export const sheepTickerstore = new SheepTickerStore();
