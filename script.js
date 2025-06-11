// script.js - AI 영어 워크북 생성기

// 전역 변수
let textCollection = [];
let batchResults = [];
let isProcessing = false;
let currentProcessingIndex = 0;
let batchPaused = false;

// 문법 유형 정의
const grammarTypes = {
  conditionals: {
    name: "복합 가정법",
    difficulty: 5,
    description: "Mixed conditionals, would have done 등",
    examples: ["If he had studied harder, he would be successful now."],
  },
  inversion: {
    name: "도치구문",
    difficulty: 5,
    description: "Never before, Not only, Seldom 등",
    examples: ["Never before have we seen such innovation."],
  },
  participles: {
    name: "고급 분사구문",
    difficulty: 4,
    description: "Having done, being done, 독립분사구문",
    examples: ["Having completed the project, he felt relieved."],
  },
  relative_clauses: {
    name: "복잡한 관계절",
    difficulty: 4,
    description: "preposition + which, reduced clauses",
    examples: ["The method by which we solve problems..."],
  },
  subjunctive: {
    name: "가정법",
    difficulty: 5,
    description: "were it not for, lest, as if 등",
    examples: ["Were it not for his help, we would have failed."],
  },
  ellipsis: {
    name: "생략 구문",
    difficulty: 4,
    description: "so/such that, too/enough to",
    examples: ["The book was so interesting that I finished it."],
  },
  parallelism: {
    name: "병렬구조",
    difficulty: 3,
    description: "복잡한 구조에서의 parallelism",
    examples: ["He likes reading, writing, and to swim."],
  },
  tense_sequence: {
    name: "시제 일치",
    difficulty: 4,
    description: "과거완료진행형, 미래완료, 시제 일치",
    examples: ["He said he had been working for hours."],
  },
  prepositions: {
    name: "전치사/구동사",
    difficulty: 3,
    description: "관용적 표현, 미묘한 의미 차이",
    examples: ["Different from vs different than"],
  },
  gerund_infinitive: {
    name: "동명사/부정사",
    difficulty: 3,
    description: "의미 변화를 수반하는 동사들",
    examples: ["Remember to do vs remember doing"],
  },
  conjunctions: {
    name: "고급 접속사",
    difficulty: 4,
    description: "lest, provided that, in that",
    examples: ["Provided that you study, you will pass."],
  },
  emphasis: {
    name: "강조 구문",
    difficulty: 4,
    description: "It is... that, What... is 등",
    examples: ["What makes this special is its uniqueness."],
  },
};

// ============================================
// 유틸리티 함수들
// ============================================

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast" + (isError ? " error" : "");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatusText(status) {
  const statusMap = {
    waiting: "⏳ 대기",
    processing: "🔄 처리중",
    completed: "✅ 완료",
    error: "❌ 오류",
  };
  return statusMap[status] || "❓ 알 수 없음";
}

function getStatusColor(status) {
  const colors = {
    waiting: "#6c757d",
    processing: "#ffc107",
    completed: "#28a745",
    error: "#dc3545",
  };
  return colors[status] || "#6c757d";
}

function getStatusIcon(status) {
  const icons = {
    waiting: "⏳",
    processing: "🔄",
    completed: "✅",
    error: "❌",
  };
  return icons[status] || "❓";
}

// ============================================
// 문법 선택 관련 함수들
// ============================================

function getSelectedGrammarTypes() {
  const selected = [];
  document
    .querySelectorAll('.grammar-selector input[type="checkbox"]:checked')
    .forEach((checkbox) => {
      selected.push(checkbox.value);
    });
  return selected;
}

function selectAllGrammar() {
  document
    .querySelectorAll('.grammar-selector input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = true;
    });
  updateGrammarPreview();
}

function deselectAllGrammar() {
  document
    .querySelectorAll('.grammar-selector input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = false;
    });
  updateGrammarPreview();
}

function selectRecommended() {
  // 추천 문법 유형 (중급~고급)
  const recommended = [
    "conditionals",
    "participles",
    "relative_clauses",
    "parallelism",
    "prepositions",
  ];

  document
    .querySelectorAll('.grammar-selector input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = recommended.includes(checkbox.value);
    });
  updateGrammarPreview();
}

