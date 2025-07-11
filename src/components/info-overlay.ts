import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { PhotoPrismPhoto } from '../types/photoprism.types';

@customElement('info-overlay')
export class InfoOverlay extends LitElement {
  @property({ type: Object }) photo: PhotoPrismPhoto | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .info-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      color: var(--primary-color, #ffffff);
      padding: 20px;
      z-index: 3;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      backdrop-filter: blur(5px);
    }

    .photo-info {
      flex: 1;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    .photo-location {
      font-size: 1.2rem;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .photo-date {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-bottom: 3px;
    }

    .photo-title {
      font-size: 1rem;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .info-overlay {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    @media (max-width: 480px) {
      .photo-location {
        font-size: 1rem;
      }
    }
  `;

  // Format a date from ISO string
  private formatPhotoDate(isoDate: string): string {
    if (!isoDate) return '';

    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  // Get location string from photo
  private getPhotoLocation(photo: PhotoPrismPhoto | null): string {
    if (!photo) return '';

    // In a real app, you would use a reverse geocoding service
    // to get the location name from the coordinates
    if (photo.Lat && photo.Lng) {
      return `${photo.Lat.toFixed(4)}, ${photo.Lng.toFixed(4)}`;
    }

    return photo.PlaceID || 'Unknown Location';
  }

  render() {
    return html`
      <div class="info-overlay">
        <div class="photo-info">
          ${this.photo ? html`
            <div class="photo-location">${this.getPhotoLocation(this.photo)}</div>
            <div class="photo-date">${this.formatPhotoDate(this.photo.TakenAtLocal)}</div>
            ${this.photo.Title ? html`<div class="photo-title">${this.photo.Title}</div>` : ''}
          ` : ''}
        </div>
        <slot></slot>
      </div>
    `;
  }
}