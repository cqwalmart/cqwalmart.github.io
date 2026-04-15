import matrixData from './legacy/shanghai-quiz/v4.1-matrix-data.json' with { type: 'json' };

const RESULT_META = {
  '复旦大学': {
    subtitle: '读过、想过，也不急着把一切都换算成有用。',
    summary: '你身上更像有一种读书人气和文化底子。',
    reason: '你在意的不只是会不会做、快不快懂，而是东西有没有真的长进自己身上，人有没有被阅读、见识和精神生活慢慢养厚。',
  },
  '上海交通大学': {
    subtitle: '强、能做、能带，也认更高的平台和位置。',
    summary: '你更像那种把复杂东西真正弄起来的人。',
    reason: '你不只是认硬度，也认项目感、推进感和带队感。你更容易被那种有工程型魅力、能做成事、还能把人和资源一起带起来的路径打动。',
  },
  '上海科技大学': {
    subtitle: '往未知和非标准环境里长。',
    summary: '你对标准模板的依赖比较低。',
    reason: '你更吃探索、自驱、非标准路径和兴趣深挖，不太满足于照着一套普通大学剧本过完四年。',
  },
  '同济大学': {
    subtitle: '有体系地持续折腾，被工程训练磨出来。',
    summary: '你像那种愿意在结构里长期练功的人。',
    reason: '你对训练感、推进感、项目感更有耐心，也更容易相信很多东西要在持续磨合里做出来。',
  },
  '华东师范大学': {
    subtitle: '顺着理解，也顺着把人过顺。',
    summary: '你很在意学习和生活是不是一起长。',
    reason: '你既在意东西是不是顺着自己进来，也在意人是不是被这套日子过得太拧巴、太干。',
  },
  '上海财经大学': {
    subtitle: '方向、路径、以后怎么站住。',
    summary: '你对投入产出和落点很敏感。',
    reason: '你不太愿意白花力气，更会想清楚这件事值不值、通向哪里、最后能不能把自己放到更清楚的位置上。',
  },
  '上海外国语大学': {
    subtitle: '交流质量、语境和互动感。',
    summary: '你对相处里的来回和语感很敏感。',
    reason: '你很看重聊不聊得进去、互动里有没有感觉、关系是不是自然流动，而不是只靠硬推。',
  },
  '华东政法大学': {
    subtitle: '判断、分寸、站位。',
    summary: '你对人和事能不能站得住很敏感。',
    reason: '你不只是想做事，还会在意怎么判断、怎么拿捏、怎么把自己放到一个说得住的位置上。',
  },
  '上海大学': {
    subtitle: '不是最标准，但能活、能拎、能长。',
    summary: '你更像那种在混杂里找自己活路的人。',
    reason: '你未必想按最标准的模板活，但也不甘心躺平，更像会在现实里一边扛一边慢慢长出自己的路。',
  },
  '华东理工大学': {
    subtitle: '低调稳、耐干、顶用、靠谱。',
    summary: '你对"真能顶事"特别敏感。',
    reason: '你不太吃虚的，更信长期稳定、补强、落地和硬度，也更容易尊重真正做得出来、靠得住的人。',
  },
  '东华大学': {
    subtitle: '状态、质感、样子、生活方式要对。',
    summary: '你不想把日子过得太糙。',
    reason: '你很在意状态和生活方式是不是对味，也在意关系、节奏和日常有没有让人真的舒服。',
  },
  '上海纽约大学': {
    subtitle: '另一种人生排法、另一套生活节奏。',
    summary: '你更容易被非模板的人生吸过去。',
    reason: '你不太满足于普通路径，更容易被新秩序、新环境和一种"原来还能这样活"的感觉打中。',
  },
};

const introScreen = document.getElementById('screen-intro');
const quizScreen = document.getElementById('screen-quiz');
const resultScreen = document.getElementById('screen-result');
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const questionTag = document.getElementById('question-tag');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressLabel = document.getElementById('progress-label');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const resultTitle = document.getElementById('result-title');
const resultSubtitle = document.getElementById('result-subtitle');
const resultMatch = document.getElementById('result-match');
const resultSummary = document.getElementById('result-summary');
const resultReason = document.getElementById('result-reason');
const runnerUpTitle = document.getElementById('runner-up-title');
const runnerUpMatch = document.getElementById('runner-up-match');
const runnerUpGap = document.getElementById('runner-up-gap');
const resultAlgo = document.getElementById('result-algo');
const rankingList = document.getElementById('ranking-list');

