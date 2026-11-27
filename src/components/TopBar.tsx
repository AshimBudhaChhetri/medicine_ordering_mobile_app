import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { StockyLogo } from "./StockyLogo";

export function TopBar() {
  return (
    <View style={styles.topBar}>
      <View style={styles.logoCenterContainer} pointerEvents="none">
        <StockyLogo height={26} />
      </View>
      <Pressable
        style={styles.bellButton}
        onPress={() => router.push("/(tabs)/notifications")}
        accessibilityLabel="Notifications"
        hitSlop={8}
      >
        <MaterialCommunityIcons name="bell-outline" size={26} color="#000000" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 2,
    minHeight: 40,
  },
  logoCenterContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  bellButton: {
    padding: 6,
  },
});
