/**
 * Speech-to-Text (STT) Module
 * Uses Web Speech Recognition API (built-in to Chrome, Edge, Safari)
 */

class SpeechToTextEngine {
    constructor() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.supported = !!SpeechRecognition;
        this.recognition = this.supported ? new SpeechRecognition() : null;
        this.isListening = false;

        this.onStartCallback = null;
        this.onResultCallback = null;
        this.onEndCallback = null;
        this.onErrorCallback = null;
        this.onInterimCallback = null;

        if (this.supported) {
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                this.isListening = true;
                if (this.onStartCallback) this.onStartCallback();
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (interimTranscript && this.onInterimCallback) {
                    this.onInterimCallback(interimTranscript);
                }

                if (finalTranscript && this.onResultCallback) {
                    this.onResultCallback(finalTranscript.trim());
                }
            };

            this.recognition.onerror = (event) => {
                this.isListening = false;
                console.warn("Speech recognition error:", event.error);
                let message = "Speech recognition error: " + event.error;
                if (event.error === 'not-allowed') {
                    message = "Microphone access denied. Please click the lock/settings icon in your browser address bar to allow microphone access.";
                } else if (event.error === 'no-speech') {
                    message = "No speech detected. Please try speaking closer to your microphone.";
                } else if (event.error === 'network') {
                    message = "Network error occurred during speech recognition.";
                }
                if (this.onErrorCallback) this.onErrorCallback(message, event.error);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (this.onEndCallback) this.onEndCallback();
            };
        }
    }

    isAvailable() {
        return this.supported;
    }

    start({ lang = 'en-US', onStart, onResult, onEnd, onError, onInterim } = {}) {
        if (!this.supported) {
            if (onError) onError("Speech Recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
            return;
        }

        if (this.isListening) {
            this.stop();
            return;
        }

        this.onStartCallback = onStart;
        this.onResultCallback = onResult;
        this.onEndCallback = onEnd;
        this.onErrorCallback = onError;
        this.onInterimCallback = onInterim;

        try {
            this.recognition.lang = lang;
            this.recognition.start();
        } catch (err) {
            console.error("Failed to start speech recognition:", err);
            if (onError) onError("Failed to start microphone: " + err.message);
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                // Ignore if already stopped
            }
        }
        this.isListening = false;
    }
}

window.sttEngine = new SpeechToTextEngine();
