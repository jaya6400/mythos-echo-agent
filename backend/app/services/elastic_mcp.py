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
    index_target = f"mythology-dataset-{lang.lower()}"
    try:
        # Programmatic verification of index existence to avoid 404 index_not_found_exception
        if not await es_client.indices.exists(index=index_target):
            logger.warning(f"Elasticsearch index '{index_target}' not found. Falling back to offline mockup context.")
            return [{
                "context_source": "Offline Fallback Cache Engine",
                "normalized_content": f"Historical mythology data relating to request query: {query}"
            }]

        logger.info(f"Querying Elastic index '{index_target}' for: {query}")
        response = await es_client.search(
            index=index_target,
            body={
                "query": {
                    "match": {
                        "normalized_content": query
                    }
                },
                "size": 3
            }
        )
        hits = response.get('hits', {}).get('hits', [])
        hit_ids = [hit['_id'] for hit in hits]
        
        logger.info(f"ELASTIC_SUCCESS: Found {len(hits)} docs. IDs: {hit_ids}")
        return [hit['_source'] for hit in hits]
        
    except Exception as e:
        logger.error(f"Elasticsearch query failed: {str(e)}")
        # Graceful fallback payload ensures your Gemini logic doesn't crash
        return [{
            "context_source": "Offline Fallback Cache Engine",
            "normalized_content": f"Historical mythology data relating to request query: {query}"
        }]
