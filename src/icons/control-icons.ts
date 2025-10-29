import bulbIcon from '@tabler/icons/outline/bulb.svg';
import vacuumIcon from '@tabler/icons/outline/vacuum-cleaner.svg';
import tvIcon from '@tabler/icons/outline/device-tv.svg';

export const CONTROL_ICONS = {
    light: bulbIcon,
    vacuum: vacuumIcon,
    tv: tvIcon
} as const;

export type ControlIconKey = keyof typeof CONTROL_ICONS;

export const getControlIcon = (key: ControlIconKey) => CONTROL_ICONS[key];

export const LIGHT_ICON = CONTROL_ICONS.light;
export const VACUUM_ICON = CONTROL_ICONS.vacuum;
export const TV_ICON = CONTROL_ICONS.tv;
