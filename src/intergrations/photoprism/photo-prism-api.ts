import { PhotoAlbumParams, PhotoPrismAlbum, PhotoPrismConfig, PhotoPrismConfigResponse, PhotoPrismPhoto, PhotoSearchParams } from './photoprism.types';

export class PhotoPrismApi {
    private _options: PhotoPrismConfig;
    private _config: PhotoPrismConfigResponse | null = null;

    constructor(config: PhotoPrismConfig) {
        this._options = config;
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

        this._config = data;
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
        return `/api/photoprism/v1/t/${hash}/${this._config!.previewToken}/${size}`;
    }

    public async getAlbums(params: PhotoAlbumParams): Promise<PhotoPrismAlbum[]> {
        const search = new URLSearchParams(Object.entries(params));
        const response = await fetch(`/api/photoprism/v1/albums?${search}`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }


    private getHeaders() {
        return {
            'Authorization': `Bearer ${this._options.apiKey}`
        };
    }
}