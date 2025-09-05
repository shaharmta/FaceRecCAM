#!/usr/bin/env python3
"""
Script to check and clear the Pinecone database
"""

import pinecone_db

def check_database():
    print("=== CHECKING PINECONE DATABASE ===")
    
    try:
        # List all people
        people = pinecone_db.list_people()
        print(f"People in database: {len(people)}")
        
        if people:
            print("\nPeople details:")
            for person in people:
                print(f"  - Person ID: {person['id']}")
                print(f"    Vectors: {person['vector_count']}")
                print(f"    Last seen: {person['last_seen']}")
                print()
        else:
            print("Database is empty!")
            
    except Exception as e:
        print(f"Error checking database: {e}")

def clear_database():
    print("\n=== CLEARING PINECONE DATABASE ===")
    
    try:
        # Get the index
        index = pinecone_db.index
        
        # Delete all vectors
        print("Deleting all vectors...")
        index.delete(delete_all=True)
        print("Database cleared successfully!")
        
    except Exception as e:
        print(f"Error clearing database: {e}")

if __name__ == "__main__":
    check_database()
    
    response = input("\nDo you want to clear the database? (y/n): ")
    if response.lower() == 'y':
        clear_database()
        print("\nChecking database after clearing...")
        check_database()
    else:
        print("Database not cleared.")
