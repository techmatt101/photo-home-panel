import axios from 'axios';
import {
  PhotoPrismPhoto,
  PhotoPrismAlbum,
  PhotoPrismConfig,
  PhotoSearchParams
} from '../types/photoprism.types';
import authService, { AuthServiceRegistration } from './auth-service';

class PhotoPrismService {
  private config: PhotoPrismConfig | null = null;
  private token: string | null = null;
  private photoCache: Map<string, PhotoPrismPhoto> = new Map();
  private albumCache: Map<string, PhotoPrismAlbum> = new Map();
  private authRequested: boolean = false;
  private serviceType = 'photoprism';

  constructor() {
    // Register with auth service
    this.registerWithAuthService();
  }

  // Register this service with the auth service
  private registerWithAuthService(): void {
    const registration: AuthServiceRegistration = {
      type: this.serviceType,
      name: 'PhotoPrism',
      storageKey: 'photoprism_auth',
      formFields: [
        {
          id: 'baseUrl',
          label: 'PhotoPrism URL',
          type: 'url',
          placeholder: 'https://photoprism.local',
          required: true
        },
        {
          id: 'username',
          label: 'Username',
          type: 'text',
          placeholder: 'admin',
          required: true
        },
        {
          id: 'password',
          label: 'Password',
          type: 'password',
          required: true
        }
      ]
    };

    authService.registerService(registration);
  }

  // Initialize the service and authenticate
  async initialize(): Promise<boolean> {
    try {
      // Get config from auth service
      const authConfig = authService.getConfig(this.serviceType);

      if (authConfig) {
        this.config = authConfig as PhotoPrismConfig;
      }

      // If no config is available, request authentication
      if (!this.config && !this.authRequested) {
        this.authRequested = true;
        authService.requestAuth(this.serviceType, 'Please log in to PhotoPrism to view your photos.');
        return false;
      }

      // If we have a config, try to login
      if (this.config) {
        await this.login();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize PhotoPrism service:', error);

      // If login fails, request authentication
      if (!this.authRequested) {
        this.authRequested = true;
        authService.requestAuth(this.serviceType, 'Authentication failed. Please check your credentials.');
      }

      return false;
    }
  }

  // Login to PhotoPrism API
  private async login(): Promise<void> {
    if (!this.config) {
      throw new Error('PhotoPrism configuration is not available');
    }

    try {
      const response = await axios.post(`${this.config.baseUrl}/api/v1/session`, {
        username: this.config.username,
        password: this.config.password
      });

      if (response.data && response.data.id) {
        this.token = response.data.id;
        this.authRequested = false; // Reset auth requested flag on successful login
      } else {
        throw new Error('Invalid response from PhotoPrism API');
      }
    } catch (error) {
      console.error('PhotoPrism login failed:', error);

      // Clear token on login failure
      this.token = null;

      throw error;
    }
  }

  // Get headers for authenticated requests
  private getHeaders() {
    return {
      'X-Session-ID': this.token || ''
    };
  }

  // Reset authentication state
  resetAuth(): void {
    this.token = null;
    this.authRequested = false;
  }

  // Search for photos with various filters
  async searchPhotos(params: PhotoSearchParams): Promise<PhotoPrismPhoto[]> {
    try {
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          return [];
        }
      }

      if (!this.token) {
        await this.login();
      }

      const response = await axios.get(`${this.config.baseUrl}/api/v1/photos`, {
        headers: this.getHeaders(),
        params
      });

      if (response.data && Array.isArray(response.data)) {
        // Cache photos for faster access
        response.data.forEach((photo: PhotoPrismPhoto) => {
          this.photoCache.set(photo.UID, photo);
        });

        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Failed to search photos:', error);
      return [];
    }
  }

  // Get a specific photo by UID
  async getPhoto(uid: string): Promise<PhotoPrismPhoto | null> {
    // Check cache first
    if (this.photoCache.has(uid)) {
      return this.photoCache.get(uid) || null;
    }

    try {
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          return null;
        }
      }

      if (!this.token) {
        await this.login();
      }

      const response = await axios.get(`${this.config.baseUrl}/api/v1/photos/${uid}`, {
        headers: this.getHeaders()
      });

