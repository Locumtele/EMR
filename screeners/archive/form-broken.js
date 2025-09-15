// Simplified Template-Based Form System
const CONFIG = {
    screener: new URLSearchParams(window.location.search).get('screener') || 'glp1',
    questionsEndpoint: null,
    telehealthEndpoint: 'https://locumtele.github.io/EMR/screeners/data/telehealth-logic.json',
    submitEndpoint: 'https://locumtele.app.n8n.cloud/webhook/patient-screener'
};

CONFIG.questionsEndpoint = `https://locumtele.github.io/EMR/screeners/data/${CONFIG.screener.toLowerCase()}.json`;

let currentQuestions = [];
let screenerCategory = '';

// Template System - Data-Driven Rendering
const TEMPLATES = {
    text: (q) => `<input class="text-input" type="${q.type}" name="${q.id}" placeholder="Enter ${q.text.toLowerCase()}" data-validation="${q.type}">`,

    email: (q) => `<input class="text-input" type="email" name="${q.id}" placeholder="Enter your email" data-validation="email">`,

    phone: (q) => `<input class="text-input" type="tel" name="${q.id}" placeholder="Enter your phone number" data-validation="phone">`,

    date: (q) => `<input class="text-input" type="date" name="${q.id}" data-validation="date">`,

    number: (q) => `<input class="text-input" type="number" name="${q.id}" placeholder="Enter number" data-validation="number">`,

    checkbox: (q) => {
        const allOptions = [...new Set([...(q.safe || []), ...(q.flag || []), ...(q.disqualify || [])])];

        // Sort: put "no" and "none" options last
        allOptions.sort((a, b) => {
            const aIsNegative = a.toLowerCase().includes('no') || a.toLowerCase().includes('none');
            const bIsNegative = b.toLowerCase().includes('no') || b.toLowerCase().includes('none');
            if (aIsNegative && !bIsNegative) return 1;
            if (!aIsNegative && bIsNegative) return -1;
            return 0;
        });

        return `<div class="checkbox-group">
            ${allOptions.map((opt, index) => `
                <div class="checkbox-option">
                    <input type="checkbox" id="q${q.id}_${index}" name="${q.id}" value="${opt}" data-validation="checkbox">
                    <label for="q${q.id}_${index}">${formatText(opt)}</label>
                </div>
            `).join('')}
        </div>`;
    },

    height_feet: (q) => `
        <div class="height-weight-grid-2">
            <div>
                <label class="input-label-small">Height (feet)</label>
                <input class="text-input" type="number" name="height_feet" placeholder="5" min="3" max="8" data-validation="height_feet">
            </div>
            <div>
                <label class="input-label-small">Height (inches)</label>
                <input class="text-input" type="number" name="height_inches" placeholder="6" min="0" max="11" data-validation="height_inches">
            </div>
        </div>`,

    weight_pounds: (q) => `
        <div>
            <label class="input-label-small">Weight (pounds)</label>
            <input class="text-input" type="number" name="weight_pounds" placeholder="180" min="50" max="800" data-validation="weight">
        </div>
        <div id="bmi-result" class="bmi-result"></div>`,

    file: (q) => `<input type="file" name="${q.id}" accept="image/*" class="file-input" data-validation="file">`
};

// General Conditional Logic System
function setupConditionalLogic() {
    currentQuestions.forEach(question => {
        if (question.showCondition && question.showCondition !== 'always') {
            const element = document.querySelector(`[data-question-id="${question.id}"]`);
            if (element) {
                // Parse condition from JSON
                const dependency = parseCondition(question.showCondition);
                if (dependency) {
                    setupDependency(element, dependency);
                }
            }
        }
    });
}

function parseCondition(condition) {
    // Parse conditions like "if_gender_female", "if_tobacco_yes"
    const match = condition.match(/if_([^_]+)_(.+)/);
    if (match) {
        return {
            triggerField: match[1],
            triggerValue: match[2],
            triggerQuestionId: getQuestionIdByField(match[1])
        };
    }
    return null;
}

function getQuestionIdByField(fieldName) {
    // Map common field names to question IDs
    const fieldMap = {
        'gender': '5',
        'tobacco': '17',
        'allergies': '14'
    };
    return fieldMap[fieldName];
}

