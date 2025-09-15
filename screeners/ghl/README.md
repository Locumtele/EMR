# GHL (GoHighLevel) Code Repository

This folder contains code snippets and configurations used within GoHighLevel funnels and pages.

## Structure

- `embed-codes/` - HTML/CSS/JS codes used to embed forms
- `redirect-handlers/` - JavaScript code for handling form redirects
- `tracking-codes/` - Analytics and tracking snippets
- `custom-css/` - Custom styling for GHL pages
- `webhook-handlers/` - Code for handling webhook responses

## Current Files

### Redirect Handlers
- **footer-redirect-handler.js** - Main redirect handler for screening forms (add to GHL site footer)
  - Supports category-based redirects: weightloss, antiaging, sexualHealth, hormone, hairSkin
  - Uses GHL merge fields for location data and custom domain values
  - Listens for `ghlRedirect` custom events from embedded forms

- **checkout-autofill.js** - Auto-fills checkout forms with screening form data
  - Captures URL parameters from screening form submissions
  - Auto-fills name, email, phone fields on checkout pages
  - Stores contact data in localStorage for next page

- **calendar-booking-redirect.js** - Handles calendar booking completion redirects
  - Monitors for booking completion indicators using MutationObserver
  - Auto-redirects to confirmation page after successful booking
  - Includes fallback manual continue button after 3 minutes

## Usage

These codes are referenced and embedded within GoHighLevel pages and funnels. Keep this repository in sync with what's actually deployed in GHL for backup and version control purposes.

## Integration Flow

1. **Screening Form** (GitHub Pages) → Triggers `ghlRedirect` event → **Footer Redirect Handler** → Checkout page
2. **Checkout Page** → Auto-fills with screening data → **Checkout Autofill** → Calendar page
3. **Calendar Page** → Booking completion → **Calendar Redirect** → Confirmation page

## CURRENT: GitHub Pages + Direct Iframe Workflow

### Current Setup:
- **Forms hosted on**: `https://locumtele.github.io/EMR/screeners/form/form.html`
- **Embed in GHL using**: Direct iframe to form.html
- **Benefits**: Single source of truth, automatic updates, flexbox sizing

### Footer Handler Features:
The `footer-redirect-handler.js` supports:
- Cross-origin redirect events from GitHub Pages forms
- Category-based redirects: weightloss, antiaging, sexualhealth, hormone, hairskin
- GHL merge field integration for location data

### Current GHL Iframe Usage:
```html
<iframe src="https://locumtele.github.io/EMR/screeners/form/form.html?screener=weightloss"
        width="100%"
        height="600"
        frameborder="0">
</iframe>
```

### Recent Form Improvements:
- **Dynamic question loading** from Notion database
- **Conditional logic** (pregnancy questions show only for females)
- **Sorted options** (No/None options appear last in multi-select)
- **Enhanced uploads section** with 2-column layout for photos and ID
- **Mobile responsive** design with optimized layouts