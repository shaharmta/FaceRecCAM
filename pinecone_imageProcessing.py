from deepface import DeepFace
from datetime import datetime, timedelta
import pinecone_db as facedb

def add_new_person(vector): #case red than approve
    return facedb.insert_new_person(vector)

def add_new_visit(vector, person_id): #case yellow than approve
    facedb.insert_vector_for_person(int(person_id), vector)

#Check whether given date is within the last period
def is_within_period(date, period):
    today = datetime.now()
    last_period = today - timedelta(days=period)
    return date >= last_period

#green: person is familiar within the last period
#yellow: person is familiar but not within the last period
#red: person is not familiar
def is_familiar(image_path):
    try:
        print(f"=== IMAGE PROCESSING DEBUG ===")
        print(f"Processing image: {image_path}")
        
        print("Extracting face embedding with DeepFace...")
        df_result = DeepFace.represent(image_path, model_name="OpenFace", enforce_detection=False)
        vector = df_result[0]["embedding"]
        print(f"Face embedding extracted. Vector length: {len(vector)}")
        print(f"First 5 vector values: {vector[:5]}")
        
        print("Checking if person exists in database...")
        db_response = facedb.check_person_exists(vector)
        print(f"Database response: {db_response}")
        
        if db_response[0] == "found":
            last_seen_date = db_response[1]
            person_id = db_response[2]
            print(f"Person found! ID: {person_id}, Last seen: {last_seen_date}")
            
            period = 14
            within_period = is_within_period(last_seen_date, period)
            print(f"Within {period} days: {within_period}")
            
            if within_period: #person found & within period
                print("Returning GREEN - person found and within period")
                return ("green", vector, person_id)
            else: #person found but not within period
                print("Returning YELLOW - person found but not within period")
                return ("yellow", vector, person_id)
        else: #person not found
            print("Returning RED - person not found in database")
            return ("red", vector, db_response[2])
    except Exception as e:
        print(f"Error in is_familiar: {str(e)}")
        return ("error", None, None)

def main():
    res = is_familiar("pic1.jpeg")
    print(res, "\n")

if __name__ == "__main__":
    main()