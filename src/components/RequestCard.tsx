import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  id: string;
  stockist: string;
  items: number;
  date: string;
  status: string;
};

const getStatusStyle = (status: string) => {
  const norm = status?.toLowerCase();

  if (norm === "approved" || norm === "completed") {
    return {
      label: "Approved",
      backgroundColor: colors.successSoft,
      color: colors.success,
    };
  }

  if (norm === "rejected" || norm === "cancelled") {
    return {
      label: "Rejected",
      backgroundColor: colors.dangerSoft,
      color: colors.danger,
    };
  }

  if (norm === "processing") {
    return {
      label: "Processing",
      backgroundColor: colors.primarySoft,
      color: colors.primary,
    };
  }

  return {
    label: "Pending",
    backgroundColor: colors.warningSoft,
    color: colors.warning,
  };
};

export function RequestCard({ id, stockist, items, date, status }: Props) {
  const statusStyle = getStatusStyle(status);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.headerInfo}>
          <Text style={styles.requestId}>{id}</Text>
          <Text style={styles.stockist}>{stockist}</Text>
        </View>

        <View
          style={[
            styles.status,
            { backgroundColor: statusStyle.backgroundColor },
          ]}
        >
          <Text
            style={[styles.statusText, { color: statusStyle.color }]}
          >
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.meta}>{items} items</Text>
        <Text style={styles.meta}>{date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  requestId: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  stockist: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
    marginTop: 4,
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "400",
  },
});
