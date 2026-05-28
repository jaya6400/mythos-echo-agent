import os
import sys
import json
import asyncio
from elasticsearch import AsyncElasticsearch
from dotenv import load_dotenv

# Ensure we can import from cleaner and parser
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parser import parse_file

# Load environment variables
# load_dotenv("backend/app/.env")
# load_dotenv("app/.env")
load_dotenv()

ELASTIC_URL = os.getenv("ELASTIC_URL", "http://localhost:9200")
ELASTIC_API_KEY = os.getenv("ELASTIC_API_KEY")

async def main():
    print("Initializing Elasticsearch Data Loader...")
    print(f"Target Cluster URL: {ELASTIC_URL}")
    if not ELASTIC_API_KEY:
        print("Warning: ELASTIC_API_KEY is not set. Connecting without API key.")
    
    # Initialize AsyncElasticsearch
    es_client = AsyncElasticsearch(
        hosts=[ELASTIC_URL],
        api_key=ELASTIC_API_KEY
    )
    
    index_name = "mythology-dataset-en"
    
    try:
        # 1. Programmatically verify and create index if missing
        index_exists = await es_client.indices.exists(index=index_name)
        if not index_exists:
            print(f"Index '{index_name}' not found. Creating index...")
            await es_client.indices.create(
                index=index_name,
                body={
                    "mappings": {
                        "properties": {
                            "id": { "type": "keyword" },
                            "name": { "type": "text" },
                            "pantheon": { "type": "keyword" },
                            "attributes": { "type": "keyword" },
                            "description": { "type": "text" },
                            "translations": { "type": "object" },
                            "vector_text": { "type": "text" },
                            "normalized_content": { "type": "text" },
                            "metadata": { "type": "object" }
                        }
                    }
                }
            )
            print(f"Index '{index_name}' created successfully.")
        else:
            print(f"Index '{index_name}' already exists.")
            
        # 2. Parse raw dataset payload using local parser
        raw_json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mythology_raw.json")
        print(f"Parsing raw dataset from: {raw_json_path}")
        
        parsed_documents = parse_file(raw_json_path)
        print(f"Successfully parsed and cleaned {len(parsed_documents)} records.")
        
        # 3. Index documents into the cluster
        for doc in parsed_documents:
            # Map the clean vector text directly to normalized_content for compatibility with search queries
            doc["normalized_content"] = doc["vector_text"]
            
            doc_id = doc["id"]
            print(f"Indexing document {doc_id} ('{doc['name']}')...")
            
            await es_client.index(
                index=index_name,
                id=doc_id,
                document=doc
            )
            
        # 4. Refresh index to make documents immediately searchable
        await es_client.indices.refresh(index=index_name)
        
        # Get count to verify
        count_resp = await es_client.count(index=index_name)
        print(f"\nSeeding complete. Total documents in '{index_name}': {count_resp.get('count')}")
        
    except Exception as e:
        print(f"\nError occurred during data ingestion: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        await es_client.close()

if __name__ == "__main__":
    asyncio.run(main())