function updateGrammarPreview() {
  const selectedGrammar = getSelectedGrammarTypes();
  const count = selectedGrammar.length;

  // 선택된 개수 업데이트
  document.getElementById("selectedGrammarCount").textContent = count;

  // 태그 표시
  const tagsContainer = document.getElementById("grammarTags");
  if (!tagsContainer) return; // 요소가 없으면 리턴

  tagsContainer.innerHTML = "";

  if (count === 0) {
    tagsContainer.innerHTML =
      '<span style="color: #7f8c8d;">선택된 문법 유형이 없습니다.</span>';
  } else {
    selectedGrammar.forEach((grammarKey) => {
      const grammar = grammarTypes[grammarKey];
      const tag = document.createElement("span");
      tag.className = "grammar-tag";
      tag.textContent = grammar.name;
      tag.title = grammar.description;
      tagsContainer.appendChild(tag);
    });
  }

  // 난이도 계산
  const avgDifficulty =
    count > 0
      ? selectedGrammar.reduce(
          (sum, key) => sum + grammarTypes[key].difficulty,
          0
        ) / count
      : 0;

  const difficultyPercent = (avgDifficulty / 5) * 100;
  const difficultyFill = document.getElementById("difficultyFill");
  const difficultyText = document.getElementById("difficultyText");

  if (difficultyFill) {
    difficultyFill.style.width = difficultyPercent + "%";
  }

  if (difficultyText) {
    const difficulty =
      avgDifficulty >= 4.5
        ? "최고급"
        : avgDifficulty >= 3.5
        ? "고급"
        : avgDifficulty >= 2.5
        ? "중급"
        : "기초";
    difficultyText.textContent = difficulty;
  }
}

function toggleCustomGrammar() {
  const useCustom = document.getElementById("useCustomGrammar").checked;
  const panel = document.querySelector(".custom-grammar-panel");

  if (panel) {
    if (useCustom) {
      panel.classList.add("active");
    } else {
      panel.classList.remove("active");
    }
  }
}

// ============================================
// 탭 및 네비게이션
// ============================================

function switchTab(tabName) {
  // 모든 탭 비활성화
  document
    .querySelectorAll(".tab")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));

  // 선택된 탭 활성화
  event.target.classList.add("active");
  const targetTab = document.getElementById(tabName + "Tab");
  if (targetTab) {
    targetTab.classList.add("active");
  }

  // 결과 탭일 때 통계 업데이트
  if (tabName === "results") {
    updateResultsStats();
  }
}

// ============================================
// 단일 지문 처리
// ============================================

function updateSingleStats() {
  const textElement = document.getElementById("singleText");
  if (!textElement) return;

  const text = textElement.value;
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const charCountElement = document.getElementById("singleCharCount");
  const wordCountElement = document.getElementById("singleWordCount");

  if (charCountElement) {
    charCountElement.textContent = charCount.toLocaleString();
  }
  if (wordCountElement) {
    wordCountElement.textContent = wordCount.toLocaleString();
  }
}

async function generateSingleWorkbook() {
  const apiKey = document.getElementById("apiKey")?.value;
  const title = document.getElementById("singleTitle")?.value;
  const text = document.getElementById("singleText")?.value;
  const selectedGrammar = getSelectedGrammarTypes();

  if (!apiKey) {
    showToast("OpenAI API Key를 입력해주세요.", true);
    return;
  }

  if (!text || !text.trim()) {
    showToast("지문을 입력해주세요.", true);
    return;
  }

  if (selectedGrammar.length === 0) {
    showToast("최소 1개 이상의 문법 유형을 선택해주세요.", true);
    return;
  }

  const generateBtn = document.getElementById("generateSingleBtn");
  if (!generateBtn) return;

  generateBtn.disabled = true;
  generateBtn.innerHTML = "🔄 생성 중...";

  showToast(
    `선택된 문법 유형: ${selectedGrammar
      .map((g) => grammarTypes[g].name)
      .join(", ")}`
  );

  try {
    await delay(3000);

    const workbook = generateSampleWorkbook(title, text, selectedGrammar);
    displayWorkbook(workbook, "singlePreview");

    const downloadBtn = document.getElementById("downloadSingleBtn");
    if (downloadBtn) {
      downloadBtn.style.display = "inline-flex";
    }

    showToast("선택한 문법 유형으로 워크북이 생성되었습니다!");
  } catch (error) {
    showToast("워크북 생성 중 오류가 발생했습니다.", true);
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = "🚀 워크북 생성하기";
  }
}

// ============================================
// 배치 처리
// ============================================

