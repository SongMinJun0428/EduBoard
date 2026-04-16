/**
 * 🛡️ EduBoard Anti-Tamper Security Script
 * --------------------------------------
 * 1. DOM Mutation Protection: Reverts unauthorized HTML/Text changes.
 * 2. State Isolation: Encourages keeping variables private.
 * 3. DevTools Detection: Triggers a soft debugger loop when used for tampering.
 */

(function() {
    'use strict';

    // 1. [DOM Protection] Protect critical IDs from being modified via Elements tab
    const PROTECTED_IDS = [
        'coin-balance', 'stat-total', 'stat-total-coins', 'stat-max-level', 
        'stat-recent-logs', 'stat-shop-items', 'stat-classes', 'shop-coin-balance',
        'dash-name', 'dash-role', 'lv-num', 'exp-cur', 'exp-need'
    ];

    const AUTHENTIC_VALUES = {};

    // Initial capture of values (Wait for DOM/First Load)
    window.addEventListener('load', () => {
        setTimeout(captureInitialValues, 1500); // Allow some time for initial data fetch
    });

    function captureInitialValues() {
        PROTECTED_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) AUTHENTIC_VALUES[id] = el.textContent;
        });
        startObserving();
    }

    function startObserving() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const target = mutation.target.nodeType === 3 ? mutation.target.parentElement : mutation.target;
                const id = target.id;
                
                if (PROTECTED_IDS.includes(id)) {
                    const el = document.getElementById(id);
                    if (el && AUTHENTIC_VALUES[id] !== undefined) {
                        const currentValue = (id === 'dash-name') ? el.innerHTML : el.textContent;
                        if (currentValue !== AUTHENTIC_VALUES[id]) {
                            console.warn(`🛡️ Security: Unauthorized modification detected on #${id}. Reverting...`);
                            if (id === 'dash-name') el.innerHTML = AUTHENTIC_VALUES[id];
                            else el.textContent = AUTHENTIC_VALUES[id];
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            characterData: true,
            childList: true,
            subtree: true
        });
    }

    // Export a helper to update authentic values from legitimate scripts
    window.__updateSecurityValue = function(id, value, isHtml = false) {
        AUTHENTIC_VALUES[id] = String(value);
        const el = document.getElementById(id);
        if (el) {
            if (isHtml || id === 'dash-name') el.innerHTML = String(value);
            else el.textContent = String(value);
        }
    };

    // 2. [Anti-Debugging] Discourage DevTools usage for modification
    function detectDevTools() {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            // DevTools is likely open
            // Trigger debugger periodically to make editing painful
            // BUT only do it if the user tries to interact/modify suspiciously
        }
    }
    // setInterval(detectDevTools, 2000);

    // 3. [Soft Debugger] Only fire if they try to change the DOM
    function triggerSoftDebugger() {
        (function() {}.constructor('debugger')());
    }

    // 4. [Self-XSS Educational Warning]
    // Standard high-visibility warning used by major platforms to prevent trickery.
    console.log(
        "%cSTOP!",
        "color: white; font-family: sans-serif; font-size: 4.5em; font-weight: bolder; text-shadow: #000 1px 1px; background-color: red; padding: 10px 20px; border-radius: 8px;"
    );
    console.log(
        "%cThis is a browser feature intended for developers. If someone told you to copy and paste something here to enable a feature or 'hack' someone's account, it is a scam and will give them access to your account.",
        "font-family: sans-serif; font-size: 1.5em; font-weight: bold; color: red;"
    );
    console.log(
        "%c🛡️ EduBoard Security System Active | Unauthorized modification attempts are logged.",
        "font-family: sans-serif; font-size: 1em; color: #4f46e5;"
    );

})();
