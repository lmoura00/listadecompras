import React, { useState, useReducer, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import Icon from "react-native-vector-icons/MaterialIcons"; // Importe o ícone
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

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
    const swipeRef = useRef(null);
    const animatedValue = useRef(new Animated.Value(0)).current;
  
    useEffect(() => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: -20, // Move levemente para a esquerda
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0, // Retorna à posição original
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);
  
    return (
      <Swipeable
        ref={swipeRef}
        overshootRight={false}
        friction={2}
        rightThreshold={80} // O usuário precisa deslizar mais de 80px para apagar
        onSwipeableWillOpen={() => {
          onDelete(); // Somente deleta se deslizar completamente
        }}
        renderRightActions={(progress, dragX) => {
          const scale = dragX.interpolate({
            inputRange: [0, 80],
            outputRange: [0, 1], // O botão cresce conforme desliza
            extrapolate: "clamp",
          });
  
          return (
            <View style={styles.swipeDelete}>
              <Animated.View style={{ transform: [{ scale }] }}>
                <Icon name="delete" size={30} color="white" style={{backgroundColor:'black'}} /> 
              </Animated.View>
            </View>
          );
        }}
      >
        <Animated.View style={{ transform: [{ translateX: animatedValue }] }}>
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
        </Animated.View>
      </Swipeable>
    );
  };
  
  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
      <Text style={{fontSize:25, color:'#b9b9b9', fontWeight:"900", textAlign:'center', marginTop:25, marginBottom:5}}>LISTA DE COMPRAS</Text>

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
    height: 60, 
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
  swipeDelete: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 80, // Largura fixa para o botão de exclusão
    height: 60, // Mesma altura que o item da lista
    borderRadius: 8,
  },
  swipeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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