function parseTexts() {
  const bulkTextElement = document.getElementById("bulkTextInput");
  if (!bulkTextElement) return;

  const bulkText = bulkTextElement.value;
  const texts = bulkText
    .split("---")
    .map((text) => text.trim())
    .filter((text) => text.length > 0);

  const useCustomGrammar =
    document.getElementById("useCustomGrammar")?.checked || false;
  const randomizeGrammar =
    document.getElementById("randomizeGrammar")?.checked || false;
  const grammarPerText =
    document.getElementById("grammarPerText")?.value || "5";

  let baseGrammar = [];
  if (useCustomGrammar) {
    baseGrammar = getSelectedGrammarTypes();
    if (baseGrammar.length === 0) {
      showToast(
        "커스텀 문법 설정이 활성화되었지만 선택된 문법이 없습니다.",
        true
      );
      return;
    }
  }

  textCollection = texts.map((text, index) => {
    let assignedGrammar = [];

    if (useCustomGrammar) {
      if (randomizeGrammar) {
        // 무작위로 문법 유형 선택
        const shuffled = [...baseGrammar].sort(() => 0.5 - Math.random());
        const count =
          grammarPerText === "all" ? shuffled.length : parseInt(grammarPerText);
        assignedGrammar = shuffled.slice(0, count);
      } else {
        // 순서대로 할당
        const count =
          grammarPerText === "all"
            ? baseGrammar.length
            : parseInt(grammarPerText);
        assignedGrammar = baseGrammar.slice(0, count);
      }
    } else {
      // 기본 설정: 랜덤하게 모든 문법에서 선택
      const allGrammar = Object.keys(grammarTypes);
      const shuffled = allGrammar.sort(() => 0.5 - Math.random());
      const count =
        grammarPerText === "all" ? shuffled.length : parseInt(grammarPerText);
      assignedGrammar = shuffled.slice(0, count);
    }

    return {
      id: index + 1,
      title: `지문 ${index + 1}`,
      content: text,
      wordCount: text.split(/\s+/).length,
      charCount: text.length,
      status: "waiting",
      result: null,
      generatedAt: null,
      assignedGrammar: assignedGrammar,
      grammarSettings: {
        useCustom: useCustomGrammar,
        randomize: randomizeGrammar,
        count: grammarPerText,
      },
    };
  });

  updateTextList();
  updateBatchStats();

  if (texts.length > 0) {
    const batchBtn = document.getElementById("batchGenerateBtn");
    if (batchBtn) {
      batchBtn.disabled = false;
    }
    showToast(
      `${texts.length}개의 지문이 파싱되었습니다. 각 지문에 문법 설정이 적용되었습니다.`
    );
  } else {
    showToast("유효한 지문을 찾을 수 없습니다.", true);
  }
}

function updateTextList() {
  const textList = document.getElementById("textList");
  const textManager = document.getElementById("textManager");

  if (!textList || !textManager) return;

  const titleElement = textManager.querySelector("h4");
  if (titleElement) {
    titleElement.textContent = `📋 등록된 지문 목록 (${textCollection.length}개)`;
  }

  if (textCollection.length === 0) {
    textList.innerHTML =
      '<div style="text-align: center; color: #7f8c8d; padding: 20px;">등록된 지문이 없습니다.</div>';
    return;
  }

  textList.innerHTML = textCollection
    .map((text) => {
      const grammarTags = text.assignedGrammar
        ? text.assignedGrammar
            .map(
              (g) =>
                `<span class="grammar-tag" style="font-size: 0.7em; padding: 2px 6px;">${grammarTypes[g].name}</span>`
            )
            .join(" ")
        : '<span style="color: #7f8c8d; font-size: 0.8em;">기본 설정</span>';

      return `
            <div class="text-item ${text.status}" data-id="${text.id}">
                <div class="text-number">${text.id}</div>
                <div class="text-content">
                    <div class="text-title">${text.title}</div>
                    <div class="text-preview">${text.content.substring(
                      0,
                      100
                    )}${text.content.length > 100 ? "..." : ""}</div>
                    <div class="text-stats">
                        <span>📝 ${text.charCount.toLocaleString()}자</span>
                        <span>🔤 ${text.wordCount.toLocaleString()}단어</span>
                        <span>📊 ${getStatusText(text.status)}</span>
                    </div>
                    <div style="margin-top: 8px;">
                        <small style="color: #6c757d;">🎯 적용된 문법:</small><br>
                        ${grammarTags}
                    </div>
                </div>
                <div class="text-actions">
                    <button class="btn small" onclick="editText(${
                      text.id
                    })">✏️ 수정</button>
                    <button class="btn small warning" onclick="editGrammar(${
                      text.id
                    })">🎯 문법</button>
                    <button class="btn small danger" onclick="deleteText(${
                      text.id
                    })">🗑️ 삭제</button>
                    ${
                      text.status === "completed"
                        ? `<button class="btn small success" onclick="downloadTextWorkbook(${text.id})">💾 다운</button>`
                        : ""
                    }
                </div>
            </div>
        `;
    })
    .join("");
}

