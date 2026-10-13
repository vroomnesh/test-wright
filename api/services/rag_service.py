# ============================================================================
# RAG SERVICE - RETRIEVAL AUGMENTED GENERATION
# ============================================================================
# This service handles both RAG and non-RAG test case generation:
#
# RAG Mode:
# - Searches Weaviate for relevant document chunks based on user query
# - Combines retrieved context with user query for GPT-4
# - Generates contextually relevant test cases (20-50 per request)
#
# Non-RAG Mode:
# - Uses only GPT-4's training knowledge without document context
# - Useful when no relevant documents are uploaded
# - Generates general test cases based on query alone
#
# Output Formats:
# - JSON response for preview
# - Excel file download with proper test case formatting
# ============================================================================

from models.schemas import RAGQueryResponse
from utils.backend_utils import (
    weaviate_session, rag_answer, rag_to_preview_data,
    non_rag_answer, non_rag_to_preview_data, init_openai, load_env,
    preview_data_to_excel_bytes
)

class RAGService:
    def __init__(self):
        # Store preview data for Excel generation
        self.preview_data_cache = {}
    
    async def generate_test_cases(
        self,
        query: str,
        user_id: str,
        top_k: int = 5,
        class_name: str = "Business",
        use_rag: bool = True,
        is_user_stories: bool = False
    ) -> RAGQueryResponse:
        """Generate test cases using RAG or non-RAG mode"""
        try:
            if use_rag:
                # RAG mode - use context from Weaviate
                with weaviate_session() as (oa, client):
                    answer = rag_answer(
                        question=query,
                        oa=oa,
                        client=client,
                        user_id=user_id,
                        class_name=class_name,
                        top_k=top_k,
                        is_user_stories=is_user_stories
                    )

                return RAGQueryResponse(
                    success=True,
                    test_cases=answer,
                    chunks_retrieved=top_k
                )
            else:
                # Non-RAG mode - use only LLM knowledge
                oa = init_openai(load_env())
                answer = non_rag_answer(
                    question=query,
                    oa=oa,
                    is_user_stories=is_user_stories
                )

                return RAGQueryResponse(
                    success=True,
                    test_cases=answer,
                    chunks_retrieved=0  # No chunks retrieved in non-RAG mode
                )

        except Exception as e:
            return RAGQueryResponse(
                success=False,
                test_cases=f"Error generating test cases: {str(e)}",
                chunks_retrieved=0
            )
    
    async def generate_excel(
        self,
        query: str,
        user_id: str,
        top_k: int = 5,
        class_name: str = "Business",
        num_test_cases: int = None,  # Let LLM decide optimal number (20-50)
        use_rag: bool = True,
        preview_data: list = None,
    ) -> bytes:
        """Save the on-screen preview as Excel. Does not generate a second set of cases."""
        try:
            rows = preview_data
            if not rows:
                cache_key = f"{user_id}_{hash(query)}_{use_rag}_{top_k}_{class_name}"
                rows = self.preview_data_cache.get(cache_key)
            if not rows:
                raise Exception("Generate the test case preview first. The Excel file is saved from that preview.")
            return preview_data_to_excel_bytes(rows)

        except Exception as e:
            raise Exception(f"Error generating Excel file: {str(e)}")

    async def preview_test_cases(
        self,
        query: str,
        user_id: str,
        top_k: int = 5,
        class_name: str = "Business",
        num_test_cases: int = None,  # Let LLM decide optimal number (20-50)
        use_rag: bool = True
    ) -> list:
        """Generate preview of RAG or non-RAG test cases without creating an Excel file"""
        try:
            # Create cache key for this specific request
            cache_key = f"{user_id}_{hash(query)}_{use_rag}_{top_k}_{class_name}"

            if use_rag:
                # RAG mode - use context from Weaviate
                with weaviate_session() as (oa, client):
                    preview_data = rag_to_preview_data(
                        question=query,
                        oa=oa,
                        client=client,
                        user_id=user_id,
                        class_name=class_name,
                        top_k=top_k,
                        num_test_cases=num_test_cases
                    )
            else:
                # Non-RAG mode - use only LLM knowledge
                oa = init_openai(load_env())
                preview_data = non_rag_to_preview_data(
                    question=query,
                    oa=oa,
                    num_test_cases=num_test_cases
                )

            # Store preview data in cache for Excel generation
            self.preview_data_cache[cache_key] = preview_data

            return preview_data

        except Exception as e:
            raise Exception(f"Error generating test cases preview: {str(e)}")
