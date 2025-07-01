import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from './ThemeContext';

const API_URL = 'http://localhost:3000'; // Assuming backend is accessible from mobile

interface AuthScreenProps {
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setErrorMessage: (message: string) => void;
  setToken: (token: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ setIsLoggedIn, setErrorMessage, setToken }) => {
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  

  const registerUser = async () => {
    if (!username || !password) {
      setErrorMessage('Please enter both username and password.');
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
        Alert.alert('Success', data.message); // Keep Alert for registration success
        loginUser(); // Optionally, log in the user immediately after registration
      } else {
        setErrorMessage(`Registration Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setErrorMessage('Registration failed.');
    }
  };

  const loginUser = async () => {
    if (!username || !password) {
      setErrorMessage('Please enter both username and password.');
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
        setErrorMessage(`Login Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrorMessage('Login failed.');
    }
  };

  const styles = StyleSheet.create({
  loginSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.primaryText,
    marginBottom: 15,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 4,
    fontSize: 16,
    backgroundColor: colors.secondaryBg,
    color: colors.primaryText,
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
    backgroundColor: colors.accentBlue,
    marginHorizontal: 5,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 14,
  },
});


  return (
    <View style={styles.loginSection}>
      {/* <Text style={styles.subtitle}>Login / Register</Text> */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholderTextColor={colors.secondaryText}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colors.secondaryText}
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
  );
};


export default AuthScreen;
