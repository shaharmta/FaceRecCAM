import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import math

#for local testing:
import sqlite3
import os

USE_LOCAL = True  # שנה ל־False אם חוזרים לדאטהבייס בענן

if USE_LOCAL:
    DB_PATH = "local_faces.db"

    def get_conn():
        return sqlite3.connect(DB_PATH)

    def create_tables():
        with get_conn() as conn:
            # Drop existing tables to recreate with new schema
            conn.execute('DROP TABLE IF EXISTS vectors')
            conn.execute('DROP TABLE IF EXISTS persons')
            
            # Create persons table (just IDs)
            conn.execute('''
                CREATE TABLE IF NOT EXISTS persons (
                    person_id INTEGER PRIMARY KEY AUTOINCREMENT
                )
            ''')
            
            # Create vectors table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS vectors (
                    vector_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    person_id INTEGER NOT NULL,
                    vector TEXT NOT NULL,
                    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (person_id) REFERENCES persons(person_id)
                )
            ''')
            conn.commit()
            print("✅ Database tables created successfully")
    
    def cosine_similarity(v1, v2):
        dot = sum(a*b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a*a for a in v1))
        norm2 = math.sqrt(sum(b*b for b in v2))
        if norm1 == 0 or norm2 == 0:
            return 0
        return dot / (norm1 * norm2)

    def insert_new_person(vector: list[float]):
        """Inserts a new person + their first vector, returns person_id."""
        vector_str = ",".join(map(str, vector))
        with get_conn() as conn:
            # Create new person
            cursor = conn.execute("INSERT INTO persons DEFAULT VALUES")
            person_id = cursor.lastrowid
            
            # Insert vector
            conn.execute("""
                INSERT INTO vectors (person_id, vector)
                VALUES (?, ?)
            """, (person_id, vector_str))
            
            conn.commit()
            print(f"Successfully added new person with ID {person_id}")
            return person_id

    def insert_vector_for_person(person_id: int, vector: list[float], max_vectors: int = 10):
        """Inserts a vector for an existing person_id. If person has >= max_vectors, deletes oldest vector."""
        vector_str = ",".join(map(str, vector))
        with get_conn() as conn:
            # Count vectors for this person
            cursor = conn.execute("SELECT COUNT(*) FROM vectors WHERE person_id = ?", (person_id,))
            vector_count = cursor.fetchone()[0]
            
            if vector_count >= max_vectors:
                # Delete oldest vector
                conn.execute("""
                    DELETE FROM vectors
                    WHERE vector_id = (
                        SELECT vector_id FROM vectors
                        WHERE person_id = ?
                        ORDER BY last_checked ASC
                        LIMIT 1
                    )
                """, (person_id,))
            
            # Insert new vector
            conn.execute("""
                INSERT INTO vectors (person_id, vector)
                VALUES (?, ?)
            """, (person_id, vector_str))
            
            conn.commit()
            print(f"Successfully added new vector for person {person_id}")

    def check_person_exists(vector: list[float], threshold: float = 0.63):
        """
        Compares input vector with stored vectors in local DB.
        Returns:
        ("found", last_seen_date, person_id)
        or
        ("not found", None, None)
        """
        with get_conn() as conn:
            rows = conn.execute("""
                SELECT v.person_id, v.vector, v.last_checked
                FROM vectors v
                INNER JOIN persons p ON v.person_id = p.person_id
            """).fetchall()
            
            for row in rows:
                person_id, vec_str, last_checked = row
                stored_vector = list(map(float, vec_str.split(',')))
                similarity = cosine_similarity(vector, stored_vector)
                if similarity >= threshold:
                    return ("found", datetime.fromisoformat(last_checked), person_id)
            return ("not found", None, None)

    create_tables()

else:
#original code


    # === CONFIGURATION ===
    DB_CONFIG = {
    "host": "face-db-public.cluster-cnks2uk809i8.eu-north-1.rds.amazonaws.com",
    "port": 5432,
    "dbname": "postgres",
    "user": "postgres",
    "password": "AmitMatanShahar3"
}

    def get_conn():  # Changed to match local version
        return psycopg2.connect(**DB_CONFIG)

    # === API FUNCTIONS ===


    #insert a completly new person tot he system 
    def insert_new_person(vector: list[float]):
        """Inserts a new person + their first vector, returns person_id."""
        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute("INSERT INTO persons DEFAULT VALUES RETURNING person_id;")
            person_id = cur.fetchone()[0]
            vector_str = "[" + ",".join(str(x) for x in vector) + "]"
            cur.execute("""
                INSERT INTO vectors (person_id, vector, last_checked)
                VALUES (%s, %s::vector, NOW());
            """, (person_id, vector_str))
            conn.commit()
            return person_id
        finally:
            cur.close()
            conn.close()

    #insert a new vector for an existing person_id 
    #removing the oldest vector if the person has 10 vectors
    def insert_vector_for_person(person_id, vector, max_vectors=10):
        """
        Inserts a vector for an existing person_id.
        If person has >= max_vectors → deletes oldest vector before inserting.
        """
        conn = get_conn()
        cur = conn.cursor()
        try:
            # 1️⃣ Count how many vectors this person has
            cur.execute("""
                SELECT COUNT(*) FROM vectors WHERE person_id = %s;
            """, (person_id,))
            vector_count = cur.fetchone()[0]

            if vector_count >= max_vectors:
                # 2️⃣ Delete oldest vector
                cur.execute("""
                    DELETE FROM vectors
                    WHERE vector_id = (
                        SELECT vector_id FROM vectors
                        WHERE person_id = %s
                        ORDER BY last_checked ASC
                        LIMIT 1
                    );
                """, (person_id,))

            # 3️⃣ Insert new vector
            vector_str = "[" + ",".join(str(x) for x in vector) + "]"
            cur.execute("""
                INSERT INTO vectors (person_id, vector, last_checked)
                VALUES (%s, %s::vector, NOW());
            """, (person_id, vector_str))

            conn.commit()

        finally:
            cur.close()
            conn.close()


    def check_person_exists(input_vector, threshold=0.65):
        """
        Checks if input vector matches a known person.
        Returns:
        ("found", last_seen_date, person_id)
        or
        ("not found", None, None)
        """
        conn = get_conn()
        cur = conn.cursor()
        try:
            vector_str = "[" + ",".join(str(x) for x in input_vector) + "]"

            # 1️⃣ Find closest person within threshold
            cur.execute("""
                SELECT person_id, MIN(distance) AS min_distance
                FROM (
                    SELECT person_id, vector <-> %s::vector AS distance
                    FROM vectors
                ) sub
                GROUP BY person_id
                ORDER BY min_distance ASC
                LIMIT 1;
            """, (vector_str,))
            
            result = cur.fetchone()
            
            if result and result[1] < threshold:
                person_id = result[0]
                distance = result[1]
                
                # 2️⃣ Get last_seen_date (latest timestamp for this person)
                cur.execute("""
                    SELECT MAX(last_checked)
                    FROM vectors
                    WHERE person_id = %s;
                """, (person_id,))
                last_seen_date = cur.fetchone()[0]
                
                return ("found", last_seen_date, person_id)
            
            else:
                return ("not found", None, None)
            
        finally:
            cur.close()
            conn.close()
