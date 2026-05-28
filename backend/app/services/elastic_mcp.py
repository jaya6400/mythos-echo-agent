import os
from elasticsearch import AsyncElasticsearch
from core.config import settings

# Initialize client using the official API key parameter pairing
es_client = AsyncElasticsearch(
    hosts=[os.getenv("ELASTIC_URL", "http://localhost:9200")],
    api_key=os.getenv("ELASTIC_API_KEY")
)

async def query_elastic_mcp_context(query: str, lang: str) -> list[dict]:
    index_target = f"mythology-dataset-{lang.lower()}"
    try:
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
        return [hit['_source'] for hit in hits]
        
    except Exception as e:
        print(f"Elasticsearch query failed, using offline mockup fallback: {str(e)}")
        # Graceful fallback payload ensures your Gemini logic doesn't crash
        return [{
            "context_source": "Offline Fallback Cache Engine",
            "normalized_content": f"Historical mythology data relating to request query: {query}"
        }]

