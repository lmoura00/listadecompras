import React, { useState, useReducer, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

export default function App() {
  const initialState = [];

  const reducer = (state, action) => {
    switch (action.type) {
      case "ADD":
        return [...state, action.item];

      case "CHECK":
        return state.map((item) =>
          item.id === action.id ? { ...item, check: !item.check } : item
        );

      case "REMOVE":
        return state.filter((item) => item.id !== action.id);

      case "CLEAR":
        return [];

      case "LOAD":
        return action.items;

      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const [product, setProduct] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
  }, [state]);

  const saveData = async () => {
    try {
      await AsyncStorage.setItem("shoppingList", JSON.stringify(state));
    } catch (error) {
      console.error("Erro ao salvar dados", error);
    }
  };

  const loadData = async () => {
    try {
      const savedList = await AsyncStorage.getItem("shoppingList");
      if (savedList) {
        dispatch({ type: "LOAD", items: JSON.parse(savedList) });
      }
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    }
  };

  const ShoppingItem = ({ item, onCheck, onDelete }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const handleDelete = () => {
      // Animação para deslizar o item para fora da tela
      Animated.timing(translateX, {
        toValue: -500, // Desliza para a esquerda até sumir
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(() => {
        onDelete(); // Remove o item após a animação
      });
    };

    return (
      <Animated.View
        style={{
          transform: [{ translateX }],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          style={[styles.containerItem, item.check && styles.itemChecked]}
          onPress={onCheck}
        >
          <Text
            style={[styles.itemList, item.check && styles.listItemChecked]}
          >
            {item.title}
          </Text>
        </TouchableOpacity>

       
        <TouchableOpacity onPress={handleDelete} style={styles.deleteIcon}>
          <Icon name="delete" size={30} color="red" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text style={styles.title}>LISTA DE COMPRAS</Text>

        <View style={styles.containerInput}>
          <TextInput
            placeholder="O que vamos comprar hoje?"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={product}
            onChangeText={setProduct}
          />
          <TouchableOpacity
            onPress={() => {
              if (product.trim() === "") return;
              dispatch({
                type: "ADD",
                item: {
                  id: uuid.v4(),
                  title: product,
                  check: false,
                },
              });
              setProduct("");
            }}
            disabled={product.trim() === ""}
            style={[
              styles.addButton,
              product.trim() === "" && styles.addButtonDisabled,
            ]}
          >
            <Icon
              name="add-circle"
              size={50}
              color={product.trim() !== "" ? "#4CAF50" : "#888"}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={state}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ShoppingItem
              item={item}
              onCheck={() => dispatch({ type: "CHECK", id: item.id })}
              onDelete={() => dispatch({ type: "REMOVE", id: item.id })}
            />
          )}
        />

        {state.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => dispatch({ type: "CLEAR" })}
          >
            <Text style={styles.clearButtonText}>Limpar Lista</Text>
          </TouchableOpacity>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: "#1e1e1e",
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 25,
    color: "#b9b9b9",
    fontWeight: "900",
    textAlign: "center",
    marginTop: 25,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#333",
    width: "75%",
    height: 55,
    borderRadius: 8,
    paddingHorizontal: 15,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#555",
  },
  containerInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  addButton: {
    borderRadius: 50,
    overflow: "hidden",
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  containerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#2c2c2c",
    height: 'auto',
    minHeight:60,
    flex: 1, 
  },
  itemList: {
    fontSize: 18,
    color: "#fff",
  },
  listItemChecked: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  itemChecked: {
    backgroundColor: "#3a3a3a",
  },
  deleteIcon: {
    padding: 15,
    marginLeft: 10,
  },
  clearButton: {
    backgroundColor: "red",
    padding: 12,
    alignItems: "center",
    marginVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});