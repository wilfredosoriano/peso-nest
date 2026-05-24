import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const AVATAR_IMAGES: Record<string, any> = {
  'avatar-1':  require('../../../assets/images/avatars/avatar-1.png'),
  'avatar-2':  require('../../../assets/images/avatars/avatar-2.png'),
  'avatar-3':  require('../../../assets/images/avatars/avatar-3.png'),
  'avatar-4':  require('../../../assets/images/avatars/avatar-4.png'),
  'avatar-5':  require('../../../assets/images/avatars/avatar-5.png'),
  'avatar-6':  require('../../../assets/images/avatars/avatar-6.png'),
  'avatar-7':  require('../../../assets/images/avatars/avatar-7.png'),
  'avatar-8':  require('../../../assets/images/avatars/avatar-8.png'),
  'avatar-9':  require('../../../assets/images/avatars/avatar-9.png'),
  'avatar-10': require('../../../assets/images/avatars/avatar-10.png'),
};

interface UserAvatarProps {
  avatarStyle?: string;
  name?: string;
  size?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ avatarStyle, name, size = 44 }) => {
  const img = avatarStyle ? AVATAR_IMAGES[avatarStyle] : null;
  const fontSize = Math.round(size * 0.42);

  if (img) {
    return (
      <View style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image source={img} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
      </View>
    );
  }

  // Fallback: initials on gradient
  return (
    <LinearGradient
      colors={['#E97B3B', '#C9621E']}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.initial, { fontSize }]}>{(name || 'U')[0].toUpperCase()}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  base:    { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { color: '#fff', fontFamily: 'Cause-ExtraBold' },
});
