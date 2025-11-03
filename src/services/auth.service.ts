export const EVENT_AUTH_REQUIRED = 'auth-required';
export const EVENT_AUTH_SUCCESS = 'auth-success';
export const EVENT_AUTH_FAILURE = 'auth-failure';
import { SettingsService } from './settings.service';

export interface AuthConfig {
    [key: string]: any;
}

export interface AuthServiceRegistration {
    id: string;
    name: string;
    formFields: AuthFormField[];
}

export interface AuthFormField {
    id: string;
    label: string;
    type: 'text' | 'password' | 'url';
    placeholder?: string;
    required: boolean;
    helpText?: string;
}

export interface AuthRequiredEventDetail {
    type: string;
    message?: string;
}

export class AuthService {
    private registeredServices: Map<string, AuthServiceRegistration> = new Map();
    private authData: Map<string, AuthConfig> = new Map();
    private _settingsService: SettingsService;
    
    constructor(settingsService: SettingsService) {
        this._settingsService = settingsService;
    }

    public registerService(registration: AuthServiceRegistration): void {
        this.registeredServices.set(registration.id, registration);
        this.loadSavedCredentials(registration.id);
    }

    public getRegisteredService(type: string): AuthServiceRegistration | undefined {
        return this.registeredServices.get(type);
    }

    public getRegisteredServices(): AuthServiceRegistration[] {
        return Array.from(this.registeredServices.values());
    }

    public getConfig<T>(type: string): T | null {
        const data = this.authData.get(type);
        return data as T || null;
    }

    public setAuth(type: string, config: AuthConfig): void {
        this.authData.set(type, config);
        this.saveCredentials(type, config);
    }

    public updateTokens(type: string, tokens: any): void {
        const data = this.authData.get(type);
        if (data && data.config) {
            data.tokens = tokens;
            this.saveCredentials(type, data);
        }
    }

    public clearCredentials(type: string): void {
        const registration = this.registeredServices.get(type);
        if (registration) {
            this.authData.delete(type);
            this._settingsService.clearAuth(registration.id);
        }
    }

    public requestAuth(type: string, message?: string): void {
        const registration = this.registeredServices.get(type);
        if (!registration) {
            console.error(`Service ${type} is not registered`);
            return;
        }

        const detail: AuthRequiredEventDetail = {
            type,
            message
        };
        window.dispatchEvent(new CustomEvent(EVENT_AUTH_REQUIRED, {detail}));
    }

    public getFormFields(type: string): AuthFormField[] {
        const registration = this.registeredServices.get(type);
        if (!registration) {
            console.error(`Service ${type} is not registered`);
            return [];
        }
        return registration.formFields;
    }

    public getServiceName(type: string): string {
        const registration = this.registeredServices.get(type);
        if (!registration) {
            console.error(`Service ${type} is not registered`);
            return type;
        }
        return registration.name;
    }

    private loadSavedCredentials(type: string): void {
        try {
            const registration = this.registeredServices.get(type);
            if (!registration) {
                console.error(`Service ${type} is not registered`);
                return;
            }

            const fromSettings = this._settingsService.getAuth(registration.id);
            if (fromSettings) {
                this.authData.set(type, fromSettings);
                return;
            }

        } catch (error) {
            console.error(`Failed to load saved credentials for ${type}:`, error);
        }
    }

    private saveCredentials(type: string, data: AuthConfig): void {
        try {
            const registration = this.registeredServices.get(type);
            if (!registration) {
                console.error(`Service ${type} is not registered`);
                return;
            }
            this._settingsService.setAuth(registration.id, data);
        } catch (error) {
            console.error(`Failed to save credentials for ${type}:`, error);
        }
    }
}
