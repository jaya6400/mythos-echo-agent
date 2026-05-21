# Mythos Echo Agent - Task Tracking & File Structures

This workspace outlines the development tasks and empty file structures for the Next.js Frontend UI, Python FastAPI Backend Server, and Elastic MCP Gateway integration.

## Compliance Guardrail (Hackathon Section 7B)
- **Constraint**: Use only Google Cloud AI tools and authorized partner endpoints.
- **Constraint**: No competitor coding assets or models are permitted.

---

## 1. Python Data Cleaning Scripts
- [ ] `backend/scripts/__init__.py` - Python package initialization.
- [ ] `backend/scripts/cleaner.py` - Core logic for filtering and normalizing raw multilingual mythology content and creator assets.
- [ ] `backend/scripts/parser.py` - Parser to transform diverse raw multilingual mythology content formats into standardized JSON.
- [ ] `backend/scripts/test_cleaner.py` - Unit tests for verification of data cleaning logic.

---

## 2. Backend API Orchestration Layers (FastAPI & Elastic MCP Gateway)
- [ ] `backend/requirements.txt` - Dependency definitions (FastAPI, uvicorn, Elastic MCP SDKs, Google Cloud libraries).
- [ ] `backend/app/__init__.py` - Application package initialization.
- [ ] `backend/app/main.py` - FastAPI app initialization, middleware, routes registering.
- [ ] `backend/app/api/__init__.py` - API endpoints configuration.
- [ ] `backend/app/api/endpoints/mythology.py` - CRUD and processing endpoints for multilingual mythology content and creator assets.
- [ ] `backend/app/services/__init__.py` - External services connectors initialization.
- [ ] `backend/app/services/elastic_mcp.py` - Connector client to the Elastic MCP Gateway utilizing authorized SDK endpoints.
- [ ] `backend/app/core/config.py` - Application environment settings, Google Cloud AI and Elastic connection parameters.

---

## 3. Next.js Mythology Dashboard UI
- [ ] `frontend/package.json` - Frontend Node packages configurations.
- [ ] `frontend/tsconfig.json` - TypeScript configuration.
- [ ] `frontend/src/app/layout.tsx` - Root layout with global styling and typography.
- [ ] `frontend/src/app/page.tsx` - Main page rendering the dashboard.
- [ ] `frontend/src/components/Sidebar.tsx` - Sidebar component displaying multilingual mythology content and creator assets hierarchy, connection statuses, and navigation.
- [ ] `frontend/src/components/DashboardContainer.tsx` - Parent layout linking the sidebar and main mythology content view.
- [ ] `frontend/src/styles/globals.css` - Global styling configurations.