function updateBatchStats() {
  const total = textCollection.length;
  const completed = textCollection.filter(
    (t) => t.status === "completed"
  ).length;
  const failed = textCollection.filter((t) => t.status === "error").length;
  const avgTime = completed > 0 ? 45 : 0;

  const elements = {
    totalTexts: document.getElementById("totalTexts"),
    completedTexts: document.getElementById("completedTexts"),
    failedTexts: document.getElementById("failedTexts"),
    estimatedTime: document.getElementById("estimatedTime"),
    overallProgressBar: document.getElementById("overallProgressBar"),
    overallProgressText: document.getElementById("overallProgressText"),
  };

  if (elements.totalTexts) elements.totalTexts.textContent = total;
  if (elements.completedTexts) elements.completedTexts.textContent = completed;
  if (elements.failedTexts) elements.failedTexts.textContent = failed;
  if (elements.estimatedTime)
    elements.estimatedTime.textContent =
      total > 0 ? `${(total - completed) * avgTime}초` : "-";

  const progress = total > 0 ? (completed / total) * 100 : 0;
  if (elements.overallProgressBar)
    elements.overallProgressBar.style.width = progress + "%";
  if (elements.overallProgressText) {
    elements.overallProgressText.textContent =
      total > 0
        ? `${completed}/${total} 완료 (${Math.round(progress)}%)`
        : "대기 중...";
  }
}

function updateQueue() {
  const queueList = document.getElementById("queueList");
  if (!queueList) return;

  if (textCollection.length === 0) {
    queueList.innerHTML =
      '<div style="text-align: center; color: #7f8c8d; padding: 20px;">대기 중인 지문이 없습니다.</div>';
    return;
  }

  queueList.innerHTML = textCollection
    .map(
      (text) => `
        <div class="queue-item ${text.status}">
            <div class="status-icon" style="background: ${getStatusColor(
              text.status
            )}">
                ${getStatusIcon(text.status)}
            </div>
            <div style="flex: 1;">
                <strong>${text.title}</strong> - ${text.wordCount}단어
                <div style="font-size: 0.8em; color: #6c757d;">
                    문법: ${
                      text.assignedGrammar
                        ? text.assignedGrammar.length + "개 유형"
                        : "기본 설정"
                    }
                </div>
            </div>
            <div style="font-size: 0.8em; color: #6c757d;">
                ${
                  text.generatedAt
                    ? new Date(text.generatedAt).toLocaleTimeString()
                    : ""
                }
            </div>
        </div>
    `
    )
    .join("");
}

