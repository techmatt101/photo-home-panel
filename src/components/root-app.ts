import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authService, homeAssistantApi, photoPrismApi } from "../state";
import { EVENT_AUTH_SUCCESS } from "../services/auth.service";
import { fromEvent } from "rxjs";

import './photo-slideshow';
import './info-overlay';
import './login-dialog';
import './loading-spinner';
import './widget-overlay';
import './camera-view';
import './settings-page';

@customElement('root-app')
export class RootApp extends LitElement {
    @state() private _isLoading = true;
    @state() private _viewMode: 'photos' | 'camera' = 'photos';
    @state() private _isSettingsOpen = false;
    private _doorbellRestoreTimer: number | null = null;
    private _prevViewMode: 'photos' | 'camera' | null = null;
    private static readonly DOORBELL_ENTITY_ID = 'binary_sensor.doorbell';

    public async connectedCallback() {
        super.connectedCallback();

        setTimeout(() => {
            this.load();
        });

        window.addEventListener(EVENT_AUTH_SUCCESS, this.load.bind(this));

        // Subscribe to doorbell events and switch to CCTV when ringing
        try {
            homeAssistantApi
                .entity$<any>(RootApp.DOORBELL_ENTITY_ID)
                .subscribe((entity) => {
                    const isRinging = entity?.state === 'on' || entity?.state === 'ringing';
                    if (isRinging) {
                        this._switchToDoorbellView();
                    }
                });
        } catch {}

        fromEvent(document, 'visibilitychange')
            .subscribe(() => {
                if (document.hidden) {
                    homeAssistantApi.disconnect();
                } else {
                    homeAssistantApi.initialize();
                }
            });
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
        if(this._isLoading) {
            return html`<loading-spinner></loading-spinner><login-dialog></login-dialog>`;
        }

        if(this._isSettingsOpen) {
            return html`<settings-page
                @close-settings=${this._closeSettings}
                @auth-settings-updated=${this._handleSettingsUpdated}
            ></settings-page>`;
        }

        return html`
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
        `;
    }

    private _onViewModeChange(event: CustomEvent<{ viewMode: 'photos' | 'camera' }>): void {
        this._viewMode = event.detail.viewMode;
    }

    private _openSettings = (): void => {
        this._isSettingsOpen = true;
    };

    private _closeSettings = (): void => {
        // Reload the app to apply new settings
        window.location.reload();
    };

    private _handleSettingsUpdated = async (): Promise<void> => {
        await this.load();
    };

    private _switchToDoorbellView(): void {
        // Save current view to restore later
        if (this._prevViewMode == null) {
            this._prevViewMode = this._viewMode;
        }
        this._viewMode = 'camera';

        // Reset restore timer
        if (this._doorbellRestoreTimer) {
            clearTimeout(this._doorbellRestoreTimer);
        }
        this._doorbellRestoreTimer = window.setTimeout(() => {
            if (this._prevViewMode) {
                this._viewMode = this._prevViewMode;
                this._prevViewMode = null;
            }
            this._doorbellRestoreTimer = null;
        }, 5 * 60 * 1000);
    }
}
