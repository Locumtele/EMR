// GHL Footer Redirect Code for Medical Screening Forms
// Add this to your GHL site footer in Website Settings > Footer Code
// Supports category-based redirects: weightloss, antiaging, sexual health, hormone, hair and skin

// GHL Medical Form Redirect Handler
(function() {
    'use strict';

    // Capture location values from GHL merge fields
    const locationId   = "{{location.id}}";
    const locationName = "{{location.name}}";
    const integration = "{{custom_values.private}}";
    const rootdomain = "{{ custom_values.root_domain }}";


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

        // Function to perform redirect with consult type
        function redirectToConsult(category, consultType = 'sync') {
            // Get the appropriate URL
            const categoryUrls = redirectUrls[category];
            if (!categoryUrls) {
                console.error(`Unknown category: ${category}`);
                return;
            }

            const baseUrl = categoryUrls[consultType];
            if (!baseUrl) {
                console.error(`No URL configured for ${category} ${consultType}`);
                // Fallback to sync if async URL not configured
                const fallbackUrl = categoryUrls['sync'];
                if (fallbackUrl) {
                    console.log(`Falling back to sync for ${category}`);
                    window.location.href = `${fallbackUrl}?location_id=${encodeURIComponent(locationId)}&location_name=${encodeURIComponent(locationName)}&consult_type=sync`;
                }
                return;
            }

            // Build final URL with parameters
            const url = `${baseUrl}?location_id=${encodeURIComponent(locationId)}&location_name=${encodeURIComponent(locationName)}&consult_type=${consultType}`;
            console.log(`Redirecting to ${category} ${consultType} consult: ${url}`);
            window.location.href = url;
        }

        // Make function globally available for direct calls
        window.redirectToConsult = redirectToConsult;

        // Listen for custom events from forms (direct hosting)
        window.addEventListener('ghlRedirect', function(event) {
            const category = event.detail?.category || event.detail?.formType;
            const consultType = event.detail?.consult_type || 'sync'; // Default to sync

            if (category) {
                // Add small delay to ensure webhook completes
                setTimeout(function() {
                    redirectToConsult(category, consultType);
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
                const consultType = event.data.detail?.consult_type || 'sync'; // Default to sync

                if (category) {
                    setTimeout(function() {
                        redirectToConsult(category, consultType);
                    }, 500);
                }
            }
        });

        // Alternative: Listen for form submissions and detect category
        document.addEventListener('submit', function(event) {
            const form = event.target;

            // Check for category data attribute or form class
            const category = form.dataset.category || form.className.match(/category-(\w+)/)?.[1];
            const consultType = form.dataset.consultType || 'sync'; // Default to sync

            if (category && redirectUrls[category]) {
                setTimeout(function() {
                    redirectToConsult(category, consultType);
                }, 1000);
            }
        });

})();