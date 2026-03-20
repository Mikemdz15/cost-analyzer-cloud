const fs = require('fs');
let code = fs.readFileSync('inject-supabase-html.js', 'utf8');

// Add id and name attributes to checkboxes to satisfy Edge Accessibility warnings
const oldCheckAll = `<input type="checkbox" 
                               checked={isAllSelected}`;
const newCheckAll = `<input type="checkbox" id={"checkbox-all-" + profile.id} name="company_all"
                               checked={isAllSelected}`;

const oldCheckItem = `<input type="checkbox" 
                                       checked={currentList.includes(c.name)}`;
const newCheckItem = `<input type="checkbox" id={"checkbox-" + profile.id + "-" + c.id} name={"company_" + c.id}
                                       checked={currentList.includes(c.name)}`;

code = code.replace(oldCheckAll, newCheckAll);
code = code.replace(oldCheckItem, newCheckItem);

fs.writeFileSync('inject-supabase-html.js', code);
console.log('Patch 6 (Accessibility Warnings Silence) applied!');
