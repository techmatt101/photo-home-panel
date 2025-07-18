import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AuthConfig, AuthFormField, AuthRequiredEventDetail, EVENT_AUTH_FAILURE, EVENT_AUTH_REQUIRED, EVENT_AUTH_SUCCESS } from "../services/auth.service";
import { authService } from "../state";

@customElement('login-dialog')
export class LoginDialog extends LitElement {
    public static styles = css`
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
            to {
                transform: rotate(360deg);
            }
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
    @state() private _open = false;
    @state() private _authType: string = '';
    @state() private _message = '';
    @state() private _loading = false;
    @state() private _error = '';
    @state() private _formFields: AuthFormField[] = [];
    @state() private _formValues: Record<string, string> = {};

    constructor() {
        super();
        this.addEventListener(EVENT_AUTH_REQUIRED, (event) => this.handleAuthRequired(event as any));
    }

    public connectedCallback() {
        super.connectedCallback();
        window.addEventListener(EVENT_AUTH_REQUIRED, (event) => this.handleAuthRequired(event as any));
    }

    public disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener(EVENT_AUTH_REQUIRED, (event) => this.handleAuthRequired(event as any));
    }

    public render() {
        const serviceName = this._authType ? authService.getServiceName(this._authType) : '';

        return html`
            <div class="overlay ${this._open ? 'open' : ''}">
                <div class="dialog">
                    <div class="dialog-header">
                        <h2 class="dialog-title">
                            ${serviceName} Login
                        </h2>
                        ${this._message ? html`<p class="dialog-message">${this._message}</p>` : ''}
                    </div>

                    <form @submit=${this.handleSubmit}>
                        <div class="dialog-content">
                            ${this.renderForm()}

                            ${this._error ? html`
                                <div class="error-message">${this._error}</div>` : ''}
                        </div>

                        <div class="dialog-footer">
                            <button
                                type="button"
                                class="secondary"
                                @click=${this.handleCancel}
                                ?disabled=${this._loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                class="primary"
                                ?disabled=${this._loading}
                            >
                                ${this._loading
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
        this._authType = event.detail.type;
        this._message = event.detail.message || '';
        this._error = '';
        this._loading = false;

        const service = authService.getRegisteredService(this._authType);
        if (!service) {
            console.error(`Service ${this._authType} is not registered`);
            return;
        }

        this._formFields = authService.getFormFields(this._authType);

        const config = authService.getConfig<any>(this._authType);
        this._formValues = {};

        for (const field of this._formFields) {
            this._formValues[field.id] = config ? config[field.id] || '' : '';
        }

        this._open = true;
        this.requestUpdate();
    }

    private handleSubmit(e: Event) {
        e.preventDefault();
        this._loading = true;
        this._error = '';

        this.submitForm();
    }

    private async submitForm() {
        try {
            for (const field of this._formFields) {
                if (field.required && !this._formValues[field.id]) {
                    throw new Error(`Please fill in the ${field.label} field`);
                }
            }

            const config: AuthConfig = {...this._formValues};

            authService.setAuth(this._authType, config);

            window.dispatchEvent(new CustomEvent(EVENT_AUTH_SUCCESS, {
                detail: {type: this._authType}
            }));

            this._open = false;
        } catch (error) {
            this._error = error instanceof Error ? error.message : 'An unknown error occurred';
            this._loading = false;

            window.dispatchEvent(new CustomEvent(EVENT_AUTH_FAILURE, {
                detail: {
                    type: this._authType,
                    error: this._error
                }
            }));
        }
    }

    private handleCancel() {
        // Dispatch failure event
        window.dispatchEvent(new CustomEvent(EVENT_AUTH_FAILURE, {
            detail: {
                type: this._authType,
                error: 'Authentication cancelled by user'
            }
        }));

        this._open = false;
    }

    private renderFormField(field: AuthFormField) {
        return html`
            <div class="form-group">
                <label for="${field.id}">${field.label}</label>
                <input
                    type="${field.type}"
                    id="${field.id}"
                    .value=${this._formValues[field.id] || ''}
                    @input=${(e: InputEvent) => this._formValues[field.id] = (e.target as HTMLInputElement).value}
                    placeholder="${field.placeholder || ''}"
                    ?disabled=${this._loading}
                    ?required=${field.required}
                >
                ${field.helpText ? html`<p>${field.helpText}</p>` : ''}
            </div>
        `;
    }

    private renderForm() {
        return html`
            ${this._formFields.map(field => this.renderFormField(field))}
        `;
    }
}
