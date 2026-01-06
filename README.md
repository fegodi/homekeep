# HomeKeep 🏠

**Never miss a filter change, safety check, or seasonal prep again.**

HomeKeep is a Progressive Web App (PWA) that helps homeowners track and manage home maintenance tasks. It works offline, installs like a native app on iOS/Android, and provides personalized task recommendations based on your home's specific features.

![HomeKeep Screenshot](https://via.placeholder.com/600x400/f85a00/ffffff?text=HomeKeep+v2.0)

## ✨ Features

### Smart Onboarding
- 6-step personalized survey
- Asks about your home type, heating/cooling, water heater, and equipment
- Generates a customized maintenance plan (no generic checklists!)

### Task Management
- **80+ pre-built task templates** across 9 categories
- **Critical section** - Overdue and safety-urgent tasks pinned at top
- **Two view modes** - By Status or By Category
- **Search & filter** - Find any task instantly
- Mark tasks done, snooze, or edit
- Track completion history

### Categories
- 🔵 **HVAC** - Filters, tune-ups, duct cleaning
- 🔴 **Safety** - Smoke detectors, CO detectors, fire extinguishers
- 🔷 **Plumbing** - Water heater, sump pump, leaks
- 🟠 **Kitchen** - Fridge, disposal, dishwasher
- 🟣 **Laundry** - Dryer vent, washer maintenance
- 🟢 **Exterior** - Gutters, roof, deck, lawn
- 🩷 **Seasonal** - Winterization, sprinkler blowout, AC covers
- ⚫ **Equipment** - Lawn mower, snow blower, generator
- 🟡 **Electrical** - GFCI outlets, panel inspection

### Parts Tracking
- Save part numbers and specs for each task
- Scan labels with your camera
- One-tap links to Amazon and Google Shopping

### Analytics Dashboard
- Home health score (0-100)
- 30-day completion tracking
- Streak counter
- 6-month activity chart
- Category breakdown

### PWA Features
- **Works offline** - Full functionality without internet
- **Installable** - Add to home screen on iOS/Android
- **Fast** - Built with Vite for optimal performance
- **Dark mode** - Easy on the eyes

## 🚀 Quick Deploy

### Option 1: Vercel (Recommended)

1. Fork this repo or upload files to a new GitHub repo
2. Go to [vercel.com](https://vercel.com)
3. Import your repo
4. Click Deploy
5. Done! Your app is live.

### Option 2: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the project folder
3. Done!

### Option 3: Any Static Host

```bash
npm install
npm run build
# Upload the `dist` folder to your host
```

## 📱 Install on iPhone

1. Open Safari and go to your deployed URL
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

The app will now appear on your home screen and work like a native app!

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
homekeep/
├── index.html          # Entry HTML with splash screen
├── main.jsx            # React bootstrap + localStorage adapter
├── HomeKeep.jsx        # Main app component (all features)
├── package.json        # Dependencies
├── vite.config.js      # Vite + PWA config
├── vercel.json         # Vercel deployment config
├── generate-icons.html # Tool to generate PNG icons
└── public/
    ├── icon.svg        # Vector icon
    ├── icon-192.png    # PWA icon
    ├── icon-512.png    # PWA icon (large)
    └── apple-touch-icon.png
```

## 🎨 Customization

### Branding
- Update colors in `HomeKeep.jsx` (search for `lightColors` and `darkColors`)
- Replace `icon.svg` with your logo
- Update `manifest` settings in `vite.config.js`

### Adding Tasks
Add new task templates to the `taskTemplates` array in `HomeKeep.jsx`:

```javascript
{ 
  title: 'Your Task Name', 
  category: 'HVAC', // or any category
  frequencyDays: 90, 
  notes: 'Helpful notes here.',
  priority: true, // optional - marks as high priority
  requires: { // optional - conditional display
    homeType: ['house', 'townhouse'],
    features: ['garage']
  }
}
```

### Adding Categories
1. Add to `categories` array
2. Add color to `catColors` object
3. Add icon mapping in `getCategoryIcon` function

## 📊 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **vite-plugin-pwa** - PWA generation
- **localStorage** - Data persistence
- **Workbox** - Service worker & caching

## 🔒 Privacy

HomeKeep stores all data locally on your device. No accounts required, no data sent to servers. Your maintenance data stays private.

## 📝 Version History

- **v2.0** - Production release
  - Critical tasks section
  - Category view with collapsible accordions
  - Smart add button with templates
  - Quick-add from templates
  - Search in templates
  - Enhanced due date indicators

- **v1.8** - Major UI update
  - View mode toggle (Status/Category)
  - Add action sheet
  - Accessibility improvements

- **v1.7** - Search & Filter
  - Task search
  - Category filter pills

- **v1.6** - Seasonal & Equipment
  - Winterization tasks
  - Equipment maintenance (lawn mower, snow blower, etc.)
  - 80+ task templates

- **v1.5** - Smart Onboarding
  - 6-step personalized survey
  - Conditional task filtering

- **v1.0-1.4** - Foundation
  - Core task management
  - Dark mode
  - Analytics
  - Import/Export
  - PWA support

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ for homeowners everywhere.
