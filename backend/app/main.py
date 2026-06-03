from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from endpoints import mythology
import logging

# Configure logging for Uvicorn and your application
log_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"default": {"fmt": "%(levelname)s: %(name)s - %(message)s"}},
    "handlers": {"default": {"formatter": "default", "class": "logging.StreamHandler", "stream": "ext://sys.stdout"}},
    "loggers": {"uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False}, "uvicorn.error": {"handlers": ["default"], "level": "INFO", "propagate": False}, "uvicorn.access": {"handlers": ["default"], "level": "INFO", "propagate": False}, "": {"handlers": ["default"], "level": "INFO"}},
}
logging.config.dictConfig(log_config)

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API server for Mythos Echo Agent handling mythology character indexing and vector queries.",
    version="1.0.0",
)

# Set up CORS middleware to allow communication from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(mythology.router, prefix="/api/v1/mythology", tags=["mythology"])

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
