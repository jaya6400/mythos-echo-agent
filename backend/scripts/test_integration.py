import httpx
import json

def test_mythology_query_integration():
    """
    Integration test to verify the Mythos Echo Agent API endpoint.
    Sends a POST request to the local development server and prints the response.
    """
    # Fixed full local routing path string targeting the orchestrate endpoint
    url = "http://127.0.0.1:8000/api/v1/mythology/orchestrate"
    
    payload = {
        "user_prompt": "Explain the power of Thor's hammer Mjolnir",
        "language": "en",
        "creator_platform": "YouTube"
    }
    
    print(f"Sending request to: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        # Using httpx with extended timeout to allow Gemini generation time
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            
            print("\n--- Response Received ---")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            
    except httpx.ConnectError:
        print("\nError: Could not connect to the server. Ensure FastAPI is running at http://127.0.0.1:8000")
    except httpx.HTTPStatusError as e:
        print(f"\nHTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")

if __name__ == "__main__":
    test_mythology_query_integration()

