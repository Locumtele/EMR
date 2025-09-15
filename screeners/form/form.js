const CONFIG = {
    screener: new URLSearchParams(window.location.search).get('screener') || 'GLP1',
    webhook: 'https://locumtele.app.n8n.cloud/webhook/notion-questions'
};

let currentQuestions = [];
let screenerCategory = '';
let isDisqualified = false;
let disqualificationReasons = [];

// Update page title and form title dynamically
document.title = `${CONFIG.screener} Assessment`;
document.getElementById('dynamic-title').textContent = `${CONFIG.screener} Assessment`;

// Subtitle will be updated after loading data from webhook

async function loadQuestions() {
    try {
        const response = await fetch(CONFIG.webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ screenerType: CONFIG.screener, databaseId: '26e82abf7eae80f5ae8eeb0c7ecc76f0' })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw n8n response:', data);

        const responseData = data[0] ? JSON.parse(data[0].content) : null;
        const questions = responseData?.questions;
        const category = responseData?.category;

        console.log('Parsed data:', { questions, category });

        if (!questions || questions.length === 0) {
            throw new Error('No questions found in response');
        }

        // Update subtitle with category from Notion
        if (category) {
            screenerCategory = category;
            document.querySelector('.subtitle').textContent = `Complete your personalized ${category} assessment`;
        }

        currentQuestions = questions;
        buildForm(questions);
    } catch (error) {
        console.error('Error loading questions:', error);
        showError(`Unable to load assessment questions. ${error.message}`);
    }
}


function showErrorMessage(errorMsg) {
    document.getElementById('loading').innerHTML = `
        <div class="error-container">
            <h2>Unable to Load Assessment</h2>
            <p>There was a technical error loading your personalized questions.</p>
            <p class="error-details">Error: ${errorMsg}</p>
            <button onclick="location.reload()" class="retry-button">Try Again</button>
        </div>
    `;
}



function buildForm(questions) {
    // Separate file uploads from other questions
    const fileQuestions = questions.filter(q => q.type === 'file');
    const nonFileQuestions = questions.filter(q => q.type !== 'file');

    // Group non-file questions by section
    const sections = {};
    nonFileQuestions.forEach(q => {
        if (!sections[q.section]) sections[q.section] = [];
        sections[q.section].push(q);
    });

    let html = '';

    // Render regular sections
    Object.entries(sections).forEach(([section, qs]) => {
        html += `<div class="question-group"><div class="question-title">${section}</div>`;
        qs.forEach(q => {
            html += renderQuestion(q);
        });
        html += '</div>';
    });

    // Render all file uploads together if any exist
    if (fileQuestions.length > 0) {
        html += renderUploadsSection(fileQuestions);
    }

    // Add submit button at the end
    html += '<div class="submit-container-center"><button type="submit" class="nav-button">SUBMIT ASSESSMENT</button></div>';

    document.getElementById('loading').style.display = 'none';
    const formElement = document.getElementById('form');
    formElement.classList.remove('form-hidden');
    formElement.style.display = 'block';
    document.getElementById('questions').innerHTML = html;

    // Setup all dynamic behaviors
    setupConditionalLogic();
    setupValidationListeners();
}

function renderQuestion(q) {
    // Universal conditional wrapper
    const isConditional = q.showCondition && q.showCondition !== 'always';
    const conditionData = isConditional ? `data-show-if="${q.showCondition}"` : '';
    const isInitiallyHidden = shouldHideInitially(q) ? 'class="form-hidden"' : '';

    let html = '';

    // Start conditional wrapper if needed
    if (isConditional) {
        const hiddenClass = shouldHideInitially(q) ? ' form-hidden' : '';
        html += `<div class="conditional-question conditional-question-${q.id}${hiddenClass}" ${conditionData}>`;
    }

    // Render question based on type
    html += `<div class="question" data-question-id="${q.id}">`;
    html += `<label class="question-label">${q.text}</label>`;
    html += renderQuestionInput(q);
    html += '</div>';

    // Close conditional wrapper if needed
    if (isConditional) {
        html += '</div>';
    }

    return html;
}

