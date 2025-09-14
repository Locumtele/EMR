# Codespace Setup for Form Configuration Webhook

## Setup Instructions

### 1. In Your GitHub Codespace

```bash
# Navigate to the form-configs directory
cd centralized/form-configs

# Install dependencies
npm install

# Start the webhook server
npm start
```

The server will run on port 3000 and automatically commit changes to git.

### 2. Get Your Codespace URL

When you start the server, Codespace will show you a popup asking to make port 3000 public. Click "Make Public".

Your webhook URL will be something like:
`https://username-emr-xxxxx.github.dev/webhook/update-configs`

### 3. Update N8N Workflow

Replace your GitHub API node with a simple HTTP Request node:

**HTTP Request Node:**
- **Method**: POST
- **URL**: `https://your-codespace-url.github.dev/webhook/update-configs`
- **Body**: Send the processed configs from your Code node
- **Headers**: `Content-Type: application/json`

### 4. N8N Code Node Output

Make sure your N8N Code node returns data in this format:

```javascript
// Return array of config objects
return configs.map(config => ({
  json: {
    screener: config.screener,
    category: config.category,
    questions: config.questions
  }
}));
```

## How It Works

1. **Notion webhook** → **N8N** processes data
2. **N8N** sends processed configs → **Codespace webhook**
3. **Codespace** writes JSON files and commits to git
4. **GitHub Pages** automatically serves updated files

## Benefits

✅ **No authentication needed** - Codespace runs in your GitHub account
✅ **Automatic git commits** - Files are committed and pushed automatically
✅ **Real-time updates** - Changes appear immediately on GitHub Pages
✅ **Easy debugging** - Logs visible in Codespace terminal
✅ **Secure** - Webhook URL is unique to your Codespace

## Testing

1. **Start the server**: `npm start`
2. **Test endpoint**: Visit `https://your-codespace-url.github.dev/` for health check
3. **Manual trigger**: Send POST request with config data
4. **Check results**: Look in `configs/` directory for generated files

## File Structure

```
centralized/form-configs/
├── configs/
│   ├── glp1.json
│   ├── sermorelin.json
│   ├── nad.json
│   └── _summary.json
├── codespace-webhook.js
├── package.json
└── README.md
```

## GitHub Pages URLs

Once files are committed, they're accessible at:
- `https://locumtele.github.io/EMR/centralized/form-configs/configs/glp1.json`
- `https://locumtele.github.io/EMR/centralized/form-configs/configs/sermorelin.json`
- etc.

## Keeping Codespace Running

- Codespace stays active while you're using it
- For production, consider upgrading to keep it running 24/7
- Alternative: Use GitHub Actions (we can set that up later if needed)