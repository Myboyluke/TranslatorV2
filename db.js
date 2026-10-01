/**
 * Database Layer for English-Tausug Speech-to-Speech Translator
 * Supports:
 *  1. Browser-native IndexedDB (100% free, zero-config, persistent across reloads, offline-ready)
 *  2. Cloud Sync Adapter for Firebase Firestore (Free Spark tier via REST API)
 *  3. Cloud Sync Adapter for Supabase (Free tier PostgreSQL via REST API)
 */

const DB_NAME = 'TausugTranslatorDB';
const DB_VERSION = 2;

// Default initial English <-> Tausug dictionary with phonetics
const DEFAULT_DICTIONARY = [
    // Greetings & Courtesies
    { english: "hello", tausug: "assalamu alaykum", phonetic: "assa-la-moo ah-lay-koom", category: "greetings" },
    { english: "hi", tausug: "kumusta", phonetic: "koo-moos-tah", category: "greetings" },
    { english: "good morning", tausug: "marayaw mahinaat", phonetic: "ma-ra-yaw ma-he-na-at", category: "greetings" },
    { english: "good afternoon", tausug: "marayaw mahapun", phonetic: "ma-ra-yaw ma-ha-poon", category: "greetings" },
    { english: "good day", tausug: "marayaw adlaw", phonetic: "ma-ra-yaw ad-lau", category: "greetings" },
    { english: "good evening", tausug: "marayaw dum", phonetic: "ma-ra-yaw doom", category: "greetings" },
    { english: "good night", tausug: "marayaw dum", phonetic: "ma-ra-yaw doom", category: "greetings" },
    { english: "how are you", tausug: "biyariin kaw", phonetic: "be-ya-riin kau", category: "greetings" },
    { english: "how is it", tausug: "biyariin", phonetic: "be-ya-riin", category: "greetings" },
    { english: "i am fine", tausug: "marayaw da aku", phonetic: "ma-ra-yaw dah ah-koo", category: "greetings" },
    { english: "thank you", tausug: "magsukul", phonetic: "mag-soo-kul", category: "greetings" },
    { english: "thanks", tausug: "magsukul", phonetic: "mag-soo-kul", category: "greetings" },
    { english: "thank you very much", tausug: "magsukul mataud", phonetic: "mag-soo-kul ma-ta-ood", category: "greetings" },
    { english: "you are welcome", tausug: "way ruma", phonetic: "why roo-mah", category: "greetings" },
    { english: "please", tausug: "tabi", phonetic: "tah-be", category: "greetings" },
    { english: "excuse me", tausug: "maap", phonetic: "mah-ap", category: "greetings" },
    { english: "sorry", tausug: "maap", phonetic: "mah-ap", category: "greetings" },
    { english: "yes", tausug: "huun", phonetic: "hoo-oon", category: "common" },
    { english: "no", tausug: "di", phonetic: "dih", category: "common" },
    { english: "goodbye", tausug: "manaw na aku", phonetic: "ma-now nah ah-koo", category: "greetings" },
    { english: "take care", tausug: "ayaw kaw kalupahi", phonetic: "ah-yaw kau ka-loo-pah-he", category: "greetings" },

    // Pronouns & Questions
    { english: "i", tausug: "aku", phonetic: "ah-koo", category: "pronouns" },
    { english: "me", tausug: "aku", phonetic: "ah-koo", category: "pronouns" },
    { english: "you", tausug: "ikaw", phonetic: "ee-kau", category: "pronouns" },
    { english: "we", tausug: "kita", phonetic: "kee-tah", category: "pronouns" },
    { english: "they", tausug: "sila", phonetic: "see-lah", category: "pronouns" },
    { english: "he", tausug: "siya", phonetic: "see-yah", category: "pronouns" },
    { english: "she", tausug: "siya", phonetic: "see-yah", category: "pronouns" },
    { english: "what", tausug: "unu", phonetic: "oo-noo", category: "questions" },
    { english: "who", tausug: "hisiyu", phonetic: "hee-see-yoo", category: "questions" },
    { english: "where", tausug: "hain", phonetic: "hah-een", category: "questions" },
    { english: "when", tausug: "ku'nu", phonetic: "koo-noo", category: "questions" },
    { english: "why", tausug: "mayta", phonetic: "my-tah", category: "questions" },
    { english: "how", tausug: "biyariin", phonetic: "be-ya-riin", category: "questions" },

    // Grammar & Connectors
    { english: "the", tausug: "in", phonetic: "in", category: "grammar" },
    { english: "and", tausug: "iban", phonetic: "ee-ban", category: "grammar" },
    { english: "is", tausug: "hiya", phonetic: "he-ya", category: "grammar" },
    { english: "are", tausug: "ka", phonetic: "ka", category: "grammar" },
    { english: "a", tausug: "hambuuk", phonetic: "humbu-UK", category: "grammar" },

    // Daily Living & Environment
    { english: "world", tausug: "dunya", phonetic: "doon-YAH", category: "nature" },
    { english: "house", tausug: "bay", phonetic: "bai", category: "places" },
    { english: "water", tausug: "tubig", phonetic: "too-beeg", category: "food" },
    { english: "food", tausug: "pagkaun", phonetic: "pag-ka-oon", category: "food" },
    { english: "eat", tausug: "kumaun", phonetic: "koo-ma-oon", category: "verbs" },
    { english: "drink", tausug: "uminum", phonetic: "oo-mee-noom", category: "verbs" },
    { english: "friend", tausug: "bagani", phonetic: "bah-gah-nee", category: "people" },
    { english: "family", tausug: "tumpuk", phonetic: "toom-pook", category: "people" },
    { english: "love", tausug: "lasa", phonetic: "lah-sah", category: "emotions" },
    { english: "beautiful", tausug: "malingkat", phonetic: "ma-leeng-kat", category: "adjectives" },
    { english: "good", tausug: "marayaw", phonetic: "ma-ra-YAW", category: "adjectives" },
    { english: "happy", tausug: "kawa'an", phonetic: "kah-wah-an", category: "emotions" },
    { english: "day", tausug: "adlaw", phonetic: "ad-lau", category: "time" },
    { english: "night", tausug: "dum", phonetic: "doom", category: "time" },
    { english: "today", tausug: "bihaini", phonetic: "be-hah-ee-nee", category: "time" },
    { english: "tomorrow", tausug: "kunsun", phonetic: "koon-soon", category: "time" },
    { english: "money", tausug: "sin", phonetic: "seen", category: "daily" },
    { english: "market", tausug: "tabu", phonetic: "tah-boo", category: "places" },
    { english: "go", tausug: "kawa", phonetic: "kah-wah", category: "verbs" },
    { english: "come", tausug: "kari", phonetic: "kah-ree", category: "verbs" },
    { english: "speak", tausug: "himumungan", phonetic: "hee-moo-moong-an", category: "verbs" },
    { english: "listen", tausug: "dungog", phonetic: "doong-og", category: "verbs" },

    // Numbers
    { english: "one", tausug: "isa", phonetic: "ee-sah", category: "numbers" },
    { english: "two", tausug: "duwa", phonetic: "doo-wah", category: "numbers" },
    { english: "three", tausug: "tu", phonetic: "too", category: "numbers" },
    { english: "four", tausug: "upat", phonetic: "oo-pat", category: "numbers" },
    { english: "five", tausug: "lima", phonetic: "lee-mah", category: "numbers" },
    { english: "six", tausug: "unum", phonetic: "oo-noom", category: "numbers" },
    { english: "seven", tausug: "pitu", phonetic: "pee-too", category: "numbers" },
    { english: "eight", tausug: "walu", phonetic: "wah-loo", category: "numbers" },
    { english: "nine", tausug: "siyam", phonetic: "see-yam", category: "numbers" },
    { english: "ten", tausug: "hangpu", phonetic: "hang-poo", category: "numbers" }
];

