import { ReactNode, useEffect, useState } from "react";
import {
  Animated,
  DimensionValue,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { colors } from "../theme/colors";

type SkeletonBlockProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBlock({
  width = "100%",
  height = 12,
  radius = 6,
  style,
}: SkeletonBlockProps) {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.border,
        },
        style,
      ]}
    />
  );
}

export function SkeletonPulse({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const [opacity] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[style, { opacity }]}
    >
      {children}
    </Animated.View>
  );
}

export function OrderCardSkeleton({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonPulse style={[styles.orderCard, style]}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <SkeletonBlock width={92} height={11} />
          <SkeletonBlock width={148} height={14} style={styles.gapTop8} />
        </View>
        <SkeletonBlock width={70} height={24} radius={12} />
      </View>

      <SkeletonBlock height={1} style={styles.orderDivider} />

      <View style={styles.rowBetween}>
        <SkeletonBlock width={118} height={11} />
        <SkeletonBlock width={76} height={11} />
      </View>

      <View style={[styles.rowBetween, styles.gapTop16]}>
        <View>
          <SkeletonBlock width={34} height={10} />
          <SkeletonBlock width={86} height={16} style={styles.gapTop6} />
        </View>
        <SkeletonBlock width={72} height={32} radius={16} />
      </View>
    </SkeletonPulse>
  );
}

export function ProductCardSkeleton() {
  return (
    <SkeletonPulse style={styles.productCard}>
      <View style={styles.rowTop}>
        <SkeletonBlock width={38} height={38} radius={12} />
        <View style={[styles.flex, styles.gapLeft10]}>
          <SkeletonBlock width="72%" height={14} />
          <SkeletonBlock width="48%" height={11} style={styles.gapTop6} />
        </View>
        <SkeletonBlock width={68} height={22} radius={11} />
      </View>

      <SkeletonBlock width="62%" height={10} style={styles.gapTop14} />

      <SkeletonBlock height={1} style={styles.divider} />

      <View style={styles.rowBetween}>
        <View>
          <SkeletonBlock width={84} height={18} />
          <SkeletonBlock width={62} height={10} style={styles.gapTop6} />
        </View>
        <SkeletonBlock width={76} height={32} radius={10} />
      </View>
    </SkeletonPulse>
  );
}

export function StockistRowSkeleton() {
  return (
    <SkeletonPulse style={styles.stockistRow}>
      <SkeletonBlock width={42} height={42} radius={13} />
      <View style={[styles.flex, styles.gapLeft12]}>
        <SkeletonBlock width="58%" height={14} />
        <SkeletonBlock width="40%" height={11} style={styles.gapTop6} />
      </View>
      <SkeletonBlock width={16} height={16} radius={8} />
    </SkeletonPulse>
  );
}

export function StockistCardSkeleton() {
  return (
    <SkeletonPulse style={styles.stockistCard}>
      <View style={styles.rowTop}>
        <SkeletonBlock width={48} height={48} radius={15} />
        <View style={[styles.flex, styles.gapLeft12]}>
          <SkeletonBlock width="64%" height={15} />
          <SkeletonBlock width="46%" height={11} style={styles.gapTop7} />
        </View>
        <SkeletonBlock width={54} height={22} radius={11} />
      </View>

      <View style={styles.stockistMetaRow}>
        <SkeletonBlock width={102} height={11} />
        <SkeletonBlock width={92} height={11} />
      </View>

      <SkeletonBlock height={38} radius={12} style={styles.gapTop14} />
    </SkeletonPulse>
  );
}

export function NotificationRowSkeleton() {
  return (
    <SkeletonPulse style={styles.notificationRow}>
      <SkeletonBlock width={42} height={42} radius={13} />
      <View style={[styles.flex, styles.gapLeft12]}>
        <SkeletonBlock width="66%" height={13} />
        <SkeletonBlock width="92%" height={11} style={styles.gapTop7} />
        <SkeletonBlock width={64} height={9} style={styles.gapTop8} />
      </View>
    </SkeletonPulse>
  );
}

export function StatCardSkeleton() {
  return (
    <SkeletonPulse style={styles.statCard}>
      <SkeletonBlock width={42} height={42} radius={12} />
      <SkeletonBlock width={58} height={26} style={styles.gapTop14} />
      <SkeletonBlock width="78%" height={11} style={styles.gapTop9} />
    </SkeletonPulse>
  );
}

export function PendingStatCardSkeleton() {
  return (
    <SkeletonPulse style={styles.pendingCard}>
      <SkeletonBlock width={80} height={80} radius={40} />
      <View style={styles.pendingRight}>
        <SkeletonBlock width={132} height={17} />
        <SkeletonBlock width={64} height={30} style={styles.gapTop8} />
      </View>
    </SkeletonPulse>
  );
}

