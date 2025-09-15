# EMR Medical Screening Forms

Dynamic, data-driven medical screening forms integrated with Notion database and GoHighLevel (GHL) funnels.

## 🏗️ Architecture

### Core Components
- **form.html** - Main form structure (26 lines)
- **form.js** - JavaScript logic (960+ lines)
- **style.css** - Responsive CSS styling (620+ lines)
- **embed.html** - Iframe wrapper for GHL embedding (89 lines)

### Integration
- **Notion Database** - Question configuration and content management
- **n8n Workflows** - Data processing and webhook handling
- **GitHub Pages** - Form hosting (`https://locumtele.github.io/EMR/`)
- **GoHighLevel** - Funnel integration and redirect handling

## 🚀 Key Features

### ✅ **Fully Dynamic**
- All questions loaded from Notion database
- No hardcoded content (removed 200+ lines of static questions)
- Real-time disqualification logic
- BMI calculation with instant feedback

### ✅ **Multi-Screener Support**
- GLP1, NAD, Sermorelin, Testosterone assessments
- Category-based redirects
- Shared and screener-specific questions

### ✅ **Mobile Optimized**
- Fluid typography with `clamp()` functions
- 44px touch targets (Apple standard)
- rem-based spacing system
- Enhanced landscape mode support

### ✅ **Auto-Resizing Iframe**
- No scrolling required
- Dynamically adjusts to content height
- Perfect for GHL embedding

### ✅ **Production Ready**
- Separated concerns (HTML/CSS/JS)
- Optimized for performance
- Browser caching enabled
- Error handling and fallbacks

## 📁 Project Structure

```
EMR/
├── form.html              # Main form (GitHub Pages)
├── form.js               # JavaScript logic
├── style.css            # Responsive styling
├── embed.html           # Iframe wrapper for GHL
├── ghl-codes/           # GoHighLevel integration
│   ├── redirect-handlers/
│   │   ├── footer-redirect-handler.js
│   │   ├── checkout-autofill.js
│   │   └── calendar-booking-redirect.js
│   └── README.md
├── n8n-workflows/       # Automation workflows
│   ├── patient-load-screener.json
│   └── README.md
└── README.md           # This file
```

## 🔄 Workflow

### 1. Question Loading
```
GHL Page → embed.html → form.html → n8n → Notion → Questions Rendered
```

### 2. Form Submission
```
User Submits → Validation → n8n Webhook → GHL Redirect → Next Funnel Step
```

### 3. Development
```
Edit form.html/form.js → Push to GitHub → Auto-deploy → All GHL pages updated
```

## 🛠️ Setup Instructions

### GitHub Pages Deployment
1. Push changes to `main` branch
2. GitHub Pages automatically serves from root
3. Forms available at `https://locumtele.github.io/EMR/`

### GHL Integration
1. Add footer redirect handler to GHL site settings
2. Embed forms using iframe:
   ```html
   <iframe src="https://locumtele.github.io/EMR/embed.html?screener=GLP1"
           width="100%"
           height="600"
           frameborder="0">
   </iframe>
   ```

### Notion Configuration
- **Database ID**: `26e82abf7eae80f5ae8eeb0c7ecc76f0`
- **Required Fields**: Question Text, Input Type, Section, Screener
- **Optional Fields**: Safe/Flag/Disqualify options, Validation rules

## 📊 Recent Optimizations

### Code Cleanup
- **Removed**: 200+ lines of hardcoded questions
- **Extracted**: 900+ lines of JavaScript to separate file
- **Reduced**: 41 inline styles to 13 (68% reduction)
- **Added**: 50+ CSS utility classes

### Performance
- **Mobile-first** responsive design
- **Optimized** for Core Web Vitals
- **Enhanced** touch interactions
- **Improved** loading states

### Maintainability
- **Single source** of truth (GitHub Pages)
- **Separated** concerns (HTML/CSS/JS)
- **Version controlled** GHL codes
- **Documented** workflows

## 🔧 Development Notes

### Making Changes
1. Edit files locally
2. Test functionality
3. Push to GitHub (auto-deploys)
4. All GHL funnels update automatically

### Adding New Screeners
1. Add questions to Notion database
2. Set screener type (GLP1, NAD, etc.)
3. Configure category for redirects
4. Test with `?screener=NewType` parameter

### Debugging
- Check browser console for errors
- Verify n8n webhook responses
- Test iframe messaging between windows
- Validate Notion database schema

---

**Last Updated**: September 2024
**Version**: 2.0 (Iframe + Auto-resize)
**Author**: AI Assistant + User Collaboration