import axios from 'axios';
import {
  PhotoPrismPhoto,
  PhotoPrismAlbum,
  PhotoPrismConfig,
  PhotoSearchParams
} from '../types/photoprism.types';

class PhotoPrismService {
  private config: PhotoPrismConfig;
  private token: string | null = null;
  private photoCache: Map<string, PhotoPrismPhoto> = new Map();
  private albumCache: Map<string, PhotoPrismAlbum> = new Map();

  constructor() {
    // Default configuration - should be loaded from user settings in a real app
    this.config = {
      baseUrl: 'https://photoprism.local',
      username: 'admin',
      password: 'admin'
    };
  }

  // Initialize the service and authenticate
  async initialize(): Promise<boolean> {
    try {
      await this.login();
      return true;
    } catch (error) {
      console.error('Failed to initialize PhotoPrism service:', error);
      return false;
    }
  }

  // Login to PhotoPrism API
  private async login(): Promise<void> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/api/v1/session`, {
        username: this.config.username,
        password: this.config.password
      });

      if (response.data && response.data.id) {
        this.token = response.data.id;
      } else {
        throw new Error('Invalid response from PhotoPrism API');
      }
    } catch (error) {
      console.error('PhotoPrism login failed:', error);
      throw error;
    }
  }

  // Get headers for authenticated requests
  private getHeaders() {
    return {
      'X-Session-ID': this.token || ''
    };
  }

  // Search for photos with various filters
  async searchPhotos(params: PhotoSearchParams): Promise<PhotoPrismPhoto[]> {
    try {
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
    return `${this.config.baseUrl}/api/v1/t/${hash}/${size}`;
  }

  // Get albums
  async getAlbums(): Promise<PhotoPrismAlbum[]> {
    try {
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
