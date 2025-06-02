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
import LoginScreen from "../(auth)/login";

// Try to import NFC manager, fall back to mock if not available
let NfcManager, NfcEvents;
let isNfcAvailable = false;

try {
  const nfcModule = require("react-native-nfc-manager");
  NfcManager = nfcModule.default;
  NfcEvents = nfcModule.NfcEvents;
  isNfcAvailable = true;
} catch (error) {
  console.log("NFC not available, using mock mode");
  isNfcAvailable = false;
}

// Mock NFC for testing in Expo Go
const mockNfcScan = () => {
  const mockCheckpoints = [
    { id: "04:5A:3B:2C:1D:0E:FF", location: "Main Entrance" },
    { id: "12:34:56:78:9A:BC:DE", location: "Security Booth" },
    { id: "AA:BB:CC:DD:EE:FF:00", location: "Parking Garage" },
    { id: "11:22:33:44:55:66:77", location: "Emergency Exit A" },
    { id: "88:99:AA:BB:CC:DD:EE", location: "Server Room" },
  ];

  const randomCheckpoint =
    mockCheckpoints[Math.floor(Math.random() * mockCheckpoints.length)];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: randomCheckpoint.id,
        location: randomCheckpoint.location,
        timestamp: new Date().toISOString(),
      });
    }, 2000);
  });
};