function renderQuestionInput(q) {
    // Universal question type renderer - ALL logic comes from Notion
    switch (q.type) {
        case 'height_feet':
            return renderHeightInput(q);
        case 'weight_pounds':
            return renderWeightInput(q);
        case 'height_weight_combo':
            return renderHeightWeightCombo(q);
        case 'radio':
        case 'checkbox':
            return renderOptions(q);
        case 'file':
            return renderFileInput(q);
        case 'text':
        case 'email':
        case 'phone':
        case 'date':
        case 'number':
        default:
            return renderTextInput(q);
    }
}

function renderHeightWeightCombo(q) {
    return `
        <div class="height-weight-grid-3">
            <div>
                <label class="input-label-small">Height (feet)</label>
                <input class="text-input" type="number" name="height_feet" placeholder="5" min="3" max="8" data-validation="height_feet">
            </div>
            <div>
                <label class="input-label-small">Height (inches)</label>
                <input class="text-input" type="number" name="height_inches" placeholder="6" min="0" max="11" data-validation="height_inches">
            </div>
            <div>
                <label class="input-label-small">Weight (pounds)</label>
                <input class="text-input" type="number" name="weight_pounds" placeholder="180" min="50" max="800" data-validation="weight">
            </div>
        </div>
        <div id="bmi-result" class="bmi-result"></div>
    `;
}

function renderHeightInput(q) {
    return `
        <div class="height-weight-grid-2">
            <div>
                <label class="input-label-small">Height (feet)</label>
                <input class="text-input" type="number" name="height_feet" placeholder="5" min="3" max="8" data-validation="height_feet">
            </div>
            <div>
                <label class="input-label-small">Height (inches)</label>
                <input class="text-input" type="number" name="height_inches" placeholder="6" min="0" max="11" data-validation="height_inches">
            </div>
        </div>
    `;
}

function renderWeightInput(q) {
    return `
        <div>
            <label class="input-label-small">Weight (pounds)</label>
            <input class="text-input" type="number" name="weight_pounds" placeholder="180" min="50" max="800" data-validation="weight">
        </div>
        <div id="bmi-result" class="bmi-result"></div>
    `;
}

function renderOptions(q) {
    let html = '<div class="checkbox-group">';

    // Debug logging
    console.log('Rendering options for question:', q.id, q.text);
    console.log('Safe options:', q.safe);
    console.log('Flag options:', q.flag);
    console.log('Disqualify options:', q.disqualify);

    let allOptions = [...new Set([...(q.safe || []), ...(q.flag || []), ...(q.disqualify || [])])];

    // If no options from Notion, the question should not render or should be text input
    if (allOptions.length === 0) {
        console.warn('No options found for question:', q.id, q.text);
        console.warn('Please add safe/flag/disqualify options in Notion for this question');
        // Return empty - let it fall through to text input or show error
        return '<div class="config-error">Configuration Error: No options defined for this question</div>';
    }

    // Sort options: put "no" and "none" options last
    allOptions.sort((a, b) => {
        const aIsNegative = a.toLowerCase().includes('no') || a.toLowerCase().includes('none');
        const bIsNegative = b.toLowerCase().includes('no') || b.toLowerCase().includes('none');

        if (aIsNegative && !bIsNegative) return 1;  // a goes after b
        if (!aIsNegative && bIsNegative) return -1; // a goes before b
        return 0; // keep original order for same type
    });

    console.log('Final options to render:', allOptions);

    allOptions.forEach((opt, index) => {
        const inputType = q.type === 'radio' ? 'radio' : 'checkbox';
        const inputId = `q${q.id}_${index}`;
        html += `<div class="checkbox-option">
            <input type="${inputType}" id="${inputId}" name="${q.id}" value="${opt}" data-validation="${q.type}">
            <label for="${inputId}">${formatOptionText(opt)}</label>
        </div>`;
    });

    html += '</div>';
    return html;
}


function renderTextInput(q) {
    const placeholder = q.placeholder || `Enter ${q.text.toLowerCase()}`;
    return `<input class="text-input" type="${q.type}" name="${q.id}" placeholder="${placeholder}" data-validation="${q.type}">`;
}

