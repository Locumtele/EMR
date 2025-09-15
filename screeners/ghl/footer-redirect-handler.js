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

        // Define redirect URLs using GHL custom values by category
        const redirectUrls = {
            weightloss: `${rootdomain}/weightloss-fee`,
            antiaging: `${rootdomain}/antiaging-fee`,
            sexualHealth: `${rootdomain}/sexualhealth-fee`,
            hormone: `${rootdomain}/hormone-fee`,
            hairSkin: `${rootdomain}/hairandskin-fee`,
        };

        // Function to perform redirect
        function redirectToConsult(category) {
            const baseUrl = redirectUrls[category];
            if (baseUrl) {
                // Append location ID and name as query parameters
                const url = `${baseUrl}?location_id=${encodeURIComponent(locationId)}&location_name=${encodeURIComponent(locationName)}`;
                console.log(`Redirecting to ${category} consult: ${url}`);
                window.location.href = url;
            } else {
                console.error(`Unknown category: ${category}`);
            }
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