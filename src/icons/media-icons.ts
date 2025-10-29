import playIcon from '@tabler/icons/outline/player-play.svg';
import pauseIcon from '@tabler/icons/outline/player-pause.svg';
import nextIcon from '@tabler/icons/outline/player-track-next.svg';
import previousIcon from '@tabler/icons/outline/player-track-prev.svg';

export const MEDIA_ICONS = {
    play: playIcon,
    pause: pauseIcon,
    next: nextIcon,
    previous: previousIcon
} as const;

export type MediaIconKey = keyof typeof MEDIA_ICONS;

export const getMediaIcon = (key: MediaIconKey) => MEDIA_ICONS[key];

export const PLAY_ICON = MEDIA_ICONS.play;
export const PAUSE_ICON = MEDIA_ICONS.pause;
export const NEXT_ICON = MEDIA_ICONS.next;
export const PREVIOUS_ICON = MEDIA_ICONS.previous;
