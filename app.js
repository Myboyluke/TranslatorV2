/**
 * Suara Tausug - Main Application Controller
 * Handles STT -> Translate -> TTS orchestration, database UI, and settings
 */

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const elements = {
        directionSelect: document.getElementById('directionSelect'),
        swapDirectionBtn: document.getElementById('swapDirectionBtn'),
        inputText: document.getElementById('inputText'),
        clearInputBtn: document.getElementById('clearInputBtn'),
        micButton: document.getElementById('micButton'),
        micStatus: document.getElementById('micStatus'),
        visualizer: document.getElementById('visualizer'),
        translateBtn: document.getElementById('translateBtn'),
        autoSpeakToggle: document.getElementById('autoSpeakToggle'),
        
        // Output Elements
        outputCard: document.getElementById('outputCard'),
        outputText: document.getElementById('outputText'),
        phoneticBadge: document.getElementById('phoneticBadge'),
        phoneticText: document.getElementById('phoneticText'),
        speakBtn: document.getElementById('speakBtn'),
        stopBtn: document.getElementById('stopBtn'),
        copyBtn: document.getElementById('copyBtn'),
        favoriteBtn: document.getElementById('favoriteBtn'),
        speedRateSelect: document.getElementById('speedRateSelect'),
        speakerVisualizer: document.getElementById('speakerVisualizer'),

        // Tabs & Views
        tabButtons: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),

        // Dictionary elements
        dictSearchInput: document.getElementById('dictSearchInput'),
        dictTableBody: document.getElementById('dictTableBody'),
        dictCountBadge: document.getElementById('dictCountBadge'),
        addWordBtn: document.getElementById('addWordBtn'),
        addWordModal: document.getElementById('addWordModal'),
        closeWordModalBtn: document.getElementById('closeWordModalBtn'),
        addWordForm: document.getElementById('addWordForm'),
        exportDictBtn: document.getElementById('exportDictBtn'),
        importDictInput: document.getElementById('importDictInput'),

        // History elements
        historyList: document.getElementById('historyList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        historyFilter: document.getElementById('historyFilter'),

        // Cloud DB elements
        cloudDbForm: document.getElementById('cloudDbForm'),
        cloudDbType: document.getElementById('cloudDbType'),
        firebaseFields: document.getElementById('firebaseFields'),
        supabaseFields: document.getElementById('supabaseFields'),
        firebaseProjectId: document.getElementById('firebaseProjectId'),
        firebaseApiKey: document.getElementById('firebaseApiKey'),
        supabaseUrl: document.getElementById('supabaseUrl'),
        supabaseKey: document.getElementById('supabaseKey'),
        testCloudDbBtn: document.getElementById('testCloudDbBtn'),
        cloudDbStatus: document.getElementById('cloudDbStatus'),
        dbModeBadge: document.getElementById('dbModeBadge'),

        // Toast
        toast: document.getElementById('toast')
    };

    // State
    let currentTranslation = null;
    let isListening = false;
    let isSpeaking = false;

    // Show Toast Notification
    function showToast(message, type = 'info') {
        if (!elements.toast) return;
        elements.toast.textContent = message;
        elements.toast.className = `toast show ${type}`;
        setTimeout(() => {
            elements.toast.className = 'toast';
        }, 3500);
    }

    // Initialize Database & Engine
    try {
        await window.dbManager.init();
        await window.translatorEngine.loadDictionary();
        updateDbBadge();
        loadDictionaryView();
        loadHistoryView();
        populateCloudDbForm();
    } catch (err) {
        console.error("Initialization error:", err);
        showToast("Error initializing local database: " + err.message, "error");
    }

    // Update Database Status Badge in Header
    function updateDbBadge() {
        const config = window.dbManager.cloudConfig;
        if (config && config.enabled && config.type !== 'none') {
            elements.dbModeBadge.innerHTML = `<span class="badge-dot pulse-green"></span> Cloud DB: ${config.type.toUpperCase()}`;
            elements.dbModeBadge.className = 'status-badge online';
        } else {
            elements.dbModeBadge.innerHTML = `<span class="badge-dot green"></span> Local DB: IndexedDB (Free)`;
            elements.dbModeBadge.className = 'status-badge ready';
        }
    }

    /**
     * Speech-to-Text Handling
     */
    if (elements.micButton) {
        if (!window.sttEngine.isAvailable()) {
            elements.micStatus.innerHTML = `<span style="color:#ef4444">⚠️ Speech recognition not supported in this browser. Please use Google Chrome or Microsoft Edge.</span>`;
            elements.micButton.classList.add('disabled');
        }

        elements.micButton.addEventListener('click', () => {
            if (!window.sttEngine.isAvailable()) {
                showToast("Speech Recognition requires Google Chrome, Edge, or Safari.", "warning");
                return;
            }

            if (isListening) {
                window.sttEngine.stop();
                return;
            }

            // If audio is currently speaking, stop it
            if (isSpeaking) {
                window.ttsEngine.cancel();
            }

            const direction = elements.directionSelect.value;
            // Web Speech API language code
            const lang = direction === 'en-to-tausug' ? 'en-US' : 'fil-PH';

            window.sttEngine.start({
                lang,
                onStart: () => {
                    isListening = true;
                    elements.micButton.classList.add('recording');
                    elements.micStatus.innerHTML = `<span class="listening-pulse"></span> <strong>Listening...</strong> Speak clearly now`;
                    elements.visualizer.classList.add('active');
                },
                onInterim: (interim) => {
                    elements.inputText.value = interim;
                },
                onResult: (finalText) => {
                    elements.inputText.value = finalText;
                    executeTranslation(finalText, 'voice');
                },
                onEnd: () => {
                    isListening = false;
                    elements.micButton.classList.remove('recording');
                    elements.micStatus.textContent = 'Click mic or press Space to speak';
                    elements.visualizer.classList.remove('active');
                },
                onError: (message) => {
                    isListening = false;
                    elements.micButton.classList.remove('recording');
                    elements.micStatus.textContent = 'Speech stopped';
                    elements.visualizer.classList.remove('active');
                    showToast(message, 'warning');
                }
            });
        });
    }

    /**
     * Perform Translation & Optional Auto-Speech
     */
    async function executeTranslation(textToTranslate = null, source = 'text') {
        const text = (textToTranslate !== null ? textToTranslate : elements.inputText.value).trim();
        if (!text) {
            showToast("Please enter or speak some text first", "warning");
            return;
        }

        const direction = elements.directionSelect.value;
        const result = window.translatorEngine.translate(text, direction);

        currentTranslation = {
            inputText: text,
            outputText: result.translated,
            phoneticText: result.phonetic,
            direction,
            source
        };

        // Render to Output Card
        elements.outputText.textContent = result.translated;
        if (result.phonetic && direction === 'en-to-tausug') {
            elements.phoneticText.textContent = result.phonetic;
            elements.phoneticBadge.classList.remove('hidden');
        } else {
            elements.phoneticBadge.classList.add('hidden');
        }

        elements.outputCard.classList.remove('hidden');
        elements.speakBtn.disabled = false;
        elements.stopBtn.disabled = true;

        // Save to Database History
        try {
            await window.dbManager.addHistory(currentTranslation);
            loadHistoryView();
        } catch (e) {
            console.warn("Failed to save history:", e);
        }

        // Auto-Speak if enabled
        if (elements.autoSpeakToggle.checked) {
            playCurrentTTS();
        }
    }

    /**
     * Text-to-Speech Playback
     */
    function playCurrentTTS() {
        if (!currentTranslation || !currentTranslation.outputText) return;

        const isTausug = currentTranslation.direction === 'en-to-tausug';
        const rate = parseFloat(elements.speedRateSelect.value) || 0.85;

        window.ttsEngine.speak(currentTranslation.outputText, {
            isTausug,
            phoneticOverride: currentTranslation.phoneticText,
            rate,
            onStart: () => {
                isSpeaking = true;
                elements.speakBtn.classList.add('playing');
                elements.stopBtn.disabled = false;
                elements.speakerVisualizer.classList.add('active');
            },
            onEnd: () => {
                isSpeaking = false;
                elements.speakBtn.classList.remove('playing');
                elements.stopBtn.disabled = true;
                elements.speakerVisualizer.classList.remove('active');
            },
            onError: (err) => {
                isSpeaking = false;
                elements.speakBtn.classList.remove('playing');
                elements.stopBtn.disabled = true;
                elements.speakerVisualizer.classList.remove('active');
                console.warn("TTS error:", err);
            }
        });
    }

    function stopTTS() {
        window.ttsEngine.cancel();
        isSpeaking = false;
        elements.speakBtn.classList.remove('playing');
        elements.stopBtn.disabled = true;
        elements.speakerVisualizer.classList.remove('active');
    }

    // Audio & Action Listeners
    elements.translateBtn.addEventListener('click', () => executeTranslation(null, 'text'));
    elements.speakBtn.addEventListener('click', playCurrentTTS);
    elements.stopBtn.addEventListener('click', stopTTS);

    // Speed Rate Change
    elements.speedRateSelect.addEventListener('change', () => {
        if (isSpeaking) {
            stopTTS();
            playCurrentTTS();
        }
    });

    // Copy Translation
    elements.copyBtn.addEventListener('click', async () => {
        if (!currentTranslation || !currentTranslation.outputText) return;
        try {
            await navigator.clipboard.writeText(currentTranslation.outputText);
            showToast("Translation copied to clipboard! 📋", "success");
        } catch (e) {
            showToast("Failed to copy text", "error");
        }
    });

    // Direction Swap
    elements.swapDirectionBtn.addEventListener('click', () => {
        const current = elements.directionSelect.value;
        const newDirection = current === 'en-to-tausug' ? 'tausug-to-en' : 'en-to-tausug';
        elements.directionSelect.value = newDirection;

        // If there is translated output, swap it into input
        if (elements.outputText.textContent && elements.outputText.textContent.trim()) {
            const temp = elements.outputText.textContent.trim();
            elements.inputText.value = temp;
            elements.outputCard.classList.add('hidden');
            currentTranslation = null;
        }

        showToast(`Switched to: ${newDirection === 'en-to-tausug' ? 'English ➔ Tausug' : 'Tausug ➔ English'}`);
    });

    // Clear Input
    elements.clearInputBtn.addEventListener('click', () => {
        elements.inputText.value = '';
        elements.outputCard.classList.add('hidden');
        currentTranslation = null;
        stopTTS();
        elements.inputText.focus();
    });

    // Quick phrases pills
    document.querySelectorAll('.phrase-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const phrase = pill.getAttribute('data-phrase');
            const direction = pill.getAttribute('data-direction') || 'en-to-tausug';
            elements.directionSelect.value = direction;
            elements.inputText.value = phrase;
            executeTranslation(phrase, 'text');
        });
    });

    // Enter key inside textarea (Ctrl+Enter or Enter)
    elements.inputText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            executeTranslation(null, 'text');
        }
    });

    /**
     * Tab Navigation
     */
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            elements.tabButtons.forEach(b => b.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const activeContent = document.getElementById(targetTab);
            if (activeContent) activeContent.classList.add('active');

            if (targetTab === 'dictionaryTab') loadDictionaryView();
            if (targetTab === 'historyTab') loadHistoryView();
        });
    });

    /**
     * Dictionary Manager View
     */
    async function loadDictionaryView() {
        try {
            const words = await window.dbManager.getAllWords();
            elements.dictCountBadge.textContent = `${words.length} terms`;

            const query = (elements.dictSearchInput.value || '').toLowerCase().trim();
            const filtered = words.filter(w => 
                w.english.toLowerCase().includes(query) ||
                w.tausug.toLowerCase().includes(query) ||
                (w.category && w.category.toLowerCase().includes(query))
            );

            if (filtered.length === 0) {
                elements.dictTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No matching words found.</td></tr>`;
                return;
            }

            elements.dictTableBody.innerHTML = filtered.map(w => `
                <tr>
                    <td class="font-medium">${escapeHtml(w.english)}</td>
                    <td class="tausug-term">${escapeHtml(w.tausug)}</td>
                    <td><span class="phonetic-chip">${escapeHtml(w.phonetic || w.tausug)}</span></td>
                    <td><span class="category-pill">${escapeHtml(w.category || 'general')}</span></td>
                    <td class="actions-cell">
                        <button class="icon-btn-sm speak-row-btn" data-text="${escapeHtml(w.tausug)}" data-ph="${escapeHtml(w.phonetic || w.tausug)}" title="Listen">🔊</button>
                        <button class="icon-btn-sm delete-row-btn text-danger" data-id="${w.id}" title="Delete">🗑️</button>
                    </td>
                </tr>
            `).join('');

            // Attach row audio listeners
            elements.dictTableBody.querySelectorAll('.speak-row-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const text = btn.getAttribute('data-text');
                    const ph = btn.getAttribute('data-ph');
                    window.ttsEngine.speak(text, { isTausug: true, phoneticOverride: ph });
                });
            });

            // Attach row delete listeners
            elements.dictTableBody.querySelectorAll('.delete-row-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm("Are you sure you want to delete this dictionary entry?")) {
                        await window.dbManager.deleteWord(id);
                        await window.translatorEngine.loadDictionary();
                        loadDictionaryView();
                        showToast("Word removed from dictionary", "info");
                    }
                });
            });
        } catch (e) {
            console.error("Failed to load dictionary view:", e);
        }
    }

    elements.dictSearchInput.addEventListener('input', loadDictionaryView);

    // Add Word Modal
    elements.addWordBtn.addEventListener('click', () => {
        elements.addWordModal.classList.remove('hidden');
    });

    elements.closeWordModalBtn.addEventListener('click', () => {
        elements.addWordModal.classList.add('hidden');
    });

    elements.addWordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const en = document.getElementById('newEnglish').value;
        const ts = document.getElementById('newTausug').value;
        const ph = document.getElementById('newPhonetic').value;
        const cat = document.getElementById('newCategory').value;

        if (!en || !ts) {
            showToast("Please provide both English and Tausug terms", "warning");
            return;
        }

        try {
            await window.dbManager.addWord(en, ts, ph, cat);
            await window.translatorEngine.loadDictionary();
            elements.addWordModal.classList.add('hidden');
            elements.addWordForm.reset();
            loadDictionaryView();
            showToast(`Added "${en} ➔ ${ts}" to dictionary! 🎉`, "success");
        } catch (err) {
            showToast("Failed to add word: " + err.message, "error");
        }
    });

    // Export Dictionary
    elements.exportDictBtn.addEventListener('click', async () => {
        try {
            const data = await window.dbManager.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tausug_translator_backup_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Dictionary & history exported successfully! 💾", "success");
        } catch (err) {
            showToast("Export failed: " + err.message, "error");
        }
    });

    // Import Dictionary
    elements.importDictInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await window.dbManager.importData(data);
            await window.translatorEngine.loadDictionary();
            loadDictionaryView();
            showToast("Dictionary imported successfully! 📥", "success");
        } catch (err) {
            showToast("Failed to import dictionary: " + err.message, "error");
        }
    });

    /**
     * History View
     */
    async function loadHistoryView() {
        try {
            const history = await window.dbManager.getHistory(60);
            const filter = elements.historyFilter ? elements.historyFilter.value : 'all';

            const filtered = filter === 'fav' 
                ? history.filter(h => h.favorite) 
                : history;

            if (filtered.length === 0) {
                elements.historyList.innerHTML = `<div class="empty-state">No translation history recorded yet.</div>`;
                return;
            }

            elements.historyList.innerHTML = filtered.map(item => `
                <div class="history-item">
                    <div class="history-meta">
                        <span class="history-direction">${item.direction === 'en-to-tausug' ? 'EN ➔ Tausug' : 'Tausug ➔ EN'}</span>
                        <span class="history-source">${item.source === 'voice' ? '🎙️ Voice' : '⌨️ Text'}</span>
                        <span class="history-time">${formatDate(item.timestamp)}</span>
                    </div>
                    <div class="history-texts">
                        <div class="history-input">"${escapeHtml(item.inputText)}"</div>
                        <div class="history-output">➜ <strong>${escapeHtml(item.outputText)}</strong></div>
                        ${item.phoneticText ? `<div class="history-ph">Phonetic: <em>${escapeHtml(item.phoneticText)}</em></div>` : ''}
                    </div>
                    <div class="history-actions">
                        <button class="icon-btn-sm play-hist-btn" data-text="${escapeHtml(item.outputText)}" data-dir="${item.direction}" data-ph="${escapeHtml(item.phoneticText || '')}" title="Replay Speech">🔊</button>
                        <button class="icon-btn-sm fav-hist-btn ${item.favorite ? 'is-fav' : ''}" data-id="${item.id}" title="Favorite">⭐</button>
                    </div>
                </div>
            `).join('');

            // History replay listeners
            elements.historyList.querySelectorAll('.play-hist-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const text = btn.getAttribute('data-text');
                    const dir = btn.getAttribute('data-dir');
                    const ph = btn.getAttribute('data-ph');
                    window.ttsEngine.speak(text, {
                        isTausug: dir === 'en-to-tausug',
                        phoneticOverride: ph
                    });
                });
            });

            // History favorite toggle
            elements.historyList.querySelectorAll('.fav-hist-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    await window.dbManager.toggleFavorite(id);
                    loadHistoryView();
                });
            });
        } catch (e) {
            console.error("Failed to load history:", e);
        }
    }

    if (elements.historyFilter) {
        elements.historyFilter.addEventListener('change', loadHistoryView);
    }

    if (elements.clearHistoryBtn) {
        elements.clearHistoryBtn.addEventListener('click', async () => {
            if (confirm("Are you sure you want to clear your translation history?")) {
                await window.dbManager.clearHistory();
                loadHistoryView();
                showToast("History cleared", "info");
            }
        });
    }

    /**
     * Cloud Database Configuration View
     */
    function populateCloudDbForm() {
        const config = window.dbManager.cloudConfig;
        elements.cloudDbType.value = config.type || 'none';
        toggleCloudFields(config.type);

        elements.firebaseProjectId.value = config.firebaseProjectId || '';
        elements.firebaseApiKey.value = config.firebaseApiKey || '';
        elements.supabaseUrl.value = config.supabaseUrl || '';
        elements.supabaseKey.value = config.supabaseKey || '';
    }

    function toggleCloudFields(type) {
        if (type === 'firebase') {
            elements.firebaseFields.classList.remove('hidden');
            elements.supabaseFields.classList.add('hidden');
        } else if (type === 'supabase') {
            elements.supabaseFields.classList.remove('hidden');
            elements.firebaseFields.classList.add('hidden');
        } else {
            elements.firebaseFields.classList.add('hidden');
            elements.supabaseFields.classList.add('hidden');
        }
    }

    elements.cloudDbType.addEventListener('change', (e) => {
        toggleCloudFields(e.target.value);
    });

    elements.cloudDbForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = elements.cloudDbType.value;
        const config = {
            type,
            enabled: type !== 'none',
            firebaseProjectId: elements.firebaseProjectId.value.trim(),
            firebaseApiKey: elements.firebaseApiKey.value.trim(),
            supabaseUrl: elements.supabaseUrl.value.trim(),
            supabaseKey: elements.supabaseKey.value.trim()
        };

        try {
            elements.cloudDbStatus.textContent = "Testing connection...";
            elements.cloudDbStatus.className = "status-message loading";
            
            const result = await window.dbManager.testCloudConnection(config);
            window.dbManager.saveCloudConfig(config);
            updateDbBadge();

            elements.cloudDbStatus.textContent = `✅ ${result.message}`;
            elements.cloudDbStatus.className = "status-message success";
            showToast("Database settings saved successfully! 🚀", "success");
        } catch (err) {
            elements.cloudDbStatus.textContent = `❌ ${err.message}`;
            elements.cloudDbStatus.className = "status-message error";
            showToast("Database connection test failed", "error");
        }
    });

    // Helper functions
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
    }
});