// Checkpoint location mapping
const getCheckpointLocation = (tagId) => {
  const checkpointMap = {
    "04:5A:3B:2C:1D:0E:FF": "Main Entrance",
    "12:34:56:78:9A:BC:DE": "Security Booth",
    "AA:BB:CC:DD:EE:FF:00": "Parking Garage",
    "11:22:33:44:55:66:77": "Emergency Exit A",
    "88:99:AA:BB:CC:DD:EE": "Server Room",
  };

  return checkpointMap[tagId] || `Unknown Checkpoint (${tagId})`;
};

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
    isScanning: false,
    error: null,
    nfcAvailable: null, // Will be checked on mount
  });

  const [lastScan, setLastScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const scanTimeoutRef = useRef(null);

  // Initialize NFC and component
  useEffect(() => {
    initializeNfc();
    loadScanHistory();

    return () => {
      // Cleanup on unmount
      cleanupNfc();
    };
  }, []);

  const initializeNfc = async () => {
    if (!isNfcAvailable) {
      // Mock mode for Expo Go
      setScanState((prev) => ({ ...prev, nfcAvailable: true }));
      console.log("Using mock NFC mode (Expo Go)");
      return;
    }

    try {
      const isSupported = await NfcManager.isSupported();
      if (isSupported) {
        await NfcManager.start();
        setScanState((prev) => ({ ...prev, nfcAvailable: true }));
        console.log("Real NFC initialized successfully");
      } else {
        setScanState((prev) => ({ ...prev, nfcAvailable: false }));
        console.log("NFC not supported on this device");
      }
    } catch (error) {
      console.error("NFC initialization failed:", error);
      setScanState((prev) => ({
        ...prev,
        nfcAvailable: false,
        error: "Failed to initialize NFC",
      }));
    }
  };

  const cleanupNfc = async () => {
    if (!isNfcAvailable) return;

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

  const loadScanHistory = async () => {
    // In real app, load from Convex database
    // For now, just set empty array
    setScanHistory([]);
  };

  const handleScan = async () => {
    if (scanState.nfcAvailable === false) {
      Alert.alert(
        "NFC Not Available",
        "NFC is not supported or enabled on this device",
      );
      return;
    }

    if (scanState.nfcAvailable === null) {
      Alert.alert("NFC Initializing", "Please wait for NFC to initialize");
      return;
    }

    try {
      setScanState((prev) => ({ ...prev, isScanning: true, error: null }));

      if (!isNfcAvailable) {
        // Mock mode for Expo Go
        console.log("Using mock NFC scan");
        const scanResult = await mockNfcScan();
        await processScanResult(scanResult);
        return;
      }

      // Real NFC scanning
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

      // Set timeout for scan
      scanTimeoutRef.current = setTimeout(() => {
        handleScanTimeout();
      }, 15000);

      // Set up tag discovery listener
      NfcManager.setEventListener(NfcEvents.DiscoverTag, handleTagDiscovered);

      // Start listening for tags
      await NfcManager.registerTagEvent();
    } catch (error) {
      console.error("Scan error:", error);
      setScanState((prev) => ({
        ...prev,
        isScanning: false,
        error: "Failed to start NFC scan. Please try again.",
      }));
    }
  };

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

  const stopScanning = async () => {
    try {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }

      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      await NfcManager.unregisterTagEvent();
    } catch (error) {
      console.log("Stop scanning error (expected):", error);
    }
  };

  const handleTagDiscovered = async (tag) => {
    try {
      // Stop scanning immediately
      await stopScanning();

      // Convert tag ID to readable format
      const tagId = tag.id
        ? Array.from(new Uint8Array(tag.id))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join(":")
            .toUpperCase()
        : "Unknown";

      console.log("Tag discovered:", tagId);

      // Get checkpoint location
      const location = getCheckpointLocation(tagId);

      // Create scan result
      const scanResult = {
        id: tagId,
        location: location,
        timestamp: new Date().toISOString(),
      };

      // Process the scan
      await processScanResult(scanResult);
    } catch (error) {
      console.error("Tag processing error:", error);
      setScanState((prev) => ({
        ...prev,
        isScanning: false,
        error: "Failed to process NFC tag. Please try again.",
      }));
    }
  };

  const processScanResult = async (scanResult) => {
    try {
      // Create scan record
      const scanRecord = {
        id: Date.now().toString(), // Unique ID for this scan
        tagId: scanResult.id,
        location: scanResult.location,
        timestamp: new Date(),
        guardName: "Security Guard", // In real app, get from auth
        status: "completed",
      };

      // Update state
      setLastScan(scanRecord);
      setScanHistory((prev) => [scanRecord, ...prev.slice(0, 9)]); // Keep last 10 scans

      // Save to database (implement with Convex)
      await saveScanRecord(scanRecord);

      // Stop scanning
      setScanState((prev) => ({ ...prev, isScanning: false }));

      // Show success message
      Alert.alert(
        "Checkpoint Scanned Successfully",
        `Location: ${scanResult.location}\nTag ID: ${scanResult.id}\nTime: ${formatTime(scanRecord.timestamp)}`,
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("Error processing scan:", error);
      setScanState((prev) => ({
        ...prev,
        isScanning: false,
        error: "Failed to save scan record. Please try again.",
      }));
    }
  };

  const saveScanRecord = async (scanRecord) => {
    try {
      // Here you would save to Convex database
      console.log("Saving scan record:", scanRecord);
      // Example: await createScanRecord(scanRecord);
    } catch (error) {
      console.error("Failed to save scan record:", error);
      throw error;
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const resetNfcAndRetry = async () => {
    try {
      await cleanupNfc();
      await initializeNfc();
      setScanState((prev) => ({
        ...prev,
        isScanning: false,
        error: null,
      }));
    } catch (error) {
      console.error("Reset error:", error);
      setScanState((prev) => ({
        ...prev,
        error: "Failed to reset NFC. Please restart the app.",
      }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Security Patrol</Text>
        <Text style={styles.statusText}>Status: On Duty</Text>
        <Text style={styles.nfcStatus}>
          NFC:{" "}
          {scanState.nfcAvailable
            ? isNfcAvailable
              ? "✅ Real NFC Ready"
              : "🔄 Mock Mode"
            : "❌ Not Available"}
        </Text>
      </View>

      <View style={styles.scanSection}>
        {scanState.isScanning ? (
          <View style={styles.scanningContainer}>
            <View style={[styles.scanButton, styles.scanButtonActive]}>
              <ActivityIndicator size={40} color="#fff" />
              <Text style={styles.scanButtonText}>Scanning...</Text>
            </View>
            <Text style={styles.instructionText}>
              Hold your device near the NFC checkpoint tag
            </Text>
          </View>
        ) : scanState.error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{scanState.error}</Text>
            <View style={styles.buttonRow}>
              <Pressable style={styles.retryButton} onPress={resetNfcAndRetry}>
                <Text style={styles.buttonText}>Reset</Text>
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
              !scanState.nfcAvailable && styles.scanButtonDisabled,
            ]}
            onPress={handleScan}
            disabled={!scanState.nfcAvailable}
          >
            <Scan size={40} color="#fff" />
            <Text style={styles.scanButtonText}>Tap to Scan Checkpoint</Text>
          </Pressable>
        )}
      </View>

      {lastScan && (
        <View style={styles.lastScanContainer}>
          <Text style={styles.lastScanTitle}>Last Checkpoint</Text>
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

      {scanHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>
            Recent Scans ({scanHistory.length})
          </Text>
          <View style={styles.historyList}>
            {scanHistory.slice(0, 3).map((scan, index) => (
              <View key={scan.id} style={styles.historyItem}>
                <Text style={styles.historyLocation}>{scan.location}</Text>
                <Text style={styles.historyTime}>
                  {formatTime(scan.timestamp)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  statusText: {
    fontSize: 16,
    color: "#4CAF50",
    marginTop: 4,
  },
  nfcStatus: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  scanSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanningContainer: {
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#007AFF",
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
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
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
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
  },
  lastScanContainer: {
    marginTop: 30,
  },
  lastScanTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  lastScanCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  historyContainer: {
    marginTop: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  historyList: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyLocation: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  historyTime: {
    fontSize: 12,
    color: "#666",
  },
});
