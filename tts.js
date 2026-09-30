/**
 * Text-to-Speech (TTS) Module with Piper TTS Neural Model Integration
 * Supports:
 *  1. Piper Neural TTS (Local WebAssembly + ONNX Runtime via @realtimex/piper-tts-web)
 *  2. Browser-native Web Speech API (Instant zero-download fallback)
 */

class PiperEngine {
    constructor() {
        this.lib = null;
        this.isLoadingLib = false;
        this.currentAudio = null;
        this.isSynthesizing = false;
        this.isPlaying = false;
        this.downloadProgress = 0;
        this.cachedVoices = new Set();
        this.currentVoiceId = 'en_US-lessac-medium';

        // Available high quality Piper models
        this.availableVoices = [
            { id: 'en_US-lessac-medium', name: 'Piper Lessac (Natural Medium)', quality: 'High', size: '~25MB' },
            { id: 'en_US-hfc_female-medium', name: 'Piper HFC Female (Expressive)', quality: 'High', size: '~26MB' },
            { id: 'en_US-amy-low', name: 'Piper Amy (Compact Fast)', quality: 'Low / Fast', size: '~14MB' },
            { id: 'en_US-ryan-medium', name: 'Piper Ryan (Natural Male)', quality: 'High', size: '~28MB' }
        ];
    }

    /**
     * Dynamically load the Piper TTS library from CDN
     */
    async loadLibrary() {
        if (this.lib) return this.lib;
        if (this.isLoadingLib) {
            while (this.isLoadingLib) {
                await new Promise(r => setTimeout(r, 100));
            }
            return this.lib;
        }

        this.isLoadingLib = true;
        try {
            console.log("Loading Piper TTS Web module via esm.sh...");
            // Load via esm.sh bundle
            const mod = await import('https://esm.sh/@realtimex/piper-tts-web@1.1.1');
            this.lib = mod;
            console.log("Piper TTS Web module successfully loaded!");
            await this.refreshStoredVoices();
            return this.lib;
        } catch (err) {
            console.warn("Failed to load Piper TTS Web from esm.sh, trying fallback unpkg:", err);
            try {
                const mod = await import('https://unpkg.com/@realtimex/piper-tts-web@1.1.1/dist/piper-tts-web.js');
                this.lib = mod;
                await this.refreshStoredVoices();
                return this.lib;
            } catch (err2) {
                console.error("Could not load Piper TTS library:", err2);
                throw new Error("Could not initialize Piper TTS WebAssembly runtime. Check your internet connection.");
            }
        } finally {
            this.isLoadingLib = false;
        }
    }

    async refreshStoredVoices() {
        if (!this.lib || typeof this.lib.stored !== 'function') return;
        try {
            const list = await this.lib.stored();
            if (Array.isArray(list)) {
                this.cachedVoices = new Set(list);
            }
        } catch (e) {
            console.warn("Error reading stored Piper voices:", e);
        }
    }

    isVoiceCached(voiceId = this.currentVoiceId) {
        return this.cachedVoices.has(voiceId);
    }

    /**
     * Download and cache the Piper ONNX model into OPFS / browser storage
     */
    async downloadModel(voiceId = this.currentVoiceId, onProgress = null) {
        const tts = await this.loadLibrary();
        if (typeof tts.download !== 'function') {
            console.warn("tts.download is not supported in this bundle version, relying on predict on-demand fetch.");
            return true;
        }

        console.log(`Starting Piper model download for: ${voiceId}`);
        await tts.download(voiceId, (progress) => {
            const percent = progress.total > 0 
                ? Math.round((progress.loaded / progress.total) * 100) 
                : Math.round(progress.loaded / 1024 / 1024);
            this.downloadProgress = percent;
            if (onProgress) onProgress(percent, progress);
        });

        this.cachedVoices.add(voiceId);
        return true;
    }

    /**
     * Synthesize speech to audio Blob using Piper
     */
    async synthesize(text, { voiceId = this.currentVoiceId, onProgress = null } = {}) {
        this.isSynthesizing = true;
        try {
            const tts = await this.loadLibrary();
            console.log(`Synthesizing with Piper TTS (${voiceId}): "${text}"`);
            
            const wavBlob = await tts.predict({
                text,
                voiceId
            }, (progress) => {
                if (onProgress && progress) {
                    const percent = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;
                    onProgress(percent, progress);
                }
            });

            this.cachedVoices.add(voiceId);
            return wavBlob;
        } finally {
            this.isSynthesizing = false;
        }
    }

    /**
     * Play synthesized WAV audio blob with event callbacks
     */
    playAudio(wavBlob, { onStart = null, onEnd = null, onError = null } = {}) {
        this.stop();

        const url = URL.createObjectURL(wavBlob);
        const audio = new Audio(url);
        this.currentAudio = audio;

        audio.onplay = () => {
            this.isPlaying = true;
            if (onStart) onStart();
        };

        audio.onended = () => {
            this.isPlaying = false;
            URL.revokeObjectURL(url);
            this.currentAudio = null;
            if (onEnd) onEnd();
        };

        audio.onerror = (e) => {
            this.isPlaying = false;
            URL.revokeObjectURL(url);
            this.currentAudio = null;
            console.error("Piper audio playback error:", e);
            if (onError) onError(e);
        };

        audio.play().catch(err => {
            this.isPlaying = false;
            if (onError) onError(err);
        });
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.isPlaying = false;
    }
}

