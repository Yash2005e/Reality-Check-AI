// =====================================================
// REALITY CHECK AI - FRONTEND JAVASCRIPT
// =====================================================

let selectedFile    = null;
let isAnalyzing     = false;
let lastResults     = null;
let toastTimer      = null;
let typewriterTimer = null;
let isDarkMode      = false;

const analyzeBtn        = document.getElementById('analyzeBtn');
const imageInput        = document.getElementById('imageInput');
const dropZone          = document.getElementById('dropZone');
const imagePreview      = document.getElementById('imagePreview');
const resultContainer   = document.getElementById('resultContainer');
const loadingSpinner    = document.getElementById('loadingSpinner');
const confidenceSection = document.getElementById('confidenceSection');
const branchSection     = document.getElementById('branchSection');

// ── Effect A: Dark Mode ──────────────────────────────
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    const label = document.getElementById('darkModeLabel');
    const icon  = document.getElementById('darkIcon');
    if (label) label.textContent = isDarkMode ? 'Light' : 'Dark';
    if (icon)  icon.className    = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
}

// ── Effect 9: Toast ──────────────────────────────────
function showToast(message, type = 'green') {
    let toast = document.getElementById('toastNotif');
    if (!toast) { toast = document.createElement('div'); toast.id = 'toastNotif'; document.body.appendChild(toast); }
    toast.innerHTML = `<div class="toast-dot ${type}"></div>${message}`;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Effect 6: Typewriter ─────────────────────────────
const typewriterMessages = [
    'Scanning frequency domain...','Analyzing noise residuals...',
    'Checking diffusion artifacts...','Extracting FFT features...',
    'Running ML classifier...','Computing confidence score...',
];

function startTypewriter() {
    const el = document.querySelector('.loading-text-compact');
    if (!el) return;
    let idx = 0;
    el.textContent = typewriterMessages[0];
    typewriterTimer = setInterval(() => {
        idx = (idx + 1) % typewriterMessages.length;
        el.style.opacity = '0';
        setTimeout(() => { el.textContent = typewriterMessages[idx]; el.style.opacity = '1'; }, 200);
    }, 1400);
}
function stopTypewriter() { if (typewriterTimer) { clearInterval(typewriterTimer); typewriterTimer = null; } }

// ── Effect 1: Counter ────────────────────────────────
function animateCounter(el, targetPct, duration = 1200) {
    const start = performance.now();
    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.innerHTML = `<strong>${Math.round(targetPct * eased)}%</strong> Confidence Score`;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ── Effect 5: Card Glow ──────────────────────────────
function setCardGlow(state) {
    document.querySelectorAll('.card-elevated').forEach(c => {
        c.classList.remove('analyzing','verdict-real','verdict-fake');
        if (state === 'analyzing') c.classList.add('analyzing');
        else if (state === 'real') c.classList.add('verdict-real');
        else if (state === 'fake') c.classList.add('verdict-fake');
    });
}

// ── Effect 6: Scan Line + Particles ─────────────────
function startScanEffect() {
    stopScanEffect();
    ['tl','tr','bl','br'].forEach(pos => {
        const c = document.createElement('div'); c.className = `scan-corner ${pos}`; imagePreview.appendChild(c);
    });
    const line = document.createElement('div'); line.className = 'scan-line'; line.id = 'scanLine'; imagePreview.appendChild(line);
    [{top:'18%',left:'10%',delay:'0s'},{top:'62%',left:'76%',delay:'0.4s'},{top:'73%',left:'26%',delay:'0.8s'},
     {top:'28%',left:'66%',delay:'1.2s'},{top:'48%',left:'86%',delay:'0.6s'},{top:'80%',left:'50%',delay:'1.0s'}
    ].forEach(p => {
        const dot = document.createElement('div'); dot.className = 'scan-particle';
        dot.style.cssText = `top:${p.top};left:${p.left};animation-delay:${p.delay}`; imagePreview.appendChild(dot);
    });
}
function stopScanEffect() {
    document.getElementById('scanLine')?.remove();
    imagePreview.querySelectorAll('.scan-corner,.scan-particle').forEach(e => e.remove());
}

// ── Effect H: Heatmap ────────────────────────────────
function showHeatmap(isFake) {
    let overlay = document.getElementById('heatmapOverlay');
    let label   = document.getElementById('heatmapLabel');
    if (!overlay) { overlay = document.createElement('div'); overlay.id = 'heatmapOverlay'; overlay.className = 'heatmap-overlay'; imagePreview.appendChild(overlay); }
    if (!label)   { label   = document.createElement('div'); label.id   = 'heatmapLabel';   label.className   = 'heatmap-label';   imagePreview.appendChild(label); }
    overlay.className = `heatmap-overlay ${isFake?'fake':'real'}`;
    label.className   = `heatmap-label ${isFake?'fake':'real'}`;
    label.textContent = isFake ? 'SUSPICIOUS' : 'ALOMST AUTHENTIC';
    setTimeout(() => { overlay.classList.add('show'); label.classList.add('show'); }, 300);
}
function hideHeatmap() { document.getElementById('heatmapOverlay')?.remove(); document.getElementById('heatmapLabel')?.remove(); }

// ── Effect D: Step Progress (left panel) ─────────────
const stepDefs = ['Upload','Extract','Classify','Result'];

function showSteps() {
    const wrap = document.getElementById('analysisSteps');
    if (!wrap) return;
    wrap.classList.remove('d-none');
    setStep(0);
}

function setStep(activeIdx) {
    const wrap = document.getElementById('analysisSteps');
    if (!wrap) return;
    wrap.innerHTML = '';
    stepDefs.forEach((label, i) => {
        const item = document.createElement('div'); item.className = 'step-item';
        const dot  = document.createElement('div');
        dot.className = 'step-dot ' + (i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'waiting');
        dot.textContent = i < activeIdx ? '✓' : String(i + 1);
        const lbl = document.createElement('div');
        lbl.className = 'step-lbl ' + (i < activeIdx ? 'done' : i === activeIdx ? 'active' : '');
        lbl.textContent = label;
        item.appendChild(dot); item.appendChild(lbl); wrap.appendChild(item);
        if (i < stepDefs.length - 1) {
            const line = document.createElement('div');
            line.className = 'step-line ' + (i < activeIdx ? 'done' : '');
            wrap.appendChild(line);
        }
    });
}
function hideSteps() { document.getElementById('analysisSteps')?.classList.add('d-none'); }

// ── Effect E: Skeleton ───────────────────────────────
function showSkeleton() { document.getElementById('skeletonSection')?.classList.remove('d-none'); }
function hideSkeleton()  { document.getElementById('skeletonSection')?.classList.add('d-none'); }

// ── Effect I: Live Badge ─────────────────────────────
function setLiveBadge(state) {
    const badge = document.getElementById('liveBadge');
    if (!badge) return;
    if (state === 'live')      { badge.textContent = 'LIVE'; badge.className = 'live-badge show'; }
    else if (state === 'done') { badge.textContent = 'DONE'; badge.className = 'live-badge show done'; setTimeout(() => badge.classList.remove('show'), 3000); }
    else                       { badge.className = 'live-badge'; }
}

// ── Effect 8: Stat Pills ─────────────────────────────
function showStatPills(results) {
    const section = document.getElementById('statPillsSection');
    if (!section) return;
    const isFake  = results.is_fake === 1;
    const confPct = Math.round(results.confidence * 100);
    const mlPct   = results.ml_confidence != null ? Math.round(results.ml_confidence * 100) : null;
    section.innerHTML = `<div class="stat-pills">
        <div class="stat-pill"><span class="stat-pill-num ${isFake?'red':'green'}">${confPct}%</span><span class="stat-pill-lbl">Confidence</span></div>
        ${mlPct!=null?`<div class="stat-pill"><span class="stat-pill-num ${isFake?'red':'green'}">${mlPct}%</span><span class="stat-pill-lbl">ML Score</span></div>`:''}
        <div class="stat-pill"><span class="stat-pill-num blue">3</span><span class="stat-pill-lbl">Branches</span></div>
    </div>`;
    section.classList.remove('d-none');
}

// ── Initialization ───────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    analyzeBtn.addEventListener('click', analyzeImage);
    imageInput.addEventListener('change', e => { if (e.target.files.length > 0) processFile(e.target.files[0]); });
    dropZone.addEventListener('click', () => imageInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', e => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('dragover'); if(e.dataTransfer.files.length>0) processFile(e.dataTransfer.files[0]); });
    imagePreview.addEventListener('click', () => imageInput.click());
    document.getElementById('chartModal').addEventListener('show.bs.modal', function () { if (lastResults) renderCharts(lastResults); });
});

// ── File Handling ────────────────────────────────────
function processFile(file) {
    if (!file.type.startsWith('image/')) { showAlert('Please select a valid image file','error'); return; }
    if (file.size > 50*1024*1024) { showAlert('File too large. Max 50MB','error'); return; }
    selectedFile = file;
    document.getElementById('fileInfo').classList.remove('d-none');
    document.getElementById('fileName').textContent = `📁 ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.createElement('img'); img.src = e.target.result;
        imagePreview.innerHTML = ''; imagePreview.appendChild(img); hideHeatmap();
    };
    reader.readAsDataURL(file);
    dropZone.classList.add('has-file');
    analyzeBtn.disabled = false;
    resetResults();
}

// ── Image Analysis ───────────────────────────────────
async function analyzeImage() {
    if (!selectedFile || isAnalyzing) return;
    isAnalyzing = true;

    resultContainer.classList.add('d-none');
    confidenceSection.classList.add('d-none');
    branchSection.classList.add('d-none');
    ['chartBtnSection','descriptionSection','statPillsSection'].forEach(id => document.getElementById(id)?.classList.add('d-none'));
    analyzeBtn.disabled = true;
    hideHeatmap();

    loadingSpinner.classList.remove('d-none');
    showSkeleton();
    showSteps();
    startScanEffect();
    startTypewriter();
    setCardGlow('analyzing');
    setLiveBadge('live');

    setStep(0);
    const t1 = setTimeout(() => setStep(1), 700);
    const t2 = setTimeout(() => setStep(2), 1800);

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const response = await fetch('/api/predict', { method: 'POST', body: formData });
        if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Analysis failed'); }
        const results = await response.json();

        await new Promise(r => setTimeout(r, 400));
        setStep(3);
        await new Promise(r => setTimeout(r, 300));

        lastResults = results;
        displayResults(results);
    } catch (error) {
        clearTimeout(t1); clearTimeout(t2);
        showAlert(`Error: ${error.message}`, 'error');
        showToast('Analysis failed', 'red');
        setCardGlow(''); setLiveBadge(''); hideSteps(); hideSkeleton();
        loadingSpinner.classList.add('d-none');
        resultContainer.classList.remove('d-none');
        resultContainer.innerHTML = `<div style="text-align:center;color:#e74c3c;">
            <i class="fas fa-exclamation-circle" style="font-size:2.5rem;margin-bottom:0.8rem;display:block;"></i>
            <p style="font-size:1rem;font-weight:600;">Analysis Failed</p><small>${error.message}</small></div>`;
    } finally {
        stopScanEffect(); stopTypewriter(); isAnalyzing = false; analyzeBtn.disabled = false;
    }
}

// ── Display Results ──────────────────────────────────
function displayResults(results) {
    loadingSpinner.classList.add('d-none');
    hideSkeleton(); hideSteps();
    const isFake = results.is_fake === 1, confidence = results.confidence;
    setCardGlow(isFake ? 'fake' : 'real');
    setLiveBadge('done');
    showHeatmap(isFake);
    showToast(isFake ? '🚨 AI-Generated image detected' : '✅ Image appears authentic', isFake ? 'red' : 'green');
    displayMainResult(isFake, confidence);
    displayConfidenceBar(isFake, confidence);
    showStatPills(results);
    displayBranchAnalysis(results);
    displayDescription(results);
    const hasChart = results.nn_confidence!=null||results.ml_confidence!=null||results.branch_intensities!=null;
    if (hasChart) document.getElementById('chartBtnSection').classList.remove('d-none');
    resultContainer.classList.remove('d-none');
    resultContainer.classList.add(isFake ? 'result-fake' : 'result-real');
}

// ── Effect G: Flip Verdict ───────────────────────────
function displayMainResult(isFake, confidence) {
    const text = isFake ? '🚨 AI-GENERATED / MANIPULATED' : '✅ REAL IMAGE';
    const cls  = isFake ? 'fake' : 'real';
    resultContainer.innerHTML = `<div class="flip-verdict-scene">
        <div class="flip-verdict-card"><div class="flip-${isFake?'front':'back'}-v">${text}</div></div></div>`;
    setTimeout(() => {
        resultContainer.innerHTML = `<div style="animation:slideInDown 0.4s ease;"><div class="result-text ${cls}">${text}</div></div>`;
    }, 750);
}

// ── Confidence Bar ───────────────────────────────────
function displayConfidenceBar(isFake, confidence) {
    confidenceSection.classList.remove('d-none');
    const bar = document.getElementById('confidenceBar'), txt = document.getElementById('confidenceText');
    bar.className = 'confidence-bar ' + (confidence<0.5?'real':confidence<0.7?'uncertain':'fake');
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = (confidence*100)+'%'; }, 50);
    animateCounter(txt, Math.round(confidence*100));
}

// ── Branch Analysis ──────────────────────────────────
function displayBranchAnalysis(results) {
    const bi = results.branch_intensities;
    if (!bi || (bi.frequency===0&&bi.noise_residual===0&&bi.diffusion_aware===0)) { branchSection.classList.add('d-none'); return; }
    branchSection.classList.remove('d-none');
    const isFake = results.is_fake === 1;
    const branches = [
        {icon:'📡',label:'Frequency Domain', sub:'FFT · DCT · Wavelet',           score:bi.frequency},
        {icon:'🔍',label:'Noise Residual',    sub:'Laplacian · Gradient · NLM',    score:bi.noise_residual},
        {icon:'🌀',label:'Diffusion Aware',   sub:'Smoothness · Color · Artifacts', score:bi.diffusion_aware},
    ];
    // Color based on fake/real prediction: Green for real, Red/Orange for fake
    const barColor = isFake ? '#e74c3c' : '#27ae60';
    document.getElementById('branchDetails').innerHTML = branches.map(b => `
        <div class="branch-item">
            <div class="branch-name">${b.icon} ${b.label}<span class="branch-sub">${b.sub}</span></div>
            <div class="branch-result">
                <div class="branch-bar-wrap">
                    <div class="branch-bar-fill" data-width="${b.score.toFixed(1)}"
                         style="width:0%;height:10px;border-radius:5px;background:${barColor};transition:width 0.9s ease;"></div>
                </div>
                <span class="branch-confidence">${b.score.toFixed(1)}%</span>
            </div>
        </div>`).join('');
    requestAnimationFrame(() => {
        document.querySelectorAll('.branch-bar-fill').forEach(el => { el.style.width = (el.getAttribute('data-width')||'0')+'%'; });
    });
}

// ── Analysis Description ─────────────────────────────
function displayDescription(results) {
    const section=document.getElementById('descriptionSection'),content=document.getElementById('descriptionContent');
    if(!section||!content) return;
    const isFake=results.is_fake===1,conf=results.confidence,nnConf=results.nn_confidence,mlConf=results.ml_confidence,
          bi=results.branch_intensities||{},pct=(conf*100).toFixed(1),
          nnPct=nnConf!=null?(nnConf*100).toFixed(1):null,mlPct=mlConf!=null?(mlConf*100).toFixed(1):null;

    let vC,vT;
    if(conf>=0.75){vC=isFake?'verdict-fake':'verdict-real';vT=isFake?`High confidence AI-generated image (${pct}%)`:`High confidence authentic image (${pct}%)`;}
    else if(conf>=0.55){vC=isFake?'verdict-fake':'verdict-real';vT=isFake?`Likely AI-generated with moderate confidence (${pct}%)`:`Likely authentic with moderate confidence (${pct}%)`;}
    else{vC='verdict-uncertain';vT=`Uncertain — borderline result (${pct}%). Manual review recommended.`;}

    const ci=conf>=0.85?'Very strong signal — features strongly agree on this result.'
        :conf>=0.70?'Strong signal — majority of features agree with reasonable certainty.'
        :conf>=0.55?'Moderate signal — features lean toward result but not decisively.'
        :'Weak signal — mixed characteristics make classification difficult.';

    let ma;
    if(nnConf!=null&&mlConf!=null){const a=(nnConf>=0.55)===(mlConf>=0.55);ma=a?`Both Neural Network (${nnPct}%) and ML Classifier (${mlPct}%) agree.`:`Models disagree — ${nnConf>mlConf?`Neural Network (${nnPct}%)`:`ML Classifier (${mlPct}%)`} has stronger signal.`;}
    else if(nnConf!=null)ma=`Only Neural Network available (${nnPct}%).`;
    else if(mlConf!=null)ma=`Only ML Classifier available (${mlPct}%).`;
    else ma='No individual model outputs available.';

    const fs=bi.frequency||0,ns=bi.noise_residual||0,ds=bi.diffusion_aware||0,ms=Math.max(fs,ns,ds);
    let dom='frequency';if(ns===ms)dom='noise';if(ds===ms)dom='diffusion';
    let fr;
    if(isFake){fr=dom==='frequency'?`Frequency domain most anomalous (${fs.toFixed(1)}%). Unnatural FFT/DCT patterns detected.`
        :dom==='noise'?`Noise residual most anomalous (${ns.toFixed(1)}%). Inconsistent pixel noise indicates synthetic generation.`
        :`Diffusion-aware most anomalous (${ds.toFixed(1)}%). Unnatural smoothness suggests AI generation.`;}
    else{fr=ms<45?`All branches show low anomaly. Consistent with real photograph.`:`Dominant anomaly in ${dom} branch, but overall pattern consistent with authentic imagery.`;}

    const sg=conf>=0.75&&isFake?'Do not share as authentic. Use reverse image search to trace origin.'
        :conf>=0.55&&isFake?'Treat with caution. Verify source independently before sharing.'
        :conf<0.55?'Result inconclusive. Try higher resolution or additional verification tools.'
        :'Image appears authentic. Standard verification still applies for sensitive use.';

    const pt=(i,l,v)=>`<div class="desc-point"><span class="desc-icon">${i}</span><span class="desc-label">${l}</span><span class="desc-value">${v}</span></div>`;
    content.innerHTML=pt('🎯','Verdict',`<span class="${vC}">${vT}</span>`)+pt('📊','Confidence',ci)+pt('🤖','Models',ma)+pt('🔬','Features',fr)+pt('💡','Suggestion',sg);
    section.classList.remove('d-none');
}

// ── Charts ───────────────────────────────────────────
const chartInstances={};
function destroyChart(id){if(chartInstances[id]){chartInstances[id].destroy();delete chartInstances[id];}}

function renderCharts(results) {
    const v=document.getElementById('verdictChart'),b=document.getElementById('branchChart'),
          w=document.getElementById('weightsChart'),m=document.getElementById('modelChart');
    if(!v||!b||!w||!m)return;
    const isFake=results.is_fake===1,conf=results.confidence,
          nnConf=results.nn_confidence??null,mlConf=results.ml_confidence??null,bw=results.branch_weights??{};
    const RED='#e74c3c',GREEN='#2ecc71',GREY='#6b7280',LGREY='#d1d5db',BLUE='#3498db',ORANGE='#f39c12';

    destroyChart('verdictChart');
    chartInstances['verdictChart']=new Chart(v.getContext('2d'),{type:'doughnut',data:{labels:['Fake Probability','Real Probability'],datasets:[{data:[parseFloat((conf*100).toFixed(1)),parseFloat(((1-conf)*100).toFixed(1))],backgroundColor:[isFake?RED:ORANGE,GREEN],borderWidth:2,borderColor:'#fff'}]},options:{cutout:'65%',plugins:{legend:{position:'bottom',labels:{font:{size:11}}},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${ctx.parsed}%`}}}}});

    destroyChart('branchChart');
    const bi=results.branch_intensities||{},bv=[bi.frequency||0,bi.noise_residual||0,bi.diffusion_aware||0];
    const branchBarColor=isFake?RED:GREEN;
    chartInstances['branchChart']=new Chart(b.getContext('2d'),{type:'bar',data:{labels:['Frequency\nDomain','Noise\nResidual','Diffusion\nAware'],datasets:[{label:'Confidence (%)',data:bv,backgroundColor:branchBarColor,borderRadius:6,borderSkipped:false}]},options:{scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'},grid:{color:'#f0f0f0'}},x:{grid:{display:false}}},plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.parsed.y}%`}}}}});

    destroyChart('weightsChart');
    const wL=Object.keys(bw).map(k=>k.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())),wV=Object.values(bw).map(v=>parseFloat((v*100).toFixed(1)));
    chartInstances['weightsChart']=new Chart(w.getContext('2d'),{type:'doughnut',data:{labels:wL.length?wL:['No Data'],datasets:[{data:wV.length?wV:[100],backgroundColor:wL.length?[BLUE,ORANGE,GREY,'#9b59b6','#1abc9c'].slice(0,wL.length):[LGREY],borderWidth:2,borderColor:'#fff'}]},options:{cutout:'60%',plugins:{legend:{position:'bottom',labels:{font:{size:11}}},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${ctx.parsed}%`}}}}});

    destroyChart('modelChart');
    const mcL=[],mcF=[],mcR=[];
    if(nnConf!==null){mcL.push('Neural Network');mcF.push(parseFloat((nnConf*100).toFixed(1)));mcR.push(parseFloat(((1-nnConf)*100).toFixed(1)));}
    if(mlConf!==null){mcL.push('ML Classifier');mcF.push(parseFloat((mlConf*100).toFixed(1)));mcR.push(parseFloat(((1-mlConf)*100).toFixed(1)));}
    chartInstances['modelChart']=new Chart(m.getContext('2d'),{type:'bar',data:{labels:mcL.length?mcL:['No Data'],datasets:[{label:'Fake %',data:mcF.length?mcF:[0],backgroundColor:RED,borderRadius:4,borderSkipped:false},{label:'Real %',data:mcR.length?mcR:[0],backgroundColor:GREEN,borderRadius:4,borderSkipped:false}]},options:{indexAxis:'y',scales:{x:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'},grid:{color:'#f0f0f0'}},y:{grid:{display:false}}},plugins:{legend:{position:'bottom',labels:{font:{size:11}}},tooltip:{callbacks:{label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.x}%`}}}}});
}

