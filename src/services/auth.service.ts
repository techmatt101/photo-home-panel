export const EVENT_AUTH_REQUIRED = 'auth-required';
export const EVENT_AUTH_SUCCESS = 'auth-success';
export const EVENT_AUTH_FAILURE = 'auth-failure';

export interface AuthConfig {
    [key: string]: any;
}

export interface AuthData {
    config: AuthConfig;
    tokens?: any;
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

export interface AuthSuccessEventDetail {
    type: string;
}

export interface AuthFailureEventDetail {
    type: string;
    error: string;
}

export class AuthService {
    private registeredServices: Map<string, AuthServiceRegistration> = new Map();
    private authData: Map<string, AuthData> = new Map();

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
        return data?.config as T || null;
    }

    public getTokens(type: string): any | null {
        const data = this.authData.get(type);
        return data?.tokens || null;
    }

    public setAuth(type: string, config: AuthConfig, tokens?: any): void {
        const data: AuthData = {config};
        if (tokens) {
            data.tokens = tokens;
        }

        this.authData.set(type, data);
        this.saveCredentials(type, data);
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
            localStorage.removeItem(`auth-${registration.id}`);
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

            const savedAuth = localStorage.getItem(`auth-${registration.id}`);
            if (savedAuth) {
                this.authData.set(type, JSON.parse(savedAuth));
            }
        } catch (error) {
            console.error(`Failed to load saved credentials for ${type}:`, error);
        }
    }

    private saveCredentials(type: string, data: AuthData): void {
        try {
            const registration = this.registeredServices.get(type);
            if (!registration) {
                console.error(`Service ${type} is not registered`);
                return;
            }

            localStorage.setItem(`auth-${registration.id}`, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save credentials for ${type}:`, error);
        }
    }
}