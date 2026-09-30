# Suara Tausug: Speech-to-Speech English-Tausug Translation System 🎙️🔊

A real-time, bi-directional voice translation web application that converts **Speech to Text (STT)**, translates between **English** and **Tausug (Bahasa Sūg)** with custom phonetic articulation, and outputs natural **Text to Speech (TTS)**.

Built with a free persistent database architecture and ready for 100% free live hosting via GitHub Pages.

---

## 🌟 Key Features

1. **Speech-to-Text (STT)**:
   - Voice input via browser-native Web Speech Recognition (`window.SpeechRecognition` / `window.webkitSpeechRecognition`).
   - Real-time animated audio wave visualizer and mic pulse indicator.
   - Interim transcript display and silence auto-detection.

2. **Bidirectional Translation Engine**:
   - English ➔ Tausug (Bahasa Sūg) & Tausug ➔ English.
   - Intelligent phrase prioritization (matches multi-word phrases before individual words).
   - Case-preservation and phonetic guide generation.

3. **Text-to-Speech (TTS) with Custom Phonetics**:
   - Synthesizes translated speech using Web Speech Synthesis API.
   - Custom Tausug phonetic mapping engine (`makeTausugPronunciation`) ensuring natural articulation.
   - Speed rate controls (0.75x to 1.15x), pitch adjustment, and stop/replay controls.
   - **Auto-Speak mode**: Automatically speaks translated audio as soon as voice recognition finishes.

4. **100% Free Database Layer**:
   - **Local IndexedDB (Default & Active)**: Built-in browser database requiring **zero setup**, **no API keys**, and **no monthly cost**. Stores vocabulary, custom words, and translation history offline & online.
   - **Google Firebase Firestore (Optional Cloud Sync)**: Free Spark tier support for real-time multi-device synchronization via REST API.
   - **Supabase (Optional Cloud Sync)**: Free tier PostgreSQL support.
   - **JSON Backup**: One-click Export and Import of dictionary and history.

5. **Free Live Hosting via GitHub Pages**:
   - Zero-server static architecture running directly on GitHub Pages.
   - Automated deployment workflow via GitHub Actions (`.github/workflows/deploy.yml`).
   - Free HTTPS SSL (essential for browser microphone access).

---

## 🚀 How to Enable Free Live Hosting on GitHub Pages

This repository is already configured to deploy on GitHub Pages:

### Method 1: GitHub Settings (Instant)
1. Open your repository on GitHub: [`Myboyluke/TranslatorV2`](https://github.com/Myboyluke/TranslatorV2).
2. Click **Settings** ➔ **Pages** (under "Code and automation" in the left sidebar).
3. Under **"Build and deployment"**:
   - Source: **Deploy from a branch**
   - Branch: **`translator`** (or `main`), Folder: **`/ (root)`**
4. Click **Save**.
5. Within 1–2 minutes, your live site will be accessible at:
   ```
   https://myboyluke.github.io/TranslatorV2/
   ```

### Method 2: GitHub Actions (Automated CI/CD)
The `.github/workflows/deploy.yml` workflow is included. Under **Settings ➔ Pages ➔ Source**, select **GitHub Actions**, and every push to `translator` or `main` will build and publish automatically.

---

## 🗄️ Free Database Configuration

### 1. Browser IndexedDB (Zero Setup)
No configuration required! When you open the application, it automatically seeds over 50+ English-Tausug terms into an IndexedDB database on your device. All additions, deletions, and history logs persist automatically.

### 2. Optional: Connect Free Firebase Firestore
If you want your vocabulary to sync to the cloud:
1. Go to the [Firebase Console](https://console.firebase.google.com/) (100% free Spark plan).
2. Create a project and enable **Cloud Firestore**.
3. Under Project Settings, copy your **Project ID** and **Web API Key**.
4. In Suara Tausug, switch to the **"Free Database"** tab, select **Google Firebase Firestore**, paste your keys, and click **"Test & Save Database Settings"**.

---

## 🛠️ Project Structure

```
TranslatorV2/
├── index.html                  # Accessible modern responsive UI
├── Styles_TTS.css              # Glassmorphic dark theme & audio visualizer
├── db.js                       # IndexedDB & cloud sync database manager
├── stt.js                      # Speech-to-Text engine (Web Speech API)
├── tts.js                      # Text-to-Speech engine & custom phonetics
├── translator.js               # Bidirectional translation & phonetic compiler
├── app.js                      # Application coordinator & event bindings
├── .github/workflows/
│   └── deploy.yml              # GitHub Pages deployment automation
└── README.md                   # Documentation & hosting guide
```

---

## 💻 Local Testing

You can preview the app locally by launching any static file server:

```powershell
# Using Node
npx serve .

# Or simply open index.html in Google Chrome or Microsoft Edge
```

> **Note on Microphone Permissions**: Web browsers require either `http://localhost` or a secure `https://` origin (like GitHub Pages) to grant microphone access for Speech-to-Text.