export function ListRowSkeleton({
  avatarShape = "circle",
  showTrailing = true,
}: {
  avatarShape?: "circle" | "square";
  showTrailing?: boolean;
}) {
  return (
    <SkeletonPulse style={styles.listRow}>
      <SkeletonBlock
        width={44}
        height={44}
        radius={avatarShape === "circle" ? 22 : 8}
      />
      <View style={[styles.flex, styles.gapLeft12]}>
        <SkeletonBlock width="62%" height={14} />
        <SkeletonBlock width="44%" height={11} style={styles.gapTop6} />
      </View>
      {showTrailing ? (
        <SkeletonBlock width={22} height={22} radius={11} />
      ) : null}
    </SkeletonPulse>
  );
}

export function RegistrationCardSkeleton() {
  return (
    <SkeletonPulse style={styles.registrationCard}>
      <View style={styles.rowTop}>
        <SkeletonBlock width={44} height={44} radius={22} />
        <View style={[styles.flex, styles.gapLeft12]}>
          <SkeletonBlock width="54%" height={15} />
          <SkeletonBlock width="70%" height={11} style={styles.gapTop6} />
          <SkeletonBlock width="40%" height={10} style={styles.gapTop6} />
        </View>
        <SkeletonBlock width={62} height={22} radius={6} />
      </View>
      <SkeletonBlock width="100%" height={40} radius={10} style={styles.gapTop12} />
    </SkeletonPulse>
  );
}

export function DocumentRowSkeleton() {
  return (
    <SkeletonPulse style={styles.documentRow}>
      <SkeletonBlock width={44} height={44} radius={8} />
      <View style={[styles.flex, styles.gapLeft12]}>
        <SkeletonBlock width="74%" height={13} />
        <View style={styles.gapTop7}>
          <SkeletonBlock width={96} height={18} radius={4} />
        </View>
        <SkeletonBlock width="32%" height={9} style={styles.gapTop6} />
      </View>
      <SkeletonBlock width={16} height={16} radius={8} />
    </SkeletonPulse>
  );
}

export function TimelineSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <SkeletonPulse style={styles.timeline}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.timelineRow}>
          <SkeletonBlock width={34} height={34} radius={17} />
          <View style={[styles.flex, styles.gapLeft10]}>
            <View style={styles.rowBetween}>
              <SkeletonBlock width={82} height={11} />
              <SkeletonBlock width={46} height={9} />
            </View>
            <SkeletonBlock width="88%" height={11} style={styles.gapTop8} />
            <SkeletonBlock width="64%" height={11} style={styles.gapTop6} />
          </View>
        </View>
      ))}
    </SkeletonPulse>
  );
}

export function DetailSkeleton() {
  return (
    <SkeletonPulse style={styles.detail}>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <SkeletonBlock width={38} height={38} radius={10} />
          <View style={[styles.gapLeft12]}>
            <SkeletonBlock width={104} height={17} />
            <SkeletonBlock width={72} height={11} style={styles.gapTop6} />
          </View>
        </View>
        <SkeletonBlock width={74} height={26} radius={13} />
      </View>

      <View style={styles.detailCard}>
        <SkeletonBlock width="42%" height={13} />
        <SkeletonBlock height={1} style={styles.divider} />
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={[styles.rowBetween, styles.gapTop12]}>
            <SkeletonBlock width="34%" height={11} />
            <SkeletonBlock width="42%" height={11} />
          </View>
        ))}
      </View>

      <View style={styles.detailCard}>
        <SkeletonBlock width="36%" height={13} />
        <SkeletonBlock height={1} style={styles.divider} />
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={[styles.row, styles.gapTop12]}>
            <SkeletonBlock width={38} height={38} radius={10} />
            <View style={[styles.flex, styles.gapLeft10]}>
              <SkeletonBlock width="56%" height={12} />
              <SkeletonBlock width="32%" height={10} style={styles.gapTop6} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.detailCard}>
        <SkeletonBlock width="30%" height={13} />
        <SkeletonBlock height={1} style={styles.divider} />
        <SkeletonBlock width="100%" height={40} radius={10} style={styles.gapTop8} />
        <SkeletonBlock width="100%" height={40} radius={10} style={styles.gapTop10} />
      </View>
    </SkeletonPulse>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  rowTop: { flexDirection: "row", alignItems: "flex-start" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gapTop6: { marginTop: 6 },
  gapTop7: { marginTop: 7 },
  gapTop8: { marginTop: 8 },
  gapTop9: { marginTop: 9 },
  gapTop10: { marginTop: 10 },
  gapTop12: { marginTop: 12 },
  gapTop14: { marginTop: 14 },
  gapTop16: { marginTop: 16 },
  gapLeft10: { marginLeft: 10 },
  gapLeft12: { marginLeft: 12 },
  divider: { marginVertical: 14, borderRadius: 0 },
  orderCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  orderDivider: { marginVertical: 14, borderRadius: 0 },
  productCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  stockistRow: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stockistCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },
  stockistMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    minHeight: 138,
    flex: 1,
  },
  pendingCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pendingRight: {
    flex: 1,
    alignItems: "flex-end",
    paddingLeft: 16,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  registrationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  documentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  timeline: { paddingTop: 4, gap: 18 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start" },
  detail: { paddingTop: 8 },
  detailCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
});
