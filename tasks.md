# Mythos Echo Agent - Task Tracking & File Structures

This workspace outlines the development tasks and empty file structures for the Next.js Frontend UI, Python FastAPI Backend Server, and Elastic MCP Gateway integration.

## Compliance Guardrail (Hackathon Section 7B)
- **Constraint**: Use only Google Cloud AI tools and authorized partner endpoints.
- **Constraint**: No competitor coding assets or models are permitted.

---

## 1. Python Data Cleaning Scripts
- [x] `backend/scripts/__init__.py` - Python package initialization.
- [x] `backend/scripts/cleaner.py` - Core logic for filtering and normalizing raw multilingual mythology content and creator assets.
- [x] `backend/scripts/parser.py` - Parser to transform diverse raw multilingual mythology content formats into standardized JSON.
- [x] `backend/scripts/test_cleaner.py` - Unit tests for verification of data cleaning logic.

---

## 2. Backend API Orchestration Layers (FastAPI & Elastic MCP Gateway)
- [x] `backend/requirements.txt` - Dependency definitions (FastAPI, uvicorn, elasticsearch, google-genai, python-dotenv).
- [x] `backend/app/main.py` - FastAPI app initialization, CORS middleware, and router registration.
- [x] `backend/app/endpoints/mythology.py` - Core POST orchestrate content generation endpoint.
- [x] `backend/app/services/elastic_mcp.py` - Asynchronous Elastic Search querying connector with fallback logic.
- [x] `backend/app/core/config.py` - Environment-based configuration loader (loads credentials from `.env` or system environment).
- [x] `backend/scripts/test_integration.py` - End-to-end integration test of the FastAPI endpoint.

---

## 3. Next.js Mythology Dashboard UI
- [x] `frontend/package.json` - Frontend Node packages configurations.
- [x] `frontend/tsconfig.json` - TypeScript configuration.
- [x] `frontend/src/app/layout.tsx` - Root layout with global styling and typography.
- [x] `frontend/src/app/page.tsx` - Main page rendering the dashboard.
- [x] `frontend/src/components/Sidebar.tsx` - Sidebar component displaying multilingual mythology content and creator assets hierarchy, connection statuses, and navigation.
- [x] `frontend/src/components/DashboardContainer.tsx` - Parent layout linking the sidebar and main mythology content view.
- [x] `frontend/src/styles/globals.css` - Global styling configurations.

---

## 4. System Integrations & Fixes
- [x] **Ingest Folklore Data**: Create the `mythology-dataset-en` index on Elasticsearch and populate it with folklore data to resolve the `NotFoundError (404)` on `/api/v1/mythology/orchestrate`.
- [x] **Run Data Cleaning**: Build/execute python cleaning scripts to clean incoming multilingual raw records before pushing them into the Elastic cluster.

## 5. Google Cloud Agent Builder & ML Extension (Hackathon Compliance)
- [x] Enable ELSER Semantic ML Model inside Elasticsearch for advanced folklore vector search.
- [x] Expose the Native Elastic Serverless MCP Endpoint from the Kibana Agent Builder UI.
- [x] Provision a Gemini Agent inside Google Cloud Agent Builder console.
- [x] Connect the Elastic MCP server as a native tool within the Google Agent Builder Canvas.
- [x] Refactor Frontend Dashboard to support both '/orchestrate' and stateless '/mcp-bridge' agent simulation modes.


