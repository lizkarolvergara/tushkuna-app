import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../../config/firebaseConfig";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PedidoListo() {
  const { mesa } = useLocalSearchParams();
  const mesaId = parseInt(mesa as string);

  const [pedido, setPedido] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const q = query(
          collection(db, "pedidos"),
          where("mesa", "==", mesaId),
          where("estado", "in", [
            "pendiente",
            "en cocina",
            "preparando",
            "listo",
          ]),
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          Alert.alert("No hay pedidos activos.");
          router.replace("/mozo");
          return;
        }

        const pedidos = snapshot.docs
          .map((doc) => {
            const data = doc.data();

            return {
              id: doc.id,
              ...data,
              fecha: data.fecha || { seconds: 0 },
              items: Array.isArray(data.items) ? data.items : [],
            };
          })
          .sort((a, b) => b.fecha.seconds - a.fecha.seconds);

        setPedido(pedidos[0]);
      } catch (error) {
        console.log(error);
        Alert.alert("Error cargando pedido.");
      }
    };

    fetchPedido();
  }, [mesaId]);

  if (!pedido) {
    return (
      <View style={styles.loading}>
        <Text>Buscando pedido...</Text>
      </View>
    );
  }

  const editarPedido = () => {
    if (pedido.estado !== "pendiente") {
      Alert.alert("El pedido ya fue enviado a cocina. No se puede editar.");
      return;
    }

    router.push(`/mozo/pedido/${mesaId}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#cd8350" }}>
      <StatusBar style="light" backgroundColor="#cd8350" />

      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/mozo")}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesa {mesaId}</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.title}>Estado del pedido — Mesa {mesaId}</Text>

        <Text style={styles.mozo}>
          Atendido por:{" "}
          <Text style={{ fontWeight: "bold" }}>{pedido.mozo}</Text>
        </Text>

        {/* ITEMS */}

        <View style={styles.card}>
          {pedido.items.map((it: any, idx: number) => (
            <View key={idx} style={styles.item}>
              <Text>
                {it.producto} x {it.cantidad} — S/ {it.subtotal}
              </Text>
            </View>
          ))}
        </View>

        {/* ESTADOS */}

        {pedido.estado === "pendiente" && (
          <Text style={[styles.estado, { color: "#cfa75c" }]}>
            🕓 Pendiente — No enviado a cocina
          </Text>
        )}

        {pedido.estado === "en cocina" && (
          <Text style={[styles.estado, { color: "#cd8350" }]}>
            👨‍🍳 En cocina
          </Text>
        )}

        {pedido.estado === "preparando" && (
          <Text style={[styles.estado, { color: "#a26433" }]}>
            🔥 En preparación
          </Text>
        )}

        {pedido.estado === "listo" && (
          <Text style={[styles.estado, { color: "#4a8f4f" }]}>
            ✔ Listo para entregar al cliente
          </Text>
        )}

        {/* BOTON EDITAR */}

        <TouchableOpacity
          onPress={editarPedido}
          style={[
            styles.button,
            pedido.estado !== "pendiente" && styles.buttonDisabled,
          ]}
          disabled={pedido.estado !== "pendiente"}
        >
          <Text style={styles.buttonText}>Editar Pedido</Text>
        </TouchableOpacity>
      </ScrollView>
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

  container: {
    flex: 1,
    backgroundColor: "#f8efe9",
    padding: 20,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 6,
    color: "#885f56",
  },

  mozo: {
    fontSize: 16,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },

  item: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },

  estado: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#885f56",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonDisabled: {
    backgroundColor: "#aaa",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },

  back: {
    color: "white",
    fontSize: 20,
  },

  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#a26433",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