const schoolOrder = matrixData.schoolOrder;
const questions = matrixData.questions.map((q) => ({
  ...q,
  options: Object.entries(q.options).map(([label, vector]) => ({ label, vector })),
}));

function computeConstants() {
  const maxPool = Array(schoolOrder.length).fill(0);
  const mean = Array(schoolOrder.length).fill(0);
  const variance = Array(schoolOrder.length).fill(0);

  for (const q of questions) {
    const options = q.options.map((option) => option.vector.map((value) => value * q.weight));
    for (let i = 0; i < schoolOrder.length; i += 1) {
      const values = options.map((opt) => opt[i]);
      const m = values.reduce((sum, value) => sum + value, 0) / values.length;
      mean[i] += m;
      variance[i] += values.reduce((sum, value) => sum + (value - m) ** 2, 0) / values.length;
      maxPool[i] += Math.max(...values);
    }
  }

  return schoolOrder.reduce((acc, school, index) => {
    acc[school] = {
      maxPool: maxPool[index],
      mean: mean[index],
      sd: Math.sqrt(variance[index]),
    };
    return acc;
  }, {});
}

const constants = computeConstants();
let currentIndex = 0;
let answers = Array(questions.length).fill(null);
let rawScores = makeEmptyScores();
let optionOrderCache = {};

function makeEmptyScores() {
  return schoolOrder.reduce((acc, school) => {
    acc[school] = 0;
    return acc;
  }, {});
}

function clearInteractionState() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function showScreen(screen) {
  clearInteractionState();
  [introScreen, quizScreen, resultScreen].forEach((node) => node.classList.remove('screen-active'));
  screen.classList.add('screen-active');
}

function resetQuiz() {
  currentIndex = 0;
  answers = Array(questions.length).fill(null);
  rawScores = makeEmptyScores();
  optionOrderCache = {};
}

