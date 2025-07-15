import { PhotoPrismConfig, PhotoPrismConfigResponse, PhotoPrismPhoto, PhotoSearchParams } from './photoprism.types';

export class PhotoPrismApi {
    private config: PhotoPrismConfig;
    private _previewToken: string | null = null;

    constructor(config: PhotoPrismConfig) {
        this.config = config;
    }

    public async initialize(): Promise<void> {
        const response = await fetch(`/api/photoprism/v1/config`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as PhotoPrismConfigResponse;

        if (!data) {
            throw new Error('Failed to verify API key');
        }

        this._previewToken = data.previewToken;
    }

    public async searchPhotos(params: PhotoSearchParams): Promise<PhotoPrismPhoto[]> {
        const search = new URLSearchParams(Object.entries(params));
        const response = await fetch(`/api/photoprism/v1/photos?${search.toString()}`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    public getPhotoUrl(hash: string, size: 'thumb' | 'fit_720' | 'fit_1280' | 'fit_1920' | 'fit_2048' | 'fit_2560' | 'fit_3840' | 'original' = 'fit_1920'): string {
        return `/api/photoprism/v1/t/${hash}/${this._previewToken}/${size}`;
    }

    //
    // async getPhoto(uid: string): Promise<PhotoPrismPhoto | null> {
    //     // Check cache first
    //     if (this._photoCache.has(uid)) {
    //         return this._photoCache.get(uid) || null;
    //     }
    //
    //     try {
    //         if (!this.config) {
    //             await this.initialize();
    //             if (!this.config) {
    //                 return null;
    //             }
    //         }
    //
    //         if (!this.token) {
    //             await this.login();
    //         }
    //
    //         const response = await fetch(`/api/photoprism/v1/photos/${uid}`, {
    //             method: 'GET',
    //             headers: this.getHeaders()
    //         });
    //
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }
    //
    //         const data = await response.json();
    //
    //         if (data) {
    //             this._photoCache.set(uid, data);
    //             return data;
    //         } else {
    //             return null;
    //         }
    //     } catch (error) {
    //         console.error(`Failed to get photo ${uid}:`, error);
    //         return null;
    //     }
    // }
    //
    //
    // // Get albums
    // async getAlbums(): Promise<PhotoPrismAlbum[]> {
    //     try {
    //         if (!this.config) {
    //             await this.initialize();
    //             if (!this.config) {
    //                 return [];
    //             }
    //         }
    //
    //         if (!this.token) {
    //             await this.login();
    //         }
    //
    //         const response = await fetch(`/api/photoprism/v1/albums`, {
    //             method: 'GET',
    //             headers: this.getHeaders()
    //         });
    //
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }
    //
    //         const data = await response.json();
    //
    //         if (data && Array.isArray(data)) {
    //             // Cache albums for faster access
    //             data.forEach((album: PhotoPrismAlbum) => {
    //                 this._albumCache.set(album.UID, album);
    //             });
    //
    //             return data;
    //         } else {
    //             return [];
    //         }
    //     } catch (error) {
    //         console.error('Failed to get albums:', error);
    //         return [];
    //     }
    // }
    //
    // // Get photos in an album
    // async getAlbumPhotos(albumUid: string): Promise<PhotoPrismPhoto[]> {
    //     try {
    //         if (!this.config) {
    //             await this.initialize();
    //             if (!this.config) {
    //                 return [];
    //             }
    //         }
    //
    //         if (!this.token) {
    //             await this.login();
    //         }
    //
    //         const response = await fetch(`/api/photoprism/v1/albums/${albumUid}/photos`, {
    //             method: 'GET',
    //             headers: this.getHeaders()
    //         });
    //
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }
    //
    //         const data = await response.json();
    //
    //         if (data && Array.isArray(data)) {
    //             // Cache photos for faster access
    //             data.forEach((photo: PhotoPrismPhoto) => {
    //                 this._photoCache.set(photo.UID, photo);
    //             });
    //
    //             return data;
    //         } else {
    //             return [];
    //         }
    //     } catch (error) {
    //         console.error(`Failed to get photos for album ${albumUid}:`, error);
    //         return [];
    //     }
    // }
    //
    //
    // // Initialize API key authentication
    // private async login(): Promise<void> {
    //
    // }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.config.apiKey}`
        };
    }
}