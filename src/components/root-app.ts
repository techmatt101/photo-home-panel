import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import './photo-slideshow';
import './info-overlay';
import './time-weather';
import './media-player';
import './calendar-events';
import './control-buttons';
import './login-dialog';
import './loading-spinner';
import { photoPrismApi } from "../state";

@customElement('root-app')
export class RootApp extends LitElement {
    public static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            background-color: #000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            --primary-color: #ffffff;
            --secondary-color: rgba(255, 255, 255, 0.8);
            --background-overlay: rgba(0, 0, 0, 0.5);
            --accent-color: #4285f4;
            --transition-duration: 1s;
        }
    `;

    @state() private _isLoading = false;

    public async connectedCallback() {
        super.connectedCallback();

        // this._isLoading = true;
        // setTimeout(() => {
        //     authService.requestAuth('photoprism', 'nooo')
        // });
        await photoPrismApi.initialize();
        // this._isLoading = false;
    }

    public render() {
        return html`
            ${this._isLoading ? html`<loading-spinner></loading-spinner><login-dialog></login-dialog>` : html`<photo-slideshow></photo-slideshow>`}
        `;
    }
}