function updateProgress() {
  const current = currentIndex + 1;
  const total = questions.length;
  const percent = Math.round((current / total) * 100);
  progressLabel.textContent = `第 ${current} 题 / 共 ${total} 题`;
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getOrderedOptions(question) {
  if (!optionOrderCache[question.id]) {
    optionOrderCache[question.id] = shuffleArray(question.options.map((option) => option.label));
  }
  const optionMap = new Map(question.options.map((option) => [option.label, option]));
  return optionOrderCache[question.id]
    .map((label) => optionMap.get(label))
    .filter(Boolean);
}

function renderQuestion() {
  clearInteractionState();
  const question = questions[currentIndex];
  const selected = answers[currentIndex];
  const orderedOptions = getOrderedOptions(question);
  questionTag.textContent = `第 ${question.id} 题`;
  questionText.textContent = question.text;
  optionsContainer.innerHTML = '';

  orderedOptions.forEach((option, displayIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `option-btn${selected === option.label ? ' option-btn-selected' : ''}`;
    const displayLabel = String.fromCharCode(65 + displayIndex);
    button.innerHTML = `
      <span class="option-row">
        <span class="option-label">${displayLabel}</span>
        <span class="option-text">${getOptionText(question.id, option.label)}</span>
      </span>
    `;
    const clearFocus = (event) => {
      event.currentTarget.blur();
    };
    button.addEventListener('mouseup', clearFocus);
    button.addEventListener('touchend', clearFocus, { passive: true });
    button.addEventListener('click', (event) => {
      event.currentTarget.blur();
      handleAnswer(option.label);
    });
    optionsContainer.appendChild(button);
  });

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = !answers[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  nextBtn.classList.toggle('hidden', isLast);
  submitBtn.classList.toggle('hidden', !isLast);
  submitBtn.disabled = !answers[currentIndex];

  updateProgress();
}

function getOptionText(questionId, label) {
  const texts = OPTION_TEXT[questionId];
  return texts?.[label] || label;
}

function recomputeScores() {
  rawScores = makeEmptyScores();
  answers.forEach((label, index) => {
    if (!label) return;
    const vector = questions[index].options.find((opt) => opt.label === label)?.vector || [];
    vector.forEach((value, sIndex) => {
      rawScores[schoolOrder[sIndex]] += value;
    });
  });
}

function handleAnswer(label) {
  answers[currentIndex] = label;
  recomputeScores();
  const isLast = currentIndex === questions.length - 1;
  if (!isLast) {
    currentIndex += 1;
    window.setTimeout(() => {
      renderQuestion();
    }, 80);
    return;
  }
  renderQuestion();
}

function computeMixScores() {
  return schoolOrder
    .map((school) => {
      const raw = rawScores[school] || 0;
      const meta = constants[school];
      const z = meta.sd ? (raw - meta.mean) / meta.sd : 0;
      const rc = meta.maxPool ? (raw - meta.mean) / meta.maxPool : 0;
      const mix = 0.75 * z + 0.25 * rc;
      return { school, raw, z, rc, mix };
    })
    .sort((a, b) => b.mix - a.mix);
}

function mixToPercent(mix) {
  const sigmoid = 1 / (1 + Math.exp(-1.55 * (mix - 0.85)));
  return Math.round(15 + 80 * sigmoid);
}

function clampPercent(value) {
  return Math.max(15, Math.min(95, Math.round(value)));
}

function renderResult() {
  const ranking = computeMixScores();
  const top = ranking[0];
  const second = ranking[1];
  const meta = RESULT_META[top.school];
  const topPercent = clampPercent(mixToPercent(top.mix));

  resultTitle.textContent = top.school;
  resultSubtitle.textContent = meta.subtitle;
  resultMatch.textContent = `${topPercent}%`;
  resultSummary.textContent = meta.summary;
  resultReason.textContent = meta.reason;
  runnerUpTitle.textContent = second ? second.school : '-';
  runnerUpMatch.textContent = second ? `气质匹配率 ${clampPercent(mixToPercent(second.mix))}%` : '';
  runnerUpGap.textContent = '';
  resultAlgo.textContent = '匹配率为展示映射值，用来帮助理解结果强弱，不代表录取概率。';

  rankingList.innerHTML = '';
  ranking.slice(0, 5).forEach((item, index) => {
    const li = document.createElement('li');
    const percent = clampPercent(mixToPercent(item.mix));
    li.textContent = `${index + 1}. ${item.school} · ${percent}%`;
    rankingList.appendChild(li);
  });
}

function finishQuiz() {
  renderResult();
  showScreen(resultScreen);
}

startBtn.addEventListener('click', () => {
  resetQuiz();
  renderQuestion();
  showScreen(quizScreen);
});

retryBtn.addEventListener('click', () => {
  resetQuiz();
  showScreen(introScreen);
});

prevBtn.addEventListener('click', () => {
  if (currentIndex === 0) return;
  currentIndex -= 1;
  renderQuestion();
});

nextBtn.addEventListener('click', () => {
  if (!answers[currentIndex]) return;
  if (currentIndex >= questions.length - 1) return;
  currentIndex += 1;
  renderQuestion();
});

submitBtn.addEventListener('click', () => {
  if (currentIndex !== questions.length - 1) return;
  if (!answers[currentIndex]) return;
  finishQuiz();
});

const OPTION_TEXT = {
  1: { A: '很多东西学过了，但过两天又跟没学一样', B: '每天都在赶，很多东西只能应付了事，本来多点时间就能搞明白', C: '从早学到晚也没停过，但整个人一直像吊着一口气', D: '学也在学、做也在做，但越来越想不明白为什么一定要按这套来' },
  2: { A: '下次状态好一点，应该就不会这样了', B: '先看看到底是哪几个知识点没掌握住', C: '我怎么又错这种本来不该错的东西', D: '这次确实难，我现在大概也就这个水平' },
  3: { A: '觉得这种地方就该下功夫练，练多了总能拉开', B: '先想别在这种地方犯低级错，能拿的先拿住', C: '先想清楚，这块到底值不值得我压这么多时间', D: '先看自己能不能真的吃透，再决定要不要把它放进现在这套节奏里' },
  4: { A: '一点点来，慢慢吃透，学过的东西最好真能留住', B: '按部就班、科学一点，知道这一步该干嘛、下一步该干嘛', C: '别搞得太死，劳逸结合一点，状态好了反而吸收更快也更省时间', D: '多给点自己探索的空间，或者换点不一样的上课方式，我反而更容易学进去' },
  5: { A: '跟别人聊起来时，发现自己是真的知道，不是只会做题', B: '真开始做点事时，发现以前学的那些基础一下就能派上用场', C: '某天突然把一块东西想通时，会发现前面学的内容一下全串起来了', D: '回头看时，发现之前那些努力，确实把自己往更高的地方推了一点' },
  6: { A: '只要肯啃，最后大多还是能摸进去', B: '能跟上，但通常得花不少力气稳住', C: '先尽量别掉队，真特别深的就不硬拧', D: '有时候不是不会，是根本不想把劲全花在这个上面' },
  7: { A: '先做自己比较擅长的，先把状态做起来再说', B: '先看哪些最关键、最值，把力气优先放在这些地方', C: '先估下时间，别一上来就把整晚全砸进去', D: '先把该应付的应付完，剩下再说别的' },
  8: { A: '要是刚好是自己感兴趣的，会愿意多花时间往深了弄', B: '先看值不值得花这么多时间，值的话就狠狠干', C: '根据自己现在的水平先抓大头，顺便补最缺的地方', D: '差不多知道思路就行，把时间留给别的更重要的东西' },
  9: { A: '自己看书、自己钻，或者跟同学来回讨论，非得把它弄通', B: '去找资料、看网课、记笔记，把这块重新补一遍', C: '先放着，别让这一门把整个人拖住，等后面状态对了再补', D: '有不会的就尽快去问老师，把卡住的地方及时弄掉' },
  10: { A: '靠自己的努力做成了一些事，离想要的目标更近了', B: '见过更多东西，经历过更多事，看问题也更开了', C: '认识了很多重要的人，也慢慢学会怎么跟人相处和合作', D: '做过一些大胆的新尝试，知道人生原来不只一种活法' },
  11: { A: '当时很多东西其实都没真弄懂，只是一路先做过去了', B: '该学的也学了，可真要自己上手做点什么，还是拿不出来', C: '一直把自己绷得太紧，最后整个人越过越累', D: '一路都按别人说的往前走，最后发现那根本不是自己想要的' },
  12: { A: '能把一个东西从头到尾慢慢学明白，不用总是赶着往下做', B: '有机会多做点项目、比赛或者别的事，别学了半天还是只会写题', C: '时间别总被排满，能有点自己的节奏，把人慢慢缓过来', D: '能接触点新东西、新方向，不然我到现在都不知道自己到底适合什么' },
  13: { A: '你学校里分数蛮高的，怎么很多东西其实啥都不懂', B: '你懂得也蛮多的，怎么一到真要做事的时候就做不出来', C: '你好的时候是蛮好的，怎么心态那么容易崩', D: '感觉你一直都好认真，但你好像也没什么方向和想法' },
  14: { A: '他不是靠机械刷题才成绩好的，是真的脑子里有东西', B: '他实力就是强，真碰到事也是团队大腿', C: '他整个人就是很稳，跟他待一块会有种放心的感觉', D: '他创造力很强，身上总能带来一些变数和转机' },
  15: { A: '平时在同学、社团、部门、活动里老能碰到，慢慢就熟了', B: '会单独约出来，自习、散步、吃饭这种，一来二去就近了', C: '先在线上聊天、分享东西，聊着聊着熟起来的', D: '朋友带着一起玩、一起聚，见的次数多了慢慢就对味了' },
  16: { A: '就在校园里待着，吃饭、散步、随便走走，轻轻松松地一起待会儿', B: '两个人待在一块，各做各的事，偶尔聊两句也很自然', C: '一起去试点新东西，逛逛、看看、出去换换空气', D: '更在意那种一对一认真约出来的感觉，安排、氛围、互动都得有点意思' },
};

showScreen(introScreen);
