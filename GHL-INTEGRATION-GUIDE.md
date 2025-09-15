# 🔄 GHL Integration Changes Required

## 📋 **IMPORTANT: You Need to Update These in GoHighLevel**

### 1. **Update Footer Redirect Handler** ⚠️ **REQUIRED**
**Location**: GHL → Settings → Website → Footer Code

**Action**: Replace your existing footer code with the updated version from:
`ghl-codes/redirect-handlers/footer-redirect-handler.js`

**Why**: The new version supports both direct forms AND iframe embedding

---

### 2. **Update Form Embedding Method** 📋 **RECOMMENDED**

**Old Method** (still works):
```html
<!-- Direct embed - legacy method -->
<iframe src="https://locumtele.github.io/EMR/form.html?screener=GLP1"
        width="100%" height="800" frameborder="0"></iframe>
```

**New Method** (recommended):
```html
<!-- Using embed.html wrapper - auto-resizing -->
<iframe src="https://locumtele.github.io/EMR/embed.html?screener=GLP1"
        width="100%" height="600" frameborder="0"></iframe>
```

**Benefits of New Method**:
- ✅ Auto-resizing (no scroll bars)
- ✅ Better loading states
- ✅ Enhanced error handling
- ✅ Improved mobile experience

---

### 3. **Screener Type Parameters** 🎯 **VERIFY**

Make sure your iframe URLs include the correct screener parameter:

- **GLP1**: `?screener=GLP1`
- **NAD**: `?screener=NAD`
- **Sermorelin**: `?screener=Sermorelin`
- **Testosterone**: `?screener=Testosterone`

**Example for each screener**:
```html
<!-- GLP1 Form -->
<iframe src="https://locumtele.github.io/EMR/embed.html?screener=GLP1" width="100%" height="600" frameborder="0"></iframe>

<!-- NAD Form -->
<iframe src="https://locumtele.github.io/EMR/embed.html?screener=NAD" width="100%" height="600" frameborder="0"></iframe>

<!-- Sermorelin Form -->
<iframe src="https://locumtele.github.io/EMR/embed.html?screener=Sermorelin" width="100%" height="600" frameborder="0"></iframe>

<!-- Testosterone Form -->
<iframe src="https://locumtele.github.io/EMR/embed.html?screener=Testosterone" width="100%" height="600" frameborder="0"></iframe>
```

---

### 4. **Custom Values Check** 🔧 **VERIFY**

Ensure these GHL custom values are still configured:

- `{{custom_values.root_domain}}` - Your domain for redirects
- `{{location.website}}` - For "Back to Website" buttons
- `{{location.id}}` - Location identification
- `{{location.name}}` - Location name

---

## 🚀 **Migration Steps**

### Phase 1: Update Footer (Critical)
1. Copy new footer code from `ghl-codes/redirect-handlers/footer-redirect-handler.js`
2. Paste into GHL → Settings → Website → Footer Code
3. Save and test one form

### Phase 2: Switch to New Embedding (Recommended)
1. Pick one funnel to test
2. Replace form iframe with new `embed.html` URL
3. Test form submission and redirects
4. If successful, update other funnels

### Phase 3: Verify All Screeners
1. Test each screener type (GLP1, NAD, etc.)
2. Verify redirects work correctly
3. Check mobile responsiveness

---

## 🐛 **Troubleshooting**

### If redirects don't work:
1. Check browser console for errors
2. Verify footer code is updated
3. Test with `?screener=GLP1` parameter

### If forms don't load:
1. Check GitHub Pages is working: `https://locumtele.github.io/EMR/form.html`
2. Verify iframe URL syntax
3. Check for CORS/security errors

### If height is wrong:
1. Use new `embed.html` method
2. Clear browser cache
3. Test on different devices

---

## ✅ **Testing Checklist**

- [ ] Footer redirect handler updated
- [ ] GLP1 form loads and submits
- [ ] NAD form loads and submits
- [ ] Sermorelin form loads and submits
- [ ] Testosterone form loads and submits
- [ ] Redirects work correctly
- [ ] Mobile experience is smooth
- [ ] Auto-resizing works (no scrollbars)
- [ ] Depression warnings display properly
- [ ] BMI calculations work

---

**Need Help?** Check the main README.md or test individual components on GitHub Pages directly.