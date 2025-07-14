import {css, html, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import authService, {AuthConfig, AuthFormField, AuthRequiredEventDetail} from '../services/auth-service';

// Event names
const EVENT_AUTH_REQUIRED = 'auth-required';
const EVENT_AUTH_SUCCESS = 'auth-success';
const EVENT_AUTH_FAILURE = 'auth-failure';

@customElement('login-dialog')
export class LoginDialog extends LitElement {
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
    @state() private open = false;
    @state() private authType: string = '';
    @state() private message = '';
    @state() private loading = false;
    @state() private error = '';
    @state() private formFields: AuthFormField[] = [];
    @state() private formValues: Record<string, string> = {};

    constructor() {
        super();
        this.addEventListener(EVENT_AUTH_REQUIRED, (event) => this.handleAuthRequired(event as any));
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener(EVENT_AUTH_REQUIRED, (event) => this.handleAuthRequired(event as any));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener(EVENT_AUTH_REQUIRED, (event) => this.handleAuthRequired(event as any));
    }

    render() {
        console.log('render', this.formFields, this.open);
        const serviceName = this.authType ? authService.getServiceName(this.authType) : '';

        return html`
      <div class="overlay ${this.open ? 'open' : ''}">
        <div class="dialog">
          <div class="dialog-header">
            <h2 class="dialog-title">
              ${serviceName} Login
            </h2>
            ${this.message ? html`<p class="dialog-message">${this.message}</p>` : ''}
          </div>

          <form @submit=${this.handleSubmit}>
            <div class="dialog-content">
              ${this.renderForm()}

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

    private handleAuthRequired(event: CustomEvent<AuthRequiredEventDetail>) {
        this.authType = event.detail.type;
        this.message = event.detail.message || '';
        this.error = '';
        this.loading = false;

        // Get the registered service
        const service = authService.getRegisteredService(this.authType);
        if (!service) {
            console.error(`Service ${this.authType} is not registered`);
            return;
        }

        // Get form fields for this service
        this.formFields = authService.getFormFields(this.authType);
        console.log('formFields', this.formFields);

        // Initialize form values from saved config
        const config = authService.getConfig(this.authType) || {};
        this.formValues = {};

        // Initialize form values
        for (const field of this.formFields) {
            this.formValues[field.id] = config[field.id] || '';
        }

        this.open = true;
        this.requestUpdate();
    }

    private handleSubmit(e: Event) {
        e.preventDefault();
        this.loading = true;
        this.error = '';

        this.submitForm();
    }

    private async submitForm() {
        try {
            // Validate required fields
            for (const field of this.formFields) {
                if (field.required && !this.formValues[field.id]) {
                    throw new Error(`Please fill in the ${field.label} field`);
                }
            }

            // Create config object from form values
            const config: AuthConfig = {...this.formValues};

            // Save to auth service
            authService.setAuth(this.authType, config);

            // Dispatch success event
            window.dispatchEvent(new CustomEvent(EVENT_AUTH_SUCCESS, {
                detail: {type: this.authType}
            }));

            // Close dialog
            this.open = false;
        } catch (error) {
            this.error = error instanceof Error ? error.message : 'An unknown error occurred';
            this.loading = false;

            // Dispatch failure event
            window.dispatchEvent(new CustomEvent(EVENT_AUTH_FAILURE, {
                detail: {
                    type: this.authType,
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

    private renderFormField(field: AuthFormField) {
        return html`
      <div class="form-group">
        <label for="${field.id}">${field.label}</label>
        <input 
          type="${field.type}" 
          id="${field.id}" 
          .value=${this.formValues[field.id] || ''}
          @input=${(e: InputEvent) => this.formValues[field.id] = (e.target as HTMLInputElement).value}
          placeholder="${field.placeholder || ''}"
          ?disabled=${this.loading}
          ?required=${field.required}
        >
        ${field.helpText ? html`<p>${field.helpText}</p>` : ''}
      </div>
    `;
    }

    private renderForm() {
        return html`
      ${this.formFields.map(field => this.renderFormField(field))}
    `;
    }
}
