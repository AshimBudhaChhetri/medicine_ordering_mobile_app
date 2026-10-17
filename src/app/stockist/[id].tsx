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

import { useStockists } from "../../context/StockistContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

export default function StockistDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { approvedStockists } = useStockists();

  const { gutter, contentMaxWidth } = useResponsive();

  const stockist = approvedStockists.find(
    (item) => item.id === id
  );

  if (!stockist) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>
            Stockist not found
          </Text>

          <Pressable
            style={styles.backButtonSimple}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
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
                  maxWidth: 900,
                  width: "100%",
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

            <Text style={styles.pageTitle}>
              Stockist Details
            </Text>
          </View>

          {/* Main Stockist Card */}

          <View style={styles.mainCard}>
            <View style={styles.stockistHeader}>
              <View style={styles.stockistIcon}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <View style={styles.stockistInfo}>
                <Text style={styles.stockistName}>
                  {stockist.name}
                </Text>

                <Text style={styles.location}>
                  {stockist.location}
                </Text>
              </View>

              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>
                  Active
                </Text>
              </View>
            </View>
          </View>

          {/* Business Information */}

          <Text style={styles.sectionTitle}>
            Stockist Information
          </Text>

          <View style={styles.detailsCard}>
            <DetailRow
              icon="account-outline"
              label="Contact Person"
              value={stockist.contactPerson}
            />

            <View style={styles.divider} />

            <DetailRow
              icon="phone-outline"
              label="Phone"
              value={stockist.phone}
            />

            <View style={styles.divider} />

            <DetailRow
              icon="map-marker-outline"
              label="Area"
              value={stockist.location}
            />
          </View>

          {/* Request Summary */}

          <Text style={styles.sectionTitle}>
            Medicine Requests
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                12
              </Text>

              <Text style={styles.summaryLabel}>
                Total Requests
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                2
              </Text>

              <Text style={styles.summaryLabel}>
                Pending
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                8
              </Text>

              <Text style={styles.summaryLabel}>
                Completed
              </Text>
            </View>
          </View>

          {/* Recent Requests */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleNoMargin}>
              Recent Requests
            </Text>

            <Text style={styles.viewAll}>
              View all
            </Text>
          </View>

          <View style={styles.requestCard}>
            <View>
              <Text style={styles.requestId}>
                REQ-1024
              </Text>

              <Text style={styles.requestMeta}>
                8 medicines • 03 Oct 2026
              </Text>
            </View>

            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>
                Pending
              </Text>
            </View>
          </View>

          <View style={styles.requestCard}>
            <View>
              <Text style={styles.requestId}>
                REQ-1019
              </Text>

              <Text style={styles.requestMeta}>
                5 medicines • 28 Sep 2026
              </Text>
            </View>

            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>
                Completed
              </Text>
            </View>
          </View>

          {/* Create Request */}

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/new-request",
                params: {
                  stockistId: stockist.id,
                },
              })
            }
          >
            <MaterialCommunityIcons
              name="plus"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.primaryButtonText}>
              Create Medicine Request
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value}
        </Text>
      </View>
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

  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },

  mainCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },

  stockistHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  stockistIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  stockistInfo: {
    flex: 1,
    marginLeft: 14,
  },

  stockistName: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.text,
  },

  location: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },

  activeBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },

  activeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },

  detailsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  detailValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },

  summaryValue: {
    fontSize: 23,
    fontWeight: "700",
    color: colors.text,
  },

  summaryLabel: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 12,
  },

  sectionTitleNoMargin: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },

  viewAll: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },

  requestCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  requestId: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },

  requestMeta: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  },

  pendingBadge: {
    backgroundColor: colors.warningSoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  pendingText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.warning,
  },

  completedBadge: {
    backgroundColor: colors.successSoft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  completedText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.success,
  },

  primaryButton: {
    minHeight: 54,
    marginTop: 28,
    borderRadius: 15,
    backgroundColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  notFoundTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },

  backButtonSimple: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});