function renderFileInput(q) {
    return `<input type="file" name="${q.id}" accept="image/*" class="file-input" data-validation="file">`;
}

function renderUploadsSection(uploadQuestions) {
    let html = `<div class="question-group"><div class="question-title">Uploads</div>`;

    if (uploadQuestions.length === 1) {
        // Single upload - full width
        html += `<div class="upload-single">`;
        html += renderQuestion(uploadQuestions[0]);
        html += `</div>`;
    } else {
        // Multiple uploads - 2-column layout
        html += `<div class="upload-grid">`;
        uploadQuestions.forEach(q => {
            html += `<div class="upload-column">`;
            html += renderQuestion(q);
            html += `</div>`;
        });
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

function formatOptionText(text) {
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function shouldHideInitially(q) {
    return q.showCondition && (
        q.showCondition.includes('if_gender_female') ||
        q.showCondition.includes('if_')
    );
}

function setupConditionalLogic() {
    // Universal conditional logic handler
    const conditionalQuestions = document.querySelectorAll('[data-show-if]');

    conditionalQuestions.forEach(question => {
        const condition = question.getAttribute('data-show-if');
        setupConditionListener(question, condition);
    });
}

function setupConditionListener(targetElement, condition) {
    console.log('Setting up condition listener for:', condition);

    // Parse condition dynamically (e.g., "if_gender_female", "if_tobacco_yes")
    const conditionParts = condition.split('_');

    if (conditionParts.length >= 3) {
        const triggerField = conditionParts[1]; // "gender", "tobacco"
        const triggerValue = conditionParts.slice(2).join('_'); // "female", "yes"

        console.log('Looking for trigger field:', triggerField, 'with value:', triggerValue);

        // Map field names to question IDs
        const fieldToIdMap = {
            'gender': '5',
            'tobacco': '17'
        };

        const questionId = fieldToIdMap[triggerField];
        if (!questionId) {
            console.warn('Unknown trigger field:', triggerField);
            return;
        }

        // Find the trigger input by question ID and value
        const triggerInputs = document.querySelectorAll(`input[name="${questionId}"][value="${triggerValue}"]`);
        console.log('Found trigger inputs:', triggerInputs);

        // Find inputs by value only - no hardcoded field detection
        triggerInputs.forEach(input => setupInputListener(input, targetElement));
    }
}

function setupInputListener(input, targetElement) {
    // Listen to changes on the entire radio group, not just the target input
    const radioGroup = document.querySelectorAll(`input[name="${input.name}"]`);

    radioGroup.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('Radio changed:', this.value, 'checked:', this.checked);

            if (this.checked && this.value === input.value) {
                // The target value is selected - show the conditional element
                targetElement.classList.remove('form-hidden');
                targetElement.style.display = 'block';
                console.log('Showing conditional element');
            } else if (this.checked && this.value !== input.value) {
                // A different value is selected - hide the conditional element
                targetElement.classList.add('form-hidden');
                console.log('Hiding conditional element');
            }
        });
    });
}

function setupValidationListeners() {
    // Universal validation setup
    const inputs = document.querySelectorAll('[data-validation]');

    inputs.forEach(input => {
        const validationType = input.getAttribute('data-validation');

        // Add real-time validation
        input.addEventListener('input', () => validateInput(input, validationType));
        input.addEventListener('blur', () => validateInput(input, validationType));

        // Special handlers for BMI calculation
        if (['height_feet', 'height_inches', 'weight'].includes(validationType)) {
            input.addEventListener('input', calculateBMI);
        }

        // Add real-time disqualification checking
        if (['radio', 'checkbox'].includes(validationType)) {
            input.addEventListener('change', () => checkDisqualificationRealTime(input));
        }
    });
}