/**
 * Main Unified TextToSpeech Engine
 * Automatically orchestrates between Piper Neural TTS and Browser Web Speech API
 */
class TextToSpeechEngine {
    constructor() {
        this.piper = new PiperEngine();
        this.supported = 'speechSynthesis' in window;
        this.synth = this.supported ? window.speechSynthesis : null;
        this.voices = [];
        this.isSpeaking = false;
        this.activeEngine = 'piper'; // 'piper' or 'browser'

        if (this.supported) {
            this.loadBrowserVoices();
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = () => this.loadBrowserVoices();
            }
        }
    }

    loadBrowserVoices() {
        if (!this.synth) return [];
        this.voices = this.synth.getVoices() || [];
        return this.voices;
    }

    getBrowserVoices() {
        if (!this.voices || this.voices.length === 0) {
            this.loadBrowserVoices();
        }
        return this.voices;
    }

    findBestBrowserVoice(isTausug = false) {
        const voices = this.getBrowserVoices();
        if (!voices || voices.length === 0) return null;

        if (isTausug) {
            const preferred = voices.find(v => 
                v.lang.startsWith('fil') || 
                v.lang.startsWith('tl') || 
                v.lang.toLowerCase().includes('philippine') ||
                v.lang.startsWith('id') || 
                v.lang.startsWith('ms')
            );
            if (preferred) return preferred;
        }

        return voices.find(v => v.lang.startsWith('en-US') && !v.name.includes('Google') === false) ||
               voices.find(v => v.lang.startsWith('en-US')) ||
               voices.find(v => v.lang.startsWith('en')) ||
               voices[0] || null;
    }

    prepareSpeechText(text, isTausug, phoneticGuide = '') {
        if (!isTausug) return text;

        if (phoneticGuide && phoneticGuide.trim().length > 0) {
            return phoneticGuide;
        }

        // Tausug phonetic mapping
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

    /**
     * Unified Speak: Dispatches to Piper Neural TTS or Web Speech API
     */
    async speak(text, { 
        isTausug = false, 
        phoneticOverride = '', 
        rate = 0.85, 
        pitch = 1.0, 
        piperVoiceId = null,
        onStart = null, 
        onEnd = null, 
        onError = null,
        onModelProgress = null
    } = {}) {
        this.cancel();

        const speechString = this.prepareSpeechText(text, isTausug, phoneticOverride);

        // Option A: Piper Neural TTS
        if (this.activeEngine === 'piper') {
            try {
                const voiceId = piperVoiceId || this.piper.currentVoiceId;
                
                // Show synthesizing status if callback provided
                if (onModelProgress) onModelProgress({ status: 'synthesizing', progress: 0 });

                const wavBlob = await this.piper.synthesize(speechString, {
                    voiceId,
                    onProgress: (percent) => {
                        if (onModelProgress) onModelProgress({ status: 'downloading', progress: percent });
                    }
                });

                if (onModelProgress) onModelProgress({ status: 'playing', progress: 100 });

                this.isSpeaking = true;
                this.piper.playAudio(wavBlob, {
                    onStart: () => {
                        this.isSpeaking = true;
                        if (onStart) onStart();
                    },
                    onEnd: () => {
                        this.isSpeaking = false;
                        if (onEnd) onEnd();
                    },
                    onError: (err) => {
                        this.isSpeaking = false;
                        console.warn("Piper playback failed, falling back to browser TTS:", err);
                        this.speakBrowser(speechString, { isTausug, rate, pitch, onStart, onEnd, onError });
                    }
                });
                return;
            } catch (err) {
                console.warn("Piper Neural TTS failed or model unavailable, falling back to browser speech synthesis:", err);
                if (window.showAppToast) {
                    window.showAppToast("Piper Neural Voice unavailable, using browser TTS fallback", "info");
                }
                // Seamless fallback to browser speech synthesis
                this.speakBrowser(speechString, { isTausug, rate, pitch, onStart, onEnd, onError });
                return;
            }
        }

        // Option B: Standard Browser Web Speech API
        this.speakBrowser(speechString, { isTausug, rate, pitch, onStart, onEnd, onError });
    }

    speakBrowser(speechString, { isTausug, rate, pitch, onStart, onEnd, onError }) {
        if (!this.supported) {
            if (onError) onError("Text-to-Speech is not supported in this browser.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(speechString);
        utterance.rate = rate;
        utterance.pitch = pitch;

        const voice = this.findBestBrowserVoice(isTausug);
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            if (onStart) onStart();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            this.isSpeaking = false;
            console.warn("Browser TTS Error:", e);
            if (onError) onError(e);
        };

        this.synth.speak(utterance);
    }

    cancel() {
        this.isSpeaking = false;
        if (this.piper) {
            this.piper.stop();
        }
        if (this.synth) {
            this.synth.cancel();
        }
    }
}

window.ttsEngine = new TextToSpeechEngine();
