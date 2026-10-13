"""
Image Service - Handles image processing and analysis
Processes images using GPT-4 Vision and indexes analysis into Weaviate
"""

import base64
from typing import List
import uuid

from models.schemas import DocumentProcessResponse, IndexResponse
from utils.backend_utils import weaviate_session, index_into_weaviate, load_env, init_openai

class ImageService:
    def __init__(self):
        self.processed_images = {}  # Store processed images temporarily
        self.env = load_env()
    
    async def process_image(self, content: bytes, filename: str, user_id: str) -> DocumentProcessResponse:
        """Process uploaded image and extract analysis using the OpenAI vision model"""
        try:
            # Check image size and compress if needed
            if len(content) > 4 * 1024 * 1024:  # 4MB limit
                raise ValueError("Image file too large. Please use images smaller than 4MB.")

            # Convert image to base64 for the OpenAI vision request
            image_base64 = base64.b64encode(content).decode('utf-8')

            # Analyze image using vision model
            analysis_text = await self._analyze_image_with_gpt(image_base64, filename)
            
            # Tokenize and chunk the analysis text
            tokens = self._tokenize(analysis_text)
            chunks = self._chunk_tokens(tokens, size=250, overlap=50)
            
            # Generate unique image ID
            img_id = f"{filename}_{uuid.uuid4().hex[:8]}"
            
            # Store processed image temporarily
            self.processed_images[img_id] = {
                'chunks': chunks,
                'user_id': user_id,
                'filename': filename,
                'analysis_text': analysis_text,
                'image_base64': image_base64  # Store for potential future use
            }
            
            return DocumentProcessResponse(
                success=True,
                message=f"Image analyzed successfully. Generated {len(chunks)} chunks from analysis.",
                doc_id=img_id,
                text_length=len(analysis_text),
                chunk_count=len(chunks),
                page_count=1  # Images are single "page"
            )
            
        except Exception as e:
            return DocumentProcessResponse(
                success=False,
                message=f"Error processing image: {str(e)}",
                doc_id="",
                text_length=0,
                chunk_count=0
            )
    
    async def index_to_weaviate(self, img_id: str, user_id: str) -> IndexResponse:
        """Index image analysis chunks into Weaviate"""
        try:
            if img_id not in self.processed_images:
                raise ValueError("Image not found. Please upload and process the image first.")
            
            img_data = self.processed_images[img_id]
            chunks = img_data['chunks']
            
            with weaviate_session() as (oa, client):
                index_into_weaviate(
                    client=client,
                    oa=oa,
                    chunks=chunks,
                    doc_id=img_id,
                    user_id=user_id,
                    class_name="Business"
                )
            
            # Clean up processed image from memory
            del self.processed_images[img_id]
            
            return IndexResponse(
                success=True,
                message="Image analysis indexed successfully!",
                indexed_chunks=len(chunks)
            )
            
        except Exception as e:
            return IndexResponse(
                success=False,
                message=f"Error indexing image analysis: {str(e)}",
                indexed_chunks=0
            )
    
    async def _analyze_image_with_gpt(self, image_base64: str, filename: str) -> str:
        """Analyze image using the OpenAI chat model (vision-capable, e.g. gpt-4o)."""
        model = self.env.get("CHAT_MODEL") or "gpt-4o"
        try:
            oa = init_openai(self.env)

            prompt = """Analyze this technical image and extract:

1. TABLES/ENTITIES: List all table names, entities, and database objects
2. RELATIONSHIPS: Describe connections between tables (foreign keys, joins, etc.)
3. TEXT CONTENT: Extract all visible text, labels, field names, and annotations
4. TECHNICAL DETAILS: Note data types, constraints, business rules, and transformations
5. STRUCTURE: Describe the overall system architecture or data flow

Provide a clear, structured analysis suitable for database documentation and test case generation."""

            response = oa.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=2000,
                temperature=0.1,
            )

            analysis_text = response.choices[0].message.content or ""
            metadata = (
                f"\n\n--- IMAGE METADATA ---\nFilename: {filename}\n"
                f"Analysis generated by: {model}\n"
                f"Image type: Database/Technical Diagram Analysis\n"
            )
            return analysis_text + metadata

        except Exception as e:
            raise Exception(f"Error analyzing image with {model}: {str(e)}")
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization by splitting on whitespace"""
        return text.split()
    
    def _chunk_tokens(self, tokens: List[str], size: int = 250, overlap: int = 50) -> List[str]:
        """Chunk tokens into overlapping segments"""
        if len(tokens) <= size:
            return [" ".join(tokens)]
        
        chunks = []
        start = 0
        while start < len(tokens):
            end = min(start + size, len(tokens))
            chunk = " ".join(tokens[start:end])
            chunks.append(chunk)
            
            if end >= len(tokens):
                break
            start = end - overlap
        
        return chunks
