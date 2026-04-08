import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../../config/firebaseConfig";

export default function ChatList() {
  const [mesas, setMesas] = useState<any[]>([]);
  const [rol, setRol] = useState("");
  const router = useRouter();

  // 🔹 Escuchar mesas
  useEffect(() => {
    const ref = collection(db, "mesas");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => a.numero - b.numero);

      setMesas(data);
    });

    return () => unsubscribe();
  }, []);

  //mensajes
  useEffect(() => {
    const loadUser = async () => {
      const r = await AsyncStorage.getItem("usuarioRol");
      if (r) setRol(r);
    };

    loadUser();
  }, []);

  // 🔹 Render item con notificación
  const renderItem = ({ item }: any) => {
    const tieneNoLeidos =
      item.ultimoMensaje &&
      (!item[`leido_${rol}`] ||
        item.ultimoMensaje.seconds > item[`leido_${rol}`].seconds);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/mozo/chat/${item.numero}`)}
      >
        <View style={styles.row}>
          {tieneNoLeidos && <View style={styles.dot} />}
          <Text style={styles.text}>Mesa {item.numero}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#cd8350" }}>
      <StatusBar style="light" backgroundColor="#cd8350" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/mozo")}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chats por Mesa</Text>

        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <FlatList
          data={mesas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#cd8350",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },

  back: {
    color: "white",
    fontSize: 20,
  },

  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8efe9",
  },

  card: {
    backgroundColor: "#cd8350",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#8B1E3F",
    marginRight: 8,
  },

  text: {
    color: "white",
    fontSize: 16,
  },
});