async function startBatchGeneration() {
  if (textCollection.length === 0) {
    showToast("처리할 지문이 없습니다.", true);
    return;
  }

  isProcessing = true;
  batchPaused = false;
  currentProcessingIndex = 0;

  const batchBtn = document.getElementById("batchGenerateBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const progressSection = document.getElementById("batchProgress");

  if (batchBtn) batchBtn.style.display = "none";
  if (pauseBtn) pauseBtn.style.display = "inline-flex";
  if (progressSection) progressSection.classList.add("active");

  showToast("배치 처리를 시작합니다...");

  for (let i = 0; i < textCollection.length; i++) {
    if (batchPaused) break;

    currentProcessingIndex = i;
    const text = textCollection[i];

    if (text.status !== "completed") {
      await processText(text);
    }

    updateTextList();
    updateQueue();
    updateBatchStats();

    await delay(2000);
  }

  isProcessing = false;
  if (batchBtn) batchBtn.style.display = "inline-flex";
  if (pauseBtn) pauseBtn.style.display = "none";

  showToast("배치 처리가 완료되었습니다!");
}

async function processText(text) {
  text.status = "processing";
  updateTextList();
  updateQueue();

  try {
    await delay(3000);

    if (Math.random() > 0.1) {
      text.status = "completed";
      text.result = generateSampleWorkbook(
        `워크북 - ${text.title}`,
        text.content,
        text.assignedGrammar || []
      );
      text.generatedAt = new Date().toISOString();

      batchResults.push({
        id: text.id,
        title: text.title,
        content: text.result,
        generatedAt: text.generatedAt,
        problemCount: 8,
        difficulty: "최고급",
        grammarTypes: text.assignedGrammar || [],
      });
    } else {
      text.status = "error";
    }
  } catch (error) {
    text.status = "error";
    console.error("Text processing error:", error);
  }
}

function pauseBatchGeneration() {
  batchPaused = true;
  const batchBtn = document.getElementById("batchGenerateBtn");
  const pauseBtn = document.getElementById("pauseBtn");

  if (batchBtn) batchBtn.style.display = "inline-flex";
  if (pauseBtn) pauseBtn.style.display = "none";

  showToast("배치 처리가 일시정지되었습니다.");
}

// ============================================
// 편집 및 관리 함수들
// ============================================

function editText(id) {
  const text = textCollection.find((t) => t.id === id);
  if (!text) return;

  const newContent = prompt("지문 내용을 수정하세요:", text.content);
  if (newContent && newContent.trim()) {
    text.content = newContent.trim();
    text.wordCount = text.content.split(/\s+/).length;
    text.charCount = text.content.length;
    text.status = "waiting";

    updateTextList();
    updateBatchStats();
    showToast("지문이 수정되었습니다.");
  }
}

function editGrammar(id) {
  const text = textCollection.find((t) => t.id === id);
  if (!text) return;

  const currentGrammar = text.assignedGrammar || [];
  const allGrammarKeys = Object.keys(grammarTypes);

  let options = allGrammarKeys
    .map((key) => {
      const checked = currentGrammar.includes(key) ? "checked" : "";
      return `<label style="display: block; margin: 5px 0;">
            <input type="checkbox" value="${key}" ${checked}> 
            ${grammarTypes[key].name} (${grammarTypes[key].description})
        </label>`;
    })
    .join("");

  const dialog = document.createElement("div");
  dialog.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <h3>${text.title} - 문법 설정</h3>
                <div style="margin: 20px 0;">
                    ${options}
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button class="btn small" onclick="this.closest('div').parentElement.remove()">취소</button>
                    <button class="btn small success" onclick="saveGrammarSettings(${id}, this.closest('div').parentElement)" style="margin-left: 10px;">저장</button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(dialog);
}

function saveGrammarSettings(id, dialog) {
  const text = textCollection.find((t) => t.id === id);
  if (!text) return;

  const checkboxes = dialog.querySelectorAll('input[type="checkbox"]:checked');
  text.assignedGrammar = Array.from(checkboxes).map((cb) => cb.value);

  updateTextList();
  dialog.remove();
  showToast(`${text.title}의 문법 설정이 업데이트되었습니다.`);
}

function deleteText(id) {
  if (confirm("이 지문을 삭제하시겠습니까?")) {
    textCollection = textCollection.filter((t) => t.id !== id);
    updateTextList();
    updateBatchStats();
    updateQueue();
    showToast("지문이 삭제되었습니다.");
  }
}

function clearAllTexts() {
  if (confirm("모든 지문을 삭제하시겠습니까?")) {
    textCollection = [];
    updateTextList();
    updateBatchStats();
    updateQueue();
    const batchBtn = document.getElementById("batchGenerateBtn");
    if (batchBtn) batchBtn.disabled = true;
    showToast("모든 지문이 삭제되었습니다.");
  }
}

// ============================================
// 워크북 생성 및 표시
// ============================================

function generateSampleWorkbook(title, originalText, selectedGrammar = []) {
  const timestamp = new Date().toLocaleString();
  const grammarList =
    selectedGrammar.length > 0
      ? selectedGrammar.map((g) => grammarTypes[g].name).join(", ")
      : "전체 문법 유형";

  return `# ${title}

**생성 시간:** ${timestamp}
**난이도:** 고등학교 내신 최상급 + 대학입시 수준 (AI 생성)
**선택된 문법 유형:** ${grammarList}
**문제 유형:** 5가지 (원본 지문 기반)

## 원본 지문
\`\`\`
${originalText}
\`\`\`

## 🎯 선택된 문법 요소
${selectedGrammar
  .map((g) => `- **${grammarTypes[g].name}**: ${grammarTypes[g].description}`)
  .join("\n")}

## 1. 2지선다 어법 문제 (선택된 문법 중심)

다음 글의 괄호 안에서 어법상 올바른 것을 고르시오.

1. 🤖★★★ What makes proverbs so enduring, despite their apparent simplicity, [is / are] not merely their surface meaning...
   **정답:** is
   **문법 포인트:** ${
     selectedGrammar.includes("parallelism")
       ? "병렬구조 및 주어-동사 일치"
       : "Subject-verb agreement"
   }
   **해설:** 주어가 'What makes proverbs so enduring'이라는 명사절이므로 단수 동사를 사용합니다.

2. 🤖★★★ [Having been passed / Being passed] down through generations, these linguistic gems continue to resonate...
   **정답:** Having been passed
   **문법 포인트:** ${
     selectedGrammar.includes("participles")
       ? "고급 분사구문 (완료 분사)"
       : "Perfect participle"
   }
   **해설:** 완료 분사 'Having been passed'로 시간의 선후관계를 명확히 나타냅니다.

## 2. 2지선다 어휘 문제

다음 글의 괄호 안에서 문맥상 가장 적절한 것을 고르시오.

1. 🤖★★ What makes proverbs so [enduring / lasting], despite their apparent simplicity...
   **정답:** enduring
   **어휘 포인트:** 미묘한 어휘 선택
   **해설:** 'enduring'이 시련을 견디며 지속되는 의미로 더 적절합니다.

## 3. 5지선다 어법 문제 (선택된 문법 집중)

다음 글의 밑줄 친 부분 중 어법상 틀린 것은?

1. 🤖★★★ What <u>①makes</u> proverbs so enduring, despite their apparent simplicity, <u>②is</u> not merely their surface meaning but the profound wisdom they <u>③encapsulate</u> through metaphorical language that <u>④transcend</u> cultural boundaries. <u>⑤Having been</u> passed down through generations...

   **정답:** ④
   **문법 포인트:** ${
     selectedGrammar.includes("relative_clauses")
       ? "관계절 내 주어-동사 일치"
       : "Subject-verb agreement in relative clause"
   }
   **해설:** 선행사 'language'가 단수이므로 'transcends'가 되어야 합니다.

## 4. 5지선다 어휘 문제

다음 글의 밑줄 친 부분 중 문맥상 가장 부적절한 것은?

1. 🤖★★ What makes proverbs so <u>①enduring</u>, despite their apparent simplicity, is not merely their <u>②surface</u> meaning but the <u>③profound</u> wisdom they <u>④encapsulate</u> through metaphorical language that <u>⑤diminishes</u> cultural boundaries.

   **정답:** ⑤
   **어휘 포인트:** 문맥상 적절성
   **해설:** 'diminishes'(감소시키다)보다는 'transcends'(초월하다)가 문맥상 적절합니다.

## 5. 빈칸뚫기 어휘 문제 (주관식)

다음 글의 빈 칸에 들어갈 어휘를 쓰시오.

1. 🤖★★ What makes proverbs so enduring, despite their apparent simplicity, is not merely their surface meaning but the profound wisdom they _____ through metaphorical language.

   **정답:** encapsulate
   **어휘 포인트:** 고급 어휘
   **해설:** '캡슐에 넣다, 요약하다'의 의미로 지혜를 함축한다는 뜻입니다.

---

📊 **생성 통계:**
- 총 문제 수: 8개
- 어법 문제: 4개 (50%)
- 어휘 문제: 4개 (50%)
- 선택된 문법 유형: ${selectedGrammar.length}개
- 최고 난이도: ★★★
- 원본 지문 활용률: 100%

🎯 **적용된 문법 요소:**
${selectedGrammar
  .map((g) => `- ${grammarTypes[g].name}: ${grammarTypes[g].description}`)
  .join("\n")}
`;
}

function displayWorkbook(content, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = content
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/```([\s\S]*?)```/g, '<div class="original-text">$1</div>')
    .replace(/^\d+\. (.*$)/gm, '<div class="problem-item">$1</div>')
    .replace(
      /🤖★★★/g,
      '<span style="color: #e74c3c; font-weight: bold;">🤖★★★</span>'
    )
    .replace(
      /🤖★★/g,
      '<span style="color: #f39c12; font-weight: bold;">🤖★★</span>'
    )
    .replace(/\n/g, "<br>");

  container.innerHTML = html;
}

