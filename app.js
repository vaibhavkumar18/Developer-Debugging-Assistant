document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatTimeline = document.getElementById("chatTimeline");
  const welcomeBox = document.getElementById("welcomeBox");
  const sendBtn = document.getElementById("sendBtn");
  const clearCaseBtn = document.getElementById("clearCaseBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const caseIdValue = document.getElementById("caseIdValue");
  const statusPill = document.getElementById("statusPill");
  const statusText = statusPill.querySelector(".status-text");
  const alertBanner = document.getElementById("alertBanner");

  // File attachment elements
  const attachBtn = document.getElementById("attachBtn");
  const fileInput = document.getElementById("fileInput");
  const fileChipRow = document.getElementById("fileChipRow");

  const pipelineStages = {
    intake: document.querySelector('.stage[data-stage="intake"]'),
    triage: document.querySelector('.stage[data-stage="triage"]'),
    clarify: document.querySelector('.stage[data-stage="clarify"]'),
    diagnosis: document.querySelector('.stage[data-stage="diagnosis"]'),
  };

  // State tracker to direct traffic between /analyze and /clarify seamlessly
  let currentThreadId = null;
  let isClarificationStage = false;

  // Holds the files currently staged for the next outgoing message
  let attachedFiles = [];

  // ----------------------------------------------------------
  // Status Bar and Pipeline UI Handlers
  // ----------------------------------------------------------
  function setStatus(state, label) {
    statusPill.dataset.state = state;
    statusText.textContent = label;
  }

  function setStage(name, status, code) {
    const el = pipelineStages[name];
    if (!el) return;
    el.dataset.status = status;
    const codeEl = el.querySelector(".stage-code");
    if (codeEl) codeEl.textContent = code;
  }

  function resetPipeline() {
    setStage("intake", "pending", "PENDING");
    setStage("triage", "pending", "PENDING");
    setStage("clarify", "skip", "—");
    setStage("diagnosis", "pending", "PENDING");
  }

  function setCaseId(threadId) {
    if (!threadId) {
      caseIdValue.textContent = "—";
      return;
    }
    const short = threadId.replace(/^debug-/, "").slice(0, 8);
    caseIdValue.textContent = `TRG-${short.toUpperCase()}`;
  }

  // ----------------------------------------------------------
  // File Attachment Handling (upload only, no client-side parsing)
  // ----------------------------------------------------------
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  function renderFileChips() {
    fileChipRow.innerHTML = "";

    if (attachedFiles.length === 0) {
      fileChipRow.classList.add("hidden");
      return;
    }

    fileChipRow.classList.remove("hidden");

    attachedFiles.forEach((file, index) => {
      const chip = document.createElement("div");
      chip.className = "file-chip";
      chip.innerHTML = `
        <span class="file-icon">📄</span>
        <span class="file-name" title="${file.name}">${file.name}</span>
        <span class="file-size">${formatFileSize(file.size)}</span>
        <button type="button" class="file-chip-remove" data-index="${index}" title="Remove file">✕</button>
      `;
      fileChipRow.appendChild(chip);
    });

    fileChipRow.querySelectorAll(".file-chip-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.index);
        attachedFiles.splice(idx, 1);
        renderFileChips();
      });
    });
  }

  attachBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    const newFiles = Array.from(fileInput.files || []);
    if (newFiles.length) {
      attachedFiles = attachedFiles.concat(newFiles);
      renderFileChips();
    }
    // Reset the input so selecting the same file again still fires "change"
    fileInput.value = "";
  });

  function clearAttachedFiles() {
    attachedFiles = [];
    renderFileChips();
  }

  // ----------------------------------------------------------
  // Conversational Append & Bubble Rendering Actions
  // ----------------------------------------------------------
  function appendMessage(sender, text, files = []) {
    // Hide default welcome guide layout on first user message
    if (welcomeBox) {
      welcomeBox.style.display = "none";
    }

    const bubble = document.createElement("div");
    bubble.className = `msg-bubble ${sender}`;

    if (sender === "user") {
      if (files && files.length) {
        const attachmentsWrap = document.createElement("div");
        attachmentsWrap.className = "msg-attachments";
        files.forEach((file) => {
          const chip = document.createElement("span");
          chip.className = "msg-attachment-chip";
          chip.innerHTML = `📄 ${file.name}`;
          attachmentsWrap.appendChild(chip);
        });
        bubble.appendChild(attachmentsWrap);
      }
      const textNode = document.createElement("div");
      textNode.textContent = text;
      bubble.appendChild(textNode);
    } else {
      bubble.innerHTML = formatResponse(text);
    }

    chatTimeline.appendChild(bubble);
    chatTimeline.scrollTop = chatTimeline.scrollHeight;

    if (sender === "assistant") {
      attachCopyListeners(bubble);
    }
    return bubble;
  }

  function renderThinkingBubble() {
    if (welcomeBox) welcomeBox.style.display = "none";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble assistant thinking";
    bubble.innerHTML = `
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    chatTimeline.appendChild(bubble);
    chatTimeline.scrollTop = chatTimeline.scrollHeight;
    return bubble;
  }

  // ----------------------------------------------------------
  // Markdown Engine parser for continuous conversational rendering
  // ----------------------------------------------------------
  function escapeHtml(str) {
    return str
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function formatInlineMarkdown(text) {
    return text
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([\s\S]+?)\*/g, "<em>$1</em>");
  }

  function parseMarkdownTable(lines, startIndex) {
    let tableLines = [];
    let i = startIndex;

    while (i < lines.length && lines[i].includes("|")) {
      tableLines.push(lines[i]);
      i++;
    }

    if (tableLines.length < 2) {
      return { html: null, nextIndex: startIndex };
    }

    const headerLine = tableLines[0].trim();
    const separatorLine = tableLines[1].trim();

    if (!/^\|?[\s\-:|]+\|?$/.test(separatorLine)) {
      return { html: null, nextIndex: startIndex };
    }

    const parseRow = (row) =>
      row
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => formatInlineMarkdown(cell.trim()));

    const headers = parseRow(headerLine);
    const bodyRows = tableLines.slice(2).map(parseRow);

    let html = "<div class='table-wrap'><table><thead><tr>";
    headers.forEach((h) => {
      html += `<th>${h}</th>`;
    });
    html += "</tr></thead><tbody>";

    bodyRows.forEach((row) => {
      if (row.length === 1 && row[0] === "") return;
      html += "<tr>";
      row.forEach((cell) => {
        html += `<td>${cell || ""}</td>`;
      });
      html += "</tr>";
    });

    html += "</tbody></table></div>";
    return { html, nextIndex: i - 1 };
  }

  function formatResponse(text) {
    if (!text) return "";

    const escaped = escapeHtml(text);
    const lines = escaped.split("\n");

    let output = [];
    let inUl = false;
    let inOl = false;
    let inCode = false;
    let codeBuffer = [];

    function closeLists() {
      if (inUl) {
        output.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        output.push("</ol>");
        inOl = false;
      }
    }

    function flushCodeBlock() {
      if (codeBuffer.length) {
        const code = codeBuffer.join("\n");
        output.push(`
          <div class="code-container" style="position: relative;">
            <pre><code>${code}</code></pre>
            <button class="copy-btn" style="position: absolute; top: 8px; right: 8px;">Copy</button>
          </div>
        `);
        codeBuffer = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("```")) {
        if (!inCode) {
          closeLists();
          inCode = true;
        } else {
          inCode = false;
          flushCodeBlock();
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(line);
        continue;
      }

      if (trimmed.includes("|") && i + 1 < lines.length) {
        const maybeTable = parseMarkdownTable(lines, i);
        if (maybeTable.html) {
          closeLists();
          output.push(maybeTable.html);
          i = maybeTable.nextIndex;
          continue;
        }
      }

      if (/^###\s+/.test(trimmed)) {
        closeLists();
        output.push(
          `<h3>${formatInlineMarkdown(trimmed.replace(/^###\s+/, ""))}</h3>`,
        );
        continue;
      }

      if (/^##\s+/.test(trimmed)) {
        closeLists();
        output.push(
          `<h2>${formatInlineMarkdown(trimmed.replace(/^##\s+/, ""))}</h2>`,
        );
        continue;
      }

      if (/^#\s+/.test(trimmed)) {
        closeLists();
        output.push(
          `<h1>${formatInlineMarkdown(trimmed.replace(/^#\s+/, ""))}</h1>`,
        );
        continue;
      }

      if (/^- /.test(trimmed)) {
        if (!inUl) {
          closeLists();
          output.push("<ul>");
          inUl = true;
        }
        output.push(
          `<li>${formatInlineMarkdown(trimmed.replace(/^- /, ""))}</li>`,
        );
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        if (!inOl) {
          closeLists();
          output.push("<ol>");
          inOl = true;
        }
        output.push(
          `<li>${formatInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ""))}</li>`,
        );
        continue;
      }

      if (!trimmed) {
        closeLists();
        output.push("<br />");
        continue;
      }

      closeLists();
      output.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
    }

    if (inCode) flushCodeBlock();
    closeLists();
    return output.join("");
  }

  function attachCopyListeners(container) {
    const copyButtons = container.querySelectorAll(".copy-btn");
    copyButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const codeElement = btn.previousElementSibling?.querySelector("code");
        if (codeElement) {
          const rawCode = codeElement.textContent;
          const textarea = document.createElement("textarea");
          textarea.value = rawCode;
          textarea.style.position = "absolute";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand("copy");
            btn.textContent = "Copied!";
            setTimeout(() => {
              btn.textContent = "Copy";
            }, 2000);
          } catch (err) {
            console.error("Iframe execution block on clipboard write: ", err);
          }
          document.body.removeChild(textarea);
        }
      });
    });
  }

  // ----------------------------------------------------------
  // API Orchestration: Seamless Triage Integration Flow
  // ----------------------------------------------------------
  function applyTriageResult(data) {
    currentThreadId = data.thread_id || currentThreadId;
    setCaseId(currentThreadId);

    if (data.status === "clarification_required") {
      isClarificationStage = true;

      setStage("intake", "done", "DONE");
      setStage("triage", "done", "DONE");
      setStage("clarify", "blocked", "BLOCKED");
      setStage("diagnosis", "pending", "PENDING");
      setStatus("clarify", "Needs input");

      // Extract raw questions list and format nicely inside Assistant Bubble
      let messageContent = `${data.message}\n\n`;
      if (data.questions && data.questions.length > 0) {
        data.questions.forEach((q, idx) => {
          messageContent += `${idx + 1}. ${q}\n`;
        });
      }
      appendMessage("assistant", messageContent);
      return;
    }

    if (data.status === "completed") {
      isClarificationStage = false;

      setStage("intake", "done", "DONE");
      setStage("triage", "done", "DONE");
      if (pipelineStages.clarify.dataset.status !== "skip") {
        setStage("clarify", "done", "DONE");
      }
      setStage("diagnosis", "done", "DONE");
      setStatus("done", "Resolved");

      appendMessage(
        "assistant",
        data.final_response || "Diagnosis constructed.",
      );
      return;
    }

    throw new Error("Triage pipeline returned unexpected state status.");
  }

  // Reflects the backend pipeline array onto the rail, and syncs the
  // clarification stage / status pill based on waiting_for_clarification.
  function updatePipelineUI(pipeline, waitingForClarification) {
    isClarificationStage = !!waitingForClarification;

    if (Array.isArray(pipeline)) {
      pipeline.forEach((entry) => {
        if (!entry || !entry.node) return;
        const code = (entry.status || "pending").toUpperCase();
        setStage(entry.node, entry.status || "pending", code);
      });
    }

    if (waitingForClarification) {
      setStage("clarify", "blocked", "BLOCKED");
      setStatus("clarify", "Needs input");
    } else {
      if (pipelineStages.clarify.dataset.status === "blocked") {
        setStage("clarify", "done", "DONE");
      }
      setStatus("done", "Resolved");
    }
  }

  // Unified controller to select endpoint automatically based on triage state
  async function submitConversationalTurn(userMessage, files) {
    setStatus("loading", "Analyzing...");
    alertBanner.classList.add("hidden");

    setStage("intake", "active", "RUNNING");

    try {
      // Files are sent as-is to the backend; no parsing happens client-side.
      const formData = new FormData();
      formData.append("issue", userMessage);
      if (currentThreadId) {
        formData.append("thread_id", currentThreadId);
      }
      (files || []).forEach((file) => {
        formData.append("files", file, file.name);
      });

      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      currentThreadId = data.thread_id || currentThreadId;
      setCaseId(currentThreadId);

      // Append Assistant response
      appendMessage("assistant", data.reply || "No response received.");

      // Update Pipeline UI
      updatePipelineUI(data.pipeline, data.waiting_for_clarification);
    } catch (err) {
      console.error("Chat Error:", err);
      appendMessage("assistant", "System error: Failed to process request.");
      alertBanner.textContent =
        "Something went wrong while reaching the triage engine. Please try again.";
      alertBanner.classList.remove("hidden");
      setStatus("idle", "Ready");
    }
  }

  // ----------------------------------------------------------
  // Event Listeners & UI Reset Actions
  // ----------------------------------------------------------
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const promptValue = chatInput.value.trim();
    if (!promptValue && attachedFiles.length === 0) return;

    const filesToSend = attachedFiles.slice();

    appendMessage(
      "user",
      promptValue || "(Sent files without a message)",
      filesToSend,
    );
    chatInput.value = "";
    clearAttachedFiles();

    await submitConversationalTurn(promptValue, filesToSend);
  });

  // Shift+Enter creates line-breaks, Enter submits immediately
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });

  function clearSession() {
    chatTimeline.innerHTML = "";
    if (welcomeBox) welcomeBox.style.display = "block";
    chatInput.value = "";
    currentThreadId = null;
    isClarificationStage = false;
    clearAttachedFiles();

    alertBanner.classList.add("hidden");
    resetPipeline();
    setCaseId(null);
    setStatus("idle", "Idle");
  }

  clearCaseBtn.addEventListener("click", clearSession);
  newChatBtn.addEventListener("click", clearSession);

  // Initial State Paints
  resetPipeline();
  setCaseId(null);
});