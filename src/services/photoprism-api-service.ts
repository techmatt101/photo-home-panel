import {PhotoPrismAlbum, PhotoPrismConfig, PhotoPrismConfigResponse, PhotoPrismPhoto, PhotoSearchParams} from '../types/photoprism.types';
import authService from './auth-service';

class PhotoPrismApiService {
    private config: PhotoPrismConfig | null = null;
    private token: string | null = null;
    private previewToken: string | null = null;
    private photoCache: Map<string, PhotoPrismPhoto> = new Map();
    private albumCache: Map<string, PhotoPrismAlbum> = new Map();
    private authRequested: boolean = false;
    private serviceType = 'photoprism';

    constructor() {
        // Register with auth service
        this.registerWithAuthService();
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

    // Reset authentication state
    resetAuth(): void {
        this.token = null;
        this.previewToken = null;
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

            // Create URL with query parameters
            const url = new URL(`/api/photoprism/v1/photos`, window.location.origin);
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        url.searchParams.append(key, String(value));
                    }
                });
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && Array.isArray(data)) {
                // Cache photos for faster access
                data.forEach((photo: PhotoPrismPhoto) => {
                    this.photoCache.set(photo.UID, photo);
                });

                return data;
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

            const response = await fetch(`/api/photoprism/v1/photos/${uid}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data) {
                this.photoCache.set(uid, data);
                return data;
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

        // If we have a previewToken, include it in the URL
        if (this.previewToken) {
            return `/api/photoprism/v1/t/${hash}/${this.previewToken}/${size}`;
        } else {
            // Fall back to the old URL format if no token is available
            console.warn('PhotoPrism preview token not available, using fallback URL format');
            return `/api/photoprism/v1/t/${hash}/${size}`;
        }
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

            const response = await fetch(`/api/photoprism/v1/albums`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && Array.isArray(data)) {
                // Cache albums for faster access
                data.forEach((album: PhotoPrismAlbum) => {
                    this.albumCache.set(album.UID, album);
                });

                return data;
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

            const response = await fetch(`/api/photoprism/v1/albums/${albumUid}/photos`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && Array.isArray(data)) {
                // Cache photos for faster access
                data.forEach((photo: PhotoPrismPhoto) => {
                    this.photoCache.set(photo.UID, photo);
                });

                return data;
            } else {
                return [];
            }
        } catch (error) {
            console.error(`Failed to get photos for album ${albumUid}:`, error);
            return [];
        }
    }

    // Register this service with the auth service
    private registerWithAuthService(): void {
        const registration = {
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
                    id: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    placeholder: 'Enter your API key',
                    required: true,
                    helpText: 'The API key for authenticating with PhotoPrism'
                }
            ]
        };

        authService.registerService(registration);
    }

    // Initialize API key authentication
    private async login(): Promise<void> {
        if (!this.config) {
            throw new Error('PhotoPrism configuration is not available');
        }

        try {
            // With API key authentication, we don't need to make a login request
            // Just store the API key for use in request headers
            this.token = this.config.apiKey;
            this.authRequested = false;

            // Verify the API key by making a simple request
            const response = await fetch(`/api/photoprism/v1/config`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data) {
                throw new Error('Failed to verify API key');
            }

            // Extract and store the previewToken from the config response
            const configResponse = data as PhotoPrismConfigResponse;
            if (configResponse.previewToken) {
                this.previewToken = configResponse.previewToken;
                console.log('PhotoPrism preview token retrieved successfully');
            } else {
                console.warn('PhotoPrism preview token not found in config response');
            }
        } catch (error) {
            console.error('PhotoPrism API key verification failed:', error);

            // Clear tokens on verification failure
            this.token = null;
            this.previewToken = null;

            throw error;
        }
    }

    // Get headers for authenticated requests
    private getHeaders() {
        return {
            'Authorization': this.token ? `Bearer ${this.token}` : ''
        };
    }
}

// Create a singleton instance
export const photoPrismApiService = new PhotoPrismApiService();

// Export the service
export default photoPrismApiService;