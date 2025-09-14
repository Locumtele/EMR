// ===== DYNAMIC FORM GENERATOR FOR GHL =====
// Auto-detects screener type from URL and loads configuration from GitHub Pages
// Place this in GHL HTML/Code section along with the CSS

// ===== CONFIGURATION =====
const FORM_CONFIG = {
    baseUrl: 'https://locumtele.github.io/EMR/centralized/form-configs/configs/',
    submitEndpoint: 'https://locumtele.app.n8n.cloud/webhook/patient-screener'
};

// ===== AUTO-DETECT SCREENER FROM URL =====
function getScreenerFromURL() {
    const path = window.location.pathname.toLowerCase();
    const screenerMatch = path.match(/\/([^\/]+)-screener/);

    if (screenerMatch) {
        return screenerMatch[1].toLowerCase();
    }

    // Fallback - try to extract from any path containing screener keywords
    const knownScreeners = ['glp1', 'trt', 'hrt', 'sermorelin', 'nad', 'antiaging', 'hair', 'sexual'];
    for (const screener of knownScreeners) {
        if (path.includes(screener)) {
            return screener;
        }
    }

    return 'glp1'; // Default fallback
}

// ===== TRACKING DATA CAPTURE =====
function getTrackingData() {
    const urlParams = new URLSearchParams(window.location.search);

    const utmParams = {
        utm_source: urlParams.get('utm_source') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        utm_content: urlParams.get('utm_content') || '',
        utm_term: urlParams.get('utm_term') || ''
    };

    // GHL merge tags - these will be replaced by GoHighLevel
    const locationId = '{{location.id}}';
    const locationName = '{{location.name}}';
    const rootDomain = '{{custom_values.root_domain}}';
    const customPrivate = '{{custom_values.private}}';

    const ghlData = {
        location_id: locationId.includes('{{') ? '' : locationId,
        location_name: locationName.includes('{{') ? '' : locationName,
        root_domain: rootDomain.includes('{{') ? '' : rootDomain,
        custom_private: customPrivate.includes('{{') ? '' : customPrivate
    };

    const additionalParams = {};
    for (const [key, value] of urlParams.entries()) {
        if (!key.startsWith('utm_')) {
            additionalParams[key] = value;
        }
    }

    return {
        utm_params: utmParams,
        ghl_data: ghlData,
        additional_params: additionalParams,
        page_url: window.location.href,
        referrer: document.referrer || '',
        detected_screener: getScreenerFromURL()
    };
}

// ===== FORM GENERATOR CLASS =====
class DynamicFormGenerator {
    constructor() {
        this.formData = null;
        this.container = document.getElementById('dynamic-form-container');
        this.trackingData = getTrackingData();
        this.screenerType = getScreenerFromURL();

        if (!this.container) {
            console.error('Container element "dynamic-form-container" not found');
            return;
        }
    }

    async init() {
        try {
            console.log(`Loading ${this.screenerType} screener configuration...`);

            const configUrl = `${FORM_CONFIG.baseUrl}${this.screenerType}.json`;
            console.log('Config URL:', configUrl);

            const response = await fetch(configUrl);

            if (!response.ok) {
                throw new Error(`Config not found: ${response.status} - ${configUrl}`);
            }

            this.formData = await response.json();
            console.log(`Loaded ${this.formData.screener} config:`, this.formData);
            console.log(`Last updated: ${this.formData.lastUpdated}`);

            this.renderForm();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to load form config:', error);
            this.showError(error.message);
        }
    }

    showError(message) {
        this.container.innerHTML = `
            <div style="padding: 30px; background: #f8f8f8; border-radius: 8px; text-align: center; border: 1px solid #ddd;">
                <h3 style="color: #d32f2f; margin-bottom: 15px;">⚠️ Unable to load ${this.screenerType.toUpperCase()} screener</h3>
                <p style="color: #666; margin-bottom: 20px;">${message}</p>
                <p style="color: #666; font-size: 14px;">Please refresh the page or contact support if the problem persists.</p>
                <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: black; color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh Page</button>
            </div>
        `;
    }

