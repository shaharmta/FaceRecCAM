from pinecone import Pinecone, ServerlessSpec
from datetime import datetime
import os
from typing import List, Tuple, Optional

# Initialize Pinecone with current API
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY", "pcsk_5bkepe_FiYf47aYv4DFVKkXG5RqvDgKs889m9HPFT3Rm1v8UQxLX5d5Vd7UPuPWcuEqzTS"))

# Index configuration
INDEX_NAME = "face-recognition-vectors"
DIMENSION = 128  # OpenFace embedding dimension
METRIC = "cosine"
MAX_VECTORS_PER_PERSON = 10

def initialize_pinecone():
    """Initialize Pinecone index if it doesn't exist"""
    try:
        # Check if index exists
        if INDEX_NAME not in pc.list_indexes().names():
            print(f"Creating Pinecone index: {INDEX_NAME}")
            pc.create_index(
                name=INDEX_NAME,
                dimension=DIMENSION,
                metric=METRIC,
                spec=ServerlessSpec(region='us-east-1')
            )
            print("Pinecone index created successfully")
        else:
            print("Pinecone index already exists")
        
        return pc.Index(INDEX_NAME)
    except Exception as e:
        print(f"Error initializing Pinecone: {str(e)}")
        raise

# Initialize the index
index = initialize_pinecone()

def get_next_person_id() -> int:
    """Get the next sequential person ID by finding the highest existing ID"""
    try:
        print("=== GETTING NEXT PERSON ID ===")
        
        # Use the list_people function to get all people
        people = list_people()
        print(f"Found {len(people)} people in database")
        
        if not people:
            print("Database is empty, starting with ID 1")
            return 1
        
        # Get all person IDs (handle both int and float)
        person_ids = []
        for person in people:
            person_id = person['id']
            if isinstance(person_id, (int, float)):
                person_ids.append(int(person_id))  # Convert to int
        
        print(f"Person IDs found: {sorted(person_ids)}")
        
        if person_ids:
            max_id = max(person_ids)
            next_id = max_id + 1
        else:
            next_id = 1
            
        print(f"Max person ID: {max_id if person_ids else 0}")
        print(f"Next person ID will be: {next_id}")
        
        return next_id
        
    except Exception as e:
        print(f"Error getting next person ID: {str(e)}")
        # If error, start from 1
        return 1

def insert_new_person(vector: List[float]) -> int:
    """Inserts a new person + their first vector, returns person_id."""
    try:
        print("=== INSERTING NEW PERSON ===")
        
        # Generate sequential person_id
        person_id = get_next_person_id()
        
        # Create vector ID
        vector_id = f"person_{person_id}_vector_1"
        print(f"Vector ID: {vector_id}")
        
        # Prepare metadata
        metadata = {
            "person_id": person_id,
            "vector_count": 1,
            "last_checked": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat()
        }
        print(f"Metadata: {metadata}")
        
        # Insert vector
        print("Inserting vector into Pinecone...")
        index.upsert([(vector_id, vector, metadata)])
        
        print(f"Successfully added new person with ID {person_id}")
        return person_id
        
    except Exception as e:
        print(f"Error inserting new person: {str(e)}")
        raise

def insert_vector_for_person(person_id: int, vector: List[float], max_vectors: int = MAX_VECTORS_PER_PERSON) -> None:
    """Inserts a vector for an existing person_id. If person has >= max_vectors, deletes oldest vector."""
    try:
        # Query existing vectors for this person
        query_response = index.query(
            vector=vector,
            filter={"person_id": person_id},
            top_k=max_vectors + 1,
            include_metadata=True
        )
        
        existing_vectors = query_response.matches
        
        # If we have too many vectors, delete the oldest one
        if len(existing_vectors) >= max_vectors:
            sorted_vectors = sorted(existing_vectors, key=lambda x: x.metadata.get("last_checked", ""))
            oldest_vector_id = sorted_vectors[0].id
            index.delete(ids=[oldest_vector_id])
            print(f"Deleted oldest vector for person {person_id}")
        
        # Count remaining vectors to determine new vector number
        remaining_count = len(existing_vectors) if len(existing_vectors) < max_vectors else max_vectors - 1
        new_vector_number = remaining_count + 1
        
        # Create new vector ID
        vector_id = f"person_{person_id}_vector_{new_vector_number}"
        
        # Prepare metadata
        metadata = {
            "person_id": person_id,
            "vector_count": new_vector_number,
            "last_checked": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat()
        }
        
        # Insert new vector
        index.upsert([(vector_id, vector, metadata)])
        
        print(f"Successfully added vector {new_vector_number} for person {person_id}")
        
    except Exception as e:
        print(f"Error inserting vector for person {person_id}: {str(e)}")
        raise

def check_person_exists(vector: List[float], threshold: float = 0.65) -> Tuple[str, Optional[datetime], Optional[int]]:
    """
    Compares input vector with stored vectors in Pinecone.
    Returns:
    ("found", last_seen_date, person_id)
    or
    ("not found", None, None)
    """
    try:
        print(f"=== PINECONE DATABASE CHECK ===")
        print(f"Querying with threshold: {threshold}")
        print(f"Vector length: {len(vector)}")
        
        # Query for similar vectors
        query_response = index.query(
            vector=vector,
            top_k=1,
            include_metadata=True
        )
        
        print(f"Query response: {len(query_response.matches)} matches found")
        
        if query_response.matches:
            match = query_response.matches[0]
            # For cosine similarity, the score IS the similarity (not distance)
            similarity = match.score
            print(f"Best match similarity: {similarity:.4f} (threshold: {threshold})")
            print(f"Match metadata: {match.metadata}")
            
            if similarity >= threshold:
                person_id = match.metadata.get("person_id")
                last_checked_str = match.metadata.get("last_checked")
                last_checked = datetime.fromisoformat(last_checked_str) if last_checked_str else None
                
                print(f"PERSON FOUND! ID: {person_id}, Last checked: {last_checked}")
                return ("found", last_checked, person_id)
            else:
                print(f"Similarity too low: {similarity:.4f} < {threshold}")
        else:
            print("No matches found in database")
        
        print("Returning NOT FOUND")
        return ("not found", None, None)
        
    except Exception as e:
        print(f"Error checking person existence: {str(e)}")
        raise

def list_people() -> List[dict]:
    """List all people with their metadata"""
    try:
        # Query all vectors (simple approach for small datasets)
        query_response = index.query(
            vector=[0.0] * DIMENSION,  # Dummy vector
            top_k=5000,
            include_metadata=True
        )
        
        # Group by person_id
        people_dict = {}
        for match in query_response.matches:
            person_id = match.metadata.get("person_id")
            if person_id not in people_dict:
                people_dict[person_id] = {
                    "id": person_id,
                    "last_seen": match.metadata.get("last_checked"),
                    "vector_count": 0,
                    "has_vector": True
                }
            people_dict[person_id]["vector_count"] += 1
        
        return list(people_dict.values())
        
    except Exception as e:
        print(f"Error listing people: {str(e)}")
        raise

def get_conn():
    """Compatibility function for existing code"""
    return index

# For compatibility with existing code
USE_LOCAL = False


if __name__ == "__main__":
    print("Pinecone initialized successfully")
    initialize_pinecone()
 
    