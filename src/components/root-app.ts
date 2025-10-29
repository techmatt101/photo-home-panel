import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import './photo-slideshow';
import './info-overlay';
import './clock-widget';
import './weather-widget';
import './media-player';
import './calendar-events';
import './control-widget';
import './login-dialog';
import './loading-spinner';
import { authService, homeAssistantApi, photoPrismApi } from "../state";
import { EVENT_AUTH_SUCCESS } from "../services/auth.service";

@customElement('root-app')
export class RootApp extends LitElement {
    public static styles = css`
        .overlay {
            position: fixed;
            z-index: 999;
            background: linear-gradient(153deg, rgb(157 94 0 / 10%), rgb(0 95 161 / 20%));
            bottom: 0;
            right: 0;
            width: 90%;
            max-width: 1500px;
            backdrop-filter: blur(10px);
            margin-right: 40px;
            padding: 20px;
            border-radius: 20px 20px 0 0;
            box-sizing: border-box;
            display: flex;
            justify-content: flex-start;
            align-items: stretch;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3), inset 6px 12px 42px 12px rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-top-color: rgba(255, 255, 255, 0.3);
            border-bottom: none;
            gap: 40px;
        }

        .spacer {
            border-left: 2px solid rgba(255, 255, 255, 0.2);
            height: 150px;
        }
    `;


    @state() private _isLoading = true;

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
                <div class="overlay">
                    <media-player></media-player>
                    <control-widget></control-widget>
                    <div style="flex: 1 1 0%;"></div>
                    <weather-widget></weather-widget>
                    <div class="spacer"></div>
                    <clock-widget></clock-widget>
                </div>
                <photo-slideshow></photo-slideshow>
            `}
        `;
    }
}
