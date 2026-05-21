from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API server for Mythos Echo Agent handling mythology character indexing and vector queries.",
    version="1.0.0",
)

# Set up CORS middleware to allow communication from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to allow only specific origins (e.g., frontend URL)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """
    Root endpoint redirect or basic API information.
    """
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API. Access /docs for Swagger documentation."
    }

@app.get("/health")
def health_check():
    """
    Health check route returning status indicators for Elastic and Google APIs.
    """
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "config_status": {
            "elastic_configured": settings.has_elastic_credentials,
            "google_cloud_configured": bool(settings.GOOGLE_CLOUD_PROJECT),
            "gemini_api_configured": bool(settings.GEMINI_API_KEY),
        }
    }
