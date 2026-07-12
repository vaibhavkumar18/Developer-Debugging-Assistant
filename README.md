# 🚀 Developer Debugging Copilot

![Status](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_Workflow-orange)
![LangChain](https://img.shields.io/badge/LangChain-RAG-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

An AI-powered **Developer Debugging Copilot** that helps developers diagnose software issues through an intelligent debugging workflow. Instead of acting like a generic chatbot, it gathers missing context, performs retrieval over technical knowledge bases, and generates structured debugging reports with likely root causes, debugging plans, and probable fixes.

---

# 🌐 Live Demo

Frontend: https://developer-debugging-assistant.vercel.app/

Backend API: https://developer-debugging-assistant-be.onrender.com

---

# 📖 Overview

Developer Debugging Copilot is designed to simulate how an experienced software engineer approaches debugging.

Rather than immediately guessing the solution, the system:

- Extracts structured debugging information.
- Detects missing technical context.
- Asks clarification questions using Human-in-the-Loop (HITL).
- Retrieves relevant technical documentation using Retrieval-Augmented Generation (RAG).
- Produces an evidence-based debugging report.
- Reviews its own diagnosis before presenting the final answer.

The project is built using **LangGraph** to orchestrate the complete debugging workflow while **FastAPI** exposes a production-ready API consumed by a standalone frontend.

---

# ✨ Key Features

- ✅ AI-powered debugging workflow
- ✅ Human-in-the-Loop clarification system
- ✅ Multi-step LangGraph workflow
- ✅ Retrieval-Augmented Generation (RAG)
- ✅ Multiple technical knowledge bases
- ✅ Upload multiple code files
- ✅ ChatGPT-style conversational interface
- ✅ Structured debugging reports
- ✅ Technical root cause analysis
- ✅ Intelligent retrieval query generation
- ✅ Self-review before final response
- ✅ Session-based conversations
- ✅ Markdown rendering
- ✅ Copyable code blocks
- ✅ Pipeline visualization

---

# 🏗 Architecture

```
                          User
                            │
                            ▼
                   Chat Interface (HTML/CSS/JS)
                            │
                            ▼
                     FastAPI REST API
                            │
                            ▼
                      LangGraph Workflow
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
 Intake Extraction     Context Review      HITL Clarification
       │                    │                    │
       └────────────────────┴────────────────────┘
                            │
                            ▼
               Retrieval Query Generation
                            │
        ┌────────────┬─────────────┬─────────────┬────────────┐
        ▼            ▼             ▼             ▼
 Frontend KB    Backend KB    Config KB    LangGraph KB
        │            │             │             │
        └────────────┴─────────────┴─────────────┘
                            │
                            ▼
                     Diagnosis Engine
                            │
                            ▼
                     Reviewer Agent
                            │
                            ▼
                      Final AI Report
```

---

# 🛠 Tech Stack

| Layer | Technology |
|---------|------------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | FastAPI |
| AI Workflow | LangGraph |
| LLM Framework | LangChain |
| Embeddings | Mistral Embeddings |
| Vector Database | ChromaDB |
| Retrieval | RAG |
| LLM | Mistral AI |
| State Management | LangGraph State |
| Memory | MemorySaver |
| API | REST API |
| Deployment | Render |

---

# 📂 Project Structure

```
Developer-Debugging-Copilot
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── config.js
│   └── assets/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── knowledge_base/
│   │   ├── frontend_debug.md
│   │   ├── backend_api_debug.md
│   │   ├── config_dependency_debug.md
│   │   └── langgraph_langchain_debug.md
│   │
│   ├── db/
│   │   ├── frontend/
│   │   ├── backend/
│   │   ├── config/
│   │   └── langgraph/
│   │
│   └── uploads/
│
├── README.md
└── LICENSE
```

---

# 🧠 LangGraph Workflow

```
User Issue
      │
      ▼
Intake Extraction
      │
      ▼
Context Recheck
      │
      ▼
Need Clarification?
      │
 ┌────┴────┐
 │         │
Yes        No
 │         │
 ▼         ▼
HITL     Retrieval
 │         │
 ▼         ▼
Merge   Diagnosis
 │         │
 └────► Reviewer
           │
           ▼
     Final Report
```

---

# 📊 Generated Report

Every debugging report contains:

- Debugging Summary
- Diagnosis
- Likely Root Causes
- Debug Plan
- Probable Fix
- Retrieved Context
- Technical Evidence

---

# 📁 Knowledge Bases

The assistant retrieves information from multiple specialized knowledge bases.

- Frontend Debugging
- Backend APIs
- Configuration Issues
- LangGraph & LangChain

---

# 📤 Supported File Uploads

The assistant supports uploading multiple files.

```
.js
.jsx
.ts
.tsx
.py
.java
.cpp
.c
.go
.rs
.json
.env
.yml
.yaml
.log
.txt
.md
```

---

# 🚀 Getting Started

---

# Frontend Setup
```bash
cd Frontend
```

## Clone Repository

```bash
git clone https://github.com/vaibhavkumar18/Developer-Debugging-Assistant/
```

Open

```
index.html
```


---

# Backend Setup

```bash
cd backend
```
## Clone The Repo
```bash
git clone https://github.com/vaibhavkumar18/Developer-Debugging-Assistant-be
```

```bash
python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

uvicorn main:fastapi_app --reload
```

---

# API Reference

| Method | Endpoint | Description | Auth |
|----------|----------|-------------|------|
| POST | /chat | Start or continue debugging conversation | No |
| GET | /health | Health Check | No |

---

# Example Request

```http
POST /chat
```

Form Data

```
issue

thread_id

files[]
```

---

# Example Response

```json
{
  "thread_id": "debug-12345",
  "reply": "Diagnosis generated...",
  "waiting_for_clarification": false,
  "pipeline": [
    {
      "node": "Diagnosis",
      "status": "done"
    }
  ]
}
```

---

# Human-in-the-Loop (HITL)

When the assistant detects missing debugging information:

1. It pauses the workflow.
2. Generates clarification questions.
3. Waits for the developer's response.
4. Merges new information into the debugging context.
5. Continues the diagnosis.

This prevents hallucinations and improves debugging accuracy.

---

# Environment Variables

| Variable | Description |
|------------|-------------|
| MISTRAL_API_KEY | Mistral API Key |
| FRONTEND_URL | Frontend URL |
| PORT | Automatically assigned by Render (optional locally) |

---

# Deployment

Backend

- Render

Frontend

- GitHub Pages / Netlify / Vercel

---

# Future Improvements

- GitHub Repository Analysis
- AI Coding Agent
- Automatic Patch Generation
- Docker Support
- Authentication
- Conversation Persistence
- Repository-Level Code Search
- Agent Tool Calling
- Test Case Generation
- Multi-Agent Architecture

---

# Contributing

```bash
# Fork Repository

git clone <(https://github.com/vaibhavkumar18/Developer-Debugging-Assistant-be>

# Create Branch

git checkout -b feature-name

# Commit

git commit -m "Added new feature"

# Push

git push origin feature-name

# Create Pull Request
```

---

# Author

**Vaibhav**

GitHub

https://github.com/vaibhavkumar18/

LinkedIn

https://www.linkedin.com/in/vaibhavcodes/

Email

vaibhavkumarnigam30@gmail.com

---

# License

This project is licensed under the MIT License.

---

# ⭐ Support

If you found this project helpful or interesting, please consider giving it a **⭐ Star** on GitHub.

It helps others discover the project and motivates future improvements.

Happy Debugging! 🚀