class DatabaseManager {
    constructor() {
        this.db = null;
        this.isReady = false;
        this.cloudConfig = this.loadCloudConfig();
    }

    /**
     * Initialize IndexedDB and seed initial vocabulary
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Dictionary Store
                if (!db.objectStoreNames.contains('dictionary')) {
                    const dictStore = db.createObjectStore('dictionary', { keyPath: 'id', autoIncrement: true });
                    dictStore.createIndex('english', 'english', { unique: false });
                    dictStore.createIndex('tausug', 'tausug', { unique: false });
                    dictStore.createIndex('category', 'category', { unique: false });
                }

                // History Store
                if (!db.objectStoreNames.contains('history')) {
                    const histStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
                    histStore.createIndex('timestamp', 'timestamp', { unique: false });
                    histStore.createIndex('favorite', 'favorite', { unique: false });
                }

                // Settings Store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // AI Models Cache Store (Piper ONNX Models & Data)
                if (!db.objectStoreNames.contains('models')) {
                    db.createObjectStore('models', { keyPath: 'id' });
                }
            };

            request.onsuccess = async (event) => {
                this.db = event.target.result;
                this.isReady = true;
                await this.seedDefaultsIfNeeded();
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("IndexedDB initialization error:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Seed initial vocabulary if dictionary is empty
     */
    async seedDefaultsIfNeeded() {
        const count = await this.getDictionaryCount();
        if (count === 0) {
            console.log("Seeding default English-Tausug dictionary into IndexedDB...");
            const tx = this.db.transaction('dictionary', 'readwrite');
            const store = tx.objectStore('dictionary');
            for (const item of DEFAULT_DICTIONARY) {
                store.add({
                    english: item.english.toLowerCase().trim(),
                    tausug: item.tausug.toLowerCase().trim(),
                    phonetic: item.phonetic,
                    category: item.category || 'general',
                    createdAt: Date.now()
                });
            }
            await new Promise(res => tx.oncomplete = res);
        }
    }

