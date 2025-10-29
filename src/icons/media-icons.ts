import playIcon from '@tabler/icons/outline/player-play.svg';
import pauseIcon from '@tabler/icons/outline/player-pause.svg';
import nextIcon from '@tabler/icons/outline/player-track-next.svg';
import previousIcon from '@tabler/icons/outline/player-track-prev.svg';
import volumeUpIcon from '@tabler/icons/outline/volume-2.svg';
import volumeDownIcon from '@tabler/icons/outline/volume.svg';
import musicIcon from '@tabler/icons/outline/music.svg';
import shuffleIcon from '@tabler/icons/outline/arrows-shuffle.svg';
import spotifyIcon from '@tabler/icons/outline/brand-spotify.svg';

export const MEDIA_ICONS = {
    play: playIcon,
    pause: pauseIcon,
    next: nextIcon,
    previous: previousIcon,
    volumeUp: volumeUpIcon,
    volumeDown: volumeDownIcon,
    music: musicIcon,
    shuffle: shuffleIcon,
    spotify: spotifyIcon
} as const;

export type MediaIconKey = keyof typeof MEDIA_ICONS;

export const getMediaIcon = (key: MediaIconKey) => MEDIA_ICONS[key];

export const PLAY_ICON = MEDIA_ICONS.play;
export const PAUSE_ICON = MEDIA_ICONS.pause;
export const NEXT_ICON = MEDIA_ICONS.next;
export const PREVIOUS_ICON = MEDIA_ICONS.previous;
export const VOLUME_UP_ICON = MEDIA_ICONS.volumeUp;
export const VOLUME_DOWN_ICON = MEDIA_ICONS.volumeDown;
export const MUSIC_ICON = MEDIA_ICONS.music;
export const SHUFFLE_ICON = MEDIA_ICONS.shuffle;
export const SPOTIFY_ICON = MEDIA_ICONS.spotify;
