import {PhotoPrismPhoto} from '../types/photoprism.types';
import photoPrismApiService from './photoprism-api-service';

// Simple interface for photo display information
export interface PhotoDisplayInfo {
    url: string;
    location: string;
    date: string;
}

export class PhotoService {
    // Get random photos with preference for newer ones and matching orientation
    async getRandomPhotos(count: number, orientation?: 'landscape' | 'portrait', favorWeight: number = 0.7): Promise<PhotoPrismPhoto[]> {
        try {
            // Get a larger set of photos to select from
            const allPhotos = await photoPrismApiService.searchPhotos({
                count: count * 3,
                order: 'newest',
                path: 'photography/*'
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
                return {photo, weight};
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

    // Initialize the service and authenticate
    async initialize(): Promise<boolean> {
        return await photoPrismApiService.initialize();
    }

    // Get the URL for a photo with specified size
    getPhotoUrl(hash: string, size: 'thumb' | 'fit_720' | 'fit_1280' | 'fit_1920' | 'fit_2048' | 'fit_2560' | 'fit_3840' | 'original' = 'fit_1920'): string {
        return photoPrismApiService.getPhotoUrl(hash, size);
    }

    // Reset authentication state
    resetAuth(): void {
        photoPrismApiService.resetAuth();
    }

    // Extract location information from a photo
    getPhotoLocation(photo: PhotoPrismPhoto): string {
        if (photo.PlaceID) {
            return photo.PlaceID;
        } else if (photo.Path) {
            // Extract location from path if available
            const pathParts = photo.Path.split('/');
            return pathParts[pathParts.length - 2] || 'Unknown location';
        }
        return 'Unknown location';
    }

    // Format the photo date
    getPhotoDate(photo: PhotoPrismPhoto): string {
        if (photo.TakenAtLocal) {
            const date = new Date(photo.TakenAtLocal);
            return date.toLocaleDateString();
        }
        return 'Unknown date';
    }

    // Delegate methods to the API service for direct access when needed
    async searchPhotos(params: any): Promise<PhotoPrismPhoto[]> {
        return await photoPrismApiService.searchPhotos(params);
    }

    async getPhoto(uid: string): Promise<PhotoPrismPhoto | null> {
        return await photoPrismApiService.getPhoto(uid);
    }

    async getAlbums(): Promise<any[]> {
        return await photoPrismApiService.getAlbums();
    }

    async getAlbumPhotos(albumUid: string): Promise<PhotoPrismPhoto[]> {
        return await photoPrismApiService.getAlbumPhotos(albumUid);
    }
}