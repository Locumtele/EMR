# N8N Workflow Configuration: Notion → GitHub Pages

## Workflow Name: "Notion to Form Configs"

### Node 1: Notion Webhook Trigger
- **Type:** Webhook
- **HTTP Method:** POST
- **Path:** `notion-form-update`
- **Full URL:** `https://locumtele.app.n8n.cloud/webhook/notion-form-update`

### Node 2: Notion Database Query
- **Type:** Notion
- **Operation:** Get database items
- **Database ID:** Your Notion database ID
- **Limit:** 100 (or more if needed)

### Node 3: Code - Transform to JSON Configs
```javascript
// Group questions by screener type
const results = $input.all()[0].json.results;
const screenerGroups = {};

results.forEach(item => {
  const props = item.properties;
  const screenerName = props.Screener?.select?.name;

  if (!screenerName) return;

  if (!screenerGroups[screenerName]) {
    screenerGroups[screenerName] = [];
  }

  screenerGroups[screenerName].push({
    id: props.Question_Number?.number || 0,
    section: props.Section?.select?.name || '',
    text: props.Question_Text?.rich_text?.[0]?.plain_text || '',
    type: props.Input_Type?.select?.name || 'text',
    safe: props.Safe?.multi_select?.map(v => v.name) || [],
    flag: props.Flag?.multi_select?.map(v => v.name) || [],
    disqualify: props.Disqualify?.multi_select?.map(v => v.name) || [],
    disqualifyMessage: props['Disqualify Message']?.rich_text?.[0]?.plain_text || '',
    showCondition: props['Show Condition']?.select?.name || 'always'
  });
});

// Sort questions by ID and create JSON configs
const configs = [];
Object.entries(screenerGroups).forEach(([screenerName, questions]) => {
  const sortedQuestions = questions.sort((a, b) => a.id - b.id);

  const config = {
    screener: screenerName,
    lastUpdated: new Date().toISOString(),
    totalQuestions: sortedQuestions.length,
    questions: sortedQuestions
  };

  configs.push({
    filename: `centralized/form-configs/configs/${screenerName.toLowerCase()}.json`,
    content: JSON.stringify(config, null, 2),
    screener: screenerName
  });
});

return configs.map(config => ({ json: config }));
```

### Node 4: GitHub - Update Files
- **Type:** GitHub
- **Operation:** Create or update file
- **Owner:** VertiMD
- **Repository:** EMR
- **File Path:** `{{ $json.filename }}`
- **File Content:** `{{ $json.content }}`
- **Commit Message:** `"Auto-update {{ $json.screener }} screener config from Notion"`
- **Branch:** main

### Required Credentials:
1. **Notion API Key** - From your Notion integrations
2. **GitHub Personal Access Token** - With repo write permissions

### Testing the Workflow:
1. Manual trigger to test initial generation
2. Edit something in your Notion database
3. Check if files update in GitHub
4. Verify GitHub Pages serves updated JSON