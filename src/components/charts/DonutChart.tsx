import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import { SpendingByCategory } from '../../types';

interface DonutChartProps {
  data: SpendingByCategory[];
  totalSpent: number;
  size?: number;
  strokeWidth?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  totalSpent,
  size = 180,
  strokeWidth = 28,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativePercentage = 0;

  const segments = data.map((item) => {
    const strokeDasharray = (item.percentage / 100) * circumference;
    const strokeDashoffset = circumference - cumulativePercentage * circumference / 100;
    const rotation = (cumulativePercentage / 100) * 360 - 90;
    cumulativePercentage += item.percentage;
    return { ...item, strokeDasharray, strokeDashoffset: circumference - strokeDasharray, rotation, dashOffset: strokeDashoffset };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          {segments.map((seg, i) => {
            const prevPercentage = segments.slice(0, i).reduce((s, x) => s + x.percentage, 0);
            const dashOffset = circumference - (prevPercentage / 100) * circumference;
            return (
              <Circle
                key={seg.category}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${(seg.percentage / 100) * circumference} ${circumference}`}
                strokeDashoffset={dashOffset}
              />
            );
          })}
        </G>
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={styles.totalLabel}>₱{totalSpent.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        <Text style={styles.totalSub}>Total Spent</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A0E00',
    textAlign: 'center',
  },
  totalSub: {
    fontSize: 11,
    color: '#8B6F47',
    marginTop: 2,
  },
});
