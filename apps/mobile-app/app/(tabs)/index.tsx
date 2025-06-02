<<<<<<< Updated upstream
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Scan } from 'lucide-react-native';

export default function ScanScreen() {
  const handleScan = () => {
    // NFC scanning functionality will be implemented later
    console.log('Scanning NFC tag...');
=======
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Scan } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import NfcManager, { NfcEvents } from "react-native-nfc-manager";
import LoginScreen from "../(auth)/login";

export default function Index() {
  return (
    <>
      <AuthLoading>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </AuthLoading>
      <Unauthenticated>
        <LoginScreen />
      </Unauthenticated>
      <Authenticated>
        <ScanScreen />
      </Authenticated>
    </>
  );
}

function ScanScreen() {
  const [scanState, setScanState] = useState({
    isNfcSupported: null, // null = checking, true/false = result
    isScanning: false,
    error: null,
  });

  const [lastScan, setLastScan] = useState<{
    tagId: string;
    location: string;
    timestamp: Date;
  } | null>(null);

  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    initNfc();
    return () => {
      cleanupNfc();
    };
  }, []);

  // Initialize NFC with proper error handling
  const initNfc = async () => {
    try {
      const isSupported = await NfcManager.isSupported();
      setScanState((prev) => ({ ...prev, isNfcSupported: isSupported }));

      if (isSupported) {
        await NfcManager.start();
        console.log("NFC initialized successfully");
      } else {
        console.log("NFC not supported on this device");
      }
    } catch (error) {
      console.error("NFC initialization failed:", error);
      setScanState((prev) => ({
        ...prev,
        isNfcSupported: false,
        error: "Failed to initialize NFC",
      }));
    }
  };

  // Comprehensive NFC cleanup
  const cleanupNfc = async () => {
    try {
      // Clear timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }

      // Remove event listeners
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);

      // Cleanup NFC operations
      try {
        await NfcManager.unregisterTagEvent();
      } catch (e) {
        console.log("Unregister failed (expected):", e);
      }

      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        console.log("Cancel tech request failed (expected):", e);
      }
    } catch (error) {
      console.log("Cleanup error (expected):", error);
    }
  };

  // Reset NFC state for retry
  const resetNfcState = async () => {
    await cleanupNfc();
    setScanState((prev) => ({
      ...prev,
      isScanning: false,
      error: null,
    }));
    // Small delay before reinitializing
    setTimeout(() => {
      initNfc();
    }, 500);
  };

  // Start scanning with event-based approach
  const handleScan = async () => {
    if (scanState.isNfcSupported === false) {
      Alert.alert("NFC Not Available", "NFC is not supported on this device");
      return;
    }

    if (scanState.isNfcSupported === null) {
      Alert.alert("NFC Initializing", "Please wait for NFC to initialize");
      return;
    }

    try {
      setScanState((prev) => ({ ...prev, isScanning: true, error: null }));

      // Check if NFC is enabled
      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        Alert.alert(
          "NFC Disabled",
          "Please enable NFC in your device settings",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => NfcManager.goToNfcSetting() },
          ],
        );
        setScanState((prev) => ({ ...prev, isScanning: false }));
        return;
      }

      // Set timeout to prevent indefinite scanning
      scanTimeoutRef.current = setTimeout(() => {
        handleScanTimeout();
      }, 20000); // 20-second timeout like the inventory app

      // Register event listener for tag discovery
      NfcManager.setEventListener(NfcEvents.DiscoverTag, handleTagDiscovered);

      // Start listening for tags
      await NfcManager.registerTagEvent();
    } catch (error) {
      console.error("Error starting NFC scan:", error);
      setScanState((prev) => ({
        ...prev,
        isScanning: false,
        error: "Failed to start NFC scan. Please try again.",
      }));
    }
  };

  // Handle scan timeout
  const handleScanTimeout = async () => {
    try {
      await stopScanning();
      setScanState((prev) => ({
        ...prev,
        isScanning: false,
        error: "Scan timed out. Please try again.",
      }));
    } catch (error) {
      console.error("Timeout cleanup error:", error);
    }
  };

  // Stop scanning cleanly
  const stopScanning = async () => {
    try {
      // Clear timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }

      // Remove event listener
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);

      // Unregister from tag events
      await NfcManager.unregisterTagEvent();
    } catch (error) {
      console.log("Stop scanning error (expected):", error);
    }
  };

  // Handle discovered NFC tag
  const handleTagDiscovered = async (tag) => {
    try {
      console.log("Tag discovered:", tag);

      // Stop scanning immediately
      await stopScanning();

      // Process the tag
      const tagId = tag.id || "";

      if (tagId) {
        // Convert tag ID to readable format
        const readableTagId = Array.from(new Uint8Array(tagId))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join(":")
          .toUpperCase();

        // Create scan data
        const scanData = {
          tagId: readableTagId,
          location: getLocationFromTagId(readableTagId),
          timestamp: new Date(),
        };

        // Update state
        setLastScan(scanData);
        setScanState((prev) => ({ ...prev, isScanning: false }));

        // Show success message
        Alert.alert(
          "Checkpoint Scanned Successfully!",
          `Location: ${scanData.location}\nTag ID: ${readableTagId}\nTime: ${formatTime(scanData.timestamp)}`,
          [{ text: "OK" }],
        );

        // Save to database
        await saveScanData(scanData);
      } else {
        Alert.alert("Scan Failed", "Could not read NFC tag ID");
        setScanState((prev) => ({ ...prev, isScanning: false }));
      }
    } catch (error) {
      console.error("Error processing tag:", error);
      setScanState((prev) => ({
        ...prev,
        isScanning: false,
        error: "Failed to process NFC tag. Please try again.",
      }));
    }
  };

  // Map tag IDs to checkpoint locations
  const getLocationFromTagId = (tagId: string): string => {
    const locationMap: { [key: string]: string } = {
      "04:5A:3B:2C:1D:0E:FF": "Main Entrance",
      "12:34:56:78:9A:BC:DE": "Security Booth",
      "AA:BB:CC:DD:EE:FF:00": "Parking Garage",
      "11:22:33:44:55:66:77": "Emergency Exit A",
      "88:99:AA:BB:CC:DD:EE": "Server Room",
      "FF:EE:DD:CC:BB:AA:99": "Loading Dock",
      "01:02:03:04:05:06:07": "Reception Area",
    };

    return locationMap[tagId] || `Security Checkpoint (${tagId})`;
  };

  // Save scan data to database
  const saveScanData = async (scanData: any) => {
    try {
      console.log("Saving scan data:", scanData);
      // TODO: Implement Convex database save
      // Example: await createPatrolScan(scanData);
    } catch (error) {
      console.error("Failed to save scan data:", error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get NFC status display
  const getNfcStatusText = () => {
    if (scanState.isNfcSupported === null) return "🔄 Checking...";
    if (scanState.isNfcSupported === true) return "✅ Ready";
    return "❌ Not Available";
>>>>>>> Stashed changes
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Security Patrol</Text>
        <Text style={styles.statusText}>Status: On Duty</Text>
        <Text style={styles.nfcStatus}>NFC: {getNfcStatusText()}</Text>
      </View>

      <View style={styles.scanSection}>
        {scanState.isScanning ? (
          <View style={styles.scanningContainer}>
            <Pressable
              style={[styles.scanButton, styles.scanButtonActive]}
              disabled
            >
              <ActivityIndicator size={40} color="#fff" />
              <Text style={styles.scanButtonText}>Scanning...</Text>
            </Pressable>
            <Text style={styles.instructionText}>
              Hold your device near the NFC checkpoint tag
            </Text>
          </View>
        ) : scanState.error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{scanState.error}</Text>
            <View style={styles.buttonRow}>
              <Pressable style={styles.retryButton} onPress={resetNfcState}>
                <Text style={styles.buttonText}>Reset NFC</Text>
              </Pressable>
              <Pressable style={styles.scanButton} onPress={handleScan}>
                <Scan size={24} color="#fff" />
                <Text style={styles.scanButtonText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[
              styles.scanButton,
              scanState.isNfcSupported === false && styles.scanButtonDisabled,
            ]}
            onPress={handleScan}
            disabled={scanState.isNfcSupported !== true}
          >
            <Scan size={40} color="#fff" />
            <Text style={styles.scanButtonText}>
              {scanState.isNfcSupported === null
                ? "Initializing..."
                : "Tap to Scan Checkpoint"}
            </Text>
          </Pressable>
        )}
      </View>

      {lastScan && (
        <View style={styles.lastScanContainer}>
          <Text style={styles.lastScanTitle}>Last Checkpoint Scan</Text>
          <View style={styles.lastScanCard}>
            <Text style={styles.locationText}>📍 {lastScan.location}</Text>
            <Text style={styles.tagIdText}>🏷️ Tag: {lastScan.tagId}</Text>
            <Text style={styles.timeText}>
              🕐 {formatTime(lastScan.timestamp)}
            </Text>
            <Text style={styles.dateText}>
              📅 {formatDate(lastScan.timestamp)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 4,
  },
  nfcStatus: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  scanSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningContainer: {
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: '#007AFF',
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scanButtonActive: {
    backgroundColor: "#FF9500",
  },
  scanButtonDisabled: {
    backgroundColor: "#ccc",
  },
  scanButtonText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
<<<<<<< Updated upstream
    fontWeight: '600',
=======
    fontWeight: "600",
    textAlign: "center",
  },
  instructionText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  errorContainer: {
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff3b30",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
  },
  retryButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
>>>>>>> Stashed changes
  },
  lastScanContainer: {
    marginTop: 40,
  },
  lastScanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  lastScanCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
<<<<<<< Updated upstream
    borderColor: '#e1e1e1',
  },
  locationText: {
    fontSize: 16,
    color: '#1a1a1a',
=======
    borderColor: "#e1e1e1",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationText: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "600",
    marginBottom: 6,
  },
  tagIdText: {
    fontSize: 14,
    color: "#666",
>>>>>>> Stashed changes
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
});