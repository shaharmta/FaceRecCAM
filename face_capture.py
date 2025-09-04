import cv2
import requests
import time
from face_db import get_conn, USE_LOCAL

# Your server address - change accordingly
API_URL = "http://localhost:8000/recognize"  # or server IP
DEVICE_ID = "macbook-test"

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
    # Load face detection model
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Open laptop camera
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("❌ Cannot open camera")
        return

    print("📷 Starting live camera. Press 'q' to quit.")
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Failed to grab frame")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

        for (x, y, w, h) in faces:
            face_img = frame[y:y+h, x:x+w]
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            print("📤 Face detected. Sending to server...")
            send_face_to_server(face_img)
            time.sleep(1.5)  # to avoid flooding the server

        # Display the image with the frame
        cv2.imshow("Face Capture (Press 'q' to quit)", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
