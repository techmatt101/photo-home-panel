import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { PhotoPrismConfig } from '../types/photoprism.types';
import { HomeAssistantConfig } from '../types/home-assistant.types';
import authService, { AuthType, AuthRequiredEventDetail } from '../services/auth-service';

// Event names
const EVENT_AUTH_REQUIRED = 'auth-required';
const EVENT_AUTH_SUCCESS = 'auth-success';
const EVENT_AUTH_FAILURE = 'auth-failure';

@customElement('login-dialog')
export class LoginDialog extends LitElement {
  @state() private open = false;
  @state() private authType: AuthType = 'photoprism';
  @state() private message = '';
  @state() private loading = false;
  @state() private error = '';

  // PhotoPrism form fields
  @state() private ppUrl = '';
  @state() private ppUsername = '';
  @state() private ppPassword = '';

  // Home Assistant form fields
  @state() private haUrl = '';
  @state() private haToken = '';

  static styles = css`
    :host {
      --dialog-bg: #ffffff;
      --dialog-text: #333333;
      --dialog-border: #dddddd;
      --dialog-shadow: rgba(0, 0, 0, 0.2);
      --primary-color: #4285f4;
      --error-color: #d93025;
      --input-border: #cccccc;
      --input-focus: #4285f4;
      --button-bg: #4285f4;
      --button-text: #ffffff;
      --button-hover: #3367d6;
      --overlay-bg: rgba(0, 0, 0, 0.5);
    }

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--overlay-bg);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
    }

    .overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .dialog {
      background-color: var(--dialog-bg);
      color: var(--dialog-text);
      border-radius: 8px;
      box-shadow: 0 4px 12px var(--dialog-shadow);
      width: 90%;
      max-width: 400px;
      padding: 24px;
      transform: translateY(-20px);
      transition: transform 0.3s;
    }

    .overlay.open .dialog {
      transform: translateY(0);
    }

    .dialog-header {
      margin-bottom: 16px;
    }

    .dialog-title {
      font-size: 1.5rem;
      font-weight: 500;
      margin: 0 0 8px 0;
    }

    .dialog-message {
      margin: 0;
      color: #666;
    }

    .dialog-content {
      margin-bottom: 24px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--input-border);
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: var(--input-focus);
      box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
    }

    .error-message {
      color: var(--error-color);
      margin-top: 16px;
      font-size: 0.9rem;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    button {
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button.primary {
      background-color: var(--button-bg);
      color: var(--button-text);
    }

    button.primary:hover {
      background-color: var(--button-hover);
    }

    button.secondary {
      background-color: transparent;
      color: var(--button-bg);
    }

    button.secondary:hover {
      background-color: rgba(66, 133, 244, 0.1);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --dialog-bg: #2d2d2d;
        --dialog-text: #e0e0e0;
        --dialog-border: #444444;
        --input-border: #555555;
        --dialog-shadow: rgba(0, 0, 0, 0.4);
      }

      .dialog-message {
        color: #aaa;
      }
    }
  `;

