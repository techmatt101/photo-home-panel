import { PhotoPrismApi } from "../intergrations/photoprism/photo-prism-api";

export interface PhotoInfo {
    url: string;
    location: string;
    date: Date;
}

export async function* nextImage(photoPrismApi: PhotoPrismApi, orientation: 'landscape' | 'portrait'): AsyncGenerator<PhotoInfo> {
    const albums = await photoPrismApi.getAlbums({category: 'Photography', count: 1000});
    if (albums.length === 0) {
        return;
    }

    const remainingAlbums = [...albums];

    while (remainingAlbums.length > 0) {
        const randomAlbumIndex = Math.floor(Math.random() * remainingAlbums.length);
        const selectedAlbum = remainingAlbums[randomAlbumIndex];

        const albumPhotos = await photoPrismApi.searchPhotos({
            album: selectedAlbum.UID,
            count: selectedAlbum.PhotoCount
        });

        let filteredPhotos = albumPhotos.filter(photo => {
            if (orientation === 'landscape') {
                return photo.Width > photo.Height;
            } else {
                return photo.Height > photo.Width;
            }
        });

        if (filteredPhotos.length === 0) {
            remainingAlbums.splice(randomAlbumIndex, 1);
            continue;
        }

        const shuffledPhotos = [...filteredPhotos];
        for (let i = shuffledPhotos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPhotos[i], shuffledPhotos[j]] = [shuffledPhotos[j], shuffledPhotos[i]];
        }

        for (const photo of shuffledPhotos) {
            yield {
                url: photoPrismApi.getPhotoUrl(photo.Hash),
                location: photo.PlaceID,
                date: new Date(photo.TakenAt)
            };
        }

        remainingAlbums.splice(randomAlbumIndex, 1);
    }
}