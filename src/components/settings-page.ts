import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
    AuthFormField,
    AuthServiceRegistration,
    EVENT_AUTH_REQUIRED
} from '../services/auth.service';
import { authService, settingsService } from '../state';

interface ServiceFormState {
    id: string;
    name: string;
    formFields: AuthFormField[];
    values: Record<string, string>;
    error: string | null;
    saving: boolean;
}

@customElement('settings-page')
export class SettingsPage extends LitElement {
    public static styles = css`
        :host {
            position: fixed;
            inset: 0;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 60px 24px 40px;
            background: rgba(10, 10, 15, 0.82);
            backdrop-filter: blur(14px);
            z-index: 2000;
            overflow-y: auto;
            color: #f5f5f5;
        }

        .settings-container {
            width: min(1200px, 100%);
            display: flex;
            flex-direction: column;
            gap: 32px;
        }

        .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
        }

        .settings-title {
            font-size: 2rem;
            font-weight: 600;
            margin: 0;
        }

        .settings-description {
            margin: 0;
            opacity: 0.75;
        }

        .close-button {
            background: rgba(255, 255, 255, 0.12);
            color: inherit;
            border: none;
            border-radius: 999px;
            padding: 10px 18px;
            font-size: 0.95rem;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .close-button:hover {
            background: rgba(255, 255, 255, 0.22);
        }

        .service-card {
            background: rgba(18, 18, 26, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            padding: 24px 28px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
        }

        .service-card__header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
        }

        .service-card__title {
            font-size: 1.4rem;
            margin: 0;
        }

        .service-card__subtitle {
            margin: 0;
            font-size: 0.9rem;
            opacity: 0.7;
        }

        .form-grid {
            display: grid;
            gap: 18px;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }

        .form-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        label {
            font-weight: 600;
            font-size: 0.95rem;
        }

        input {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 10px;
            padding: 10px 12px;
            color: inherit;
            font-size: 1rem;
            outline: none;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        input:focus {
            border-color: rgba(82, 179, 255, 0.8);
            box-shadow: 0 0 0 2px rgba(82, 179, 255, 0.25);
        }

        .field-help {
            font-size: 0.85rem;
            opacity: 0.6;
        }

        .service-card__actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }

        .action-group {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        button {
            border: none;
            border-radius: 999px;
            padding: 10px 18px;
            font-size: 0.95rem;
            cursor: pointer;
            transition: background 0.2s ease, color 0.2s ease;
        }

        button.primary {
            background: linear-gradient(135deg, #52b3ff, #4263eb);
            color: #fff;
        }

        button.primary:hover:not(:disabled) {
            filter: brightness(1.05);
        }

        button.secondary {
            background: rgba(255, 255, 255, 0.12);
            color: inherit;
        }

        button.secondary:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.2);
        }

        button.danger {
            background: rgba(235, 77, 75, 0.2);
            color: #ff6b6b;
        }

        button.danger:hover:not(:disabled) {
            background: rgba(235, 77, 75, 0.35);
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .error-banner {
            padding: 10px 14px;
            border-radius: 12px;
            background: rgba(235, 87, 87, 0.18);
            color: #ff9f9f;
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            :host {
                padding: 40px 16px;
            }

            .settings-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .service-card {
                padding: 20px;
            }
        }
    `;

    @state() private _forms: ServiceFormState[] = [];
    @state() private _slideshowAutoSeconds: number = 30;

