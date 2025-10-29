import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { mediaPlayerService } from "../state";
import { MediaPlayerEntity } from "../intergrations/home-assistant/home-assistant.types";
import { NEXT_ICON, PAUSE_ICON, PLAY_ICON, PREVIOUS_ICON } from '../icons/media-icons';

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
            transition: background-color 0.2s ease;
        }

        .media-button:hover {
            background: rgba(0, 0, 0, 0.5);
        }

        .media-button__icon {
            width: 20px;
            height: 20px;
            filter: invert(1) sepia(0) saturate(0) hue-rotate(0deg) brightness(1.2) contrast(1.2);
        }
    `;

    @state() private _model: MediaPlayerEntity | null = null;

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
        if (this._model === null) {
            return html``;
        }

        const isPlaying = this._model.state === 'playing';
        const playPauseIcon = isPlaying ? PAUSE_ICON : PLAY_ICON;
        const playPauseTitle = isPlaying ? 'Pause' : 'Play';
        const playPauseCommand: 'play' | 'pause' = isPlaying ? 'pause' : 'play';

        return html`
            <div class="media-status">
                <div class="media-info">
                    ${this._model.attributes.media_title ? html`
                        <div class="media-title">${this._model.attributes.media_title}</div>` : ''}
                    ${this._model.attributes.media_artist ? html`
                        <div class="media-artist">${this._model.attributes.media_artist}</div>` : ''}
                </div>
                <div class="media-controls">
                    <button class="media-button" type="button" title="Previous track" @click=${() => this.mediaCommand('previous')}>
                        <img class="media-button__icon" src=${PREVIOUS_ICON} alt="Previous track" />
                    </button>
                    <button class="media-button" type="button" title=${playPauseTitle} @click=${() => this.mediaCommand(playPauseCommand)}>
                        <img class="media-button__icon" src=${playPauseIcon} alt=${playPauseTitle} />
                    </button>
                    <button class="media-button" type="button" title="Next track" @click=${() => this.mediaCommand('next')}>
                        <img class="media-button__icon" src=${NEXT_ICON} alt="Next track" />
                    </button>
                </div>
            </div>
        `;
    }

    private async mediaCommand(command: 'play' | 'pause' | 'next' | 'previous') {
        await mediaPlayerService.mediaCommand(command);
    }
}
