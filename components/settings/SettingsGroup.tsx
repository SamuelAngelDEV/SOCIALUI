import { ReactNode, Children } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Radii, Spacing } from '@/constants/spacing';

type Props = {
  title?: string;
  footer?: string;
  children: ReactNode;
};

/** iOS-style grouped inset card: rounded white container with hairline separators. */
export function SettingsGroup({ title, footer, children }: Props) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.wrapper}>
      {title ? <Text style={styles.title}>{title.toUpperCase()}</Text> : null}
      <View style={styles.card}>
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 ? <View style={styles.separator} /> : null}
            {row}
          </View>
        ))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginLeft: Spacing.lg,
  },
  footer: {
    ...Typography.callout,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
});
