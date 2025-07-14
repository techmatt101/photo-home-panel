import {css, html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

// Import sub-components
import './photo-slideshow';
import './info-overlay';
import './time-weather';
import './media-player';
import './calendar-events';
import './control-buttons';
import './login-dialog';

@customElement('root-app')
export class RootApp extends LitElement {
    static styles = css`
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

    render() {
        return html`
            <login-dialog></login-dialog>
            <photo-slideshow></photo-slideshow>
        `;
    }
}