  constructor() {
    super();
    this.addEventListener(EVENT_AUTH_REQUIRED, this.handleAuthRequired as EventListener);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(EVENT_AUTH_REQUIRED, this.handleAuthRequired as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(EVENT_AUTH_REQUIRED, this.handleAuthRequired as EventListener);
  }

  private handleAuthRequired(event: CustomEvent<AuthRequiredEventDetail>) {
    this.authType = event.detail.type;
    this.message = event.detail.message || '';
    this.error = '';
    this.loading = false;
    
    // Initialize form fields based on auth type
    if (this.authType === 'photoprism') {
      const config = authService.getPhotoPrismConfig();
      this.ppUrl = config?.baseUrl || '';
      this.ppUsername = config?.username || '';
      this.ppPassword = config?.password || '';
    } else {
      const config = authService.getHomeAssistantConfig();
      this.haUrl = config?.url || '';
      this.haToken = config?.accessToken || '';
    }

    this.open = true;
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    this.loading = true;
    this.error = '';

    if (this.authType === 'photoprism') {
      this.submitPhotoPrism();
    } else {
      this.submitHomeAssistant();
    }
  }

  private async submitPhotoPrism() {
    try {
      // Validate form
      if (!this.ppUrl || !this.ppUsername || !this.ppPassword) {
        throw new Error('Please fill in all fields');
      }

      // Create config object
      const config: PhotoPrismConfig = {
        baseUrl: this.ppUrl,
        username: this.ppUsername,
        password: this.ppPassword
      };

      // Save to auth service
      authService.setPhotoPrismConfig(config);

      // Dispatch success event
      window.dispatchEvent(new CustomEvent(EVENT_AUTH_SUCCESS, { 
        detail: { type: 'photoprism' } 
      }));

      // Close dialog
      this.open = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'An unknown error occurred';
      this.loading = false;

      // Dispatch failure event
      window.dispatchEvent(new CustomEvent(EVENT_AUTH_FAILURE, { 
        detail: { 
          type: 'photoprism',
          error: this.error
        } 
      }));
    }
  }

  private async submitHomeAssistant() {
    try {
      // Validate form
      if (!this.haUrl) {
        throw new Error('Please enter the Home Assistant URL');
      }

      // Create config object
      const config: HomeAssistantConfig = {
        url: this.haUrl,
        accessToken: this.haToken || undefined
      };

      // Save to auth service
      authService.setHomeAssistantConfig(config);

      // Dispatch success event
      window.dispatchEvent(new CustomEvent(EVENT_AUTH_SUCCESS, { 
        detail: { type: 'homeassistant' } 
      }));

      // Close dialog
      this.open = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'An unknown error occurred';
      this.loading = false;

      // Dispatch failure event
      window.dispatchEvent(new CustomEvent(EVENT_AUTH_FAILURE, { 
        detail: { 
          type: 'homeassistant',
          error: this.error
        } 
      }));
    }
  }

  private handleCancel() {
    // Dispatch failure event
    window.dispatchEvent(new CustomEvent(EVENT_AUTH_FAILURE, { 
      detail: { 
        type: this.authType,
        error: 'Authentication cancelled by user'
      } 
    }));

    // Close dialog
    this.open = false;
  }

  private renderPhotoPrismForm() {
    return html`
      <div class="form-group">
        <label for="ppUrl">PhotoPrism URL</label>
        <input 
          type="url" 
          id="ppUrl" 
          .value=${this.ppUrl}
          @input=${(e: InputEvent) => this.ppUrl = (e.target as HTMLInputElement).value}
          placeholder="https://photoprism.local"
          ?disabled=${this.loading}
          required
        >
      </div>
      <div class="form-group">
        <label for="ppUsername">Username</label>
        <input 
          type="text" 
          id="ppUsername" 
          .value=${this.ppUsername}
          @input=${(e: InputEvent) => this.ppUsername = (e.target as HTMLInputElement).value}
          placeholder="admin"
          ?disabled=${this.loading}
          required
        >
      </div>
      <div class="form-group">
        <label for="ppPassword">Password</label>
        <input 
          type="password" 
          id="ppPassword" 
          .value=${this.ppPassword}
          @input=${(e: InputEvent) => this.ppPassword = (e.target as HTMLInputElement).value}
          ?disabled=${this.loading}
          required
        >
      </div>
    `;
  }

  private renderHomeAssistantForm() {
    return html`
      <div class="form-group">
        <label for="haUrl">Home Assistant URL</label>
        <input 
          type="url" 
          id="haUrl" 
          .value=${this.haUrl}
          @input=${(e: InputEvent) => this.haUrl = (e.target as HTMLInputElement).value}
          placeholder="http://homeassistant.local"
          ?disabled=${this.loading}
          required
        >
      </div>
      <div class="form-group">
        <label for="haToken">Long-lived Access Token (optional)</label>
        <input 
          type="password" 
          id="haToken" 
          .value=${this.haToken}
          @input=${(e: InputEvent) => this.haToken = (e.target as HTMLInputElement).value}
          placeholder="Enter your access token"
          ?disabled=${this.loading}
        >
      </div>
      <p>
        If you don't provide an access token, you'll be redirected to the Home Assistant login page.
      </p>
    `;
  }

  render() {
    return html`
      <div class="overlay ${this.open ? 'open' : ''}">
        <div class="dialog">
          <div class="dialog-header">
            <h2 class="dialog-title">
              ${this.authType === 'photoprism' ? 'PhotoPrism Login' : 'Home Assistant Login'}
            </h2>
            ${this.message ? html`<p class="dialog-message">${this.message}</p>` : ''}
          </div>
          
          <form @submit=${this.handleSubmit}>
            <div class="dialog-content">
              ${this.authType === 'photoprism' 
                ? this.renderPhotoPrismForm() 
                : this.renderHomeAssistantForm()
              }
              
              ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}
            </div>
            
            <div class="dialog-footer">
              <button 
                type="button" 
                class="secondary" 
                @click=${this.handleCancel}
                ?disabled=${this.loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="primary"
                ?disabled=${this.loading}
              >
                ${this.loading 
                  ? html`<span class="loading-spinner"></span> Connecting...` 
                  : 'Connect'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}