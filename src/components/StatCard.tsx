import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  title: string;
  value: number | string;
  icon: any;
  tone?: "blue" | "orange" | "green" | "purple";
};

const tones = {
  blue: {
    background: colors.primarySoft,
    color: colors.primary,
  },

  orange: {
    background: colors.warningSoft,
    color: colors.warning,
  },

  green: {
    background: colors.successSoft,
    color: colors.success,
  },

  purple: {
    background: colors.purpleSoft,
    color: colors.purple,
  },
};

export function StatCard({
  title,
  value,
  icon,
  tone = "blue",
}: Props) {
  const selectedTone = tones[tone];

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: selectedTone.background },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={selectedTone.color}
        />
      </View>

      <Text style={styles.value}>{value}</Text>

      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    minHeight: 138,
    flex: 1,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  value: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },

  title: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});