    async getDictionaryCount() {
        return new Promise((resolve) => {
            const tx = this.db.transaction('dictionary', 'readonly');
            const store = tx.objectStore('dictionary');
            const req = store.count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(0);
        });
    }

    /**
     * Retrieve all dictionary words
     */
    async getAllWords() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('dictionary', 'readonly');
            const store = tx.objectStore('dictionary');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Add a new word to the dictionary
     */
    async addWord(english, tausug, phonetic = '', category = 'custom') {
        const entry = {
            english: english.toLowerCase().trim(),
            tausug: tausug.toLowerCase().trim(),
            phonetic: phonetic.trim() || tausug.trim(),
            category: category.trim() || 'custom',
            createdAt: Date.now()
        };

        const id = await new Promise((resolve, reject) => {
            const tx = this.db.transaction('dictionary', 'readwrite');
            const store = tx.objectStore('dictionary');
            const req = store.add(entry);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        entry.id = id;

        // Try syncing to cloud if configured
        if (this.cloudConfig.enabled) {
            this.syncWordToCloud(entry).catch(err => console.warn("Cloud sync notice:", err));
        }

        return entry;
    }

    /**
     * Delete a word by ID
     */
    async deleteWord(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('dictionary', 'readwrite');
            const store = tx.objectStore('dictionary');
            const req = store.delete(Number(id));
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * History Operations
     */
    async addHistory(item) {
        const record = {
            inputText: item.inputText,
            outputText: item.outputText,
            phoneticText: item.phoneticText || '',
            direction: item.direction, // 'en-to-tausug' or 'tausug-to-en'
            source: item.source || 'voice', // 'voice' or 'text'
            favorite: false,
            timestamp: Date.now()
        };

        const id = await new Promise((resolve, reject) => {
            const tx = this.db.transaction('history', 'readwrite');
            const store = tx.objectStore('history');
            const req = store.add(record);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        record.id = id;

        // Sync to cloud if configured
        if (this.cloudConfig.enabled) {
            this.syncHistoryToCloud(record).catch(err => console.warn("Cloud history sync:", err));
        }

        return record;
    }

    async getHistory(limit = 50) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('history', 'readonly');
            const store = tx.objectStore('history');
            const req = store.getAll();
            req.onsuccess = () => {
                const results = (req.result || []).sort((a, b) => b.timestamp - a.timestamp);
                resolve(results.slice(0, limit));
            };
            req.onerror = () => reject(req.error);
        });
    }

    async toggleFavorite(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('history', 'readwrite');
            const store = tx.objectStore('history');
            const getReq = store.get(Number(id));
            getReq.onsuccess = () => {
                const item = getReq.result;
                if (!item) return resolve(null);
                item.favorite = !item.favorite;
                const putReq = store.put(item);
                putReq.onsuccess = () => resolve(item.favorite);
                putReq.onerror = () => reject(putReq.error);
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }

    async clearHistory() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('history', 'readwrite');
            const store = tx.objectStore('history');
            const req = store.clear();
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * AI Neural Model Caching in IndexedDB (Persistent & Instant Offline Loading)
     */
    async saveModelBlob(id, buffer) {
        return new Promise((resolve, reject) => {
            try {
                const tx = this.db.transaction('models', 'readwrite');
                const store = tx.objectStore('models');
                const req = store.put({ id, data: buffer, timestamp: Date.now() });
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            } catch (err) {
                console.warn("Failed to cache model in IndexedDB:", err);
                resolve(false);
            }
        });
    }

    async getModelBlob(id) {
        return new Promise((resolve) => {
            try {
                if (!this.db || !this.db.objectStoreNames.contains('models')) {
                    return resolve(null);
                }
                const tx = this.db.transaction('models', 'readonly');
                const store = tx.objectStore('models');
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result ? req.result.data : null);
                req.onerror = () => resolve(null);
            } catch (err) {
                console.warn("Could not query model cache:", err);
                resolve(null);
            }
        });
    }

    /**
     * Backup & Restore JSON
     */
    async exportData() {
        const dictionary = await this.getAllWords();
        const history = await this.getHistory(200);
        return {
            app: "English-Tausug Speech-to-Speech Translator",
            version: 2,
            exportedAt: new Date().toISOString(),
            dictionary,
            history
        };
    }

    async importData(data) {
        if (!data || !Array.isArray(data.dictionary)) {
            throw new Error("Invalid dictionary backup format");
        }
        const tx = this.db.transaction('dictionary', 'readwrite');
        const store = tx.objectStore('dictionary');
        for (const item of data.dictionary) {
            store.add({
                english: item.english.toLowerCase().trim(),
                tausug: item.tausug.toLowerCase().trim(),
                phonetic: item.phonetic || item.tausug,
                category: item.category || 'imported',
                createdAt: Date.now()
            });
        }
        return new Promise(res => tx.oncomplete = res);
    }

    /**
     * Cloud Database Sync (Firebase Firestore / Supabase REST API)
     */
    loadCloudConfig() {
        try {
            const saved = localStorage.getItem('tausug_cloud_db_config');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to load cloud config:", e);
        }
        return {
            type: 'none', // 'firebase', 'supabase', or 'none'
            enabled: false,
            firebaseProjectId: '',
            firebaseApiKey: '',
            supabaseUrl: '',
            supabaseKey: ''
        };
    }

    saveCloudConfig(config) {
        this.cloudConfig = { ...this.cloudConfig, ...config };
        localStorage.setItem('tausug_cloud_db_config', JSON.stringify(this.cloudConfig));
    }

    async testCloudConnection(config = this.cloudConfig) {
        if (config.type === 'firebase') {
            if (!config.firebaseProjectId || !config.firebaseApiKey) {
                throw new Error("Please enter Firebase Project ID and Web API Key.");
            }
            // Ping Firestore REST API (list documents)
            const url = `https://firestore.googleapis.com/v1/projects/${config.firebaseProjectId}/databases/(default)/documents/tausug_dictionary?pageSize=1&key=${config.firebaseApiKey}`;
            const res = await fetch(url);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `Firebase response error (${res.status})`);
            }
            return { success: true, message: "Connected to Firebase Firestore successfully!" };
        } else if (config.type === 'supabase') {
            if (!config.supabaseUrl || !config.supabaseKey) {
                throw new Error("Please enter Supabase Project URL and Anon Public Key.");
            }
            const cleanUrl = config.supabaseUrl.replace(/\/$/, '');
            const res = await fetch(`${cleanUrl}/rest/v1/tausug_dictionary?limit=1`, {
                headers: {
                    'apikey': config.supabaseKey,
                    'Authorization': `Bearer ${config.supabaseKey}`
                }
            });
            if (!res.ok) {
                throw new Error(`Supabase connection error (${res.status}). Verify your URL & API key, and ensure table 'tausug_dictionary' exists.`);
            }
            return { success: true, message: "Connected to Supabase PostgreSQL successfully!" };
        }
        return { success: true, message: "Using local IndexedDB (persistent and 100% free)." };
    }

