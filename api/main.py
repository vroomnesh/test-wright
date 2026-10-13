# ============================================================================
# TESTWRIGHT API - MAIN FASTAPI APPLICATION
# ============================================================================
# This is the central FastAPI application that orchestrates all Testwright functionality:
# - Document processing and indexing into Weaviate vector database
# - RAG-based test case generation using the OpenAI API
# - ETL test script generation with Excel configuration support
# - Knowledge base management with data isolation by user_id
# ============================================================================

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel
from typing import List, Optional
import io
import os
import tempfile
from dotenv import load_dotenv

# ============================================================================
# SERVICE LAYER IMPORTS
# ============================================================================
# Each service handles a specific domain of functionality with clean separation
from services.document_service import DocumentService          # PDF/DOCX processing & Weaviate indexing
from services.image_service import ImageService                # GPT-4 Vision image analysis
from services.rag_service import RAGService                    # RAG & non-RAG test case generation
from services.etl_service import ETLService                    # ETL test script generation
from services.knowledge_service import KnowledgeService        # Weaviate knowledge base management

# ============================================================================
# PYDANTIC SCHEMA IMPORTS
# ============================================================================
# Type-safe request/response models for API validation
from models.schemas import (
    DocumentProcessResponse,    # Document upload response
    RAGQueryRequest,           # RAG generation request
    RAGQueryResponse,          # RAG generation response
    ETLTestRequest,            # ETL test generation request
    ETLTestResponse,           # ETL test generation response
    SourceTarget               # ETL source/target mapping model
)

# ============================================================================
# APPLICATION INITIALIZATION
# ============================================================================
load_dotenv()  # Load environment variables from .env file

app = FastAPI(
    title="Testwright API",
    description="Testwright - AI assistant for writing test cases and ETL tests",
    version="1.0.0"
)

# ============================================================================
# MIDDLEWARE CONFIGURATION
# ============================================================================
# CORS middleware to allow frontend access from multiple domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",                    # React dev server (default)
        "http://localhost:3002",                    # Testwright frontend port
        "http://localhost:3003",                    # Alternative dev port
        "http://localhost:5173",                    # Vite dev server
    ],
    allow_credentials=True,                         # Allow cookies/auth headers
    allow_methods=["*"],                           # Allow all HTTP methods
    allow_headers=["*"],                           # Allow all headers
)

# ============================================================================
# SERVICE LAYER INITIALIZATION
# ============================================================================
# Initialize all service classes - these handle the business logic for each feature
document_service = DocumentService()                    # Handles PDF/DOCX processing
image_service = ImageService()                          # Handles GPT-4 Vision analysis
rag_service = RAGService()                              # Handles RAG test generation
etl_service = ETLService()                              # Handles ETL test generation
knowledge_service = KnowledgeService()                  # Handles Weaviate operations

# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================
@app.get("/")
async def root():
    """Root endpoint - API status check"""
    return {"message": "Testwright API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and Docker health checks"""
    return {"status": "healthy"}

# ============================================================================
# DOCUMENT PROCESSING ENDPOINTS
# ============================================================================
# These endpoints handle PDF/DOCX upload, text extraction, chunking, and indexing
@app.post("/api/documents/upload", response_model=DocumentProcessResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """Upload and process a PDF or DOCX document"""
    try:
        if not file.filename.lower().endswith(('.pdf', '.docx')):
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
        content = await file.read()
        result = await document_service.process_document(content, file.filename, user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/index")
async def index_document(
    doc_id: str = Form(...),
    user_id: str = Form(...)
):
    """Index processed document chunks into Weaviate"""
    try:
        result = await document_service.index_to_weaviate(doc_id, user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Image processing endpoints
@app.post("/api/images/upload", response_model=DocumentProcessResponse)
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """Upload and analyze an image using the OpenAI vision model"""
    try:
        if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')):
            raise HTTPException(status_code=400, detail="Only image files (JPG, PNG, GIF, BMP, WebP) are supported")

        content = await file.read()
        result = await image_service.process_image(content, file.filename, user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/images/index")
async def index_image(
    img_id: str = Form(...),
    user_id: str = Form(...)
):
    """Index processed image analysis chunks into Weaviate"""
    try:
        result = await image_service.index_to_weaviate(img_id, user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# RAG TEST CASE GENERATION ENDPOINTS
# ============================================================================
# These endpoints handle both RAG and non-RAG test case generation
@app.post("/api/rag/generate", response_model=RAGQueryResponse)
async def generate_rag_test_cases(request: RAGQueryRequest):
    """Generate test cases using RAG or non-RAG mode"""
    try:
        result = await rag_service.generate_test_cases(
            query=request.query,
            user_id=request.user_id,
            top_k=request.top_k,
            class_name=request.class_name,
            use_rag=request.use_rag,
            is_user_stories=request.is_user_stories
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/download-excel")
async def download_rag_excel(request: RAGQueryRequest):
    """Download RAG or non-RAG test cases as Excel file"""
    try:
        excel_bytes = await rag_service.generate_excel(
            query=request.query,
            user_id=request.user_id,
            top_k=request.top_k,
            class_name=request.class_name,
            use_rag=request.use_rag,
            preview_data=request.preview_data,
        )

        filename = "rag_test_cases.xlsx" if request.use_rag else "test_cases.xlsx"
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/preview-test-cases")
async def preview_rag_test_cases(request: RAGQueryRequest):
    """Preview RAG or non-RAG test cases without generating Excel"""
    try:
        preview_data = await rag_service.preview_test_cases(
            query=request.query,
            user_id=request.user_id,
            top_k=request.top_k,
            class_name=request.class_name,
            use_rag=request.use_rag
        )

        return {
            "success": True,
            "preview_data": preview_data,
            "total_test_cases": len(preview_data),
            "rag_enabled": request.use_rag,
            "message": f"Preview generated for {len(preview_data)} test cases ({'with RAG context' if request.use_rag else 'without RAG context'})"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ETL TEST GENERATION ENDPOINTS
# ============================================================================
# These endpoints handle ETL test script generation via manual config and Excel upload
@app.post("/api/etl/generate-script", response_model=ETLTestResponse)
async def generate_etl_script(request: ETLTestRequest):
    """Generate ETL test script"""
    try:
        result = await etl_service.generate_test_script(
            sources=request.sources,
            targets=request.targets,
            etl_test_type=request.etl_test_type,
            rules=request.rules,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/etl/download-excel")
async def download_etl_excel(request: ETLTestRequest):
    """Download ETL test cases as Excel file"""
    try:
        excel_bytes = await etl_service.generate_excel(
            sources=request.sources,
            targets=request.targets,
            etl_test_type=request.etl_test_type,
            rules=request.rules,
            language=request.language
        )
        
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=etl_test_cases.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/etl/upload-excel")
async def upload_etl_excel(file: UploadFile = File(...)):
    """Upload Excel file and extract ETL configuration"""
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are allowed")

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Extract ETL configuration from Excel
            config = await etl_service.parse_excel_config(temp_file_path)
            return config

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/etl/generate-excel-from-upload")
async def generate_excel_from_upload(request: dict):
    """Generate Excel file from multiple test cases extracted from uploaded file"""
    try:
        test_cases = request.get('test_cases', [])
        if not test_cases:
            raise HTTPException(status_code=400, detail="No test cases provided")

        excel_bytes = await etl_service.generate_excel_from_multiple_test_cases(test_cases)

        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=etl_multiple_test_cases.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Knowledge Management Endpoints
@app.get("/knowledge/{user_id}")
async def get_user_knowledge(user_id: str):
    """Get all documents/images indexed by a user"""
    try:
        result = await knowledge_service.get_user_knowledge(user_id)
        return {"files": result.get("documents", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user knowledge: {str(e)}")

@app.delete("/knowledge/{user_id}/{doc_id}")
async def delete_document(user_id: str, doc_id: str):
    """Delete a specific document from the knowledge base"""
    try:
        result = await knowledge_service.delete_document(user_id, doc_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

@app.put("/knowledge/{user_id}/{doc_id}/rename")
async def rename_document(user_id: str, doc_id: str, new_name: str = Body(..., embed=True)):
    """Rename a specific document in the knowledge base"""
    try:
        result = await knowledge_service.rename_document(user_id, doc_id, new_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error renaming document: {str(e)}")

@app.get("/knowledge/{user_id}/{doc_id}/details")
async def get_document_details(user_id: str, doc_id: str):
    """Get detailed information about a specific document"""
    try:
        result = await knowledge_service.get_document_details(user_id, doc_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting document details: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        limit_max_requests=1000,
        limit_concurrency=100,
        timeout_keep_alive=30,
        timeout_graceful_shutdown=30
    )