      if (response.data) {
        this.photoCache.set(uid, response.data);
        return response.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Failed to get photo ${uid}:`, error);
      return null;
    }
  }

  // Get the URL for a photo with specified size
  getPhotoUrl(hash: string, size: 'thumb' | 'fit_720' | 'fit_1280' | 'fit_1920' | 'fit_2048' | 'fit_2560' | 'fit_3840' | 'original' = 'fit_1920'): string {
    if (!this.config) {
      throw new Error('PhotoPrism configuration is not available');
    }
    return `${this.config.baseUrl}/api/v1/t/${hash}/${size}`;
  }

  // Get albums
  async getAlbums(): Promise<PhotoPrismAlbum[]> {
    try {
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          return [];
        }
      }

      if (!this.token) {
        await this.login();
      }

      const response = await axios.get(`${this.config.baseUrl}/api/v1/albums`, {
        headers: this.getHeaders()
      });

      if (response.data && Array.isArray(response.data)) {
        // Cache albums for faster access
        response.data.forEach((album: PhotoPrismAlbum) => {
          this.albumCache.set(album.UID, album);
        });

        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Failed to get albums:', error);
      return [];
    }
  }

  // Get photos in an album
  async getAlbumPhotos(albumUid: string): Promise<PhotoPrismPhoto[]> {
    try {
      if (!this.config) {
        await this.initialize();
        if (!this.config) {
          return [];
        }
      }

      if (!this.token) {
        await this.login();
      }

      const response = await axios.get(`${this.config.baseUrl}/api/v1/albums/${albumUid}/photos`, {
        headers: this.getHeaders()
      });

      if (response.data && Array.isArray(response.data)) {
        // Cache photos for faster access
        response.data.forEach((photo: PhotoPrismPhoto) => {
          this.photoCache.set(photo.UID, photo);
        });

        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error(`Failed to get photos for album ${albumUid}:`, error);
      return [];
    }
  }

  // Get random photos with preference for newer ones and matching orientation
  async getRandomPhotos(count: number, orientation?: 'landscape' | 'portrait', favorWeight: number = 0.7): Promise<PhotoPrismPhoto[]> {
    try {
      // Get a larger set of photos to select from
      const allPhotos = await this.searchPhotos({
        count: count * 3,
        order: 'newest'
      });

      if (allPhotos.length === 0) {
        return [];
      }

      // Filter by orientation if specified
      let filteredPhotos = allPhotos;
      if (orientation) {
        filteredPhotos = allPhotos.filter(photo => {
          if (orientation === 'landscape') {
            return photo.Width > photo.Height;
          } else {
            return photo.Height > photo.Width;
          }
        });

        // If no photos match the orientation, fall back to all photos
        if (filteredPhotos.length === 0) {
          filteredPhotos = allPhotos;
        }
      }

      // Sort by date (newest first) and apply a weight to favor newer photos
      const weightedPhotos = filteredPhotos.map((photo, index) => {
        const normalizedIndex = index / filteredPhotos.length;
        const weight = Math.pow(1 - normalizedIndex, favorWeight);
        return { photo, weight };
      });

      // Randomly select photos based on weights
      const selectedPhotos: PhotoPrismPhoto[] = [];
      while (selectedPhotos.length < count && weightedPhotos.length > 0) {
        // Calculate total weight
        const totalWeight = weightedPhotos.reduce((sum, item) => sum + item.weight, 0);

        // Select a random point in the weight distribution
        let randomPoint = Math.random() * totalWeight;
        let selectedIndex = -1;

        // Find which photo the random point corresponds to
        for (let i = 0; i < weightedPhotos.length; i++) {
          randomPoint -= weightedPhotos[i].weight;
          if (randomPoint <= 0) {
            selectedIndex = i;
            break;
          }
        }

        // If somehow we didn't select a photo, just take the first one
        if (selectedIndex === -1) {
          selectedIndex = 0;
        }

        // Add the selected photo to our result and remove it from the pool
        selectedPhotos.push(weightedPhotos[selectedIndex].photo);
        weightedPhotos.splice(selectedIndex, 1);
      }

      return selectedPhotos;
    } catch (error) {
      console.error('Failed to get random photos:', error);
      return [];
    }
  }
}

// Create a singleton instance
export const photoPrismService = new PhotoPrismService();

// Export the service
export default photoPrismService;
