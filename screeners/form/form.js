// Working Simple Form System
const CONFIG = {
    screener: new URLSearchParams(window.location.search).get('screener') || 'glp1',
    questionsEndpoint: null,
    telehealthEndpoint: 'https://locumtele.github.io/EMR/screeners/data/telehealth-logic.json',
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

        if (!data.questions || data.questions.length === 0) {
            throw new Error('No questions found in response');
        }

        currentQuestions = data.questions;
        screenerCategory = data.category;

        // Update page elements
        document.title = `${CONFIG.screener.toUpperCase()} Assessment`;
        document.getElementById('dynamic-title').textContent = `${CONFIG.screener.toUpperCase()} Assessment`;
        document.querySelector('.subtitle').textContent = `Complete your personalized ${screenerCategory} assessment`;

        buildForm(data.questions);
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
                    <input class="text-input" type="number" name="height_feet" placeholder="5" min="3" max="8">
                </div>
                <div>
                    <label class="input-label-small">Height (inches)</label>
                    <input class="text-input" type="number" name="height_inches" placeholder="6" min="0" max="11">
                </div>
            </div>`;
    }
    else if (q.type === 'weight_pounds') {
        inputHtml = `
            <div>
                <label class="input-label-small">Weight (pounds)</label>
                <input class="text-input" type="number" name="weight_pounds" placeholder="180" min="50" max="800">
            </div>
            <div id="bmi-result" class="bmi-result"></div>`;
    }
    else if (q.type === 'file') {
        inputHtml = `<input type="file" name="${q.id}" accept="image/*" class="file-input">`;
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
}

// Form submission
document.getElementById('form').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Form submitted');

    const formData = new FormData(this);

    try {
        // Load telehealth logic
        const telehealthResponse = await fetch(CONFIG.telehealthEndpoint);
        const telehealthData = await telehealthResponse.json();
        const screenerLogic = telehealthData.screeners[CONFIG.screener];

        // Submit to n8n
        await fetch(CONFIG.submitEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                form_type: `${CONFIG.screener}_Screening`,
                timestamp: new Date().toISOString(),
                responses: Object.fromEntries(formData.entries())
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