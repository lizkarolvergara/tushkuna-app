import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { db } from "../../../../config/firebaseConfig";

import AsyncStorage from "@react-native-async-storage/async-storage";

type Mensaje = {
  id: string;
  texto: string;
  usuario: string;
  rol: string;
  timestamp: any;
};

export default function ChatMesa() {
  const { mesa } = useLocalSearchParams();
  const router = useRouter();

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [usuario, setUsuario] = useState("mozo");
  const [rol, setRol] = useState("");

  const pantallaMontada = useRef(false);
  const rolRef = useRef("");

  // 🔹 Cargar nombre de usuario
  useEffect(() => {
    const loadUser = async () => {
      const nombre = await AsyncStorage.getItem("usuarioNombre");
      if (nombre) setUsuario(nombre);
    };
    loadUser();
  }, []);

  // 🔹 Cargar rol
  useEffect(() => {
    const loadRol = async () => {
      const r = await AsyncStorage.getItem("usuarioRol");
      if (r) {
        setRol(r);
        rolRef.current = r;
      }
    };
    loadRol();
  }, []);

  // 🔹 Escuchar mensajes
  useEffect(() => {
    if (!mesa) return;

    const ref = collection(db, "chats", `mesa_${mesa}`, "mensajes");
    const q = query(ref, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Mensaje[];

      setMensajes(data);
    });

    return () => unsubscribe();
  }, [mesa]);

  // 🔹 Controlar si el mozo está en pantalla
  useEffect(() => {
    pantallaMontada.current = true;
    return () => {
      pantallaMontada.current = false;
    };
  }, []);

  // 🔹 Marcar como leído
  const marcarLeido = async () => {
    if (!mesa || !rolRef.current || !pantallaMontada.current) return;

    await updateDoc(doc(db, "mesas", "mesa" + mesa), {
      [`leido_${rolRef.current}`]: serverTimestamp(),
    });
  };

  // 🔹 Disparar marcarLeido solo cuando llegan mensajes nuevos
  useEffect(() => {
    if (mensajes.length > 0 && rolRef.current) {
      marcarLeido();
    }
  }, [mensajes]);

  // 🔹 Enviar mensaje
  const enviarMensaje = async () => {
    if (!texto.trim()) return;

    const chatRef = collection(db, "chats", `mesa_${mesa}`, "mensajes");

    await addDoc(chatRef, {
      texto,
      usuario,
      rol: "mozo",
      timestamp: serverTimestamp(),
    });

    await updateDoc(doc(db, "mesas", "mesa" + mesa), {
      ultimoMensaje: serverTimestamp(),
    });

    setTexto("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#cd8350" }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/mozo/chat")}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mesa {mesa}</Text>

        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <FlatList
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const esMio = item.usuario === usuario;

            return (
              <View
                style={[
                  styles.msgContainer,
                  esMio ? styles.alignRight : styles.alignLeft,
                ]}
              >
                <Text style={styles.usuario}>{item.usuario}</Text>

                <View
                  style={[
                    styles.bubble,
                    esMio ? styles.bubbleMio : styles.bubbleOtro,
                  ]}
                >
                  <View style={styles.row}>
                    <Text style={esMio ? styles.textoMio : styles.textoOtro}>
                      {item.texto}
                    </Text>

                    <Text style={styles.hora}>
                      {item.timestamp?.toDate?.().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe un mensaje..."
            style={styles.input}
          />

          <TouchableOpacity onPress={enviarMensaje} style={styles.btn}>
            <Text style={{ color: "white" }}>Enviar</Text>
          </TouchableOpacity>
        </View>
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
    padding: 10,
    backgroundColor: "#f8efe9",
  },

  msgContainer: {
    marginBottom: 14,
    maxWidth: "80%",
  },

  alignRight: {
    alignSelf: "flex-end",
  },

  alignLeft: {
    alignSelf: "flex-start",
  },

  usuario: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
  },

  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },

  bubbleMio: {
    backgroundColor: "#cd8350",
    borderTopRightRadius: 4,
  },

  bubbleOtro: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },

  textoMio: {
    color: "white",
    flexShrink: 1,
  },

  textoOtro: {
    color: "black",
    flexShrink: 1,
  },

  hora: {
    fontSize: 10,
    color: "#777",
    marginLeft: 6,
  },

  inputContainer: {
    flexDirection: "row",
    marginTop: 10,
  },

  input: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
  },

  btn: {
    backgroundColor: "#a26433",
    padding: 10,
    marginLeft: 5,
    borderRadius: 8,
    justifyContent: "center",
  },
});
