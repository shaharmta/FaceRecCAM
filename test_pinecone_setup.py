#!/usr/bin/env python3
"""
Test script to initialize Pinecone and verify the setup
Run this before starting your main application
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_pinecone_initialization():
    """Test Pinecone initialization and basic operations"""
    print("=== Pinecone Setup Test ===")
    
    try:
        # Test 1: Import Pinecone modules
        print("1. Testing imports...")
        import pinecone_db
        import pinecone_imagesProcessing
        print("   ✅ All imports successful")
        
        # Test 2: Initialize Pinecone index
        print("2. Initializing Pinecone index...")
        index = pinecone_db.index
        print(f"   ✅ Index '{pinecone_db.INDEX_NAME}' ready")
        print(f"   📊 Dimension: {pinecone_db.DIMENSION}")
        print(f"   📊 Metric: {pinecone_db.METRIC}")
        
        # Test 3: Test basic operations
        print("3. Testing basic operations...")
        
        # Test list_people (should work even with empty index)
        people = pinecone_db.list_people()
        print(f"   ✅ list_people() works - found {len(people)} people")
        
        # Test get_next_person_id
        next_id = pinecone_db.get_next_person_id()
        print(f"   ✅ get_next_person_id() works - next ID will be: {next_id}")
        
        print("\n🎉 Pinecone setup test completed successfully!")
        print("You can now start your FastAPI server with: uvicorn server:app --reload")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during Pinecone setup test: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Make sure you have installed pinecone-client: pip install pinecone-client")
        print("2. Check your internet connection")
        print("3. Verify your Pinecone API key is correct")
        return False

def test_with_sample_vector():
    """Test with a sample vector to verify full functionality"""
    print("\n=== Testing with Sample Vector ===")
    
    try:
        import pinecone_db
        import numpy as np
        
        # Create a dummy 128-dimensional vector (like OpenFace would produce)
        sample_vector = np.random.random(128).tolist()
        print(f"1. Created sample vector with {len(sample_vector)} dimensions")
        
        # Test check_person_exists with empty database
        print("2. Testing check_person_exists with empty database...")
        result = pinecone_db.check_person_exists(sample_vector)
        print(f"   Result: {result}")
        
        # Test insert_new_person
        print("3. Testing insert_new_person...")
        person_id = pinecone_db.insert_new_person(sample_vector)
        print(f"   ✅ Person added with ID: {person_id}")
        
        # Test check_person_exists again (should find the person now)
        print("4. Testing check_person_exists after adding person...")
        result = pinecone_db.check_person_exists(sample_vector)
        print(f"   Result: {result}")
        
        # Test list_people
        print("5. Testing list_people...")
        people = pinecone_db.list_people()
        print(f"   Found {len(people)} people:")
        for person in people:
            print(f"     - Person ID: {person['id']}, Vectors: {person['vector_count']}")
        
        print("\n�� Full functionality test completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error during functionality test: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting Pinecone setup test...\n")
    
    # Test 1: Basic initialization
    if test_pinecone_initialization():
        # Test 2: Full functionality with sample data
        test_with_sample_vector()
    else:
        print("\n❌ Basic initialization failed. Please fix the issues above first.")
        sys.exit(1)
