import { css, html, LitElement } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { customElement, state } from 'lit/decorators.js';
import { mediaPlayerService } from "../state";
import type { MediaPlayerViewModel } from '../services/media.service';
import { Subscription } from 'rxjs';
import {
    MUSIC_ICON,
    NEXT_ICON,
    PAUSE_ICON,
    PLAY_ICON,
    PREVIOUS_ICON,
    SHUFFLE_ICON,
    SPOTIFY_ICON,
    VOLUME_UP_ICON
} from '../icons/media-icons';

@customElement('media-player')
export class MediaPlayer extends LitElement {

    public static styles = css`
        :host {
            display: block;
            color: var(--primary-color, #ffffff);
        }

        .media-status {
            position: relative;
            padding: 24px;
            border-radius: 18px;
            margin-top: auto;
            overflow: hidden;
            background: rgba(15, 15, 15, 0.6);
            isolation: isolate;
            transition: background 0.3s ease;
        }

        .media-status::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: var(--media-artwork, none);
            background-size: cover;
            background-position: center;
            filter: blur(4px);
            transform: scale(1.1);
            transition: opacity 0.3s ease;
            z-index: -2;
        }

        .media-status::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.25));
            z-index: -1;
        }

        .media-status:not(.media-status--with-artwork)::before {
            opacity: 0;
        }

        .media-status__content {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 18px;
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
            flex-wrap: wrap;
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

        .media-idle {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }

        .media-button--primary {
            width: 64px;
            height: 64px;
        }

        .media-idle__label {
            font-size: 1rem;
            opacity: 0.8;
        }

        .media-button--active {
            background: rgba(255, 255, 255, 0.85);
            color: #000;
        }

        .media-button--active .media-button__icon {
            filter: invert(0) sepia(0) saturate(0) hue-rotate(0deg) brightness(0) contrast(1);
        }

        .media-device {
            font-size: 0.85rem;
            opacity: 0.65;
        }

        .media-volume {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px;
            border-radius: 999px;
            background: rgba(0, 0, 0, 0.35);
            flex: 1 1 100%;
            justify-content: center;
            min-width: 220px;
        }

        .media-volume__slider {
            width: 160px;
            accent-color: var(--primary-color, #ffffff);
        }

        .media-volume__value {
            font-size: 0.9rem;
            opacity: 0.8;
        }
    `;

    @state() private _viewModel: MediaPlayerViewModel | null = null;
    @state() private _showVolumeSlider = false;
    @state() private _volumeSliderValue: number | null = null;
    private _subscription: Subscription | null = null;

    public connectedCallback() {
        super.connectedCallback();

        this._subscription = mediaPlayerService.viewModel$.subscribe((viewModel) => {
            this._viewModel = viewModel;
            if (!this._showVolumeSlider) {
                this._volumeSliderValue = null;
            }
        });
    }

    public disconnectedCallback() {
        this._subscription?.unsubscribe();
        this._subscription = null;
        super.disconnectedCallback();
    }

    public  render() {
        const viewModel = this._viewModel;

        if (!viewModel) {
            return html``;
        }

        const {
            isPlaying,
            isIdle,
            deviceName,
            shuffleOn,
            volumePercent,
            artworkUrl,
            mediaTitle,
            mediaArtist
        } = viewModel;
        const playPauseIcon = isPlaying ? PAUSE_ICON : PLAY_ICON;
        const playPauseTitle = isPlaying ? 'Pause' : 'Play';
        const volumeLevel = Math.round(this._volumeSliderValue ?? volumePercent);

        const mediaStatusClasses = classMap({
            'media-status': true,
            'media-status--with-artwork': Boolean(artworkUrl)
        });
        const mediaStatusStyles = artworkUrl ? {
            '--media-artwork': `url("${artworkUrl}")`
        } : {};

        return html`
            <div class=${mediaStatusClasses} style=${styleMap(mediaStatusStyles)}>
                <div class="media-status__content">
                    ${!isIdle ? html`
                        <div class="media-info">
                        ${mediaTitle ? html`
                            <div class="media-title">${mediaTitle}</div>` : ''}
                        ${mediaArtist ? html`
                            <div class="media-artist">${mediaArtist}</div>` : ''}
                        <div class="media-device">Playing on ${deviceName}</div>
                        </div>
                    ` : html`
                        <div class="media-info">
                            <div class="media-title">No music playing</div>
                            <div class="media-artist">Tap to start the kitchen speaker</div>
                        </div>
                    `}
                    ${isIdle ? html`
                        <div class="media-controls media-idle">
                            <button
                                class="media-button media-button--primary"
                                type="button"
                                title="Play kitchen music"
                                @click=${() => mediaPlayerService.startKitchenMusic()}
                            >
                                <img class="media-button__icon" src=${MUSIC_ICON} alt="Play kitchen music" />
                            </button>
                            <div class="media-idle__label">Play kitchen music</div>
                        </div>
                    ` : html`
                        <div class="media-controls">
                            <button
                                class=${classMap({
                                    'media-button': true,
                                    'media-button--active': this._showVolumeSlider
                                })}
                                type="button"
                                title="Adjust volume"
                                @click=${this._toggleVolumeSlider}
                            >
                                <img class="media-button__icon" src=${VOLUME_UP_ICON} alt="Adjust volume" />
                            </button>
                            ${this._showVolumeSlider ? html`
                                <div class="media-volume">
                                    <input
                                        class="media-volume__slider"
                                        type="range"
                                        min="0"
                                        max="100"
                                        .value=${String(volumeLevel)}
                                        @input=${this._handleVolumeInput}
                                    />
                                    <span class="media-volume__value">${volumeLevel}%</span>
                                </div>
                            ` : ''}
                            <button class="media-button" type="button" title="Previous track" @click=${() => mediaPlayerService.previousTrack()}>
                                <img class="media-button__icon" src=${PREVIOUS_ICON} alt="Previous track" />
                            </button>
                            <button class="media-button" type="button" title=${playPauseTitle} @click=${() => mediaPlayerService.togglePlay(isPlaying)}>
                                <img class="media-button__icon" src=${playPauseIcon} alt=${playPauseTitle} />
                            </button>
                            <button class="media-button" type="button" title="Next track" @click=${() => mediaPlayerService.nextTrack()}>
                                <img class="media-button__icon" src=${NEXT_ICON} alt="Next track" />
                            </button>
                            <button
                                class=${classMap({
                                    'media-button': true,
                                    'media-button--active': shuffleOn
                                })}
                                type="button"
                                title=${shuffleOn ? 'Disable shuffle' : 'Enable shuffle'}
                                @click=${() => mediaPlayerService.setShuffleState(!shuffleOn)}
                            >
                                <img class="media-button__icon" src=${SHUFFLE_ICON} alt="Toggle shuffle" />
                            </button>
                            <button class="media-button" type="button" title="Open music player" @click=${() => mediaPlayerService.openMusicPlayer()}>
                                <img class="media-button__icon" src=${SPOTIFY_ICON} alt="Open music player" />
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    private _toggleVolumeSlider = (): void => {
        this._showVolumeSlider = !this._showVolumeSlider;
        if (this._showVolumeSlider) {
            this._volumeSliderValue = this._viewModel?.volumePercent ?? 0;
        }
    };

    private async _handleVolumeInput(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const value = Number(input.value);
        if (Number.isNaN(value)) {
            return;
        }
        this._volumeSliderValue = value;
        await mediaPlayerService.setVolumePercent(value);
    }
}
