import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  RequestStatus,
  useRequests,
} from "../../context/RequestContext";

import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

type Filter =
  | "ALL"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

const filters: Filter[] = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "COMPLETED",
];

export default function RequestsScreen() {
  const { requests } = useRequests();

  const {
    isTablet,
    gutter,
    contentMaxWidth,
  } = useResponsive();

  const [activeFilter, setActiveFilter] =
    useState<Filter>("ALL");

  const [search, setSearch] =
    useState("");

  const filteredRequests =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return requests.filter(
        (request) => {
          const matchesStatus =
            activeFilter === "ALL" ||
            request.status ===
              activeFilter;

          const matchesSearch =
            !query ||
            request.requestNumber
              .toLowerCase()
              .includes(query) ||
            request.stockistName
              .toLowerCase()
              .includes(query);

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      requests,
      activeFilter,
      search,
    ]);

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
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
                  maxWidth:
                    contentMaxWidth,
                  alignSelf: "center",
                }
              : undefined,
          ]}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                My Requests
              </Text>

              <Text
                style={styles.subtitle}
              >
                View medicine requests
                submitted for your
                stockists.
              </Text>
            </View>

            {isTablet && (
              <Pressable
                style={
                  styles.newRequestButton
                }
                onPress={() =>
                  router.push(
                    "/(tabs)/new-request"
                  )
                }
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.newRequestText
                  }
                >
                  New Request
                </Text>
              </Pressable>
            )}
          </View>

          {/* SEARCH */}

          <View
            style={
              styles.searchContainer
            }
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.textMuted}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search request or stockist..."
              placeholderTextColor={
                colors.textMuted
              }
              style={styles.searchInput}
            />
          </View>

          {/* FILTERS */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filterRow
            }
          >
            {filters.map((filter) => {
              const active =
                activeFilter === filter;

              return (
                <Pressable
                  key={filter}
                  style={[
                    styles.filterButton,
                    active &&
                      styles.activeFilterButton,
                  ]}
                  onPress={() =>
                    setActiveFilter(
                      filter
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterText,
                      active &&
                        styles.activeFilterText,
                    ]}
                  >
                    {formatFilter(
                      filter
                    )}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* COUNT */}

          <View
            style={
              styles.sectionHeader
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Requests
            </Text>

            <Text
              style={
                styles.requestCount
              }
            >
              {
                filteredRequests.length
              }
            </Text>
          </View>

          {/* REQUEST CARDS */}

          {filteredRequests.length >
          0 ? (
            <View
              style={[
                styles.requestGrid,
                isTablet &&
                  styles.requestGridTablet,
              ]}
            >
              {filteredRequests.map(
                (request) => (
                  <View
                    key={request.id}
                    style={[
                      styles.requestWrapper,
                      isTablet &&
                        styles.requestWrapperTablet,
                    ]}
                  >
                    <Pressable
                      style={
                        styles.requestCard
                      }
                      onPress={() =>
                        router.push({
                          pathname:
                            "/request/[id]",
                          params: {
                            id: request.id,
                          },
                        })
                      }
                    >
                      <View
                        style={
                          styles.requestTop
                        }
                      >
                        <View>
                          <Text
                            style={
                              styles.requestNumber
                            }
                          >
                            {
                              request.requestNumber
                            }
                          </Text>

                          <Text
                            style={
                              styles.stockistName
                            }
                          >
                            {
                              request.stockistName
                            }
                          </Text>
                        </View>

                        <StatusBadge
                          status={
                            request.status
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.divider
                        }
                      />

                      <View
                        style={
                          styles.requestInfo
                        }
                      >
                        <Info
                          icon="pill"
                          value={`${request.totalItems} medicines`}
                        />

                        <Info
                          icon="calendar-outline"
                          value={
                            request.createdAt
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.bottomRow
                        }
                      >
                        <View>
                          <Text
                            style={
                              styles.totalLabel
                            }
                          >
                            Total
                          </Text>

                          <Text
                            style={
                              styles.totalAmount
                            }
                          >
                            Rs.{" "}
                            {request.totalAmount.toFixed(
                              2
                            )}
                          </Text>
                        </View>

                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={23}
                          color={
                            colors.textMuted
                          }
                        />
                      </View>
                    </Pressable>
                  </View>
                )
              )}
            </View>
          ) : (
            <View
              style={styles.emptyState}
            >
              <View
                style={styles.emptyIcon}
              >
                <MaterialCommunityIcons
                  name="clipboard-text-search-outline"
                  size={38}
                  color={
                    colors.primary
                  }
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                No requests found
              </Text>

              <Text
                style={styles.emptyText}
              >
                Try changing the search
                or status filter.
              </Text>
            </View>
          )}

          {/* MOBILE BUTTON */}

          {!isTablet && (
            <Pressable
              style={
                styles.mobileNewButton
              }
              onPress={() =>
                router.push(
                  "/(tabs)/new-request"
                )
              }
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.newRequestText
                }
              >
                New Medicine Request
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatFilter(
  filter: Filter
) {
  if (filter === "ALL") {
    return "All";
  }

  return (
    filter.charAt(0) +
    filter
      .slice(1)
      .toLowerCase()
  );
}

function Info({
  icon,
  value,
}: {
  icon: any;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <MaterialCommunityIcons
        name={icon}
        size={15}
        color={colors.textMuted}
      />

      <Text
        style={styles.infoText}
      >
        {value}
      </Text>
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
      backgroundColor:
        colors.warningSoft,
      color: colors.warning,
      text: "Pending",
    },

    PROCESSING: {
      backgroundColor:
        colors.primarySoft,
      color: colors.primary,
      text: "Processing",
    },

    COMPLETED: {
      backgroundColor:
        colors.successSoft,
      color: colors.success,
      text: "Completed",
    },

    CANCELLED: {
      backgroundColor:
        colors.dangerSoft,
      color: colors.danger,
      text: "Cancelled",
    },
  };

  const style = config[status];

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            style.backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.statusText,
          {
            color: style.color,
          },
        ]}
      >
        {style.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  scrollContent: {
    paddingTop: 12,
    paddingBottom: 120,
  },

  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color:
      colors.textSecondary,
  },

  newRequestButton: {
    backgroundColor:
      colors.primary,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  newRequestText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  searchContainer: {
    height: 50,

    backgroundColor:
      colors.card,

    borderWidth: 1,
    borderColor:
      colors.border,

    borderRadius: 14,

    paddingHorizontal: 14,

    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,

    fontSize: 14,
    color: colors.text,
  },

  filterRow: {
    gap: 8,

    paddingVertical: 17,
  },

  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,

    borderRadius: 20,

    backgroundColor:
      colors.card,

    borderWidth: 1,
    borderColor:
      colors.border,
  },

  activeFilterButton: {
    backgroundColor:
      colors.primary,
    borderColor:
      colors.primary,
  },

  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color:
      colors.textSecondary,
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  sectionHeader: {
    marginTop: 4,
    marginBottom: 12,

    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },

  requestCount: {
    fontSize: 12,
    fontWeight: "700",
    color:
      colors.textMuted,
  },

  requestGrid: {
    gap: 12,
  },

  requestGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  requestWrapper: {
    width: "100%",
  },

  requestWrapperTablet: {
    width: "48.8%",
  },

  requestCard: {
    backgroundColor:
      colors.card,

    borderWidth: 1,
    borderColor:
      colors.border,

    borderRadius: 18,

    padding: 16,
  },

  requestTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
  },

  requestNumber: {
    fontSize: 12,
    fontWeight: "700",
    color:
      colors.primary,
  },

  stockistName: {
    marginTop: 5,

    fontSize: 16,
    fontWeight: "700",

    color: colors.text,
  },

  statusBadge: {
    borderRadius: 20,

    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor:
      colors.border,

    marginVertical: 14,
  },

  requestInfo: {
    gap: 8,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",

    gap: 6,
  },

  infoText: {
    fontSize: 11,
    color:
      colors.textSecondary,
  },

  bottomRow: {
    marginTop: 17,

    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 10,
    color:
      colors.textSecondary,
  },

  totalAmount: {
    marginTop: 3,

    fontSize: 15,
    fontWeight: "700",

    color: colors.text,
  },

  mobileNewButton: {
    marginTop: 25,

    minHeight: 54,

    backgroundColor:
      colors.primary,

    borderRadius: 15,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 7,
  },

  emptyState: {
    paddingVertical: 65,

    alignItems: "center",
  },

  emptyIcon: {
    width: 68,
    height: 68,

    borderRadius: 22,

    backgroundColor:
      colors.primarySoft,

    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 14,

    fontSize: 16,
    fontWeight: "700",

    color: colors.text,
  },

  emptyText: {
    marginTop: 5,

    fontSize: 12,
    color:
      colors.textSecondary,
  },
});