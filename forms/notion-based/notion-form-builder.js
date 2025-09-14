// Notion Form Builder - Dynamic form generation from Notion database
// This file fetches questions from Notion and builds forms dynamically

class NotionFormBuilder {
    constructor(notionSecret, databaseId) {
        this.notionSecret = notionSecret;
        this.databaseId = databaseId;
        this.baseUrl = 'https://api.notion.com/v1';
    }

    // Fetch questions from Notion database
    async fetchQuestions(screenerType) {
        try {
            const response = await fetch(`${this.baseUrl}/databases/${this.databaseId}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.notionSecret}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                },
                body: JSON.stringify({
                    filter: {
                        property: 'property_screener',
                        multi_select: {
                            contains: screenerType
                        }
                    },
                    sorts: [
                        {
                            property: 'property_question_number',
                            direction: 'ascending'
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`Notion API error: ${response.status}`);
            }

            const data = await response.json();
            return this.transformNotionData(data.results);
        } catch (error) {
            console.error('Error fetching questions from Notion:', error);
            throw error;
        }
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
        const options = this.parseOptions(question.safe);
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
        const options = this.parseOptions(question.safe);
        const required = question.disqualify || question.safe !== 'any_text' ? 'required' : '';
        
        let html = '<div class="checkbox-group">';
        options.forEach((option, index) => {
            const optionId = `${questionId}_${index}`;
            const value = this.sanitizeValue(option);
            html += `
                <div class="checkbox-option">
                    <input type="checkbox" id="${optionId}" name="${inputName}" value="${value}" ${required}>
                    <label for="${optionId}">${option}</label>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // Generate textarea input
    generateTextareaInput(question, questionId, inputName) {
        const required = question.disqualify || question.safe !== 'any_text' ? 'required' : '';
        return `<textarea class="textarea-input" id="${questionId}" name="${inputName}" ${required} placeholder="Enter details"></textarea>`;
    }

    // Parse options from safe values (dynamic from Notion)
    parseOptions(safeValue) {
        if (!safeValue || safeValue === 'any_text' || safeValue === 'any_valid' || safeValue === 'any_email' || safeValue === 'any_phone') {
            return ['Yes', 'No']; // Default for boolean questions - could be made configurable
        }
        return safeValue.split(',').map(opt => opt.trim());
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