function checkDisqualificationRealTime(input) {
    const questionElement = input.closest('[data-question-id]');
    if (!questionElement) return;

    const questionId = questionElement.getAttribute('data-question-id');
    const question = currentQuestions.find(q => q.id.toString() === questionId);

    if (!question || !question.disqualify || !question.disqualifyMessage) return;

    // Remove any existing warning
    const existingWarning = questionElement.querySelector('.disqualification-warning');
    if (existingWarning) {
        existingWarning.remove();
    }

    // Remove this question from disqualification reasons
    disqualificationReasons = disqualificationReasons.filter(reason => reason.questionId !== questionId);

    // Check if user selected a disqualifying option
    if (input.checked && question.disqualify.includes(input.value)) {
        // Add to disqualification reasons
        disqualificationReasons.push({
            questionId: questionId,
            message: question.disqualifyMessage,
            selectedValue: input.value
        });

        const warningDiv = document.createElement('div');
        warningDiv.className = 'disqualification-warning';
        warningDiv.innerHTML = createDisqualificationMessage({
            message: question.disqualifyMessage,
            type: "disqualify",
            showRecommendation: true,
            showButton: false,
            showBackButton: true
        });

        // Insert after the question
        questionElement.appendChild(warningDiv);
    }

    // Update submit button state
    updateSubmitButtonState();
}

function updateSubmitButtonState() {
    const submitButton = document.querySelector('button[type="submit"]');
    if (!submitButton) return;

    isDisqualified = disqualificationReasons.length > 0;

    if (isDisqualified) {
        // Grey out and disable submit button
        submitButton.style.background = '#ccc';
        submitButton.style.cursor = 'not-allowed';
        submitButton.style.opacity = '0.6';
        submitButton.disabled = true;
        submitButton.textContent = 'ASSESSMENT COMPLETE - NOT ELIGIBLE';
    } else {
        // Restore submit button
        submitButton.style.background = '#000';
        submitButton.style.cursor = 'pointer';
        submitButton.style.opacity = '1';
        submitButton.disabled = false;
        submitButton.textContent = 'SUBMIT ASSESSMENT';
    }
}

function validateInput(input, validationType) {
    const value = input.value.trim();
    const questionData = getQuestionData(input);

    // Universal validation based on type and question data
    const validation = validateField(value, validationType, questionData);

    if (validation.isValid) {
        removeValidationError(input);
    } else {
        showValidationError(input, validation.message);
    }

    return validation.isValid;
}

function validateField(value, type, questionData = {}) {
    // Universal field validation
    const rules = questionData.validation || {};

    // Required field check
    if (rules.required && !value) {
        return { isValid: false, message: rules.required_message || `${questionData.text} is required` };
    }

    // Type-specific validation - ALL rules should come from questionData.validation
    if (rules.email_validation && type === 'email' && value && !isValidEmail(value)) {
        return { isValid: false, message: rules.email_message || 'Please enter a valid email address' };
    }

    if (rules.phone_validation && type === 'phone' && value && !isValidPhone(value)) {
        return { isValid: false, message: rules.phone_message || 'Please enter a valid phone number' };
    }

    if (rules.min_age && type === 'date' && value) {
        const age = calculateAge(value);
        if (age < rules.min_age) {
            return { isValid: false, message: rules.age_message || `You must be ${rules.min_age} years or older` };
        }
    }

    if (rules.number_validation && ['number', 'height_feet', 'height_inches', 'weight'].includes(type) && value) {
        if (isNaN(value) || parseFloat(value) <= 0) {
            return { isValid: false, message: rules.number_message || 'Please enter a valid number' };
        }
    }

    return { isValid: true, message: '' };
}

function getQuestionData(input) {
    // Get question data from the current questions array
    const questionElement = input.closest('[data-question-id]');
    if (!questionElement) return {};

    const questionId = questionElement.getAttribute('data-question-id');
    return currentQuestions.find(q => q.id.toString() === questionId) || {};
}

function showValidationError(input, message) {
    removeValidationError(input);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = 'color: #e74c3c; font-size: 14px; margin-top: 5px;';
    errorDiv.textContent = message;

    input.parentNode.appendChild(errorDiv);
    input.style.borderColor = '#e74c3c';
}

function removeValidationError(input) {
    const existingError = input.parentNode.querySelector('.validation-error');
    if (existingError) {
        existingError.remove();
    }
    input.style.borderColor = '#ddd';
}

