import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type Status = "PENDING" | "REJECTED";

type Props = {
  name: string;
  location: string;
  submittedDate: string;
  status: Status;
  rejectionReason?: string;
};

export function StockistApprovalCard({
  name,
  location,
  submittedDate,
  status,
  rejectionReason,
}: Props) {
  const isPending = status === "PENDING";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isPending
                ? colors.warningSoft
                : colors.dangerSoft,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={
              isPending
                ? "clock-outline"
                : "close-circle-outline"
            }
            size={23}
            color={isPending ? colors.warning : colors.danger}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>

          <Text style={styles.location}>{location}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isPending
                ? colors.warningSoft
                : colors.dangerSoft,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: isPending
                  ? colors.warning
                  : colors.danger,
              },
            ]}
          >
            {isPending ? "Pending Approval" : "Rejected"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.submitted}>
        Submitted {submittedDate}
      </Text>

      {!isPending && rejectionReason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionTitle}>
            Admin reason
          </Text>

          <Text style={styles.rejectionText}>
            {rejectionReason}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: 18,

    padding: 16,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },

  iconContainer: {
    width: 46,
    height: 46,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },

  location: {
    marginTop: 3,

    fontSize: 12,
    color: colors.textSecondary,
  },

  statusBadge: {
    borderRadius: 20,

    paddingVertical: 6,
    paddingHorizontal: 9,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,

    marginVertical: 14,
  },

  submitted: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  rejectionBox: {
    marginTop: 12,

    backgroundColor: colors.dangerSoft,

    borderRadius: 12,

    padding: 12,
  },

  rejectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.danger,
  },

  rejectionText: {
    marginTop: 4,

    fontSize: 12,
    lineHeight: 18,

    color: colors.text,
  },
});