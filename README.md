# MythosEcho 🌌

> Advanced Semantic Knowledge Graph Engine orchestrating multilingual folklore repositories via Google Cloud Agent Builder and Elastic Serverless ELSER ML Hub.

---

## ✨ System Capabilities
* **ELSER v2 Core Semantics:** Real-time query vector expansors processing high-dimensional token embeddings natively inside cluster memory boundaries.
* **Stateless Model Context Protocol (MCP):** A high-performance proxy routing layer exposing Elastic JSON Schemas to external Low-Code environments over authenticated secure public pathways.
* **Dual Pipeline Operation:** Instantaneous client selection controls toggling system routes between raw content orchestration outputs and stateless Agent simulations.
* **Glassmorphic Spatial UI Componentry:** Next.js 14 frontend engine stylized with fluid responsive Tailwind layout anchors and accelerated interaction models.

---

## 🏗 System Architecture Flowchart

```text
+------------------------------------------------------------------------+

|                      NEXT.JS 14 FRONTEND CANVAS                        |
|   - Toggle Selection: Standard Orchestration vs Live Agent Explorer    |
+------------------------------------------------------------------------+

                                    |
                                    | (JSON Body via HTTP POST)
                                    v
+------------------------------------------------------------------------+

|                     FASTAPI API ORCHESTRATION LAYER                     |
|   - /api/v1/mythology/orchestrate  -> Main pipeline processing loop    |
|   - /api/v1/mythology/mcp-bridge   -> Secure API Key injection proxy   |
+------------------------------------------------------------------------+

          |                                              |
          | (Native Client Transport)                    | (Localtunnel Public Bridge)
          v                                              v
+------------------------------------+        +--------------------------+

|      ELASTIC SERVERLESS CLUSTER    |        |    GOOGLE CLOUD AGENT    |
|  - Index: mythology-dataset-en     |        |      STUDIO CANVAS       |
|  - Engine: ELSER v2 ML Model       | <----> |  - Reads MCP Endpoint    |
|  - Field: semantic_text Mapping    |        |  - Dynamic Tool Parsing  |
+------------------------------------+        +--------------------------+
```

---

## ⚖️ Hackathon Compliance Verification (Section 7B)

MythosEcho operates strictly within the boundaries mandated by **Hackathon Section 7B Compliance Frameworks**:
1. **Authorized ML Implementations Only:** The project depends exclusively on the official `@google-genai` SDK and utilizes native models hosted within Google Cloud Vertex AI platforms.
2. **Authorized Enterprise Cloud Partners:** Data expansion tasks are handled exclusively within Elastic Cloud Serverless deployments built natively on Google Cloud instance boundaries.
3. **No Competitor Footprints:** Zero closed-ecosystem competitor code frameworks, processing packages, or proprietary asset interfaces are integrated into any stage of this repository.

---

## 🚀 Environment Deployment Sequence

### 1. Backend Processing Infrastructure Setup
Move into your workspace directory and inject needed library versions:
```bash
cd backend
pip install -r requirements.txt
```

Construct your system environment file inside `backend/.env`:
```env
ELASTIC_SEARCH_URL="https://elastic-cloud.com"
ELASTIC_API_KEY="V0Zsd29wMEJ6U0p3N1dFeldmU3M6bXNuNndfT29SeS1KREdKSlp6S0FFdw=="
GEMINI_API_KEY="AIzaSyA_ExampleVertexAuthorizedTokenHere"
```

Start the Python virtual environment:
```bash
python -m venv .venv
source .venv/Scripts/activate
```

Fire up your local Uvicorn development gateway loop:
```bash
cd app
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend User Interface Deployment
Initialize structural dependency packages and boot your Next.js application workspace:
```bash
cd ../frontend
npm install
npm run dev
```
