import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import './photo-slideshow';
import './info-overlay';
import './login-dialog';
import './loading-spinner';
import './widget-overlay';
import './camera-view';
import './settings-page';
import { authService, homeAssistantApi, photoPrismApi } from "../state";
import { EVENT_AUTH_SUCCESS } from "../services/auth.service";

@customElement('root-app')
export class RootApp extends LitElement {
    @state() private _isLoading = true;
    @state() private _viewMode: 'photos' | 'camera' = 'photos';
    @state() private _isSettingsOpen = false;

    public async connectedCallback() {
        super.connectedCallback();

        setTimeout(() => {
            this.load();
        });

        window.addEventListener(EVENT_AUTH_SUCCESS, this.load.bind(this));
    }

    public async load(): Promise<void> {
        this._isLoading = true;
        for (const service of authService.getRegisteredServices()) {
            if (!authService.getConfig(service.id)) {
                setTimeout(() => {
                    authService.requestAuth(service.id);
                });
                return;
            }
        }
        await photoPrismApi.initialize();
        await homeAssistantApi.initialize();
        this._isLoading = false;
    }

    public render() {
        return html`
            ${this._isLoading ? html`
                <loading-spinner></loading-spinner>
                <login-dialog></login-dialog>` : html`
                <widget-overlay
                    .viewMode=${this._viewMode}
                    @view-mode-change=${this._onViewModeChange}
                    @open-settings=${this._openSettings}
                ></widget-overlay>
                ${this._viewMode === 'camera' ? html`
                    <camera-view></camera-view>
                ` : html`
                    <photo-slideshow></photo-slideshow>
                `}
                ${this._isSettingsOpen ? html`
                    <settings-page
                        @close-settings=${this._closeSettings}
                        @auth-settings-updated=${this._handleSettingsUpdated}
                    ></settings-page>
                ` : ''}
            `}
        `;
    }

    private _onViewModeChange(event: CustomEvent<{ viewMode: 'photos' | 'camera' }>): void {
        this._viewMode = event.detail.viewMode;
    }

    private _openSettings = (): void => {
        this._isSettingsOpen = true;
    };

    private _closeSettings = (): void => {
        this._isSettingsOpen = false;
    };

    private _handleSettingsUpdated = async (): Promise<void> => {
        await this.load();
    };
}
