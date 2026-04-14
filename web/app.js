const STORAGE_KEY = "cyoa_local_draft_v1";

const state = {
  nodes: new Set(),
  edges: new Map(),
  pageCache: new Map(),
  draft: loadDraft(),
  currentPage: 2,
  path: [2],
};

const els = {
  storyStatus: document.getElementById("storyStatus"),
  currentPageLabel: document.getElementById("currentPageLabel"),
  pageContent: document.getElementById("pageContent"),
  choiceList: document.getElementById("choiceList"),
  pathDisplay: document.getElementById("pathDisplay"),
  nodeCount: document.getElementById("nodeCount"),
  edgeCount: document.getElementById("edgeCount"),
  terminalCount: document.getElementById("terminalCount"),
  adjacencyNow: document.getElementById("adjacencyNow"),
  validationSummary: document.getElementById("validationSummary"),
  jumpPageInput: document.getElementById("jumpPageInput"),
  restartBtn: document.getElementById("restartBtn"),
  copyPathBtn: document.getElementById("copyPathBtn"),
  jumpBtn: document.getElementById("jumpBtn"),
  validateBtn: document.getElementById("validateBtn"),
  editText: document.getElementById("editText"),
  savePageBtn: document.getElementById("savePageBtn"),
  clearPageBtn: document.getElementById("clearPageBtn"),
  newPageId: document.getElementById("newPageId"),
  newPageText: document.getElementById("newPageText"),
  addPageBtn: document.getElementById("addPageBtn"),
  newChoiceTarget: document.getElementById("newChoiceTarget"),
  newChoiceLabel: document.getElementById("newChoiceLabel"),
  addChoiceBtn: document.getElementById("addChoiceBtn"),
  exportBtn: document.getElementById("exportBtn"),
  resetDraftBtn: document.getElementById("resetDraftBtn"),
};

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { pageText: {}, extraChoices: {} };
    }
    const parsed = JSON.parse(raw);
    return {
      pageText: parsed.pageText || {},
      extraChoices: parsed.extraChoices || {},
    };
  } catch {
    return { pageText: {}, extraChoices: {} };
  }
}

function saveDraft() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.draft));
}

function pageFileName(page) {
  return `${String(page).padStart(2, "0")}-CoT.txt`;
}

function parseGraph(text) {
  const nodeRe = /^\s*P(\d+)\["\d+"\]\s*$/;
  const edgeRe = /^\s*P(\d+)\s*-->\s*P(\d+)\s*$/;

  for (const line of text.split("\n")) {
    const nodeMatch = line.match(nodeRe);
    if (nodeMatch) {
      const id = Number(nodeMatch[1]);
      state.nodes.add(id);
      if (!state.edges.has(id)) {
        state.edges.set(id, []);
      }
      continue;
    }

    const edgeMatch = line.match(edgeRe);
    if (edgeMatch) {
      const from = Number(edgeMatch[1]);
      const to = Number(edgeMatch[2]);
      state.nodes.add(from);
      state.nodes.add(to);
      if (!state.edges.has(from)) {
        state.edges.set(from, []);
      }
      if (!state.edges.has(to)) {
        state.edges.set(to, []);
      }
      const out = state.edges.get(from);
      if (!out.includes(to)) {
        out.push(to);
      }
    }
  }
}

