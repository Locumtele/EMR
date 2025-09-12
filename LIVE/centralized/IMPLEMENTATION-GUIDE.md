# Medical Screener - Centralized Implementation Guide

## The Simple Solution

Instead of having hundreds of lines of code in each form, you now have:

1. **ONE JavaScript file** that handles all forms
2. **Simple forms** that just reference this file
3. **When you need changes, edit just ONE file** and it updates everywhere

## Files Created

### 1. Master JavaScript File
- **File:** `medical-screener.js`  
- **What it does:** Contains all the logic for every form type
- **Where to put it:** Upload to your website (e.g., `https://your-domain.com/js/medical-screener.js`)

### 2. Simplified Form Example
- **File:** `sermorelin-screener-simplified.html`
- **What it does:** Shows how your forms should look now (much simpler!)

## How to Implement

### Step 1: Upload the JavaScript File
1. Upload `medical-screener.js` to your website
2. Note the URL (e.g., `https://your-domain.com/js/medical-screener.js`)

### Step 2: Update Your Forms
Replace the giant `<script>` section in each form with just this:

```html
<!-- Replace all the JavaScript with these 3 lines -->
<script src="https://your-domain.com/js/medical-screener.js"></script>
<script>
    initMedicalScreener('FORM_TYPE_HERE');
</script>
```

**Form Types:**
- GLP1 forms: `initMedicalScreener('glp1');`
- NAD forms: `initMedicalScreener('nad');` 
- Sermorelin forms: `initMedicalScreener('sermorelin');`

### Step 3: Test
1. Load a form in your browser
2. Check browser console for "Medical Screener initialized for: [form_type]"
3. Test form submission

## Benefits

✅ **Update once, applies everywhere** - Change the JavaScript file, all forms update instantly  
✅ **Smaller form files** - Each form is now much simpler  
✅ **Easier maintenance** - No more hunting through hundreds of identical code blocks  
✅ **Version control** - Easy to track changes and rollback if needed  
✅ **Better performance** - Browser caches the JavaScript file  

## What Stays the Same

- All your forms work exactly the same
- All tracking (UTMs, GHL data) still works
- All webhooks still fire
- All redirect logic unchanged
- All styling stays the same

## Example: Before vs After

**BEFORE** (in each form):
```html
<script>
    // 500+ lines of identical JavaScript code
    document.addEventListener('DOMContentLoaded', function() {
        // Tracking logic...
        // Form validation...
        // Webhook sending...
        // etc...
    });
</script>
```

**AFTER** (in each form):
```html
<script src="https://your-domain.com/js/medical-screener.js"></script>
<script>
    initMedicalScreener('sermorelin');
</script>
```

## Need Changes Later?

Just edit the ONE `medical-screener.js` file and it updates every form across all your accounts instantly!

## Questions?

The master file handles all the complex logic:
- UTM tracking
- GHL merge tags
- Webhook sending  
- Form validation
- Routing logic
- Early disqualification

Your forms just need the HTML structure and this tiny script to initialize everything.