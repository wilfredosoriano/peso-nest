import { Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');

/**
 * Responsive scale — scales a size proportionally to screen width.
 * Baseline is 390px (iPhone 14 / Pixel 7).
 * Clamps between 0.82× (very small screens) and 1.15× (6.7"–6.9" screens).
 */
export const rs = (n: number): number =>
  Math.round(n * Math.max(0.82, Math.min(SW / 390, 1.15)));
