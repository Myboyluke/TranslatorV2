/**
 * Text-to-Speech (TTS) Module
 * Handles speech synthesis with intelligent phonetic replacement for Tausug
 */

class TextToSpeechEngine {
    constructor() {
        this.supported = 'speechSynthesis' in window;
        this.synth = this.supported ? window.speechSynthesis : null;
        this.voices = [];
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.onStartCallback = null;
        this.onEndCallback = null;

        if (this.supported) {
            this.loadVoices();
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = () => this.loadVoices();
            }
        }
    }

    loadVoices() {
        if (!this.synth) return [];
        this.voices = this.synth.getVoices() || [];
        return this.voices;
    }

    getVoices() {
        if (!this.voices || this.voices.length === 0) {
            this.loadVoices();
        }
        return this.voices;
    }

    /**
     * Pick best voice based on preferred language or regional match
     */
    findBestVoice(isTausug = false) {
        const voices = this.getVoices();
        if (!voices || voices.length === 0) return null;

        if (isTausug) {
            // For Tausug, voices with Austronesian/Southeast Asian phonetic cadence work best
            // e.g., Tagalog (fil-PH), Indonesian (id-ID), Malay (ms-MY), English PH (en-PH)
            const preferred = voices.find(v => 
                v.lang.startsWith('fil') || 
                v.lang.startsWith('tl') || 
                v.lang.toLowerCase().includes('philippine') ||
                v.lang.startsWith('id') || 
                v.lang.startsWith('ms')
            );
            if (preferred) return preferred;
        }

        // Default to natural English voice
        return voices.find(v => v.lang.startsWith('en-US') && !v.name.includes('Google') === false) ||
               voices.find(v => v.lang.startsWith('en-US')) ||
               voices.find(v => v.lang.startsWith('en')) ||
               voices[0] || null;
    }

    /**
     * Convert Tausug text into phonetic speech guides if phonetic hints exist
     */
    prepareSpeechText(text, isTausug, phoneticGuide = '') {
        if (!isTausug) return text;

        if (phoneticGuide && phoneticGuide.trim().length > 0) {
            return phoneticGuide;
        }

        // Natural phonetic softening for Tausug phonemes when synthesized by standard TTS
        let prepared = text.toLowerCase();
        prepared = prepared.replace(/\bhuun\b/g, 'hoo-oon');
        prepared = prepared.replace(/\bmagsukul\b/g, 'mag-soo-kul');
        prepared = prepared.replace(/\bmarayaw\b/g, 'ma-ra-yaw');
        prepared = prepared.replace(/\bbiyariin\b/g, 'be-ya-riin');
        prepared = prepared.replace(/\bdunya\b/g, 'doon-yah');
        prepared = prepared.replace(/\bhambuuk\b/g, 'humbu-uk');
        prepared = prepared.replace(/\btabi\b/g, 'ta-be');
        prepared = prepared.replace(/\bku'nu\b/g, 'koo-noo');
        prepared = prepared.replace(/\bmayta\b/g, 'my-tah');
        prepared = prepared.replace(/\bmanaw\b/g, 'ma-now');
        prepared = prepared.replace(/\bmalingkat\b/g, 'ma-leeng-kat');
        return prepared;
    }

    speak(text, { 
        isTausug = false, 
        phoneticOverride = '', 
        rate = 0.85, 
        pitch = 1.0, 
        voice = null, 
        onStart = null, 
        onEnd = null, 
        onError = null 
    } = {}) {
        if (!this.supported) {
            if (onError) onError("Text-to-Speech is not supported in this browser.");
            return;
        }

        this.cancel();

        const speechString = this.prepareSpeechText(text, isTausug, phoneticOverride);
        const utterance = new SpeechSynthesisUtterance(speechString);

        utterance.rate = rate;
        utterance.pitch = pitch;

        const selectedVoice = voice || this.findBestVoice(isTausug);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.currentUtterance = utterance;
            if (onStart) onStart();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            console.warn("TTS Error:", e);
            if (onError) onError(e);
        };

        this.synth.speak(utterance);
    }

    pause() {
        if (this.synth && this.isSpeaking) {
            this.synth.pause();
        }
    }

    resume() {
        if (this.synth && this.synth.paused) {
            this.synth.resume();
        }
    }

    cancel() {
        if (this.synth) {
            this.synth.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
        }
    }
}

window.ttsEngine = new TextToSpeechEngine();
