# Face Recognition Access Control System

A smart, privacy-conscious access control solution using face recognition technology.

## System Architecture

The system consists of three main components:

1. **Raspberry Pi Client**
   - Captures live images
   - Performs basic face detection
   - Sends cropped face images to the server

2. **API Gateway Server**
   - Receives face images from Raspberry Pi
   - Coordinates with recognition service
   - Manages user interface updates
   - Handles logging and database operations

3. **Web Interface**
   - Real-time dashboard for monitoring
   - Displays recognition results
   - Allows adding new persons
   - Shows access logs

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set environment variables (optional):
   ```bash
   export RECOGNITION_SERVICE=http://recognition-service:8001
   export DATABASE_SERVICE=http://database-service:8004
   export LOGGING_SERVICE=http://logging-service:8005
   ```

4. Run the server:
   ```bash
   python server.py
   ```

### Frontend Setup

1. Navigate to the UI directory:
   ```bash
   cd ui_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The UI will be available at `http://localhost:3000`

## API Endpoints

### Main Endpoints

- `POST /recognize` - Process face recognition
- `POST /add-person` - Add new person to database
- `GET /logs` - Retrieve recognition logs
- `GET /status` - Health check
- `WebSocket /ws` - Real-time updates

### WebSocket Events

The server broadcasts the following events:

1. Recognition Event:
   ```json
   {
     "event_type": "recognition",
     "timestamp": "2024-03-14T12:00:00Z",
     "data": {
       "recognized": true,
       "person_id": 123,
       "confidence": 0.92,
       "device_id": "pi-001"
     }
   }
   ```

2. Person Added Event:
   ```json
   {
     "event_type": "person_added",
     "timestamp": "2024-03-14T12:00:00Z",
     "data": {
       "status": "success",
       "person_id": 123
     }
   }
   ```

## Development

### Backend Development

The server is built with FastAPI and uses:
- WebSocket for real-time updates
- Async HTTP client for service communication
- Pydantic for data validation

### Frontend Development

The UI is built with React and Material-UI, featuring:
- Real-time updates via WebSocket
- Responsive design
- Modern UI components
- Error handling and loading states

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License 