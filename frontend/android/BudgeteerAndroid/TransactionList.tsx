import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';

interface TransactionListProps {
  transactions: any[];
  isReversedOrder: boolean;
  deleteTransaction: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isReversedOrder,
  deleteTransaction,
}) => {
  return (
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
  );
};

const styles = StyleSheet.create({
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

export default TransactionList;