function validateForm() {
    const errors = [];
    const formData = collectFormData();

    console.log('Form data collected:', formData);

    // Universal validation using question data from Notion
    currentQuestions.forEach(question => {
        const fieldValue = formData[question.id.toString()];
        const validation = validateQuestionFromNotion(question, fieldValue);

        if (!validation.isValid) {
            errors.push(validation.message);
        }
    });

    // Check BMI disqualification
    const bmiResult = document.getElementById('bmi-result');
    if (bmiResult && bmiResult.getAttribute('data-disqualified') === 'true') {
        errors.push('BMI requirement not met. This program requires a BMI of 25 or higher.');
    }

    // Check for disqualifying conditions using Notion data
    const disqualificationResult = checkDisqualifyingConditions(formData, currentQuestions);
    if (disqualificationResult.disqualified) {
        errors.push(disqualificationResult.message);
    }

    return errors;
}

function collectFormData() {
    const formData = new FormData(document.getElementById('form'));
    const data = {};

    // Properly collect all form data, especially for checkboxes
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // If key already exists, convert to array or add to array
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }

    return data;
}

function validateQuestionFromNotion(question, userValue) {
    // Universal validation based on question configuration from Notion
    const rules = question.validation || {};

    // Required field check
    if (rules.required !== false && question.required !== false) {
        if (!userValue || (typeof userValue === 'string' && userValue.trim() === '')) {
            return {
                isValid: false,
                message: rules.required_message || `${question.text} is required`
            };
        }
    }

    // Type-specific validation
    if (userValue) {
        const typeValidation = validateField(userValue, question.type, question);
        if (!typeValidation.isValid) {
            return typeValidation;
        }
    }

    return { isValid: true, message: '' };
}

function checkDisqualifyingConditions(data, questions) {
    console.log('Checking disqualifying conditions...');
    console.log('Questions with disqualify arrays:', questions.filter(q => q.disqualify && q.disqualify.length > 0));

    // Check each question for disqualifying responses
    for (let question of questions) {
        const questionId = question.id.toString();
        const userResponse = data[questionId];

        console.log(`Question ${questionId} (${question.text}):`, {
            userResponse,
            disqualify: question.disqualify,
            disqualifyMessage: question.disqualifyMessage
        });

        if (!userResponse || !question.disqualify || question.disqualify.length === 0) {
            continue;
        }

        // Check if user selected any disqualifying options
        const selectedOptions = Array.isArray(userResponse) ? userResponse : [userResponse];
        const hasDisqualifyingResponse = selectedOptions.some(response =>
            question.disqualify.includes(response)
        );

        console.log(`Question ${questionId} - Selected options:`, selectedOptions);
        console.log(`Question ${questionId} - Disqualifying options:`, question.disqualify);
        console.log(`Question ${questionId} - Has disqualifying response:`, hasDisqualifyingResponse);

        if (hasDisqualifyingResponse && question.disqualifyMessage) {
            console.log(`DISQUALIFIED by question ${questionId}:`, question.disqualifyMessage);
            return {
                disqualified: true,
                message: question.disqualifyMessage
            };
        }
    }

    console.log('No disqualifying conditions found');
    return { disqualified: false, message: '' };
}


