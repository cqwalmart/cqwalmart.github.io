import { questions } from "./data/questions.js";
import { SCHOOL_RESULTS, HIDDEN_RESULTS, ALL_RESULT_META } from "./data/results.js";

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

let currentIndex = 0;
let answers = [];
let scores = {};

function makeEmptyScores() {
  return [...schoolKeys, ...hiddenKeys].reduce((acc, key) => {
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
  scores = makeEmptyScores();
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

  Object.entries(option.scores).forEach(([key, value]) => {
    scores[key] += value;
  });

  currentIndex += 1;
  if (currentIndex >= questions.length) {
    finishQuiz();
    return;
  }

  renderQuestion();
}

function getSortedEntries(keys) {
  return [...keys]
    .map((key) => [key, scores[key]])
    .sort((a, b) => b[1] - a[1]);
}

function getFinalResult() {
  const sortedSchools = getSortedEntries(schoolKeys);
  const sortedHidden = getSortedEntries(hiddenKeys);

  const [topSchoolKey, topSchoolScore] = sortedSchools[0];
  const [runnerUpSchoolKey] = sortedSchools[1] || [null];
  const [topHiddenKey, topHiddenScore] = sortedHidden[0];

  const shouldUseHidden =
    topHiddenScore >= 10 && topHiddenScore >= topSchoolScore * 0.7;

  const finalKey = shouldUseHidden ? topHiddenKey : topSchoolKey;
  const runnerUpKey = shouldUseHidden ? topSchoolKey : runnerUpSchoolKey;

  return {
    finalKey,
    runnerUpKey,
    topSchoolScore,
    topHiddenScore,
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
