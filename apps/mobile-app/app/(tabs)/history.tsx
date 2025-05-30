import { View, Text, StyleSheet, FlatList } from 'react-native';
import { format } from 'date-fns';

const MOCK_HISTORY = [
  {
    id: '1',
    location: 'Main Entrance',
    timestamp: new Date('2024-01-15T10:30:00'),
    type: 'Scan',
  },
  {
    id: '2',
    location: 'Parking Lot',
    timestamp: new Date('2024-01-15T09:15:00'),
    type: 'Check-in',
  },
  {
    id: '3',
    location: 'Building B',
    timestamp: new Date('2024-01-14T17:45:00'),
    type: 'Check-out',
  },
  // Add more mock data as needed
];

export default function HistoryScreen() {
  const renderItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.location}>{item.location}</Text>
        <Text style={styles.type}>{item.type}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.time}>
          {format(item.timestamp, 'h:mm a')}
        </Text>
        <Text style={styles.date}>
          {format(item.timestamp, 'MMM d, yyyy')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_HISTORY}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  type: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  cardBody: {
    flexDirection: 'row',
    gap: 12,
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
});