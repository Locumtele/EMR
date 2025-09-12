# Medical Screening Forms Documentation

## Overview

This project provides three interactive medical screening forms designed for GoHighLevel (GHL) integration:

1. **TRT Screening Form** (`trt-screening-form.html`) - Testosterone Replacement Therapy
2. **NAD Screening Form** (`nad-screening-form.html`) - NAD+ Therapy  
3. **GLP-1 Screening Form** (`glp1-screening-form.html`) - GLP-1 Receptor Agonist Therapy

Each form includes comprehensive medical screening questions, intelligent routing logic, and seamless GHL integration capabilities.

## Features

✅ **Medical-Grade UI Design** - Clean, professional interface inspired by healthcare platforms  
✅ **Intelligent Routing** - Automatic PROCEED/FLAG/DISQUALIFY decisions based on clinical logic  
✅ **Mobile-Responsive** - Works perfectly on all devices  
✅ **Real-Time Validation** - Instant feedback and error handling  
✅ **GHL Integration Ready** - Transparent background, webhook support, workflow continuation  
✅ **HIPAA-Compliant Data Handling** - Secure data transmission considerations  
✅ **Progressive Disclosure** - Show relevant follow-up questions based on selections  
✅ **Auto-Save Functionality** - Prevent data loss during completion  

## Form Details

### 1. TRT Screening Form

**Purpose**: Screen patients for Testosterone Replacement Therapy eligibility  
**Source Document**: `TRT Screening Tool LU Mar 26 2025.txt`

**Key Sections**:
- Allergies & Previous Treatment
- Medical Contraindications  
- Medical History (9 condition categories)
- Current Medications (8 high-interaction drugs)
- ADAM Assessment (10-question symptom evaluation)

**Routing Logic**:
- **DISQUALIFY**: Prostate/breast cancer, polycythemia
- **FLAG**: Allergic reactions, hormone contraindications, cardiovascular/liver conditions, high-interaction medications
- **PROCEED**: No contraindications + ADAM assessment results

### 2. NAD Screening Form

**Purpose**: Screen patients for NAD+ Therapy eligibility  
**Source Document**: `NAD Screening Tool LU Mar 26 2025.txt`

**Key Sections**:
- Allergies & Previous Treatment
- Preferred Route of Administration (Topical, Nasal, Patch, Injection)
- Medical History (Heart disease, cancer history)
- Family Cancer History

**Routing Logic**:
- **FLAG**: Heart disease, personal cancer history, allergic reactions
- **PROCEED**: No major contraindications (most permissive of the three forms)

### 3. GLP-1 Screening Form

**Purpose**: Screen patients for GLP-1 Receptor Agonist Therapy eligibility  
**Source Document**: `GLP1 Screening Tool Updated Sept 3 2025.txt`

**Key Sections**:
- Allergic Reactions (GLP-1 and related medications)
- Medical History (11 condition categories with sub-classifications)
- Pregnancy & Mental Health
- Alcohol Consumption (4-tier classification)
- Family History (MEN 2, MTC)
- Current Medications (6 contraindicated drug categories)

**Routing Logic**:
- **DISQUALIFY**: Type 1 diabetes, HbA1C >8%, pancreatitis, pregnancy, depression with suicidal ideation, >2 drinks/day, chemotherapy, specific medications
- **FLAG**: Type 2 diabetes, diabetic complications, kidney/GI issues, moderate alcohol use
- **PROCEED**: No contraindications identified

## Question Optimization Strategy

### Original vs. Optimized Format

Instead of multiple repetitive yes/no questions, the forms use:

**Multi-Select Checkboxes**: Group related conditions (e.g., "Select all medical conditions that apply")  
**Progressive Disclosure**: Show follow-up questions only when relevant  
**Visual Hierarchy**: Use color-coding and icons to indicate severity (FLAG vs. DISQUALIFY)  
**Smart Defaults**: Pre-organize options by clinical importance  

### Examples of Consolidation

**Before** (Original):
```
Do you have cardiovascular disease? Y/N
Do you have heart attack history? Y/N  
Do you have stroke history? Y/N
Do you have blood pressure issues? Y/N
Do you have arrhythmia? Y/N
```

**After** (Optimized):
```
Select any cardiovascular conditions you have:
☐ Heart attack, stroke, blood pressure issues, arrhythmia
☐ [Other conditions...]
```

## GHL Integration Guide

### 1. Embedding in GHL Pages

```html
<!-- Add this iframe to your GHL page -->
<iframe 
  src="./trt-screening-form.html" 
  width="100%" 
  height="1200px" 
  frameborder="0"
  style="border: none; background: transparent;">
</iframe>
```

### 2. Webhook Configuration

Each form sends data to LocumTele webhooks with this structure:

```json
{
  "form_type": "TRT_Screening|NAD_Screening|GLP1_Screening",
  "timestamp": "2025-01-XX...",
  "routing_outcome": "PROCEED|FLAG|DISQUALIFY", 
  "routing_reason": "Explanation of decision",
  "responses": {
    "question_name": "answer",
    "..."
  },
  "multi_select_responses": {
    "medical_history": ["condition1", "condition2"],
    "current_medications": ["med1", "med2"]
  }
}
```

### 3. Webhook Endpoints

Update these endpoints in each form's JavaScript:

