// evaluator.js - parses answers, compares, and builds explanations
(function(){
  const TOLERANCE = 0.01; // decimal tolerance when comparing fraction <-> decimal
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t;}return Math.abs(a)}
  function simplify(n,d){if(d===0) return {num:n,den:d}; const g=gcd(n,d); n/=g; d/=g; if(d<0){d=-d;n=-n;} return {num:n,den:d}}

  function parseAnswer(input){
    if(typeof input !== 'string') input = String(input);
    const s = input.trim();
    if(s.length === 0) throw new Error('empty');
    // mixed number: "1 1/2"
    const mixed = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
    if(mixed){
      const whole = Number(mixed[1]); const num = Number(mixed[2]); const den = Number(mixed[3]);
      if(den === 0) throw new Error('denominator zero');
      const sign = whole < 0 ? -1 : 1;
      const absWhole = Math.abs(whole);
      const numer = sign * (absWhole * den + num);
      return {type:'fraction',num:numer,den};
    }
    // simple fraction: "3/4"
    const frac = s.match(/^(-?\d+)\/(\d+)$/);
    if(frac){ const num = Number(frac[1]); const den = Number(frac[2]); if(den === 0) throw new Error('denominator zero'); return {type:'fraction',num,den} }
    // decimal or integer
    const asNum = Number(s.replace(/,/g, ''));
    if(!Number.isNaN(asNum)) return {type:'number',value:asNum}
    throw new Error('invalid');
  }

  function fractionToNumber(fr){return fr.num / fr.den}
  function equalFractions(a,b){a = simplify(a.num,a.den); b = simplify(b.num,b.den); return a.num === b.num && a.den === b.den}

  function checkAnswer(problem, rawAnswer){
    // ── Sight words / text answer ────────────────────────────────────────────
    if(problem.answerType === 'text'){
      const given = rawAnswer.trim();
      if(!given) return {valid:false, message:'Please type the word.'};
      const correct = problem.answer.toLowerCase() === given.toLowerCase();
      const message = correct ? 'Correct! ✅' : `Not quite ❌  The word is "${problem.answer}".`;
      return {valid:true, correct, message, solution: null};
    }

    let parsed;
    try{ parsed = parseAnswer(rawAnswer); } catch(e){ return {valid:false, message:'Please enter a number or a fraction like 3/4 or a mixed number like 1 1/2.'} }

    if(problem.answerType === 'number'){
      // accept numbers or fractions that match numerically
      let expected = Number(problem.answer);
      let given = (parsed.type === 'number') ? parsed.value : fractionToNumber(parsed);
      const correct = Math.abs(expected - given) < (TOLERANCE/10); // exact for integer arithmetic
      const message = correct ? 'Correct! ✅' : `Not quite ❌ The correct answer is ${expected}.`;
      return {valid:true, correct, message, solution: buildSolution(problem)}
    }

    if(problem.answerType === 'fraction'){
      const expected = simplify(problem.answer.num, problem.answer.den);
      if(parsed.type === 'fraction'){
        const given = simplify(parsed.num, parsed.den);
        const correct = (expected.num === given.num && expected.den === given.den);
        const message = correct ? 'Correct! ✅' : `Not quite ❌ The correct answer is ${expected.num}/${expected.den}.`;
        return {valid:true, correct, message, solution: buildSolution(problem)}
      } else {
        // parsed is decimal/number
        const givenNum = parsed.value;
        const expectedFloat = expected.num / expected.den;
        const correct = Math.abs(expectedFloat - givenNum) <= TOLERANCE;
        const message = correct ? 'Correct! ✅' : `Not quite ❌ The correct answer is ${expected.num}/${expected.den} (≈ ${expectedFloat.toFixed(2)}).`;
        return {valid:true, correct, message, solution: buildSolution(problem)}
      }
    }

    return {valid:false, message:'Unsupported problem type.'}
  }

  function buildSolution(problem){
    switch(problem.type){
      case 'addition':
        return `${problem.a} + ${problem.b} = ${problem.answer}. Add ones, then tens.`;
      case 'subtraction':
        return `${problem.a} - ${problem.b} = ${problem.answer}. Subtract ones, then tens.`;
      case 'multiplication':
        return `${problem.a} × ${problem.b} = ${problem.answer}. Multiply the factors.`;
      case 'division':
        return `${problem.dividend} ÷ ${problem.divisor} = ${problem.answer}. Division with integer quotient.`;
      case 'addition-g1':
        return `${problem.a} + ${problem.b} = ${problem.answer}. Count on from ${problem.a}: add ${problem.b} more.`;
      case 'subtraction-g1':
        return `${problem.a} − ${problem.b} = ${problem.answer}. Start at ${problem.a} and count back ${problem.b}.`;
      case 'counting-k':
        return `There are ${problem.answer} ${problem.emoji}. Count each one carefully: 1, 2, 3 … ${problem.answer}.`;
      case 'addition-k':
        return `${problem.a} + ${problem.b} = ${problem.answer}. Start with ${problem.a} and count up ${problem.b} more.`;
      case 'sight-words':
        return null;
      // Grade 5 decimal operations
      case 'add-decimals':
      case 'add-2digit-decimals':
      case 'add-3digit-decimals':
        return `${problem.a} + ${problem.b} = ${problem.answer}. Line up the decimal points and add.`;
      case 'add-decimals-missing':
      case 'add-2digit-missing':
        return `${problem.a} + ${problem.answer} = ${problem.sum}. To find the missing addend: ${problem.sum} − ${problem.a} = ${problem.answer}.`;
      case 'add-2digit-missing-harder':
        return `${problem.answer} + ${problem.b} = ${problem.sum}. To find the missing addend: ${problem.sum} − ${problem.b} = ${problem.answer}.`;
      case 'add-columns':
        return `${problem.a} + ${problem.b} = ${problem.answer}. Line up decimal points and add column by column.`;
      case 'subtract-decimals':
      case 'subtract-from-whole':
        return `${problem.a} − ${problem.b} = ${problem.answer}. Line up the decimal points and subtract.`;
      case 'subtract-decimals-missing':
        return `${problem.a} − ${problem.answer} = ${problem.diff}. To find the missing number: ${problem.a} − ${problem.diff} = ${problem.answer}.`;
      case 'subtract-2digit-decimals':
        return `${problem.answer} − ${problem.sub} = ${problem.diff}. To find the minuend: ${problem.diff} + ${problem.sub} = ${problem.answer}.`;
      case 'subtract-columns':
        return `${problem.a} − ${problem.b} = ${problem.answer}. Line up decimal points and subtract column by column.`;
      case 'multiply-by-10-100':
      case 'multiply-by-10-100-1000':
      case 'multiply-3digit-by-powers':
        return `${problem.a} × ${problem.power} = ${problem.answer}. Move the decimal point ${problem.power === 10 ? '1' : problem.power === 100 ? '2' : '3'} place(s) to the right.`;
      case 'multiply-powers-missing':
        return `${problem.a} × ${problem.answer} = ${problem.result}. To find the missing factor: ${problem.result} ÷ ${problem.a} = ${problem.answer}.`;
      case 'multiply-3digit-missing':
        return `${problem.answer} × ${problem.power} = ${problem.result}. To find the missing number: ${problem.result} ÷ ${problem.power} = ${problem.answer}.`;
      case 'whole-x-1digit-decimal':
      case 'whole-x-1-2digit-decimal':
      case 'whole-x-1-2digit-harder':
        return `${problem.a} × ${problem.b} = ${problem.answer}. Multiply as whole numbers, then count decimal places.`;
      case 'whole-x-decimal-missing':
      case 'whole-x-2digit-missing':
        return `${problem.a} × ${problem.answer} = ${problem.result}. To find the missing factor: ${problem.result} ÷ ${problem.a} = ${problem.answer}.`;
      case 'multiply-decimal-by-decimal':
        return `${problem.a} × ${problem.b} = ${problem.answer}. Multiply as whole numbers, then place the decimal point.`;
      case 'multiply-decimals-missing':
        return `${problem.answer} × ${problem.b} = ${problem.result}. To find the missing factor: ${problem.result} ÷ ${problem.b} = ${problem.answer}.`;
      case 'multiply-decimals-whole-columns':
      case 'multiply-1digit-columns':
      case 'multiply-2digit-columns':
        return `${problem.a} × ${problem.b} = ${problem.answer}. Multiply in columns, counting decimal places in the result.`;
      case 'missing-addends-3terms':
        return `${problem.answer} + ${problem.b} + ${problem.c} = ${problem.sum}. To find the missing addend: ${problem.sum} − ${problem.b} − ${problem.c} = ${problem.answer}.`;
      case 'missing-addends-4plus':
        return `Sum of known terms: ${problem.terms.reduce((s,v)=>s+v,0)}. Missing addend: ${problem.sum} − ${problem.terms.reduce((s,v)=>s+v,0)} = ${problem.answer}.`;
      case 'missing-addends-mental':
        return `${problem.a} + ${problem.answer} = ${problem.sum}. To find the missing addend: ${problem.sum} − ${problem.a} = ${problem.answer}.`;
      case 'adding-4numbers-columns':
      case 'adding-5numbers-columns':
      case 'adding-large-4addends':
      case 'adding-large-6addends':
        return `Add the numbers column by column from right to left. Sum = ${problem.answer.toLocaleString()}.`;
      case 'missing-minuend-subtrahend':
        return `${problem.answer} − ${problem.sub} = ${problem.diff}. To find the minuend: ${problem.diff} + ${problem.sub} = ${problem.answer}.`;
      case 'subtract-large-columns':
        return `${problem.a.toLocaleString()} − ${problem.b.toLocaleString()} = ${problem.answer.toLocaleString()}. Subtract column by column from right to left.`;
      case 'word-problems-g5':
        const currentQ = problem.questions[problem.currentQuestion];
        let sol = `Answer: ${currentQ.answer}`;
        if (currentQ.equation) sol += `. Equation: ${currentQ.equation}`;
        return sol;
      case 'fractions':{
        const a = problem.a, b = problem.b;
        const common = (a.den * b.den) / gcd(a.den, b.den);
        const an = a.num * (common / a.den);
        const bn = b.num * (common / b.den);
        const opSymbol = problem.op === '+' ? '+' : '-';
        const resn = opSymbol === '+' ? (an + bn) : (an - bn);
        const simplified = simplify(resn, common);
        function fracHTML(n,d){ return `<span class="fraction"><span class="num">${n}</span><span class="den">${d}</span></span>`; }
        const steps = [];
        if(a.den === b.den){
          // denominators already the same — skip finding and converting
          steps.push(`Step 1: The denominators are the same (${a.den}), so ${opSymbol === '+' ? 'add' : 'subtract'} the numerators: ${a.num} ${opSymbol} ${b.num} = ${resn} → ${fracHTML(resn,a.den)}.`);
        } else {
          steps.push(`Step 1: Find a common denominator — ${a.den} and ${b.den} → ${common}.`);
          steps.push(`Step 2: Convert each fraction: ${fracHTML(a.num,a.den)} → ${fracHTML(an,common)}; ${fracHTML(b.num,b.den)} → ${fracHTML(bn,common)}.`);
          steps.push(`Step 3: ${opSymbol === '+' ? 'Add' : 'Subtract'} numerators: ${an} ${opSymbol} ${bn} = ${resn} → ${fracHTML(resn,common)}.`);
        }
        const nextStep = (a.den === b.den) ? 2 : 4;
        const simp = simplified;
        if(simp.den === 1){
          steps.push(`Step ${nextStep}: The fraction is equal to ${simp.num}.`);
        } else if(Math.abs(simp.num) > simp.den){
          const whole = Math.trunc(simp.num / simp.den);
          const rem = Math.abs(simp.num) % simp.den;
          steps.push(`Step ${nextStep}: Reduce the fraction if possible: ${fracHTML(simp.num,simp.den)}. As a mixed number that is ${whole} ${fracHTML(rem,simp.den)}.`);
        } else {
          steps.push(`Step ${nextStep}: Reduce the fraction if possible: ${fracHTML(simp.num,simp.den)}.`);
        }
        return steps;
      }
      case 'mixed-fractions':{
        const ops = problem.operands;
        if(!ops || ops.length === 0) return [`Answer: ${problem.answer.num}/${problem.answer.den}`];
        let mCommon = ops[0].den;
        for(let i=1;i<ops.length;i++) mCommon = (mCommon * ops[i].den) / gcd(mCommon, ops[i].den);
        const improps = ops.map(o => ({imp: o.whole * o.den + o.num, den: o.den}));
        const converted = improps.map(o => o.imp * (mCommon / o.den));
        const sum = converted.reduce((s,v)=>s+v,0);
        const simplifiedM = simplify(sum, mCommon);
        function fracHTML(n,d){ return `<span class="fraction"><span class="num">${n}</span><span class="den">${d}</span></span>`; }
        const impropStr = improps.map(o => `${o.whole} ${fracHTML(o.num,o.den)} → ${fracHTML(o.imp,o.den)}`).join('; ');
        const convertedStr = converted.map((c,i)=> `${fracHTML(c,mCommon)}`).join(' + ');
        const steps = [];
        steps.push(`Step 1: Convert each mixed number to an improper fraction: ${impropStr}.`);
        steps.push(`Step 2: Find a common denominator: ${mCommon}.`);
        steps.push(`Step 3: Convert to equivalent fractions with denominator ${mCommon}: ${convertedStr}.`);
        steps.push(`Step 4: Add the fractions: ${convertedStr} = ${fracHTML(sum,mCommon)}.`);
        if(simplifiedM.den === 1){
          steps.push(`Step 5: The result simplifies to ${simplifiedM.num}.`);
        } else if(Math.abs(simplifiedM.num) > simplifiedM.den){
          const whole = Math.trunc(simplifiedM.num / simplifiedM.den);
          const rem = Math.abs(simplifiedM.num) % simplifiedM.den;
          steps.push(`Step 5: Reduce the fraction if needed: ${fracHTML(simplifiedM.num,simplifiedM.den)}. As a mixed number that is ${whole} ${fracHTML(rem,simplifiedM.den)}.`);
        } else {
          steps.push(`Step 5: Reduce the fraction if needed: ${fracHTML(simplifiedM.num,simplifiedM.den)}.`);
        }
        return steps;
      }
      default:
        return `Answer: ${problem.answer}`;
    }
  }

  window.Evaluator = {parseAnswer,checkAnswer,buildSolution}
})();