async function loadGraph() {
  const response = await fetch("output/cot-story-graph.mmd", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load graph: ${response.status}`);
  }
  const text = await response.text();
  parseGraph(text);
}

function cleanedPageText(text) {
  return text.replace(/^Page\s+\d+\s*\n\n?/i, "").trim();
}

async function fetchBasePage(page) {
  if (state.pageCache.has(page)) {
    return state.pageCache.get(page);
  }

  const fileName = pageFileName(page);
  const response = await fetch(`output/cot-pages-ocr-v2/${fileName}`, { cache: "no-cache" });
  if (!response.ok) {
    return null;
  }

  const text = cleanedPageText(await response.text());
  state.pageCache.set(page, text);
  return text;
}

function hasPageText(page) {
  return Boolean(state.draft.pageText[String(page)]) || state.pageCache.has(page);
}

function allOutgoing(page) {
  const base = state.edges.get(page) || [];
  const extras = state.draft.extraChoices[String(page)] || [];
  const merged = [];

  for (const target of base) {
    merged.push({ to: target, label: `Go to page ${target}`, source: "base" });
  }

  for (const extra of extras) {
    const label = extra.label ? extra.label.trim() : "";
    merged.push({
      to: Number(extra.to),
      label: label || `Go to page ${extra.to}`,
      source: "draft",
    });
  }

  return merged;
}

async function getPageText(page) {
  const override = state.draft.pageText[String(page)];
  if (override && override.trim()) {
    return override.trim();
  }

  const base = await fetchBasePage(page);
  if (base) {
    return base;
  }

  return "[No page text yet. Use Authoring to add content.]";
}

async function renderPage() {
  const page = state.currentPage;
  const text = await getPageText(page);
  els.currentPageLabel.textContent = `Page ${page}`;
  els.pageContent.textContent = text;
  els.pathDisplay.textContent = state.path.join(" -> ");
  els.editText.value = state.draft.pageText[String(page)] || text;

  const outgoing = allOutgoing(page);
  els.choiceList.innerHTML = "";

  if (!outgoing.length) {
    const li = document.createElement("li");
    li.textContent = "No outgoing choices from this page.";
    els.choiceList.appendChild(li);
  }

  for (const choice of outgoing) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${choice.label} (${choice.source})`;
    btn.addEventListener("click", () => goToPage(choice.to));
    li.appendChild(btn);
    els.choiceList.appendChild(li);
  }

  els.adjacencyNow.textContent =
    outgoing.length > 0 ? outgoing.map((c) => c.to).join(", ") : "none";
}

function setGraphStats() {
  const edgeCount = [...state.edges.values()].reduce((sum, arr) => sum + arr.length, 0) +
    Object.values(state.draft.extraChoices).reduce((sum, arr) => sum + arr.length, 0);

  const allNodes = new Set(state.nodes);
  for (const key of Object.keys(state.draft.pageText)) {
    allNodes.add(Number(key));
  }
  for (const [from, extras] of Object.entries(state.draft.extraChoices)) {
    allNodes.add(Number(from));
    for (const extra of extras) {
      allNodes.add(Number(extra.to));
    }
  }

  let terminal = 0;
  for (const node of allNodes) {
    if (allOutgoing(node).length === 0) {
      terminal += 1;
    }
  }

  els.nodeCount.textContent = String(allNodes.size);
  els.edgeCount.textContent = String(edgeCount);
  els.terminalCount.textContent = String(terminal);
}

async function goToPage(page) {
  if (!Number.isInteger(page) || page < 1) {
    return;
  }

  if (state.path[state.path.length - 1] !== page) {
    state.path.push(page);
  }

  state.currentPage = page;
  await fetchBasePage(page);
  await renderPage();
  setGraphStats();
}

function restartStory() {
  state.currentPage = 2;
  state.path = [2];
  renderPage();
}

function addPage() {
  const id = Number(els.newPageId.value.trim());
  const text = els.newPageText.value.trim();

  if (!Number.isInteger(id) || id < 1 || !text) {
    alert("Provide a valid page id and text.");
    return;
  }

  state.draft.pageText[String(id)] = text;
  if (!state.edges.has(id)) {
    state.edges.set(id, []);
  }
  state.nodes.add(id);
  saveDraft();
  els.newPageId.value = "";
  els.newPageText.value = "";
  setGraphStats();
  alert(`Added local page ${id}.`);
}

function addChoice() {
  const from = state.currentPage;
  const to = Number(els.newChoiceTarget.value.trim());
  const label = els.newChoiceLabel.value.trim();

  if (!Number.isInteger(to) || to < 1) {
    alert("Provide a valid target page.");
    return;
  }

  const key = String(from);
  if (!state.draft.extraChoices[key]) {
    state.draft.extraChoices[key] = [];
  }

  if (state.draft.extraChoices[key].some((item) => Number(item.to) === to)) {
    alert("That draft choice already exists.");
    return;
  }

  state.draft.extraChoices[key].push({ to, label });
  state.nodes.add(to);
  saveDraft();

  els.newChoiceTarget.value = "";
  els.newChoiceLabel.value = "";
  renderPage();
  setGraphStats();
}

