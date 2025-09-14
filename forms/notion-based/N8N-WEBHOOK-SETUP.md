# n8n Webhook Setup for Notion Questions

## 🎯 **Purpose**
This webhook serves as a proxy between the browser and Notion API to avoid CORS restrictions.

## 🔗 **Webhook URL**
```
https://locumtele.app.n8n.cloud/webhook/notion-questions
```

## 📥 **Input Format**
```json
{
  "screenerType": "GLP1",
  "databaseId": "26e82abf7eae80f5ae8eeb0c7ecc76f0",
  "notionSecret": "YOUR_NOTION_SECRET_HERE"
}
```

## 📤 **Output Format**
```json
{
  "success": true,
  "questions": [
    {
      "id": "question-id",
      "name": "full_name",
      "questionText": "What is your full name?",
      "inputType": "text",
      "section": "Patient Profile",
      "questionNumber": 1,
      "showCondition": "always",
      "safe": "any_text",
      "disqualify": "",
      "flag": "",
      "disqualifyMessage": "",
      "screener": ["GLP1"],
      "category": ["Weightloss"]
    }
  ]
}
```

## 🔧 **n8n Workflow Setup**

### **Step 1: Create Webhook Trigger**
1. Add **Webhook** node
2. Set HTTP Method: `POST`
3. Set Path: `notion-questions`
4. Enable Response

### **Step 2: Add Notion API Call**
1. Add **Notion** node
2. Set Operation: `Query Database`
3. Configure:
   - **Database ID**: `{{ $json.databaseId }}`
   - **Filter**: 
     ```json
     {
       "property": "property_screener",
       "multi_select": {
         "contains": "{{ $json.screenerType }}"
       }
     }
     ```
   - **Sorts**:
     ```json
     [
       {
         "property": "property_question_number",
         "direction": "ascending"
       }
     ]
     ```

### **Step 3: Transform Data**
1. Add **Code** node
2. Use this JavaScript:

```javascript
// Get the input data
const screenerType = $input.first().json.screenerType;
const notionResults = $input.first().json.results;

// Transform Notion data to our format
const questions = notionResults.map(page => {
  const properties = page.properties;
  
  // Helper function to get property values
  function getPropertyValue(props, propName, isArray = false) {
    const prop = props[propName];
    if (!prop) return isArray ? [] : '';
    
    if (isArray) {
      if (prop.type === 'multi_select') {
        return prop.multi_select.map(item => item.name);
      }
      return [];
    }
    
    switch (prop.type) {
      case 'title':
        return prop.title[0]?.plain_text || '';
      case 'rich_text':
        return prop.rich_text[0]?.plain_text || '';
      case 'select':
        return prop.select?.name || '';
      case 'number':
        return prop.number || 0;
      case 'checkbox':
        return prop.checkbox;
      case 'date':
        return prop.date?.start || '';
      default:
        return '';
    }
  }
  
  return {
    id: page.id,
    name: getPropertyValue(properties, 'name'),
    questionText: getPropertyValue(properties, 'property_question_text'),
    inputType: getPropertyValue(properties, 'property_input_type'),
    section: getPropertyValue(properties, 'property_section'),
    questionNumber: getPropertyValue(properties, 'property_question_number'),
    showCondition: getPropertyValue(properties, 'property_show_condition'),
    safe: getPropertyValue(properties, 'property_safe'),
    disqualify: getPropertyValue(properties, 'property_disqualify'),
    flag: getPropertyValue(properties, 'property_flag'),
    disqualifyMessage: getPropertyValue(properties, 'property_disqualify_message'),
    screener: getPropertyValue(properties, 'property_screener', true),
    category: getPropertyValue(properties, 'property_category', true)
  };
});

// Return the response
return {
  success: true,
  questions: questions
};
```

### **Step 4: Set Response**
1. Add **Respond to Webhook** node
2. Set Response Code: `200`
3. Set Response Body: `{{ $json }}`

## 🧪 **Testing**

### **Test with cURL:**
```bash
curl -X POST https://locumtele.app.n8n.cloud/webhook/notion-questions \
  -H "Content-Type: application/json" \
  -d '{
    "screenerType": "GLP1",
    "databaseId": "26e82abf7eae80f5ae8eeb0c7ecc76f0",
    "notionSecret": "YOUR_NOTION_SECRET_HERE"
  }'
```

### **Expected Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "question-1",
      "name": "full_name",
      "questionText": "What is your full name?",
      "inputType": "text",
      "section": "Patient Profile",
      "questionNumber": 1,
      "showCondition": "always",
      "safe": "any_text",
      "disqualify": "",
      "flag": "",
      "disqualifyMessage": "",
      "screener": ["GLP1"],
      "category": ["Weightloss"]
    }
  ]
}
```

## 🔒 **Security Notes**
- The Notion secret is passed in the request body
- Consider using environment variables in n8n for the secret
- The webhook should validate the request format
- Consider adding rate limiting

## 🚀 **Benefits**
- ✅ **No CORS issues** - n8n handles the Notion API call
- ✅ **Secure** - Notion secret stays on server side
- ✅ **Reliable** - n8n handles retries and error handling
- ✅ **Scalable** - Can add caching, rate limiting, etc.
