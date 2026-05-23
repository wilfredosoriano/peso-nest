import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface DataPoint {
  label: string;
  value: number;
}

interface SpendingTrendChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  data,
  width = Dimensions.get('window').width - 64,
  height = 120,
}) => {
  if (data.length < 2) return null;

  const padH = 16;
  const padV = 16;
  const chartW = width - padH * 2;
  const chartH = height - padV * 2;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padH + (i / (data.length - 1)) * chartW,
    y: padV + chartH - ((d.value - minVal) / range) * chartH,
    label: d.label,
    value: d.value,
  }));

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const yLabels = [0, Math.round(maxVal / 2), Math.round(maxVal)];

  return (
    <View>
      <Svg width={width} height={height + 20}>
        <Defs>
          <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.25" />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.02" />
          </SvgLinearGradient>
        </Defs>
        {yLabels.map((label) => {
          const y = padV + chartH - ((label - minVal) / range) * chartH;
          return (
            <React.Fragment key={label}>
              <Line x1={padH} y1={y} x2={width - padH} y2={y} stroke={Colors.border} strokeWidth={1} strokeDasharray="4,4" />
            </React.Fragment>
          );
        })}
        <Path d={areaD} fill="url(#areaGrad)" />
        <Path d={pathD} fill="none" stroke={Colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={Colors.primary} stroke="#fff" strokeWidth={2} />
        ))}
      </Svg>
      <View style={styles.xLabels}>
        {points.map((p, i) => (
          <Text key={i} style={[styles.xLabel, { left: p.x - 20, width: 40 }]}>{p.label}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  xLabels: {
    position: 'relative',
    height: 16,
  },
  xLabel: {
    position: 'absolute',
    fontSize: 9,
    color: '#C4A882',
    textAlign: 'center',
  },
});
