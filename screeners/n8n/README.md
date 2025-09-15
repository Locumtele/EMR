# n8n Workflows Repository

This folder contains n8n workflow JSON files for backup and version control.

## Current Workflows

### patient-load-screener.json
**Purpose**: Loads screening questions from Notion database for form display

**Flow**:
1. **Webhook** (`/emr-screener-questions`) - Receives GET request with `screener` parameter
2. **Notion Query** - Fetches questions from Notion database filtered by screener type
3. **JavaScript Processing** - Transforms and organizes questions by screener type
4. **Response** - Returns formatted questions to the form

**Key Features**:
- Filters questions by screener type (weightloss, antiaging, sexualhealth, hormone, hairskin)
- Sorts questions by question number
- Processes multi-select fields (safe, flag, disqualify options)
- Supports conditional logic (showCondition field)
- Returns structured JSON with questions, validation rules, and disqualification messages

**Current Webhook URL**: `https://locumtele.app.n8n.cloud/webhook/emr-screener-questions`

**Usage**: `GET /emr-screener-questions?screener=weightloss`

**Database**: Notion Screeners database (`26e82abf-7eae-80f5-ae8e-eb0c7ecc76f0`)

### telehealth-logic.json
**Purpose**: Loads telehealth consultation type (sync/async) from Notion database

**Flow**:
1. **Webhook** (`/telehealth-logic`) - Receives GET request with `screener` parameter
2. **Notion Query** - Fetches consultation type from "telehealth logic" Notion database
3. **Response** - Returns sync/async preference for the screener

**Key Features**:
- Maps screener names to consultation types
- Returns fallback "sync" if screener not found
- Simple JSON response format

**Webhook URL**: `https://locumtele.app.n8n.cloud/webhook/telehealth-logic`

**Usage**: `GET /telehealth-logic?screener=weightloss`

**Database**: Notion "telehealth logic" database (`26c82abf-7eae-8047-8575-cf8b3e3a1606`)

**Expected Response**:
```json
{
  "screener": "weightloss",
  "consult": "async"
}
```

## Import Instructions

1. In n8n, go to Workflows
2. Click "Import from File"
3. Select the JSON file from this directory
4. Update credentials if needed:
   - Notion API credentials for database access
5. Activate the workflow

## Backup Notes

- Export workflows regularly after making changes
- Update this README when adding new workflows
- Keep workflow names descriptive and consistent