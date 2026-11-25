import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMediaUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

interface TabBarButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accessibilityLabel: string;
  props: any;
}

function TabBarButton({ icon, accessibilityLabel, props }: TabBarButtonProps) {
  const selected = Boolean(props.accessibilityState?.selected);

  return (
    <Pressable
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      accessibilityRole="button"
      accessibilityState={props.accessibilityState}
      accessibilityLabel={accessibilityLabel}
      android_ripple={null}
      style={styles.tabItemPressable}
    >
      <View style={[styles.iconContainer, selected && styles.iconContainerActive]}>
        <MaterialCommunityIcons
          name={icon}
          size={26}
          color="#000000"
        />
      </View>
    </Pressable>
  );
}

function ProfileTabButton({ props }: { props: any }) {
  const { user } = useAuth();
  const selected = Boolean(props.accessibilityState?.selected);
  const avatarUrl = getMediaUrl(user?.image);

  const initials = (user?.name || "MR")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      accessibilityRole="button"
      accessibilityState={props.accessibilityState}
      accessibilityLabel="Profile"
      android_ripple={null}
      style={styles.tabItemPressable}
    >
      <View
        style={[
          styles.profileAvatarRing,
          selected && styles.profileAvatarRingActive,
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.profileAvatarImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.profileAvatarPlaceholder}>
            <Text style={styles.profileAvatarInitials}>{initials}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.rootContainer}>
      <Tabs
        initialRouteName="orders"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: [
            styles.tabBar,
            { height: 64 + insets.bottom, paddingBottom: insets.bottom || 8 },
          ],
          tabBarHideOnKeyboard: true,
        }}
      >
        {/* 1. ORDERS */}
        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarButton: (props) => (
              <TabBarButton
                icon="history"
                accessibilityLabel="Orders"
                props={props}
              />
            ),
          }}
        />

        {/* 2. STOCKISTS */}
        <Tabs.Screen
          name="stockists"
          options={{
            title: "Stockists",
            tabBarButton: (props) => (
              <TabBarButton
                icon="package-variant-closed"
                accessibilityLabel="Stockists"
                props={props}
              />
            ),
          }}
        />

        {/* 3. PRODUCTS */}
        <Tabs.Screen
          name="products"
          options={{
            title: "Products",
            tabBarButton: (props) => (
              <TabBarButton
                icon="pill"
                accessibilityLabel="Products"
                props={props}
              />
            ),
          }}
        />

        {/* 4. MESSAGING */}
        <Tabs.Screen
          name="messaging"
          options={{
            title: "Messaging",
            tabBarButton: (props) => (
              <TabBarButton
                icon="chat-outline"
                accessibilityLabel="Messaging"
                props={props}
              />
            ),
          }}
        />

        {/* 5. PROFILE */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarButton: (props) => <ProfileTabButton props={props} />,
          }}
        />

        {/* HIDDEN AUXILIARY ROUTES */}
        <Tabs.Screen
          name="requests"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="home"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="new-request"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItemPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconContainerActive: {
    backgroundColor: "#BFDBFE",
  },
  /* Profile avatar tab button */
  profileAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarRingActive: {
    borderColor: "#2563EB",
  },
  profileAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarInitials: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});
