import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Scan } from "lucide-react-native";
import NfcManager, { NfcEvents } from "react-native-nfc-manager";

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isTablet = width > 768;

export default function NfcScanScreen() {
  const [state, setState] = useState({
    scanning: false,
    error: null,
    nfcAvailable: null,
  });
  const [lastScan, setLastScan] = useState(null);
  const scanTimeoutRef = useRef(null);

  // Check if NFC is available
  const checkNfcAvailability = async () => {
    try {
      const isSupported = await NfcManager.isSupported();
      setState((prev) => ({ ...prev, nfcAvailable: isSupported }));
      return isSupported;
    } catch (error) {
      console.error("Error checking NFC support:", error);
      setState((prev) => ({
        ...prev,
        nfcAvailable: false,
        error: "Failed to check NFC availability",
      }));
      return false;
    }
  };

  // Initialize NFC on component mount
  useEffect(() => {
    const initializeNfc = async () => {
      const isAvailable = await checkNfcAvailability();
      if (isAvailable) {
        try {
          await NfcManager.start();
          console.log("NFC initialized successfully");
        } catch (error) {
          console.error("NFC initialization failed:", error);
          setState((prev) => ({
            ...prev,
            nfcAvailable: false,
            error: "Failed to initialize NFC",
          }));
        }
      }
    };

    initializeNfc();

    // Cleanup function
    return () => {
      cleanupNfc();
    };
  }, []);

  const cleanupNfc = async () => {
    try {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }

      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      await NfcManager.unregisterTagEvent().catch(() => {});
      await NfcManager.cancelTechnologyRequest().catch(() => {});
    } catch (error) {
      console.log("Cleanup error (expected):", error);
    }
  };

  const startScanning = async () => {
    // Check NFC availability first
    if (state.nfcAvailable === null) {
      const isAvailable = await checkNfcAvailability();
      if (!isAvailable) return;
    }

    if (state.nfcAvailable === false) {
      Alert.alert(
        "NFC Not Available",
        "NFC is not supported or enabled on this device"
      );
      return;
    }

    setState((prev) => ({ ...prev, error: null, scanning: true }));

    try {
      // Check if NFC is enabled
      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        Alert.alert(
          "NFC Disabled",
          "Please enable NFC in your device settings",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => NfcManager.goToNfcSetting() },
          ]
        );
        setState((prev) => ({ ...prev, scanning: false }));
        return;
      }

      // Set timeout to prevent indefinite scanning
      scanTimeoutRef.current = setTimeout(() => {
        stopScanning();
        setState((prev) => ({
          ...prev,
          scanning: false,
          error: "Scan timed out. Please try again.",
        }));
      }, 15000);

      // Register for tag discovery
      NfcManager.setEventListener(NfcEvents.DiscoverTag, handleTagDiscovered);
      await NfcManager.registerTagEvent();
    } catch (error) {
      console.error("Error starting NFC scan:", error);
      setState((prev) => ({
        ...prev,
        scanning: false,
        error: "Failed to start NFC scan. Please try again.",
      }));
    }
  };

  const stopScanning = async () => {
    try {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }

      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      await NfcManager.unregisterTagEvent();
    } catch (error) {
      console.error("Error stopping NFC scan:", error);
    }
  };

  const handleTagDiscovered = async (tag) => {
    try {
      // Stop active scanning
      await stopScanning();

      // Simple tag ID extraction (fixed from your version)
      const tagId = tag.id || "Unknown";
      console.log("Tag detected:", tag);
      console.log("Tag ID:", tagId);

      // Create scan result
      const scanResult = {
        id: tagId,
        timestamp: new Date().toISOString(),
        rawData: tag, // Store raw tag data for debugging
      };

      // Update last scan
      setLastScan(scanResult);

      // Stop scanning
      setState((prev) => ({ ...prev, scanning: false }));

      // Show success message with tag details
      Alert.alert(
        "NFC Tag Scanned Successfully!",
        `Tag ID: ${tagId}\nTime: ${new Date().toLocaleTimeString()}\n\nRaw data logged to console`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error processing tag:", error);
      setState((prev) => ({
        ...prev,
        scanning: false,
        error: "Failed to process NFC tag. Please try again.",
      }));
    }
  };

  const resetNfc = async () => {
    try {
      await cleanupNfc();
      setState((prev) => ({
        ...prev,
        scanning: false,
        error: null,
        nfcAvailable: null,
      }));
      
      // Re-initialize
      const isAvailable = await checkNfcAvailability();
      if (isAvailable) {
        await NfcManager.start();
      }
    } catch (error) {
      console.error("Reset error:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to reset NFC. Please restart the app.",
      }));
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const scanButtonSize = Math.min(width * 0.5, 200);
  const iconSize = isSmallScreen ? 32 : isTablet ? 48 : 40;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: isTablet ? 36 : isSmallScreen ? 24 : 28 }]}>
            NFC Scanner
          </Text>
          
          <Text style={[styles.statusText, { fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16 }]}>
            NFC Status: {
              state.nfcAvailable === null 
                ? "Checking..." 
                : state.nfcAvailable 
                  ? "✅ Ready" 
                  : "❌ Not Available"
            }
          </Text>
        </View>

        <View style={styles.scanSection}>
          {state.scanning ? (
            <View style={styles.scanningContainer}>
              <View style={[
                styles.scanButton, 
                styles.scanButtonActive,
                { 
                  width: scanButtonSize, 
                  height: scanButtonSize, 
                  borderRadius: scanButtonSize / 2 
                }
              ]}>
                <ActivityIndicator size={iconSize} color="#fff" />
              </View>
              <Text style={[styles.instructionText, { fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16 }]}>
                Hold your device near an NFC tag
              </Text>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={stopScanning}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : state.error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16 }]}>
                {state.error}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.resetButton} onPress={resetNfc}>
                  <Text style={styles.buttonText}>Reset NFC</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.retryButton} onPress={startScanning}>
                  <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.scanButton,
                !state.nfcAvailable && styles.scanButtonDisabled,
                { 
                  width: scanButtonSize, 
                  height: scanButtonSize, 
                  borderRadius: scanButtonSize / 2 
                }
              ]}
              onPress={startScanning}
              disabled={!state.nfcAvailable}
            >
              <Scan size={iconSize} color="#fff" />
              <Text style={[styles.scanButtonText, { fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16 }]}>
                Tap to Scan{'\n'}NFC Tag
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {lastScan && (
          <View style={styles.resultContainer}>
            <Text style={[styles.resultTitle, { fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18 }]}>
              Last Scan Result
            </Text>
            <View style={styles.resultCard}>
              <Text style={[styles.resultText, { fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16 }]}>
                <Text style={styles.resultLabel}>Tag ID:</Text> {lastScan.id}
              </Text>
              <Text style={[styles.resultText, { fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16 }]}>
                <Text style={styles.resultLabel}>Time:</Text> {formatTime(lastScan.timestamp)}
              </Text>
              <Text style={[styles.resultSubtext, { fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14 }]}>
                Raw tag data has been logged to console for debugging
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05, // 5% of screen width
    paddingVertical: height * 0.02, // 2% of screen height
  },
  header: {
    alignItems: "center",
    marginBottom: height * 0.04, // 4% of screen height
    paddingTop: height * 0.02, // 2% of screen height
  },
  title: {
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: height * 0.015, // 1.5% of screen height
  },
  statusText: {
    color: "#666",
    textAlign: "center",
  },
  scanSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: height * 0.4, // Minimum 40% of screen height
  },
  scanningContainer: {
    alignItems: "center",
    width: "100%",
  },
  scanButton: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: height * 0.02,
  },
  scanButtonActive: {
    backgroundColor: "#FF9500",
  },
  scanButtonDisabled: {
    backgroundColor: "#ccc",
  },
  scanButtonText: {
    color: "#fff",
    marginTop: height * 0.015,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: isTablet ? 24 : 20,
  },
  instructionText: {
    marginTop: height * 0.025,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: width * 0.1,
  },
  cancelButton: {
    marginTop: height * 0.02,
    backgroundColor: "#ff3b30",
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.015,
    borderRadius: 8,
    minWidth: width * 0.25,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    fontWeight: "600",
  },
  errorContainer: {
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    width: "100%",
  },
  errorText: {
    color: "#ff3b30",
    textAlign: "center",
    marginBottom: height * 0.025,
    lineHeight: isTablet ? 26 : 22,
    paddingHorizontal: width * 0.05,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 300,
    gap: width * 0.04,
  },
  resetButton: {
    backgroundColor: "#666",
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.015,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.015,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    fontWeight: "600",
  },
  resultContainer: {
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.02,
  },
  resultTitle: {
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: height * 0.015,
  },
  resultCard: {
    backgroundColor: "#fff",
    padding: width * 0.05,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    color: "#1a1a1a",
    marginBottom: height * 0.01,
    lineHeight: isTablet ? 24 : 20,
  },
  resultLabel: {
    fontWeight: "600",
  },
  resultSubtext: {
    color: "#666",
    fontStyle: "italic",
    marginTop: height * 0.01,
    lineHeight: isTablet ? 22 : 18,
  },
});