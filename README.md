# EMR - Dynamic Form System

A centralized, dynamic form generation system for medical screenings across multiple GoHighLevel subaccounts.

## 🚀 Features

- **Dynamic Form Generation** - Forms generated from Notion database
- **Centralized Management** - Edit once in Notion, updates everywhere
- **Multi-Screener Support** - GLP1, TRT, HRT, Sermorelin, NAD, etc.
- **Auto-Updates** - Webhook-driven updates via GitHub Pages
- **Zero Code Duplication** - Same JavaScript works for all forms

## 📁 Project Structure

```
centralized/form-configs/    # Active dynamic system
├── configs/                 # Generated JSON form configurations
├── codespace-webhook.js     # Webhook receiver for updates
├── ghl-form-snippet.js      # Reusable JavaScript for GHL sites
└── package.json            # Dependencies

archive/                     # Historical static files (not in GitHub)
├── calendars/              # Old static calendar embeds
├── screeners/              # Old static form files
└── footer code/            # Old tracking code snippets
```

## 🔧 How It Works

1. **Edit Notion Database** → Triggers webhook
2. **N8N processes data** → Sends to Codespace webhook
3. **Codespace generates JSON** → Commits to GitHub repo
4. **GitHub Pages serves configs** → All forms automatically update

## 🌐 Usage

### For GHL Sites:
1. Add CSS (provided) to GHL CSS box
2. Add JavaScript snippet to GHL HTML box
3. Forms auto-detect type from URL (`/glp1-screener`, `/trt-screener`, etc.)
4. No manual updates needed - everything is dynamic!

### Configuration URLs:
- `https://locumtele.github.io/EMR/centralized/form-configs/configs/glp1.json`
- `https://locumtele.github.io/EMR/centralized/form-configs/configs/trt.json`
- etc.

## 📋 Setup

1. Configure Notion webhook to N8N
2. Set up Codespace webhook receiver
3. Deploy JavaScript to GHL sites
4. Done! Forms update automatically from Notion

## 🗃️ Archive

Historical static files have been moved to `/archive/` and are not tracked in GitHub. The new dynamic system replaces all static implementations.

---

*🤖 Generated with [Claude Code](https://claude.ai/code)*