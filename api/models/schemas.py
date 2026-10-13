"""
Pydantic Schemas - Data models for the Testwright API
Defines request/response models for all endpoints
"""

from pydantic import BaseModel
from typing import List, Optional

class SourceTarget(BaseModel):
    """ETL source/target configuration model"""
    type: str
    db: str
    coll: str
    cols_attrs: str

class DocumentProcessResponse(BaseModel):
    """Response model for document processing"""
    success: bool
    message: str
    doc_id: str
    text_length: int
    chunk_count: int
    page_count: Optional[int] = None

class IndexResponse(BaseModel):
    """Response model for document indexing"""
    success: bool
    message: str
    indexed_chunks: int

class RAGQueryRequest(BaseModel):
    """Request model for RAG test case generation"""
    query: str
    user_id: str
    top_k: int = 5
    class_name: str = "Business"
    use_rag: bool = True  # New field to toggle RAG on/off
    is_user_stories: bool = False  # New field to distinguish user stories from test cases
    preview_data: Optional[List[dict]] = None  # Rows already shown in the preview

class RAGQueryResponse(BaseModel):
    success: bool
    test_cases: str
    chunks_retrieved: int

class ETLTestRequest(BaseModel):
    sources: List[SourceTarget]
    targets: List[SourceTarget]
    etl_test_type: str
    rules: str
    language: str

class ETLTestResponse(BaseModel):
    success: bool
    script: str
    language: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
