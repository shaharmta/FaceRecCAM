from deepface import DeepFace
from datetime import datetime, timedelta
import face_db as facedb


def add_new_person(vector): #case red than approve
    facedb.insert_new_person(vector)


def add_new_visit(vector, person_id): #case yellow than approve
    facedb.insert_vector_for_person(person_id, vector) 


#Check whether given date is within the last period
def is_within_period(date, period):
    today = datetime.now()
    last_period = today - timedelta(days=period)
    return date >= last_period


#green: person is familiar within the last period
#yellow: person is familiar but not within the last period
#red: person is not familiar
def is_familiar(image_path):
    df_result = DeepFace.represent(image_path, model_name="OpenFace")
    vector = df_result[0]["embedding"]
    db_response = facedb.check_person_exists(vector)
    if db_response[0] == "found":
        last_seen_date = db_response[1]
        period = 14
        if is_within_period(last_seen_date, period): #person found & within period
            return ("green", None, None)
        else: #person found but not within period
            return ("yellow", vector, db_response[2])
    else: #person not found
        return ("red", vector, db_response[2])
    
    

    
def main():
    res = is_familiar("pic1.jpeg")
    print(res, "\n")
   

if __name__ == "__main__":
    main()

        


    
