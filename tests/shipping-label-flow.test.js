const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync('index.html', 'utf8');

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert(start >= 0, `missing ${name}`);
  const open = html.indexOf('{', start);
  let depth = 0, quote = null, esc = false;
  for (let i = open; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

const ctx = {};
vm.createContext(ctx);
['customerNorm','customerPhone','customerStreet','sameCustomer'].forEach(n => vm.runInContext(extractFunction(n), ctx));
const a = {customerId:'9021920804935', customer:'Esther Braun', email:'', phone:'7484315700', street:'973 E 28th St', zip:'11210'};
const b = {customerId:'9022075043911', customer:'Esther Braun', email:'esti1724@aol.com', phone:'+17184315700', street:'973 East 28th Street', zip:'11210'};
assert.equal(ctx.sameCustomer(a,b), true, '1308/1310-style name+normalized-address fallback');
assert.equal(ctx.sameCustomer({customerId:'42'},{customerId:'42'}), true, 'stable Shopify customer ID');
assert.equal(ctx.sameCustomer({email:'A@B.COM'},{email:'a@b.com'}), true, 'normalized email');
assert.equal(ctx.sameCustomer({phone:'+1 (718) 431-5700'},{phone:'7184315700'}), true, 'normalized phone');
assert.equal(ctx.sameCustomer({customer:'Esther Braun',street:'973 E 28th St',zip:'11210'},{customer:'Other Person',street:'973 East 28th Street',zip:'11210'}), false, 'name is required for address fallback');
assert.equal(ctx.sameCustomer({customer:'Esther Braun',street:'973 E 28th St',zip:'11210'},{customer:'Esther Braun',street:'999 E 28th St',zip:'11210'}), false, 'different street must not merge');

assert(html.includes('Product labels start at #'), 'product start control renamed');
assert(html.includes("confirm('Print a shipping label?')"), 'mark-shipped label prompt exists');
assert(html.includes('offerShippingLabels(doneNums);') && html.includes('offerShippingLabels(nums);'), 'full and partial ship paths prompt');
assert(html.includes('pendingShippingLabelNums.indexOf(o.num)>=0'), 'just-shipped order remains available for requested label');
assert(html.includes('for(var blank=1;blank<startAt;blank++) packed.push(null);'), 'delivery start offset still uses blank grid cells');
assert(html.includes('@page{size:letter;margin:0.25in;}'), 'print has printer-safe inset');
assert(html.includes('width:8in!important;height:10.5in!important'), 'print grid fits within inset letter page');
console.log('shipping-label-flow tests passed');
