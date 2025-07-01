# OCR Annotation Tool

A collaborative web-based tool for annotating OCR text with font styles (regular, bold, italic, bold-italic).

## Features

- **Image browsing**: Navigate through images in alphabetical order
- **Bounding box annotation**: Click existing boxes to change font style, drag to create new boxes
- **Progress tracking**: Automatically resumes from where you left off
- **Collaborative**: Multiple users can work on different images simultaneously
- **Export**: Saves annotated JSON files for further processing

## Quick Start with Docker

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   Open your browser and go to `http://localhost:3000`

## Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

## Usage

1. **Place your images** in the `images/` folder
2. **Place OCR JSON files** in the `Old_ocr/` folder (named as `imagename_tesseract_output.json`)
3. **Annotated files** will be saved to `New_ocr/` folder

### Controls

- **Left click on bbox**: Change font style (regular → bold → italic → bold-italic)
- **Drag on canvas**: Create new bounding box
- **Right click on bbox**: Select for deletion
- **ESC key**: Delete selected bbox or cancel bbox creation
- **Next button**: Save current annotations and move to next image

## Deployment

### Docker Hub
```bash
# Build and tag
docker build -t your-username/ocr-annotation-tool .

# Push to Docker Hub
docker push your-username/ocr-annotation-tool

# Run from Docker Hub
docker run -p 3000:3000 -v $(pwd)/New_ocr:/app/New_ocr -v $(pwd)/Old_ocr:/app/Old_ocr -v $(pwd)/images:/app/images your-username/ocr-annotation-tool
```

### Cloud Deployment
Deploy to any cloud platform that supports Docker containers:
- **Railway**: Connect GitHub repo, auto-deploy
- **Render**: Docker-based deployment
- **DigitalOcean App Platform**: Container support
- **AWS ECS/Fargate**: Enterprise deployment

## File Structure

```
├── images/                 # Input images
├── Old_ocr/               # Original OCR JSON files
├── New_ocr/               # Annotated output files
├── index.html             # Frontend application
├── server.js              # Backend server
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Local development setup
└── package.json           # Node.js dependencies
```

## API Endpoints

- `GET /api/images` - List all images
- `GET /api/annotated` - List annotated files
- `GET /api/old_ocr/:filename` - Get original OCR data
- `POST /api/save-json` - Save annotated data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker
5. Submit a pull request
