import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Sizes, Fonts } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface DataPoint {
  date: string;
  value: number;
}

interface ProgressChartProps {
  data: DataPoint[];
  title: string;
  unit: string;
  color?: string;
}

export default function ProgressChart({ 
  data, 
  title, 
  unit, 
  color = Colors.primary 
}: ProgressChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const chartWidth = width - 64;
  const chartHeight = 150;
  
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
    return { x, y, value: point.value };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                { top: ratio * chartHeight }
              ]}
            />
          ))}
          
          {/* Data points and line */}
          {points.map((point, index) => (
            <View key={index}>
              {/* Line to next point */}
              {index < points.length - 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      left: point.x,
                      top: point.y,
                      width: Math.sqrt(
                        Math.pow(points[index + 1].x - point.x, 2) +
                        Math.pow(points[index + 1].y - point.y, 2)
                      ),
                      transform: [{
                        rotate: `${Math.atan2(
                          points[index + 1].y - point.y,
                          points[index + 1].x - point.x
                        )}rad`
                      }]
                    },
                    { backgroundColor: color }
                  ]}
                />
              )}
              
              {/* Data point */}
              <View
                style={[
                  styles.point,
                  {
                    left: point.x - 4,
                    top: point.y - 4,
                    backgroundColor: color,
                  }
                ]}
              />
            </View>
          ))}
        </View>
        
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{maxValue.toFixed(1)}{unit}</Text>
          <Text style={styles.axisLabel}>{minValue.toFixed(1)}{unit}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.borderRadius,
    padding: Sizes.md,
    marginVertical: Sizes.sm,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Sizes.md,
  },
  chartContainer: {
    position: 'relative',
  },
  chart: {
    position: 'relative',
    backgroundColor: '#F8F9FA',
    borderRadius: Sizes.sm,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E9ECEF',
  },
  line: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  yAxis: {
    position: 'absolute',
    right: -40,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  axisLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
});