    public connectedCallback(): void {
        super.connectedCallback();
        this._loadServices();
        document.addEventListener('keydown', this._handleKeydown);
        this._loadAppSettings();
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this._handleKeydown);
    }

    public render() {
        return html`
            <div class="settings-container">
                <header class="settings-header">
                    <div>
                        <h2 class="settings-title">Settings</h2>
                        <p class="settings-description">
                            Manage authentication settings for connected services.
                        </p>
                    </div>
                    <button class="close-button" type="button" @click=${this._close}>
                        Close
                    </button>
                </header>

                ${this._forms.map((form) => this._renderServiceForm(form))}

                ${this._renderSlideshowSettings()}
            </div>
        `;
    }

    private _renderServiceForm(form: ServiceFormState) {
        return html`
            <section class="service-card">
                <div class="service-card__header">
                    <div>
                        <h3 class="service-card__title">${form.name}</h3>
                        <p class="service-card__subtitle">
                            Update authentication details for ${form.name}.
                        </p>
                    </div>
                </div>

                <form class="form-grid" @submit=${(event: Event) => this._handleSubmit(event, form)}>
                    ${form.formFields.map((field) => html`
                        <label class="form-field">
                            <span>${field.label}${field.required ? ' *' : ''}</span>
                            <input
                                .type=${field.type === 'password' ? 'password' : 'text'}
                                .value=${form.values[field.id] ?? ''}
                                placeholder=${field.placeholder ?? ''}
                                ?required=${field.required}
                                autocomplete="off"
                                @input=${(event: Event) => this._handleInput(event, form.id, field.id)}
                            />
                            ${field.helpText ? html`
                                <span class="field-help">${field.helpText}</span>
                            ` : ''}
                        </label>
                    `)}
                </form>

                ${form.error ? html`
                    <div class="error-banner">${form.error}</div>
                ` : ''}

                <div class="service-card__actions">
                    <div class="action-group">
                        <button
                            class="primary"
                            type="button"
                            ?disabled=${form.saving}
                            @click=${() => this._save(form.id)}
                        >
                            ${form.saving ? 'Saving…' : 'Save changes'}
                        </button>
                        <button
                            class="secondary"
                            type="button"
                            ?disabled=${form.saving}
                            @click=${() => this._triggerAuth(form.id)}
                        >
                            Re-authenticate
                        </button>
                    </div>
                    <button
                        class="danger"
                        type="button"
                        ?disabled=${form.saving}
                        @click=${() => this._clear(form.id)}
                    >
                        Clear credentials
                    </button>
                </div>
            </section>
        `;
    }

    private _handleInput(event: Event, formId: string, fieldId: string): void {
        const target = event.target as HTMLInputElement;
        this._forms = this._forms.map((form) => {
            if (form.id !== formId) {
                return form;
            }
            return {
                ...form,
                values: {
                    ...form.values,
                    [fieldId]: target.value
                }
            };
        });
    }

    private async _save(serviceId: string): Promise<void> {
        this._updateFormState(serviceId, {saving: true, error: null});
        const form = this._forms.find((item) => item.id === serviceId);
        if (!form) {
            return;
        }

        try {
            authService.setAuth(serviceId, {...form.values});
            this.dispatchEvent(new CustomEvent('auth-settings-updated', {
                bubbles: true,
                composed: true,
                detail: {serviceId}
            }));
        } catch (error: any) {
            this._updateFormState(serviceId, {error: error?.message || 'Failed to save settings'});
        } finally {
            this._updateFormState(serviceId, {saving: false});
        }
    }

    private _triggerAuth(serviceId: string): void {
        authService.requestAuth(serviceId);
        window.dispatchEvent(new CustomEvent(EVENT_AUTH_REQUIRED, {
            detail: {type: serviceId, message: 'Re-authentication requested from settings.'}
        }));
    }

    private _clear(serviceId: string): void {
        authService.clearCredentials(serviceId);
        const formFields = authService.getFormFields(serviceId);
        const resetValues: Record<string, string> = {};
        for (const field of formFields) {
            resetValues[field.id] = '';
        }
        this._updateFormState(serviceId, {
            values: resetValues,
            error: null
        });
        this.dispatchEvent(new CustomEvent('auth-settings-updated', {
            bubbles: true,
            composed: true,
            detail: {serviceId}
        }));
    }

    private _handleSubmit(event: Event, form: ServiceFormState): void {
        event.preventDefault();
        this._save(form.id);
    }

    private _close = (): void => {
        this.dispatchEvent(new CustomEvent('close-settings', {
            bubbles: true,
            composed: true
        }));
    };

    private _handleKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            this._close();
        }
    };

    private _renderSlideshowSettings() {
        return html`
            <section class="service-card">
                <div class="service-card__header">
                    <div>
                        <h3 class="service-card__title">Slideshow</h3>
                        <p class="service-card__subtitle">Configure slideshow behavior.</p>
                    </div>
                </div>

                <div class="form-grid">
                    <label class="form-field">
                        <span>Auto play interval (seconds)</span>
                        <input
                            type="number"
                            min="1"
                            .value=${String(this._slideshowAutoSeconds)}
                            @input=${(e: Event) => this._onSlideshowSecondsInput(e)}
                        />
                        <span class="field-help">Time between images when auto play is on.</span>
                    </label>
                </div>

                <div class="service-card__actions">
                    <div class="action-group">
                        <button class="primary" type="button" @click=${this._saveAppSettings}>Save changes</button>
                        <button class="secondary" type="button" @click=${this._resetAppSettings}>Reset</button>
                    </div>
                </div>
            </section>`;
    }

    private _onSlideshowSecondsInput(e: Event): void {
        const v = Number((e.target as HTMLInputElement).value);
        this._slideshowAutoSeconds = isFinite(v) && v > 0 ? Math.floor(v) : 1;
    }

    private _loadAppSettings(): void {
        try {
            const settings = settingsService.get();
            this._slideshowAutoSeconds = Number(settings.slideshow.autoPlaySeconds) || 30;
        } catch {}
    }

    private _saveAppSettings = (): void => {
        settingsService.setSlideshowAutoPlaySeconds(this._slideshowAutoSeconds);
    };

    private _resetAppSettings = (): void => {
        this._slideshowAutoSeconds = 30;
    };

    private _loadServices(): void {
        const registrations: AuthServiceRegistration[] = authService.getRegisteredServices();
        const forms: ServiceFormState[] = registrations.map((registration) => {
            const formFields = authService.getFormFields(registration.id);
            const savedConfig = authService.getConfig<Record<string, string>>(registration.id) || {};
            const values: Record<string, string> = {};
            for (const field of formFields) {
                values[field.id] = savedConfig[field.id] ?? '';
            }
            return {
                id: registration.id,
                name: registration.name,
                formFields,
                values,
                error: null,
                saving: false
            };
        });

        this._forms = forms;
    }

    private _updateFormState(serviceId: string, patch: Partial<ServiceFormState>): void {
        this._forms = this._forms.map((form) => {
            if (form.id !== serviceId) {
                return form;
            }
            return {
                ...form,
                ...patch,
                values: patch.values ?? form.values
            };
        });
    }
}
