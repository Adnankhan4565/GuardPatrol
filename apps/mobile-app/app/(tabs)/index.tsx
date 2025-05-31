import { View, Text, StyleSheet, Pressable } from "react-native";
import { Scan } from "lucide-react-native";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import LoginScreen from "../(auth)/login";

export default function Index() {
  return (
    <>
      <AuthLoading>
        <Text>Loading...</Text>
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
  const handleScan = () => {
    // NFC scanning functionality will be implemented later
    console.log("Scanning NFC tag...");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, John</Text>
        <Text style={styles.statusText}>Status: Checked In</Text>
      </View>

      <View style={styles.scanSection}>
        <Pressable style={styles.scanButton} onPress={handleScan}>
          <Scan size={40} color="#fff" />
          <Text style={styles.scanButtonText}>Tap to Scan NFC Tag</Text>
        </Pressable>
      </View>

      <View style={styles.lastScanContainer}>
        <Text style={styles.lastScanTitle}>Last Scan</Text>
        <View style={styles.lastScanCard}>
          <Text style={styles.locationText}>Location: Main Entrance</Text>
          <Text style={styles.timeText}>Time: 10:30 AM</Text>
          <Text style={styles.dateText}>Date: Jan 15, 2024</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    marginBottom: 40,
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
  scanSection: {
    flex: 1,
    justifyContent: "center",
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
  scanButtonText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  lastScanContainer: {
    marginTop: 40,
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
  },
  locationText: {
    fontSize: 16,
    color: "#1a1a1a",
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
});