function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function calculateBMI() {
    const heightFeet = document.querySelector('input[name="height_feet"]')?.value;
    const heightInches = document.querySelector('input[name="height_inches"]')?.value;
    const weightPounds = document.querySelector('input[name="weight_pounds"]')?.value;
    const resultDiv = document.getElementById('bmi-result');

    if (!heightFeet || !heightInches || !weightPounds || !resultDiv) {
        return;
    }

    // Convert height to total inches
    const totalInches = (parseInt(heightFeet) * 12) + parseInt(heightInches);

    // Calculate BMI: (weight in pounds / (height in inches)²) × 703
    const bmi = (parseFloat(weightPounds) / (totalInches * totalInches)) * 703;

    if (isNaN(bmi) || bmi <= 0) {
        resultDiv.style.display = 'none';
        return;
    }

    resultDiv.style.display = 'block';

    if (bmi < 25) {
        resultDiv.innerHTML = createDisqualificationMessage({
            title: `BMI: ${bmi.toFixed(1)}`,
            message: "Unfortunately, this program requires a BMI of 25 or higher. You may not be eligible for this treatment.",
            type: "disqualify",
            showRecommendation: true,
            showBackButton: true
        });
        resultDiv.setAttribute('data-disqualified', 'true');

        // Add BMI to disqualification reasons
        disqualificationReasons = disqualificationReasons.filter(reason => reason.questionId !== 'BMI');
        disqualificationReasons.push({
            questionId: 'BMI',
            message: 'BMI requirement not met. This program requires a BMI of 25 or higher.',
            selectedValue: bmi.toFixed(1)
        });
    } else {
        resultDiv.innerHTML = createDisqualificationMessage({
            title: `BMI: ${bmi.toFixed(1)}`,
            message: "Great! You meet the BMI requirement for this program.",
            type: "success"
        });
        resultDiv.setAttribute('data-disqualified', 'false');

        // Remove BMI from disqualification reasons
        disqualificationReasons = disqualificationReasons.filter(reason => reason.questionId !== 'BMI');
    }

    // Update submit button state
    updateSubmitButtonState();
}

