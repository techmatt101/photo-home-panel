export interface PhotoPrismPhoto {
    UID: string;
    Title: string;
    Description: string;
    TakenAt: string;
    TakenAtLocal: string;
    TakenSrc: string;
    TimeZone: string;
    Path: string;
    Name: string;
    OriginalName: string;
    Type: string;
    Favorite: boolean;
    Private: boolean;
    Lat: number;
    Lng: number;
    Altitude: number;
    Width: number;
    Height: number;
    Hash: string;
    StackUID: string;
    PlaceID: string;
    PlaceSrc: string;
    CellID: string;
    CellAccuracy: number;
}

export interface PhotoPrismAlbum {
    UID: string;
    Slug: string;
    Type: string;
    Title: string;
    Description: string;
    Location: string;
    Category: string;
    PhotoCount: number;
    Favorite: boolean;
    Private: boolean;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface PhotoPrismConfig {
    baseUrl: string;
    apiKey: string;
}

export interface PhotoPrismConfigResponse {
    previewToken: string;
}

export interface PhotoSearchParams {
    q?: string;
    count?: number;
    offset?: number;
    order?: string;
    path?: string;
    favorite?: boolean;
    album?: string;
    year?: number;
    month?: number;
    day?: number;
    quality?: number;
    orientation?: string;
}
