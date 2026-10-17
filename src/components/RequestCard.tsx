import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type RequestStatus = "PENDING" | "PROCESSING" | "COMPLETED";

type Props = {
  id: string;
  stockist: string;
  items: number;
  date: string;
  status: RequestStatus;
};

const statusConfig = {
  PENDING: {
    label: "Pending",
    backgroundColor: colors.warningSoft,
    color: colors.warning,
  },

  PROCESSING: {
    label: "Processing",
    backgroundColor: colors.primarySoft,
    color: colors.primary,
  },

  COMPLETED: {
    label: "Completed",
    backgroundColor: colors.successSoft,
    color: colors.success,
  },
};

export function RequestCard({
  id,
  stockist,
  items,
  date,
  status,
}: Props) {
  const statusStyle = statusConfig[status];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
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
            style={[
              styles.statusText,
              { color: statusStyle.color },
            ]}
          >
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.meta}>{items} medicines</Text>
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
    gap: 12,
  },

  requestId: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "700",
  },

  stockist: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
    marginTop: 4,
  },

  status: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});