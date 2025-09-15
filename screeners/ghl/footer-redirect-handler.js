<!-- GHL Footer Redirect Code for Medical Screening Forms -->
<!-- Add this to your GHL site footer in Website Settings > Footer Code -->
<!-- Supports category-based redirects: weightloss, antiaging, sexual health, hormone, hair and skin -->

<script>
    // GHL Medical Form Redirect Handler
    (function() {
        'use strict';

        // Capture location values from GHL merge fields
        const locationId   = "{{location.id}}";
        const locationName = "{{location.name}}";
        const integration = "{{custom_values.private}}";
        const rootdomain = "{{ custom_values.root_domain }}";

        // States that don't allow async consultations
        const ASYNC_RESTRICTED_STATES = [
            'TX', 'CA', 'NY', 'FL', 'NV', 'PA', 'OH', 'NC', 'GA', 'MI', 'IL'
            // Add states as needed - this list can be updated easily
        ];

        // Define redirect URLs by category and consult type
        const redirectUrls = {
            weightloss: {
                sync: `${rootdomain}/weightloss-sync-fee`,
                async: `${rootdomain}/weightloss-async-fee`
            },
            antiaging: {
                sync: `${rootdomain}/antiaging-sync-fee`,
                async: `${rootdomain}/antiaging-async-fee`
            },
            sexualHealth: {
                sync: `${rootdomain}/sexualhealth-sync-fee`,
                async: `${rootdomain}/sexualhealth-async-fee`
            },
            hormone: {
                sync: `${rootdomain}/hormone-sync-fee`,
                async: `${rootdomain}/hormone-async-fee`
            },
            hairSkin: {
                sync: `${rootdomain}/hairandskin-sync-fee`,
                async: `${rootdomain}/hairandskin-async-fee`
            }
        };

        // Function to fetch telehealth logic and perform smart redirect
        async function redirectToConsult(category, userState = null) {
            try {
                // Fetch telehealth logic for this screener
                const telehealthLogic = await fetchTelehealthLogic(category);

                // Determine user's state (try parameter first, then location name)
                const state = userState || extractStateFromLocation(locationName);

                // Determine final consult type
                let consultType = telehealthLogic?.consult || 'sync'; // default to sync

                // Override async to sync if state is restricted
                if (consultType === 'async' && state && ASYNC_RESTRICTED_STATES.includes(state.toUpperCase())) {
                    consultType = 'sync';
                    console.log(`State ${state} doesn't allow async - switching to sync consult`);
                }

                // Get the appropriate URL
                const categoryUrls = redirectUrls[category];
                if (!categoryUrls) {
                    console.error(`Unknown category: ${category}`);
                    return;
                }

                const baseUrl = categoryUrls[consultType];
                if (!baseUrl) {
                    console.error(`No URL configured for ${category} ${consultType}`);
                    return;
                }

                // Build final URL with parameters
                const url = `${baseUrl}?location_id=${encodeURIComponent(locationId)}&location_name=${encodeURIComponent(locationName)}&consult_type=${consultType}`;
                console.log(`Redirecting to ${category} ${consultType} consult: ${url}`);
                window.location.href = url;

            } catch (error) {
                console.error('Error in redirect logic:', error);
                // Fallback to sync consult
                const fallbackUrl = redirectUrls[category]?.sync;
                if (fallbackUrl) {
                    window.location.href = `${fallbackUrl}?location_id=${encodeURIComponent(locationId)}&location_name=${encodeURIComponent(locationName)}&consult_type=sync`;
                }
            }
        }

        // Fetch telehealth logic from Notion
        async function fetchTelehealthLogic(screener) {
            try {
                // You'll need to create this n8n endpoint
                const response = await fetch(`https://locumtele.app.n8n.cloud/webhook/telehealth-logic?screener=${screener}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                console.warn('Could not fetch telehealth logic:', error);
                return { consult: 'sync' }; // Safe default
            }
        }

        // Extract state from location name
        function extractStateFromLocation(locationName) {
            if (!locationName) return null;

            // Try to extract state from common location name patterns
            const stateMatch = locationName.match(/,\s*([A-Z]{2})$/i) || // "City, ST"
                              locationName.match(/\b([A-Z]{2})\b/i);      // Any 2-letter code

            return stateMatch ? stateMatch[1].toUpperCase() : null;
        }

        // Make function globally available for direct calls
        window.redirectToConsult = redirectToConsult;

        // Listen for custom events from forms (direct hosting)
        window.addEventListener('ghlRedirect', function(event) {
            const category = event.detail?.category || event.detail?.formType;
            if (category) {
                // Add small delay to ensure webhook completes
                setTimeout(function() {
                    redirectToConsult(category);
                }, 500);
            }
        });


        // Listen for iframe messages (when using embed.html)
        window.addEventListener('message', function(event) {
            // Accept messages from GitHub Pages
            if (event.origin !== 'https://locumtele.github.io') {
                return;
            }

            // Handle redirect messages
            if (event.data && event.data.type === 'ghlRedirect') {
                const category = event.data.detail?.category || event.data.detail?.formType;
                if (category) {
                    setTimeout(function() {
                        redirectToConsult(category);
                    }, 500);
                }
            }
        });

        // Alternative: Listen for form submissions and detect category
        document.addEventListener('submit', function(event) {
            const form = event.target;

            // Check for category data attribute or form class
            const category = form.dataset.category || form.className.match(/category-(\w+)/)?.[1];
            if (category && redirectUrls[category]) {
                setTimeout(function() {
                    redirectToConsult(category);
                }, 1000);
            }
        });

    })();
</script>