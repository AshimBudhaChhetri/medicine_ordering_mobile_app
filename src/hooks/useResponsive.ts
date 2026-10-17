import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  return {
    width,
    height,
    isPhone: !isTablet,
    isTablet,
    isLargeTablet,
    gutter: isTablet ? 28 : 16,
    contentMaxWidth: isTablet ? 1200 : undefined,
  };
}