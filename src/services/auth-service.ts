import { PhotoPrismConfig } from '../types/photoprism.types';
import { HomeAssistantConfig, SavedAuth } from '../types/home-assistant.types';

// Storage keys
const STORAGE_KEY_PHOTOPRISM = 'photoprism_auth';
const STORAGE_KEY_HOMEASSISTANT = 'homeassistant_auth';

// Event names
const EVENT_AUTH_REQUIRED = 'auth-required';
const EVENT_AUTH_SUCCESS = 'auth-success';
const EVENT_AUTH_FAILURE = 'auth-failure';

// Auth types
export type AuthType = 'photoprism' | 'homeassistant';

// Auth required event detail
export interface AuthRequiredEventDetail {
  type: AuthType;
  message?: string;
}

// Auth success event detail
export interface AuthSuccessEventDetail {
  type: AuthType;
}

// Auth failure event detail
export interface AuthFailureEventDetail {
  type: AuthType;
  error: string;
}

class AuthService {
  private photoPrismConfig: PhotoPrismConfig | null = null;
  private homeAssistantConfig: HomeAssistantConfig | null = null;
  private homeAssistantAuth: SavedAuth | null = null;
  private authPromptActive = false;

  constructor() {
    // Load saved credentials from localStorage on initialization
    this.loadSavedCredentials();

    // Listen for auth events
    window.addEventListener(EVENT_AUTH_REQUIRED, this.handleAuthRequired.bind(this) as EventListener);
    window.addEventListener(EVENT_AUTH_SUCCESS, this.handleAuthSuccess.bind(this) as EventListener);
    window.addEventListener(EVENT_AUTH_FAILURE, this.handleAuthFailure.bind(this) as EventListener);
  }

  // Load saved credentials from localStorage
  private loadSavedCredentials(): void {
    try {
      // Load PhotoPrism credentials
      const photoPrismAuth = localStorage.getItem(STORAGE_KEY_PHOTOPRISM);
      if (photoPrismAuth) {
        this.photoPrismConfig = JSON.parse(photoPrismAuth);
      }

      // Load Home Assistant credentials
      const homeAssistantAuth = localStorage.getItem(STORAGE_KEY_HOMEASSISTANT);
      if (homeAssistantAuth) {
        const parsed = JSON.parse(homeAssistantAuth);
        if (parsed.config) {
          this.homeAssistantConfig = parsed.config;
        }
        if (parsed.auth) {
          this.homeAssistantAuth = parsed.auth;
        }
      }
    } catch (error) {
      console.error('Failed to load saved credentials:', error);
    }
  }

  // Save PhotoPrism credentials to localStorage
  private savePhotoPrismCredentials(config: PhotoPrismConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY_PHOTOPRISM, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save PhotoPrism credentials:', error);
    }
  }

  // Save Home Assistant credentials to localStorage
  private saveHomeAssistantCredentials(config: HomeAssistantConfig, auth?: SavedAuth): void {
    try {
      const data = { config, auth };
      localStorage.setItem(STORAGE_KEY_HOMEASSISTANT, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save Home Assistant credentials:', error);
    }
  }

  // Get PhotoPrism configuration
  getPhotoPrismConfig(): PhotoPrismConfig | null {
    return this.photoPrismConfig;
  }

  // Get Home Assistant configuration
  getHomeAssistantConfig(): HomeAssistantConfig | null {
    return this.homeAssistantConfig;
  }

  // Get Home Assistant auth
  getHomeAssistantAuth(): SavedAuth | null {
    return this.homeAssistantAuth;
  }

  // Set PhotoPrism configuration
  setPhotoPrismConfig(config: PhotoPrismConfig): void {
    this.photoPrismConfig = config;
    this.savePhotoPrismCredentials(config);
  }

  // Set Home Assistant configuration
  setHomeAssistantConfig(config: HomeAssistantConfig, auth?: SavedAuth): void {
    this.homeAssistantConfig = config;
    if (auth) {
      this.homeAssistantAuth = auth;
    }
    this.saveHomeAssistantCredentials(config, auth);
  }

  // Clear PhotoPrism credentials
  clearPhotoPrismCredentials(): void {
    this.photoPrismConfig = null;
    localStorage.removeItem(STORAGE_KEY_PHOTOPRISM);
  }

  // Clear Home Assistant credentials
  clearHomeAssistantCredentials(): void {
    this.homeAssistantConfig = null;
    this.homeAssistantAuth = null;
    localStorage.removeItem(STORAGE_KEY_HOMEASSISTANT);
  }

  // Request authentication for PhotoPrism
  requestPhotoPrismAuth(message?: string): void {
    if (this.authPromptActive) return;
    
    this.authPromptActive = true;
    const detail: AuthRequiredEventDetail = {
      type: 'photoprism',
      message
    };
    window.dispatchEvent(new CustomEvent(EVENT_AUTH_REQUIRED, { detail }));
  }

  // Request authentication for Home Assistant
  requestHomeAssistantAuth(message?: string): void {
    if (this.authPromptActive) return;
    
    this.authPromptActive = true;
    const detail: AuthRequiredEventDetail = {
      type: 'homeassistant',
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

  // Save Home Assistant tokens
  saveHomeAssistantTokens(tokens: SavedAuth | null): void {
    if (tokens && this.homeAssistantConfig) {
      this.homeAssistantAuth = tokens;
      this.saveHomeAssistantCredentials(this.homeAssistantConfig, tokens);
    }
  }

  // Load Home Assistant tokens
  loadHomeAssistantTokens(): SavedAuth | undefined {
    return this.homeAssistantAuth || undefined;
  }
}

// Create a singleton instance
export const authService = new AuthService();

// Export the service
export default authService;