document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('#sidebar-nav button, #mobile-nav button');
  const panels = document.querySelectorAll('.panel');

  function switchTab(cat) {
    navItems.forEach(btn => {
      if (btn.dataset.cat === cat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    panels.forEach(panel => {
      if (panel.id === 'panel-' + cat) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const cat = item.dataset.cat;
      if (cat) switchTab(cat);
    });
  });

  const calcGrid = document.getElementById('calc-grid');
  if (calcGrid) {
    calcGrid.innerHTML = calculators.map((calc, i) => `
      <div class="rounded-xl border border-brd bg-elev2 p-4 flex flex-col justify-between hover:border-violet/40 transition">
        <div>
          <span class="text-[10px] font-mono text-faint uppercase">Calculator 0${i+1}</span>
          <h4 class="font-display font-semibold text-sm text-ink mt-1">${calc.title}</h4>
          <p class="text-xs text-dim mt-1 leading-relaxed">${calc.desc}</p>
        </div>
        <button onclick="openCalculator(${calc.id})" class="mt-4 py-1.5 px-3 rounded-lg bg-elev3 border border-brd text-xs font-medium text-ink hover:border-violet/50 transition self-start">Open Calculator</button>
      </div>
    `).join('');
  }
});

const calculators = [
  { id: 1, title: 'Google AdSense Revenue Estimator', desc: 'Estimate monthly earnings based on page views and CTR.', fields: ['Monthly Page Views', 'Average CTR (%)', 'Cost Per Click ($)'] },
  { id: 2, title: 'Ezoic Earnings Calculator', desc: 'Project uplift from advanced ad layout optimization.', fields: ['Monthly Page Views', 'Current RPM ($)'] },
  { id: 3, title: 'Media.net Contextual Yield', desc: 'Calculate potential revenue from targeted contextual ads.', fields: ['Search Queries / Views', 'RPM ($)'] },
  { id: 4, title: 'AdMob Mobile App Revenue', desc: 'Model in-app banner, interstitial, and rewarded ad income.', fields: ['Daily Active Users (DAU)', 'Impressions per User', 'eCPM ($)'] },
  { id: 5, title: 'Amazon Appstore Royalties', desc: 'Estimate developer payouts for digital app distributions.', fields: ['Paid App Downloads', 'App Price ($)'] },
  { id: 6, title: 'Payoneer Fee & Conversion Calculator', desc: 'Calculate net funds after international transfer fees.', fields: ['Withdrawal Amount ($)', 'Fee Percentage (%)'] },
  { id: 7, title: 'Content Traffic Growth Model', desc: 'Project organic traffic scaling over 12 months.', fields: ['Current Monthly Visitors', 'Monthly Growth Rate (%)'] },
  { id: 8, title: 'Vercel Bandwidth Cost Estimator', desc: 'Monitor static hosting and serverless function limits.', fields: ['Total GB Bandwidth Used', 'Cost per Extra GB ($)'] },
  { id: 9, title: 'App Monetization ROI Calculator', desc: 'Evaluate development cost vs. ad network returns.', fields: ['Total Development Cost ($)', 'Monthly Ad Revenue ($)'] },
  { id: 10, title: 'Author / Researcher Citation Impact', desc: 'Track academic publication metrics and visibility.', fields: ['Total Published Papers', 'Average Citations per Paper'] }
];

function openCalculator(id) {
  const calc = calculators.find(c => c.id === id);
  if (!calc) return;

  const modal = document.getElementById('calc-modal');
  const content = document.getElementById('modal-content');
  
  let fieldsHTML = calc.fields.map((field, idx) => `
    <div class="mb-3">
      <label class="block text-xs font-mono text-dim mb-1">${field}</label>
      <input type="number" id="calc-input-${idx}" value="1000" class="w-full bg-elev3 border border-brd rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-violet">
    </div>
  `).join('');

  content.innerHTML = `
    <h3 class="font-display font-semibold text-lg text-ink mb-1">${calc.title}</h3>
    <p class="text-xs text-dim mb-4">${calc.desc}</p>
    <div class="space-y-3 mb-5">${fieldsHTML}</div>
    <button onclick="calculateResult(${calc.id})" class="w-full py-2.5 rounded-lg bg-violet text-sm font-semibold text-base hover:opacity-90 transition">Calculate Results</button>
    <div id="calc-result" class="mt-4 p-3 rounded-lg bg-elev3 border border-brd text-sm font-mono text-teal text-center hidden"></div>
  `;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeCalculator() {
  const modal = document.getElementById('calc-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function calculateResult(id) {
  const calc = calculators.find(c => c.id === id);
  let v = calc.fields.map((_, idx) => parseFloat(document.getElementById(`calc-input-${idx}`).value) || 0);
  let resText = "";

  if (id === 1) resText = `Estimated Monthly Earnings: $${((v[0] * (v[1]/100)) * v[2]).toFixed(2)}`;
  else if (id === 2) resText = `Estimated Optimized Earnings: $${((v[0] / 1000) * (v[1] * 1.35)).toFixed(2)} (35% average lift)`;
  else if (id === 3) resText = `Projected Contextual Yield: $${((v[0] / 1000) * v[1]).toFixed(2)}`;
  else if (id === 4) resText = `Monthly AdMob Revenue: $${(((v[0] * v[1] * 30) / 1000) * v[2]).toFixed(2)}`;
  else if (id === 5) resText = `Estimated Net Royalty (70%): $${(v[0] * v[1] * 0.70).toFixed(2)}`;
  else if (id === 6) resText = `Net Received Amount: $${(v[0] - (v[0] * (v[1]/100))).toFixed(2)}`;
  else if (id === 7) resText = `Projected Visitors (Month 12): ${Math.round(v[0] * Math.pow(1 + (v[1]/100), 12))}`;
  else if (id === 8) resText = v[0] <= 100 ? `Within Free Tier Limit ($0.00)` : `Estimated Cost: $${((v[0] - 100) * v[1]).toFixed(2)}`;
  else if (id === 9) resText = `Break-even Period: ${(v[0] / (v[1] || 1)).toFixed(1)} Months`;
  else if (id === 10) resText = `Total Citation Impact Score: ${v[0] * v[1]}`;

  const resDiv = document.getElementById('calc-result');
  resDiv.innerText = resText;
  resDiv.classList.remove('hidden');
}
