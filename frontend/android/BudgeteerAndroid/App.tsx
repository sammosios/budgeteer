import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'http://localhost:3000'; // Assuming backend is accessible from mobile

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [transactions, setTransactions] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    // Check for token on app start
    const checkToken = async () => {
      const token = await getToken();
      if (token) {
        setIsLoggedIn(true);
        // In a real app, you'd validate the token with the backend here
      }
    };
    checkToken();
  }, []);

  const getToken = async () => {
    // For simplicity, using a basic in-memory token.
    // In a real app, use AsyncStorage or similar for persistent storage.
    return global.accessToken;
  };

  const setToken = (token: string) => {
    global.accessToken = token;
  };

  const removeToken = () => {
    global.accessToken = null;
  };

  const updateUI = () => {
    // This function is primarily for the web app's DOM manipulation.
    // In React Native, state changes will re-render the UI.
    // We'll rely on isLoggedIn state for conditional rendering.
  };

  const registerUser = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', data.message);
        loginUser(); // Optionally, log in the user immediately after registration
      } else {
        Alert.alert('Registration Failed', data.error);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      Alert.alert('Error', 'Registration failed.');
    }
  };

  const loginUser = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setToken(data.accessToken);
        setIsLoggedIn(true);
      } else {
        Alert.alert('Login Failed', data.error);
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Error', 'Login failed.');
    }
  };

  const logoutUser = () => {
    removeToken();
    setIsLoggedIn(false);
    // Clear transactions or other app-specific state here
  };

  const fetchTransactions = async () => {
    const token = await getToken();
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else if (response.status === 401 || response.status === 403) {
        Alert.alert('Session Expired', 'Session expired or unauthorized. Please log in again.');
        logoutUser();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', `Failed to fetch transactions: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to fetch transactions.');
    }
  };

  const addTransaction = async (type: 'expense' | 'income') => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'Please log in to add transactions.');
      setIsLoggedIn(false);
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    const finalCategory = category.trim() === '' ? 'Misc' : category.trim();

    const newTransaction = {
      date: new Date().toISOString().split('T')[0],
      amount: parsedAmount,
      category: finalCategory,
      type: type,
      currency,
    };

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newTransaction),
      });

      if (response.ok) {
        setAmount('');
        setCategory('');
        fetchTransactions(); // Refresh the list
      } else if (response.status === 401 || response.status === 403) {
        Alert.alert('Session Expired', 'Session expired or unauthorized. Please log in again.');
        logoutUser();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', `Failed to add transaction: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction.');
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'Please log in to delete transactions.');
      setIsLoggedIn(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchTransactions(); // Refresh the list
      } else if (response.status === 401 || response.status === 403) {
        Alert.alert('Session Expired', 'Session expired or unauthorized. Please log in again.');
        logoutUser();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', `Failed to delete transaction: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction.');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchTransactions();
    }
  }, [isLoggedIn]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>Budgeteer</Text>

          {!isLoggedIn ? (
            <View style={styles.loginSection}>
              <Text style={styles.subtitle}>Login / Register</Text>
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <View style={styles.authButtons}>
                <TouchableOpacity style={styles.button} onPress={loginUser}>
                  <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={registerUser}>
                  <Text style={styles.buttonText}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.appSection}>
              <TouchableOpacity style={styles.logoutButton} onPress={logoutUser}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettingsModal(true)}>
                <Text style={styles.buttonText}>Settings</Text>
              </TouchableOpacity>
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.input}
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Category (e.g., Food, Salary)"
                  value={category}
                  onChangeText={setCategory}
                />

                <View style={styles.quickAddButtons}>
                  <TouchableOpacity style={styles.quickAddButton} onPress={() => setAmount('5')}>
                    <Text style={styles.quickAddButtonText}>5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddButton} onPress={() => setAmount('10')}>
                    <Text style={styles.quickAddButtonText}>10</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddButton} onPress={() => setAmount('20')}>
                    <Text style={styles.quickAddButtonText}>20</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAddButton} onPress={() => setAmount('50')}>
                    <Text style={styles.quickAddButtonText}>50</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[styles.typeButton, { backgroundColor: 'red', borderColor: 'red' }]}
                    onPress={() => {
                      addTransaction('expense');
                    }}
                  >
                    <Text style={[styles.buttonText, { color: 'white' }]}>Expense</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, { backgroundColor: 'green', borderColor: 'green' }]}
                    onPress={() => {
                      addTransaction('income');
                    }}
                  >
                    <Text style={[styles.buttonText, { color: 'white' }]}>Income</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Modal
                animationType="slide"
                transparent={true}
                visible={showSettingsModal}
                onRequestClose={() => {
                  setShowSettingsModal(!showSettingsModal);
                }}
              >
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>User Settings</Text>
                    <View style={styles.currencySelector}>
                      <Text>Currency:</Text>
                      <Picker
                        selectedValue={currency}
                        style={styles.picker}
                        onValueChange={(itemValue) => setCurrency(itemValue)}
                      >
                        <Picker.Item label="EUR" value="EUR" />
                        <Picker.Item label="SEK" value="SEK" />
                        <Picker.Item label="USD" value="USD" />
                      </Picker>
                    </View>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonClose]}
                      onPress={() => setShowSettingsModal(!showSettingsModal)}
                    >
                      <Text style={styles.textStyle}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              <Text style={styles.subtitle}>Transactions</Text>
              <View style={styles.transactionList}>
                {transactions.length === 0 ? (
                  <Text style={styles.noTransactionsText}>No transactions yet. Add one!</Text>
                ) : (
                  transactions.map((transaction, index) => (
                    <View key={transaction.id || index} style={styles.transactionListItem}>
                      <View>
                        <Text>{transaction.date}</Text>
                        <Text>{transaction.category}</Text>
                        <Text style={transaction.type === 'expense' ? styles.expenseText : styles.incomeText}>
                          {transaction.type === 'expense' ? '-' : '+'}{transaction.currency}{transaction.amount.toFixed(2)}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteTransaction(transaction.id)}>
                        <Image source={require('./android/app/src/main/res/drawable/trash_can.png')} style={styles.deleteIcon} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  scrollView: {
    backgroundColor: '#f4f4f4',
  },
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    margin: 20,
    minHeight: '90%', // Adjust as needed
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  loginSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    fontSize: 16,
  },
  authButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    backgroundColor: '#007bff',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#dc3545',
    borderRadius: 4,
    alignItems: 'center',
  },
  appSection: {
    // Styles for the main app section
  },
  inputSection: {
    gap: 10,
    marginBottom: 20,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  quickAddButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  picker: {
    flex: 1,
    height: 50,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  
  transactionList: {
    // Styles for the transaction list container
  },
  transactionListItem: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseText: {
    color: 'red',
    fontWeight: 'bold',
  },
  incomeText: {
    color: 'green',
    fontWeight: 'bold',
  },
  noTransactionsText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  deleteButtonText: {
    color: 'red',
    fontWeight: 'bold',
  },
  deleteIcon: {
    width: 24,
    height: 24,
  },
  settingsButton: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#007bff',
    borderRadius: 4,
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
    marginTop: 15,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButtonText: {
    color: 'red',
    fontWeight: 'bold',
  },
});

export default App;