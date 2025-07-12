// Event names
const EVENT_AUTH_REQUIRED = 'auth-required';
const EVENT_AUTH_SUCCESS = 'auth-success';
const EVENT_AUTH_FAILURE = 'auth-failure';

// Generic auth interfaces
export interface AuthConfig {
  [key: string]: any;
}

export interface AuthData {
  config: AuthConfig;
  tokens?: any;
}

// Service registration interface
export interface AuthServiceRegistration {
  type: string;
  name: string;
  storageKey: string;
  formFields: AuthFormField[];
}

// Form field interface for login dialog
export interface AuthFormField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder?: string;
  required: boolean;
  helpText?: string;
}

// Auth required event detail
export interface AuthRequiredEventDetail {
  type: string;
  message?: string;
}

// Auth success event detail
export interface AuthSuccessEventDetail {
  type: string;
}

// Auth failure event detail
export interface AuthFailureEventDetail {
  type: string;
  error: string;
}

class AuthService {
  private registeredServices: Map<string, AuthServiceRegistration> = new Map();
  private authData: Map<string, AuthData> = new Map();
  private authPromptActive = false;

  constructor() {
    // Listen for auth events
    window.addEventListener(EVENT_AUTH_REQUIRED, this.handleAuthRequired.bind(this) as EventListener);
    window.addEventListener(EVENT_AUTH_SUCCESS, this.handleAuthSuccess.bind(this) as EventListener);
    window.addEventListener(EVENT_AUTH_FAILURE, this.handleAuthFailure.bind(this) as EventListener);
  }

  // Register a service with the auth service
  registerService(registration: AuthServiceRegistration): void {
    this.registeredServices.set(registration.type, registration);

    // Load saved credentials for this service
    this.loadSavedCredentials(registration.type);
  }

  // Get a registered service
  getRegisteredService(type: string): AuthServiceRegistration | undefined {
    return this.registeredServices.get(type);
  }

  // Get all registered services
  getRegisteredServices(): AuthServiceRegistration[] {
    return Array.from(this.registeredServices.values());
  }

  // Load saved credentials from localStorage for a specific service
  private loadSavedCredentials(type: string): void {
    try {
      const registration = this.registeredServices.get(type);
      if (!registration) {
        console.error(`Service ${type} is not registered`);
        return;
      }

      const savedAuth = localStorage.getItem(registration.storageKey);
      if (savedAuth) {
        this.authData.set(type, JSON.parse(savedAuth));
      }
    } catch (error) {
      console.error(`Failed to load saved credentials for ${type}:`, error);
    }
  }

  // Save credentials to localStorage
  private saveCredentials(type: string, data: AuthData): void {
    try {
      const registration = this.registeredServices.get(type);
      if (!registration) {
        console.error(`Service ${type} is not registered`);
        return;
      }

      localStorage.setItem(registration.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save credentials for ${type}:`, error);
    }
  }

  // Get configuration for a service
  getConfig(type: string): AuthConfig | null {
    const data = this.authData.get(type);
    return data?.config || null;
  }

  // Get tokens for a service
  getTokens(type: string): any | null {
    const data = this.authData.get(type);
    return data?.tokens || null;
  }

  // Set configuration and tokens for a service
  setAuth(type: string, config: AuthConfig, tokens?: any): void {
    const data: AuthData = { config };
    if (tokens) {
      data.tokens = tokens;
    }

    this.authData.set(type, data);
    this.saveCredentials(type, data);
  }

  // Update tokens for a service
  updateTokens(type: string, tokens: any): void {
    const data = this.authData.get(type);
    if (data && data.config) {
      data.tokens = tokens;
      this.saveCredentials(type, data);
    }
  }

  // Clear credentials for a service
  clearCredentials(type: string): void {
    const registration = this.registeredServices.get(type);
    if (registration) {
      this.authData.delete(type);
      localStorage.removeItem(registration.storageKey);
    }
  }

  // Request authentication for a service
  requestAuth(type: string, message?: string): void {
    if (this.authPromptActive) return;

    const registration = this.registeredServices.get(type);
    if (!registration) {
      console.error(`Service ${type} is not registered`);
      return;
    }

    this.authPromptActive = true;
    const detail: AuthRequiredEventDetail = {
      type,
      message
    };
    window.dispatchEvent(new CustomEvent(EVENT_AUTH_REQUIRED, { detail }));
  }

  // Handle auth required event
  private handleAuthRequired(event: CustomEvent<AuthRequiredEventDetail>): void {
    // This is handled by the login-dialog component
    console.log(`Authentication required for ${event.detail.type}`);
  }

  // Handle auth success event
  private handleAuthSuccess(event: CustomEvent<AuthSuccessEventDetail>): void {
    this.authPromptActive = false;
    console.log(`Authentication successful for ${event.detail.type}`);
  }

  // Handle auth failure event
  private handleAuthFailure(event: CustomEvent<AuthFailureEventDetail>): void {
    this.authPromptActive = false;
    console.error(`Authentication failed for ${event.detail.type}: ${event.detail.error}`);
  }

  // Get form fields for a service
  getFormFields(type: string): AuthFormField[] {
    const registration = this.registeredServices.get(type);
    if (!registration) {
      console.error(`Service ${type} is not registered`);
      return [];
    }
    return registration.formFields;
  }

  // Get service name
  getServiceName(type: string): string {
    const registration = this.registeredServices.get(type);
    if (!registration) {
      console.error(`Service ${type} is not registered`);
      return type;
    }
    return registration.name;
  }
}

// Create a singleton instance
export const authService = new AuthService();

// Export the service
export default authService;
