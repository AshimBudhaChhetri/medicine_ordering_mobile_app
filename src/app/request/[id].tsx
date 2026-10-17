import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  RequestStatus,
  useRequests,
} from "../../context/RequestContext";

import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { requests } = useRequests();

  const {
    gutter,
    contentMaxWidth,
  } = useResponsive();

  const request = requests.find(
    (item) => item.id === id
  );

  if (!request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>
            Request not found
          </Text>

          <Pressable
            style={styles.backSimpleButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backSimpleText}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: gutter,
          },
        ]}
      >
        <View
          style={[
            styles.container,
            contentMaxWidth
              ? {
                  width: "100%",
                  maxWidth: 900,
                  alignSelf: "center",
                }
              : undefined,
          ]}
        >
          {/* Header */}

          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={23}
                color={colors.text}
              />
            </Pressable>

            <View style={styles.headerContent}>
              <Text style={styles.pageTitle}>
                Request Details
              </Text>

              <Text style={styles.requestNumber}>
                {request.requestNumber}
              </Text>
            </View>

            <StatusBadge
              status={request.status}
            />
          </View>

          {/* Stockist */}

          <View style={styles.stockistCard}>
            <View style={styles.stockistIcon}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={26}
                color={colors.primary}
              />
            </View>

            <View style={styles.stockistInfo}>
              <Text style={styles.label}>
                STOCKIST
              </Text>

              <Text style={styles.stockistName}>
                {request.stockistName}
              </Text>
            </View>
          </View>

          {/* Request Information */}

          <Text style={styles.sectionTitle}>
            Request Information
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="calendar-outline"
              label="Date Submitted"
              value={request.createdAt}
            />

            <View style={styles.divider} />

            <InfoRow
              icon="pill"
              label="Total Medicines"
              value={`${request.totalItems} items`}
            />

            <View style={styles.divider} />

            <InfoRow
              icon="cash"
              label="Total Amount"
              value={`Rs. ${request.totalAmount.toFixed(
                2
              )}`}
            />
          </View>

          {/* Medicines */}

          <Text style={styles.sectionTitle}>
            Requested Medicines
          </Text>

          <View style={styles.medicineCard}>
            {request.items.map(
              (item, index) => (
                <View key={item.medicineId}>
                  <View
                    style={styles.medicineRow}
                  >
                    <View
                      style={
                        styles.medicineIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="pill"
                        size={20}
                        color={colors.primary}
                      />
                    </View>

                    <View
                      style={
                        styles.medicineInfo
                      }
                    >
                      <Text
                        style={
                          styles.medicineName
                        }
                      >
                        {item.medicineName}
                      </Text>

                      <Text
                        style={
                          styles.medicineMeta
                        }
                      >
                        {item.quantity} × Rs.{" "}
                        {item.unitPrice.toFixed(
                          2
                        )}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.medicineAmount
                      }
                    >
                      Rs.{" "}
                      {item.subtotal.toFixed(2)}
                    </Text>
                  </View>

                  {index <
                    request.items.length -
                      1 && (
                    <View
                      style={
                        styles.divider
                      }
                    />
                  )}
                </View>
              )
            )}
          </View>

          {/* Total */}

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>
              Total Amount
            </Text>

            <Text style={styles.totalValue}>
              Rs.{" "}
              {request.totalAmount.toFixed(2)}
            </Text>
          </View>

          {/* Note */}

          {request.note && (
            <>
              <Text style={styles.sectionTitle}>
                Additional Note
              </Text>

              <View style={styles.noteCard}>
                <MaterialCommunityIcons
                  name="note-text-outline"
                  size={21}
                  color={colors.primary}
                />

                <Text style={styles.noteText}>
                  {request.note}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: RequestStatus;
}) {
  const config = {
    PENDING: {
      text: "Pending",
      background: colors.warningSoft,
      color: colors.warning,
    },

    PROCESSING: {
      text: "Processing",
      background: colors.primarySoft,
      color: colors.primary,
    },

    COMPLETED: {
      text: "Completed",
      background: colors.successSoft,
      color: colors.success,
    },

    CANCELLED: {
      text: "Cancelled",
      background: colors.dangerSoft,
      color: colors.danger,
    },
  };

  const item = config[status];

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            item.background,
        },
      ]}
    >
      <Text
        style={[
          styles.statusText,
          {
            color: item.color,
          },
        ]}
      >
        {item.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    paddingTop: 8,
    paddingBottom: 60,
  },

  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerContent: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: colors.text,
  },

  requestNumber: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },

  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  stockistCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  stockistIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  stockistInfo: {
    marginLeft: 12,
  },

  label: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textSecondary,
  },

  stockistName: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },

  sectionTitle: {
    marginTop: 27,
    marginBottom: 11,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },

  infoCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 15,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },

  infoValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  medicineCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 15,
  },

  medicineRow: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  medicineIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  medicineInfo: {
    flex: 1,
    marginLeft: 11,
  },

  medicineName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },

  medicineMeta: {
    marginTop: 3,
    fontSize: 10,
    color: colors.textSecondary,
  },

  medicineAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },

  totalCard: {
    marginTop: 14,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },

  totalValue: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.primary,
  },

  noteCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  notFoundTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },

  backSimpleButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },

  backSimpleText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});