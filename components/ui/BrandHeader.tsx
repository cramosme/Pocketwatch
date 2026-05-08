import { View, Image } from "react-native";
import { images } from "@/constants/icons";

interface BrandHeaderProps{
  size?: number
};

export default function BrandHeader({ size= 150 } : BrandHeaderProps) {

  return(
    <View>
      <Image
        source={images.logo}
        style={{
          width: size,
          height: size * 0.8,
          alignSelf: 'center',
          marginBottom: -(size * 0.2)
        }}
        resizeMode="contain"
        accessible
        accessibilityLabel="Pocketwatch"
      />
      <Image
        source={images.appName}
        style={{
          width: size,
          height: size * 0.353,
          alignSelf: 'center'
        }}
        resizeMode="contain"
        accessible
        accessibilityLabel="Pocketwatch"
      />
    </View>
  );
}