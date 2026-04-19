// app.js - UI wiring for the math worksheets
(function(){
  const homeEl = document.getElementById('home');
  const questionEl = document.getElementById('question');
  const problemEl = document.getElementById('problem');
  const answerInput = document.getElementById('answer-input');
  const answerLabel = document.getElementById('answer-label');
  const answerForm = document.getElementById('answer-form');
  const feedbackEl = document.getElementById('feedback');
  const solutionEl = document.getElementById('solution');
  const showSolutionBtn = document.getElementById('show-solution-btn');
  const checkBtn = document.getElementById('check-btn');
  const nextBtn = document.getElementById('next-btn');
  const readBtn = document.getElementById('read-btn');
  const backToGradeSelectBtn = document.getElementById('back-to-grade-select-btn');
  const backToCurrentGradeBtn = document.getElementById('back-to-current-grade-btn');
  const BASE_TITLE = 'K-5 Math Practice | Free Online Elementary Math Worksheets';
  const BASE_DESCRIPTION = 'Free K-5 math practice with instant feedback. Kindergarten, Grade 1, Grade 4, and Grade 5 topics including addition, subtraction, fractions, decimals, multiplication, and division.';
  let routeInitialized = false;
  let selectedGrade = null;
  // Submission/session state
  let correctCount = 0;
  let sessionToken = null;
  let sessionQuestionCount = 0;
  const globalLeaderboardStatusEl = document.getElementById('global-leaderboard-status');
  const globalLeaderboardListEl = document.getElementById('global-leaderboard-list');


  function updateNavGradeIcon(){
    const gradeBtn = document.getElementById('back-to-current-grade-btn');
    if(!gradeBtn) return;
    const letter = gradeBtn.querySelector('.grade-letter');
    const text = gradeBtn.querySelector('.grade-text');
    if(!letter || !text) return;
    letter.classList.remove('grade-k','grade-1','grade-4','grade-5','grade-none');
    if(!selectedGrade){
      letter.classList.add('grade-none');
      letter.textContent = '';
      text.textContent = 'Back';
      gradeBtn.setAttribute('aria-label','No grade selected');
      return;
    }
    if(selectedGrade === 'k'){
      letter.classList.add('grade-k');
      letter.textContent = 'K';
      text.textContent = 'Back to K';
      gradeBtn.setAttribute('aria-label','Back to Kindergarten');
    } else if(selectedGrade === '1'){
      letter.classList.add('grade-1');
      letter.textContent = '1';
      text.textContent = 'Back to 1';
      gradeBtn.setAttribute('aria-label','Back to Grade 1');
    } else if(selectedGrade === '4'){
      letter.classList.add('grade-4');
      letter.textContent = '4';
      text.textContent = 'Back to 4';
      gradeBtn.setAttribute('aria-label','Back to Grade 4');
    } else if(selectedGrade === '5'){
      letter.classList.add('grade-5');
      letter.textContent = '5';
      text.textContent = 'Back to 5';
      gradeBtn.setAttribute('aria-label','Back to Grade 5');
    }
  }

  function inferGradeFromTopic(topic){
    if(!topic) return null;
    const btn = document.querySelector(`.topic-btn[data-topic="${topic}"]`);
    if(!btn) return null;
    const root = btn.closest('#topics-grade4, #topics-grade1, #topics-kindergarten, #subsections-adding-decimals, #subsections-subtracting-decimals, #subsections-multiply-decimals-powers, #subsections-multiply-decimals-whole, #subsections-multiply-decimals-decimals, #subsections-multiply-columns, #subsections-addition-advanced, #subsections-subtraction-advanced, #subsections-word-problems-g5');
    if(!root) return null;
    const id = root.id;
    if(id === 'topics-grade4') return '4';
    if(id === 'topics-grade1') return '1';
    if(id === 'topics-kindergarten') return 'k';
    if(id.startsWith('subsections-')) return '5';
    return null;
  }

  function buildSeoContent(grade, topic){
    const topicBtn = topic ? document.querySelector(`.topic-btn[data-topic="${topic}"]`) : null;
    const topicLabel = topicBtn ? topicBtn.textContent.replace(/\s+/g, ' ').trim() : null;
    const gradeLabelMap = { k: 'Kindergarten', '1': 'Grade 1', '4': 'Grade 4', '5': 'Grade 5' };
    const gradeLabel = grade ? gradeLabelMap[grade] : null;

    if(gradeLabel && topicLabel){
      return {
        title: `${gradeLabel} ${topicLabel} Practice | K-5 Math`,
        description: `Practice ${topicLabel.toLowerCase()} for ${gradeLabel.toLowerCase()} with instant feedback and generated problems.`
      };
    }
    if(gradeLabel){
      return {
        title: `${gradeLabel} Math Practice | K-5 Math`,
        description: `Free ${gradeLabel.toLowerCase()} math practice with interactive topics and instant answer checking.`
      };
    }
    return {
      title: BASE_TITLE,
      description: BASE_DESCRIPTION
    };
  }

  function upsertMeta(name, content, isProperty){
    const attr = isProperty ? 'property' : 'name';
    let tag = document.querySelector(`meta[${attr}="${name}"]`);
    if(!tag){
      tag = document.createElement('meta');
      tag.setAttribute(attr, name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  }

  function updateSeoState(grade, topic){
    const seo = buildSeoContent(grade, topic);
    document.title = seo.title;
    upsertMeta('description', seo.description, false);
    upsertMeta('og:title', seo.title, true);
    upsertMeta('og:description', seo.description, true);
    upsertMeta('twitter:title', seo.title, false);
    upsertMeta('twitter:description', seo.description, false);

    const url = new URL(window.location.href);
    let canonical = document.querySelector('link[rel="canonical"]');
    if(!canonical){
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url.toString());

    upsertMeta('og:url', url.toString(), true);
  }

  function updateRoute(grade, topic, replace){
    const url = new URL(window.location.href);
    if(grade) url.searchParams.set('grade', grade);
    else url.searchParams.delete('grade');
    if(topic) url.searchParams.set('topic', topic);
    else url.searchParams.delete('topic');

    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if(next !== current){
      if(replace) window.history.replaceState({}, '', next);
      else window.history.pushState({}, '', next);
    }
    updateSeoState(grade, topic);
  }
  const mixedControls = document.getElementById('mixed-controls');
  const level1Btn = document.getElementById('level-1-btn');
  const level2Btn = document.getElementById('level-2-btn');

  // Grade selection elements
  const gradeSelectEl    = document.getElementById('grade-select');
  const topicsGrade4El   = document.getElementById('topics-grade4');
  const topicsGrade1El   = document.getElementById('topics-grade1');
  const topicsKEl        = document.getElementById('topics-kindergarten');
  const topicsGrade5El   = document.getElementById('topics-grade5');

  // Timer elements
  const timerBar     = document.getElementById('timer-bar');
  const timerDisplay = document.getElementById('timer-display');
  let timerInterval  = null;
  let timerSeconds   = 0;

  // ── Score ───────────────────────────────────────────────────────────────────
  const scoreValueEl = document.getElementById('score-value');
  let score = 0;

  function updateScore(delta){
    score += delta;
    if(scoreValueEl) scoreValueEl.textContent = score;
    // Track number of correct answers (10 points == 1 correct)
    if (typeof correctCount !== 'undefined' && delta === 10) correctCount += 1;
  }

  function showFloatingPoints(){
    const badge = document.getElementById('score-badge');
    if(!badge) return;
    const rect = badge.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'float-points';
    el.textContent = '+10';
    el.style.top  = (rect.top  + rect.height / 2) + 'px';
    el.style.left = (rect.left + rect.width  / 2 - 18) + 'px';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  // Show a small, temporary toast displaying the final score when the student finishes
  function showFinalScoreToast(message){
    const existing = document.getElementById('final-score-toast');
    if(existing) existing.remove();
    const badge = document.getElementById('score-badge');
    const rect = badge ? badge.getBoundingClientRect() : {left: window.innerWidth - 96, bottom: 16};
    const toast = document.createElement('div');
    toast.id = 'final-score-toast';
    toast.textContent = message;
    // Minimal inline styles so no CSS change required
    toast.style.position = 'fixed';
    toast.style.top = (rect.bottom + 8) + 'px';
    toast.style.left = (Math.max(8, rect.left)) + 'px';
    toast.style.background = 'rgba(11,37,64,0.95)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 8px 24px rgba(4,135,217,0.12)';
    toast.style.zIndex = 9999;
    toast.style.fontWeight = 700;
    toast.style.opacity = '0';
    document.body.appendChild(toast);
    // Force a transition
    requestAnimationFrame(()=>{ toast.style.transition = 'opacity 220ms ease-out, transform 220ms ease-out'; toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
    setTimeout(()=>{ toast.style.opacity = '0'; setTimeout(()=> toast.remove(), 300); }, 4000);
  }

  const countryNameFormatter = (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function')
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

  function getCountryLabel(code){
    const upper = String(code || '').toUpperCase();
    if (!upper) return 'Unknown';
    if (!countryNameFormatter) return upper;
    return countryNameFormatter.of(upper) || upper;
  }

  function setGlobalLeaderboardStatus(message){
    if (globalLeaderboardStatusEl) globalLeaderboardStatusEl.textContent = message;
  }

  function renderGlobalLeaderboard(items){
    if (!globalLeaderboardListEl) return;
    globalLeaderboardListEl.innerHTML = '';

    if (!items.length) {
      setGlobalLeaderboardStatus('No country scores yet. Be the first to set one.');
      return;
    }

    setGlobalLeaderboardStatus('Top score per country. USA reflects the highest single US submission (not a sum of states).');

    const maxItems = 50;
    items.slice(0, maxItems).forEach((entry, index) => {
      const li = document.createElement('li');
      li.className = 'global-leaderboard-item';
      li.innerHTML = `
        <span class="global-rank">#${index + 1}</span>
        <span class="global-country">
          <span class="global-country-name">${escapeHtml(getCountryLabel(entry.country))}</span>
          <span class="global-country-code">${escapeHtml(String(entry.country || '').toUpperCase())}</span>
        </span>
        <span class="global-score">${Number(entry.score)}</span>
      `;
      globalLeaderboardListEl.appendChild(li);
    });
  }

  async function loadGlobalLeaderboard(){
    if (!globalLeaderboardListEl) return;
    setGlobalLeaderboardStatus('Loading global leaderboard...');
    try {
      const res = await fetch('/api/country-scores');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = Array.isArray(json && json.items)
        ? json.items.filter((item) => item && typeof item.country === 'string' && Number.isFinite(Number(item.score)))
        : [];
      renderGlobalLeaderboard(items);
    } catch (err) {
      console.error('[ERROR] Failed to load global leaderboard:', err);
      if (globalLeaderboardListEl) globalLeaderboardListEl.innerHTML = '';
      setGlobalLeaderboardStatus('Global leaderboard is temporarily unavailable.');
    }
  }

  const CELEBRATE  = ['🎉 Amazing! Well done!','🎊 Fantastic! Keep it up!','🎈 You got it! Brilliant!','🎆 Correct! You\'re on fire!','🌟 Superstar! Great job!','🏆 Nailed it! Excellent!','✨ Awesome work!'];
  const ENCOURAGE  = ['👍 Good try — give it another go!','😊 Not quite — you can do it!','💪 Keep going, try again!','😄 Almost there — have another shot!','🙂 Don\'t give up — try once more!'];

  function startTimer(){
    stopTimer();
    timerSeconds = 0;
    updateTimerDisplay();
    if(timerBar) timerBar.classList.remove('hidden');
    timerInterval = setInterval(()=>{ timerSeconds++; updateTimerDisplay(); }, 1000);
  }
  function stopTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval = null; } }
  function updateTimerDisplay(){
    if(!timerDisplay) return;
    const m = Math.floor(timerSeconds/60);
    const s = timerSeconds % 60;
    timerDisplay.textContent = `${m}:${s.toString().padStart(2,'0')}`;
  }

  // Session helpers — token and submit
  async function startSession(desiredCount = 10, topic = null){
    try{
      console.log('[DEBUG] Starting session with count:', desiredCount, 'topic:', topic);
      let url = `/api/start-quiz?count=${encodeURIComponent(desiredCount)}`;
      if(topic) url += `&topic=${encodeURIComponent(topic)}`;
      const res = await fetch(url);
      console.log('[DEBUG] start-quiz response status:', res.status);
      if(!res.ok) {
        console.error('[ERROR] Failed to start session:', res.status, res.statusText);
        return null;
      }
      const data = await res.json();
      console.log('[DEBUG] start-quiz response data:', data);
      if(data && data.token){ 
        sessionToken = data.token; 
        sessionQuestionCount = data.questionCount || desiredCount; 
        console.log('[SUCCESS] Obtained session token', {questionCount: sessionQuestionCount}); 
      } else {
        console.error('[ERROR] No token in response:', data);
      }
      return data;
    }catch(e){ 
      console.error('[ERROR] startSession exception:', e); 
      return null; 
    }
  }

  async function submitFinalScore(){
    try{
      console.log('[DEBUG] submitFinalScore called with:', {sessionToken: sessionToken ? 'present' : 'missing', correctCount, totalScore: score});
      if(!sessionToken){ 
        console.warn('[WARNING] No session token; skipping submit'); 
        // Toast disabled - students don't need to see technical errors
        // showFinalScoreToast('⚠️ Score not submitted (no session token)');
        return null; 
      }
      // Submit the actual score (total points), not just correctCount
      const body = { token: sessionToken, score: score };
      console.log('[DEBUG] Submitting score:', body);
      const res = await fetch('/api/submit-score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      console.log('[DEBUG] submit-score response status:', res.status);
      let json = null;
      try{ json = await res.json(); } catch(e){ console.error('[ERROR] Failed to parse submit response:', e); }
      console.log('[DEBUG] submit-score response data:', json);
      
      if(res.ok){ 
        console.log('[SUCCESS] Score submitted successfully:', json);
        if(json && json.stateResult && json.stateResult.state && json.stateResult.updated) {
          console.log(`[SUCCESS] State ${json.stateResult.state} score updated from ${json.stateResult.previousScore} to ${json.stateResult.newScore}`);
        } else if(json && json.countryResult && json.countryResult.country && json.countryResult.updated) {
          console.log(`[SUCCESS] Country ${json.countryResult.country} score updated from ${json.countryResult.previousScore} to ${json.countryResult.newScore}`);
        } else if(json && json.updated) {
          console.log(`[SUCCESS] State ${json.state} score updated from ${json.previousScore} to ${json.newScore}`);
        } else if(json && json.updated === false) {
          console.log(`[INFO] State ${json.state} score NOT updated (existing: ${json.previousScore}, new: ${json.newScore})`);
        }
        await loadGlobalLeaderboard();
      } else { 
        console.error('[ERROR] Submit failed:', res.status, json); 
        const errorMsg = json && json.error ? json.error : 'Unknown error';
        // Only show toast for actual errors (not normal operation)
        // showFinalScoreToast(`❌ Submit failed: ${errorMsg}`);
      }
      // Reset session state after attempting submit
      sessionToken = null; sessionQuestionCount = 0; correctCount = 0;
      return json;
    } catch(e){ 
      console.error('[ERROR] submitFinalScore exception:', e); 
      // Toast disabled - students don't need to see technical errors
      // showFinalScoreToast('❌ Error submitting score');
      return null; 
    }
  }

  // ── Grade navigation ────────────────────────────────────────────────────────
  // Grade 5 subsection elements
  const subsectionsAddingDecimals = document.getElementById('subsections-adding-decimals');
  const subsectionsSubtractingDecimals = document.getElementById('subsections-subtracting-decimals');
  const subsectionsMultiplyPowers = document.getElementById('subsections-multiply-decimals-powers');
  const subsectionsMultiplyWhole = document.getElementById('subsections-multiply-decimals-whole');
  const subsectionsMultiplyDecimals = document.getElementById('subsections-multiply-decimals-decimals');
  const subsectionsMultiplyColumns = document.getElementById('subsections-multiply-columns');
  const subsectionsAdditionAdv = document.getElementById('subsections-addition-advanced');
  const subsectionsSubtractionAdv = document.getElementById('subsections-subtraction-advanced');
  const subsectionsWordProblems = document.getElementById('subsections-word-problems-g5');

  function hideAllSubsections(){
    [subsectionsAddingDecimals, subsectionsSubtractingDecimals, subsectionsMultiplyPowers,
     subsectionsMultiplyWhole, subsectionsMultiplyDecimals, subsectionsMultiplyColumns,
     subsectionsAdditionAdv, subsectionsSubtractionAdv, subsectionsWordProblems].forEach(el => {
      if(el) el.classList.add('hidden');
    });
  }

  function showGradeSelect(){
    gradeSelectEl.classList.remove('hidden');
    topicsGrade4El.classList.add('hidden');
    topicsGrade1El.classList.add('hidden');
    if(topicsKEl) topicsKEl.classList.add('hidden');
    if(topicsGrade5El) topicsGrade5El.classList.add('hidden');
    hideAllSubsections();
  }
  function showTopics(el){
    gradeSelectEl.classList.add('hidden');
    topicsGrade4El.classList.add('hidden');
    topicsGrade1El.classList.add('hidden');
    if(topicsKEl) topicsKEl.classList.add('hidden');
    if(topicsGrade5El) topicsGrade5El.classList.add('hidden');
    hideAllSubsections();
    el.classList.remove('hidden');
  }

  function showSubsection(el){
    if(topicsGrade5El) topicsGrade5El.classList.add('hidden');
    hideAllSubsections();
    el.classList.remove('hidden');
  }

  document.getElementById('grade-4-btn').addEventListener('click', ()=>{ selectedGrade = '4'; updateNavGradeIcon(); showTopics(topicsGrade4El); updateRoute('4', null, false); });
  document.getElementById('grade-1-btn').addEventListener('click', ()=>{ selectedGrade = '1'; updateNavGradeIcon(); showTopics(topicsGrade1El); updateRoute('1', null, false); });
  if(document.getElementById('grade-k-btn'))
    document.getElementById('grade-k-btn').addEventListener('click', ()=>{ selectedGrade = 'k'; updateNavGradeIcon(); showTopics(topicsKEl); updateRoute('k', null, false); });
  if(document.getElementById('grade-5-btn'))
    document.getElementById('grade-5-btn').addEventListener('click', ()=>{ selectedGrade = '5'; updateNavGradeIcon(); showTopics(topicsGrade5El); updateRoute('5', null, false); });

  document.getElementById('back-to-select').addEventListener('click', showGradeSelect);
  document.getElementById('back-to-select-1').addEventListener('click', showGradeSelect);
  if(document.getElementById('back-to-select-k'))
    document.getElementById('back-to-select-k').addEventListener('click', showGradeSelect);
  if(document.getElementById('back-to-select-5'))
    document.getElementById('back-to-select-5').addEventListener('click', showGradeSelect);

  // Grade 5 section buttons
  document.querySelectorAll('.section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      switch(section){
        case 'adding-decimals': showSubsection(subsectionsAddingDecimals); break;
        case 'subtracting-decimals': showSubsection(subsectionsSubtractingDecimals); break;
        case 'multiply-decimals-powers': showSubsection(subsectionsMultiplyPowers); break;
        case 'multiply-decimals-whole': showSubsection(subsectionsMultiplyWhole); break;
        case 'multiply-decimals-decimals': showSubsection(subsectionsMultiplyDecimals); break;
        case 'multiply-columns': showSubsection(subsectionsMultiplyColumns); break;
        case 'addition-advanced': showSubsection(subsectionsAdditionAdv); break;
        case 'subtraction-advanced': showSubsection(subsectionsSubtractionAdv); break;
        case 'word-problems-g5': showSubsection(subsectionsWordProblems); break;
      }
    });
  });

  // Grade 5 back buttons
  ['back-to-grade5-from-adding', 'back-to-grade5-from-subtracting', 'back-to-grade5-from-powers',
   'back-to-grade5-from-whole', 'back-to-grade5-from-decimals', 'back-to-grade5-from-columns',
   'back-to-grade5-from-addition', 'back-to-grade5-from-subtraction', 'back-to-grade5-from-word'].forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', () => showTopics(topicsGrade5El));
  });

  // ── Mixed-fractions level toggle ────────────────────────────────────────────
  function getMixedLevel(){ const a = document.querySelector('.level-btn[aria-pressed="true"]'); return a ? Number(a.dataset.level) : 1; }
  function setActiveLevel(level){
    if(!level1Btn || !level2Btn) return;
    level1Btn.setAttribute('aria-pressed', level===1 ? 'true' : 'false');
    level2Btn.setAttribute('aria-pressed', level===2 ? 'true' : 'false');
  }
  if(level1Btn && level2Btn){
    level1Btn.addEventListener('click', ()=>{ 
      setActiveLevel(1); 
      if(currentProblem && currentProblem.type==='mixed-fractions'){ 
        currentProblem = window.MathGen.generateProblem('mixed-fractions', 1); 
        currentProblem.level = 1; 
        renderProblem(currentProblem); 
      } else if(currentProblem && currentProblem.type==='word-problems-g1'){
        currentProblem = window.MathGen.generateProblem('word-problems-g1', 1);
        currentProblem.level = 1;
        renderProblem(currentProblem);
      } else if(currentProblem && currentProblem.type==='subtraction-word-problems-g1'){
        currentProblem = window.MathGen.generateProblem('subtraction-word-problems-g1', 1);
        currentProblem.level = 1;
        renderProblem(currentProblem);
      }
    });
    level2Btn.addEventListener('click', ()=>{ 
      setActiveLevel(2); 
      if(currentProblem && currentProblem.type==='mixed-fractions'){ 
        currentProblem = window.MathGen.generateProblem('mixed-fractions', 2); 
        currentProblem.level = 2; 
        renderProblem(currentProblem); 
      } else if(currentProblem && currentProblem.type==='word-problems-g1'){
        currentProblem = window.MathGen.generateProblem('word-problems-g1', 2);
        currentProblem.level = 2;
        renderProblem(currentProblem);
      } else if(currentProblem && currentProblem.type==='subtraction-word-problems-g1'){
        currentProblem = window.MathGen.generateProblem('subtraction-word-problems-g1', 2);
        currentProblem.level = 2;
        renderProblem(currentProblem);
      }
    });
  }

  let currentProblem = null;

  function showHome(){
    homeEl.classList.remove('hidden');
    questionEl.classList.add('hidden');
    stopTimer();
    if(timerBar) timerBar.classList.add('hidden');
    showGradeSelect();
    updateRoute(null, null, false);
  }
  function showQuestion(){ homeEl.classList.add('hidden'); questionEl.classList.remove('hidden'); }

  document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => startTopic(btn.dataset.topic, { updateUrl: true }));
  });

  function goToGradeTopics(code){
    stopTimer();
    if(timerBar) timerBar.classList.add('hidden');
    homeEl.classList.remove('hidden');
    questionEl.classList.add('hidden');
    switch(code){
      case '4': showTopics(topicsGrade4El); break;
      case '1': showTopics(topicsGrade1El); break;
      case 'k': showTopics(topicsKEl); break;
      case '5': showTopics(topicsGrade5El); break;
      default: showGradeSelect();
    }
  }
  if(backToGradeSelectBtn) backToGradeSelectBtn.addEventListener('click', async () => {
    console.log('[DEBUG] Back to grade select clicked, final score:', score, 'correct count:', correctCount);
    const finalMsg = `Final score: ${score}`;
    // Submit score (best effort)
    await submitFinalScore();
    showHome();
    clearState();
    // Don't show final score toast here - submitFinalScore now shows detailed feedback
  });
  if(backToCurrentGradeBtn) backToCurrentGradeBtn.addEventListener('click', async () => {
    console.log('[DEBUG] Back to current grade clicked, final score:', score, 'correct count:', correctCount);
    const finalMsg = `Final score: ${score}`;
    // Submit score (best effort)
    await submitFinalScore();
    if(selectedGrade){ goToGradeTopics(selectedGrade); } else { showHome(); }
    clearState();
    // Don't show final score toast here - submitFinalScore now shows detailed feedback
  });

  function startTopic(topic, options){
    const opts = options || {};
    startTimer();
    if(!selectedGrade){
      selectedGrade = inferGradeFromTopic(topic);
      updateNavGradeIcon();
    }
    if(opts.updateUrl){
      updateRoute(selectedGrade, topic, false);
    } else {
      updateSeoState(selectedGrade, topic);
    }
    // initialize server session token for submits (best-effort, non-blocking)
    console.log('[DEBUG] Starting topic:', topic);
    startSession(10, topic).catch((e)=>{
      console.error('[ERROR] Failed to start session:', e);
    });
    if(topic === 'mixed-fractions'){
      const level = getMixedLevel ? getMixedLevel() : 1;
      currentProblem = window.MathGen.generateProblem('mixed-fractions', level);
      currentProblem.level = level;
    } else if(topic === 'word-problems-g1'){
      const level = getMixedLevel ? getMixedLevel() : 1;
      currentProblem = window.MathGen.generateProblem('word-problems-g1', level);
      currentProblem.level = level;
    } else if(topic === 'subtraction-word-problems-g1'){
      const level = getMixedLevel ? getMixedLevel() : 1;
      currentProblem = window.MathGen.generateProblem('subtraction-word-problems-g1', level);
      currentProblem.level = level;
    } else {
      currentProblem = window.MathGen.generateProblem(topic);
    }
    renderProblem(currentProblem);
    updateNavGradeIcon();
    showQuestion();
  }

  function renderProblem(problem){
    problem.nextClickCount = 0;
    problem.answeredCorrectly = false;
    solutionEl.classList.add('hidden');
    showSolutionBtn.classList.add('hidden');
    if(checkBtn) checkBtn.disabled = false;
    if(answerInput){ answerInput.disabled = false; answerInput.readOnly = false; }
    // Default: ensure answer label/input and check button are visible (sight-words will hide them)
    if(answerLabel) answerLabel.classList.remove('hidden');
    if(answerInput){ answerInput.classList.remove('hidden'); answerInput.setAttribute('required',''); }
    if(checkBtn) checkBtn.classList.remove('hidden');
    if(readBtn) readBtn.classList.add('hidden');
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    answerInput.value = '';
    // reset the per-question timer whenever a new problem is rendered
    startTimer();

    function fracHTML(n,d){ return `<span class="fraction" aria-hidden="true"><span class="num">${n}</span><span class="den">${d}</span></span>`; }
    function mixedHTML(w,n,d){ return `<span class="mixed" aria-hidden="true"><span class="whole">${w}</span> ${fracHTML(n,d)}</span>`; }

    // Handle word problems for Grade 5 (multi-step)
    if(problem.type === 'word-problems-g5'){
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      const currentQ = problem.questions[problem.currentQuestion];
      const progress = `<div class="word-problem-progress">Question ${currentQ.questionNumber} of ${problem.questions.length}</div>`;
      const context = problem.currentQuestion === 0 ? `<div style="font-size:1rem;line-height:1.6;text-align:left;padding:8px 0;margin-bottom:12px;border-bottom:2px solid rgba(4,135,217,0.1);">${escapeHtml(problem.context)}</div>` : '';
      problemEl.innerHTML = `${progress}${context}<div style="font-size:1.1rem;line-height:1.6;text-align:left;padding:8px 0;">${escapeHtml(currentQ.text)}</div>`;
      answerInput.setAttribute('inputmode', 'numeric');
      if(answerInput) answerInput.focus();
      return;
    }

    // Handle column display problems
    if(problem.displayType === 'column'){
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      let columnHTML = '';

      function formatDecimalColumns(nums){
        const parts = nums.map(num => {
          const str = String(num);
          const idx = str.indexOf('.');
          if(idx === -1) return { integer: str, decimal: '' };
          return { integer: str.slice(0, idx), decimal: str.slice(idx + 1) };
        });
        const maxIntLen = Math.max(...parts.map(p => p.integer.length));
        const maxDecLen = Math.max(...parts.map(p => p.decimal.length));
        return parts.map(p => {
          const intPart = p.integer.padStart(maxIntLen, ' ');
          const decPart = maxDecLen > 0 ? '.' + p.decimal.padEnd(maxDecLen, '0') : '';
          return `${intPart}${decPart}`;
        });
      }
      
       if(problem.type.includes('add') || problem.type.includes('adding')){
         const nums = problem.numbers || [problem.a, problem.b];
         const formatted = formatDecimalColumns(nums);
         columnHTML = '<div class="decimal-column">';
         formatted.forEach((numStr, idx) => {
           if(idx === formatted.length - 1){
             columnHTML += `<div class="operator-line">+ ${numStr}</div>`;
           } else if(idx === 0){
             columnHTML += `<div>  ${numStr}</div>`;
           } else {
             columnHTML += `<div>+ ${numStr}</div>`;
           }
         });
         columnHTML += '</div>';
       } else if(problem.type.includes('subtract')){
         const formatted = formatDecimalColumns([problem.a, problem.b]);
         columnHTML = `<div class="decimal-column"><div>  ${formatted[0]}</div><div class="operator-line">− ${formatted[1]}</div></div>`;
       } else if(problem.type.includes('multiply')){
         const formatted = formatDecimalColumns([problem.a, problem.b]);
         columnHTML = `<div class="decimal-column"><div>  ${formatted[0]}</div><div class="operator-line">× ${formatted[1]}</div></div>`;
       }
      
      problemEl.innerHTML = columnHTML;
      answerInput.setAttribute('inputmode', 'numeric');
      if(answerInput) answerInput.focus();
      return;
    }

    if(problem.type === 'mixed-fractions'){
      if(mixedControls){ mixedControls.classList.remove('hidden'); mixedControls.setAttribute('aria-hidden','false'); }
      setActiveLevel(problem.level ? Number(problem.level) : 1);
      // Update button labels for mixed fractions
      if(level1Btn) level1Btn.textContent = 'Level 1 — add 2 mixed fractions';
      if(level2Btn) level2Btn.textContent = 'Level 2 — add 3 mixed fractions';
      const rows = problem.operands.map((o,idx)=>{
        const sign = idx===0 ? '&nbsp;' : '+';
        return `<div class="row"><span class="op">${sign}</span><span class="mixed-wrap">${mixedHTML(o.whole,o.num,o.den)}</span></div>`;
      }).join('');
      problemEl.innerHTML = `<div class="stacked">${rows}</div>`;
      answerInput.setAttribute('inputmode', 'text');
    } else if(problem.type === 'word-problems-g1'){
      if(mixedControls){ mixedControls.classList.remove('hidden'); mixedControls.setAttribute('aria-hidden','false'); }
      setActiveLevel(problem.level ? Number(problem.level) : 1);
      // Update button labels for word problems
      if(level1Btn) level1Btn.textContent = 'Level 1 — adding to 10';
      if(level2Btn) level2Btn.textContent = 'Level 2 — adding to 20';
      problemEl.innerHTML = `<div style="font-size:1.15rem;line-height:1.6;text-align:left;padding:8px 0;">${escapeHtml(problem.question)}</div>`;
      answerInput.setAttribute('inputmode', 'numeric');
    } else if(problem.type === 'subtraction-word-problems-g1'){
      if(mixedControls){ mixedControls.classList.remove('hidden'); mixedControls.setAttribute('aria-hidden','false'); }
      setActiveLevel(problem.level ? Number(problem.level) : 1);
      // Update button labels for subtraction word problems
      if(level1Btn) level1Btn.textContent = 'Level 1 — subtracting to 10';
      if(level2Btn) level2Btn.textContent = 'Level 2 — subtracting to 20';
      problemEl.innerHTML = `<div style="font-size:1.15rem;line-height:1.6;text-align:left;padding:8px 0;">${escapeHtml(problem.question)}</div>`;
      answerInput.setAttribute('inputmode', 'numeric');
    } else if(problem.type === 'fractions'){
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      const a = problem.a, b = problem.b;
      const rows = `<div class="row"><span class="op">&nbsp;</span><span class="fraction-wrap">${fracHTML(a.num,a.den)}</span></div><div class="row"><span class="op">${problem.op}</span><span class="fraction-wrap">${fracHTML(b.num,b.den)}</span></div>`;
      problemEl.innerHTML = `<div class="stacked">${rows}</div>`;
      answerInput.setAttribute('inputmode', 'text');
    } else if(problem.type === 'counting-k'){
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      // Group items into blocks: use groups of 10 when count >= 10, otherwise groups of 5
      const groupSize = (problem.count >= 10) ? 10 : 5;
      const groups = [];
      let remaining = problem.count;
      while(remaining > 0){
        const take = Math.min(groupSize, remaining);
        groups.push(take);
        remaining -= take;
      }
      const groupHtml = groups.map((g,gi) => {
        const items = Array.from({length: g}, ()=>`<span class="counting-item" aria-hidden="true">${problem.emoji}</span>`).join('');
        return `<div class="counting-group" aria-hidden="true">${items}</div>`;
      }).join('');
      problemEl.innerHTML = `<div class="counting-display" aria-label="${problem.count} ${problem.emoji} shown">${groupHtml}</div><div class="counting-question">How many?</div>`;
      answerInput.setAttribute('inputmode', 'numeric');
    } else if(problem.type === 'sight-words'){
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      problemEl.innerHTML = `<div class="sight-word-label">Read this word aloud — then click "I read it!"</div><div class="sight-word-display">${escapeHtml(problem.word)}</div>`;
      if(readBtn) readBtn.classList.remove('hidden');
      // hide the "Your answer" input and label for sight words — honor system
      if(answerLabel) answerLabel.classList.add('hidden');
      if(answerInput){ answerInput.value = ''; answerInput.classList.add('hidden'); answerInput.removeAttribute('required'); }
      if(checkBtn) checkBtn.classList.add('hidden');
      // don't focus input when it's hidden
      answerInput.setAttribute('inputmode', 'text');
    } else if(['addition','subtraction','addition-g1','subtraction-g1','multiplication-g1','addition-k'].includes(problem.type)){
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      // Render vertical layout for basic arithmetic (easier for kids).
      const type = String(problem.type);
      const opSymbol = type.includes('subtraction') ? '−' : type.includes('multiplication') ? '×' : '+';
      const a = (typeof problem.a !== 'undefined') ? problem.a : (problem.a || '');
      const b = (typeof problem.b !== 'undefined') ? problem.b : (problem.b || '');
      const rows = `<div class="row"><span class="op">&nbsp;</span><span class="number-wrap">${a}</span></div><div class="row"><span class="op">${opSymbol}</span><span class="number-wrap">${b}</span></div>`;
      problemEl.innerHTML = `<div class="stacked">${rows}</div>`;
      answerInput.setAttribute('inputmode', 'numeric');
    } else {
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      problemEl.textContent = problem.question;
      answerInput.setAttribute('inputmode', 'numeric');
    }

    if(answerInput && !answerInput.classList.contains('hidden')) answerInput.focus();
  }

  answerForm.addEventListener('submit', (e) => { e.preventDefault(); handleCheck(); });

  function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function renderSolution(sol){
    solutionEl.innerHTML = '';
    if(!sol){ solutionEl.classList.add('hidden'); return; }
    if(Array.isArray(sol)){
      sol.forEach(s=>{
        const d = document.createElement('div');
        d.className = 'solution-step';
        d.style.textAlign = 'center';
        d.innerHTML = s;
        solutionEl.appendChild(d);
      });
    } else {
      const d = document.createElement('div'); d.className='solution-step'; d.style.textAlign='center'; d.innerHTML = escapeHtml(sol); solutionEl.appendChild(d);
    }
    solutionEl.classList.remove('hidden');
  }

  function handleCheck(){
    if(!currentProblem){ feedbackEl.textContent = 'No active question.'; feedbackEl.className='feedback'; return; }
    if(currentProblem.answeredCorrectly){ feedbackEl.textContent = 'Already answered correctly. Click Next for a new question.'; feedbackEl.className = 'feedback correct'; return; }

    const raw = answerInput.value.trim();
    if(!raw){ feedbackEl.textContent = 'Please enter an answer.'; feedbackEl.className='feedback'; return; }
    
    // For word problems, check against current question's answer
    if(currentProblem.type === 'word-problems-g5'){
      const currentQ = currentProblem.questions[currentProblem.currentQuestion];
      const givenAnswer = Number(raw);
      const correct = Math.abs(givenAnswer - currentQ.answer) < 0.01;
      
      if(correct){
        currentProblem.answeredCorrectly = true;
        if(checkBtn) checkBtn.disabled = true;
        if(answerInput) { answerInput.disabled = true; }
        updateScore(10);
        showFloatingPoints();
        feedbackEl.textContent = CELEBRATE[Math.floor(Math.random()*CELEBRATE.length)];
        feedbackEl.className='feedback correct';
        solutionEl.classList.add('hidden');
        if(showSolutionBtn) showSolutionBtn.classList.add('hidden');
      } else {
        const encourage = ENCOURAGE[Math.floor(Math.random()*ENCOURAGE.length)];
        feedbackEl.innerHTML = `${encourage}<br><small style="font-weight:400;opacity:0.85">The correct answer is ${currentQ.answer}${currentQ.equation ? '. Equation: ' + escapeHtml(currentQ.equation) : ''}</small>`;
        feedbackEl.className='feedback wrong';
        if(showSolutionBtn) showSolutionBtn.classList.remove('hidden');
      }
      return;
    }
    
    const result = window.Evaluator.checkAnswer(currentProblem, raw);
    if(!result.valid){ feedbackEl.textContent = result.message; feedbackEl.className='feedback'; return; }
    if(result.correct){
      // mark answered to prevent double-scoring
      currentProblem.answeredCorrectly = true;
      if(checkBtn) checkBtn.disabled = true;
      if(answerInput) { answerInput.disabled = true; }
      updateScore(10);
      showFloatingPoints();
      feedbackEl.textContent = CELEBRATE[Math.floor(Math.random()*CELEBRATE.length)];
      feedbackEl.className='feedback correct';
      solutionEl.classList.add('hidden');
      if(showSolutionBtn) showSolutionBtn.classList.add('hidden');
    } else {
      const hint = result.message.replace(/^Not quite[^—]*[❌]\s*/i,'');
      const encourage = ENCOURAGE[Math.floor(Math.random()*ENCOURAGE.length)];
      feedbackEl.innerHTML = `${encourage}<br><small style="font-weight:400;opacity:0.85">${escapeHtml(hint)}</small>`;
      feedbackEl.className='feedback wrong';
      if(result.solution){ renderSolution(result.solution); if(showSolutionBtn) showSolutionBtn.classList.remove('hidden'); }
    }
  }

  showSolutionBtn.addEventListener('click', () => {
    renderSolution(window.Evaluator.buildSolution(currentProblem));
    showSolutionBtn.classList.add('hidden');
  });

  if(readBtn) readBtn.addEventListener('click', () => {
    if(!currentProblem) return;
    const topic = currentProblem.type;
    const makeNew = (t) => {
      if(t === 'mixed-fractions'){
        const lvl = getMixedLevel ? getMixedLevel() : (currentProblem.level || 1);
        const p = window.MathGen.generateProblem(t, lvl); p.level = lvl; return p;
      }
      return window.MathGen.generateProblem(t);
    };
    if(topic === 'sight-words'){
      // Award points under the honor system and show positive feedback
      updateScore(10);
      showFloatingPoints();
      feedbackEl.textContent = CELEBRATE[Math.floor(Math.random()*CELEBRATE.length)];
      feedbackEl.className = 'feedback correct';
      solutionEl.classList.add('hidden'); if(showSolutionBtn) showSolutionBtn.classList.add('hidden');
      // advance to next sight word
      currentProblem = makeNew(topic); renderProblem(currentProblem); return;
    }
    currentProblem = makeNew(topic); renderProblem(currentProblem);
  });

  nextBtn.addEventListener('click', () => {
    if(!currentProblem) return;
    currentProblem.nextClickCount = currentProblem.nextClickCount || 0;
    const topic = currentProblem.type;
    const makeNew = (t) => {
      if(t === 'mixed-fractions'){
        const lvl = getMixedLevel ? getMixedLevel() : (currentProblem.level || 1);
        const p = window.MathGen.generateProblem(t, lvl); p.level = lvl; return p;
      } else if(t === 'word-problems-g1'){
        const lvl = getMixedLevel ? getMixedLevel() : (currentProblem.level || 1);
        const p = window.MathGen.generateProblem(t, lvl); p.level = lvl; return p;
      } else if(t === 'subtraction-word-problems-g1'){
        const lvl = getMixedLevel ? getMixedLevel() : (currentProblem.level || 1);
        const p = window.MathGen.generateProblem(t, lvl); p.level = lvl; return p;
      }
      return window.MathGen.generateProblem(t);
    };
    
    // For word problems G5, advance to next question or generate new problem
    if(topic === 'word-problems-g5'){
      if(currentProblem.answeredCorrectly && currentProblem.currentQuestion < currentProblem.questions.length - 1){
        currentProblem.currentQuestion++;
        currentProblem.answeredCorrectly = false;
        renderProblem(currentProblem);
        return;
      } else if(currentProblem.currentQuestion >= currentProblem.questions.length - 1){
        currentProblem = makeNew(topic); renderProblem(currentProblem); return;
      }
    }
    
    // For sight words, advance immediately on Next (honor system)
    if(topic === 'sight-words'){
      currentProblem = makeNew(topic); renderProblem(currentProblem); return;
    }
    const raw = answerInput.value.trim();
    if(raw === ''){
      currentProblem.nextClickCount += 1;
      if(currentProblem.nextClickCount >= 3){
        currentProblem = makeNew(topic); renderProblem(currentProblem);
      } else {
        feedbackEl.textContent = `Please enter an answer or click Check. Click Next again to skip (${currentProblem.nextClickCount}/3).`;
        feedbackEl.className = 'feedback';
      }
    } else {
      currentProblem = makeNew(topic); renderProblem(currentProblem);
    }
  });

  function clearState(){ currentProblem = null; feedbackEl.textContent = ''; solutionEl.textContent = ''; answerInput.value = ''; // reset session scoring state
    correctCount = 0; sessionToken = null; sessionQuestionCount = 0; }

  function applyRouteFromUrl(){
    const url = new URL(window.location.href);
    let grade = url.searchParams.get('grade');
    const topic = url.searchParams.get('topic');
    const validGrade = grade === 'k' || grade === '1' || grade === '4' || grade === '5';

    if(topic && !grade){
      grade = inferGradeFromTopic(topic);
    }

    if(topic){
      const topicBtn = document.querySelector(`.topic-btn[data-topic="${topic}"]`);
      if(topicBtn){
        const inferredGrade = grade || inferGradeFromTopic(topic);
        if(inferredGrade){
          selectedGrade = inferredGrade;
          updateNavGradeIcon();
          if(inferredGrade === '4') showTopics(topicsGrade4El);
          else if(inferredGrade === '1') showTopics(topicsGrade1El);
          else if(inferredGrade === 'k') showTopics(topicsKEl);
          else if(inferredGrade === '5') showTopics(topicsGrade5El);

          const subsectionRoot = topicBtn.closest('[id^="subsections-"]');
          if(subsectionRoot){
            showSubsection(subsectionRoot);
          }
          startTopic(topic, { updateUrl: false });
          return;
        }
      }
    }

    if(validGrade){
      selectedGrade = grade;
      updateNavGradeIcon();
      if(grade === '4') showTopics(topicsGrade4El);
      else if(grade === '1') showTopics(topicsGrade1El);
      else if(grade === 'k') showTopics(topicsKEl);
      else if(grade === '5') showTopics(topicsGrade5El);
      updateSeoState(grade, null);
      return;
    }

    selectedGrade = null;
    updateNavGradeIcon();
    showGradeSelect();
    updateSeoState(null, null);
  }

  window.addEventListener('popstate', applyRouteFromUrl);

  function initializeRouteOnce(){
    if(routeInitialized) return;
    routeInitialized = true;
    applyRouteFromUrl();
    loadGlobalLeaderboard();
  }

  document.addEventListener('DOMContentLoaded', initializeRouteOnce);

  // In case this script executes after DOMContentLoaded has already fired.
  if(document.readyState === 'interactive' || document.readyState === 'complete'){
    initializeRouteOnce();
  }
})();
