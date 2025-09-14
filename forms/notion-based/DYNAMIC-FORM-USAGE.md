# Dynamic Form System with Notion Integration

## Overview
This system uses **ONE form file** that dynamically loads questions from Notion for ANY screener type. No hardcoded questions, no multiple files per screener.

## File Structure
```
├── shared-styles.css          # All styling (reusable)
├── notion-form-builder.js     # Fetches questions from Notion
├── generic-form-actions.js    # All form logic (reusable)
├── dynamic-form.html          # ONE form for ALL screeners
└── DYNAMIC-FORM-USAGE.md     # This guide
```

## How It Works

### 1. **Single Form File**
- `dynamic-form.html` handles ALL screeners
- Gets screener type from URL parameter or meta tag
- Dynamically loads questions from Notion
- Applies appropriate styling and logic

### 2. **Notion Integration**
- Fetches questions based on `property_screener` field
- Handles all question types: text, radio, checkbox, etc.
- Processes disqualification and flag logic from Notion
- No hardcoded questions anywhere

### 3. **Usage Examples**

#### URL Parameters
```
dynamic-form.html?screener=GLP1&db=your_database_id
dynamic-form.html?screener=NAD&db=your_database_id
dynamic-form.html?screener=Semorelin&db=your_database_id
```

#### Meta Tags (for embedding)
```html
<meta name="screener-type" content="GLP1">
<meta name="notion-database-id" content="your_database_id">
```

## Setup Instructions

### 1. **Update Database ID**
Replace `YOUR_DATABASE_ID` in `dynamic-form.html` with your actual Notion database ID.

### 2. **Notion Database Structure**
Your Notion database should have these properties:
- `name` (Title) - Question identifier
- `property_question_text` (Rich Text) - Question text
- `property_input_type` (Select) - text, radio, checkbox, etc.
- `property_section` (Select) - Section grouping
- `property_screener` (Multi-select) - Which screeners use this question
- `property_disqualify` (Text) - Disqualifying values
- `property_flag` (Text) - Flag values
- `property_disqualify_message` (Text) - Custom disqualify message
- `property_show_condition` (Text) - Conditional display logic
- `property_safe` (Text) - Valid/safe values
- `property_question_number` (Number) - Display order

### 3. **Deploy**
Just upload the 4 files to your server. That's it!

## Benefits

✅ **One form file** handles hundreds of screeners  
✅ **No hardcoded questions** - everything from Notion  
✅ **Easy to maintain** - update questions in Notion  
✅ **Consistent styling** - shared CSS  
✅ **Reusable logic** - generic form actions  
✅ **Scalable** - add new screeners by just adding to Notion  

## Adding New Screeners

1. Add questions to Notion database
2. Set `property_screener` to include new screener name
3. Use the form with `?screener=NewScreener`
4. Done! No code changes needed.

## API & Webhooks

The system automatically:
- Sends form data to your webhook endpoint
- Handles UTM tracking
- Processes disqualification logic
- Routes users based on responses
- Works with GoHighLevel integration
