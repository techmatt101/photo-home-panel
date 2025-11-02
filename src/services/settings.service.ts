export interface AppSettingsSlideshow {
    autoPlaySeconds: number;
}

export interface AppSettings {
    slideshow: AppSettingsSlideshow;
    auth: Record<string, any>
}

const DEFAULT_SETTINGS: AppSettings = {
    slideshow: {
        autoPlaySeconds: 30
    },
    auth: {}
};

export class SettingsService {
    private static readonly STORAGE_KEY = 'app-settings';
    private _settings: AppSettings | null = null;

    private ensureLoaded(): void {
        if (this._settings) return;
        this._settings = this.load();
    }

    public get(): AppSettings {
        this.ensureLoaded();
        return this._settings!;
    }

    public setSlideshowAutoPlaySeconds(seconds: number): void {
        this.ensureLoaded();
        const safe = Number(seconds) > 0 ? Math.floor(Number(seconds)) : DEFAULT_SETTINGS.slideshow.autoPlaySeconds;
        this._settings = {
            ...this._settings!,
            slideshow: {
                ...this._settings!.slideshow,
                autoPlaySeconds: safe
            }
        };
        this.persist();
    }

    public getAuth<TConfig = Record<string, any>>(serviceId: string): TConfig | null {
        this.ensureLoaded();
        const entry = this._settings!.auth?.[serviceId];
        if (!entry) return null;
        return entry;
    }

    public setAuth(serviceId: string, config: Record<string, any>): void {
        this.ensureLoaded();
        this._settings = {
            ...this._settings!,
            auth: {
                ...this._settings!.auth,
                [serviceId]: config
            }
        };
        this.persist();
    }

    public updateAuthTokens(serviceId: string, tokens: any): void {
        this.ensureLoaded();
        const existing = this._settings!.auth?.[serviceId];
        if (!existing) return;
        this._settings = {
            ...this._settings!,
            auth: {
                ...this._settings!.auth,
                [serviceId]: { ...existing, tokens }
            }
        };
        this.persist();
    }

    public clearAuth(serviceId: string): void {
        this.ensureLoaded();
        const { [serviceId]: _, ...rest } = this._settings!.auth || {} as Record<string, Record<string, any>>;
        this._settings = {
            ...this._settings!,
            auth: rest
        };
        this.persist();
    }

    private load(): AppSettings {
        try {
            const raw = localStorage.getItem(SettingsService.STORAGE_KEY);
            if (!raw) return { ...DEFAULT_SETTINGS };
            const parsed = JSON.parse(raw);
            return {
                slideshow: {
                    autoPlaySeconds: Number(parsed?.slideshow?.autoPlaySeconds) || DEFAULT_SETTINGS.slideshow.autoPlaySeconds
                },
                auth: parsed?.auth && typeof parsed.auth === 'object' ? parsed.auth : {}
            };
        } catch {
            return { ...DEFAULT_SETTINGS };
        }
    }

    private persist(): void {
        try {
            localStorage.setItem(SettingsService.STORAGE_KEY, JSON.stringify(this._settings));
        } catch {
            // noop
        }
    }
}