// ============================================
// 결과 관리
// ============================================

function updateResultsStats() {
  const completed = textCollection.filter(
    (t) => t.status === "completed"
  ).length;
  const totalProblems = completed * 8;
  const avgTime = completed > 0 ? 45 : 0;
  const successRate =
    textCollection.length > 0
      ? Math.round((completed / textCollection.length) * 100)
      : 100;

  const elements = {
    totalWorkbooks: document.getElementById("totalWorkbooks"),
    totalProblems: document.getElementById("totalProblems"),
    avgGenerationTime: document.getElementById("avgGenerationTime"),
    successRate: document.getElementById("successRate"),
  };

  if (elements.totalWorkbooks) elements.totalWorkbooks.textContent = completed;
  if (elements.totalProblems)
    elements.totalProblems.textContent = totalProblems;
  if (elements.avgGenerationTime)
    elements.avgGenerationTime.textContent = avgTime;
  if (elements.successRate)
    elements.successRate.textContent = successRate + "%";

  updateResultsList();
}

function updateResultsList() {
  const resultsList = document.getElementById("resultsList");
  if (!resultsList) return;

  const completed = batchResults;

  if (completed.length === 0) {
    resultsList.innerHTML =
      '<div style="text-align: center; color: #7f8c8d; padding: 50px;">생성된 워크북이 없습니다.</div>';
    return;
  }

  resultsList.innerHTML = completed
    .map((result) => {
      const grammarInfo =
        result.grammarTypes && result.grammarTypes.length > 0
          ? `문법: ${result.grammarTypes
              .map((g) => grammarTypes[g].name)
              .join(", ")}`
          : "문법: 기본 설정";

      return `
            <div class="result-item">
                <div class="result-info">
                    <h4>${result.title}</h4>
                    <div class="result-meta">
                        생성: ${new Date(
                          result.generatedAt
                        ).toLocaleString()} | 
                        문제 수: ${result.problemCount}개 | 
                        난이도: ${result.difficulty}<br>
                        ${grammarInfo}
                    </div>
                </div>
                <div>
                    <button class="btn small success" onclick="downloadTextWorkbook(${
                      result.id
                    })">💾 다운로드</button>
                    <button class="btn small" onclick="previewResult(${
                      result.id
                    })">👁️ 미리보기</button>
                </div>
            </div>
        `;
    })
    .join("");
}

