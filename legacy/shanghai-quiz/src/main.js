import { SCHOOL_RESULTS, HIDDEN_RESULTS, ALL_RESULT_META } from "./data/results.js";
import v3Questions from "./data/v3-questions.generated.json" with { type: "json" };

const questions = v3Questions.map((question, index) => ({
  ...question,
  tag: question.tag || `v3 正式题 ${index + 1}`,
  options: question.options.map((option) => ({
    label: option.label,
    text: option.text,
    vector: option.vector,
  })),
}));

const SCORING_CONSTANTS = {
  fudan: { maxPool: 72.816, mean: 18.724, sd: 6.353468 },
  sjtu: { maxPool: 79.032, mean: 19.758, sd: 6.836192 },
  sst: { maxPool: 68.732, mean: 21.694, sd: 5.950112 },
  tongji: { maxPool: 52.116, mean: 13.029, sd: 4.711645 },
  ecnu: { maxPool: 70.928, mean: 23.31, sd: 5.860901 },
  sufe: { maxPool: 55.04, mean: 13.94, sd: 6.712966 },
  sisu: { maxPool: 37.396, mean: 9.985, sd: 5.879877 },
  ecupl: { maxPool: 55.976, mean: 15.511, sd: 5.640521 },
  shu: { maxPool: 63.028, mean: 21.982, sd: 5.744779 },
  ecust: { maxPool: 70.516, mean: 17.829, sd: 6.143168 },
  dhu: { maxPool: 69.268, mean: 21.195, sd: 5.701066 },
  nyush: { maxPool: 71.488, mean: 18.17, sd: 5.871018 },
  abroad: { maxPool: 17.456, mean: 4.364, sd: 2.159497 },
  resting: { maxPool: 4.48, mean: 1.12, sd: 1.371714 },
  business: { maxPool: 4.48, mean: 1.12, sd: 1.371714 },
  artdrop: { maxPool: 10.28, mean: 2.57, sd: 1.859113 },
  alien: { maxPool: 0, mean: 0, sd: 0 },
};

const introScreen = document.getElementById("screen-intro");
const quizScreen = document.getElementById("screen-quiz");
const resultScreen = document.getElementById("screen-result");

const startBtn = document.getElementById("start-btn");
const retryBtn = document.getElementById("retry-btn");

const questionTag = document.getElementById("question-tag");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const progressLabel = document.getElementById("progress-label");
const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progress-fill");

const resultTitle = document.getElementById("result-title");
const resultSubtitle = document.getElementById("result-subtitle");
const resultSummary = document.getElementById("result-summary");
const resultReason = document.getElementById("result-reason");
const runnerUpTitle = document.getElementById("runner-up-title");

const schoolKeys = Object.keys(SCHOOL_RESULTS);
const hiddenKeys = Object.keys(HIDDEN_RESULTS);
const allKeys = [...schoolKeys, ...hiddenKeys];

let currentIndex = 0;
let answers = [];
let rawScores = {};

function makeEmptyScores() {
  return allKeys.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
}

function showScreen(screen) {
  [introScreen, quizScreen, resultScreen].forEach((node) => {
    node.classList.remove("screen-active");
  });
  screen.classList.add("screen-active");
}

function resetQuiz() {
  currentIndex = 0;
  answers = [];
  rawScores = makeEmptyScores();
}

function updateProgress() {
  const current = currentIndex + 1;
  const total = questions.length;
  const percent = Math.round((current / total) * 100);
  progressLabel.textContent = `第 ${current} 题 / 共 ${total} 题`;
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

function renderQuestion() {
  const question = questions[currentIndex];
  questionTag.textContent = question.tag;
  questionText.textContent = question.text;
  optionsContainer.innerHTML = "";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.innerHTML = `
      <span class="option-row">
        <span class="option-label">${option.label}</span>
        <span class="option-text">${option.text}</span>
      </span>
    `;
    button.addEventListener("click", () => handleAnswer(option));
    optionsContainer.appendChild(button);
  });

  updateProgress();
}

function handleAnswer(option) {
  answers.push({ questionId: questions[currentIndex].id, option: option.label });

  option.vector.forEach((value, index) => {
    const key = allKeys[index];
    if (key) {
      rawScores[key] += value * questions[currentIndex].weight;
    }
  });

  currentIndex += 1;
  if (currentIndex >= questions.length) {
    finishQuiz();
    return;
  }

  renderQuestion();
}

function computeSchoolMixScores() {
  return schoolKeys.map((key) => {
    const constants = SCORING_CONSTANTS[key];
    const raw = rawScores[key] ?? 0;
    const zScore = constants.sd ? (raw - constants.mean) / constants.sd : 0;
    const rawCentered = constants.maxPool ? (raw - constants.mean) / constants.maxPool : 0;
    const mixScore = 0.75 * zScore + 0.25 * rawCentered;

    return {
      key,
      raw,
      zScore,
      rawCentered,
      mixScore,
    };
  }).sort((a, b) => b.mixScore - a.mixScore);
}

function computeHiddenScores() {
  return hiddenKeys.map((key) => {
    const constants = SCORING_CONSTANTS[key];
    const raw = rawScores[key] ?? 0;
    const zScore = constants.sd ? (raw - constants.mean) / constants.sd : 0;
    return { key, raw, zScore };
  }).sort((a, b) => b.raw - a.raw);
}

function getFinalResult() {
  const sortedSchools = computeSchoolMixScores();
  const sortedHidden = computeHiddenScores();

  const topSchool = sortedSchools[0];
  const runnerUpSchool = sortedSchools[1] || null;
  const topHidden = sortedHidden[0] || null;

  const shouldUseHidden =
    topHidden && topHidden.key !== "alien" && topHidden.raw >= 10 && topHidden.raw >= topSchool.raw * 0.7;

  return {
    finalKey: shouldUseHidden ? topHidden.key : topSchool.key,
    runnerUpKey: shouldUseHidden ? topSchool.key : runnerUpSchool?.key ?? null,
    schoolRanking: sortedSchools,
    hiddenRanking: sortedHidden,
  };
}

function renderResult() {
  const { finalKey, runnerUpKey } = getFinalResult();
  const meta = ALL_RESULT_META[finalKey];
  const runnerUpMeta = runnerUpKey ? ALL_RESULT_META[runnerUpKey] : null;

  resultTitle.textContent = meta.title;
  resultSubtitle.textContent = meta.subtitle || "";
  resultSummary.textContent = meta.summary || "待补";
  resultReason.textContent = meta.reason || "待补";
  runnerUpTitle.textContent = runnerUpMeta ? runnerUpMeta.title : "-";
}

function finishQuiz() {
  renderResult();
  showScreen(resultScreen);
}

startBtn.addEventListener("click", () => {
  resetQuiz();
  renderQuestion();
  showScreen(quizScreen);
});

retryBtn.addEventListener("click", () => {
  resetQuiz();
  showScreen(introScreen);
});

resetQuiz();
