// generator.js - problem generators for the math worksheets
(function(){
  const DENOMS = [2,3,4,5,6,8];
  function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t;}return Math.abs(a)}
  function simplify(n,d){if(d===0) return {num:n,den:d}; const g=gcd(n,d); n/=g; d/=g; if(d<0){d=-d;n=-n;} return {num:n,den:d}}
  function lcm(a,b){return Math.abs(a*b)/gcd(a,b)}

  function toFractionString(fr){if(fr.den===1) return String(fr.num); const sign = fr.num<0?'-':''; const num = Math.abs(fr.num); if(num>fr.den){const whole = Math.trunc(num/fr.den); const rem = num%fr.den; return sign + whole + ' ' + rem + '/' + fr.den} return sign + num + '/' + fr.den}

  // ── Grade 4 generators ──────────────────────────────────────────────────────
  function generateAddition(){const a=randInt(10,999);const b=randInt(10,999);return {type:'addition',a,b,question:`${a} + ${b}`,answer:a+b,answerType:'number'}}
  function generateSubtraction(){let a=randInt(10,999);let b=randInt(10,999);if(b>a) [a,b]=[b,a];return {type:'subtraction',a,b,question:`${a} - ${b}`,answer:a-b,answerType:'number'}}
  function generateMultiplication(){const a=randInt(10,99);const b=randInt(10,99);return {type:'multiplication',a,b,question:`${a} × ${b}`,answer:a*b,answerType:'number'}}
  function generateDivision(){const divisor = randInt(1,12);const quotient = randInt(1,12);const dividend = divisor*quotient;return {type:'division',dividend,divisor,question:`${dividend} ÷ ${divisor}`,answer:quotient,answerType:'number'}}

  function generateFractionProblem(){
    const d1 = DENOMS[Math.floor(Math.random()*DENOMS.length)];
    const d2 = DENOMS[Math.floor(Math.random()*DENOMS.length)];
    const n1 = randInt(1,d1-1);
    const n2 = randInt(1,d2-1);
    const op = Math.random() < 0.5 ? '+' : '-';
    let aNum = n1, aDen = d1, bNum = n2, bDen = d2;
    if(op === '-'){
      if(n1 * d2 < n2 * d1){ aNum = n2; aDen = d2; bNum = n1; bDen = d1; }
    }
    const common = lcm(aDen,bDen);
    const resNum = (aNum*(common/aDen)) + (op === '+' ? (bNum*(common/bDen)) : -(bNum*(common/bDen)));
    const simplified = simplify(resNum, common);
    const question = `${aNum}/${aDen} ${op} ${bNum}/${bDen}`;
    return {type:'fractions',op, a:{num:aNum,den:aDen}, b:{num:bNum,den:bDen}, question, answer:simplified, answerType:'fraction'}
  }

  function generateMixedFractions(level){
    const count = (level === 2) ? 3 : 2;
    const operands = [];
    for(let i=0;i<count;i++){
      const den = DENOMS[Math.floor(Math.random()*DENOMS.length)];
      const num = randInt(1, den-1);
      const whole = randInt(1,5);
      operands.push({whole,num,den});
    }
    let common = operands[0].den;
    for(let i=1;i<operands.length;i++) common = lcm(common, operands[i].den);
    let sumNum = 0;
    for(const op of operands){
      const imp = op.whole * op.den + op.num;
      sumNum += imp * (common / op.den);
    }
    const simplified = simplify(sumNum, common);
    const qparts = operands.map(op => `${op.whole} ${op.num}/${op.den}`);
    const question = qparts.join(' + ');
    return {type:'mixed-fractions', level, operands, question, answer:simplified, answerType:'fraction'};
  }

  // ── Grade 1 generators (numbers 1–100) ──────────────────────────────────────
  function generateAdditionG1(){
    const a = randInt(1,99); const b = randInt(1, 100-a);
    return {type:'addition-g1',a,b,question:`${a} + ${b} = ?`,answer:a+b,answerType:'number'};
  }
  function generateSubtractionG1(){
    // For Grade 1 subtraction: top between 5 and 30, bottom a single digit (1-9).
    // Ensure top >= bottom to avoid negative results. Borrowing is allowed when the units
    // digit of the top number is less than the bottom digit.
    const b = randInt(1,9);
    const a = randInt(Math.max(5,b), 30);
    return {type:'subtraction-g1',a,b,question:`${a} − ${b} = ?`,answer:a-b,answerType:'number'};
  }

  // ── Kindergarten generators ─────────────────────────────────────────────────
  const COUNTING_EMOJIS = ['🍎','⭐','🌸','🐶','🎈','🦋','🍦','🚂','🐸','🌻','🍕','🎀','🐱','🏀','🎵'];

  function generateCountingK(){
    const count = randInt(1,20);
    const emoji = COUNTING_EMOJIS[Math.floor(Math.random()*COUNTING_EMOJIS.length)];
    return {type:'counting-k',count,emoji,question:`How many?`,answer:count,answerType:'number'};
  }

  function generateAdditionK(){
    const a = randInt(1,19); const b = randInt(1, 20-a);
    return {type:'addition-k',a,b,question:`${a} + ${b} = ?`,answer:a+b,answerType:'number'};
  }

  const SIGHT_WORDS = [
    // User-provided list
    'all','am','are','at','ate','be','black','brown','but','came','did','do','eat','four','get',
    'good','have','he','into','like','must','new','no','now','on','our','out','please','pretty',
    'ran','ride','saw','say','she','so','soon','that','there','they','this','too','under','want',
    'was','well','went','what','white','who','will','with','yes',
    // Dolch Pre-Primer & Primer additions
    'a','and','away','big','blue','can','come','down','find','for','funny','go','help','here',
    'in','is','it','jump','little','look','make','me','my','not','one','play','red','run',
    'said','see','the','three','to','two','up','we','where','yellow','you',
    // Dolch Grade 1 extras
    'after','again','an','any','as','ask','by','could','every','fly','from','give','going',
    'had','has','her','him','his','how','just','know','let','live','may','of','old','once',
    'open','over','put','round','some','stop','take','thank','them','then','think','walk','were','when'
  ];

  function generateSightWord(){
    const word = SIGHT_WORDS[Math.floor(Math.random()*SIGHT_WORDS.length)];
    return {type:'sight-words',word,question:word,answer:word,answerType:'text'};
  }

  window.MathGen = {
    generateProblem(topic, level){
      switch(topic){
        case 'addition':        return generateAddition();
        case 'subtraction':     return generateSubtraction();
        case 'multiplication':  return generateMultiplication();
        case 'division':        return generateDivision();
        case 'fractions':       return generateFractionProblem();
        case 'mixed-fractions': return generateMixedFractions(level || 1);
        case 'addition-g1':     return generateAdditionG1();
        case 'subtraction-g1':  return generateSubtractionG1();
        case 'counting-k':      return generateCountingK();
        case 'addition-k':      return generateAdditionK();
        case 'sight-words':     return generateSightWord();
        default: return generateAddition();
      }
    },
    helpers:{gcd,simplify,toFractionString}
  }
})();
