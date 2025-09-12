// Medical Screener - Centralized JavaScript
// Version 1.0
// This file handles all medical screening forms
// Updated: New commit for EMR repository

(function() {
    'use strict';
    
    // Configuration for different form types
    const FORM_CONFIGS = {
        'glp1': {
            formId: 'glp1ScreeningForm',
            formType: 'GLP1_Screening',
            category: 'weightloss',
            redirectPath: '/weightloss-fee',
            multiSelectFields: {
                medical_conditions: 'medical_conditions',
                current_medications: 'current_medications'
            }
        },
        'nad': {
            formId: 'nadScreeningForm',
            formType: 'NAD_Screening',
            category: 'antiaging',
            redirectPath: '/antiaging-fee',
            multiSelectFields: {
                preferred_routes: 'preferred_routes'
            }
        },
        'sermorelin': {
            formId: 'sermorelinScreeningForm',
            formType: 'Sermorelin_Screening',
            category: 'hormones',
            redirectPath: '/hormones-fee',
            multiSelectFields: {}
        }
    };

    // Initialize screener when DOM is loaded
    function initializeScreener(formType) {
        document.addEventListener('DOMContentLoaded', function() {
            const config = FORM_CONFIGS[formType];
            if (!config) {
                console.error('Unknown form type:', formType);
                return;
            }

            const form = document.getElementById(config.formId);
            const resultDisplay = document.getElementById('result-display');
            
            if (!form) {
                console.error('Form not found:', config.formId);
                return;
            }

            console.log('Medical Screener initialized for:', formType);
            console.log('Form element found:', form);
            console.log('Result display found:', resultDisplay);

            // UTM and tracking parameter capture
            function getTrackingData() {
                const urlParams = new URLSearchParams(window.location.search);
                
                // Get UTM parameters
                const utmParams = {
                    utm_source: urlParams.get('utm_source') || '',
                    utm_medium: urlParams.get('utm_medium') || '',
                    utm_campaign: urlParams.get('utm_campaign') || '',
                    utm_content: urlParams.get('utm_content') || '',
                    utm_term: urlParams.get('utm_term') || ''
                };
                
                // Get GHL merge tags (these will be populated by GoHighLevel)
                const locationId = '{{location.id}}';
                const locationName = '{{location.name}}';
                const rootDomain = '{{custom_values.root_domain}}';
                const customPrivate = '{{custom_values.private}}';
                
                // Process merge tags (only use if they've been replaced by GHL)
                const ghlData = {
                    location_id: locationId.includes('{{') ? '' : locationId,
                    location_name: locationName.includes('{{') ? '' : locationName,
                    root_domain: rootDomain.includes('{{') ? '' : rootDomain,
                    custom_private: customPrivate.includes('{{') ? '' : customPrivate
                };
                
                // Get any additional URL parameters
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

            // Get tracking data on page load
            const trackingData = getTrackingData();
            console.log('Tracking data captured:', trackingData);

            // Follow-up question handlers
            function setupFollowUpQuestions() {
                // Pregnancy follow-up visibility based on gender
                const genderRadios = document.querySelectorAll('input[name="gender"]');
                const pregnancyBlock = document.getElementById('pregnancy_block');
                
                if (genderRadios.length && pregnancyBlock) {
                    genderRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            const pregnancyRadios = document.querySelectorAll('input[name="pregnancy"]');
                            if (this.value === 'female') {
                                pregnancyBlock.classList.add('show');
                                pregnancyRadios.forEach(radio => radio.required = true);
                            } else {
                                pregnancyBlock.classList.remove('show');
                                pregnancyRadios.forEach(radio => {
                                    radio.required = false;
                                    radio.checked = false;
                                });
                            }
                        });
                    });
                }

                // Dynamic follow-up handlers based on form type
                if (formType === 'glp1') {
                    // No additional follow-ups for GLP1
                } else if (formType === 'nad') {
                    setupNADFollowUps();
                } else if (formType === 'sermorelin') {
                    setupSermorelinFollowUps();
                }
            }

            function setupNADFollowUps() {
                // Previous NAD treatment dose follow-up
                const previousNadRadios = document.querySelectorAll('input[name="previous_nad"]');
                const previousNadDoseBlock = document.getElementById('previous_nad_dose_block');
                
                if (previousNadRadios.length && previousNadDoseBlock) {
                    previousNadRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            if (this.value === 'yes') {
                                previousNadDoseBlock.classList.add('show');
                            } else {
                                previousNadDoseBlock.classList.remove('show');
                                const doseInput = document.getElementById('previous_nad_dose');
                                if (doseInput) doseInput.value = '';
                            }
                        });
                    });
                }

                // Current NAD treatment dose follow-up
                const currentNadRadios = document.querySelectorAll('input[name="current_nad"]');
                const currentNadDoseBlock = document.getElementById('current_nad_dose_block');
                
                if (currentNadRadios.length && currentNadDoseBlock) {
                    currentNadRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            if (this.value === 'yes') {
                                currentNadDoseBlock.classList.add('show');
                            } else {
                                currentNadDoseBlock.classList.remove('show');
                                const doseInput = document.getElementById('current_nad_dose');
                                if (doseInput) doseInput.value = '';
                            }
                        });
                    });
                }

                // NAD supplements details follow-up
                const supplementsRadios = document.querySelectorAll('input[name="nad_supplements"]');
                const supplementsDetailsBlock = document.getElementById('supplements_details_block');
                
                if (supplementsRadios.length && supplementsDetailsBlock) {
                    supplementsRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            if (this.value === 'yes') {
                                supplementsDetailsBlock.classList.add('show');
                            } else {
                                supplementsDetailsBlock.classList.remove('show');
                                const detailsInput = document.getElementById('supplements_details');
                                if (detailsInput) detailsInput.value = '';
                            }
                        });
                    });
                }

                // Family cancer type follow-up
                const familyCancerRadios = document.querySelectorAll('input[name="family_cancer"]');
                const cancerTypeBlock = document.getElementById('cancer_type_block');
                
                if (familyCancerRadios.length && cancerTypeBlock) {
                    familyCancerRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            if (this.value === 'yes') {
                                cancerTypeBlock.classList.add('show');
                            } else {
                                cancerTypeBlock.classList.remove('show');
                                const typeInput = document.getElementById('cancer_type');
                                if (typeInput) typeInput.value = '';
                            }
                        });
                    });
                }
            }

            function setupSermorelinFollowUps() {
                // Allergies list follow-up
                const allergiesRadios = document.querySelectorAll('input[name="allergies"]');
                const allergiesListBlock = document.getElementById('allergies_list_block');
                
                if (allergiesRadios.length && allergiesListBlock) {
                    allergiesRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            if (this.value === 'yes') {
                                allergiesListBlock.classList.add('show');
                            } else {
                                allergiesListBlock.classList.remove('show');
                                const listInput = document.getElementById('allergies_list');
                                if (listInput) listInput.value = '';
                            }
                        });
                    });
                }

                // Previous Sermorelin dose follow-up
                const previousSermorelinRadios = document.querySelectorAll('input[name="previous_sermorelin"]');
                const previousDoseBlock = document.getElementById('previous_dose_block');
                
                if (previousSermorelinRadios.length && previousDoseBlock) {
                    previousSermorelinRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            if (this.value === 'yes') {
                                previousDoseBlock.classList.add('show');
                            } else {
                                previousDoseBlock.classList.remove('show');
                                const doseInput = document.getElementById('previous_dose');
                                if (doseInput) doseInput.value = '';
                            }
                        });
                    });
                }

                // Current Sermorelin dose follow-up
                const currentSermorelinRadios = document.querySelectorAll('input[name="current_sermorelin"]');
                const currentDoseBlock = document.getElementById('current_dose_block');
                
                if (currentSermorelinRadios.length && currentDoseBlock) {
                    currentSermorelinRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            if (this.value === 'yes') {
                                currentDoseBlock.classList.add('show');
                            } else {
                                currentDoseBlock.classList.remove('show');
                                const doseInput = document.getElementById('current_dose');
                                if (doseInput) doseInput.value = '';
                            }
                        });
                    });
                }

                // Cancer type follow-up
                const cancerRadios = document.querySelectorAll('input[name="cancer"]');
                const cancerTypeBlock = document.getElementById('cancer_type_block');
                
                if (cancerRadios.length && cancerTypeBlock) {
                    cancerRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            if (this.value === 'yes') {
                                cancerTypeBlock.classList.add('show');
                            } else {
                                cancerTypeBlock.classList.remove('show');
                                const typeInput = document.getElementById('cancer_type');
                                if (typeInput) typeInput.value = '';
                            }
                        });
                    });
                }

                // Thyroid controlled follow-up
                const thyroidRadios = document.querySelectorAll('input[name="thyroid"]');
                const thyroidControlledBlock = document.getElementById('thyroid_controlled_block');
                
                if (thyroidRadios.length && thyroidControlledBlock) {
                    thyroidRadios.forEach(radio => {
                        radio.addEventListener('change', function() {
                            const thyroidControlledRadios = document.querySelectorAll('input[name="thyroid_controlled"]');
                            if (this.value === 'yes') {
                                thyroidControlledBlock.classList.add('show');
                                thyroidControlledRadios.forEach(radio => radio.required = true);
                            } else {
                                thyroidControlledBlock.classList.remove('show');
                                thyroidControlledRadios.forEach(radio => {
                                    radio.required = false;
                                    radio.checked = false;
                                });
                            }
                        });
                    });
                }
            }

            // Early disqualify helpers
            function getDisqualifyReason(formData) {
                // Age validation - must be 18 or older
                const dateOfBirth = formData.get('date_of_birth');
                if (dateOfBirth) {
                    const birthDate = new Date(dateOfBirth);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    
                    // Adjust age if birthday hasn't occurred this year
                    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                    
                    if (actualAge < 18) {
                        return 'You must be 18 years or older to use this service.';
                    }
                }
                
                // Common disqualifiers
                if (formData.get('pregnancy') === 'yes') {
                    return 'Pregnancy, trying to get pregnant, or breastfeeding is a contraindication.';
                }
                if (formData.get('depression') === 'yes') {
                    return 'DEPRESSION_SPECIAL_MESSAGE';
                }
                if (formData.get('chemotherapy') === 'yes') {
                    return 'Current chemotherapy treatment is a contraindication.';
                }

                // Form-specific disqualifiers
                if (formType === 'glp1') {
                    return getGLP1DisqualifyReason(formData);
                } else if (formType === 'nad') {
                    return getNADDisqualifyReason(formData);
                } else if (formType === 'sermorelin') {
                    return getSermorelinDisqualifyReason(formData);
                }

                return '';
            }

            function getGLP1DisqualifyReason(formData) {
                // GLP1-specific disqualifiers
                const allergyList = formData.getAll('glp1_allergy_list');
                if (allergyList.length > 0 && !allergyList.includes('none')) {
                    return 'Allergic reaction to GLP-1 receptor agonist is a contraindication.';
                }
                if (formData.get('hba1c_high') === 'yes') {
                    return 'HbA1C >8% is a contraindication.';
                }
                if (formData.get('alcohol_amount') === '2+_daily') {
                    return 'Consuming more than 2 alcoholic drinks per day is a contraindication.';
                }
                if (formData.get('family_history') === 'yes') {
                    return 'Family history of MEN 2 or Medullary Thyroid Carcinoma is a contraindication.';
                }

                // Medical conditions
                const medicalConditions = formData.getAll('medical_conditions');
                const disqualifyingConditions = ['pancreatitis', 'medullary_thyroid', 'men2', 'liver_disease', 'leber_neuropathy'];
                const hasDisqualifyingCondition = medicalConditions.some(condition => disqualifyingConditions.includes(condition));
                if (hasDisqualifyingCondition) {
                    return 'Selected medical conditions are contraindications for GLP-1 therapy.';
                }

                // Medications
                const medications = formData.getAll('current_medications');
                const disqualifyingMeds = ['abiraterone', 'somatrogon', 'chloroquine', 'insulin', 'other_glp1s'];
                const hasDisqualifyingMed = medications.some(med => disqualifyingMeds.includes(med));
                if (hasDisqualifyingMed) {
                    return 'Current medication regimen includes contraindicated drugs for GLP-1 therapy.';
                }

                return '';
            }

            function getNADDisqualifyReason(formData) {
                // NAD has no additional disqualifiers beyond common ones
                return '';
            }

            function getSermorelinDisqualifyReason(formData) {
                if (formData.get('cancer') === 'yes') {
                    return 'Current cancer or history of cancer is a contraindication for Sermorelin.';
                }
                if (formData.get('athlete') === 'yes') {
                    return 'Professional athletes cannot use Sermorelin as it is banned by WADA (World Anti-Doping Agency).';
                }
                if (formData.get('thyroid') === 'yes' && formData.get('thyroid_controlled') === 'no') {
                    return 'Uncontrolled thyroid issues are a contraindication for Sermorelin.';
                }
                return '';
            }

            function earlyDisqualify(reason) {
                // Prepare payload before locking UI
                const formData = new FormData(form);
                const submissionData = {
                    form_type: config.formType,
                    timestamp: new Date().toISOString(),
                    routing_outcome: 'DISQUALIFY',
                    routing_reason: reason,
                    responses: Object.fromEntries(formData.entries()),
                    tracking_data: trackingData
                };

                // Add multi-select responses if configured
                Object.entries(config.multiSelectFields).forEach(([key, fieldName]) => {
                    if (!submissionData.multi_select_responses) {
                        submissionData.multi_select_responses = {};
                    }
                    submissionData.multi_select_responses[key] = formData.getAll(fieldName);
                });

                // Send webhook
                sendWebhook(submissionData);

                // Hide all sections and show message
                document.querySelectorAll('.question-group').forEach(group => {
                    group.style.display = 'none';
                });
                
                // Hide submit button and container
                const submitBtn = document.getElementById('submit-btn');
                if (submitBtn) {
                    submitBtn.style.display = 'none';
                }
                const submitContainer = document.querySelector('.submit-container');
                if (submitContainer) {
                    submitContainer.style.display = 'none';
                }

                resultDisplay.style.display = 'block';
                resultDisplay.className = 'result-display result-disqualify';
                if (reason === 'DEPRESSION_SPECIAL_MESSAGE') {
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
                            <button id="start-over" style="background:black;color:white;border:none;padding:10px 18px;border-radius:6px;cursor:pointer;">Start Over</button>
                        </div>
                    `;
                } else {
                    resultDisplay.innerHTML = `
                        <div style="font-size: 18px; margin-bottom: 10px;">❌ Not Eligible for Treatment</div>
                        <div style="font-size: 14px; font-weight: normal;">Thank you for starting your assessment - unfortunately, you don't qualify because ${reason}</div>
                        <div style="margin-top: 16px;">
                            <button id="start-over" style="background:black;color:white;border:none;padding:10px 18px;border-radius:6px;cursor:pointer;">Start Over</button>
                        </div>
                    `;
                }
                resultDisplay.scrollIntoView({ behavior: 'smooth' });

                // Disable all form inputs to prevent further changes
                const inputs = form.querySelectorAll('input, textarea, button');
                inputs.forEach(el => { el.disabled = true; });
                
                // Re-enable the Start Over button after it's created
                setTimeout(() => {
                    const startOverBtn = document.getElementById('start-over');
                    if (startOverBtn) {
                        startOverBtn.disabled = false;
                    }
                }, 100);
            }

            function setupEarlyDisqualifyMonitoring() {
                const commonSelectors = [
                    'input[name="date_of_birth"]',
                    'input[name="pregnancy"]',
                    'input[name="depression"]',
                    'input[name="chemotherapy"]'
                ];

                const formSpecificSelectors = {
                    'glp1': [
                        'input[name="glp1_allergy_list"]',
                        'input[name="hba1c_high"]',
                        'input[name="alcohol_amount"]',
                        'input[name="family_history"]',
                        'input[name="medical_conditions"]',
                        'input[name="current_medications"]'
                    ],
                    'nad': [],
                    'sermorelin': [
                        'input[name="cancer"]',
                        'input[name="athlete"]',
                        'input[name="thyroid_controlled"]'
                    ]
                };

                const allSelectors = [...commonSelectors, ...(formSpecificSelectors[formType] || [])];
                const disqualifierSelectors = allSelectors.join(',');

                const handler = function() {
                    const formData = new FormData(form);
                    const reason = getDisqualifyReason(formData);
                    if (reason) {
                        earlyDisqualify(reason);
                    }
                };

                const elements = document.querySelectorAll(disqualifierSelectors);
                if (elements.length > 0) {
                    elements.forEach(input => {
                        input.addEventListener('change', handler);
                    });
                }
            }

            // Routing logic
            function determineRouting(formData) {
                // Get form data for URL parameters
                const name = encodeURIComponent(formData.get('full_name') || '');
                const email = encodeURIComponent(formData.get('email') || '');
                const phone = encodeURIComponent(formData.get('phone') || '');
                
                // Build parameter string including UTMs and tracking data
                let params = `?name=${name}&email=${email}&phone=${phone}`;
                
                // Add UTM parameters if they exist
                Object.entries(trackingData.utm_params).forEach(([key, value]) => {
                    if (value) {
                        params += `&${key}=${encodeURIComponent(value)}`;
                    }
                });
                
                // Add GHL data if available
                Object.entries(trackingData.ghl_data).forEach(([key, value]) => {
                    if (value) {
                        params += `&${key}=${encodeURIComponent(value)}`;
                    }
                });
                
                // Add any additional parameters
                Object.entries(trackingData.additional_params).forEach(([key, value]) => {
                    if (value) {
                        params += `&${key}=${encodeURIComponent(value)}`;
                    }
                });
                
                // Check for DISQUALIFY conditions
                const reason = getDisqualifyReason(formData);
                if (reason) {
                    return {
                        outcome: 'DISQUALIFY',
                        redirectUrl: '{{custom_values.root_domain}}/thankyou'
                    };
                }

                // Form-specific FLAG and PROCEED logic
                if (formType === 'glp1') {
                    return determineGLP1Routing(formData, params);
                } else if (formType === 'nad') {
                    return determineNADRouting(formData, params);
                } else if (formType === 'sermorelin') {
                    return determineSermorelinRouting(formData, params);
                }

                // Default to PROCEED
                return {
                    outcome: 'PROCEED',
                    redirectUrl: `{{custom_values.root_domain}}${config.redirectPath}${params}`
                };
            }

            function determineGLP1Routing(formData, params) {
                // FLAG conditions
                if (formData.getAll('medical_conditions').includes('diabetes_type2')) {
                    return {
                        outcome: 'FLAG',
                        redirectUrl: `{{custom_values.root_domain}}/weightloss-fee${params}`
                    };
                }

                const medicalConditions = formData.getAll('medical_conditions');
                const flagConditions = ['diabetic_retinopathy', 'diabetic_ketoacidosis', 'gallbladder_disease', 'kidney_disease', 'stomach_problems', 'bariatric_surgery'];
                const hasFlagCondition = medicalConditions.some(condition => flagConditions.includes(condition));
                
                if (hasFlagCondition) {
                    return {
                        outcome: 'FLAG',
                        redirectUrl: `{{custom_values.root_domain}}/weightloss-fee${params}`
                    };
                }

                const medications = formData.getAll('current_medications');
                const flagMeds = ['insulin_secretagogues'];
                const hasFlagMed = medications.some(med => flagMeds.includes(med));
                
                if (hasFlagMed) {
                    return {
                        outcome: 'FLAG',
                        redirectUrl: `{{custom_values.root_domain}}/weightloss-fee${params}`
                    };
                }

                if (['3-5_weekly', '1-2_daily'].includes(formData.get('alcohol_amount'))) {
                    return {
                        outcome: 'FLAG',
                        redirectUrl: `{{custom_values.root_domain}}/weightloss-fee${params}`
                    };
                }

                return {
                    outcome: 'PROCEED',
                    redirectUrl: `{{custom_values.root_domain}}/weightloss-fee${params}`
                };
            }

            function determineNADRouting(formData, params) {
                // FLAG conditions
                const flagConditions = [
                    formData.get('nad_allergy') === 'yes',
                    formData.get('heart_disease') === 'yes', 
                    formData.get('cancer_history') === 'yes',
                    formData.get('family_cancer') === 'yes'
                ];

                if (flagConditions.some(condition => condition)) {
                    return {
                        outcome: 'FLAG',
                        redirectUrl: `{{custom_values.root_domain}}/antiaging-fee${params}`
                    };
                }

                return {
                    outcome: 'PROCEED',
                    redirectUrl: `{{custom_values.root_domain}}/antiaging-fee${params}`
                };
            }

            function determineSermorelinRouting(formData, params) {
                // FLAG conditions
                const flagConditions = [
                    formData.get('current_sermorelin') === 'yes',
                    (formData.get('thyroid') === 'yes' && formData.get('thyroid_controlled') === 'yes')
                ];

                if (flagConditions.some(condition => condition)) {
                    return {
                        outcome: 'FLAG',
                        redirectUrl: `{{custom_values.root_domain}}/hormones-fee${params}`
                    };
                }

                return {
                    outcome: 'PROCEED',
                    redirectUrl: `{{custom_values.root_domain}}/hormones-fee${params}`
                };
            }

            // Webhook sender
            function sendWebhook(submissionData) {
                console.log('Sending form submission webhook:', submissionData);
                fetch('https://locumtele.app.n8n.cloud/webhook/patient-screener', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submissionData)
                })
                .then(response => {
                    console.log('Form webhook response:', response.status, response.statusText);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Form webhook success:', data);
                })
                .catch(error => {
                    console.error('Form webhook error:', error);
                });
            }

            // Trigger GHL redirect function
            function triggerGHLRedirect(redirectUrl) {
                // Dispatch custom event with the specific redirect URL
                const redirectEvent = new CustomEvent('ghlRedirect', {
                    detail: { 
                        category: config.category,
                        formType: formType,
                        redirectUrl: redirectUrl 
                    }
                });
                window.dispatchEvent(redirectEvent);
                
                // Fallback direct redirect if footer code doesn't handle it
                setTimeout(function() {
                    if (typeof window.redirectToURL === 'function') {
                        window.redirectToURL(redirectUrl);
                    } else {
                        window.location.href = redirectUrl;
                    }
                }, 500);
            }

            // Form submission handler
            form.addEventListener('submit', function(e) {
                console.log('Form submit event triggered!');
                e.preventDefault();
                
                const formData = new FormData(form);
                console.log('Form data collected:', Object.fromEntries(formData.entries()));
                const result = determineRouting(formData);
                console.log('Routing result:', result);

                // Prepare data for webhook
                const submissionData = {
                    form_type: config.formType,
                    timestamp: new Date().toISOString(),
                    routing_outcome: result.outcome,
                    responses: Object.fromEntries(formData.entries()),
                    tracking_data: trackingData
                };

                // Add multi-select responses if configured
                Object.entries(config.multiSelectFields).forEach(([key, fieldName]) => {
                    if (!submissionData.multi_select_responses) {
                        submissionData.multi_select_responses = {};
                    }
                    submissionData.multi_select_responses[key] = formData.getAll(fieldName);
                });

                // Send webhook for ALL form submissions
                sendWebhook(submissionData);

                // Only redirect if PROCEED (qualify)
                if (result.outcome === 'PROCEED') {
                    triggerGHLRedirect(result.redirectUrl);
                }
            });

            // Initialize form
            setupFollowUpQuestions();
            setupEarlyDisqualifyMonitoring();
            
            // Event delegation for Start Over button
            document.addEventListener('click', function(e) {
                if (e.target && e.target.id === 'start-over') {
                    // Re-enable all inputs and reset form
                    const allInputs = form.querySelectorAll('input, textarea, button');
                    allInputs.forEach(el => { el.disabled = false; });
                    form.reset();
                    
                    // Show all sections
                    document.querySelectorAll('.question-group').forEach(group => {
                        group.style.display = 'block';
                    });
                    
                    // Show submit button and container
                    const submitBtn = document.getElementById('submit-btn');
                    if (submitBtn) {
                        submitBtn.style.display = '';
                    }
                    const submitContainer = document.querySelector('.submit-container');
                    if (submitContainer) {
                        submitContainer.style.display = '';
                    }
                    
                    // Hide dynamic blocks
                    const followUpBlocks = document.querySelectorAll('.follow-up');
                    followUpBlocks.forEach(block => block.classList.remove('show'));
                    
                    // Clear result display
                    resultDisplay.style.display = 'none';
                    resultDisplay.innerHTML = '';
                }
            });
        });
    }

    // Expose the initialization function globally
    window.initMedicalScreener = initializeScreener;

})();