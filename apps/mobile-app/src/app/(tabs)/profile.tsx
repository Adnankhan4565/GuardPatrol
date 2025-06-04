import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { LogOut, User } from "lucide-react-native";
import { useAuthActions } from "@convex-dev/auth/react";

const MOCK_GUARD_DATA = {
  name: "John Smith",
  id: "G-123456",
  shift: "Morning",
  status: "Checked In",
  checkInTime: "09:15 AM",
  location: "Main Building",
};

export default function ProfileScreen() {
  const { signOut } = useAuthActions();

  const handleLogout = async () => {
    try {
      await signOut().then(() => {
        router.push("/login");
      });
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Error Logging Out");
    }
  };

  const handleCheckInOut = () => {
    // Check-in/out functionality will be implemented later
    console.log("Toggling check-in/out status");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={40} color="#007AFF" />
        </View>
        <Text style={styles.name}>{MOCK_GUARD_DATA.name}</Text>
        <Text style={styles.guardId}>ID: {MOCK_GUARD_DATA.id}</Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Shift</Text>
          <Text style={styles.infoValue}>{MOCK_GUARD_DATA.shift}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, styles.statusText]}>
            {MOCK_GUARD_DATA.status}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Check-in Time</Text>
          <Text style={styles.infoValue}>{MOCK_GUARD_DATA.checkInTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{MOCK_GUARD_DATA.location}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.checkButton} onPress={handleCheckInOut}>
          <Text style={styles.checkButtonText}>
            {MOCK_GUARD_DATA.status === "Checked In" ? "Check Out" : "Check In"}
          </Text>
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
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
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#E1F0FF",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  guardId: {
    fontSize: 16,
    color: "#666",
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "#e1e1e1",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  statusText: {
    color: "#4CAF50",
  },
  actions: {
    marginTop: 32,
    gap: 16,
  },
  checkButton: {
    backgroundColor: "#007AFF",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    height: 50,
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
});
