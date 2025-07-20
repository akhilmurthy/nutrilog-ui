import { StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";

type Props = React.ComponentProps<typeof TextInput>;

export default function AuthInput(props: Props) {
  return <TextInput mode="flat" style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "transparent",
  },
});