```javascript
// TRT Form
fetch('/webhook/trt-screening', { ... })

// NAD Form  
fetch('/webhook/nad-screening', { ... })

// GLP-1 Form
fetch('/webhook/glp1-screening', { ... })
```

### 4. GHL Workflow Integration

After form submission:
1. Data sent to LocumTele webhook
2. Forms automatically redirect to appropriate consult pages:
   - **GLP-1 Form**: `{{custom_values.root.domain}}/weightloss-consult`
   - **NAD Form**: `{{custom_values.root.domain}}/antiaging-consult`
   - **TRT Form**: `{{custom_values.root.domain}}/hormone-consult`
3. Add the provided footer code to GHL Website Settings > Footer Code
4. Footer code handles redirect using GHL custom values for multi-account support

## File Structure

```
/medAI/
├── trt-screening-form.html      # TRT screening form
├── nad-screening-form.html      # NAD screening form  
├── glp1-screening-form.html     # GLP-1 screening form
├── ghl-footer-redirect.html     # GHL footer code for redirects
├── README.md                    # This documentation
├── working forms/               # Source documents
│   ├── TRT Screening Tool LU Mar 26 2025.txt
│   ├── NAD Screening Tool LU Mar 26 2025.txt
│   └── GLP1 Screening Tool Updated Sept 3 2025.txt
├── original forms/              # Additional reference materials
└── live forms/                  # Production versions
```

## Clinical Logic Validation

### TRT Form Routing

| Condition | Action | Reason |
|-----------|--------|---------|
| Prostate/Breast Cancer | DISQUALIFY | Absolute contraindication |
| Polycythemia | DISQUALIFY | Absolute contraindication |
| Allergic Reactions | FLAG | Requires consultation |
| Cardiovascular Disease | FLAG | Requires monitoring |
| ADAM Score: Q1 or Q7 = Yes | PROCEED* | Suggests low testosterone |
| ADAM Score: ≥3 Yes answers | PROCEED* | Suggests low testosterone |

### NAD Form Routing

| Condition | Action | Reason |
|-----------|--------|---------|
| NAD/NR Allergy | FLAG | Requires consultation |
| Heart Disease | FLAG | Requires consultation |
| Cancer History | FLAG | Requires consultation |
| No contraindications | PROCEED | Safe to continue |

### GLP-1 Form Routing

| Condition | Action | Reason |
|-----------|--------|---------|
| GLP-1 Allergy | DISQUALIFY | Absolute contraindication |
| Type 1 Diabetes | DISQUALIFY | Absolute contraindication |
| HbA1C >8% | DISQUALIFY | Poor glycemic control |
| Pregnancy | DISQUALIFY | Safety concern |
| Depression + Suicidal Ideation | DISQUALIFY | Safety concern |
| >2 drinks/day | DISQUALIFY | Interaction risk |
| MEN 2/MTC family history | DISQUALIFY | Genetic risk |
| Type 2 Diabetes | FLAG | Requires monitoring |
| Moderate alcohol | FLAG | Requires consultation |

## Testing Checklist

### Form Functionality
- [ ] All questions display correctly
- [ ] Follow-up questions show/hide appropriately  
- [ ] Multi-select checkboxes work
- [ ] Radio buttons are mutually exclusive
- [ ] Form validation prevents submission with missing data
- [ ] Real-time validation provides feedback

### Routing Logic
- [ ] DISQUALIFY conditions trigger correct outcome
- [ ] FLAG conditions trigger correct outcome  
- [ ] PROCEED conditions trigger correct outcome
- [ ] Edge cases handled appropriately
- [ ] Result display shows correct messaging

### Mobile Responsiveness
- [ ] Form displays correctly on phones
- [ ] All inputs are easily tappable
- [ ] Text is readable without zooming
- [ ] Scrolling works smoothly

### GHL Integration
- [ ] Forms embed correctly in GHL pages
- [ ] Background is transparent
- [ ] Webhook sends data successfully
- [ ] GHL workflow continues after submission
- [ ] Form styling matches clinic branding

## Admin Management

### Updating Form Questions

1. **Modify HTML Structure**: Edit the relevant `.html` file
2. **Update Routing Logic**: Modify the `determineRouting()` function in JavaScript
3. **Test All Pathways**: Ensure PROCEED/FLAG/DISQUALIFY logic still works
4. **Update Documentation**: Reflect changes in this README

### Adding New Conditions

```javascript
// In routing logic, add to appropriate arrays:
const disqualifyingConditions = [..., 'new_condition'];
const flagConditions = [..., 'new_condition'];
```

### Webhook Configuration

Update webhook URLs in each form:
```javascript
fetch('YOUR_WEBHOOK_URL_HERE', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(submissionData)
})
```

## Security Considerations

- All forms use HTTPS for data transmission
- No PHI stored locally in browser
- Webhook endpoints should validate incoming data
- Forms include CSRF protection considerations
- Input sanitization prevents XSS attacks

## Support & Maintenance

For form updates, webhook issues, or integration questions:
1. Review this documentation first
2. Test changes in development environment  
3. Validate clinical logic with medical team
4. Deploy to staging before production

## Version History

- **v1.0** - Initial release with TRT, NAD, and GLP-1 forms
- **Source**: Based on March 2025 TRT/NAD documents and September 2025 GLP-1 document

---

*Generated with Claude Code for LocumTele medical screening optimization*