import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { classMap } from 'lit/directives/class-map.js';
import { CameraEntity } from '../intergrations/home-assistant/home-assistant.types';
import { homeAssistant, homeAssistantApi } from '../state';

interface CameraOption {
    id: string;
    entity: CameraEntity;
}

@customElement('camera-view')
export class CameraView extends LitElement {
    private static readonly FRONT_DOOR_CAMERA_ID = 'camera.front_door';

    public static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            position: fixed;
            inset: 0;
            background: #000;
            color: #fff;
        }

        .camera-container {
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
        }

        .stream {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .camera-selector {
            position: absolute;
            top: 32px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            background: rgba(0, 0, 0, 0.55);
            padding: 12px 18px;
            border-radius: 999px;
            backdrop-filter: blur(12px);
        }

        .camera-selector__button {
            background: rgba(255, 255, 255, 0.12);
            color: inherit;
            border: none;
            border-radius: 999px;
            padding: 8px 16px;
            cursor: pointer;
            transition: background 0.2s ease, color 0.2s ease;
            font-size: 0.95rem;
        }

        .camera-selector__button:hover {
            background: rgba(255, 255, 255, 0.25);
        }

        .camera-selector__button--active {
            background: #fff;
            color: #000;
        }

        .empty-state {
            display: grid;
            place-items: center;
            width: 100%;
            height: 100%;
            text-align: center;
            padding: 24px;
        }

        .empty-state__title {
            font-size: 1.5rem;
            margin-bottom: 8px;
        }

        .empty-state__subtitle {
            opacity: 0.75;
        }
    `;

    @state() private _cameras: CameraOption[] = [];
    @state() private _selectedCameraId: string | null = null;
    @state() private _cacheBuster = Date.now();
    @state() private _currentAccessToken: string | null = null;

    private _selectedCameraSubscription: Subscription | null = null;
    private _snapshotPollTimer: number | null = null;

    public async connectedCallback(): Promise<void> {
        super.connectedCallback();

        try {
            // const states = await homeAssistant.getStates();
            const states: any[] = [];
            const cameraEntries: CameraOption[] = states
                .filter((s: any) => typeof s?.entity_id === 'string' && s.entity_id.startsWith('camera.'))
                .map((s: any) => ({ id: s.entity_id as string, entity: s as CameraEntity }));

            this._cameras = cameraEntries.sort((a, b) => {
                const nameA = a.entity?.attributes?.friendly_name ?? a.id;
                const nameB = b.entity?.attributes?.friendly_name ?? b.id;
                return nameA.localeCompare(nameB);
            });

            const hasSelected = this._selectedCameraId
                ? this._cameras.some((camera) => camera.id === this._selectedCameraId)
                : false;

            if (!this._selectedCameraId || !hasSelected) {
                const frontDoor = this._cameras.find((camera) => camera.id === CameraView.FRONT_DOOR_CAMERA_ID);
                this._selectedCameraId = frontDoor?.id ?? this._cameras[0]?.id ?? null;
            }

            const selectedCamera = this._getSelectedCamera();
            const nextToken = selectedCamera?.entity?.attributes?.access_token ?? null;
            if (nextToken !== this._currentAccessToken) {
                this._currentAccessToken = nextToken;
                this._cacheBuster = Date.now();
            }

            this._syncSnapshotPolling(selectedCamera);
            this._subscribeToSelectedCamera();
        } catch (e) {
            console.error('Failed to load camera states', e);
        }
    }

    public disconnectedCallback(): void {
        this._selectedCameraSubscription?.unsubscribe();
        this._selectedCameraSubscription = null;
        this._stopSnapshotPolling();
        super.disconnectedCallback();
    }

    public render() {
        const selectedCamera = this._getSelectedCamera();

        if (!selectedCamera) {
            return html`
                <div class="empty-state">
                    <div>
                        <div class="empty-state__title">No cameras available</div>
                        <div class="empty-state__subtitle">
                            Connect Home Assistant camera entities to view a live feed.
                        </div>
                    </div>
                </div>
            `;
        }

        const supportsStream = this._supportsStream(selectedCamera);
        const imageUrl = supportsStream
            ? this._buildStreamUrl(selectedCamera)
            : this._buildSnapshotUrl(selectedCamera);

        return html`
            <div class="camera-container">
                ${imageUrl ? html`
                    <img class="stream" src=${imageUrl} alt="Camera feed"/>
                ` : html`
                    <div class="empty-state">
                        <div>
                            <div class="empty-state__title">Unable to load camera stream</div>
                            <div class="empty-state__subtitle">
                                Please verify the Home Assistant configuration and camera access permissions.
                            </div>
                        </div>
                    </div>
                `}
                ${this._cameras.length > 1 ? html`
                    <div class="camera-selector">
                        ${this._cameras.map((camera) => {
                            const buttonClasses = {
                                'camera-selector__button': true,
                                'camera-selector__button--active': camera.id === this._selectedCameraId
                            };

                            return html`
                                <button
                                    class=${classMap(buttonClasses)}
                                    type="button"
                                    @click=${() => this._handleCameraChange(camera.id)}
                                >
                                    ${camera.entity.attributes?.friendly_name ?? camera.id}
                                </button>
                            `;
                        })}
                    </div>
                ` : ''}
            </div>
        `;
    }

    private _handleCameraChange(cameraId: string): void {
        if (cameraId === this._selectedCameraId) {
            return;
        }
        this._selectedCameraId = cameraId;

        const selectedCamera = this._cameras.find((camera) => camera.id === cameraId) ?? null;
        this._currentAccessToken = selectedCamera?.entity?.attributes?.access_token ?? null;
        this._cacheBuster = Date.now();
        this._syncSnapshotPolling(selectedCamera);
        this._subscribeToSelectedCamera();
    }

    private _buildStreamUrl(camera: CameraOption): string | null {
        const accessToken = camera.entity?.attributes?.access_token;
        if (!accessToken) {
            return null;
        }

        try {
            const url = new URL(`api/camera_proxy_stream/${camera.id}`, homeAssistantApi.getBaseUrl());
            url.searchParams.set('token', accessToken);
            url.searchParams.set('cache', String(this._cacheBuster));
            return url.toString();
        } catch (error) {
            console.warn('Failed to build stream URL for camera', camera.id, error);
            return null;
        }
    }

    private _buildSnapshotUrl(camera: CameraOption): string | null {
        const picture = camera.entity?.attributes?.entity_picture;
        if (!picture) {
            return null;
        }

        try {
            const url = new URL(picture, homeAssistantApi.getBaseUrl());
            url.searchParams.set('cache', String(this._cacheBuster));
            return url.toString();
        } catch (error) {
            console.warn('Failed to build snapshot URL for camera', camera.id, error);
            return null;
        }
    }

    private _supportsStream(camera: CameraOption | null): boolean {
        if (!camera) {
            return false;
        }
        const attributes = camera.entity?.attributes ?? {};
        return Boolean(attributes.frontend_stream_type || attributes.fps);
    }

    private _getSelectedCamera(): CameraOption | null {
        return this._selectedCameraId
            ? this._cameras.find((camera) => camera.id === this._selectedCameraId) ?? null
            : null;
    }

    private _syncSnapshotPolling(camera: CameraOption | null): void {
        if (!camera) {
            this._stopSnapshotPolling();
            return;
        }

        if (this._supportsStream(camera)) {
            this._stopSnapshotPolling();
            return;
        }

        this._startSnapshotPolling();
    }

    private _startSnapshotPolling(): void {
        if (this._snapshotPollTimer !== null) {
            return;
        }
        this._snapshotPollTimer = window.setInterval(() => {
            this._cacheBuster = Date.now();
        }, 1000);
    }

    private _stopSnapshotPolling(): void {
        if (this._snapshotPollTimer !== null) {
            clearInterval(this._snapshotPollTimer);
            this._snapshotPollTimer = null;
        }
    }

    private _subscribeToSelectedCamera(): void {
        this._selectedCameraSubscription?.unsubscribe();
        this._selectedCameraSubscription = null;

        const selected = this._getSelectedCamera();
        if (!selected) return;

        this._selectedCameraSubscription = homeAssistant
            .entity$<CameraEntity>(selected.id)
            .subscribe((entity) => {
                if (!entity) return;
                // Update the entry in _cameras for the selected id
                this._cameras = this._cameras.map((c) => c.id === selected.id ? { ...c, entity } : c);

                const nextToken = entity?.attributes?.access_token ?? null;
                if (nextToken !== this._currentAccessToken) {
                    this._currentAccessToken = nextToken;
                    this._cacheBuster = Date.now();
                }
            });
    }
}