    renderForm() {
        const sections = this.groupBySection(this.formData.questions);

        let formHTML = '<form id="dynamicForm" class="form-content">';

        Object.entries(sections).forEach(([sectionName, questions]) => {
            formHTML += `<div class="question-group">`;
            formHTML += `<div class="question-title">${sectionName}</div>`;

            questions.forEach(q => {
                formHTML += this.renderQuestion(q);
            });

            formHTML += `</div>`;
        });

        formHTML += `
            <div class="submit-container">
                <button type="submit" class="nav-button" id="submit-btn">SUBMIT</button>
            </div>
            <div id="result-display" class="result-display"></div>
        </form>`;

        this.container.innerHTML = formHTML;
    }

    renderQuestion(question) {
        const showCondition = question.showCondition !== 'always' ?
            `style="display:none" data-show-condition="${question.showCondition}" data-question-id="${question.id}"` :
            `data-question-id="${question.id}"`;

        let html = `<div class="question" ${showCondition}>`;
        html += `<label class="question-label">${question.text}</label>`;

        const fieldName = `q_${question.id}`;
        const isRequired = question.showCondition === 'always' ? 'required' : '';

        switch (question.type) {
            case 'text':
                html += `<input class="text-input" name="${fieldName}" type="text" ${isRequired} placeholder="Enter your response">`;
                break;
            case 'email':
                html += `<input class="text-input" name="${fieldName}" type="email" ${isRequired} placeholder="Enter your email address">`;
                break;
            case 'phone':
                html += `<input class="text-input" name="${fieldName}" type="tel" ${isRequired} placeholder="Enter your phone number">`;
                break;
            case 'date':
                html += `<input class="text-input" name="${fieldName}" type="text" ${isRequired} placeholder="MM/DD/YYYY">`;
                break;
            case 'number':
                html += `<input class="text-input" name="${fieldName}" type="number" ${isRequired} placeholder="Enter number">`;
                break;

            case 'radio':
                html += `<div class="radio-group">`;
                const allOptions = [...new Set([...question.safe, ...question.flag, ...question.disqualify])];
                allOptions.forEach(option => {
                    const id = `${fieldName}_${option.replace(/[^a-zA-Z0-9]/g, '_')}`;
                    html += `
                        <div class="radio-option">
                            <input type="radio" id="${id}" name="${fieldName}" value="${option}" ${isRequired}>
                            <label for="${id}">${this.formatOptionText(option)}</label>
                        </div>`;
                });
                html += `</div>`;
                break;

            case 'checkbox':
                html += `<div class="checkbox-group">`;
                const allCheckboxOptions = [...new Set([...question.safe, ...question.flag, ...question.disqualify])];
                allCheckboxOptions.forEach(option => {
                    const id = `${fieldName}_${option.replace(/[^a-zA-Z0-9]/g, '_')}`;
                    html += `
                        <div class="checkbox-option">
                            <input type="checkbox" id="${id}" name="${fieldName}" value="${option}">
                            <label for="${id}">${this.formatOptionText(option)}</label>
                        </div>`;
                });
                html += `</div>`;
                break;
        }

        html += `</div>`;
        return html;
    }

