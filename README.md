# Suara Tausug: Speech-to-Speech English-Tausug Translation System 🎙️🔊

A real-time, bi-directional voice translation web application that converts **Speech to Text (STT)**, translates between **English** and **Tausug (Bahasa Sūg)** with custom phonetic articulation, and outputs natural **Text to Speech (TTS)**.

Built with a free persistent database architecture and ready for 100% free live hosting via GitHub Pages.

---

## 📖 Quick Start: How to Run This System (For New Users)

Follow these simple step-by-step instructions to run the application on your computer:

### Prerequisites
- A modern web browser: **Google Chrome** or **Microsoft Edge** (recommended for full microphone and speech synthesis support).
- **Node.js** (recommended, download from [nodejs.org](https://nodejs.org/)) OR Python.

---

### Step 1: Download or Clone the Repository
Open your terminal (PowerShell, Command Prompt, or Git Bash) and run:
```bash
git clone https://github.com/Myboyluke/TranslatorV2.git
cd TranslatorV2
git checkout translator
```
*(Or simply download the ZIP file from GitHub and extract it to a folder).*

---

### Step 2: Start the Local Server

Choose **any one** of the following methods to start the local server:

#### Option A: Using Node.js (Easiest & Built-In)
Inside the project folder, simply run:
```bash
node server.js
```
You will see: `Server running at http://127.0.0.1:3000/`.

#### Option B: Using Python (If you have Python installed)
```bash
python -m http.server 3000
```

#### Option C: Using VS Code "Live Server" Extension
1. Open the project folder in **Visual Studio Code**.
2. Install the **"Live Server"** extension (by Ritwick Dey).
3. Right-click on `index.html` and click **"Open with Live Server"**.

---

### Step 3: Open in Your Browser

1. Navigate to:
   ```
   http://127.0.0.1:3000/
   ```
   *(or `http://localhost:3000/`)*
2. **Important**: When prompted by your browser, click **"Allow"** to grant microphone permission.

---

### Step 4: How to Use the System

1. **Speech-to-Speech Translation**:
   - Choose your translation direction: **English ➔ Tausug** or **Tausug ➔ English**.
   - Click the glowing **Microphone button** 🎙️ and speak clearly.
   - The system transcribes your speech into text, translates it, displays the phonetic pronunciation guide, and automatically speaks the translated sentence aloud!
2. **Text-to-Speech (TTS) Voice Engines**:
   - **Standard Browser TTS (Instant)**: Fast, zero-download, natural speech.
   - **Piper Neural TTS (Natural AI)**: State-of-the-art neural AI voice running client-side via WebAssembly.
3. **Dictionary Manager (Tab 2)**:
   - Search the 50+ built-in English-Tausug vocabulary words.
   - Add new custom words or phrases with custom phonetic guides.
   - Export or import your dictionary as a JSON backup.
4. **Translation History (Tab 3)**:
   - View past speech translations, replay audio, or star your favorites.

---

## 🌐 Alternative: Run Live Online (No Installation Needed)

If you have deployed this repository to **GitHub Pages**, anyone can access it directly without installing anything:

1. Open:
   ```
   https://myboyluke.github.io/TranslatorV2/
   ```
2. Allow microphone access when prompted.
3. Use the app on any desktop, laptop, or mobile phone with a modern browser!

---

## 🚀 How to Deploy to GitHub Pages (100% Free Forever)

1. Push the branch to your GitHub repository:
   ```bash
   git push -u origin translator
   ```
2. Open your repository on GitHub: [`Myboyluke/TranslatorV2`](https://github.com/Myboyluke/TranslatorV2).
3. Go to **Settings** ➔ **Pages** (in the left sidebar).
4. Under **"Build and deployment"**:
   - Source: **Deploy from a branch**
   - Branch: **`translator`**, Folder: **`/ (root)`**
   - Click **Save**.
5. Within 1–2 minutes, your live site will be accessible at `https://myboyluke.github.io/TranslatorV2/`.

---

## 🗄️ Database Architecture

- **Browser IndexedDB (100% Free & Active by Default)**: Requires zero accounts, zero API keys, and works offline. Automatically seeds with initial vocabulary and persists all new words and history.
- **Cloud Sync (Optional)**: In the **"Free Database"** tab, you can connect a free Google Firebase Firestore or Supabase database for multi-device synchronization.

---

## ❓ Troubleshooting & FAQs

- **Microphone not working?**
  - Make sure you accessed the site via `http://localhost:3000` or `http://127.0.0.1:3000` (or secure `https://`). Browsers block microphone access on plain `file:///` URLs.
  - Click the **lock/tune icon** in the browser address bar and ensure **Microphone** is set to **"Allow"**.
- **No speech audio?**
  - Ensure your system speakers or headphones are turned on and not muted.
  - Toggle between **Standard Browser TTS** and **Piper Neural TTS** in the voice engine options.
