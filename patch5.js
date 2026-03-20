const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// Replace the inline button handlers with a robust window-level function that catches storage errors
const globalFuncs = `               // Global helper functions
               window.returnToHome = () => {
                   try { sessionStorage.removeItem('cost_analyzer_in_app'); } catch(e){ console.error(e); }
                   window.location.href = window.location.pathname;
               };
               window.appLogout = async () => {
                   await window.supabase.auth.signOut();
                   window.location.href = window.location.pathname; // triggers login view
               };
`;

if (!code.includes('window.returnToHome = () =>')) {
    code = code.replace(
        /window\.overrideHistoryManager = \(profileRole\) => \{/g,
        "window.overrideHistoryManager = (profileRole) => {\n" + globalFuncs
    );
}

// Update the buttons to use the new global functions
code = code.replace(
    /onclick="sessionStorage.removeItem\('cost_analyzer_in_app'\); window.location.href = window.location.pathname;"/g,
    `onclick="window.returnToHome()"`
);

fs.writeFileSync('inject-supabase-html.js', code);
console.log('Patch 5 applied!');
