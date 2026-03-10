import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth, db } from "../../../config/firebaseConfig";

export default function MozoDashboard() {
  const [mesas, setMesas] = useState([]);
  const [nombreMozo, setNombreMozo] = useState("Mozo");

  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const nombre = await AsyncStorage.getItem("usuarioNombre");

      if (nombre) setNombreMozo(nombre);
    };

    loadUser();

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

  const handleLogout = async () => {
    try {
      await signOut(auth);

      await AsyncStorage.removeItem("usuarioNombre");
      await AsyncStorage.removeItem("usuarioRol");

      router.replace("/auth/login");
    } catch (error) {
      console.log("Error al cerrar sesión", error);
    }
  };

  const renderMesa = ({ item }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.mesaTitulo}>Mesa {item.numero}</Text>

        <View
          style={[
            styles.estado,
            item.estado === "libre" && styles.libre,
            item.estado === "ocupada" && styles.ocupada,
            item.estado === "atendida" && styles.atendida,
          ]}
        >
          <Text>{item.estado}</Text>
        </View>

        {item.estado === "libre" && (
          <TouchableOpacity
            style={styles.btnNuevo}
            onPress={() => router.push(`/mozo/pedido/${item.numero}`)}
          >
            <Text style={styles.btnText}>Nuevo pedido</Text>
          </TouchableOpacity>
        )}

        {item.estado === "ocupada" && (
          <TouchableOpacity
            style={styles.btnVer}
            onPress={() => router.push(`/mozo/ver/${item.numero}`)}
          >
            <Text style={styles.btnText}>Ver pedido</Text>
          </TouchableOpacity>
        )}

        {item.estado === "atendida" && (
          <TouchableOpacity
            style={styles.btnAtendido}
            onPress={() => router.push(`/mozo/ver/${item.numero}`)}
          >
            <Text>Pedido listo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#cd8350" }}>
      <StatusBar style="light" backgroundColor="#cd8350" />

      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={{ color: "white" }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.titulo}>Mesas del Restaurante</Text>

        <Text style={styles.usuario}>Usuario: {nombreMozo}</Text>

        <FlatList
          data={mesas}
          renderItem={renderMesa}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#cd8350",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8efe9",
  },

  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#a26433",
    marginBottom: 4,
  },

  usuario: {
    marginBottom: 20,
  },

  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    margin: 8,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  mesaTitulo: {
    fontSize: 18,
    color: "#885f56",
    marginBottom: 10,
  },

  estado: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },

  libre: {
    backgroundColor: "#d1f5d3",
  },

  ocupada: {
    backgroundColor: "#e5e5e5",
  },

  atendida: {
    backgroundColor: "#fff3c4",
  },

  btnNuevo: {
    backgroundColor: "#cd8350",
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
    borderRadius: 8,
  },

  btnVer: {
    backgroundColor: "#a26433",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  btnAtendido: {
    backgroundColor: "#f5d76e",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  btnText: {
    color: "white",
  },
});
