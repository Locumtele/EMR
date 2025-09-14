// Generic Form Actions - Works with any screener type from Notion
// This file contains reusable form logic that works with dynamic questions

class GenericFormActions {
    constructor(formId, screenerType, questions) {
        this.form = document.getElementById(formId);
        this.screenerType = screenerType;
        this.questions = questions;
        this.resultDisplay = document.getElementById('result-display');
        this.trackingData = this.getTrackingData();
    }

    // Initialize the form
    init() {
        this.setupFollowUpQuestions();
        this.setupEarlyDisqualifyMonitoring();
        this.setupFormSubmission();
        this.setupStartOverButton();
    }

    // UTM and tracking parameter capture
    getTrackingData() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const utmParams = {
            utm_source: urlParams.get('utm_source') || '',
            utm_medium: urlParams.get('utm_medium') || '',
            utm_campaign: urlParams.get('utm_campaign') || '',
            utm_content: urlParams.get('utm_content') || '',
            utm_term: urlParams.get('utm_term') || ''
        };
        
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
            referrer: document.referrer || ''
        };
    }

    // Setup follow-up question logic
    setupFollowUpQuestions() {
        this.questions.forEach(question => {
            if (question.showCondition && question.showCondition !== 'always') {
                this.setupConditionalDisplay(question);
            }
        });
    }

    // Setup conditional display for questions
    setupConditionalDisplay(question) {
        const questionElement = document.getElementById(`question_${this.sanitizeId(question.name)}`);
        if (!questionElement) return;

        // Hide by default if conditional
        if (question.showCondition !== 'always') {
            questionElement.style.display = 'none';
        }

        // Setup trigger based on condition (dynamic from Notion)
        if (question.showCondition && question.showCondition.startsWith('if_')) {
            this.setupConditionalTrigger(question, questionElement);
        }
    }

    // Setup dynamic conditional display based on Notion showCondition
    setupConditionalTrigger(question, questionElement) {
        // Parse condition: "if_gender_female" -> {field: "gender", value: "female"}
        const condition = question.showCondition.replace('if_', '');
        const [field, value] = condition.split('_');
        
        // Find inputs for the field (supports partial matching)
        const fieldInputs = document.querySelectorAll(`input[name*="${field}"]`);
        
        fieldInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.value === value) {
                    questionElement.style.display = 'block';
                    this.makeRequired(questionElement, true);
                } else {
                    questionElement.style.display = 'none';
                    this.makeRequired(questionElement, false);
                    this.clearInputs(questionElement);
                }
            });
        });
    }

    // Make question required or not
    makeRequired(questionElement, required) {
        const inputs = questionElement.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.required = required;
        });
    }

    // Clear inputs in question
    clearInputs(questionElement) {
        const inputs = questionElement.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    }

    // Setup early disqualify monitoring
    setupEarlyDisqualifyMonitoring() {
        const disqualifierSelectors = this.getDisqualifierSelectors();
        
        const handler = () => {
            const formData = new FormData(this.form);
            const reason = this.getDisqualifyReason(formData);
            if (reason) {
                this.earlyDisqualify(reason);
            }
        };

        disqualifierSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(input => {
                input.addEventListener('change', handler);
            });
        });
    }

    // Get selectors for disqualifying inputs
    getDisqualifierSelectors() {
        const selectors = [];
        this.questions.forEach(question => {
            if (question.disqualify || question.disqualifyMessage) {
                const inputName = this.sanitizeName(question.name);
                if (question.inputType === 'checkbox') {
                    selectors.push(`input[name="${inputName}"]`);
                } else {
                    selectors.push(`input[name="${inputName}"]`);
                }
            }
        });
        return selectors;
    }

    // Check for disqualifying conditions
    getDisqualifyReason(formData) {
        for (const question of this.questions) {
            if (!question.disqualify && !question.disqualifyMessage) continue;

            const inputName = this.sanitizeName(question.name);
            const value = formData.get(inputName);
            const values = formData.getAll(inputName);

            // Check disqualification based on Notion configuration
            if (question.disqualify) {
                const disqualifyValues = question.disqualify.split(',');
                
                // Check for special disqualification types
                if (question.disqualify === 'under_18' && question.name.toLowerCase().includes('date')) {
                    if (this.isUnder18(value)) {
                        return question.disqualifyMessage || 'You must be 18 years or older to use this service.';
                    }
                } else if (question.disqualify === 'bmi_under_25') {
                    if (this.isBMITooLow(formData)) {
                        return question.disqualifyMessage || 'BMI must be 25 or higher.';
                    }
                } else {
                    // Check direct value disqualification
                    if (question.inputType === 'checkbox') {
                        const hasDisqualifyingValue = values.some(val => disqualifyValues.includes(val));
                        if (hasDisqualifyingValue) {
                            return question.disqualifyMessage || 'This condition is not suitable for treatment.';
                        }
                    } else {
                        if (disqualifyValues.includes(value)) {
                            return question.disqualifyMessage || 'This condition is not suitable for treatment.';
                        }
                    }
                }
            }

            // Check for special messages from Notion
            if (question.disqualifyMessage === 'DEPRESSION_SPECIAL_MESSAGE' && value === 'yes') {
                return 'DEPRESSION_SPECIAL_MESSAGE';
            }
        }

        return '';
    }

    // Check if under 18
    isUnder18(dateString) {
        if (!dateString) return false;
        const birthDate = new Date(dateString);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
        return actualAge < 18;
    }

    // Check if BMI is too low (dynamic field names from Notion)
    isBMITooLow(formData) {
        // Look for height and weight fields dynamically
        let heightFeet = 0;
        let weight = 0;
        
        // Find height field (supports various naming patterns)
        for (const [key, value] of formData.entries()) {
            if (key.toLowerCase().includes('height') && !isNaN(parseInt(value))) {
                heightFeet = parseInt(value);
            }
            if (key.toLowerCase().includes('weight') && !isNaN(parseInt(value))) {
                weight = parseInt(value);
            }
        }
        
        if (heightFeet > 0 && weight > 0) {
            const heightInches = heightFeet * 12;
            const bmi = (weight / (heightInches * heightInches)) * 703;
            return bmi < 25;
        }
        return false;
    }

    // Handle early disqualification
    earlyDisqualify(reason) {
        const formData = new FormData(this.form);
        const submissionData = {
            form_type: `${this.screenerType}_Screening`,
            timestamp: new Date().toISOString(),
            routing_outcome: 'DISQUALIFY',
            routing_reason: reason,
            responses: Object.fromEntries(formData.entries()),
            tracking_data: this.trackingData
        };

        // Hide all sections
        document.querySelectorAll('.question-group').forEach(group => {
            group.style.display = 'none';
        });
        
        // Hide submit button
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) submitBtn.style.display = 'none';

        // Show result
        this.resultDisplay.style.display = 'block';
        this.resultDisplay.className = 'result-display result-disqualify';
        
        if (reason === 'DEPRESSION_SPECIAL_MESSAGE') {
            this.resultDisplay.innerHTML = this.getDepressionMessage();
        } else {
            this.resultDisplay.innerHTML = this.getDisqualifyMessage(reason);
        }

        this.resultDisplay.scrollIntoView({ behavior: 'smooth' });

        // Disable form
        const inputs = this.form.querySelectorAll('input, textarea, button');
        inputs.forEach(el => { el.disabled = true; });
        
        // Re-enable start over button
        setTimeout(() => {
            const startOverBtn = document.getElementById('start-over');
            if (startOverBtn) startOverBtn.disabled = false;
        }, 100);
    }

    // Get depression message HTML
    getDepressionMessage() {
        return `
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
                <button id="start-over" style="background:black;color:white;border:none;padding:10px 18px;border-radius:6px;cursor:pointer;">Start Over</button>
            </div>
        `;
    }

    // Get disqualify message HTML
    getDisqualifyMessage(reason) {
        return `
            <div style="font-size: 18px; margin-bottom: 10px;">❌ Not Eligible for Treatment</div>
            <div style="font-size: 14px; font-weight: normal;">Thank you for starting your assessment - unfortunately, you don't qualify if ${reason}</div>
            <div style="margin-top: 16px;">
                <button id="start-over" style="background:black;color:white;border:none;padding:10px 18px;border-radius:6px;cursor:pointer;">Start Over</button>
            </div>
        `;
    }

    // Setup form submission
    setupFormSubmission() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission();
        });
    }

    // Handle form submission
    async handleFormSubmission() {
        const formData = new FormData(this.form);
        const result = this.determineRouting(formData);

        const submissionData = {
            form_type: `${this.screenerType}_Screening`,
            timestamp: new Date().toISOString(),
            routing_outcome: result.outcome,
            responses: Object.fromEntries(formData.entries()),
            tracking_data: this.trackingData
        };

        try {
            await this.sendWebhook(submissionData);
            
            if (result.outcome === 'PROCEED') {
                this.triggerRedirect(result.redirectUrl);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            if (result.outcome === 'PROCEED') {
                this.triggerRedirect(result.redirectUrl);
            }
        }
    }

    // Determine routing based on responses (dynamic field names from Notion)
    determineRouting(formData) {
        // Find name, email, phone fields dynamically
        let name = '';
        let email = '';
        let phone = '';
        
        for (const [key, value] of formData.entries()) {
            if (key.toLowerCase().includes('name') && !name) {
                name = value;
            }
            if (key.toLowerCase().includes('email') && !email) {
                email = value;
            }
            if (key.toLowerCase().includes('phone') && !phone) {
                phone = value;
            }
        }
        
        name = encodeURIComponent(name || '');
        email = encodeURIComponent(email || '');
        phone = encodeURIComponent(phone || '');
        
        let params = `?name=${name}&email=${email}&phone=${phone}`;
        
        // Add tracking parameters
        Object.entries(this.trackingData.utm_params).forEach(([key, value]) => {
            if (value) params += `&${key}=${encodeURIComponent(value)}`;
        });
        
        Object.entries(this.trackingData.ghl_data).forEach(([key, value]) => {
            if (value) params += `&${key}=${encodeURIComponent(value)}`;
        });
        
        Object.entries(this.trackingData.additional_params).forEach(([key, value]) => {
            if (value) params += `&${key}=${encodeURIComponent(value)}`;
        });

        // Check for disqualification
        const disqualifyReason = this.getDisqualifyReason(formData);
        if (disqualifyReason) {
            return {
                outcome: 'DISQUALIFY',
                redirectUrl: `${this.trackingData.ghl_data.root_domain}/thankyou`
            };
        }

        // Check for flag conditions
        const hasFlagCondition = this.checkFlagConditions(formData);
        if (hasFlagCondition) {
            return {
                outcome: 'FLAG',
                redirectUrl: `${this.trackingData.ghl_data.root_domain}/${this.getRedirectPath()}${params}`
            };
        }

        // Proceed
        return {
            outcome: 'PROCEED',
            redirectUrl: `${this.trackingData.ghl_data.root_domain}/${this.getRedirectPath()}${params}`
        };
    }

    // Check for flag conditions
    checkFlagConditions(formData) {
        for (const question of this.questions) {
            if (!question.flag) continue;

            const inputName = this.sanitizeName(question.name);
            const values = formData.getAll(inputName);
            const flagValues = question.flag.split(',');

            if (question.inputType === 'checkbox') {
                const hasFlagValue = values.some(val => flagValues.includes(val));
                if (hasFlagValue) return true;
            } else {
                const value = formData.get(inputName);
                if (flagValues.includes(value)) return true;
            }
        }
        return false;
    }

    // Get redirect path based on screener category from Notion
    getRedirectPath() {
        // Get category from the first question (they all have the same category)
        const firstQuestion = this.questions[0];
        if (!firstQuestion || !firstQuestion.category) {
            return 'thankyou'; // Fallback if no category found
        }
        
        // Map Notion categories to redirect paths (can be extended dynamically)
        const paths = {
            'Weightloss': 'weightloss-fee',
            'Antiaging': 'antiaging-fee', 
            'Hormone': 'hormone-fee',
            'HairSkin': 'hairandskin-fee',
            'Sexual': 'sexualhealth-fee'
            // Add new categories here as needed - they will be read from Notion
        };
        
        // Use the first category found in the questions
        const category = firstQuestion.category[0] || firstQuestion.category;
        return paths[category] || 'thankyou';
    }

    // Send webhook
    async sendWebhook(data) {
        const response = await fetch('https://locumtele.app.n8n.cloud/webhook/patient-screener', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Trigger redirect via GHL footer code
    triggerRedirect(redirectUrl) {
        // Get category from redirect path (e.g., 'weightloss-fee' -> 'weightloss')
        const category = this.getRedirectPath().replace('-fee', '').replace('hairandskin', 'hairSkin');
        
        // Trigger custom event for GHL footer code to handle
        const redirectEvent = new CustomEvent('ghlRedirect', {
            detail: { 
                category: category,
                formType: category,
                redirectPath: this.getRedirectPath(),
                redirectUrl: redirectUrl
            }
        });
        
        console.log('Triggering GHL redirect event for category:', category);
        
        // Send event to parent window (if in iframe) or current window
        if (window.parent !== window) {
            window.parent.dispatchEvent(redirectEvent);
        } else {
            window.dispatchEvent(redirectEvent);
        }
    }

    // Setup start over button
    setupStartOverButton() {
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'start-over') {
                this.resetForm();
            }
        });
    }

    // Reset form
    resetForm() {
        // Re-enable all inputs
        const allInputs = this.form.querySelectorAll('input, textarea, button');
        allInputs.forEach(el => { el.disabled = false; });
        
        // Reset form
        this.form.reset();
        
        // Show all sections
        document.querySelectorAll('.question-group').forEach(group => {
            group.style.display = 'block';
        });
        
        // Show submit button
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) submitBtn.style.display = '';
        
        // Hide result display
        this.resultDisplay.style.display = 'none';
        this.resultDisplay.innerHTML = '';
        
        // Reset conditional questions
        this.questions.forEach(question => {
            if (question.showCondition !== 'always') {
                const questionElement = document.getElementById(`question_${this.sanitizeId(question.name)}`);
                if (questionElement) {
                    questionElement.style.display = 'none';
                }
            }
        });
    }

    // Helper methods
    sanitizeId(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    sanitizeName(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
}

// Export for use in other files
window.GenericFormActions = GenericFormActions;