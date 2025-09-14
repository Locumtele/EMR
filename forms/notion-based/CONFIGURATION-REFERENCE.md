# Configuration Reference Sheet

## 🔗 **Required Links & IDs**

### **Notion Configuration**
| Field | Current Value | Your Value | Notes |
|-------|---------------|------------|-------|
| **Notion Secret** | `YOUR_NOTION_SECRET_HERE` | ⚠️ **REQUIRED** | Your Notion integration secret |
| **Screener Database ID** | `26e82abf7eae80f5ae8eeb0c7ecc76f0` | ✅ **UPDATED** | Your Notion database ID |
| **Database URL** | `https://www.notion.so/vertimd/26e82abf7eae80f5ae8eeb0c7ecc76f0` | ✅ **UPDATED** | Your Notion database URL |

### **Webhook Configuration**
| Field | Current Value | Your Value | Notes |
|-------|---------------|------------|-------|
| **Webhook URL** | `https://locumtele.app.n8n.cloud/webhook/patient-screener` | ✅ Already set | Your n8n webhook endpoint |
| **Method** | `POST` | ✅ Already set | HTTP method |
| **Content-Type** | `application/json` | ✅ Already set | Request format |

### **Redirect URLs (Category-Based)**
| Notion Category | Redirect Path | Your Value | Notes |
|-----------------|---------------|------------|-------|
| **Weightloss** | `weightloss-fee` | ⚠️ **VERIFY** | All weightloss screeners |
| **Antiaging** | `antiaging-fee` | ⚠️ **VERIFY** | All antiaging screeners |
| **Hormone** | `hormone-fee` | ⚠️ **VERIFY** | All hormone screeners |
| **HairSkin** | `hairandskin-fee` | ⚠️ **VERIFY** | All hair/skin screeners |
| **Sexual** | `sexualhealth-fee` | ⚠️ **VERIFY** | All sexual health screeners |
| **Disqualified** | - | `thankyou` | ⚠️ **VERIFY** | Where disqualified users go |

> **Note:** The system automatically reads the `property_category` from your Notion database and maps it to the appropriate redirect path. No hardcoded mappings needed!

### **GoHighLevel Merge Tags**
| Tag | Purpose | Example Value |
|-----|---------|---------------|
| `{{location.id}}` | Location ID | `12345` |
| `{{location.name}}` | Location Name | `Main Clinic` |
| `{{custom_values.root_domain}}` | Your domain | `https://yourclinic.com` |
| `{{custom_values.private}}` | Private value | `internal_value` |

## 🚀 **Deployment URLs**

### **Form URLs (After Deployment)**
| Screener | URL Format | Example |
|----------|------------|---------|
| **GLP1** | `https://yourdomain.com/dynamic-form.html?screener=GLP1&db=DATABASE_ID` | `https://clinic.com/dynamic-form.html?screener=GLP1&db=abc123` |
| **NAD** | `https://yourdomain.com/dynamic-form.html?screener=NAD&db=DATABASE_ID` | `https://clinic.com/dynamic-form.html?screener=NAD&db=abc123` |
| **Semorelin** | `https://yourdomain.com/dynamic-form.html?screener=Semorelin&db=DATABASE_ID` | `https://clinic.com/dynamic-form.html?screener=Semorelin&db=abc123` |

### **Alternative: Meta Tag Method**
```html
<!-- For embedding in other pages -->
<meta name="screener-type" content="GLP1">
<meta name="notion-database-id" content="your-database-id">
```

## 📋 **Setup Checklist**

### **Before Deployment:**
- [ ] Get Notion Database ID from your database URL
- [ ] Replace `YOUR_DATABASE_ID` in `dynamic-form.html`
- [ ] Verify webhook URL is correct
- [ ] Verify redirect paths match your site structure
- [ ] Test Notion API access with your secret

### **After Deployment:**
- [ ] Test GLP1 form: `yourdomain.com/dynamic-form.html?screener=GLP1&db=DATABASE_ID`
- [ ] Test NAD form: `yourdomain.com/dynamic-form.html?screener=NAD&db=DATABASE_ID`
- [ ] Test Semorelin form: `yourdomain.com/dynamic-form.html?screener=Semorelin&db=DATABASE_ID`
- [ ] Verify webhook receives data
- [ ] Test redirects work correctly

## 🔧 **File Locations**

| File | Purpose | Needs Updates? |
|------|---------|----------------|
| `dynamic-form.html` | Main form file | ⚠️ Database ID |
| `notion-form-builder.js` | Notion API integration | ✅ No changes needed |
| `generic-form-actions.js` | Form logic & webhooks | ⚠️ Verify webhook URL |
| `shared-styles.css` | All styling | ✅ No changes needed |

## 🆔 **How to Get Notion Database ID**

1. Open your Notion database
2. Copy the URL from your browser
3. Extract the ID from the URL:
   ```
   https://www.notion.so/your-workspace/abc123def456?v=...
   The ID is: abc123def456
   ```

## 🧪 **Testing URLs**

### **Local Testing:**
```
file:///path/to/dynamic-form.html?screener=GLP1&db=your-database-id
```

### **Production Testing:**
```
https://yourdomain.com/dynamic-form.html?screener=GLP1&db=your-database-id
```

## 📞 **Support Contacts**

| Issue | Contact | Notes |
|-------|---------|-------|
| **Notion API** | Notion Support | API access issues |
| **Webhook** | n8n Support | Webhook delivery issues |
| **GoHighLevel** | GHL Support | Merge tag issues |
| **Form Logic** | Development Team | Code-related issues |

---

**Last Updated:** [Current Date]  
**Version:** 1.0  
**Status:** Ready for Configuration
