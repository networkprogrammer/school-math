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
  let selectedGrade = null;
  // Submission/session state
  let correctCount = 0;
  let sessionToken = null;
  let sessionQuestionCount = 0;


  function updateNavGradeIcon(){
    const gradeBtn = document.getElementById('back-to-current-grade-btn');
    if(!gradeBtn) return;
    const letter = gradeBtn.querySelector('.grade-letter');
    const text = gradeBtn.querySelector('.grade-text');
    if(!letter || !text) return;
    letter.classList.remove('grade-k','grade-1','grade-4','grade-none');
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
    } else {
      letter.classList.add('grade-4');
      letter.textContent = '4';
      text.textContent = 'Back to 4';
      gradeBtn.setAttribute('aria-label','Back to Grade 4');
    }
  }
  const mixedControls = document.getElementById('mixed-controls');
  const level1Btn = document.getElementById('level-1-btn');
  const level2Btn = document.getElementById('level-2-btn');

  // Grade selection elements
  const gradeSelectEl    = document.getElementById('grade-select');
  const topicsGrade4El   = document.getElementById('topics-grade4');
  const topicsGrade1El   = document.getElementById('topics-grade1');
  const topicsKEl        = document.getElementById('topics-kindergarten');

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
  async function startSession(desiredCount = 10){
    try{
      console.log('[DEBUG] Starting session with count:', desiredCount);
      const res = await fetch(`/api/start-quiz?count=${encodeURIComponent(desiredCount)}`);
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
        showFinalScoreToast('⚠️ Score not submitted (no session token)');
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
        if(json && json.updated) {
          console.log(`[SUCCESS] State ${json.state} score updated from ${json.previousScore} to ${json.newScore}`);
          showFinalScoreToast(`✅ Score submitted! ${json.state}: ${json.newScore} (prev: ${json.previousScore || 'none'})`);
        } else if(json && json.updated === false) {
          console.log(`[INFO] State ${json.state} score NOT updated (existing: ${json.previousScore}, new: ${json.newScore})`);
          showFinalScoreToast(`ℹ️ Score submitted but not higher than existing ${json.state} score (${json.previousScore})`);
        } else {
          showFinalScoreToast('✅ Score submitted successfully!');
        }
      } else { 
        console.error('[ERROR] Submit failed:', res.status, json); 
        const errorMsg = json && json.error ? json.error : 'Unknown error';
        showFinalScoreToast(`❌ Submit failed: ${errorMsg}`);
      }
      // Reset session state after attempting submit
      sessionToken = null; sessionQuestionCount = 0; correctCount = 0;
      return json;
    } catch(e){ 
      console.error('[ERROR] submitFinalScore exception:', e); 
      showFinalScoreToast('❌ Error submitting score');
      return null; 
    }
  }

  // ── Grade navigation ────────────────────────────────────────────────────────
  function showGradeSelect(){
    gradeSelectEl.classList.remove('hidden');
    topicsGrade4El.classList.add('hidden');
    topicsGrade1El.classList.add('hidden');
    if(topicsKEl) topicsKEl.classList.add('hidden');
  }
  function showTopics(el){
    gradeSelectEl.classList.add('hidden');
    topicsGrade4El.classList.add('hidden');
    topicsGrade1El.classList.add('hidden');
    if(topicsKEl) topicsKEl.classList.add('hidden');
    el.classList.remove('hidden');
  }

  document.getElementById('grade-4-btn').addEventListener('click', ()=>{ selectedGrade = '4'; updateNavGradeIcon(); showTopics(topicsGrade4El); });
  document.getElementById('grade-1-btn').addEventListener('click', ()=>{ selectedGrade = '1'; updateNavGradeIcon(); showTopics(topicsGrade1El); });
  if(document.getElementById('grade-k-btn'))
    document.getElementById('grade-k-btn').addEventListener('click', ()=>{ selectedGrade = 'k'; updateNavGradeIcon(); showTopics(topicsKEl); });

  document.getElementById('back-to-select').addEventListener('click', showGradeSelect);
  document.getElementById('back-to-select-1').addEventListener('click', showGradeSelect);
  if(document.getElementById('back-to-select-k'))
    document.getElementById('back-to-select-k').addEventListener('click', showGradeSelect);

  // ── Mixed-fractions level toggle ────────────────────────────────────────────
  function getMixedLevel(){ const a = document.querySelector('.level-btn[aria-pressed="true"]'); return a ? Number(a.dataset.level) : 1; }
  function setActiveLevel(level){
    if(!level1Btn || !level2Btn) return;
    level1Btn.setAttribute('aria-pressed', level===1 ? 'true' : 'false');
    level2Btn.setAttribute('aria-pressed', level===2 ? 'true' : 'false');
  }
  if(level1Btn && level2Btn){
    level1Btn.addEventListener('click', ()=>{ setActiveLevel(1); if(currentProblem && currentProblem.type==='mixed-fractions'){ currentProblem = window.MathGen.generateProblem('mixed-fractions', 1); currentProblem.level = 1; renderProblem(currentProblem); }});
    level2Btn.addEventListener('click', ()=>{ setActiveLevel(2); if(currentProblem && currentProblem.type==='mixed-fractions'){ currentProblem = window.MathGen.generateProblem('mixed-fractions', 2); currentProblem.level = 2; renderProblem(currentProblem); }});
  }

  let currentProblem = null;

  function showHome(){
    homeEl.classList.remove('hidden');
    questionEl.classList.add('hidden');
    stopTimer();
    if(timerBar) timerBar.classList.add('hidden');
    showGradeSelect();
  }
  function showQuestion(){ homeEl.classList.add('hidden'); questionEl.classList.remove('hidden'); }

  document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => startTopic(btn.dataset.topic));
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

  function startTopic(topic){
    startTimer();
    // initialize server session token for submits (best-effort, non-blocking)
    console.log('[DEBUG] Starting topic:', topic);
    startSession().catch((e)=>{
      console.error('[ERROR] Failed to start session:', e);
    });
    if(topic === 'mixed-fractions'){
      const level = getMixedLevel ? getMixedLevel() : 1;
      currentProblem = window.MathGen.generateProblem('mixed-fractions', level);
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

    if(problem.type === 'mixed-fractions'){
      if(mixedControls){ mixedControls.classList.remove('hidden'); mixedControls.setAttribute('aria-hidden','false'); }
      setActiveLevel(problem.level ? Number(problem.level) : 1);
      const rows = problem.operands.map((o,idx)=>{
        const sign = idx===0 ? '&nbsp;' : '+';
        return `<div class="row"><span class="op">${sign}</span><span class="mixed-wrap">${mixedHTML(o.whole,o.num,o.den)}</span></div>`;
      }).join('');
      problemEl.innerHTML = `<div class="stacked">${rows}</div>`;
      answerInput.inputMode = 'text';
    } else if(problem.type === 'fractions'){
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      const a = problem.a, b = problem.b;
      const rows = `<div class="row"><span class="op">&nbsp;</span><span class="fraction-wrap">${fracHTML(a.num,a.den)}</span></div><div class="row"><span class="op">${problem.op}</span><span class="fraction-wrap">${fracHTML(b.num,b.den)}</span></div>`;
      problemEl.innerHTML = `<div class="stacked">${rows}</div>`;
      answerInput.inputMode = 'text';
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
      answerInput.inputMode = 'numeric';
    } else if(problem.type === 'sight-words'){
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      problemEl.innerHTML = `<div class="sight-word-label">Read this word aloud — then click "I read it!"</div><div class="sight-word-display">${escapeHtml(problem.word)}</div>`;
      if(readBtn) readBtn.classList.remove('hidden');
      // hide the "Your answer" input and label for sight words — honor system
      if(answerLabel) answerLabel.classList.add('hidden');
      if(answerInput){ answerInput.value = ''; answerInput.classList.add('hidden'); answerInput.removeAttribute('required'); }
      if(checkBtn) checkBtn.classList.add('hidden');
      // don't focus input when it's hidden
      answerInput.inputMode = 'text';
    } else if(['addition','subtraction','addition-g1','subtraction-g1','addition-k'].includes(problem.type)){
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      // Render vertical layout for addition/subtraction to match fractions layout (easier for kids)
      const isSub = String(problem.type).includes('subtraction');
      const opSymbol = isSub ? '−' : '+';
      const a = (typeof problem.a !== 'undefined') ? problem.a : (problem.a || '');
      const b = (typeof problem.b !== 'undefined') ? problem.b : (problem.b || '');
      const rows = `<div class="row"><span class="op">&nbsp;</span><span class="number-wrap">${a}</span></div><div class="row"><span class="op">${opSymbol}</span><span class="number-wrap">${b}</span></div>`;
      problemEl.innerHTML = `<div class="stacked">${rows}</div>`;
      answerInput.inputMode = 'numeric';
    } else {
      if(mixedControls){ mixedControls.classList.add('hidden'); mixedControls.setAttribute('aria-hidden','true'); }
      problemEl.textContent = problem.question;
      answerInput.inputMode = 'numeric';
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
      }
      return window.MathGen.generateProblem(t);
    };
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

  document.addEventListener('DOMContentLoaded', () => { updateNavGradeIcon(); });
})();
