import cv2
import requests
import time

# Your server address - change accordingly
API_URL = "http://localhost:8000/recognize"  # or server IP
DEVICE_ID = "macbook-test"

def check_server_connection(max_attempts=12):  # 1 minute timeout
    for attempt in range(max_attempts):
        print("Checking server connection...")
        try:
            # Check the /status endpoint from server.py
            status_url = API_URL.replace('/recognize', '/status')
            response = requests.get(status_url, timeout=5)
            if response.status_code == 200:
                result = response.json()
                if result.get('status') == 'online':
                    print("Server connection successful")
                    return True
                else:
                    print("Server is not online, retrying in 5 seconds...")
            else:
                print(f"Server returned status {response.status_code}, retrying in 5 seconds...")
        except requests.RequestException as e:
            print(f"Cannot connect to server: {e}, retrying in 5 seconds...")
        
        if attempt < max_attempts - 1:
            time.sleep(5)
    
    print("Cannot connect to server. Please check if server is running.")
    return False





def send_face_to_server(face_image):
    _, img_encoded = cv2.imencode('.jpg', face_image)
    files = {'file': ('face.jpg', img_encoded.tobytes(), 'image/jpeg')}
    params = {'device_id': DEVICE_ID}

    try:
        response = requests.post(API_URL, files=files, params=params, timeout=10)
        response.raise_for_status()
        result = response.json()
        print("✅ Server response:", result)
        return result
    except requests.RequestException as e:
        print("❌ Failed to send image:", e)
        return None



def main():
    # Check server connection first
    if not check_server_connection():
        print("Exiting due to server connection failure")
        return
    
    # Load face detection model
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Open laptop camera
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Cannot open camera")
        return

    print("Starting live camera. Press 'q' to quit.")
    
    # Add counter for face sending
    face_send_counter = 0
    last_face_sent_time = 0
    last_message_time = 0  # For throttling messages
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

        for (x, y, w, h) in faces:
            face_img = frame[y:y+h, x:x+w]
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            
            # Check if enough time has passed since last face send
            current_time = time.time()
            if current_time - last_face_sent_time >= 10:  # 10 second cooldown
                print("Face detected. Sending to server...")
                send_face_to_server(face_img)
                last_face_sent_time = current_time
                face_send_counter += 1
            elif current_time - last_message_time >= 2:  # Only show message every 2 seconds
                remaining_time = int(10 - (current_time - last_face_sent_time))
                print(f"Face detected. Cooldown active: {remaining_time}s remaining")
                last_message_time = current_time

        # Display the image with the frame
        cv2.imshow("Face Capture (Press 'q' to quit)", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
