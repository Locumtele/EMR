# Forms Directory

This directory contains all form implementations for the EMR system.

## 📁 Structure

```
forms/
├── notion-based/              # New Notion-powered dynamic forms
│   ├── dynamic-form.html      # Main form (handles all screeners)
│   ├── notion-form-builder.js # Notion API integration
│   ├── generic-form-actions.js # Form logic and validation
│   ├── CONFIGURATION-REFERENCE.md
│   └── DYNAMIC-FORM-USAGE.md
└── README.md                  # This file
```

## 🚀 Notion-Based Forms

The `notion-based/` directory contains the new dynamic form system that:

- ✅ **Fetches questions from Notion database**
- ✅ **Handles all screener types dynamically**
- ✅ **No hardcoded questions**
- ✅ **Category-based redirects**
- ✅ **Reusable across all forms**

### Usage

```html
<!-- GLP1 Form -->
https://yourdomain.com/forms/notion-based/dynamic-form.html?screener=GLP1

<!-- NAD Form -->
https://yourdomain.com/forms/notion-based/dynamic-form.html?screener=NAD

<!-- Semorelin Form -->
https://yourdomain.com/forms/notion-based/dynamic-form.html?screener=Semorelin
```

### Files

- **`dynamic-form.html`** - Single form file for all screeners
- **`notion-form-builder.js`** - Fetches and renders questions from Notion
- **`generic-form-actions.js`** - Form validation, routing, and webhook logic
- **Documentation** - Configuration and usage guides

## 📋 Legacy Forms

Legacy form implementations are archived in the `../archive/` directory.

## 🔧 Setup

1. Configure Notion database ID in `dynamic-form.html`
2. Deploy to your web server
3. Use URL parameters to specify screener type
4. Forms automatically load questions from Notion

## 📚 Documentation

- See `notion-based/CONFIGURATION-REFERENCE.md` for setup details
- See `notion-based/DYNAMIC-FORM-USAGE.md` for usage instructions
