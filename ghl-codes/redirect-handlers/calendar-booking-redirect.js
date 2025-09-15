<script>
(function() {
    let bookingCompleted = false;
    const redirectUrl = '{{custom_values.root_domain}}/consult-confirmation';

    // Watch for booking completion indicators
    const bookingObserver = new MutationObserver((mutations) => {
        if (bookingCompleted) return;

        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.textContent) {
                    const text = node.textContent.toLowerCase();

                    // Look for booking completion indicators
                    if (text.includes('confirmed') ||
                        text.includes('booked') ||
                        text.includes('scheduled') ||
                        text.includes('appointment set') ||
                        text.includes('thank you') ||
                        text.includes('success') ||
                        text.includes('complete')) {

                        bookingCompleted = true;
                        console.log('Booking completion detected, redirecting...');

                        setTimeout(function() {
                            window.location.href = redirectUrl;
                        }, 2000);
                    }
                }
            });
        });
    });

    // Start observing for changes
    bookingObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Fallback: Manual continue button after 3 minutes
    setTimeout(function() {
        if (!bookingCompleted) {
            const continueBtn = document.createElement('div');
            continueBtn.innerHTML = `
                <button onclick="window.location.href='${redirectUrl}'"
                        style="position: fixed; bottom: 20px; right: 20px;
                               background: #28a745; color: white; padding: 15px 25px;
                               border: none; border-radius: 8px; cursor: pointer;
                               font-size: 16px; z-index: 9999; font-weight: 600;
                               box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                    Continue to Confirmation →
                </button>
            `;
            document.body.appendChild(continueBtn);
        }
    }, 180000); // 3 minutes

})();
</script>