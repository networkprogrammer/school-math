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

  // ── Word Problems for Grade 1 (Addition) ────────────────────────────────────
  const WORD_PROBLEM_TEMPLATES = [
    // Sports & Games
    {text: "{name} was playing basketball. {a} of {pronoun_pos} shots went in the hoop. {b} of {pronoun_pos} shots did not go in the hoop. How many shots were there in total?", names: ['Ariel','Jordan','Maya','Alex','Sam']},
    {text: "{name} scored {a} goals in the first half and {b} goals in the second half. How many goals did {pronoun_sub} score in total?", names: ['Leo','Emma','Noah','Mia','Liam']},
    {text: "{name} caught {a} balls during practice. Then {pronoun_sub} caught {b} more. How many balls did {pronoun_sub} catch altogether?", names: ['Sofia','Jack','Ava','Ryan','Zoe']},
    
    // Food & Snacks
    {text: "{name} has {a} pieces of gum to share with friends. There wasn't enough gum for all {pronoun_pos} friends, so {pronoun_sub} went to the store to get {b} more pieces of gum. How many pieces of gum does {name} have now?", names: ['Adrianna','Ben','Chloe','David','Ella']},
    {text: "{name} ate {a} cookies after lunch and {b} cookies after dinner. How many cookies did {pronoun_sub} eat in total?", names: ['Oliver','Lily','Ethan','Grace','Lucas']},
    {text: "{name} picked {a} apples from one tree and {b} apples from another tree. How many apples did {pronoun_sub} pick?", names: ['Isabella','Mason','Sophia','James','Amelia']},
    
    // Animals & Pets
    {text: "{name} saw {a} dogs at the park in the morning. In the afternoon, {pronoun_sub} saw {b} more dogs. How many dogs did {pronoun_sub} see altogether?", names: ['Harper','William','Evelyn','Henry','Abigail']},
    {text: "{name} has {a} fish in one tank and {b} fish in another tank. How many fish does {pronoun_sub} have in total?", names: ['Michael','Emily','Daniel','Avery','Matthew']},
    {text: "{name} counted {a} birds on the fence. Then {b} more birds landed. How many birds are on the fence now?", names: ['Ella','Logan','Scarlett','Jackson','Luna']},
    
    // School & Learning
    {text: "{name} read {a} books last week and {b} books this week. How many books did {pronoun_sub} read altogether?", names: ['Charlotte','Sebastian','Aria','Aiden','Penelope']},
    {text: "{name} drew {a} pictures on Monday and {b} pictures on Tuesday. How many pictures did {pronoun_sub} draw in total?", names: ['Layla','Grayson','Nora','Carter','Ellie']},
    {text: "{name} solved {a} math problems before recess and {b} problems after recess. How many problems did {pronoun_sub} solve?", names: ['Zoey','Wyatt','Hannah','Luke','Stella']},
    
    // Toys & Fun
    {text: "{name} has {a} toy cars in {pronoun_pos} room and {b} toy cars in the playroom. How many toy cars does {pronoun_sub} have?", names: ['Isaac','Violet','Leo','Hazel','Owen']},
    {text: "{name} built {a} towers with blocks. Then {pronoun_sub} built {b} more towers. How many towers did {pronoun_sub} build altogether?", names: ['Levi','Aurora','Nathan','Savannah','Caleb']},
    {text: "{name} collected {a} stickers on Saturday and {b} stickers on Sunday. How many stickers did {pronoun_sub} collect?", names: ['Elijah','Brooklyn','Gabriel','Claire','Julian']}
  ];

  function generateWordProblem(level){
    const maxSum = (level === 2) ? 20 : 10;
    const template = WORD_PROBLEM_TEMPLATES[Math.floor(Math.random()*WORD_PROBLEM_TEMPLATES.length)];
    const name = template.names[Math.floor(Math.random()*template.names.length)];
    
    // Determine pronouns based on name (simple heuristic)
    const femaleNames = ['Ariel','Maya','Emma','Mia','Sofia','Ava','Zoe','Adrianna','Chloe','Ella','Lily','Grace','Isabella','Sophia','Amelia','Harper','Evelyn','Abigail','Emily','Avery','Luna','Charlotte','Aria','Penelope','Layla','Nora','Ellie','Zoey','Hannah','Stella','Violet','Hazel','Aurora','Savannah','Brooklyn','Claire'];
    const isFemale = femaleNames.includes(name);
    const pronoun_sub = isFemale ? 'she' : 'he';
    const pronoun_pos = isFemale ? 'her' : 'his';
    
    // Generate numbers that sum to maxSum or less
    const a = randInt(1, maxSum - 1);
    const b = randInt(1, maxSum - a);
    const answer = a + b;
    
    // Replace placeholders
    let question = template.text
      .replace(/{name}/g, name)
      .replace(/{pronoun_sub}/g, pronoun_sub)
      .replace(/{pronoun_pos}/g, pronoun_pos)
      .replace(/{a}/g, a)
      .replace(/{b}/g, b);
    
    return {
      type: 'word-problems-g1',
      level,
      a,
      b,
      name,
      question,
      answer,
      answerType: 'number'
    };
  }

  // ── Word Problems for Grade 1 (Subtraction) ─────────────────────────────────
  const SUBTRACTION_WORD_PROBLEM_TEMPLATES = [
    // Food & Shopping
    {text: "There were {a} pizzas in total at the pizza shop. A customer bought {b} pizza{plural}. How many pizzas are left?", names: ['Pizza Shop','Tony\'s Pizza','Mario\'s']},
    {text: "{name} had {a} cupcakes. {pronoun_sub_cap} gave {b} cupcake{plural} to {pronoun_pos} friend. How many cupcakes does {name} have now?", names: ['Emma','Liam','Sophia','Noah','Olivia']},
    {text: "There were {a} cookies in the jar. {name} ate {b} cookie{plural}. How many cookies are left in the jar?", names: ['Mom','Dad','Alex','Sam','Jordan']},
    
    // School & Supplies
    {text: "Your friend said she had {a} stickers. When you helped her clean her desk, she only had a total of {answer} stickers. How many stickers are missing?", names: ['friend']},
    {text: "{name} had {a} pencils at the start of the week. By Friday, {pronoun_sub} lost {b} pencil{plural}. How many pencils does {pronoun_sub} have left?", names: ['Maya','Ethan','Ava','Lucas','Isabella']},
    {text: "The teacher had {a} books on the shelf. She lent {b} book{plural} to students. How many books are still on the shelf?", names: ['teacher']},
    
    // Toys & Games
    {text: "{name} had {a} toy cars. {pronoun_sub_cap} gave {b} car{plural} to {pronoun_pos} little brother. How many toy cars does {name} have now?", names: ['Jack','Mia','Leo','Zoe','Owen']},
    {text: "There were {a} balloons at the party. {b} balloon{plural} popped. How many balloons are left?", names: ['party']},
    {text: "{name} collected {a} rocks. {pronoun_sub_cap} gave {b} rock{plural} to {pronoun_pos} friend. How many rocks does {pronoun_sub} have left?", names: ['Harper','Elijah','Charlotte','Mason','Amelia']},
    
    // Animals & Nature
    {text: "{name} saw {a} birds in the tree. Then {b} bird{plural} flew away. How many birds are still in the tree?", names: ['Lily','James','Grace','Henry','Ella']},
    {text: "There were {a} ducks in the pond. {b} duck{plural} swam away. How many ducks are left in the pond?", names: ['pond']},
    {text: "{name} had {a} fish in the tank. {pronoun_sub_cap} gave {b} fish to {pronoun_pos} neighbor. How many fish are left in the tank?", names: ['Sofia','Ryan','Chloe','Aiden','Luna']},
    
    // Activities
    {text: "{name} had {a} crayons. {pronoun_sub_cap} lost {b} crayon{plural}. How many crayons does {pronoun_sub} have now?", names: ['Aria','Logan','Nora','Carter','Stella']},
    {text: "There were {a} kids playing at the park. {b} kid{plural} went home. How many kids are still playing?", names: ['park']},
    {text: "{name} made {a} paper airplanes. {b} airplane{plural} flew out the window. How many paper airplanes does {pronoun_sub} have left?", names: ['Ben','Violet','Nathan','Hazel','Caleb']}
  ];

  function generateSubtractionWordProblem(level){
    const maxStart = (level === 2) ? 20 : 10;
    const template = SUBTRACTION_WORD_PROBLEM_TEMPLATES[Math.floor(Math.random()*SUBTRACTION_WORD_PROBLEM_TEMPLATES.length)];
    const name = template.names[Math.floor(Math.random()*template.names.length)];
    
    // Determine pronouns based on name (simple heuristic)
    const femaleNames = ['Emma','Sophia','Olivia','Maya','Ava','Isabella','Mia','Zoe','Harper','Charlotte','Amelia','Lily','Grace','Ella','Sofia','Chloe','Luna','Aria','Nora','Stella','Violet','Hazel'];
    const isFemale = femaleNames.includes(name);
    const pronoun_sub = isFemale ? 'she' : 'he';
    const pronoun_sub_cap = isFemale ? 'She' : 'He';
    const pronoun_pos = isFemale ? 'her' : 'his';
    
    // Generate numbers for subtraction (ensure a >= b)
    const a = randInt(Math.max(3, level === 2 ? 11 : 3), maxStart);
    const b = randInt(1, Math.min(a - 1, level === 2 ? 10 : 5));
    const answer = a - b;
    
    // Determine plural form
    const plural = (b > 1) ? 's' : '';
    
    // Replace placeholders
    let question = template.text
      .replace(/{name}/g, name)
      .replace(/{pronoun_sub_cap}/g, pronoun_sub_cap)
      .replace(/{pronoun_sub}/g, pronoun_sub)
      .replace(/{pronoun_pos}/g, pronoun_pos)
      .replace(/{a}/g, a)
      .replace(/{b}/g, b)
      .replace(/{answer}/g, answer)
      .replace(/{plural}/g, plural);
    
    return {
      type: 'subtraction-word-problems-g1',
      level,
      a,
      b,
      name,
      question,
      answer,
      answerType: 'number'
    };
  }

  // ── Grade 5 Decimal Generators ──────────────────────────────────────────────
  
  // Helper to format decimals nicely
  function formatDecimal(num, decimals) {
    return Number(num.toFixed(decimals));
  }

  // Adding Decimals
  function generateAddDecimals() {
    const a = formatDecimal(randInt(1, 9) + randInt(1, 9) / 10, 1);
    const b = formatDecimal(randInt(1, 9) + randInt(1, 9) / 10, 1);
    return {type: 'add-decimals', a, b, question: `${a} + ${b} = ___`, answer: formatDecimal(a + b, 1), answerType: 'number'};
  }

  function generateAddDecimalsMissing() {
    const a = formatDecimal(randInt(1, 9) + randInt(1, 9) / 10, 1);
    const sum = formatDecimal(a + randInt(1, 9) + randInt(1, 9) / 10, 1);
    const missing = formatDecimal(sum - a, 1);
    return {type: 'add-decimals-missing', a, sum, question: `${a} + ___ = ${sum}`, answer: missing, answerType: 'number', missingPosition: 'addend'};
  }

  function generateAdd2DigitDecimals() {
    const a = formatDecimal(randInt(1, 99) / 100, 2);
    const b = formatDecimal(randInt(1, 99) / 100, 2);
    return {type: 'add-2digit-decimals', a, b, question: `${a} + ${b} = ___`, answer: formatDecimal(a + b, 2), answerType: 'number'};
  }

  function generateAdd3DigitDecimals() {
    const a = formatDecimal(randInt(1, 999) / 1000, 3);
    const b = formatDecimal(randInt(1, 999) / 1000, 3);
    return {type: 'add-3digit-decimals', a, b, question: `${a} + ${b} = ___`, answer: formatDecimal(a + b, 3), answerType: 'number'};
  }

  function generateAdd2DigitMissing() {
    const a = formatDecimal(randInt(1, 99) / 100, 2);
    const sum = formatDecimal(a + randInt(1, 99) / 100, 2);
    const missing = formatDecimal(sum - a, 2);
    return {type: 'add-2digit-missing', a, sum, question: `${a} + ___ = ${sum}`, answer: missing, answerType: 'number', missingPosition: 'addend'};
  }

  function generateAdd2DigitMissingHarder() {
    const b = formatDecimal(randInt(100, 999) / 100, 2);
    const sum = formatDecimal(b + randInt(100, 999) / 100, 2);
    const missing = formatDecimal(sum - b, 2);
    return {type: 'add-2digit-missing-harder', b, sum, question: `___ + ${b} = ${sum}`, answer: missing, answerType: 'number', missingPosition: 'first'};
  }

  function generateAddColumns() {
    const decimals = [1, 2, 3][Math.floor(Math.random() * 3)]; // Randomly choose 1, 2, or 3 decimal places
    let a, b;
    
    if (decimals === 1) {
      a = formatDecimal(randInt(100, 9999) / 10, 1);
      b = formatDecimal(randInt(100, 9999) / 10, 1);
    } else if (decimals === 2) {
      a = formatDecimal(randInt(1000, 99999) / 100, 2);
      b = formatDecimal(randInt(1000, 99999) / 100, 2);
    } else { // decimals === 3
      a = formatDecimal(randInt(1000, 99999) / 1000, 3);
      b = formatDecimal(randInt(1000, 99999) / 1000, 3);
    }
    
    return {type: 'add-columns', a, b, question: 'column', answer: formatDecimal(a + b, decimals), answerType: 'number', displayType: 'column', decimals};
  }

  // Subtracting Decimals
  function generateSubtractDecimals() {
    const b = formatDecimal(randInt(1, 9) / 10, 1);
    const a = formatDecimal(b + randInt(1, 9) + randInt(0, 9) / 10, 1);
    return {type: 'subtract-decimals', a, b, question: `${a} − ${b} = ___`, answer: formatDecimal(a - b, 1), answerType: 'number'};
  }

  function generateSubtractDecimalsMissing() {
    const diff = formatDecimal(randInt(1, 9) + randInt(0, 9) / 10, 1);
    const sub = formatDecimal(randInt(1, 9) / 10, 1);
    const a = formatDecimal(diff + sub, 1);
    return {type: 'subtract-decimals-missing', a, diff, question: `${a} − ___ = ${diff}`, answer: sub, answerType: 'number', missingPosition: 'subtrahend'};
  }

  function generateSubtract2DigitDecimals() {
    const diff = formatDecimal(randInt(100, 999) / 100, 2);
    const sub = formatDecimal(randInt(10, 199) / 100, 2);
    const a = formatDecimal(diff + sub, 2);
    return {type: 'subtract-2digit-decimals', a, sub, diff, question: `___ − ${sub} = ${diff}`, answer: a, answerType: 'number', missingPosition: 'minuend'};
  }

  function generateSubtractFromWhole() {
    const whole = randInt(2, 10);
    const sub = formatDecimal(randInt(1, 99) / 100, 2);
    return {type: 'subtract-from-whole', a: whole, b: sub, question: `${whole} − ${sub} = ___`, answer: formatDecimal(whole - sub, 2), answerType: 'number'};
  }

  function generateSubtractColumns() {
    const decimals = [1, 2, 3][Math.floor(Math.random() * 3)]; // Randomly choose 1, 2, or 3 decimal places
    let a, b;
    
    if (decimals === 1) {
      b = formatDecimal(randInt(100, 9999) / 10, 1);
      a = formatDecimal(b + randInt(100, 9999) / 10, 1);
    } else if (decimals === 2) {
      b = formatDecimal(randInt(1000, 99999) / 100, 2);
      a = formatDecimal(b + randInt(1000, 99999) / 100, 2);
    } else { // decimals === 3
      b = formatDecimal(randInt(1000, 99999) / 1000, 3);
      a = formatDecimal(b + randInt(1000, 99999) / 1000, 3);
    }
    
    return {type: 'subtract-columns', a, b, question: 'column', answer: formatDecimal(a - b, decimals), answerType: 'number', displayType: 'column', decimals};
  }

  // Multiply by Powers of 10
  function generateMultiplyBy10Or100() {
    const a = formatDecimal(randInt(10, 99) / 10, 1);
    const power = [10, 100][randInt(0, 1)];
    return {type: 'multiply-by-10-100', a, power, question: `${a} × ${power} = ___`, answer: formatDecimal(a * power, power === 10 ? 0 : 1), answerType: 'number'};
  }

  function generateMultiplyBy10_100_1000() {
    const a = formatDecimal(randInt(10, 999) / 100, 2);
    const power = [10, 100, 1000][randInt(0, 2)];
    return {type: 'multiply-by-10-100-1000', a, power, question: `${a} × ${power} = ___`, answer: formatDecimal(a * power, 2), answerType: 'number'};
  }

  function generateMultiply3DigitByPowers() {
    const a = formatDecimal(randInt(100, 9999) / 1000, 3);
    const power = [10, 100, 1000][randInt(0, 2)];
    return {type: 'multiply-3digit-by-powers', a, power, question: `${a} × ${power} = ___`, answer: formatDecimal(a * power, 3), answerType: 'number'};
  }

  function generateMultiplyPowersMissing() {
    const a = formatDecimal(randInt(10, 999) / 100, 2);
    const power = [10, 100, 1000][randInt(0, 2)];
    const result = formatDecimal(a * power, 2);
    return {type: 'multiply-powers-missing', a, result, question: `${a} × ___ = ${result}`, answer: power, answerType: 'number', missingPosition: 'factor'};
  }

  function generateMultiply3DigitMissing() {
    const power = 100;
    const result = formatDecimal(randInt(1000, 99999) / 10, 1);
    const a = formatDecimal(result / power, 3);
    return {type: 'multiply-3digit-missing', power, result, question: `___ × ${power} = ${result}`, answer: a, answerType: 'number', missingPosition: 'multiplicand'};
  }

  // Multiply Decimals by Whole Numbers
  function generateWholeX1DigitDecimal() {
    const whole = randInt(2, 9);
    const decimal = formatDecimal(randInt(1, 9) / 10, 1);
    return {type: 'whole-x-1digit-decimal', a: whole, b: decimal, question: `${whole} × ${decimal} = ___`, answer: formatDecimal(whole * decimal, 1), answerType: 'number'};
  }

  function generateWholeX1_2DigitDecimal() {
    const whole = randInt(2, 9);
    const decimal = formatDecimal(randInt(1, 99) / 100, 2);
    return {type: 'whole-x-1-2digit-decimal', a: whole, b: decimal, question: `${whole} × ${decimal} = ___`, answer: formatDecimal(whole * decimal, 2), answerType: 'number'};
  }

  function generateWholeX1_2DigitHarder() {
    const whole = randInt(5, 12);
    const decimal = formatDecimal(randInt(10, 99) / 100, 2);
    return {type: 'whole-x-1-2digit-harder', a: whole, b: decimal, question: `${whole} × ${decimal} = ___`, answer: formatDecimal(whole * decimal, 2), answerType: 'number'};
  }

  function generateWholeXDecimalMissing() {
    const decimal = formatDecimal(randInt(1, 9) / 10, 1);
    const whole = randInt(2, 9);
    const result = formatDecimal(decimal * whole, 2);
    return {type: 'whole-x-decimal-missing', a: decimal, result, question: `${decimal} × ___ = ${result}`, answer: whole, answerType: 'number', missingPosition: 'factor'};
  }

  function generateWholeX2DigitMissing() {
    const decimal = 0.01;
    const result = formatDecimal(randInt(1, 9) / 100, 2);
    const whole = result / decimal;
    return {type: 'whole-x-2digit-missing', a: decimal, result, question: `${decimal} × ___ = ${result}`, answer: whole, answerType: 'number', missingPosition: 'factor'};
  }

  // Multiply Decimals by Decimals
  function generateMultiplyDecimalByDecimal() {
    const a = formatDecimal(randInt(1, 9) / 10, 1);
    const b = formatDecimal(randInt(1, 9) / 10, 1);
    return {type: 'multiply-decimal-by-decimal', a, b, question: `${a} × ${b} = ___`, answer: formatDecimal(a * b, 2), answerType: 'number'};
  }

  function generateMultiplyDecimalsMissing() {
    const b = 0.1;
    const result = formatDecimal(randInt(1, 9) / 100, 2);
    const a = formatDecimal(result / b, 1);
    return {type: 'multiply-decimals-missing', b, result, question: `___ × ${b} = ${result}`, answer: a, answerType: 'number', missingPosition: 'multiplicand'};
  }

  // Multiply in Columns
  function generateMultiplyDecimalsWholeColumns() {
    const a = formatDecimal(randInt(10, 99) / 10, 1);
    const b = randInt(2, 9);
    return {type: 'multiply-decimals-whole-columns', a, b, question: 'column', answer: formatDecimal(a * b, 1), answerType: 'number', displayType: 'column'};
  }

  function generateMultiply1DigitColumns() {
    const a = formatDecimal(randInt(10, 99) / 10, 1);
    const b = formatDecimal(randInt(10, 19) / 10, 1);
    return {type: 'multiply-1digit-columns', a, b, question: 'column', answer: formatDecimal(a * b, 2), answerType: 'number', displayType: 'column'};
  }

  function generateMultiply2DigitColumns() {
    const a = formatDecimal(randInt(10, 99) / 100, 2);
    const b = formatDecimal(randInt(100, 199) / 100, 2);
    return {type: 'multiply-2digit-columns', a, b, question: 'column', answer: formatDecimal(a * b, 4), answerType: 'number', displayType: 'column'};
  }

  // Advanced Addition
  function generateMissingAddends3Terms() {
    const b = randInt(10, 99);
    const c = randInt(10, 99);
    const sum = randInt(100, 300);
    const a = sum - b - c;
    return {type: 'missing-addends-3terms', b, c, sum, question: `___ + ${b} + ${c} = ${sum}`, answer: a, answerType: 'number', missingPosition: 'first'};
  }

  function generateMissingAddends4Plus() {
    const terms = [randInt(10, 99), randInt(10, 99), randInt(100, 1000), randInt(10, 99)];
    const sum = randInt(1200, 2000);
    const missing = sum - terms.reduce((s, v) => s + v, 0);
    return {type: 'missing-addends-4plus', terms, sum, question: `${terms[0]} + ${terms[1]} + ${terms[2]} + ___ + ${terms[3]} = ${sum}`, answer: missing, answerType: 'number', missingPosition: 'middle'};
  }

  function generateMissingAddendsMental() {
    const a = randInt(100, 999);
    const sum = randInt(a + 100, a + 999);
    const missing = sum - a;
    return {type: 'missing-addends-mental', a, sum, question: `${a} + ___ = ${sum}`, answer: missing, answerType: 'number', missingPosition: 'addend'};
  }

  function generateAdding4NumbersColumns() {
    const nums = [randInt(100000, 999999), randInt(10000, 99999), randInt(100000, 999999), randInt(10000, 99999)];
    return {type: 'adding-4numbers-columns', numbers: nums, question: 'column', answer: nums.reduce((s, v) => s + v, 0), answerType: 'number', displayType: 'column'};
  }

  function generateAdding5NumbersColumns() {
    const nums = [randInt(10000, 99999), randInt(100, 999), randInt(100000, 999999), randInt(10000, 99999), randInt(1000, 9999)];
    return {type: 'adding-5numbers-columns', numbers: nums, question: 'column', answer: nums.reduce((s, v) => s + v, 0), answerType: 'number', displayType: 'column'};
  }

  function generateAddingLarge4Addends() {
    const nums = [randInt(1000000, 9999999), randInt(1000000, 9999999), randInt(1000000, 9999999), randInt(100000, 999999)];
    return {type: 'adding-large-4addends', numbers: nums, question: 'column', answer: nums.reduce((s, v) => s + v, 0), answerType: 'number', displayType: 'column'};
  }

  function generateAddingLarge6Addends() {
    const nums = [randInt(1000000, 9999999), randInt(10000000, 99999999), randInt(10000000, 99999999), randInt(10000000, 99999999), randInt(10000000, 99999999), randInt(1000000, 9999999)];
    return {type: 'adding-large-6addends', numbers: nums, question: 'column', answer: nums.reduce((s, v) => s + v, 0), answerType: 'number', displayType: 'column'};
  }

  // Advanced Subtraction
  function generateMissingMinuendSubtrahend() {
    const sub = randInt(100, 999);
    const diff = randInt(1000, 9999);
    const minuend = diff + sub;
    return {type: 'missing-minuend-subtrahend', sub, diff, question: `___ − ${sub} = ${diff}`, answer: minuend, answerType: 'number', missingPosition: 'minuend'};
  }

  function generateSubtractLargeColumns() {
    const b = randInt(100000000, 999999999);
    const a = randInt(b + 1000000, 999999999);
    return {type: 'subtract-large-columns', a, b, question: 'column', answer: a - b, answerType: 'number', displayType: 'column'};
  }

  // Word Problems for Grade 5
  const WORD_PROBLEM_SCENARIOS_G5 = [
    {
      title: "Airport Operations",
      context: (data) => `During a normal day, there are ${data.normalPlanes} planes taking off from the airport, but the airport is a lot busier during Christmas. During the Christmas holidays, about ${data.christmasPlanes} planes take off every day from the airport.`,
      questions: [
        {text: (d) => `During the Christmas holidays, the airport opens ${d.hoursOpen} hours during each day. How many planes take off from this airport in each hour?`, answer: (d) => Math.floor(d.christmasPlanes / d.hoursOpen)},
        {text: (d) => `In average, each plane takes ${d.passengersPerPlane} passengers and ${d.cargoPerPlane} tons of cargo. How many passengers depart from the airport every hour during the Christmas holidays?`, answer: (d) => Math.floor(d.christmasPlanes / d.hoursOpen) * d.passengersPerPlane},
        {text: (d) => `Compared with a normal day, how many more passengers depart from the airport in a day during the Christmas holidays?`, answer: (d) => (d.christmasPlanes - d.normalPlanes) * d.passengersPerPlane},
        {text: (d) => `During a normal day, there are ${d.normalLate} passengers in average that are late for their plane each day. However, during the Christmas holidays, there are ${d.christmasLate} passengers that are late for their planes each day which caused delays of ${d.delayedPlanes} planes. How many more passengers are late for their planes in each day during the Christmas holidays?`, answer: (d) => d.christmasLate - d.normalLate},
        {text: (d) => `The airport administration did a study and found that an additional ${d.delayPerPassengers} minutes of delay in the overall operation of the airport is caused for every ${d.latePassengersUnit} passengers that are late for their flights. What is the delay in the overall operation if there are ${d.totalLatePassengers} passengers late for their flights?`, answer: (d) => Math.floor(d.totalLatePassengers / d.latePassengersUnit) * d.delayPerPassengers},
        {text: (d) => `Write an equation using "x" and then solve the equation. On the New Year Eve, there were ${d.morningCargo} tons of cargo loaded in the morning. In the afternoon, there were x tons of cargos. The total weight of cargos loaded on the day weighed ${d.totalCargo} tons.`, answer: (d) => d.totalCargo - d.morningCargo, equation: (d) => `${d.morningCargo} + x = ${d.totalCargo}`}
      ],
      generateData: () => ({
        normalPlanes: randInt(250, 300),
        christmasPlanes: randInt(320, 360),
        hoursOpen: 12,
        passengersPerPlane: 240,
        cargoPerPlane: 12,
        normalLate: randInt(700, 800),
        christmasLate: randInt(1800, 1900),
        delayedPlanes: 14,
        delayPerPassengers: 5,
        latePassengersUnit: 32,
        totalLatePassengers: randInt(800, 900),
        morningCargo: randInt(7000, 8000),
        totalCargo: randInt(12000, 13000)
      })
    },
    {
      title: "Stadium Events",
      context: (data) => `A stadium has ${data.totalSeats} seats and ${data.vipBoxes} VIP boxes. The stadium is divided into ${data.totalSections} equal sections: ${data.premiumSections} premium sections and ${data.standardSections} standard sections. A seat at the premium section costs $${data.premiumPrice} per game. A seat at the standard section costs $${data.standardPrice} per game.`,
      questions: [
        {text: (d) => `How many seats are there in each section?`, answer: (d) => Math.floor(d.totalSeats / d.totalSections)},
        {text: (d) => `If there are ${d.seatsPerRow} seats in each row, how many rows are in each section?`, answer: (d) => Math.floor(Math.floor(d.totalSeats / d.totalSections) / d.seatsPerRow)},
        {text: (d) => `If all the seats in the premium section are sold out for a game, how much will the stadium get from those ticket sales?`, answer: (d) => Math.floor(d.totalSeats / d.totalSections) * d.premiumSections * d.premiumPrice},
        {text: (d) => `There are ${d.gamesPerSeason} games in each season. A season pass costs $${d.seasonPassPrice}. A season pass holder can go to all the games and have a seat in the premium section. How much can a fan save by buying the season pass?`, answer: (d) => (d.premiumPrice * d.gamesPerSeason) - d.seasonPassPrice},
        {text: (d) => `For the night game on Tuesday, ${d.ticketsSold} tickets were sold. How many tickets were left?`, answer: (d) => d.totalSeats - d.ticketsSold},
        {text: (d) => `Write an equation using "x" and then solve the equation. Each VIP box can seat x people. If all the seats and VIP boxes are filled up, there are ${d.totalCapacity} audience in the stadium.`, answer: (d) => Math.floor((d.totalCapacity - d.totalSeats) / d.vipBoxes), equation: (d) => `${d.totalSeats} + ${d.vipBoxes}x = ${d.totalCapacity}`}
      ],
      generateData: () => {
        const totalSeats = 10500;
        const vipBoxes = 8;
        const totalSections = 12;
        return {
          totalSeats,
          vipBoxes,
          totalSections,
          premiumSections: 2,
          standardSections: 10,
          premiumPrice: 48,
          standardPrice: 27,
          seatsPerRow: 35,
          gamesPerSeason: 50,
          seasonPassPrice: 2040,
          ticketsSold: randInt(8000, 8500),
          totalCapacity: totalSeats + (vipBoxes * randInt(14, 18))
        };
      }
    },
    {
      title: "Library System",
      context: (data) => `A library has ${data.nonFiction} non-fiction books, ${data.fiction} fiction books and ${data.reference} reference books.`,
      questions: [
        {text: (d) => `All books, except the reference books, are available for loan. How many books are available for loan?`, answer: (d) => d.nonFiction + d.fiction},
        {text: (d) => `Reference books are for use in the library. There are ${d.bookshelves} bookshelves for the reference books. After use, they need to be returned to a special collection box for shelving. If ${d.inUse} reference books are in use and ${d.inBox} reference books are in the collection box, how many reference books are on the shelf?`, answer: (d) => d.reference - d.inUse - d.inBox},
        {text: (d) => `Each patron pays an annual fee of $${d.annualFee} to the library. If the library collects $${d.totalFees} from the annual fee, how many patrons are there?`, answer: (d) => Math.floor(d.totalFees / d.annualFee)},
        {text: (d) => `Each patron can borrow up to ${d.maxBorrow} books. If all the patrons are currently holding on to ${d.maxBorrow} books each, how many books are left in the library?`, answer: (d) => (d.nonFiction + d.fiction + d.reference) - (Math.floor(d.totalFees / d.annualFee) * d.maxBorrow)},
        {text: (d) => `Each patron can borrow the books for ${d.borrowWeeks} weeks and renew the loan twice. What is the maximum number of days can a patron keep the books he borrowed from the library?`, answer: (d) => d.borrowWeeks * 7 * 3},
        {text: (d) => `Write an equation using "x" and then solve the equation. The late fee for each day is $${d.lateFeePerDay}. A patron paid $${d.totalLateFee} for x books that are overdue for ${d.overdueDays} days.`, answer: (d) => Math.floor(d.totalLateFee / (d.lateFeePerDay * d.overdueDays)), equation: (d) => `x × ${d.lateFeePerDay} × ${d.overdueDays} = ${d.totalLateFee}`}
      ],
      generateData: () => ({
        nonFiction: 3489,
        fiction: 8617,
        reference: 1240,
        bookshelves: 16,
        inUse: 128,
        inBox: 84,
        annualFee: 36,
        totalFees: 20304,
        maxBorrow: 6,
        borrowWeeks: 2,
        lateFeePerDay: 2,
        totalLateFee: 72,
        overdueDays: 9
      })
    },
    {
      title: "Fitness Center",
      context: (data) => `A fitness center has a swimming pool and a gym. There are ${data.totalMembers} members in the fitness club. There are two kinds of membership: regular and VIP. Each regular member pays $${data.regularMonthly} per month and each VIP member pays $${data.vipYearly} per year.`,
      questions: [
        {text: (d) => `There are ${d.regularMembers} regular members. How many VIP members are there?`, answer: (d) => d.totalMembers - d.regularMembers},
        {text: (d) => `How much in membership fees does the fitness center receive from the regular members each month?`, answer: (d) => d.regularMembers * d.regularMonthly},
        {text: (d) => `How much more does a VIP member pay than a regular member over a year for the fitness center membership?`, answer: (d) => d.vipYearly - (d.regularMonthly * 12)},
        {text: (d) => `For every ${d.membersPerStaff} members, the fitness center must hire 1 staff member for the gym. How many staff members does the fitness center need to hire for the gym?`, answer: (d) => Math.floor(d.totalMembers / d.membersPerStaff)},
        {text: (d) => `The lifeguard on duty gets ${d.breakMinutes} minutes of breaks for every ${d.workHours} hours he works. How much break time does the lifeguard get during a ${d.shiftHours}-hour shift?`, answer: (d) => Math.floor(d.shiftHours / d.workHours) * d.breakMinutes},
        {text: (d) => `Write an equation using "x" and then solve the equation. During a promotion for the VIP membership program, the new VIP members received a discount of $x. ${d.newVipMembers} new VIP members signed up, and the gym received $${d.totalReceived} of membership fees from them.`, answer: (d) => d.vipYearly - Math.floor(d.totalReceived / d.newVipMembers), equation: (d) => `${d.newVipMembers} × (${d.vipYearly} - x) = ${d.totalReceived}`}
      ],
      generateData: () => ({
        totalMembers: 3924,
        regularMembers: 2915,
        regularMonthly: 25,
        vipYearly: 480,
        membersPerStaff: 30,
        breakMinutes: 10,
        workHours: 2,
        shiftHours: 6,
        newVipMembers: 34,
        totalReceived: 13260
      })
    }
  ];

  function generateWordProblemG5() {
    const scenario = WORD_PROBLEM_SCENARIOS_G5[Math.floor(Math.random() * WORD_PROBLEM_SCENARIOS_G5.length)];
    const data = scenario.generateData();
    
    return {
      type: 'word-problems-g5',
      scenario: scenario.title,
      context: scenario.context(data),
      questions: scenario.questions.map((q, idx) => ({
        text: q.text(data),
        answer: q.answer(data),
        equation: q.equation ? q.equation(data) : null,
        questionNumber: idx + 1
      })),
      currentQuestion: 0,
      answerType: 'number'
    };
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
        case 'word-problems-g1': return generateWordProblem(level || 1);
        case 'subtraction-word-problems-g1': return generateSubtractionWordProblem(level || 1);
        // Grade 5 topics
        case 'add-decimals': return generateAddDecimals();
        case 'add-decimals-missing': return generateAddDecimalsMissing();
        case 'add-2digit-decimals': return generateAdd2DigitDecimals();
        case 'add-3digit-decimals': return generateAdd3DigitDecimals();
        case 'add-2digit-missing': return generateAdd2DigitMissing();
        case 'add-2digit-missing-harder': return generateAdd2DigitMissingHarder();
        case 'add-columns': return generateAddColumns();
        case 'subtract-decimals': return generateSubtractDecimals();
        case 'subtract-decimals-missing': return generateSubtractDecimalsMissing();
        case 'subtract-2digit-decimals': return generateSubtract2DigitDecimals();
        case 'subtract-from-whole': return generateSubtractFromWhole();
        case 'subtract-columns': return generateSubtractColumns();
        case 'multiply-by-10-100': return generateMultiplyBy10Or100();
        case 'multiply-by-10-100-1000': return generateMultiplyBy10_100_1000();
        case 'multiply-3digit-by-powers': return generateMultiply3DigitByPowers();
        case 'multiply-powers-missing': return generateMultiplyPowersMissing();
        case 'multiply-3digit-missing': return generateMultiply3DigitMissing();
        case 'whole-x-1digit-decimal': return generateWholeX1DigitDecimal();
        case 'whole-x-1-2digit-decimal': return generateWholeX1_2DigitDecimal();
        case 'whole-x-1-2digit-harder': return generateWholeX1_2DigitHarder();
        case 'whole-x-decimal-missing': return generateWholeXDecimalMissing();
        case 'whole-x-2digit-missing': return generateWholeX2DigitMissing();
        case 'multiply-decimal-by-decimal': return generateMultiplyDecimalByDecimal();
        case 'multiply-decimals-missing': return generateMultiplyDecimalsMissing();
        case 'multiply-decimals-whole-columns': return generateMultiplyDecimalsWholeColumns();
        case 'multiply-1digit-columns': return generateMultiply1DigitColumns();
        case 'multiply-2digit-columns': return generateMultiply2DigitColumns();
        case 'missing-addends-3terms': return generateMissingAddends3Terms();
        case 'missing-addends-4plus': return generateMissingAddends4Plus();
        case 'missing-addends-mental': return generateMissingAddendsMental();
        case 'adding-4numbers-columns': return generateAdding4NumbersColumns();
        case 'adding-5numbers-columns': return generateAdding5NumbersColumns();
        case 'adding-large-4addends': return generateAddingLarge4Addends();
        case 'adding-large-6addends': return generateAddingLarge6Addends();
        case 'missing-minuend-subtrahend': return generateMissingMinuendSubtrahend();
        case 'subtract-large-columns': return generateSubtractLargeColumns();
        case 'word-problems-g5': return generateWordProblemG5();
        default: return generateAddition();
      }
    },
    helpers:{gcd,simplify,toFractionString}
  }
})();
