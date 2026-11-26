import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

interface PendingStatCardProps {
  title?: string;
  value: number | string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
}

export function PendingStatCard({
  title = "Pending Orders",
  value,
  icon = "clock-outline",
  onPress,
  style,
}: PendingStatCardProps) {
  const numericValue =
    typeof value === "number"
      ? value
      : parseInt(String(value), 10) || 0;

  const isZero = numericValue === 0;

  // orange-600 (#EA580C) to orange-400 (#FB923C)
  // gray-400 (#9CA3AF) to gray-200 (#E5E7EB)
  // Right-to-left gradient: start={x: 1, y: 0} -> end={x: 0, y: 0}
  const gradientColors: [string, string] = isZero
    ? ["#9CA3AF", "#E5E7EB"]
    : ["#EA580C", "#FB923C"];

  const CardWrapper = onPress ? Pressable : View;

  return (
    <View
      style={[
        styles.shadowContainer,
        isZero ? styles.shadowZero : styles.shadowActive,
        style,
      ]}
    >
      <CardWrapper
        onPress={onPress}
        style={({ pressed }: { pressed?: boolean }) => [
          styles.innerContainer,
          pressed && styles.pressed,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradient}
        >
          {/* LEFT REGION: ICON */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={icon}
              size={52}
              color="rgba(255,255,255,0.8)"
            />
          </View>

          {/* TOP RIGHT REGION: TITLE & NUMBER BELOW */}
          <View style={styles.rightRegion}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        </LinearGradient>
      </CardWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    borderRadius: 18,
    // Shadow properties as explicitly requested for this component
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    backgroundColor: "transparent",
  },
  shadowActive: {
    shadowColor: "#EA580C",
  },
  shadowZero: {
    shadowColor: "#6B7280",
    shadowOpacity: 0.18,
  },
  innerContainer: {
    borderRadius: 18,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 110,
    borderRadius: 18,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  rightRegion: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "right",
  },
  value: {
    fontSize: 34,
    fontWeight: "500",
    color: "#FFFFFF",
    marginTop: 4,
    textAlign: "right",
  },
});

