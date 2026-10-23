import * as Device from 'expo-device';
import { Image, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}



export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Large logo centered at the top */}
        <View style={styles.heroSection}>
  <View style={styles.logoContainer}>
    <Image
      source={require('../../assets/images/tentativelogo.png')}
      style={styles.logo}
      resizeMode="cover"
    />
  </View>

  <ThemedText type="title" style={styles.title}>
    Audio QR
  </ThemedText>
</View>

        {/* Generate audio section centered on the page */}
        <View style={styles.mainContent}>
          <ThemedText style={styles.label}>
            Generate link:
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Link you want to encode"
            placeholderTextColor="#888888"
            autoCapitalize="none"
            keyboardType="url"
          />

          <Pressable
            style={styles.customButton}
            onPress={() => console.log('Generate Audio QR clicked')}
          >
            <ThemedText style={styles.buttonText}>
              Generate Audio QR
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}



const styles = StyleSheet.create({
  

container: {
  flex: 1,
  justifyContent: 'center',
  flexDirection: 'row',
},

safeArea: {
  flex: 1,
  paddingHorizontal: Spacing.four,
  alignItems: 'center',
  paddingBottom: BottomTabInset + Spacing.three,
  maxWidth: MaxContentWidth,
  width: '100%',
},

heroSection: {
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  paddingTop: 16,
  gap: 12,
},

logoContainer: {
  width: 180,
  height: 180,
  borderRadius: 40,
  overflow: 'hidden',
},

logo: {
  width: '100%',
  height: '100%',
},

title: {
  textAlign: 'center',
},

mainContent: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  gap: 16,
},

label: {
  fontSize: 18,
  fontWeight: '600',
  alignSelf: 'stretch',
},

input: {
  width: '100%',
  minHeight: 50,
  borderWidth: 1,
  borderColor: '#CCCCCC',
  borderRadius: 12,
  paddingHorizontal: 14,
  fontSize: 16,
  color: '#222222',
  backgroundColor: '#FFFFFF',
},

customButton: {
  backgroundColor: '#6C5CE7',
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  alignItems: 'center',
  width: '100%',
},

buttonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: 'bold',
},
});