    async syncWordToCloud(entry) {
        if (!this.cloudConfig.enabled) return;

        if (this.cloudConfig.type === 'firebase') {
            const url = `https://firestore.googleapis.com/v1/projects/${this.cloudConfig.firebaseProjectId}/databases/(default)/documents/tausug_dictionary?key=${this.cloudConfig.firebaseApiKey}`;
            const body = {
                fields: {
                    english: { stringValue: entry.english },
                    tausug: { stringValue: entry.tausug },
                    phonetic: { stringValue: entry.phonetic || '' },
                    category: { stringValue: entry.category || 'general' },
                    createdAt: { integerValue: entry.createdAt.toString() }
                }
            };
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else if (this.cloudConfig.type === 'supabase') {
            const cleanUrl = this.cloudConfig.supabaseUrl.replace(/\/$/, '');
            await fetch(`${cleanUrl}/rest/v1/tausug_dictionary`, {
                method: 'POST',
                headers: {
                    'apikey': this.cloudConfig.supabaseKey,
                    'Authorization': `Bearer ${this.cloudConfig.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    english: entry.english,
                    tausug: entry.tausug,
                    phonetic: entry.phonetic,
                    category: entry.category
                })
            });
        }
    }

    async syncHistoryToCloud(record) {
        if (!this.cloudConfig.enabled) return;
        if (this.cloudConfig.type === 'firebase') {
            const url = `https://firestore.googleapis.com/v1/projects/${this.cloudConfig.firebaseProjectId}/databases/(default)/documents/tausug_history?key=${this.cloudConfig.firebaseApiKey}`;
            const body = {
                fields: {
                    inputText: { stringValue: record.inputText },
                    outputText: { stringValue: record.outputText },
                    phoneticText: { stringValue: record.phoneticText || '' },
                    direction: { stringValue: record.direction },
                    source: { stringValue: record.source },
                    timestamp: { integerValue: record.timestamp.toString() }
                }
            };
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }
    }
}

// Global database instance
window.dbManager = new DatabaseManager();
