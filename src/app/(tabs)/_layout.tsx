import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "../../theme/colors";

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,

        tabBarStyle: styles.tabBar,

        tabBarLabelStyle: styles.tabLabel,

        tabBarHideOnKeyboard: true,
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",

          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* REQUESTS */}
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",

          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* NEW REQUEST */}
      <Tabs.Screen
        name="new-request"
        options={{
          title: "",

          tabBarButton: (props) => (
            <View style={styles.centerWrapper}>
              <Pressable
                onPress={props.onPress}
                style={({ pressed }) => [
                  styles.newRequestButton,
                  pressed && styles.newRequestPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={30}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          ),
        }}
      />

      {/* STOCKISTS */}
      <Tabs.Screen
        name="stockists"
        options={{
          title: "Stockists",

          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="storefront-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      {/* ACCOUNT */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",

          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 76,

    paddingTop: 8,
    paddingBottom: 8,

    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },

  centerWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  newRequestButton: {
    width: 58,
    height: 58,

    borderRadius: 29,

    backgroundColor: colors.primary,

    justifyContent: "center",
    alignItems: "center",

    marginTop: -22,

    borderWidth: 5,
    borderColor: "#FFFFFF",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,

    elevation: 7,
  },

  newRequestPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.94,
      },
    ],
  },
});