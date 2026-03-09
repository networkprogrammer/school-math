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
        default: return generateAddition();
      }
    },
    helpers:{gcd,simplify,toFractionString}
  }
})();
