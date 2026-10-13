"""
Knowledge Service - Manages Weaviate knowledge base operations
Handles document retrieval, deletion, renaming, and user knowledge management
"""

from typing import List, Dict, Any
from utils.backend_utils import weaviate_session, load_env
from collections import defaultdict

class KnowledgeService:
    def __init__(self):
        self.env = load_env()

    async def get_user_files(self, user_id: str, class_name: str = "Business") -> List[Dict[str, Any]]:
        """Get all uploaded files/images for a user from Weaviate - API compatible method"""
        knowledge_data = await self.get_user_knowledge(user_id, class_name)
        return knowledge_data.get('documents', [])

    async def get_document_details(self, user_id: str, doc_id: str, class_name: str = "Business") -> Dict[str, Any]:
        """Get detailed information about a specific document including all chunks"""
        try:
            with weaviate_session() as (oa, client):
                collection = client.collections.get(class_name)

                # Query all chunks for this specific document
                response = collection.query.fetch_objects(
                    limit=1000,
                    return_properties=["doc_id", "chunk_text", "chunk_index", "user_id"]
                )

                # Filter for this specific document and user
                document_chunks = [
                    obj for obj in response.objects
                    if obj.properties.get('user_id') == user_id and obj.properties.get('doc_id') == doc_id
                ]

                # Sort chunks by index
                chunks = []
                for obj in document_chunks:
                    chunks.append({
                        'index': obj.properties['chunk_index'],
                        'text': obj.properties['chunk_text'],
                        'length': len(obj.properties['chunk_text'])
                    })

                # Sort by chunk index
                chunks.sort(key=lambda x: x['index'])

                return {
                    'chunks': chunks,
                    'metadata': {
                        'doc_id': doc_id,
                        'total_chunks': len(chunks),
                        'total_length': sum(chunk['length'] for chunk in chunks)
                    }
                }

        except Exception as e:
            print(f"Error getting document details: {e}")
            return {'chunks': [], 'metadata': {}}

    async def get_user_knowledge(self, user_id: str, class_name: str = "Business") -> Dict[str, Any]:
        """Retrieve all documents/images indexed by a user from Weaviate with metadata"""
        try:
            with weaviate_session() as (oa, client):
                collection = client.collections.get(class_name)

                # Try using where clause to filter by user_id directly in Weaviate
                try:
                    response = collection.query.fetch_objects(
                        limit=1000,
                        where={"path": ["user_id"], "operator": "Equal", "valueText": user_id},
                        return_properties=["doc_id", "chunk_text", "chunk_index", "user_id"]
                    )
                    print(f"DEBUG: Using where clause - found {len(response.objects)} objects for user {user_id}")
                    filtered_objects = response.objects
                except Exception as e:
                    print(f"DEBUG: Where clause failed: {e}, falling back to fetch all")
                    # Fallback to fetch all and filter in Python
                    response = collection.query.fetch_objects(
                        limit=1000,
                        return_properties=["doc_id", "chunk_text", "chunk_index", "user_id"]
                    )
                    print(f"DEBUG: Total objects in Weaviate: {len(response.objects)}")
                    print(f"DEBUG: Looking for user_id: {user_id}")

                    # Debug: Print first few objects to see what's there
                    for i, obj in enumerate(response.objects[:3]):
                        print(f"DEBUG: Object {i}: user_id={obj.properties.get('user_id')}, doc_id={obj.properties.get('doc_id')}")

                    # Filter results by user_id in Python
                    filtered_objects = [obj for obj in response.objects if obj.properties.get('user_id') == user_id]
                    print(f"DEBUG: Filtered objects for user {user_id}: {len(filtered_objects)}")
                
                # Group chunks by doc_id to get document-level metadata
                documents = defaultdict(lambda: {
                    'doc_id': '',
                    'chunks': [],
                    'chunk_count': 0,
                    'total_text_length': 0,
                    'file_type': 'unknown'
                })
                
                for obj in filtered_objects:
                    doc_id = obj.properties['doc_id']
                    chunk_text = obj.properties['chunk_text']
                    chunk_index = obj.properties['chunk_index']
                    
                    documents[doc_id]['doc_id'] = doc_id
                    documents[doc_id]['chunks'].append({
                        'index': chunk_index,
                        'text': chunk_text,
                        'length': len(chunk_text)
                    })
                    documents[doc_id]['chunk_count'] += 1
                    documents[doc_id]['total_text_length'] += len(chunk_text)
                    
                    # Determine file type based on doc_id pattern
                    if any(ext in doc_id.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']):
                        documents[doc_id]['file_type'] = 'image'
                    elif any(ext in doc_id.lower() for ext in ['.pdf', '.docx', '.doc', '.txt']):
                        documents[doc_id]['file_type'] = 'document'
                    else:
                        # Check if it contains image-like patterns
                        if any(word in doc_id.lower() for word in ['image', 'img', 'photo', 'picture']):
                            documents[doc_id]['file_type'] = 'image'
                        else:
                            documents[doc_id]['file_type'] = 'document'
                
                # Sort chunks by index for each document
                for doc_data in documents.values():
                    doc_data['chunks'].sort(key=lambda x: x['index'])
                
                # Convert to list and sort by doc_id
                documents_list = list(documents.values())
                documents_list.sort(key=lambda x: x['doc_id'])
                
                return {
                    'success': True,
                    'user_id': user_id,
                    'total_documents': len(documents_list),
                    'documents': documents_list
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'user_id': user_id,
                'total_documents': 0,
                'documents': []
            }
    
    async def delete_document(self, user_id: str, doc_id: str, class_name: str = "Business") -> Dict[str, Any]:
        """Delete all chunks of a specific document from Weaviate"""
        try:
            with weaviate_session() as (oa, client):
                collection = client.collections.get(class_name)
                
                # First, get all objects that match user_id and doc_id
                response = collection.query.fetch_objects(
                    limit=1000,
                    return_properties=["doc_id", "user_id"]
                )

                # Filter and collect UUIDs to delete
                uuids_to_delete = []
                for obj in response.objects:
                    if (obj.properties.get('user_id') == user_id and
                        obj.properties.get('doc_id') == doc_id):
                        uuids_to_delete.append(obj.uuid)

                # Delete objects by UUID
                deleted_count = 0
                for uuid in uuids_to_delete:
                    try:
                        collection.data.delete_by_id(uuid)
                        deleted_count += 1
                    except Exception:
                        pass  # Continue deleting other objects

                result = type('Result', (), {'successful': deleted_count})()
                
                return {
                    'success': True,
                    'message': f'Document {doc_id} deleted successfully',
                    'deleted_objects': result.successful if hasattr(result, 'successful') else 'unknown'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': f'Failed to delete document {doc_id}'
            }

    async def rename_document(self, user_id: str, old_doc_id: str, new_doc_id: str, class_name: str = "Business") -> Dict[str, Any]:
        """Rename a document by updating all its chunks in Weaviate"""
        try:
            with weaviate_session() as (oa, client):
                collection = client.collections.get(class_name)

                # First, get all objects that match user_id and old_doc_id
                response = collection.query.fetch_objects(
                    limit=1000,
                    return_properties=["doc_id", "user_id", "chunk_text", "chunk_index"]
                )

                # Filter and collect objects to update
                objects_to_update = []
                for obj in response.objects:
                    if (obj.properties.get('user_id') == user_id and
                        obj.properties.get('doc_id') == old_doc_id):
                        objects_to_update.append(obj)

                if not objects_to_update:
                    return {
                        'success': False,
                        'error': 'Document not found',
                        'old_doc_id': old_doc_id
                    }

                # Check if new_doc_id already exists
                existing_response = collection.query.fetch_objects(
                    limit=10,
                    return_properties=["doc_id", "user_id"]
                )

                for obj in existing_response.objects:
                    if (obj.properties.get('user_id') == user_id and
                        obj.properties.get('doc_id') == new_doc_id):
                        return {
                            'success': False,
                            'error': f'Document with name "{new_doc_id}" already exists',
                            'old_doc_id': old_doc_id,
                            'new_doc_id': new_doc_id
                        }

                # Update all matching objects with new doc_id
                updated_count = 0
                for obj in objects_to_update:
                    try:
                        # Update the object with new doc_id
                        collection.data.update(
                            uuid=obj.uuid,
                            properties={
                                "doc_id": new_doc_id,
                                "user_id": obj.properties.get('user_id'),
                                "chunk_text": obj.properties.get('chunk_text'),
                                "chunk_index": obj.properties.get('chunk_index')
                            }
                        )
                        updated_count += 1
                    except Exception:
                        # Continue updating other chunks if one fails
                        continue

                return {
                    'success': True,
                    'message': f'Successfully renamed document from "{old_doc_id}" to "{new_doc_id}"',
                    'updated_chunks': updated_count,
                    'old_doc_id': old_doc_id,
                    'new_doc_id': new_doc_id
                }

        except Exception as e:
            return {
                'success': False,
                'error': f'Error renaming document: {str(e)}',
                'old_doc_id': old_doc_id,
                'new_doc_id': new_doc_id
            }

    async def get_document_details(self, user_id: str, doc_id: str, class_name: str = "Business") -> Dict[str, Any]:
        """Get detailed information about a specific document including all chunks"""
        try:
            with weaviate_session() as (oa, client):
                collection = client.collections.get(class_name)
                
                # Query all chunks for the specific document
                response = collection.query.fetch_objects(
                    limit=1000,
                    return_properties=["doc_id", "chunk_text", "chunk_index", "user_id"]
                )

                # Filter results by user_id and doc_id
                filtered_objects = [obj for obj in response.objects
                                  if (obj.properties.get('user_id') == user_id and
                                      obj.properties.get('doc_id') == doc_id)]
                
                if not filtered_objects:
                    return {
                        'success': False,
                        'error': 'Document not found',
                        'doc_id': doc_id
                    }
                
                chunks = []
                total_length = 0
                
                for obj in filtered_objects:
                    chunk_text = obj.properties['chunk_text']
                    chunks.append({
                        'index': obj.properties['chunk_index'],
                        'text': chunk_text,
                        'length': len(chunk_text)
                    })
                    total_length += len(chunk_text)
                
                # Sort chunks by index
                chunks.sort(key=lambda x: x['index'])
                
                # Determine file type
                file_type = 'unknown'
                if any(ext in doc_id.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']):
                    file_type = 'image'
                elif any(ext in doc_id.lower() for ext in ['.pdf', '.docx', '.doc', '.txt']):
                    file_type = 'document'
                elif any(word in doc_id.lower() for word in ['image', 'img', 'photo', 'picture']):
                    file_type = 'image'
                else:
                    file_type = 'document'
                
                return {
                    'success': True,
                    'doc_id': doc_id,
                    'file_type': file_type,
                    'chunk_count': len(chunks),
                    'total_text_length': total_length,
                    'chunks': chunks
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'doc_id': doc_id
            }
