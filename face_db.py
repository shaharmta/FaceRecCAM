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
            # Drop existing table to recreate with new schema
            conn.execute('DROP TABLE IF EXISTS people')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS people (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    vector TEXT,
                    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    

    def insert_new_person(name: str, vector: list[float]):
        print(f"Adding person: {name} with vector length {len(vector)}")
        vector_str = ",".join(map(str, vector))
        with get_conn() as conn:
            conn.execute("INSERT INTO people (name, vector) VALUES (?, ?)", (name, vector_str))
            conn.commit()
            print(f"Successfully added {name} to database")

    def insert_vector_for_person(person_id, vector):
        vector_str = ",".join(map(str, vector))
        with get_conn() as conn:
            conn.execute("UPDATE people SET vector = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?", (vector_str, person_id))
            conn.commit()

    def check_person_exists(vector, threshold=0.93):
        """
        Compares input vector with stored vectors in local DB.
        Returns:
        ("found", last_seen_date, person_id)
        or
        ("not found", None, None)
        """
        with get_conn() as conn:
            rows = conn.execute("SELECT id, vector, last_seen FROM people").fetchall()
            for row in rows:
                person_id, vec_str, last_seen = row
                stored_vector = list(map(float, vec_str.split(',')))
                similarity = cosine_similarity(vector, stored_vector)
                if similarity >= threshold:
                    return ("found", datetime.fromisoformat(last_seen), person_id)
            return ("not found", None, None)


    create_tables()

else:
#original code


    # === CONFIGURATION ===
    DB_CONFIG = {
        "host": "face-db-cluster.cluster-cnks2uk809i8.eu-north-1.rds.amazonaws.com",
        "port": 5432,
        "dbname": "postgres",
        "user": "postgres",
        "password": "7Te5M<jYoG7pL|dqKm$7~z:bseg~"
    }

    def get_connection():
        return psycopg2.connect(**DB_CONFIG)

    # === API FUNCTIONS ===


    #insert a completly new person tot he system 
    def insert_new_person(name: str, vector: list[float]):
        """Inserts a new person + their first vector, returns person_id."""
        conn = get_connection()
        cur = conn.cursor()
        try:
            # Create new person
            cur.execute("INSERT INTO persons DEFAULT VALUES RETURNING person_id;")
            person_id = cur.fetchone()[0]
            
            # Insert vector
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
        conn = get_connection()
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
        conn = get_connection()
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