function createDisqualificationMessage(options) {
    const { title, message, type = "disqualify", showRecommendation = true, showButton = false, showBackButton = false } = options;

    // Check if this is a depression-related message to hide recommendation
    const isDepressionMessage = message === "DEPRESSION_SPECIAL_MESSAGE" ||
                              message.includes("suicide") ||
                              message.includes("depression") ||
                              message.includes("feeling depressed");

    // Hide recommendation for depression messages
    const shouldShowRecommendation = showRecommendation && !isDepressionMessage;

    // Format long messages for better readability
    const formattedMessage = formatDisqualificationMessage(message);

    const styles = {
        disqualify: {
            background: "linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)",
            border: "2px solid #fc8181",
            borderRadius: "12px",
            iconColor: "#e53e3e",
            titleColor: "#c53030",
            textColor: "#2d3748",
            icon: "⚠️"
        },
        success: {
            background: "linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)",
            border: "2px solid #68d391",
            borderRadius: "12px",
            iconColor: "#38a169",
            titleColor: "#2f855a",
            textColor: "#2d3748",
            icon: "✅"
        },
        flag: {
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: "2px solid #f6ad55",
            borderRadius: "12px",
            iconColor: "#ed8936",
            titleColor: "#dd6b20",
            textColor: "#2d3748",
            icon: "⚡"
        }
    };

    const style = styles[type] || styles.disqualify;

    return `
        <div style="
            background: ${style.background};
            border: ${style.border};
            border-radius: ${style.borderRadius};
            padding: 24px;
            margin: 16px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        ">
            <div style="
                display: flex;
                align-items: flex-start;
                gap: 16px;
            ">
                <div style="
                    font-size: 24px;
                    color: ${style.iconColor};
                    flex-shrink: 0;
                    line-height: 1;
                ">${style.icon}</div>

                <div style="flex: 1;">
                    ${title ? `<h3 style="
                        color: ${style.titleColor};
                        font-size: 18px;
                        font-weight: 600;
                        margin: 0 0 8px 0;
                        line-height: 1.3;
                    ">${title}</h3>` : ''}

                    <div style="
                        color: ${style.textColor};
                        font-size: 15px;
                        line-height: 1.6;
                        margin: 0 0 ${shouldShowRecommendation ? '16px' : '0'} 0;
                    ">${formattedMessage}</div>

                    ${shouldShowRecommendation && type === 'disqualify' ? `
                        <p style="
                            color: #718096;
                            font-size: 14px;
                            line-height: 1.4;
                            margin: 0 0 ${showButton ? '20px' : '0'} 0;
                            font-style: italic;
                        ">We recommend discussing your health goals with your primary care physician or a specialist who can provide personalized guidance.</p>
                    ` : ''}

                    ${(showButton || showBackButton) ? `
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            ${showButton ? `
                                <button onclick="location.reload()" style="
                                    background: #000;
                                    color: white;
                                    border: none;
                                    padding: 12px 20px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    font-weight: 500;
                                    transition: background 0.2s ease;
                                    flex: 1;
                                    min-width: 120px;
                                " onmouseover="this.style.background='#333'" onmouseout="this.style.background='#000'">
                                    Start Over
                                </button>
                            ` : ''}

                            ${showBackButton ? `
                                <button onclick="window.location.href='{{location.website}}'" style="
                                    background: #4a5568;
                                    color: white;
                                    border: none;
                                    padding: 12px 20px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    font-weight: 500;
                                    transition: background 0.2s ease;
                                    flex: 1;
                                    min-width: 140px;
                                " onmouseover="this.style.background='#2d3748'" onmouseout="this.style.background='#4a5568'">
                                    ← Back to Website
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function formatDisqualificationMessage(message) {
    // Handle special depression message
    if (message === "DEPRESSION_SPECIAL_MESSAGE" || message.includes("suicide") || message.includes("depression")) {
        return `
            <div class="depression-safety-notice">
                <strong>We care about your safety.</strong>
            </div>

            <p class="depression-message">
                Because you indicated that you are feeling depressed or having thoughts of suicide, you are not eligible to continue with this program/medication at this time.
            </p>

            <div class="crisis-resources">
                <p>You are not alone, and help is available:</p>
                <ul>
                    <li>Call or text <strong>988</strong> to connect with the Suicide & Crisis Lifeline</li>
                    <li>If you are in immediate danger of harming yourself, call <strong>911</strong> or go to the nearest Emergency Department</li>
                    <li>Please reach out to a trusted family member, friend, or mental health professional today</li>
                </ul>
            </div>

            <p class="depression-priority">
                Your wellbeing is our top priority.
            </p>
        `;
    }

    // Handle other long messages by breaking them into paragraphs
    if (message.length > 200) {
        // Split on common sentence endings and bullet points
        const sentences = message.split(/(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])\s*•\s*/);

        return sentences.map(sentence => {
            sentence = sentence.trim();
            if (sentence.startsWith('•') || sentence.includes('Call') || sentence.includes('If you are')) {
                return `<p style="margin: 8px 0; font-weight: 500;">${sentence}</p>`;
            }
            return `<p style="margin: 8px 0;">${sentence}</p>`;
        }).join('');
    }

    // Return short messages as-is
    return `<p style="margin: 0;">${message}</p>`;
}

function showDisqualificationScreen(message) {
    document.getElementById('form').style.display = 'none';
    document.getElementById('loading').innerHTML = `
        <div class="disqualification-container">
            <h2 class="disqualification-title">Assessment Complete</h2>
            ${createDisqualificationMessage({
                message: message,
                type: "disqualify",
                showRecommendation: true,
                showButton: true,
                showBackButton: true
            })}
        </div>
    `;
    document.getElementById('loading').style.display = 'block';
}

document.getElementById('form').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
        // Check if it's a disqualification error
        const disqualificationError = errors.find(error =>
            error.includes('GLP-1 medications') ||
            error.includes('BMI requirement') ||
            error.includes('safety') ||
            error.includes('not recommended')
        );

        if (disqualificationError) {
            showDisqualificationScreen(disqualificationError);
            return;
        }

        alert('Please fix the following errors:\n\n' + errors.join('\n'));
        return;
    }

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        await fetch('https://locumtele.app.n8n.cloud/webhook/patient-screener', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ form_type: CONFIG.screener, responses: data })
        });

        const redirectData = { category: screenerCategory || CONFIG.screener.toLowerCase(), formType: CONFIG.screener.toLowerCase() };

        // Dispatch event on current window (for direct hosting)
        const event = new CustomEvent('ghlRedirect', { detail: redirectData });
        window.dispatchEvent(event);

        // Send message to parent window (for iframe embedding)
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'ghlRedirect',
                detail: redirectData
            }, '*');
        }
    } catch (error) {
        alert('Error submitting form. Please try again.');
    }
});


loadQuestions();