function saveCurrentPageOverride() {
  const text = els.editText.value.trim();
  if (!text) {
    alert("Page text cannot be empty.");
    return;
  }

  state.draft.pageText[String(state.currentPage)] = text;
  saveDraft();
  renderPage();
}

function clearCurrentPageOverride() {
  delete state.draft.pageText[String(state.currentPage)];
  saveDraft();
  renderPage();
}

function runValidation() {
  const allNodes = new Set(state.nodes);
  Object.keys(state.draft.pageText).forEach((id) => allNodes.add(Number(id)));
  for (const [from, extras] of Object.entries(state.draft.extraChoices)) {
    allNodes.add(Number(from));
    extras.forEach((extra) => allNodes.add(Number(extra.to)));
  }

  const missingText = [];
  for (const node of [...allNodes].sort((a, b) => a - b)) {
    if (!hasPageText(node) && !state.draft.pageText[String(node)]) {
      missingText.push(node);
    }
  }

  const seen = new Set([2]);
  const queue = [2];
  while (queue.length) {
    const current = queue.shift();
    for (const choice of allOutgoing(current)) {
      if (!seen.has(choice.to)) {
        seen.add(choice.to);
        queue.push(choice.to);
      }
    }
  }

  const unreachable = [...allNodes].filter((node) => !seen.has(node)).sort((a, b) => a - b);
  const lines = [];

  if (!missingText.length) {
    lines.push("Missing-text check: clear.");
  } else {
    lines.push(`Missing text for pages: ${missingText.join(", ")}`);
  }

  if (!unreachable.length) {
    lines.push("Reachability check: clear from start page 2.");
  } else {
    lines.push(`Unreachable from page 2: ${unreachable.join(", ")}`);
  }

  els.validationSummary.textContent = lines.join(" ");
}

function exportDraft() {
  const blob = new Blob([JSON.stringify(state.draft, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cyoa-draft.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function resetDraft() {
  const ok = confirm("Reset local draft edits? This cannot be undone.");
  if (!ok) {
    return;
  }

  state.draft = { pageText: {}, extraChoices: {} };
  saveDraft();
  renderPage();
  setGraphStats();
  els.validationSummary.textContent = "Validation not run yet.";
}

function copyPath() {
  const text = state.path.join(" -> ");
  navigator.clipboard.writeText(text).then(
    () => {
      els.storyStatus.textContent = "Path copied to clipboard.";
      window.setTimeout(() => {
        els.storyStatus.textContent = `Loaded ${state.nodes.size} base pages.`;
      }, 1100);
    },
    () => {
      alert("Could not copy path.");
    }
  );
}

function wireEvents() {
  els.restartBtn.addEventListener("click", restartStory);
  els.copyPathBtn.addEventListener("click", copyPath);
  els.jumpBtn.addEventListener("click", () => {
    const page = Number(els.jumpPageInput.value.trim());
    if (!Number.isInteger(page) || page < 1) {
      alert("Enter a valid page number.");
      return;
    }
    goToPage(page);
  });

  els.validateBtn.addEventListener("click", runValidation);
  els.savePageBtn.addEventListener("click", saveCurrentPageOverride);
  els.clearPageBtn.addEventListener("click", clearCurrentPageOverride);
  els.addPageBtn.addEventListener("click", addPage);
  els.addChoiceBtn.addEventListener("click", addChoice);
  els.exportBtn.addEventListener("click", exportDraft);
  els.resetDraftBtn.addEventListener("click", resetDraft);
}

async function init() {
  try {
    await loadGraph();
    await fetchBasePage(2);
    els.storyStatus.textContent = `Loaded ${state.nodes.size} base pages.`;
    wireEvents();
    setGraphStats();
    await renderPage();
  } catch (err) {
    els.storyStatus.textContent = "Failed to load story data.";
    els.pageContent.textContent =
      "Could not load output files. Confirm output/cot-story-graph.mmd and output/cot-pages-ocr-v2 exist in this repository.";
    console.error(err);
  }
}

init();
