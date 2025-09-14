const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Notion webhook receiver for form configs',
    timestamp: new Date().toISOString()
  });
});

// Main webhook endpoint for N8N
app.post('/webhook/update-configs', async (req, res) => {
  try {
    console.log('🔔 Received webhook from N8N');
    console.log('Payload size:', JSON.stringify(req.body).length, 'characters');

    // Extract the form data from N8N
    const formData = req.body;

    // If N8N sends an array of configs, use that
    // If N8N sends raw Notion data, we'll process it here
    let configs;

    if (Array.isArray(formData) && formData[0]?.screener) {
      // N8N already processed the data into configs
      configs = formData;
    } else {
      // Process raw webhook data
      configs = await processNotionData(formData);
    }

    console.log(`📝 Processing ${configs.length} screener configs`);

    // Ensure configs directory exists
    const configsDir = path.join(__dirname, 'configs');
    if (!fs.existsSync(configsDir)) {
      fs.mkdirSync(configsDir, { recursive: true });
      console.log('📁 Created configs directory');
    }

    // Write each config file
    const writtenFiles = [];
    for (const config of configs) {
      const filename = `${config.screener.toLowerCase()}.json`;
      const filepath = path.join(configsDir, filename);

      const configData = {
        screener: config.screener,
        category: config.category || '',
        lastUpdated: new Date().toISOString(),
        totalQuestions: config.questions?.length || 0,
        questions: config.questions || []
      };

      fs.writeFileSync(filepath, JSON.stringify(configData, null, 2));
      writtenFiles.push(filename);

      console.log(`✅ Generated ${filename} with ${configData.totalQuestions} questions`);
    }

    // Create summary file
    const summary = {
      lastUpdate: new Date().toISOString(),
      totalScreeners: writtenFiles.length,
      screeners: writtenFiles.map(f => f.replace('.json', '').toUpperCase()),
      files: writtenFiles
    };

    fs.writeFileSync(
      path.join(configsDir, '_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // Auto-commit to git
    await commitChanges(writtenFiles);

    res.json({
      success: true,
      message: `Updated ${writtenFiles.length} screener configs`,
      files: writtenFiles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

 // Process N8N processed data
  function processN8NData(data) {
    console.log('📋 Processing N8N data structure...');

    // Check if data is already in config format from N8N
    if (Array.isArray(data) && data[0]?.screener) {
      console.log(`✅ Found ${data.length} pre-processed configs`);
      return data;
    }

    // If it's raw webhook data, extract from the structure
    if (data.body || data.json || data.configs) {
      const actualData = data.body || data.json || data.configs;
      if (Array.isArray(actualData)) {
        return actualData;
      }
    }

    console.log('⚠️ Unknown data structure:', JSON.stringify(data, null, 2));
    return [];
  }

    const fullCommand = commands.join(' && ');

    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Git commit warning (might be no changes):', error.message);
        resolve(); // Don't reject, as this might just mean no changes
      } else {
        console.log('🚀 Successfully committed and pushed changes');
        console.log('Git output:', stdout);
      }
      resolve();
    });
  });
}

app.listen(port, () => {
  console.log(`🌐 Webhook receiver running on port ${port}`);
  console.log(`📡 Webhook endpoint: http://localhost:${port}/webhook/update-configs`);
  console.log(`🏠 Health check: http://localhost:${port}/`);
});

module.exports = app;