    formatOptionText(value) {
        const textMap = {
            // Basic options
            'male': 'Male',
            'female': 'Female',
            'yes': 'Yes',
            'no': 'No',
            'none': 'None of the above',
            'any_text': 'Any text input',

            // Alcohol consumption
            '0-2_weekly': '0-2 drinks/week',
            '3-5_weekly': '3-5 drinks/week',
            '1-2_daily': '1-2 drinks/day',
            '2+_daily': '2+ drinks/day',

            // Exercise levels
            'low': 'Low',
            'moderate': 'Moderate',
            'high': 'High',

            // Medical conditions
            'diabetes_type1': 'Diabetes Mellitus Type 1',
            'diabetes_type2': 'Diabetes Mellitus Type 2',
            'diabetic_retinopathy': 'Diabetic Retinopathy',
            'diabetic_ketoacidosis': 'Diabetic Ketoacidosis',
            'pancreatitis': 'Pancreatitis',
            'gallbladder_disease': 'Gallbladder Disease',
            'medullary_thyroid': 'Medullary Thyroid Carcinoma',
            'men2': 'Multiple Endocrine Neoplasia',
            'kidney_disease': 'Kidney disease/insufficiency/transplant/Acute Kidney Injury',
            'stomach_problems': 'Stomach Problems',
            'bariatric_surgery': 'Bariatric Surgery or other GI Surgery',
            'liver_disease': 'Liver Disease/Cirrhosis',
            'leber_neuropathy': 'Leber Hereditary Optic Neuropathy',

            // GLP-1 medications
            'semaglutide': 'Semaglutide',
            'tirzepatide': 'Tirzepatide',
            'dulaglutide': 'Dulaglutide (Trulicity)',
            'exenatide': 'Exenatide (Bydureon/Byetta)',
            'liraglutide': 'Liraglutide (Victoza/Saxenda)',
            'lixisenatide': 'Lixisenatide (Adlyxin)',
            'other_glp1': 'A Different GLP-1',

            // Other medications
            'abiraterone': 'Abiraterone acetate',
            'somatrogon': 'Somatrogon-GHLA',
            'chloroquine': 'Chloroquine or Hydroxychloroquine',
            'insulin': 'Insulin',
            'insulin_secretagogues': 'Insulin secretagogues or Diabetic Medications',
            'other_glp1s': 'Other GLP-1s'
        };

        return textMap[value] || value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    groupBySection(questions) {
        return questions.reduce((sections, q) => {
            if (!sections[q.section]) sections[q.section] = [];
            sections[q.section].push(q);
            return sections;
        }, {});
    }

    setupEventListeners() {
        const form = document.getElementById('dynamicForm');

        form.addEventListener('change', (e) => {
            this.handleConditionalQuestions(e);
            this.checkForEarlyDisqualification();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    handleConditionalQuestions(e) {
        // Handle gender-based pregnancy question (question ID 5 in your CSV)
        if (e.target.name === 'q_5' && e.target.value === 'female') {
            const pregnancyQ = document.querySelector('[data-show-condition="if_gender_female"]');
            if (pregnancyQ) {
                pregnancyQ.style.display = 'block';
                const inputs = pregnancyQ.querySelectorAll('input');
                inputs.forEach(input => input.required = true);
            }
        } else if (e.target.name === 'q_5' && e.target.value === 'male') {
            const pregnancyQ = document.querySelector('[data-show-condition="if_gender_female"]');
            if (pregnancyQ) {
                pregnancyQ.style.display = 'none';
                const inputs = pregnancyQ.querySelectorAll('input');
                inputs.forEach(input => {
                    input.required = false;
                    input.checked = false;
                });
            }
        }

        // Handle tobacco follow-up (question ID 17 in your CSV)
        if (e.target.name === 'q_17' && e.target.value === 'yes') {
            const tobaccoQ = document.querySelector('[data-show-condition="if_tobacco_yes"]');
            if (tobaccoQ) {
                tobaccoQ.style.display = 'block';
            }
        } else if (e.target.name === 'q_17' && e.target.value === 'no') {
            const tobaccoQ = document.querySelector('[data-show-condition="if_tobacco_yes"]');
            if (tobaccoQ) {
                tobaccoQ.style.display = 'none';
                const inputs = tobaccoQ.querySelectorAll('input');
                inputs.forEach(input => {
                    input.value = '';
                });
            }
        }
    }

    checkForEarlyDisqualification() {
        const form = document.getElementById('dynamicForm');
        const formData = new FormData(form);

        for (const question of this.formData.questions) {
            const value = formData.get(`q_${question.id}`);
            const values = formData.getAll(`q_${question.id}`);

            // Check single values
            if (question.disqualify.includes(value)) {
                this.showDisqualification(question.disqualifyMessage);
                return;
            }

            // Check multiple values (checkboxes) - disqualify if any disqualify value is selected AND "none" is not selected
            const hasDisqualifyValue = values.some(val => question.disqualify.includes(val));
            const hasNoneValue = values.includes('none');

            if (hasDisqualifyValue && !hasNoneValue) {
                this.showDisqualification(question.disqualifyMessage);
                return;
            }
        }
    }

    showDisqualification(message) {
        // Hide form sections
        document.querySelectorAll('.question-group').forEach(group => {
            group.style.display = 'none';
        });

        document.getElementById('submit-btn').style.display = 'none';

        const resultDisplay = document.getElementById('result-display');
        resultDisplay.style.display = 'block';
        resultDisplay.className = 'result-display result-disqualify';

        if (message === 'DEPRESSION_SPECIAL_MESSAGE') {
            resultDisplay.innerHTML = `
                <div style="font-size: 18px; margin-bottom: 10px;">❌ Not Eligible for Treatment</div>
                <div style="text-align:left; max-width:720px; margin:0 auto; font-size: 14px; font-weight: normal; line-height:1.5;">
                    <p><strong>We care about your safety.</strong></p>
                    <p>Because you indicated that you are feeling depressed or having thoughts of suicide, you are not eligible to continue with this program/medication at this time.</p>
                    <p>You are not alone, and help is available:</p>
                    <ul style="margin-left: 18px;">
                        <li>Call or text 988 to connect with the Suicide & Crisis Lifeline.</li>
                        <li>If you are in immediate danger of harming yourself, call 911 or go to the nearest Emergency Department.</li>
                    </ul>
                    <p>Please reach out to a trusted family member, friend, or mental health professional today.</p>
                    <p>Your wellbeing is our top priority.</p>
                </div>
                <div style="margin-top: 16px; text-align:center;">
                    <button onclick="location.reload()" style="background:black;color:white;border:none;padding:10px 18px;border-radius:6px;cursor:pointer;">Start Over</button>
                </div>
            `;
        } else {
            resultDisplay.innerHTML = `
                <div style="font-size: 18px; margin-bottom: 10px;">❌ Not Eligible for Treatment</div>
                <div style="font-size: 14px; font-weight: normal;">${message}</div>
                <div style="margin-top: 16px;">
                    <button onclick="location.reload()" style="background:black;color:white;border:none;padding:10px 18px;border-radius:6px;cursor:pointer;">Start Over</button>
                </div>
            `;
        }

        resultDisplay.scrollIntoView({ behavior: 'smooth' });
    }

    async handleSubmit() {
        const form = document.getElementById('dynamicForm');
        const formData = new FormData(form);

        // Convert FormData to object for proper handling of multi-select
        const responses = {};
        const multiSelectResponses = {};

        for (const [key, value] of formData.entries()) {
            if (responses[key]) {
                // Handle multiple values (checkboxes)
                if (!multiSelectResponses[key]) {
                    multiSelectResponses[key] = [responses[key]];
                }
                multiSelectResponses[key].push(value);
            } else {
                responses[key] = value;
            }
        }

        const submissionData = {
            form_type: `${this.formData.screener}_Screening`,
            timestamp: new Date().toISOString(),
            responses: responses,
            multi_select_responses: multiSelectResponses,
            tracking_data: this.trackingData,
            config_metadata: {
                config_updated: this.formData.lastUpdated,
                total_questions: this.formData.totalQuestions,
                screener_type: this.formData.screener
            }
        };

        try {
            console.log('Submitting form data:', submissionData);

            const response = await fetch(FORM_CONFIG.submitEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            });

            console.log('Submit response:', response.status, response.statusText);

            if (response.ok) {
                // Trigger GHL redirect event
                const redirectEvent = new CustomEvent('ghlRedirect', {
                    detail: {
                        category: 'weightloss',  // You might want to make this dynamic based on screener type
                        formType: this.formData.screener.toLowerCase()
                    }
                });
                window.dispatchEvent(redirectEvent);

                // Fallback redirect after 1 second
                setTimeout(() => {
                    const rootDomain = this.trackingData.ghl_data.root_domain || window.location.origin;
                    const redirectUrl = `${rootDomain}/weightloss-fee`;

                    if (typeof window.redirectToURL === 'function') {
                        window.redirectToURL(redirectUrl);
                    } else {
                        window.location.href = redirectUrl;
                    }
                }, 1000);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('There was an error submitting your form. Please try again.');
        }
    }
}

// ===== INITIALIZE WHEN DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Dynamic Form Generator');
    const formGenerator = new DynamicFormGenerator();
    formGenerator.init();
});