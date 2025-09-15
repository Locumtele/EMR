// Working Simple Form System
const CONFIG = {
    screener: new URLSearchParams(window.location.search).get('screener') || 'GLP1',
    telehealthEndpoint: 'https://locumtele.app.n8n.cloud/webhook/telehealth-logic',
    submitEndpoint: 'https://locumtele.app.n8n.cloud/webhook/patient-screener'
};

CONFIG.questionsEndpoint = `https://locumtele.github.io/EMR/screeners/data/${CONFIG.screener.toLowerCase()}.json`;

let currentQuestions = [];
let screenerCategory = '';

// Main load function
async function loadQuestions() {
    console.log('Loading questions from:', CONFIG.questionsEndpoint);

    try {
        const response = await fetch(CONFIG.questionsEndpoint);
        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Data loaded:', data);

        // Handle direct JSON format
        const questions = data.questions;
        const category = data.category;

        if (!questions || questions.length === 0) {
            throw new Error('No questions found in response');
        }

        currentQuestions = questions;
        screenerCategory = category;

        // Update page elements
        document.title = `${CONFIG.screener.toUpperCase()} Assessment`;
        document.getElementById('dynamic-title').textContent = `${CONFIG.screener.toUpperCase()} Assessment`;
        document.querySelector('.subtitle').textContent = `Complete your personalized ${screenerCategory} assessment`;

        buildForm(questions);
    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('loading').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2>Unable to Load Assessment</h2>
                <p>Error: ${error.message}</p>
                <button onclick="location.reload()" style="background: black; color: white; border: none; padding: 10px 20px; border-radius: 6px; margin-top: 20px; cursor: pointer;">Try Again</button>
            </div>
        `;
    }
}

// Build form - simplified approach
function buildForm(questions) {
    console.log('Building form with', questions.length, 'questions');

    // Group by section
    const sections = {};
    questions.forEach(q => {
        if (!sections[q.section]) sections[q.section] = [];
        sections[q.section].push(q);
    });

    let html = '';
    Object.entries(sections).forEach(([section, qs]) => {
        html += `<div class="question-group">
            <div class="question-title">${section}</div>`;

        qs.forEach(q => {
            html += renderQuestion(q);
        });

        html += '</div>';
    });

    html += '<div class="submit-container-center"><button type="submit" class="nav-button">SUBMIT ASSESSMENT</button></div>';

    console.log('Generated HTML length:', html.length);

    // Update DOM
    document.getElementById('loading').style.display = 'none';
    const formElement = document.getElementById('form');
    formElement.classList.remove('form-hidden');
    formElement.style.display = 'block';
    document.getElementById('questions').innerHTML = html;

    console.log('Form displayed successfully');

    setupConditionalLogic();
}

// Render individual question - simplified
function renderQuestion(q) {
    let inputHtml = '';

    if (q.type === 'text' || q.type === 'email' || q.type === 'phone' || q.type === 'date' || q.type === 'number') {
        inputHtml = `<input class="text-input" type="${q.type}" name="${q.id}" placeholder="Enter ${q.text.toLowerCase()}">`;
    }
    else if (q.type === 'checkbox') {
        const allOptions = [...new Set([...(q.safe || []), ...(q.flag || []), ...(q.disqualify || [])])];

        // Sort options
        allOptions.sort((a, b) => {
            const aIsNegative = a.toLowerCase().includes('no') || a.toLowerCase().includes('none');
            const bIsNegative = b.toLowerCase().includes('no') || b.toLowerCase().includes('none');
            if (aIsNegative && !bIsNegative) return 1;
            if (!aIsNegative && bIsNegative) return -1;
            return 0;
        });

        inputHtml = '<div class="checkbox-group">';
        allOptions.forEach((opt, index) => {
            const cleanOpt = opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            inputHtml += `
                <div class="checkbox-option">
                    <input type="checkbox" id="q${q.id}_${index}" name="${q.id}" value="${opt}">
                    <label for="q${q.id}_${index}">${cleanOpt}</label>
                </div>`;
        });
        inputHtml += '</div>';
    }
    else if (q.type === 'height_feet') {
        inputHtml = `
            <div class="height-weight-grid-2">
                <div>
                    <label class="input-label-small">Height (feet)</label>
                    <input class="text-input" type="number" name="height_feet" placeholder="5" min="3" max="8" onchange="calculateBMI()">
                </div>
                <div>
                    <label class="input-label-small">Height (inches)</label>
                    <input class="text-input" type="number" name="height_inches" placeholder="6" min="0" max="11" onchange="calculateBMI()">
                </div>
            </div>`;
    }
    else if (q.type === 'weight_pounds') {
        inputHtml = `
            <div>
                <label class="input-label-small">Weight (pounds)</label>
                <input class="text-input" type="number" name="weight_pounds" placeholder="180" min="50" max="800" onchange="calculateBMI()">
            </div>
            <div id="bmi-result" class="bmi-result"></div>`;
    }
    else if (q.type === 'file') {
        inputHtml = `<input type="file" name="${q.id}" accept="image/*" class="file-input">`;
    }
    else if (q.type === 'select' || q.type === 'dropdown') {
        const allOptions = [...new Set([...(q.safe || []), ...(q.flag || []), ...(q.disqualify || [])])];
        
        inputHtml = `<select class="select-input" name="${q.id}">
            <option value="">Select ${q.text.toLowerCase()}</option>`;
        
        allOptions.forEach(opt => {
            const cleanOpt = opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            inputHtml += `<option value="${opt}">${cleanOpt}</option>`;
        });
        
        inputHtml += '</select>';
    }
    else {
        inputHtml = `<input class="text-input" type="text" name="${q.id}" placeholder="Enter ${q.text.toLowerCase()}">`;
    }

    let html = `<div class="question" data-question-id="${q.id}">
        <label class="question-label">${q.text}</label>
        ${inputHtml}
    </div>`;

    // Handle conditional questions
    if (q.showCondition && q.showCondition !== 'always') {
        const shouldHide = q.showCondition.includes('if_gender_female') || q.showCondition.includes('if_');
        const hiddenStyle = shouldHide ? ' style="display: none;"' : '';
        html = `<div class="conditional-question" data-show-if="${q.showCondition}" data-question-id="${q.id}"${hiddenStyle}>${html}</div>`;
    }

    return html;
}

// Simple conditional logic
function setupConditionalLogic() {
    console.log('Setting up conditional logic');

    // Handle gender -> pregnancy question
    const genderInputs = document.querySelectorAll('input[name="5"]'); // Gender is question ID 5
    const pregnancyQuestion = document.querySelector('[data-show-if="if_gender_female"]');

    if (genderInputs.length > 0 && pregnancyQuestion) {
        genderInputs.forEach(input => {
            input.addEventListener('change', function() {
                if (this.checked && this.value === 'female') {
                    pregnancyQuestion.style.display = 'block';
                } else if (this.checked && this.value !== 'female') {
                    pregnancyQuestion.style.display = 'none';
                }
            });
        });
        console.log('Gender -> pregnancy logic setup');
    }

    // Handle other GLP-1s -> details question
    const otherGlp1Inputs = document.querySelectorAll('input[name="12"]'); // Medications question ID 12
    const otherGlp1DetailsQuestion = document.querySelector('[data-show-if="if_other_glp1s_selected"]');

    if (otherGlp1Inputs.length > 0 && otherGlp1DetailsQuestion) {
        otherGlp1Inputs.forEach(input => {
            input.addEventListener('change', function() {
                if (this.checked && this.value === 'other_glp1s') {
                    otherGlp1DetailsQuestion.style.display = 'block';
                } else if (this.checked && this.value !== 'other_glp1s') {
                    otherGlp1DetailsQuestion.style.display = 'none';
                }
            });
        });
        console.log('Other GLP-1s -> details logic setup');
    }

    // Handle tobacco -> details question
    const tobaccoInputs = document.querySelectorAll('input[name="19"]'); // Tobacco question ID 19
    const tobaccoDetailsQuestion = document.querySelector('[data-show-if="if_tobacco_yes"]');

    if (tobaccoInputs.length > 0 && tobaccoDetailsQuestion) {
        tobaccoInputs.forEach(input => {
            input.addEventListener('change', function() {
                if (this.checked && this.value === 'yes') {
                    tobaccoDetailsQuestion.style.display = 'block';
                } else if (this.checked && this.value !== 'yes') {
                    tobaccoDetailsQuestion.style.display = 'none';
                }
            });
        });
        console.log('Tobacco -> details logic setup');
    }
    
    // Setup immediate disqualification monitoring
    setupEarlyDisqualifyMonitoring();
}

// Setup immediate disqualification monitoring
function setupEarlyDisqualifyMonitoring() {
    console.log('Setting up immediate disqualification monitoring');
    
    // Get all disqualifying inputs
    const disqualifierSelectors = [
        'input[name="4"]', // Date of birth
        'input[name="7"]', // Pregnancy
        'input[name="10"]', // GLP-1 allergies
        'input[name="11"]', // Medical conditions
        'input[name="12"]', // Current medications
        'input[name="13"]', // HbA1C
        'input[name="15"]', // Family history
        'input[name="16"]', // Chemotherapy
        'input[name="18"]', // Alcohol
        'input[name="22"]'  // Depression
    ].join(',');

    const handler = function() {
        console.log('Disqualification input changed:', this.name, this.value);
        const formData = new FormData(document.getElementById('form'));
        const data = {};
        
        // Collect all form data properly
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        // Also collect all checkbox values using getAll
        for (let [key, value] of formData.entries()) {
            if (formData.getAll(key).length > 1) {
                data[key] = formData.getAll(key);
            }
        }
        
        const reason = getDisqualifyReason(data);
        if (reason) {
            console.log('Immediate disqualification triggered:', reason);
            earlyDisqualify(reason);
        }
    };

    document.querySelectorAll(disqualifierSelectors).forEach(input => {
        input.addEventListener('change', handler);
    });
    
    console.log('Immediate disqualification monitoring setup complete');
}

// Get disqualification reason from current form data
function getDisqualifyReason(data) {
    // Age validation - must be 18 or older
    const dateOfBirth = data['4'];
    if (dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
        
        if (actualAge < 18) {
            return 'You must be 18 years or older to use this service.';
        }
    }
    
    // Pregnancy check
    if (data['7'] && data['7'].includes('yes')) {
        return 'For the safety of you and your baby, GLP-1 medications are not recommended during pregnancy, while trying to conceive, or while breastfeeding.';
    }
    
    // GLP-1 allergies
    if (data['10'] && data['10'].length > 0 && !data['10'].includes('none')) {
        return 'For your safety, we cannot prescribe GLP-1 medications if you have had an allergic reaction to this type of medication before.';
    }
    
    // Medical conditions
    if (data['11']) {
        const responses = Array.isArray(data['11']) ? data['11'] : [data['11']];
        const disqualifyingConditions = ['diabetes_type1', 'pancreatitis', 'medullary_thyroid', 'men2', 'liver_disease', 'leber_neuropathy'];
        const hasDisqualifyingCondition = responses.some(condition => disqualifyingConditions.includes(condition));
        if (hasDisqualifyingCondition) {
            return 'Based on your medical history, GLP-1 medications may not be safe for you. We recommend discussing weight management options with your healthcare provider.';
        }
    }
    
    // Current medications
    if (data['12']) {
        const responses = Array.isArray(data['12']) ? data['12'] : [data['12']];
        const disqualifyingMeds = ['abiraterone', 'somatrogon', 'chloroquine', 'insulin'];
        const hasDisqualifyingMed = responses.some(med => disqualifyingMeds.includes(med));
        if (hasDisqualifyingMed) {
            return 'Your current medications may interact with GLP-1 therapy. Please work with your prescribing doctor to explore safe weight management options that won\'t interfere with your current treatment.';
        }
    }
    
    // HbA1C
    if (data['13'] && data['13'].includes('yes')) {
        return 'Your current HbA1C level requires specialized diabetes care. We recommend working with an endocrinologist or your primary care doctor for the best treatment approach.';
    }
    
    // Family history
    if (data['15'] && data['15'].includes('yes')) {
        return 'Due to your family history of thyroid conditions, GLP-1 medications carry additional risks for you. Please consult with an endocrinologist about safer alternatives.';
    }
    
    // Chemotherapy
    if (data['16'] && data['16'].includes('yes')) {
        return 'While receiving cancer treatment, it\'s important to focus on your current therapy. Please discuss weight management goals with your oncology team when appropriate.';
    }
    
    // Alcohol
    if (data['18'] && data['18'].includes('2+_daily')) {
        return 'Regular heavy alcohol consumption can interact dangerously with GLP-1 medications. We recommend discussing safer weight management options with your healthcare provider.';
    }
    
    // Depression
    if (data['22'] && data['22'].includes('yes')) {
        return 'DEPRESSION_SPECIAL_MESSAGE';
    }
    
    return '';
}

// Show immediate red bubble notification inside question box
function earlyDisqualify(reason) {
    console.log('Showing immediate red bubble inside question box:', reason);
    
    // Remove any existing red bubble
    const existingBubble = document.getElementById('red-bubble-notification');
    if (existingBubble) {
        existingBubble.remove();
    }
    
    // Find the current question group to add the bubble to
    const currentQuestionGroup = document.querySelector('.question-group:not([style*="display: none"])');
    if (!currentQuestionGroup) {
        console.log('No visible question group found');
        return;
    }
    
    // Create red bubble notification inside the question box
    const redBubble = document.createElement('div');
    redBubble.id = 'red-bubble-notification';
    redBubble.style.cssText = `
        background: #dc3545;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin: 15px 0;
        text-align: center;
        font-weight: 500;
        font-size: 14px;
        line-height: 1.4;
        border: 2px solid #c82333;
        box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
        animation: fadeIn 0.3s ease-out;
    `;
    
    // Add animation keyframes
    if (!document.getElementById('bubble-animation')) {
        const style = document.createElement('style');
        style.id = 'bubble-animation';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    if (reason === 'DEPRESSION_SPECIAL_MESSAGE') {
        redBubble.innerHTML = `
            <div style="font-size: 16px; margin-bottom: 8px;">❌ Not Eligible for Treatment</div>
            <div style="font-size: 12px; margin-bottom: 10px;">
                <strong>We care about your safety.</strong><br>
                Because you indicated depression or suicidal thoughts, you are not eligible for this program.
            </div>
            <div style="font-size: 11px; margin-bottom: 10px;">
                <strong>Help is available:</strong><br>
                Call or text <strong>988</strong> for the Suicide & Crisis Lifeline<br>
                Call <strong>911</strong> if in immediate danger
            </div>
        `;
    } else {
        redBubble.innerHTML = `
            <div style="font-size: 16px; margin-bottom: 8px;">❌ Not Eligible for Treatment</div>
            <div style="font-size: 12px; margin-bottom: 10px;">${reason}</div>
        `;
    }
    
    // Add to the current question group
    currentQuestionGroup.appendChild(redBubble);
    
    // Grey out the submit button
    const submitButton = document.querySelector('.nav-button');
    if (submitButton) {
        submitButton.style.background = '#ccc';
        submitButton.style.cursor = 'not-allowed';
        submitButton.disabled = true;
        submitButton.textContent = 'NOT ELIGIBLE - ASSESSMENT COMPLETE';
    }
}

// BMI Calculation
function calculateBMI() {
    const feet = parseInt(document.querySelector('input[name="height_feet"]')?.value) || 0;
    const inches = parseInt(document.querySelector('input[name="height_inches"]')?.value) || 0;
    const pounds = parseInt(document.querySelector('input[name="weight_pounds"]')?.value) || 0;

    if (feet > 0 && inches >= 0 && pounds > 0) {
        const totalInches = (feet * 12) + inches;
        const bmi = (pounds / (totalInches * totalInches)) * 703;
        const bmiResult = document.getElementById('bmi-result');
        
        if (bmiResult) {
            bmiResult.innerHTML = `
                <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px; text-align: center;">
                    <strong>BMI: ${bmi.toFixed(1)}</strong>
                    ${bmi >= 25 ? '<div style="color: green; font-size: 14px;">✓ Eligible for GLP-1 program</div>' : '<div style="color: red; font-size: 14px;">✗ BMI must be 25 or higher</div>'}
                </div>
            `;
            bmiResult.setAttribute('data-disqualified', bmi < 25 ? 'true' : 'false');
        }
    }
}

// Form validation
function validateForm() {
    const formData = new FormData(document.getElementById('form'));
    const data = {};
    
    // Collect all form data properly
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }

    // Required fields validation
    const requiredFields = ['1', '2', '3', '4', '5']; // Name, Email, Phone, DOB, Gender
    for (let field of requiredFields) {
        if (!data[field] || data[field] === '') {
            alert('Please fill in all required fields.');
            return false;
        }
    }

    // Email validation
    const email = data['2'];
    if (email && !isValidEmail(email)) {
        alert('Please enter a valid email address.');
        return false;
    }

    // Phone validation
    const phone = data['3'];
    if (phone && !isValidPhone(phone)) {
        alert('Please enter a valid phone number.');
        return false;
    }

    // Age validation
    const dob = data['4'];
    if (dob && !isValidAge(dob)) {
        alert('You must be 18 years or older to use this service.');
        return false;
    }

    // BMI validation
    const bmiResult = document.getElementById('bmi-result');
    if (bmiResult && bmiResult.getAttribute('data-disqualified') === 'true') {
        alert('Our GLP-1 program is designed for individuals with a BMI of 25 or higher.');
        return false;
    }

    // Check disqualifying conditions
    const disqualification = checkDisqualifyingConditions(data, currentQuestions);
    if (disqualification.disqualified) {
        showDisqualificationScreen(disqualification.message);
        return false;
    }

    return true;
}

// Helper validation functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function isValidAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 18;
    }
    return age >= 18;
}

// Check disqualifying conditions
function checkDisqualifyingConditions(data, questions) {
    for (let question of questions) {
        if (question.disqualify && question.disqualify.length > 0) {
            const userResponse = data[question.id];
            if (userResponse) {
                const responses = Array.isArray(userResponse) ? userResponse : [userResponse];
                for (let response of responses) {
                    if (question.disqualify.includes(response)) {
                        let message = question.disqualifyMessage || 'You do not meet the requirements for this program.';

                        // Handle special depression message
                        if (message === 'DEPRESSION_SPECIAL_MESSAGE') {
                            message = `We care about your safety.

Because you indicated that you are feeling depressed or having thoughts of suicide, you are not eligible to continue with this program/medication at this time.

You are not alone, and help is available:
• Call or text 988 to connect with the Suicide & Crisis Lifeline.
• If you are in immediate danger of harming yourself, call 911 or go to the nearest Emergency Department.

Please reach out to a trusted family member, friend, or mental health professional today.

Your wellbeing is our top priority.`;
                        }

                        return {
                            disqualified: true,
                            message: message
                        };
                    }
                }
            }
        }
    }
    return { disqualified: false };
}

// Show disqualification screen
function showDisqualificationScreen(message) {
    document.getElementById('form').style.display = 'none';

    // Format message with proper line breaks
    const formattedMessage = message.replace(/\n/g, '<br>');

    document.getElementById('loading').innerHTML = `
        <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h2 style="color: #dc3545; margin-bottom: 20px;">Assessment Complete</h2>
            <div style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">${formattedMessage}</div>
            <button onclick="location.reload()" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">Start Over</button>
        </div>
    `;
    document.getElementById('loading').style.display = 'block';
}

// Form submission
document.getElementById('form').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Form submitted');

    if (!validateForm()) {
        return;
    }

    const formData = new FormData(this);
    const data = {};
    
    // Collect all form data properly
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }

    try {
        // Load telehealth logic
        const telehealthResponse = await fetch(`${CONFIG.telehealthEndpoint}?screener=${CONFIG.screener}`);
        const telehealthData = await telehealthResponse.json();
        const screenerLogic = telehealthData;

        // Submit to n8n
        await fetch(CONFIG.submitEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                form_type: `${CONFIG.screener}_Screening`,
                timestamp: new Date().toISOString(),
                responses: data
            })
        });

        // Trigger redirect
        const redirectData = {
            category: screenerLogic?.category || screenerCategory,
            consult_type: screenerLogic?.consult || 'sync',
            formType: CONFIG.screener
        };

        console.log('Triggering redirect with:', redirectData);

        window.dispatchEvent(new CustomEvent('ghlRedirect', { detail: redirectData }));

        // Also send to parent if in iframe
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'ghlRedirect',
                detail: redirectData
            }, '*');
        }

    } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting form. Please try again.');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadQuestions);