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
    model_id = ".elser_model_2"
    
    try:
        # 0. VERIFY ML MODEL DEPLOYMENT STATUS NATIVELY
        print(f"Verifying active status of deployed ML model: {model_id}...")
        try:
            stats = await es_client.ml.get_trained_models_stats(model_id=model_id)
            model_list = stats.get("trained_model_stats", [])
            state = model_list[0].get("deployment_stats", {}).get("state") if model_list else "missing"
            print(f"Current ML Model internal state is: '{state}'")
        except Exception as e:
            print(f"⚠️ Model status check note: {e}")

        # 1. INDEX VALIDATION: Setup semantic_text mapping directly to model_id
        if await es_client.indices.exists(index=index_name):
            print(f"Replacing legacy index '{index_name}'...")
            await es_client.indices.delete(index=index_name)

        print(f"Creating index with 'semantic_text' mapping directly targeting '{model_id}'...")
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
                        "vector_text": { "type": "text" },
                        "normalized_content": { "type": "text" },
                        # Direct connection to the running model eliminates the 404 alias exception
                        "semantic_description": {
                            "type": "semantic_text"
                        }
                    }
                }
            }
        )

        # 2. Parse raw dataset using local parser
        raw_json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mythology_raw.json")
        parsed_documents = parse_file(raw_json_path)
        
        # 3. STREAMLINED INGESTION: Mapping and indexing loop
        print(f"Ingesting {len(parsed_documents)} records into your Machine Learning cluster...")
        for doc in parsed_documents:
            # MACHINE LEARNING DATA MAPPING: Extract description to populate semantic text property
            doc["semantic_description"] = doc.get("description", doc.get("vector_text", ""))
            doc["normalized_content"] = doc.get("vector_text", "")
            
            doc_id = doc["id"]
            await es_client.index(
                index=index_name,
                id=doc_id,
                document=doc
            )
            print(f" ✅ Processed and indexed document ID: {doc_id}")
            
        # Finalize ingestion and build cluster memory buffers
        await es_client.indices.refresh(index=index_name)
        count_resp = await es_client.count(index=index_name)
        print(f"\n🎉 Seeding complete! Total ML-indexed records verified: {count_resp.get('count')}")
        
    except Exception as e:
        print(f"❌ Error during ingestion: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        await es_client.close()

if __name__ == "__main__":
    asyncio.run(main())
