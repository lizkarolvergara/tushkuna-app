import {
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { auth, db } from "../../config/firebaseConfig";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userModal, setUserModal] = useState(false);

  const USERS = [
    { label: "Administrador", email: "admin@tushkuna.com" },
    { label: "Mozo 1", email: "mozo1@tushkuna.com" },
    { label: "Mozo 2", email: "mozo2@tushkuna.com" },
    { label: "Mozo 3", email: "mozo3@tushkuna.com" },
    { label: "Mozo 4", email: "mozo4@tushkuna.com" },
    { label: "Cocina", email: "cocina@tushkuna.com" },
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      const ref = doc(db, "usuarios", uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("Usuario sin rol asignado");
        setLoading(false);
        return;
      }

      const { rol, nombre } = snap.data();

      await AsyncStorage.setItem("usuarioRol", rol);
      await AsyncStorage.setItem("usuarioNombre", nombre);

      if (rol === "admin") router.replace("/admin");
      else if (rol === "cocina") router.replace("/cocina");
      else if (["mozo1", "mozo2", "mozo3", "mozo4"].includes(rol))
        router.replace("/mozo");
      else alert("Rol desconocido");
    } catch (error) {
      console.log(error);
      alert("Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={require("../../assets/logo.jpg")} style={styles.logo} />

        <Text style={styles.title}>Inicia Sesión</Text>

        <Text style={styles.label}>Selecciona tu usuario</Text>

        <Pressable style={styles.input} onPress={() => setUserModal(true)}>
          <Text style={{ color: selectedUser ? "#000" : "#999" }}>
            {selectedUser || "Elegir usuario..."}
          </Text>
        </Pressable>

        <Text style={styles.label}>Correo</Text>

        <TextInput
          style={styles.input}
          placeholder="correo@tushkuna.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Contraseña</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.eye} onPress={() => setShowPass(!showPass)}>
            {showPass ? "🙈" : "👁️"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={userModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={USERS}
              keyExtractor={(item) => item.email}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.userItem}
                  onPress={() => {
                    setSelectedUser(item.label);
                    setEmail(item.email); // EXACTAMENTE como tu web
                    setUserModal(false);
                  }}
                >
                  <Text>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(205,131,80,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "white",
    width: "85%",
    padding: 25,
    borderRadius: 20,
  },

  logo: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    textAlign: "center",
    color: "#a26433",
    marginBottom: 20,
    fontWeight: "bold",
  },

  label: {
    color: "#885f56",
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#cd8350",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cd8350",
    borderRadius: 8,
    marginBottom: 20,
  },

  passwordInput: {
    flex: 1,
    padding: 10,
  },

  eye: {
    paddingHorizontal: 10,
    fontSize: 18,
  },

  button: {
    backgroundColor: "#cd8350",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonDisabled: {
    backgroundColor: "#885f56",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },

  userItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
