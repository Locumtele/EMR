// Notion Form Builder - Dynamic form generation from Notion database
// This file fetches questions from Notion and builds forms dynamically

class NotionFormBuilder {
    constructor(notionSecret, databaseId) {
        this.notionSecret = notionSecret;
        this.databaseId = databaseId;
        this.baseUrl = 'https://api.notion.com/v1';
        this.n8nWebhookUrl = 'https://locumtele.app.n8n.cloud/webhook/notion-questions';
    }

    // Fetch questions from Notion database via n8n webhook
    async fetchQuestions(screenerType) {
        try {
            console.log(`Fetching questions for screener: ${screenerType}`);
            
            const response = await fetch(this.n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    screenerType: screenerType,
                    databaseId: this.databaseId,
                    notionSecret: this.notionSecret
                })
            });

            if (!response.ok) {
                throw new Error(`n8n webhook error: ${response.status}`);
            }

            const data = await response.json();
            
            // Handle different response formats
            if (Array.isArray(data) && data.length > 0 && data[0].content) {
                // New format: array with content field containing JSON string
                console.log(`Successfully loaded questions from new format`);
                const content = JSON.parse(data[0].content);
                return this.transformNewFormat(content.questions);
            } else if (data.success && data.questions) {
                // Original n8n format
                console.log(`Successfully loaded ${data.questions.length} questions from Notion via n8n`);
                return data.questions;
            } else {
                throw new Error('Invalid response from webhook');
            }
        } catch (error) {
            console.error('Error fetching questions from n8n webhook:', error);
            console.log('Falling back to demo questions');
            return this.getDemoQuestions(screenerType);
        }
    }

    // Demo questions as fallback when Notion API is not accessible
    getDemoQuestions(screenerType) {
        console.log('Using demo questions as fallback');
        return [
            {
                id: 'demo-1',
                name: 'full_name',
                questionText: 'What is your full name?',
                inputType: 'text',
                section: 'Patient Profile',
                questionNumber: 1,
                showCondition: 'always',
                safe: 'any_text',
                disqualify: '',
                flag: '',
                disqualifyMessage: '',
                screener: [screenerType],
                category: ['Weightloss']
            },
            {
                id: 'demo-2',
                name: 'email_address',
                questionText: 'What is your email address?',
                inputType: 'email',
                section: 'Patient Profile',
                questionNumber: 2,
                showCondition: 'always',
                safe: 'any_email',
                disqualify: '',
                flag: '',
                disqualifyMessage: '',
                screener: [screenerType],
                category: ['Weightloss']
            },
            {
                id: 'demo-3',
                name: 'phone_number',
                questionText: 'What is your phone number?',
                inputType: 'tel',
                section: 'Patient Profile',
                questionNumber: 3,
                showCondition: 'always',
                safe: 'any_phone',
                disqualify: '',
                flag: '',
                disqualifyMessage: '',
                screener: [screenerType],
                category: ['Weightloss']
            },
            {
                id: 'demo-4',
                name: 'age_verification',
                questionText: 'Are you 18 years or older?',
                inputType: 'radio',
                section: 'Eligibility',
                questionNumber: 4,
                showCondition: 'always',
                safe: 'yes,no',
                disqualify: 'no',
                flag: '',
                disqualifyMessage: 'You must be 18 years or older to use this service.',
                screener: [screenerType],
                category: ['Weightloss']
            },
            {
                id: 'demo-5',
                name: 'weight_goal',
                questionText: 'What is your weight loss goal?',
                inputType: 'radio',
                section: 'Goals',
                questionNumber: 5,
                showCondition: 'always',
                safe: '10-20 pounds,20-40 pounds,40+ pounds',
                disqualify: '',
                flag: '',
                disqualifyMessage: '',
                screener: [screenerType],
                category: ['Weightloss']
            }
        ];
    }

    // Transform Notion data to our internal format
    transformNotionData(notionResults) {
        return notionResults.map(page => {
            const properties = page.properties;
            return {
                id: page.id,
                name: this.getPropertyValue(properties, 'name'),
                questionText: this.getPropertyValue(properties, 'property_question_text'),
                inputType: this.getPropertyValue(properties, 'property_input_type'),
                section: this.getPropertyValue(properties, 'property_section'),
                questionNumber: this.getPropertyValue(properties, 'property_question_number'),
                showCondition: this.getPropertyValue(properties, 'property_show_condition'),
                safe: this.getPropertyValue(properties, 'property_safe'),
                disqualify: this.getPropertyValue(properties, 'property_disqualify'),
                flag: this.getPropertyValue(properties, 'property_flag'),
                disqualifyMessage: this.getPropertyValue(properties, 'property_disqualify_message'),
                screener: this.getPropertyValue(properties, 'property_screener', true), // array
                category: this.getPropertyValue(properties, 'property_category', true) // array
            };
        });
    }

    // Transform new reliable format to our internal format
    transformNewFormat(questions) {
        return questions.map(question => ({
            id: question.id.toString(),
            name: this.sanitizeName(question.text),
            questionText: question.text,
            inputType: question.type,
            section: question.section,
            questionNumber: question.id,
            showCondition: question.showCondition,
            safe: Array.isArray(question.safe) ? question.safe.join(',') : question.safe,
            disqualify: Array.isArray(question.disqualify) ? question.disqualify.join(',') : question.disqualify,
            flag: Array.isArray(question.flag) ? question.flag.join(',') : question.flag,
            disqualifyMessage: question.disqualifyMessage,
            screener: [question.category], // Use category as screener
            category: [question.category]
        }));
    }


    // Helper to get property values from Notion
    getPropertyValue(properties, propertyName, isArray = false) {
        const property = properties[propertyName];
        if (!property) return isArray ? [] : '';

        switch (property.type) {
            case 'title':
                return property.title[0]?.plain_text || '';
            case 'rich_text':
                return property.rich_text[0]?.plain_text || '';
            case 'select':
                return property.select?.name || '';
            case 'multi_select':
                return property.multi_select.map(item => item.name);
            case 'number':
                return property.number;
            case 'checkbox':
                return property.checkbox;
            case 'date':
                return property.date?.start || '';
            default:
                return isArray ? [] : '';
        }
    }

    // Group questions by section
    groupQuestionsBySection(questions) {
        const sections = {};
        questions.forEach(question => {
            if (!sections[question.section]) {
                sections[question.section] = [];
            }
            sections[question.section].push(question);
        });
        return sections;
    }

    // Generate HTML for a single question
    generateQuestionHTML(question) {
        const questionId = this.sanitizeId(question.name);
        const inputName = this.sanitizeName(question.name);
        
        let html = `<div class="question" id="question_${questionId}">`;
        html += `<label class="question-label" for="${questionId}">${question.questionText}</label>`;
        
        // Special case for height questions - generate two separate inputs
        if (question.name.toLowerCase().includes('height') && question.inputType === 'number') {
            html += this.generateHeightInputs(question, questionId, inputName);
        } else {
            switch (question.inputType) {
                case 'text':
                case 'email':
                case 'phone':
                case 'date':
                    html += this.generateTextInput(question, questionId, inputName);
                    break;
                case 'number':
                    html += this.generateNumberInput(question, questionId, inputName);
                    break;
                case 'radio':
                    html += this.generateRadioInput(question, questionId, inputName);
                    break;
                case 'checkbox':
                    html += this.generateCheckboxInput(question, questionId, inputName);
                    break;
                case 'textarea':
                    html += this.generateTextareaInput(question, questionId, inputName);
                    break;
            }
        }
        
        html += '</div>';
        return html;
    }

    // Generate text input
    generateTextInput(question, questionId, inputName) {
        const required = question.disqualify || question.safe !== 'any_text' ? 'required' : '';
        const placeholder = this.getPlaceholder(question.inputType);
        return `<input class="text-input" id="${questionId}" name="${inputName}" type="${question.inputType}" ${required} placeholder="${placeholder}">`;
    }

    // Generate number input
    generateNumberInput(question, questionId, inputName) {
        const required = question.disqualify || question.safe !== 'any_valid' ? 'required' : '';
        return `<input class="text-input" id="${questionId}" name="${inputName}" type="number" ${required} placeholder="Enter value">`;
    }

    // Generate radio input
    generateRadioInput(question, questionId, inputName) {
        // For radio buttons, we need to get all possible options, not just safe ones
        const options = this.getAllOptions(question);
        const required = question.disqualify || question.safe !== 'any_text' ? 'required' : '';
        
        let html = '<div class="radio-group">';
        options.forEach((option, index) => {
            const optionId = `${questionId}_${index}`;
            const value = this.sanitizeValue(option);
            html += `
                <div class="radio-option">
                    <input type="radio" id="${optionId}" name="${inputName}" value="${value}" ${required}>
                    <label for="${optionId}">${option}</label>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // Generate checkbox input
    generateCheckboxInput(question, questionId, inputName) {
        // For checkboxes, we need to get all possible options, not just safe ones
        const options = this.getAllOptions(question);
        const required = question.disqualify || question.safe !== 'any_text' ? 'required' : '';
        
        let html = '<div class="checkbox-group">';
        
        // Handle special case where "none" is the only safe option
        if (options.length === 1 && options[0] === 'None') {
            html += `
                <div class="checkbox-option">
                    <input type="checkbox" id="${questionId}_none" name="${inputName}" value="none">
                    <label for="${questionId}_none">None of the above</label>
                </div>
            `;
        } else {
            // Sort options to put "None" last
            const sortedOptions = this.sortOptionsForCheckbox(options);
            
            sortedOptions.forEach((option, index) => {
                const optionId = `${questionId}_${index}`;
                const value = this.sanitizeValue(option);
                const label = option === 'None' ? 'None of the above' : option;
                html += `
                    <div class="checkbox-option">
                        <input type="checkbox" id="${optionId}" name="${inputName}" value="${value}">
                        <label for="${optionId}">${label}</label>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        return html;
    }

    // Generate textarea input
    generateTextareaInput(question, questionId, inputName) {
        const required = question.disqualify || question.safe !== 'any_text' ? 'required' : '';
        return `<textarea class="textarea-input" id="${questionId}" name="${inputName}" ${required} placeholder="Enter details"></textarea>`;
    }

    // Generate height inputs (feet and inches)
    generateHeightInputs(question, questionId, inputName) {
        const required = question.disqualify || question.safe !== 'any_valid' ? 'required' : '';
        return `
            <div class="sub-questions three-col">
                <div class="sub-question">
                    <label class="question-label" for="${questionId}_feet">Height (feet)</label>
                    <input class="text-input" id="${questionId}_feet" name="${inputName}_feet" type="number" min="3" max="8" placeholder="5" ${required}>
                </div>
                <div class="sub-question">
                    <label class="question-label" for="${questionId}_inches">Height (inches)</label>
                    <input class="text-input" id="${questionId}_inches" name="${inputName}_inches" type="number" min="0" max="11" placeholder="6" ${required}>
                </div>
            </div>
        `;
    }

    // Get all possible options for a question (combines safe, disqualify, and flag options)
    getAllOptions(question) {
        const allOptions = new Set();
        
        // Add safe options
        if (question.safe) {
            const safeOptions = this.parseOptions(question.safe);
            safeOptions.forEach(opt => allOptions.add(opt));
        }
        
        // Add disqualify options
        if (question.disqualify) {
            const disqualifyOptions = this.parseOptions(question.disqualify);
            disqualifyOptions.forEach(opt => allOptions.add(opt));
        }
        
        // Add flag options
        if (question.flag) {
            const flagOptions = this.parseOptions(question.flag);
            flagOptions.forEach(opt => allOptions.add(opt));
        }
        
        // If no options found, use safe as fallback
        if (allOptions.size === 0 && question.safe) {
            const safeOptions = this.parseOptions(question.safe);
            safeOptions.forEach(opt => allOptions.add(opt));
        }
        
        // Convert Set to Array and sort
        const options = Array.from(allOptions);
        
        // Sort options to put "No" first, "Yes" second, then alphabetically
        return options.sort((a, b) => {
            if (a === 'No') return -1;
            if (b === 'No') return 1;
            if (a === 'Yes') return -1;
            if (b === 'Yes') return 1;
            return a.localeCompare(b);
        });
    }

    // Sort options for checkboxes to put "None" last
    sortOptionsForCheckbox(options) {
        return options.sort((a, b) => {
            // Put "None" at the end
            if (a === 'None') return 1;
            if (b === 'None') return -1;
            // Sort everything else alphabetically
            return a.localeCompare(b);
        });
    }

    // Parse options from safe values (dynamic from Notion)
    parseOptions(safeValue) {
        if (!safeValue || safeValue === 'any_text' || safeValue === 'any_valid' || safeValue === 'any_email' || safeValue === 'any_phone') {
            return ['Yes', 'No']; // Default for boolean questions
        }
        
        // Handle special cases
        if (safeValue === 'none') {
            return ['None'];
        }
        
        if (safeValue === 'no') {
            return ['No', 'Yes'];
        }
        
        if (safeValue === 'yes') {
            return ['Yes', 'No'];
        }
        
        // Split by comma and clean up
        const options = safeValue.split(',').map(opt => {
            let cleaned = opt.trim();
            // Convert underscores to spaces and capitalize
            cleaned = cleaned.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return cleaned;
        });
        
        return options;
    }

    // Get placeholder text (could be made configurable via Notion)
    getPlaceholder(inputType) {
        const placeholders = {
            'text': 'Enter text',
            'email': 'Enter your email address',
            'phone': 'Enter your phone number',
            'date': 'MM/DD/YYYY'
        };
        return placeholders[inputType] || 'Enter value';
    }

    // Sanitize ID for HTML
    sanitizeId(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    // Sanitize name for form
    sanitizeName(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    // Sanitize value for form
    sanitizeValue(value) {
        return value.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    // Build complete form HTML
    async buildForm(screenerType, containerId) {
        try {
            const questions = await this.fetchQuestions(screenerType);
            const sections = this.groupQuestionsBySection(questions);
            
            let html = '';
            Object.keys(sections).forEach(sectionName => {
                html += `<div class="question-group" id="${this.sanitizeId(sectionName)}-section">`;
                html += `<div class="question-title">${sectionName}</div>`;
                
                sections[sectionName].forEach(question => {
                    html += this.generateQuestionHTML(question);
                });
                
                html += '</div>';
            });
            
            document.getElementById(containerId).innerHTML = html;
            return questions; // Return questions for validation logic
        } catch (error) {
            console.error('Error building form:', error);
            document.getElementById(containerId).innerHTML = '<p>Error loading form. Please refresh the page.</p>';
            throw error;
        }
    }
}

// Export for use in other files
window.NotionFormBuilder = NotionFormBuilder;
