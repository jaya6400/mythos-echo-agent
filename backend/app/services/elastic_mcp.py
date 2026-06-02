import os
import logging
from elasticsearch import AsyncElasticsearch
from core.config import settings
 
logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.INFO)

# Initialize client using the official API key parameter pairing
es_client = AsyncElasticsearch(
    hosts=[os.getenv("ELASTIC_URL", "http://localhost:9200")],
    api_key=os.getenv("ELASTIC_API_KEY")
)

async def query_elastic_mcp_context(query: str, lang: str) -> list[dict]:
    # Always use the single multilingual index which contains translations
    index_target = "mythology-dataset-en"
    try:
        # Ensure the multilingual index exists; if it doesn't, fall back gracefully
        if not await es_client.indices.exists(index=index_target):
            logger.warning(f"Elasticsearch index '{index_target}' not found. Falling back to offline mockup context.")
            return [{
                "context_source": "Offline Fallback Cache Engine",
                "normalized_content": f"Historical mythology data relating to request query: {query}"
            }]

        # Build a translation-aware query. Use the semantic field (ELSER) plus
        # language-specific translation fields when a non-English language is requested.
        name_fields = ["name^2", "description"]
        if lang and lang.lower() == "hi":
            name_fields = ["translations.hi.name^2", "translations.hi.description"]
        elif lang and lang.lower() == "ta":
            name_fields = ["translations.ta.name^2", "translations.ta.description"]

        logger.info(f"Querying Elastic index '{index_target}' for: {query} (lang={lang})")
        body = {
            "query": {
                "bool": {
                    "should": [
                        {
                            "semantic": {
                                "field": "semantic_description",
                                "query": query
                            }
                        },
                        {
                            "multi_match": {
                                "query": query,
                                "fields": name_fields,
                                "type": "most_fields"
                            }
                        }
                    ]
                }
            },
            "size": 3
        }

        response = await es_client.search(index=index_target, body=body)
        hits = response.get("hits", {}).get("hits", [])
        hit_ids = [hit.get("_id") for hit in hits]

        logger.info(f"ELASTIC_SUCCESS: Found {len(hits)} docs. IDs: {hit_ids}")
        return [hit.get("_source", {}) for hit in hits]

    except Exception as e:
        logger.error(f"Elasticsearch query failed: {str(e)}")
        return [{
            "context_source": "Offline Fallback Cache Engine",
            "normalized_content": f"Historical mythology data relating to request query: {query}"
        }]
