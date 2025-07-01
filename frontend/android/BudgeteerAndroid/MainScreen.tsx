import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';

const API_URL = 'http://localhost:3000'; // Assuming backend is accessible from mobile

interface MainScreenProps {
  logoutUser: () => void;
  setShowSettingsModal: (show: boolean) => void;
  isReversedOrder: boolean;
  setIsReversedOrder: (isReversed: boolean) => void;
  amount: string;
  setAmount: (amount: string) => void;
  category: string;
  setCategory: (category: string) => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
  transactions: any[];
  fetchTransactions: () => void;
  currency: string;
}

const MainScreen: React.FC<MainScreenProps> = ({
  logoutUser,
  setShowSettingsModal,
  isReversedOrder,
  setIsReversedOrder,
  amount,
  setAmount,
  category,
  setCategory,
  errorMessage,
  setErrorMessage,
  transactions,
  fetchTransactions,
  currency,
}) => {
  const amountInputRef = useRef(null);

  const getToken = async () => {
    // For simplicity, using a basic in-memory token.
    // In a real app, use AsyncStorage or similar for persistent storage.
    return global.accessToken;
  };

  const addTransaction = async (type: 'expense' | 'income') => {
    const token = await getToken();
    if (!token) {
      setErrorMessage('Please log in to add transactions.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      setErrorMessage('Please enter a valid amount (cannot be zero).');
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
        setAmount('0');
        setCategory('');
        fetchTransactions(); // Refresh the list
      } else if (response.status === 401 || response.status === 403) {
        setErrorMessage('Session Expired: Please log in again.');
        logoutUser();
      } else {
        const errorData = await response.json();
        setErrorMessage(`Failed to add transaction: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      setErrorMessage('Failed to add transaction.');
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    const token = await getToken();
    if (!token) {
      setErrorMessage('Please log in to delete transactions.');
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
        setErrorMessage('Session Expired: Please log in again.');
        logoutUser();
      } else {
        const errorData = await response.json();
        setErrorMessage(`Failed to delete transaction: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setErrorMessage('Failed to delete transaction.');
    }
  };

  return (
    <View style={styles.appSection}>
      <View style={styles.topButtonsContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logoutUser}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettingsModal(true)}>
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputSection}>
        {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
        <TouchableOpacity onPress={() => amountInputRef.current.focus()}>
          <Text style={styles.amountDisplay}>{parseFloat(amount).toFixed(2)}</Text>
        </TouchableOpacity>
        <TextInput
          ref={amountInputRef}
          style={styles.hiddenInput}
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
          <TouchableOpacity style={styles.quickAddButton} onPress={() => setAmount(prevAmount => (parseFloat(prevAmount) + 5).toString())}>
            <Text style={styles.quickAddButtonText}>+5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAddButton} onPress={() => setAmount(prevAmount => (parseFloat(prevAmount) + 10).toString())}>
            <Text style={styles.quickAddButtonText}>+10</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAddButton} onPress={() => setAmount(prevAmount => (parseFloat(prevAmount) + 20).toString())}>
            <Text style={styles.quickAddButtonText}>+20</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAddButton} onPress={() => setAmount(prevAmount => (parseFloat(prevAmount) + 50).toString())}>
            <Text style={styles.quickAddButtonText}>+50</Text>
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

      <View style={styles.transactionsHeader}>
        <Text style={styles.subtitle}>Transactions</Text>
        <TouchableOpacity style={styles.sortButton} onPress={() => setIsReversedOrder(!isReversedOrder)}>
          <Text style={styles.sortButtonText}>Sort {isReversedOrder ? 'Newest First' : 'Oldest First'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.transactionList}>
        {transactions.length === 0 ? (
          <Text style={styles.noTransactionsText}>No transactions yet. Add one!</Text>
        ) : (
          (isReversedOrder ? [...transactions].reverse() : transactions).map((transaction, index) => (
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
  );
};

const styles = StyleSheet.create({
  appSection: {
    // Styles for the main app section
  },
  topButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  logoutButton: {
    flex: 1,
    padding: 6,
    backgroundColor: 'transparent',
    borderColor: '#dc3545',
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    marginRight: 5,
  },
  settingsButton: {
    flex: 1,
    padding: 6,
    backgroundColor: 'transparent',
    borderColor: '#007bff',
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    marginLeft: 5,
  },
  sortButton: {
    padding: 5,
    backgroundColor: '#6c757d',
    borderRadius: 4,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  sortButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  inputSection: {
    gap: 10,
    marginBottom: 20,
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
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
  quickAddButtonText: {
    color: '#333',
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
  buttonText: {
    color: '#000',
    fontSize: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 15,
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
  deleteIcon: {
    width: 24,
    height: 24,
  },
});

export default MainScreen;
