# MythosEcho Architecture Diagram Prompt for Eraser.io

## Diagram Title
MythosEcho: Multilingual Creator Content Pipeline

## System Architecture

Create a comprehensive architecture diagram showing the following components and data flows:

### Frontend Layer
- **Next.js Dashboard (React)** at `localhost:3000` with:
  - Query Form: Language selector (EN/HI/TA), Platform selector (YouTube)
  - Creator Flow and Research Boost mode toggles
  - Input field for user prompts
  - Output area showing Creator Blocks with hooks, narratives, and metadata tags

### Backend Layer
- **FastAPI Server** at `localhost:8000` with three main endpoints:
  1. **POST /api/v1/mythology/orchestrate**
     - Receives: user_prompt, language, creator_platform
     - Returns: script_segments, entity_names, seo_metadata_tags
  
  2. **POST /api/v1/mythology/creator-asset** (NEW)
     - Receives: entity_name, target_language, creator_platform
     - Returns: Fully-translated creator asset with hook, narrative, tags
  
  3. **POST /api/v1/mythology/mcp-bridge**
     - Bridges to Elastic Agent Builder MCP
     - Returns: MCP-normalized results

### AI/ML Services
- **Gemini API** (Google Cloud)
  - Input: Elasticsearch context + user prompt in target language
  - Function: Synthesize creator script segments and extract entity_names
  - Output: JSON with thought_process_step, script_segments, entity_names, seo_metadata_tags

- **Elasticsearch Serverless** (Elastic Cloud)
  - Index: `mythology-dataset-en` (multilingual store)
  - Fields:
    - `name`, `pantheon`, `attributes` (English)
    - `translations.hi.name`, `translations.hi.description` (Hindi)
    - `translations.ta.name`, `translations.ta.description` (Tamil)
    - `semantic_description` (ELSER inference field for semantic search)
  - Query types:
    - Semantic search via ELSER
    - Multi-match on language-specific translation fields

### Data Flow (Primary Happy Path)

1. **User → Frontend**: Enters query in Hindi, selects Hindi language, YouTube platform
2. **Frontend → Backend**: POST /orchestrate with user_prompt, language=hi
3. **Backend → Elasticsearch**: 
   - Semantic query on `semantic_description`
   - Language-aware field query on `translations.hi.*`
   - Returns: Context documents with deity info and Hindi translations
4. **Backend → Gemini**: 
   - System instruction: "Generate Hindi content"
   - User content: Platform + prompt + Elastic context
   - Gemini extracts entity_names (e.g., ["Shiva", "Vayu"])
5. **Backend → Frontend**: Returns orchestrate response with entity_names
6. **Frontend → Backend** (Loop): For each entity_name, POST /creator-asset with target_language=hi
7. **Backend → Elasticsearch**: Query for entity "Shiva", extract translations.hi.name/description
8. **Backend → Frontend**: Returns fully-translated CreatorAsset (hook, narrative, tags in Hindi)
9. **Frontend → User**: Displays Creator Blocks with native Hindi hooks and narratives (no English mixing)

### Data Storage
- **Source JSON**: `mythology_raw.json` (primary), `mythology_raw1.json` (Tamil extended)
  - Ingested via `python scripts/ingest_data.py`
  - Creates/refreshes `mythology-dataset-en` Elasticsearch index
  - ELSER model `.elser_model_2` auto-indexes `semantic_description`

### Environment/Config
- **Backend .env**: ELASTIC_URL, ELASTIC_API_KEY, GEMINI_API_KEY, ELASTIC_MCP_URL, FRONTEND_URL
- **Frontend .env.local**: NEXT_PUBLIC_API_BASE_URL

### Key Architectural Decisions to Highlight
- ✅ **No hardcoded translations in frontend** — All multilingual content comes from Elasticsearch
- ✅ **Dual-query strategy** — Combines semantic search (ELSER) + translation-field search for best recall
- ✅ **Entity extraction at backend** — Gemini identifies mythological entities; frontend fetches their translations
- ✅ **Single multilingual index** — `mythology-dataset-en` stores all language variants, scaled via inline translation fields
- ✅ **Creator-asset endpoint** — Dedicated pipeline for fetching and rendering native-language creator blocks

---

## Diagram Style Suggestions
- Use **blue** for frontend layer
- Use **green** for backend services
- Use **orange** for external APIs (Gemini, Elastic)
- Use **purple** for data storage (Elasticsearch)
- Draw **arrows** with labels for data direction and payload types
- Show **language indicators** (EN, HI, TA) on relevant flows
- Highlight the orchestrate→entity extraction→creator-asset flow with bold arrows
