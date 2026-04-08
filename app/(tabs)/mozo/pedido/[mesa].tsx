import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "../../../../config/firebaseConfig";
import menuData from "../../../../data/menu.json";

export default function PedidoNuevo() {
  const { mesa } = useLocalSearchParams();
  const mesaId = Number(mesa);

  const router = useRouter();

  const [pedidoId, setPedidoId] = useState<any>(null);
  const [pedido, setPedido] = useState<any>(null);

  const [showModal, setShowModal] = useState(false);
  const [ticket, setTicket] = useState("");
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

  const [nombreMozo, setNombreMozo] = useState("Mozo");
  const [rolMozo, setRolMozo] = useState("mozo");

  const menuImages: any = {
    "seco.png": require("../../../../assets/menu/seco.png"),
    "arrozconpollo.jpg": require("../../../../assets/menu/arrozconpollo.jpg"),
    "ceviche.jpg": require("../../../../assets/menu/ceviche.jpg"),
    "chicharronpescado.jpg": require("../../../../assets/menu/chicharronpescado.jpg"),
    "toyo.jpg": require("../../../../assets/menu/toyo.jpg"),
    "caldo.jpg": require("../../../../assets/menu/caldo.jpg"),
    "chichamorada.jpg": require("../../../../assets/menu/chichamorada.jpg"),
    "limonada.jpg": require("../../../../assets/menu/limonada.jpg"),
  };

  // =================================
  // CARGAR MOZO
  // =================================

  useEffect(() => {
    const cargarMozo = async () => {
      const nombre = await AsyncStorage.getItem("usuarioNombre");
      const rol = await AsyncStorage.getItem("usuarioRol");

      if (nombre) setNombreMozo(nombre);
      if (rol) setRolMozo(rol);
    };

    cargarMozo();
  }, []);

  // =================================
  // CREAR O CARGAR PEDIDO
  // =================================

  useEffect(() => {
    const crearOCargar = async () => {
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

        const snap = await getDocs(q);

        if (!snap.empty) {
          const d = snap.docs[0];
          const data = d.data();

          setPedido({
            id: d.id,
            ...data,
            items: Array.isArray(data.items) ? data.items : [],
          });

          setPedidoId(d.id);
          return;
        }

        const nuevo = {
          mesa: mesaId,
          mozo: nombreMozo,
          rolMozo,
          estado: "pendiente",
          fecha: serverTimestamp(),
          items: [],
          total: 0,
        };

        const ref = await addDoc(collection(db, "pedidos"), nuevo);

        setPedido({
          id: ref.id,
          ...nuevo,
          items: [],
        });

        setPedidoId(ref.id);
      } catch (e) {
        console.log("Error creando pedido", e);
      }
    };

    crearOCargar();
  }, [mesaId, nombreMozo]);

  // =================================
  // ACTUALIZAR TOTAL
  // =================================

  const actualizarTotal = async (items: any) => {
    const total = items.reduce((acc: any, it: any) => acc + it.subtotal, 0);

    await updateDoc(doc(db, "pedidos", pedidoId), { total });

    setPedido((prev: any) => ({
      ...prev,
      total,
    }));
  };

  // =================================
  // AGREGAR ITEM
  // =================================

  const agregarItem = async (item: any) => {
    if (!pedidoId || !pedido) return;

    let nuevosItems;

    const existe = pedido.items.find((it: any) => it.producto === item.nombre);

    if (existe) {
      nuevosItems = pedido.items.map((it: any) =>
        it.producto === item.nombre
          ? {
              ...it,
              cantidad: it.cantidad + 1,
              subtotal: (it.cantidad + 1) * it.precio,
            }
          : it,
      );
    } else {
      nuevosItems = [
        ...pedido.items,
        {
          producto: item.nombre,
          cantidad: 1,
          precio: item.precio,
          subtotal: item.precio,
        },
      ];
    }

    await updateDoc(doc(db, "pedidos", pedidoId), { items: nuevosItems });

    await actualizarTotal(nuevosItems);

    setPedido((prev: any) => ({
      ...prev,
      items: nuevosItems,
    }));
  };

  // =================================
  // CAMBIAR CANTIDAD
  // =================================

  const cambiarCantidad = async (producto: any, accion: any) => {
    let nuevosItems = pedido.items.map((it: any) => {
      if (it.producto === producto) {
        const nuevaCantidad =
          accion === "sumar" ? it.cantidad + 1 : it.cantidad - 1;

        return {
          ...it,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * it.precio,
        };
      }

      return it;
    });

    nuevosItems = nuevosItems.filter((it: any) => it.cantidad > 0);

    await updateDoc(doc(db, "pedidos", pedidoId), { items: nuevosItems });

    await actualizarTotal(nuevosItems);

    setPedido((prev: any) => ({
      ...prev,
      items: nuevosItems,
    }));
  };

  // =================================
  // ELIMINAR ITEM
  // =================================

  const eliminarItem = async (producto: any) => {
    const nuevosItems = pedido.items.filter(
      (it: any) => it.producto !== producto,
    );

    await updateDoc(doc(db, "pedidos", pedidoId), { items: nuevosItems });

    await actualizarTotal(nuevosItems);

    setPedido((prev: any) => ({
      ...prev,
      items: nuevosItems,
    }));
  };

  // =================================
  // GENERAR TICKET
  // =================================

  const generarTicket = () => {
    let texto = "";

    texto += "========== TICKET ==========\n";
    texto += `Mesa: ${mesaId}\n`;
    texto += `Mozo: ${nombreMozo}\n\n`;

    pedido.items.forEach((it: any) => {
      texto += `${it.producto} x ${it.cantidad} → S/ ${it.subtotal}\n`;
    });

    texto += "\nTotal: S/ " + pedido.total + "\n";
    texto += "============================";

    setTicket(texto);
  };

  // =================================
  // ENVIAR A COCINA
  // =================================

  const handleEnviarACocina = async () => {
    if (!pedido || pedido.items.length === 0) {
      Alert.alert("Agrega al menos un producto antes de enviar.");
      return;
    }

    generarTicket();

    await updateDoc(doc(db, "pedidos", pedidoId), {
      estado: "en cocina",
    });

    await updateDoc(doc(db, "mesas", "mesa" + mesaId), {
      estado: "ocupada",
    });

    setShowModal(false);
    setPedidoEnviado(true);

    const chatRef = collection(db, "chats", `mesa_${mesaId}`, "mensajes");

    let resumen = "Pedido enviado a cocina\n\n";

    pedido.items.forEach((it: any) => {
      resumen += `${it.producto} x ${it.cantidad} → S/ ${it.subtotal}\n`;
    });

    resumen += `\nTotal: S/ ${pedido.total}`;

    await addDoc(chatRef, {
      texto: resumen,
      usuario: nombreMozo,
      rol: "mozo",
      tipo: "sistema",
      timestamp: serverTimestamp(),
    });
  };

  if (!pedido) {
    return (
      <View style={styles.loading}>
        <Text>Creando pedido...</Text>
      </View>
    );
  }

  const total = pedido.total ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#cd8350" }}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/mozo")}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesa {mesaId}</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.menuGrid}>
          {menuData.map((p: any, index: number) => (
            <View key={index} style={styles.card}>
              <Image source={menuImages[p.img]} style={styles.img} />

              <Text style={styles.nombre}>{p.nombre}</Text>

              <Text style={styles.precio}>S/ {p.precio}</Text>

              <TouchableOpacity
                onPress={() => agregarItem(p)}
                style={styles.btnAgregar}
              >
                <Text>Agregar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.itemsTitulo}>Items añadidos</Text>

        {pedido.items.map((it: any, idx: number) => (
          <View key={idx} style={styles.item}>
            <View>
              <Text style={{ fontWeight: "600" }}>{it.producto}</Text>

              <View style={styles.cantidad}>
                <TouchableOpacity
                  onPress={() => cambiarCantidad(it.producto, "restar")}
                  style={styles.btnCant}
                >
                  <Text>–</Text>
                </TouchableOpacity>

                <Text style={{ marginHorizontal: 10 }}>{it.cantidad}</Text>

                <TouchableOpacity
                  onPress={() => cambiarCantidad(it.producto, "sumar")}
                  style={styles.btnCant}
                >
                  <Text>+</Text>
                </TouchableOpacity>
              </View>

              <Text>Subtotal: S/ {it.subtotal}</Text>
            </View>

            <TouchableOpacity
              onPress={() => eliminarItem(it.producto)}
              style={styles.btnEliminar}
            >
              <Text style={{ color: "white" }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.totalBox}>
          <Text style={styles.totalText}>Total: S/ {total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={styles.btnConfirmar}
        >
          <Text style={{ color: "white" }}>Confirmar pedido</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL RESUMEN */}

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Resumen del pedido</Text>

            {pedido.items.map((it: any, i: number) => (
              <Text key={i}>
                {it.producto} x {it.cantidad} — S/ {it.subtotal}
              </Text>
            ))}

            <Text style={styles.modalTotal}>Total: S/ {total.toFixed(2)}</Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.btnEditar}
              >
                <Text>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleEnviarACocina}
                style={styles.btnEnviar}
              >
                <Text style={{ color: "white" }}>Enviar a cocina</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL FINAL */}

      <Modal
        visible={pedidoEnviado}
        transparent
        animationType="fade"
        onRequestClose={() => setPedidoEnviado(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pedido enviado ✔</Text>

            <Text style={{ marginBottom: 20 }}>
              El pedido ha sido enviado a cocina.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setPedidoEnviado(false);
                router.replace("/(tabs)/mozo");
              }}
              style={styles.btnOK}
            >
              <Text style={{ color: "white" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/mozo/chat")}
      >
        <Text style={{ color: "white", fontSize: 20 }}>💬</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#cd8350",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
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

  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    backgroundColor: "white",
    width: "48%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },

  img: {
    width: "100%",
    height: 80,
    borderRadius: 8,
  },

  nombre: {
    marginTop: 6,
  },

  precio: {
    fontWeight: "600",
    color: "#885f56",
  },

  btnAgregar: {
    backgroundColor: "#cd8350",
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },

  itemsTitulo: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
    color: "#a26433",
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  cantidad: {
    flexDirection: "row",
    alignItems: "center",
  },

  btnCant: {
    backgroundColor: "#ddd",
    paddingHorizontal: 8,
    borderRadius: 4,
  },

  btnEliminar: {
    backgroundColor: "#e74c3c",
    padding: 6,
    borderRadius: 6,
    alignSelf: "center",
  },

  totalBox: {
    borderWidth: 2,
    borderColor: "#a26433",
    padding: 14,
    borderRadius: 10,
    alignItems: "flex-end",
    marginTop: 10,
  },

  totalText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#a26433",
  },

  btnConfirmar: {
    backgroundColor: "#885f56",
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
    alignItems: "center",
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    width: 300,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },

  modalTotal: {
    marginTop: 10,
    fontWeight: "bold",
  },

  modalBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  btnEditar: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 6,
  },

  btnEnviar: {
    backgroundColor: "#4a8f4f",
    padding: 10,
    borderRadius: 6,
  },

  btnOK: {
    backgroundColor: "#cd8350",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
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
