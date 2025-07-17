import { PhotoPrismApi } from "../intergrations/photoprism/photo-prism-api";

export interface PhotoInfo {
    url: string;
    location: string;
    date: Date;
}

export async function* nextImage(photoPrismApi: PhotoPrismApi): AsyncGenerator<PhotoInfo> {
    const photos = await photoPrismApi.searchPhotos({
        count: 10,
        order: 'newest',
        path: 'photography/*'
    });
    for (const photo of photos) {
        yield {
            url: photoPrismApi.getPhotoUrl(photo.Hash),
            location: photo.PlaceID,
            date: new Date(photo.TakenAt)
        }
    }
}

//
// export class PhotoService {
//     private _photoPrismApi: PhotoPrismApi;
//
//     constructor(photoPrismApi: PhotoPrismApi) {
//         this._photoPrismApi = photoPrismApi;
//     }
//
//     public async initialize(): Promise<void> {
//         await this._photoPrismApi.initialize();
//     }
//
//     public async getNextPhoto(count: number, orientation?: 'landscape' | 'portrait', favorWeight: number = 0.7): Promise<PhotoPrismPhoto[]> {
//         const allPhotos = await this._photoPrismApi.searchPhotos({
//             count: count * 3,
//             order: 'newest',
//             path: 'photography/*'
//         });
//
//         if (allPhotos.length === 0) {
//             return [];
//         }
//
//         // Filter by orientation if specified
//         let filteredPhotos = allPhotos;
//         if (orientation) {
//             filteredPhotos = allPhotos.filter(photo => {
//                 if (orientation === 'landscape') {
//                     return photo.Width > photo.Height;
//                 } else {
//                     return photo.Height > photo.Width;
//                 }
//             });
//
//             // If no photos match the orientation, fall back to all photos
//             if (filteredPhotos.length === 0) {
//                 filteredPhotos = allPhotos;
//             }
//         }
//
//         // Sort by date (newest first) and apply a weight to favor newer photos
//         const weightedPhotos = filteredPhotos.map((photo, index) => {
//             const normalizedIndex = index / filteredPhotos.length;
//             const weight = Math.pow(1 - normalizedIndex, favorWeight);
//             return {photo, weight};
//         });
//
//         // Randomly select photos based on weights
//         const selectedPhotos: PhotoPrismPhoto[] = [];
//         while (selectedPhotos.length < count && weightedPhotos.length > 0) {
//             // Calculate total weight
//             const totalWeight = weightedPhotos.reduce((sum, item) => sum + item.weight, 0);
//
//             // Select a random point in the weight distribution
//             let randomPoint = Math.random() * totalWeight;
//             let selectedIndex = -1;
//
//             // Find which photo the random point corresponds to
//             for (let i = 0; i < weightedPhotos.length; i++) {
//                 randomPoint -= weightedPhotos[i].weight;
//                 if (randomPoint <= 0) {
//                     selectedIndex = i;
//                     break;
//                 }
//             }
//
//             // If somehow we didn't select a photo, just take the first one
//             if (selectedIndex === -1) {
//                 selectedIndex = 0;
//             }
//
//             // Add the selected photo to our result and remove it from the pool
//             selectedPhotos.push(weightedPhotos[selectedIndex].photo);
//             weightedPhotos.splice(selectedIndex, 1);
//         }
//
//         return selectedPhotos;
//     }
//
//     //
//     // // Extract location information from a photo
//     // getPhotoLocation(photo: PhotoPrismPhoto): string {
//     //     if (photo.PlaceID) {
//     //         return photo.PlaceID;
//     //     } else if (photo.Path) {
//     //         // Extract location from path if available
//     //         const pathParts = photo.Path.split('/');
//     //         return pathParts[pathParts.length - 2] || 'Unknown location';
//     //     }
//     //     return 'Unknown location';
//     // }
//     //
//     // // Format the photo date
//     // getPhotoDate(photo: PhotoPrismPhoto): string {
//     //     if (photo.TakenAtLocal) {
//     //         const date = new Date(photo.TakenAtLocal);
//     //         return date.toLocaleDateString();
//     //     }
//     //     return 'Unknown date';
//     // }
//
//     // // Delegate methods to the API service for direct access when needed
//     // async searchPhotos(params: any): Promise<PhotoPrismPhoto[]> {
//     //     return await this._photoPrismApi.searchPhotos(params);
//     // }
//     //
//     // async getPhoto(uid: string): Promise<PhotoPrismPhoto | null> {
//     //     return await this._photoPrismApi.getPhoto(uid);
//     // }
//     //
//
//     //
//     // async getAlbumPhotos(albumUid: string): Promise<PhotoPrismPhoto[]> {
//     //     return await this._photoPrismApi.getAlbumPhotos(albumUid);
//     // }
// }
