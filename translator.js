/**
 * Translation Engine for English <-> Tausug
 * Uses multi-word phrase priority matching, case preservation, and phonetic hint generation
 */

class TranslationEngine {
    constructor() {
        this.enToTausugMap = new Map();
        this.tausugToEnMap = new Map();
        this.phoneticMap = new Map();
        this.isLoaded = false;
    }

    /**
     * Load vocabulary from DB
     */
    async loadDictionary() {
        try {
            const words = await window.dbManager.getAllWords();
            this.enToTausugMap.clear();
            this.tausugToEnMap.clear();
            this.phoneticMap.clear();

            for (const item of words) {
                const en = item.english.toLowerCase().trim();
                const ts = item.tausug.toLowerCase().trim();
                const ph = item.phonetic ? item.phonetic.trim() : ts;

                this.enToTausugMap.set(en, ts);
                this.tausugToEnMap.set(ts, en);
                this.phoneticMap.set(ts, ph);
            }

            this.isLoaded = true;
            return true;
        } catch (err) {
            console.error("Failed to load dictionary into Translation Engine:", err);
            return false;
        }
    }

    /**
     * Helper to match case pattern of original word
     */
    applyCase(original, replacement) {
        if (!replacement || !original) return replacement;
        if (original === original.toUpperCase()) {
            return replacement.toUpperCase();
        }
        if (original[0] === original[0].toUpperCase()) {
            return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement.toLowerCase();
    }

    /**
     * Translate input text based on direction ('en-to-tausug' or 'tausug-to-en')
     */
    translate(text, direction = 'en-to-tausug') {
        if (!text || !text.trim()) {
            return { translated: '', phonetic: '', matchedCount: 0 };
        }

        const isEnToTausug = direction === 'en-to-tausug';
        const sourceMap = isEnToTausug ? this.enToTausugMap : this.tausugToEnMap;

        // Sort keys by length descending to match longest phrases first
        const sortedPhrases = Array.from(sourceMap.keys())
            .sort((a, b) => b.length - a.length);

        let result = text;
        const phoneticReplacements = [];
        let matchedCount = 0;

        for (const phrase of sortedPhrases) {
            const target = sourceMap.get(phrase);
            const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(^|[^a-zA-Z0-9'])${escaped}(?=[^a-zA-Z0-9']|$)`, 'gi');

            if (regex.test(result)) {
                matchedCount++;
                result = result.replace(regex, (match, prefix) => {
                    const originalWord = match.slice(prefix.length);
                    const casedTarget = this.applyCase(originalWord, target);
                    return prefix + casedTarget;
                });

                // If translating to Tausug, collect phonetic hints
                if (isEnToTausug) {
                    const phoneticHint = this.phoneticMap.get(target.toLowerCase());
                    if (phoneticHint) {
                        phoneticReplacements.push({ target, phoneticHint });
                    }
                }
            }
        }

        // Generate full phonetic guide for Tausug output
        let phoneticOutput = '';
        if (isEnToTausug && result) {
            phoneticOutput = result;
            for (const [tsWord, phHint] of this.phoneticMap.entries()) {
                const escaped = tsWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(^|[^a-zA-Z0-9'])${escaped}(?=[^a-zA-Z0-9']|$)`, 'gi');
                phoneticOutput = phoneticOutput.replace(regex, `$1${phHint}`);
            }
        }

        return {
            translated: result,
            phonetic: phoneticOutput !== result ? phoneticOutput : '',
            matchedCount
        };
    }
}

window.translatorEngine = new TranslationEngine();
