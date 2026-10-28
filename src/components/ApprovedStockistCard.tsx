import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type Props = {
  name: string;
  location: string;
  contactPerson?: string;
  phone?: string;
  onPress?: () => void;
  onNewRequest?: () => void;
};

export function ApprovedStockistCard({
  name,
  location,
  contactPerson,
  phone,
  onPress,
  onNewRequest,
}: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="storefront-outline"
            size={24}
            color={colors.primary}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={15}
              color={colors.textSecondary}
            />

            <Text style={styles.location}>{location}</Text>
          </View>
        </View>

        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>Active</Text>
        </View>
      </View>

      {(contactPerson || phone) && (
        <>
          <View style={styles.divider} />

          {contactPerson && (
            <>
              <Text style={styles.detailLabel}>Contact Person</Text>
              <Text style={styles.detailValue}>{contactPerson}</Text>
            </>
          )}

          {phone && (
            <>
              <Text style={[styles.detailLabel, contactPerson ? { marginTop: 8 } : undefined]}>
                Phone
              </Text>
              <Text style={styles.detailValue}>{phone}</Text>
            </>
          )}
        </>
      )}

      <Pressable
        style={styles.requestButton}
        onPress={(event) => {
          event.stopPropagation();
          onNewRequest?.();
        }}
      >
        <MaterialCommunityIcons
          name="plus"
          size={18}
          color={colors.primary}
        />

        <Text style={styles.requestButtonText}>
          New Medicine Request
        </Text>
      </Pressable>
    </Pressable>
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
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 3,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  activeBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: colors.successSoft,
  },
  activeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  detailValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  requestButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: colors.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  requestButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
});
