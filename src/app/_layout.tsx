import { Stack } from "expo-router";

import { AuthProvider } from "../context/AuthContext";
import { RequestProvider } from "../context/RequestContext";
import { StockistProvider } from "../context/StockistContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StockistProvider>
        <RequestProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </RequestProvider>
      </StockistProvider>
    </AuthProvider>
  );
}