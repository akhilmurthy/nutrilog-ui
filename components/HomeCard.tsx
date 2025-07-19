import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Avatar, Button, Card, Text } from "react-native-paper";
import { useAuth } from "../context/AuthContext";

export default function HomeCard() {
  const { signOut } = useAuth();
  const [name, setName] = useState("");

  useEffect(() => {
    const user = getAuth().currentUser;
    if (user?.displayName) {
      setName(user.displayName);
    }
  }, []);

  return (
    <Card style={styles.card}>
      <Card.Title
        title={`Welcome${name ? `, ${name}` : ""}! 🎉`}
        left={(props) => (
          <Avatar.Text {...props} label={name ? name[0] : "U"} />
        )}
      />
      <Card.Content>
        <Text variant="bodyMedium" style={styles.text}>
          You’re logged in successfully.
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={signOut}>Sign Out</Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
  },
  text: {
    marginBottom: 12,
  },
});
