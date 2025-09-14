# Form Configuration Files

This repository contains JSON configuration files for dynamic form generation across all GHL subaccounts.

## Structure
- `configs/` - JSON configuration files for each screener type
- Files are automatically generated from Notion database via N8N webhooks
- Forms dynamically load configurations based on URL patterns

## Usage
Forms automatically detect screener type from URL:
- `/glp1-screener` → loads `configs/glp1.json`
- `/trt-screener` → loads `configs/trt.json`
- `/hrt-screener` → loads `configs/hrt.json`

## Auto-Generation Process
1. Edit Notion database
2. Notion webhook triggers N8N
3. N8N generates JSON files and commits to this repo
4. GitHub Pages serves updated configs
5. All forms automatically use new configurations

## GitHub Pages URL
Once deployed: `https://your-username.github.io/form-configs/configs/[screener].json`