import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SideKit, { useSideKit, DefaultVersionGate } from '@sidekit/react-native';

export default function App() {
  const [configured, setConfigured] = useState(false);
  const [apiKey, setApiKey] = useState('demo-api-key');
  const { showUpdateScreen, gateInformation, isAnalyticsEnabled } = useSideKit();

  // Auto-initialize SDK on mount
  useEffect(() => {
    initializeSDK();
  }, []);

  const initializeSDK = async () => {
    try {
      await SideKit.shared.configure(apiKey, {
        appVersion: '1.0.0',
        verbose: true,
        presentationMode: 'automatic',
      });
      setConfigured(true);
      console.log('SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      Alert.alert('Error', 'Failed to initialize SDK: ' + (error as Error).message);
    }
  };

  const handleTrackEvent = () => {
    SideKit.shared.sendSignal('button_clicked');
    Alert.alert('Success', 'Event tracked: button_clicked');
  };

  const handleTrackEventWithValue = () => {
    SideKit.shared.sendSignal('page_viewed', 'home_screen');
    Alert.alert('Success', 'Event tracked: page_viewed = home_screen');
  };

  const handleToggleAnalytics = () => {
    SideKit.shared.isAnalyticsEnabled = !isAnalyticsEnabled;
    Alert.alert(
      'Analytics ' + (SideKit.shared.isAnalyticsEnabled ? 'Enabled' : 'Disabled'),
      'Analytics tracking has been ' + (SideKit.shared.isAnalyticsEnabled ? 'enabled' : 'disabled')
    );
  };

  const handleForceCheck = async () => {
    Alert.alert('Version Check', 'In a real app, this would trigger a background version check');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SideKit React Native</Text>
          <Text style={styles.subtitle}>Example App</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>

        {/* Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={configured ? styles.valueSuccess : styles.valueError}>
              {configured ? 'Configured ✓' : 'Not Configured'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Platform:</Text>
            <Text style={styles.value}>{Platform.OS}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>API Key:</Text>
            <Text style={styles.value}>{apiKey}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={initializeSDK}>
            <Text style={styles.buttonText}>Re-initialize SDK</Text>
          </TouchableOpacity>
        </View>

        {/* Version Gate Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Version Gate</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Show Gate:</Text>
            <Text style={showUpdateScreen ? styles.valueWarning : styles.valueSuccess}>
              {showUpdateScreen ? 'Yes (Update Available)' : 'No (Up to Date)'}
            </Text>
          </View>
          {gateInformation && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Latest Version:</Text>
                <Text style={styles.value}>{gateInformation.latestVersion || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>What's New:</Text>
                <Text style={styles.value}>{gateInformation.whatsNew || 'N/A'}</Text>
              </View>
            </>
          )}
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleForceCheck}>
            <Text style={styles.buttonSecondaryText}>Check for Updates</Text>
          </TouchableOpacity>
        </View>

        {/* Analytics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={isAnalyticsEnabled ? styles.valueSuccess : styles.valueError}>
              {isAnalyticsEnabled ? 'Enabled ✓' : 'Disabled'}
            </Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleTrackEvent}>
            <Text style={styles.buttonText}>Track Event (Key Only)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleTrackEventWithValue}>
            <Text style={styles.buttonText}>Track Event (Key + Value)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleToggleAnalytics}>
            <Text style={styles.buttonSecondaryText}>
              {isAnalyticsEnabled ? 'Disable Analytics' : 'Enable Analytics'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Debug Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Information</Text>
          <View style={styles.debugBox}>
            <Text style={styles.debugText}>
              {JSON.stringify(
                {
                  showUpdateScreen,
                  gateInformation: gateInformation ? {
                    lastGateUpdate: gateInformation.lastGateUpdate,
                    latestVersion: gateInformation.latestVersion,
                    whatsNew: gateInformation.whatsNew,
                  } : null,
                  isAnalyticsEnabled,
                },
                null,
                2
              )}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with SideKit React Native SDK
          </Text>
          <Text style={styles.footerText}>
            Platform: {Platform.OS} • Version: {Platform.Version}
          </Text>
        </View>
      </ScrollView>

      {/* Version Gate Modal (automatic presentation) */}
      <DefaultVersionGate
        onSkip={() => {
          console.log('User skipped update');
          Alert.alert('Update Skipped', 'You can update later from the app settings');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000033',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000033',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  valueSuccess: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  valueError: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  valueWarning: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#000033',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000033',
  },
  buttonSecondaryText: {
    color: '#000033',
    fontSize: 16,
    fontWeight: '600',
  },
  debugBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  debugText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#333',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