function setupDependency(targetElement, dependency) {
    if (!dependency.triggerQuestionId) return;

    // Find all inputs for the trigger question
    const triggerInputs = document.querySelectorAll(`input[name="${dependency.triggerQuestionId}"]`);

    // Initially hide the dependent question
    targetElement.style.display = 'none';
    targetElement.classList.add('form-hidden');

    // Listen for changes on trigger inputs
    triggerInputs.forEach(input => {
        input.addEventListener('change', () => {
            // Check if the triggering value is selected
            const selectedValues = Array.from(triggerInputs)
                .filter(inp => inp.checked)
                .map(inp => inp.value);

            if (selectedValues.includes(dependency.triggerValue)) {
                // Show dependent question
                targetElement.style.display = 'block';
                targetElement.classList.remove('form-hidden');
            } else {
                // Hide dependent question and clear its values
                targetElement.style.display = 'none';
                targetElement.classList.add('form-hidden');
                clearQuestionValues(targetElement);
            }
        });
    });
}

function clearQuestionValues(element) {
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
}

// Simplified Rendering
function renderQuestion(q) {
    const template = TEMPLATES[q.type] || TEMPLATES.text;
    const inputHtml = template(q);

    let html = `<div class="question" data-question-id="${q.id}">
        <label class="question-label">${q.text}</label>
        ${inputHtml}
    </div>`;

    // Wrap conditional questions
    if (q.showCondition && q.showCondition !== 'always') {
        html = `<div class="conditional-question" data-show-if="${q.showCondition}">${html}</div>`;
    }

    return html;
}

function formatText(text) {
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Main Functions
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

        document.title = `${CONFIG.screener.toUpperCase()} Assessment`;
        document.getElementById('dynamic-title').textContent = `${CONFIG.screener.toUpperCase()} Assessment`;
        document.querySelector('.subtitle').textContent = `Complete your personalized ${screenerCategory} assessment`;

        buildForm(data.questions);
    } catch (error) {
        console.error('Error loading questions:', error);
        showError(`Unable to load assessment. ${error.message}`);
    }
}

function buildForm(questions) {
    console.log('Building form with questions:', questions);

    const sections = {};
    questions.forEach(q => {
        if (!sections[q.section]) sections[q.section] = [];
        sections[q.section].push(q);
    });

    console.log('Sections created:', sections);

    let html = '';
    Object.entries(sections).forEach(([section, qs]) => {
        console.log(`Rendering section: ${section} with ${qs.length} questions`);
        html += `<div class="question-group">
            <div class="question-title">${section}</div>
            ${qs.map(q => renderQuestion(q)).join('')}
        </div>`;
    });

    html += '<div class="submit-container-center"><button type="submit" class="nav-button">SUBMIT ASSESSMENT</button></div>';

    console.log('Generated HTML length:', html.length);
    console.log('HTML preview:', html.substring(0, 200) + '...');

    const loadingElement = document.getElementById('loading');
    const formElement = document.getElementById('form');
    const questionsElement = document.getElementById('questions');

    console.log('DOM elements found:', {
        loading: !!loadingElement,
        form: !!formElement,
        questions: !!questionsElement
    });

    if (loadingElement) loadingElement.style.display = 'none';
    if (formElement) formElement.style.display = 'block';
    if (questionsElement) questionsElement.innerHTML = html;

    console.log('Form display updated');

    setupConditionalLogic();
    setupValidation();
}

function setupValidation() {
    // Simplified validation - just required fields and basic types
    const form = document.getElementById('form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        try {
            // Load telehealth logic
            const telehealthResponse = await fetch(CONFIG.telehealthEndpoint);
            const telehealthData = await telehealthResponse.json();
            const screenerLogic = telehealthData.screeners[CONFIG.screener];

            // Submit data
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
                category: screenerLogic?.category || CONFIG.screener,
                consult_type: screenerLogic?.consult || 'sync',
                formType: CONFIG.screener
            };

            window.dispatchEvent(new CustomEvent('ghlRedirect', { detail: redirectData }));

            if (window.parent !== window) {
                window.parent.postMessage({ type: 'ghlRedirect', detail: redirectData }, '*');
            }
        } catch (error) {
            alert('Error submitting form. Please try again.');
        }
    });
}

function showError(message) {
    document.getElementById('loading').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2>Unable to Load Assessment</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="background: black; color: white; border: none; padding: 10px 20px; border-radius: 6px; margin-top: 20px; cursor: pointer;">Try Again</button>
        </div>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', loadQuestions);