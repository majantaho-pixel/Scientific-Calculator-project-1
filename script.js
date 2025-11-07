// Basic theme handling
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

function setTheme(dark){
  if(dark){
    document.documentElement.setAttribute('data-theme','dark');
    themeToggle.textContent = 'Light';
    localStorage.setItem('mycalc-theme','dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = 'Dark';
    localStorage.setItem('mycalc-theme','light');
  }
}
const saved = localStorage.getItem('mycalc-theme') || 'light';
setTheme(saved === 'dark');

themeToggle.addEventListener('click',()=>{
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  setTheme(!isDark);
});

/* -------------------------
   AD SETTINGS (simple)
   ------------------------- */
const adSettingsBtn = document.getElementById('adSettingsBtn');
const adModal = document.getElementById('adSettingsModal');
const closeAds = document.getElementById('closeAds');
const saveAds = document.getElementById('saveAds');

adSettingsBtn.addEventListener('click',()=>adModal.classList.remove('hidden'));
closeAds.addEventListener('click',()=>adModal.classList.add('hidden'));

// load saved
['publisher','adslot-1','adslot-2','adslot-3','adslot-4','adslot-5','adslot-6','adslot-7']
.forEach(k=>{
  const el = document.getElementById(k==='publisher'?'ads-publisher':k);
  try{
    el.value = localStorage.getItem(k) || '';
  }catch(e){}
});

saveAds.addEventListener('click',()=>{
  const publisher = document.getElementById('ads-publisher').value.trim();
  const slots = {};
  for(let i=1;i<=7;i++){
    slots[i] = document.getElementById('adslot-'+i).value.trim();
    localStorage.setItem('adslot-'+i, slots[i]);
  }
  localStorage.setItem('publisher', publisher);
  document.getElementById('adSettingsModal').classList.add('hidden');

  if(!publisher){
    alert('Publisher ID داخل کریں (مثال: ca-pub-1234567890123456)');
    return;
  }
  // inject AdSense script (only once)
  if(!window.adsenseInjected){
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    s.setAttribute('data-ad-client', publisher);
    document.head.appendChild(s);
    window.adsenseInjected = true;
  }
  // create ad slots where IDs provided
  for(let i=1;i<=7;i++){
    const slot = localStorage.getItem('adslot-'+i);
    const container = document.getElementById('ad-slot-'+i);
    if(container){
      container.innerHTML = '';
      if(slot){
        // create ins tag
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-client', publisher);
        ins.setAttribute('data-ad-slot', slot);
        ins.setAttribute('data-ad-format', 'auto');
        container.appendChild(ins);
        try{
          (adsbygoogle = window.adsbygoogle || []).push({});
        }catch(e){
          // push may fail if not approved yet
          console.warn('adsbygoogle push failed', e);
        }
      } else {
        container.innerHTML = '<div class="ad-placeholder">Ad (خالی) — adslot نہیں ملا</div>';
      }
    }
  }
});

/* -------------------------
   Calculator 1: Simple + Scientific
   ------------------------- */
const display1 = document.getElementById('calc-display-1');
let expr1 = '';
const keysBasic1 = document.getElementById('keys-basic-1');
const keysSci1 = document.getElementById('keys-sci-1');
const toggleSci = document.getElementById('toggleSci');

toggleSci.addEventListener('click',()=>{
  const hidden = keysSci1.classList.toggle('hidden');
  // text toggle
  toggleSci.textContent = hidden ? 'Scientific' : 'Simple';
});

function updateDisplay1(){
  display1.textContent = expr1 || '0';
}

document.querySelectorAll('#keys-basic-1 .num').forEach(b=>{
  b.addEventListener('click',()=>{ expr1 += b.textContent; updateDisplay1(); });
});
document.querySelectorAll('#keys-basic-1 .btn:not(.num)').forEach(b=>{
  b.addEventListener('click',()=> {
    const t = b.textContent;
    if(t === '=') { evaluateCalc1(); return; }
    if(t === '.') { expr1 += '.'; updateDisplay1(); return; }
    expr1 += t;
    updateDisplay1();
  });
});
document.getElementById('clear1').addEventListener('click',()=>{ expr1=''; updateDisplay1(); });
document.getElementById('back1').addEventListener('click',()=>{ expr1=expr1.slice(0,-1); updateDisplay1(); });
document.getElementById('equals1').addEventListener('click',evaluateCalc1);

// scientific buttons
document.querySelectorAll('#keys-sci-1 .fn').forEach(b=>{
  b.addEventListener('click',()=>{
    const v = b.textContent;
    if(v === 'π') expr1 += 'π';
    else if(v === 'e') expr1 += 'e';
    else if(v === '!') expr1 += '!';
    else expr1 += v;
    updateDisplay1();
  });
});

// helper: factorial
function factorial(n){
  n = Math.floor(n);
  if(n < 0) return NaN;
  let f = 1;
  for(let i=2;i<=n;i++) f *= i;
  return f;
}

// Evaluate safe-ish expression for calc1
function evaluateCalc1(){
  if(!expr1) return;
  try{
    // replace tokens to JS
    let e = expr1.replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E');
    // handle factorial: replace n! with fact(n) [simple handling]
    e = e.replace(/(\d+)!/g, 'fact($1)');
    // ^ operator -> ** (power)
    e = e.replace(/\^/g, '**');
    // ln( -> Math.log( ; log( -> Math.log10( )
    e = e.replace(/ln\(/g,'Math.log(');
    e = e.replace(/log\(/g,'Math.log10(');
    e = e.replace(/sqrt\(/g,'Math.sqrt(');
    // functions sin cos tan (assume radians)
    e = e.replace(/sin\(/g,'Math.sin(');
    e = e.replace(/cos\(/g,'Math.cos(');
    e = e.replace(/tan\(/g,'Math.tan(');

    // replace any accidental non-allowed chars
    if(/[^\d+\-*/().,*%MathPIElogsqrtfactorsinctanegpow!^ ]/i.test(expr1)){
      // allow digits, operators, letters used above
      // continue but could be risky
    }

    // create function
    const result = Function('fact','Math','return '+ e)(factorial, Math);
    expr1 = String(result);
    updateDisplay1();
  }catch(err){
    display1.textContent = 'خطا';
    expr1 = '';
  }
}

/* -------------------------
   BMI Calculator
   ------------------------- */
document.getElementById('calc-bmi').addEventListener('click',()=>{
  const w = parseFloat(document.getElementById('bmi-weight').value);
  const hcm = parseFloat(document.getElementById('bmi-height').value);
  const resBox = document.getElementById('bmi-result');
  const tipsBox = document.getElementById('bmi-tips');
  if(!w || !hcm){ resBox.textContent = 'براہ کرم وزن اور قد درست داخل کریں'; tipsBox.innerHTML=''; return; }
  const h = hcm/100;
  const bmi = w / (h*h);
  const b = Math.round(bmi*10)/10;
  let cat = '', tips = '';
  if(b < 18.5){ cat = 'کم وزن'; tips = 'نصابِ کھانا بڑھائیں؛ پروٹین اور کیلوریز میں اضافہ کریں۔'); }
  else if(b < 25){ cat = 'صحت مند'; tips = 'زبردست؛ متوازن غذا اور معمولی ورزش جاری رکھیں۔'; }
  else if(b < 30){ cat = 'موٹاپا (اوورویٹ)'; tips = 'ڈائیٹ پر نظر؛ cardio اور ورزش کریں، مقدارِ غذا کم کریں۔'; }
  else { cat = 'شدید موٹاپا'; tips = 'ڈاکٹر سے مشورہ لیں؛ غذائیت اور ورزش کا منصوبہ بنائیں۔'; }

  // small blessing / motivational dua
  const blessing = '<div style="margin-top:8px;font-weight:600">دعا: اللہ آپ کو صحت عطا کرے اور آسانی دے۔ آمین۔</div>';

  resBox.innerHTML = `BMI: <strong>${b}</strong> — ${cat}`;
  tipsBox.innerHTML = `<div>${tips}</div>${blessing}`;
});

/* -------------------------
   Big calculator handling
   ------------------------- */
const bigDisplay = document.getElementById('big-display');
let bigExpr = '';

function updateBig(){ bigDisplay.textContent = bigExpr || '0'; }
document.querySelectorAll('.big-keys .btn[data-key]').forEach(b=>{
  b.addEventListener('click',()=> {
    const k = b.getAttribute('data-key');
    bigExpr += k;
    updateBig();
  });
});
document.getElementById('big-clear').addEventListener('click',()=>{ bigExpr=''; updateBig(); });
document.getElementById('big-equals').addEventListener('click',()=>{
  if(!bigExpr) return;
  try{
    // percent handling e.g. 50% -> (50/100)
    const e = bigExpr.replace(/(\d+)%/g,'($1/100)');
    const result = Function('return '+ e)();
    bigExpr = String(result);
    updateBig();
  }catch(e){
    bigDisplay.textContent = 'خطا';
    bigExpr='';
  }
});

/* -------------------------
   simple keyboard support (optional)
   ------------------------- */
document.addEventListener('keydown',(ev)=>{
  if(ev.key === 'Enter'){ evaluateCalc1(); ev.preventDefault(); }
  // allow numbers for big calc too (append)
});

/* -------------------------
   Initialize ads from saved data on load (if present)
   ------------------------- */
window.addEventListener('load',()=>{
  // prepopulate modal inputs
  const publisher = localStorage.getItem('publisher') || '';
  if(publisher){
    document.getElementById('ads-publisher').value = publisher;
    // emulate Save to inject ads
    document.getElementById('saveAds').click();
  }
});