// ── Reset ────────────────────────────────────────────
function resetResults() {
    resultContainer.classList.remove('result-real','result-fake');
    ['confidenceSection','branchSection','chartBtnSection','descriptionSection','statPillsSection'].forEach(id=>document.getElementById(id)?.classList.add('d-none'));
    loadingSpinner.classList.add('d-none');
    setCardGlow(''); hideSteps(); hideSkeleton(); hideHeatmap(); setLiveBadge('');
    lastResults = null;
}

// ── Utilities ────────────────────────────────────────
function showAlert(message, type='info') {
    const div=document.createElement('div');
    div.className=`alert alert-${type==='error'?'danger':type} alert-dismissible fade show`;
    div.setAttribute('role','alert');
    div.innerHTML=`${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.querySelector('.container-fluid').insertBefore(div,document.querySelector('.container-fluid').firstChild);
    setTimeout(()=>div.remove(),5000);
}

document.querySelectorAll('.btn-hover').forEach(btn=>{
    btn.addEventListener('click',function(e){
        const r=document.createElement('span'),rect=this.getBoundingClientRect();
        r.style.cssText=`left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px`;
        r.classList.add('ripple');this.appendChild(r);setTimeout(()=>r.remove(),600);
    });
});

const rs=document.createElement('style');
rs.textContent=`.btn-hover{position:relative;overflow:hidden;}.ripple{position:absolute;width:20px;height:20px;background:rgba(255,255,255,0.6);border-radius:50%;transform:scale(0);animation:rippleAnim 0.6s ease-out;pointer-events:none;}@keyframes rippleAnim{to{transform:scale(4);opacity:0;}}`;
document.head.appendChild(rs);

window.addEventListener('error',e=>console.error('Error:',e.error));
window.addEventListener('unhandledrejection',e=>console.error('Unhandled:',e.reason));