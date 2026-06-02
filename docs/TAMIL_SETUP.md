# Using mythology_raw1.json with Tamil Translations

## Quick Answer: Can I run mythology_raw1.json?

**Yes!** `mythology_raw1.json` is ready to use and includes Tamil translations for all 5 deities. No issues — just follow the steps below.

## Setup Options

### Option A: Simple File Rename (Recommended for quick setup)

```powershell
cd d:\mythos-echo-agent\backend\scripts

# Backup original
mv mythology_raw.json mythology_raw.json.backup

# Use the extended dataset with Tamil
mv mythology_raw1.json mythology_raw.json
```

Then run ingestion:
```powershell
cd d:\mythos-echo-agent\backend
.\.venv\Scripts\activate
python scripts\ingest_data.py
```

### Option B: Keep Both & Switch via Code

Edit `backend/scripts/ingest_data.py` line ~35:

**Current:**
```python
raw_json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mythology_raw.json")
```

**Change to:**
```python
raw_json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mythology_raw1.json")
```

Then run:
```powershell
python scripts\ingest_data.py
```

## What mythology_raw1.json Contains

5 mythological deities with full translations:

- **Thor** (Norse)
  - English: lightning, strength, storm
  - Hindi: थोर
  - Tamil: தோர் ✅

- **Zeus** (Greek)
  - English: thunder, sky, law, order, justice
  - Hindi: ज्यूस
  - Tamil: ஜூபிடர் ✅

- **Shiva** (Hindu)
  - English: destruction, asceticism, yoga, meditation
  - Hindi: शिव
  - Tamil: சிவன் ✅

- **Vayu** (Hindu - Wind God)
  - English: wind, breath, speed, life-force
  - Hindi: वायु
  - Tamil: வாயு ✅

- **Ra** (Egyptian)
  - English: sun, warmth, creation, light
  - Hindi: रा
  - Tamil: ரா ✅

## Verification After Ingestion

Check that Tamil translations are indexed:

```bash
# In browser, go to Elastic Cloud Kibana DevTools console

GET mythology-dataset-en/_search
{
  "query": {
    "match": {
      "translations.ta.name": "சிவன்"
    }
  }
}
```

Should return Shiva document with Tamil fields populated.

## Using Tamil in the UI

After ingestion:

1. Open frontend at `http://localhost:3000`
2. From Script Layout dropdown, select **"Tamil creator research"** (or similar Tamil option)
3. Enter a query: "Tell me about Shiva"
4. Language selector automatically switches to **Tamil**
5. Click "Orchestrate"
6. Backend will:
   - Query Elasticsearch for `translations.ta.name` and `translations.ta.description`
   - Pass context to Gemini with language instruction
   - Gemini extracts entity_names from Tamil context
7. Frontend fetches `/creator-asset` with `target_language=ta`
8. Display: **Native Tamil creator hooks and narratives** ✅

## Troubleshooting

**Q: I see English text in Hindi/Tamil mode**
- ✅ Now fixed! The new `/creator-asset` endpoint generates fully-translated content
- Make sure backend is running: `uvicorn main:app --reload` in `backend/app`
- Check browser console for fetch errors

**Q: Data ingestion fails**
- Ensure Elasticsearch is running and credentials are correct in `.env`
- Run: `curl $ELASTIC_URL` to verify connection
- Check: `ingest_data.py` points to correct JSON file

**Q: Tamil queries return no results**
- Verify ingestion completed by checking Elastic DevTools
- Make sure `mythology_raw1.json` is actually being used (not original file)
- Re-run ingestion: `python scripts/ingest_data.py`
