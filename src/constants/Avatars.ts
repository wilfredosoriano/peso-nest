export interface AvatarPreset {
  id: string;
  colors: [string, string];
  icon: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: '0',  colors: ['#E97B3B', '#C9621E'], icon: 'leaf' },
  { id: '1',  colors: ['#F44336', '#C62828'], icon: 'heart' },
  { id: '2',  colors: ['#FFC107', '#FF8F00'], icon: 'star' },
  { id: '3',  colors: ['#FF5722', '#BF360C'], icon: 'flame' },
  { id: '4',  colors: ['#673AB7', '#4527A0'], icon: 'moon' },
  { id: '5',  colors: ['#FF9800', '#E65100'], icon: 'sunny' },
  { id: '6',  colors: ['#00BCD4', '#00838F'], icon: 'planet' },
  { id: '7',  colors: ['#2196F3', '#1565C0'], icon: 'water' },
  { id: '8',  colors: ['#795548', '#4E342E'], icon: 'cafe' },
  { id: '9',  colors: ['#E91E63', '#880E4F'], icon: 'musical-notes' },
  { id: '10', colors: ['#3F51B5', '#283593'], icon: 'game-controller' },
  { id: '11', colors: ['#009688', '#00695C'], icon: 'fish' },
  { id: '12', colors: ['#4CAF50', '#2E7D32'], icon: 'flower-outline' },
  { id: '13', colors: ['#607D8B', '#37474F'], icon: 'code-slash' },
  { id: '14', colors: ['#9C27B0', '#6A1B9A'], icon: 'diamond' },
  { id: '15', colors: ['#8BC34A', '#558B2F'], icon: 'rainy' },
];

export const getAvatarPreset = (id?: string): AvatarPreset =>
  AVATAR_PRESETS.find((p) => p.id === id) ?? AVATAR_PRESETS[0];