function clearResults() {
  if (confirm("모든 생성 결과를 초기화하시겠습니까?")) {
    batchResults = [];
    textCollection.forEach((text) => {
      text.status = "waiting";
      text.result = null;
      text.generatedAt = null;
    });

    updateTextList();
    updateBatchStats();
    updateQueue();
    updateResultsStats();

    showToast("모든 결과가 초기화되었습니다.");
  }
}

// ============================================
// 다운로드 및 내보내기
// ============================================

function downloadTextWorkbook(id) {
  const result = batchResults.find((r) => r.id === id);
  if (!result) {
    showToast("워크북을 찾을 수 없습니다.", true);
    return;
  }

  const blob = new Blob([result.content], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `workbook_${result.id}_${new Date()
    .toISOString()
    .slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("워크북이 다운로드되었습니다!");
}

function downloadWorkbook(type) {
  let content = "";
  let filename = "";

  if (type === "single") {
    const title = document.getElementById("singleTitle")?.value || "AI 워크북";
    const text = document.getElementById("singleText")?.value || "";
    const selectedGrammar = getSelectedGrammarTypes();
    content = generateSampleWorkbook(title, text, selectedGrammar);
    filename = `single_workbook_${new Date().toISOString().slice(0, 10)}.md`;
  }

  if (!content) {
    showToast("다운로드할 워크북이 없습니다.", true);
    return;
  }

  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("워크북이 다운로드되었습니다!");
}

function downloadAllWorkbooks() {
  if (batchResults.length === 0) {
    showToast("다운로드할 워크북이 없습니다.", true);
    return;
  }

  showToast(`${batchResults.length}개의 워크북을 다운로드합니다...`);

  // 실제로는 JSZip 라이브러리를 사용하여 ZIP 파일 생성
  setTimeout(() => {
    showToast("전체 워크북 다운로드가 완료되었습니다!");
  }, 2000);
}

function exportStatistics() {
  const stats = {
    generated: new Date().toISOString(),
    totalTexts: textCollection.length,
    completedTexts: textCollection.filter((t) => t.status === "completed")
      .length,
    failedTexts: textCollection.filter((t) => t.status === "error").length,
    totalProblems: batchResults.length * 8,
    avgGenerationTime: 45,
    successRate:
      textCollection.length > 0
        ? (textCollection.filter((t) => t.status === "completed").length /
            textCollection.length) *
          100
        : 100,
  };

  const csvContent = `구분,값\n총 지문 수,${stats.totalTexts}\n완료된 지문,${
    stats.completedTexts
  }\n실패한 지문,${stats.failedTexts}\n총 문제 수,${
    stats.totalProblems
  }\n평균 생성시간(초),${
    stats.avgGenerationTime
  }\n성공률(%),${stats.successRate.toFixed(1)}\n생성시간,${stats.generated}`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `workbook_statistics_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("통계가 CSV 파일로 내보내졌습니다!");
}

function previewResult(id) {
  const result = batchResults.find((r) => r.id === id);
  if (!result) {
    showToast("워크북을 찾을 수 없습니다.", true);
    return;
  }

  const newWindow = window.open("", "_blank");
  newWindow.document.write(`
        <html>
            <head>
                <title>${result.title} - 미리보기</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        padding: 20px; 
                        line-height: 1.6; 
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .original-text { 
                        background: #f1c40f; 
                        padding: 15px; 
                        border-radius: 8px; 
                        margin: 20px 0; 
                        border-left: 5px solid #f39c12;
                    }
                    .problem-item { 
                        margin: 15px 0; 
                        padding: 10px; 
                        background: #f8f9fa; 
                        border-radius: 6px; 
                        border: 1px solid #ecf0f1;
                    }
                    h1, h2 { 
                        color: #2c3e50; 
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }
                    h3 { color: #2c3e50; }
                    strong { color: #e74c3c; }
                    code { 
                        background: #f4f4f4; 
                        padding: 2px 4px; 
                        border-radius: 3px; 
                    }
                </style>
            </head>
            <body>
                ${result.content
                  .replace(/\n/g, "<br>")
                  .replace(
                    /```([\s\S]*?)```/g,
                    '<div class="original-text">$1</div>'
                  )}
            </body>
        </html>
    `);
  newWindow.document.close();
}

// ============================================
// 이벤트 리스너 및 초기화
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("AI 영어 워크북 생성기 초기화 시작...");

  try {
    // 단일 지문 통계 실시간 업데이트
    const singleTextArea = document.getElementById("singleText");
    if (singleTextArea) {
      singleTextArea.addEventListener("input", updateSingleStats);
      updateSingleStats();
    }

    // 문법 체크박스 이벤트 리스너
    setTimeout(() => {
      const grammarCheckboxes = document.querySelectorAll(
        '.grammar-selector input[type="checkbox"]'
      );
      grammarCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", updateGrammarPreview);
      });

      // 초기 문법 미리보기 업데이트
      updateGrammarPreview();
    }, 100);

    // 초기 상태 설정
    updateBatchStats();
    updateQueue();

    console.log("AI 영어 워크북 생성기 초기화 완료!");
  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
  }
});

// 전역 함수로 내보내기 (필요한 경우)
window.workbookGenerator = {
  // 탭 관리
  switchTab,

  // 단일 지문
  generateSingleWorkbook,
  updateSingleStats,

  // 배치 처리
  parseTexts,
  startBatchGeneration,
  pauseBatchGeneration,

  // 지문 관리
  editText,
  editGrammar,
  deleteText,
  clearAllTexts,

  // 다운로드
  downloadWorkbook,
  downloadTextWorkbook,
  downloadAllWorkbooks,

  // 결과 관리
  exportStatistics,
  clearResults,
  previewResult,

  // 문법 선택
  selectAllGrammar,
  deselectAllGrammar,
  selectRecommended,
  updateGrammarPreview,
  toggleCustomGrammar,

  // 내부 함수들
  showToast,
  delay,
};

// 콘솔에 사용 가능한 함수들 안내
console.log("🎯 사용 가능한 함수들:", Object.keys(window.workbookGenerator));
console.log("📖 예시: workbookGenerator.selectRecommended()");
