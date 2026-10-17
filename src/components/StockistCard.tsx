import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  name: string;
  location: string;
};

export function StockistCard({ name, location }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <MaterialCommunityIcons
          name="storefront-outline"
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.location}>{location}</Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 10,
  },

  icon: {
    height: 42,
    width: 42,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,

    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
});