import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import AuthScreen from './AuthScreen';
import MainScreen from './MainScreen';
import SettingsModal from './SettingsModal';

const API_URL = 'http://localhost:3000'; // Assuming backend is accessible from mobile

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [amount, setAmount] = useState('0');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [transactions, setTransactions] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isReversedOrder, setIsReversedOrder] = useState(true); // Default to newest on top
  const [errorMessage, setErrorMessage] = useState('');

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

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 3000); // Clear message after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTransactions();
    }
  }, [isLoggedIn]);

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
        setErrorMessage('Session Expired: Please log in again.');
        logoutUser();
      } else {
        const errorData = await response.json();
        setErrorMessage(`Failed to fetch transactions: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setErrorMessage('Failed to fetch transactions.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>Budgeteer</Text>

          {!isLoggedIn ? (
            <AuthScreen setIsLoggedIn={setIsLoggedIn} setErrorMessage={setErrorMessage} />
          ) : (
            <MainScreen
              logoutUser={logoutUser}
              setShowSettingsModal={setShowSettingsModal}
              isReversedOrder={isReversedOrder}
              setIsReversedOrder={setIsReversedOrder}
              amount={amount}
              setAmount={setAmount}
              category={category}
              setCategory={setCategory}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
              transactions={transactions}
              fetchTransactions={fetchTransactions}
              currency={currency}
            />
          )}

          <SettingsModal
            showSettingsModal={showSettingsModal}
            setShowSettingsModal={setShowSettingsModal}
            currency={currency}
            setCurrency={setCurrency}
          />
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
});

export default App;
