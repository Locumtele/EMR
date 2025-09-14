# N8N → GitHub Actions Setup

## Simplified Workflow

Instead of N8N directly updating GitHub files, we trigger GitHub Actions which does the work.

### Step 1: GitHub Repository Setup

1. **Add Secrets** in your GitHub repo:
   - Go to Settings → Secrets and variables → Actions
   - Add `NOTION_API_KEY` (your Notion integration token)
   - Add `NOTION_DATABASE_ID` (your database ID)

2. **Enable GitHub Pages**:
   - Settings → Pages → Deploy from main branch
   - Your configs will be at: `https://vertimd.github.io/EMR/centralized/form-configs/configs/glp1.json`

### Step 2: N8N Webhook Setup

Create a simple N8N workflow:

**Node 1: Notion Webhook Trigger**
- Same webhook URL as before

**Node 2: HTTP Request to GitHub**
- **Method**: POST
- **URL**: `https://api.github.com/repos/VertiMD/EMR/dispatches`
- **Headers**:
  ```
  Authorization: Bearer {{ $secrets.GITHUB_TOKEN }}
  Accept: application/vnd.github+json
  X-GitHub-Api-Version: 2022-11-28
  ```
- **Body**:
  ```json
  {
    "event_type": "notion-webhook"
  }
  ```

### Step 3: GitHub Token Setup

You'll need a GitHub Personal Access Token:

1. **Generate Token**:
   - GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Select scopes: `repo`, `workflow`

2. **Add to N8N**:
   - Store as `GITHUB_TOKEN` in N8N credentials

### Step 4: Test the Flow

1. **Manual Test**:
   - Go to Actions tab in GitHub
   - Run "Update Form Configurations" manually
   - Check if `configs/` files are generated

2. **Webhook Test**:
   - Edit something in Notion
   - Should trigger N8N → GitHub Actions → File updates

## Benefits

✅ **No complex GitHub API calls in N8N**
✅ **Uses built-in GitHub authentication**
✅ **Proper error handling and logging**
✅ **Easy to debug in GitHub Actions**
✅ **Automatic commits with proper messages**

## Generated Files

- `configs/glp1.json`
- `configs/sermorelin.json`
- `configs/nad.json`
- `configs/_summary.json` (overview of all screeners)

## URLs for Your JavaScript

Your forms will load from:
- `https://vertimd.github.io/EMR/centralized/form-configs/configs/glp1.json`
- `https://vertimd.github.io/EMR/centralized/form-configs/configs/sermorelin.json`
- `https://vertimd.github.io/EMR/centralized/form-configs/configs/nad.json`