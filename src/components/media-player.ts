import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { mediaPlayerService } from "../state";
import { MediaPlayerEntity } from "../intergrations/home-assistant/home-assistant.types";

@customElement('media-player')
export class MediaPlayer extends LitElement {

    public static styles = css`
        :host {
            display: block;
            color: var(--primary-color, #ffffff);
        }

        .media-status {
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            margin-top: auto;
        }

        .media-info {
            margin-bottom: 10px;
        }

        .media-title {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .media-artist {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .media-controls {
            display: flex;
            justify-content: center;
            gap: 15px;
        }

        .media-button {
            background: rgba(0, 0, 0, 0.3);
            color: var(--primary-color, #ffffff);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            font-size: 18px;
            transition: background-color 0.2s ease;
        }

        .media-button:hover {
            background: rgba(0, 0, 0, 0.5);
        }
    `;

    @state() private _model: MediaPlayerEntity;

    public connectedCallback() {
        super.connectedCallback();

        mediaPlayerService.currentlyPlayer.subscribe((model) => {
            this._model = model;
        })
    }

    public disconnectedCallback() {
        super.disconnectedCallback();
    }

    public  render() {
        return html`
            <div class="media-status">
                <div class="media-info">
                    ${this._model.attributes.media_title ? html`
                        <div class="media-title">${this._model.attributes.media_title}</div>` : ''}
                    ${this._model.attributes.media_artist ? html`
                        <div class="media-artist">${this._model.attributes.media_artist}</div>` : ''}
                </div>
                <div class="media-controls">
                    <button class="media-button" @click=${() => this.mediaCommand('previous')}>⏮</button>
                    <button class="media-button" @click=${() => this.mediaCommand(this._model.state ? 'pause' : 'play')}>
                        ${this._model.state ? '⏸' : '▶'}
                    </button>
                    <button class="media-button" @click=${() => this.mediaCommand('next')}>⏭</button>
                </div>
            </div>
        `;
    }

    private async mediaCommand(command: 'play' | 'pause' | 'next' | 'previous') {
        await mediaPlayerService.mediaCommand(command);
    }
}
