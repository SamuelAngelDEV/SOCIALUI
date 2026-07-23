import { ReactNode, Children } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

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
    marginBottom: 24,
  },
  title: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: 8,
    marginLeft: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginLeft: 16,
  },
  footer: {
    ...Typography.callout,
    color: Colors.textTertiary,
    marginTop: 8,
    marginHorizontal: 16,
  },
});
