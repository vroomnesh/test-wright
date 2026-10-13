# ============================================================================
# DOCUMENT SERVICE - PDF/DOCX PROCESSING AND INDEXING
# ============================================================================
# This service handles document upload, processing, and knowledge base creation:
#
# Document Processing Pipeline:
# 1. File upload and validation (PDF/DOCX only)
# 2. Text extraction using specialized libraries:
#    - pdfplumber for PDF files (handles complex layouts)
#    - python-docx for Word documents (preserves formatting)
# 3. Text chunking into 1000-character segments for optimal retrieval
# 4. Embedding generation using the OpenAI embeddings API
# 5. Storage in Weaviate vector database with user isolation
#
# Features:
# - Supports complex PDF layouts and tables
# - Preserves document structure and context
# - User-specific document isolation
# - Efficient chunking for RAG retrieval
# ============================================================================

import io
import pdfplumber
from docx import Document
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.text.paragraph import Paragraph
from docx.table import Table
from typing import Tuple, List
import uuid

from models.schemas import DocumentProcessResponse, IndexResponse
from utils.backend_utils import weaviate_session, index_into_weaviate

class DocumentService:
    def __init__(self):
        self.processed_documents = {}  # Store processed documents temporarily
    
    async def process_document(self, content: bytes, filename: str, user_id: str) -> DocumentProcessResponse:
        """Process uploaded document and extract text"""
        try:
            if filename.lower().endswith('.pdf'):
                text, page_count = self._extract_text_from_pdf(content)
            elif filename.lower().endswith('.docx'):
                text, page_count = self._extract_text_from_docx(content)
            else:
                raise ValueError("Unsupported file type")
            
            # Tokenize and chunk the text
            tokens = self._tokenize(text)
            chunks = self._chunk_tokens(tokens, size=250, overlap=50)
            
            # Generate unique document ID
            doc_id = f"{filename}_{uuid.uuid4().hex[:8]}"
            
            # Store processed document temporarily
            self.processed_documents[doc_id] = {
                'chunks': chunks,
                'user_id': user_id,
                'filename': filename,
                'text': text
            }
            
            return DocumentProcessResponse(
                success=True,
                message=f"Document processed successfully. Generated {len(chunks)} chunks.",
                doc_id=doc_id,
                text_length=len(text),
                chunk_count=len(chunks),
                page_count=page_count
            )
            
        except Exception as e:
            return DocumentProcessResponse(
                success=False,
                message=f"Error processing document: {str(e)}",
                doc_id="",
                text_length=0,
                chunk_count=0
            )
    
    async def index_to_weaviate(self, doc_id: str, user_id: str) -> IndexResponse:
        """Index document chunks into Weaviate"""
        try:
            if doc_id not in self.processed_documents:
                raise ValueError("Document not found. Please upload and process the document first.")
            
            doc_data = self.processed_documents[doc_id]
            chunks = doc_data['chunks']
            
            with weaviate_session() as (oa, client):
                index_into_weaviate(
                    client=client,
                    oa=oa,
                    chunks=chunks,
                    doc_id=doc_id,
                    user_id=user_id,
                    class_name="Business"
                )
            
            # Clean up processed document from memory
            del self.processed_documents[doc_id]
            
            return IndexResponse(
                success=True,
                message="Document indexed successfully!",
                indexed_chunks=len(chunks)
            )
            
        except Exception as e:
            return IndexResponse(
                success=False,
                message=f"Error indexing document: {str(e)}",
                indexed_chunks=0
            )
    
    def _extract_text_from_pdf(self, content: bytes) -> Tuple[str, int]:
        """Extract text from PDF content"""
        parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for p in pdf.pages:
                parts.append(p.extract_text() or "")
        return "\n".join(parts), len(parts)
    
    def _extract_text_from_docx(self, content: bytes) -> Tuple[str, int]:
        """Extract text from DOCX content"""
        doc = Document(io.BytesIO(content))
        lines = []
        for child in doc.element.body.iterchildren():
            if isinstance(child, CT_P):
                para = Paragraph(child, doc)
                if para.text.strip():
                    lines.append(para.text.strip())
            elif isinstance(child, CT_Tbl):
                for row in Table(child, doc).rows:
                    cells = [c.text.replace("\n", " ") for c in row.cells]
                    lines.append(" ".join(cells))
        return "\n".join(lines), len(lines)
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization by splitting on whitespace"""
        return text.split()
    
    def _chunk_tokens(self, tokens: List[str], size: int, overlap: int) -> List[str]:
        """Chunk tokens with overlap"""
        step = size - overlap
        return [
            " ".join(tokens[i : i + size])
            for i in range(0, len(tokens), step)
            if tokens[i : i + size]
        ]
