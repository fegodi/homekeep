# HomeKeep v2.0 - Production Release 🚀

## Deploy to iOS in 5 Minutes

## Quick Deploy to Vercel (Recommended)

### Step 1: Get the Files Ready

Download all the files from this folder. You need:
- `index.html`
- `main.jsx`
- `HomeKeep.jsx`
- `package.json`
- `vite.config.js`
- `icon.svg`

### Step 2: Create App Icons

**Option A: Use the included Icon Generator (Easiest)**
1. Open `generate-icons.html` in your browser
2. Click "Download All Icons" 
3. Put the 3 PNG files in your `public/` folder

**Option B: Online Tool**
1. Go to **[realfavicongenerator.net](https://realfavicongenerator.net)**
2. Upload `icon.svg`
3. Download the package
4. Rename `android-chrome-192x192.png` → `icon-192.png`
5. Rename `android-chrome-512x512.png` → `icon-512.png`
6. Put them in `public/` folder

### Step 3: Create GitHub Repo

1. Go to [github.com/new](https://github.com/new)
2. Name it `homekeep`
3. Click "Create repository"
4. Click "uploading an existing file"
5. Drag in all your files:
   ```
   index.html
   main.jsx
   HomeKeep.jsx
   package.json
   vite.config.js
   icon.svg
   ```
6. Create a folder called `public` and add:
   ```
   public/icon.svg
   public/icon-192.png
   public/icon-512.png
   ```
7. Click "Commit changes"

### Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" → "Continue with GitHub"
3. Click "Add New Project"
4. Find and import `homekeep`
5. Click "Deploy" (Vercel auto-detects Vite)
6. Wait ~60 seconds
7. **Done!** Your app is live at `https://homekeep-xxx.vercel.app`

---

## Install on Your iPhone

1. Open **Safari** on your iPhone
2. Go to your Vercel URL
3. Tap the **Share button** (square with up arrow)
4. Scroll down, tap **"Add to Home Screen"**
5. Tap **Add**

**That's it!** HomeKeep is now on your home screen like a real app.

---

## Custom Domain (Optional)

Want `homekeep.com` or similar?

1. Buy a domain from Namecheap, Google Domains, etc.
2. In Vercel: Project → Settings → Domains
3. Add your domain
4. Update DNS records as Vercel instructs
5. Wait 5-10 minutes for SSL

---

## File Structure

```
homekeep/
├── index.html          # HTML entry point
├── main.jsx            # React bootstrap + storage
├── HomeKeep.jsx        # The entire app
├── package.json        # Dependencies
├── vite.config.js      # Build config + PWA
└── public/
    ├── icon.svg
    ├── icon-192.png
    └── icon-512.png
```

---

## Local Development (Optional)

If you want to run it locally first:

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`

---

## What You're Launching

**HomeKeep v2.0** - Production Release:

### Core Features
- 🏠 Smart 6-step onboarding survey
- ✅ 80+ maintenance task templates
- 📊 Analytics dashboard with health score
- 🌙 Dark mode
- 📱 PWA - Works offline, installable
- 💾 Import/Export backup
- 🔧 Parts tracking with scanner
- 📺 YouTube how-to links
- 📍 Find a Pro nearby

### New in v2.0
- 🔴 **Critical Tasks section** - Overdue + safety-urgent pinned at top
- 📂 **Category View** - Collapsible accordions by task type
- ➕ **Smart Add button** - Browse Templates or Create Custom
- ⚡ **Quick-add** - One-tap to add from templates
- 🔍 **Search everything** - Tasks and templates
- 🏷️ **Smart due indicators** - "2 Overdue · 3 Due Soon" per category

**Categories:**
HVAC, Safety, Plumbing, Kitchen, Laundry, Exterior, Seasonal, Equipment, Electrical

---

## After Launch

1. **Use it yourself** for a week
2. **Share with 5-10 friends/family**
3. **Collect feedback**
4. **Iterate based on what you learn**

---

## Troubleshooting

**"Add to Home Screen" not showing?**
- Must use Safari (not Chrome) on iOS
- Site must be HTTPS (Vercel handles this)

**Build failing?**
- Make sure all files are in the root, not in a subfolder
- Check that you have both icon PNG files in `public/`

**Icons look wrong?**
- Clear Safari cache: Settings → Safari → Clear History
- Remove and re-add the app to home screen

---

Good luck with your launch! 🚀
