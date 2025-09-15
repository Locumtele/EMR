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

1. **Screening Form** → Triggers `ghlRedirect` event → **Footer Redirect Handler** → Checkout page
2. **Checkout Page** → Auto-fills with screening data → **Checkout Autofill** → Calendar page
3. **Calendar Page** → Booking completion → **Calendar Redirect** → Confirmation page