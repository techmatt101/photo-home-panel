# Photo Slideshow PWA

A Progressive Web Application (PWA) that displays a photo slideshow from PhotoPrism with Home Assistant integration.

## Features

- **GPU-accelerated photo slideshow** with smooth transitions
- **Intelligent photo selection** that favors:
    - Newer photos
    - Photos matching the device orientation (landscape/portrait)
    - Photos from the same album or with similar tags
- **Blurred background** behind photos for an elegant look
- **Swipe navigation** for touch devices
- **Home Assistant integration** showing:
    - Current weather for Stafford, UK
    - Calendar events and reminders
    - Spotify playback status with controls
    - TV status
    - Smart home controls (lights, vacuum)
- **Offline mode** with cached photos
- **Responsive design** that works on tablets and other devices
- **PWA capabilities** for installation on home screen

## Technologies Used

- [Lit](https://lit.dev/) - Lightweight web components
- [Vite](https://vitejs.dev/) - Fast build tool
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [PhotoPrism API](https://docs.photoprism.dev/) - Photo management and organization
- [Home Assistant API](https://developers.home-assistant.io/docs/api/websocket) - Smart home control and automation

## Setup and Configuration

### Prerequisites

- A running PhotoPrism instance with your photos
- A running Home Assistant instance with configured entities
- Node.js and npm installed

### Installation

#### Option 1: Standard Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your environment variables:
    - Copy `.env.example` to `.env`
    - Edit `.env` to set your PhotoPrism and Home Assistant URLs and credentials

#### Option 2: Docker Installation

1. Clone this repository
2. Run with Docker Compose:
   ```
   docker-compose up -d
   ```
3. Access the application at http://localhost:80

The Docker setup includes:
- Nginx for serving the application and proxying API requests
- Environment variable configuration for PhotoPrism URL

##### Environment Variables

You can configure the following environment variables in your docker-compose.yml file:

- `PHOTOPRISM_URL`: The URL of your PhotoPrism instance (default: http://photoprism:2342)

Example:
```yaml
services:
  slideshow:
    # ...
    environment:
      - PHOTOPRISM_URL=http://your-photoprism-server:2342
```

##### Using Pre-built Docker Image

You can use pre-built Docker images from either Docker Hub or GitHub Container Registry:

###### Option 1: Docker Hub (Recommended)

```yaml
services:
  slideshow:
    image: techmatt101/photo-home-panel:latest
    ports:
      - "80:80"
    environment:
      - PHOTOPRISM_URL=http://your-photoprism-server:2342
```

###### Option 2: GitHub Container Registry

```yaml
services:
  slideshow:
    image: ghcr.io/techmatt101/photo-home-panel:latest
    ports:
      - "80:80"
    environment:
      - PHOTOPRISM_URL=http://your-photoprism-server:2342
```

### Development

Run the development server:

```
npm run dev
```

### Building for Production

#### Option 1: Standard Build

Build the application:

```
npm run build
```

The built application will be in the `dist` directory, ready to be deployed to any static hosting service.

#### Option 2: Docker Build

First, build the application:

```
npm run build
```

Then build the Docker image:

```
docker build -t slideshow .
```

Run the Docker container:

```
docker run -p 80:80 -e PHOTOPRISM_URL=http://your-photoprism-server:2342 slideshow
```

> **Note:** The Dockerfile has been simplified to not build the project itself. You must run `npm run build` before building the Docker image to create the `dist/` directory that the Docker image requires.

### Continuous Integration

This project uses GitHub Actions for continuous integration:

#### Build Workflow

- Automated builds are triggered on pushes to main/master branches and pull requests
- The workflow builds the application and stores the `dist` directory as an artifact
- Build artifacts are available for download from the GitHub Actions workflow run page
- Artifacts are retained for 7 days

#### Docker Deployment Workflow

- Automated Docker image builds are triggered on pushes to main branch and tags with 'v*' prefix
- The workflow first builds the project using `npm run build` and then builds the Docker image
- The Docker image is then pushed to Docker Hub
- Images are tagged with branch name, tag name, and commit SHA
- You can pull the latest image from Docker Hub with `docker pull techmatt101/photo-home-panel:latest`
- For specific versions, use tags like `docker pull techmatt101/photo-home-panel:v1.0.0`

You can also manually trigger both workflows from the Actions tab in the GitHub repository.

## Usage

### Basic Usage

- The slideshow will automatically advance through your photos
- Swipe left/right or use the arrow buttons to navigate manually
- Weather information is displayed in the bottom right
- Calendar events and media controls appear in the side panel when available

### Authentication

The application provides a user-friendly authentication system for both PhotoPrism and Home Assistant:

1. **First-time Setup**: When you first open the application, you'll be prompted to enter your credentials for PhotoPrism and Home Assistant.

2. **Credential Storage**: Your credentials are securely stored in your browser's local storage, so you don't need to enter them again.

3. **Manual Configuration**: You can also pre-configure credentials using environment variables (see below).

4. **Authentication Flow**:
    - For PhotoPrism: Username and password authentication
    - For Home Assistant: Either a long-lived access token or the standard OAuth flow

5. **Privacy**: All credentials are stored locally on your device and are never sent to any third-party servers.

### Component Configuration Options

The `<photo-slideshow>` component accepts the following attributes:

- `album-uid`: Specify a PhotoPrism album UID to show photos from that album only
- `cache-size`: Number of photos to keep in cache (default: 10)
- `transition-duration`: Duration of transitions in milliseconds (default: 1000)
- `auto-play`: Whether to automatically advance slides (default: true)
- `slide-duration`: Time between slides in milliseconds (default: 10000)

Example:

```html

<photo-slideshow
    album-uid="abc123"
    cache-size="20"
    transition-duration="2000"
    auto-play="true"
    slide-duration="5000">
</photo-slideshow>
```

## Customization

### Styling

The component uses CSS custom properties that can be overridden:

```css
photo-slideshow {
    --primary-color: #ffffff;
    --secondary-color: rgba(255, 255, 255, 0.8);
    --background-overlay: rgba(0, 0, 0, 0.5);
    --accent-color: #4285f4;
    --transition-duration: 1s;
}
```

## License

MIT

## Acknowledgements

- [PhotoPrism](https://photoprism.app/) for the amazing photo management system
- [Home Assistant](https://www.home-assistant.io/) for the open-source home automation platform
