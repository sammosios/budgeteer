import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from './ThemeContext';

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
  const { colors, isDarkMode } = useTheme();
  const styles = StyleSheet.create({
  transactionList: {
    // Styles for the transaction list container
  },
  transactionListItem: {
    backgroundColor: colors.secondaryBg,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 4,
    padding: 10,
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseText: {
    color: colors.accentRed,
    fontWeight: 'bold',
  },
  incomeText: {
    color: colors.accentGreen,
    fontWeight: 'bold',
  },
  noTransactionsText: {
    textAlign: 'center',
    padding: 20,
    color: colors.secondaryText,
  },
  deleteIcon: {
    width: 24,
    height: 24,
  },
});

  return (
    <View style={styles.transactionList}>
      {transactions.length === 0 ? (
        <Text style={styles.noTransactionsText}>No transactions yet. Add one!</Text>
      ) : (
        (isReversedOrder ? [...transactions].reverse() : transactions).map((transaction, index) => (
          <View key={transaction.id || index} style={styles.transactionListItem}>
            <View>
              <Text style={{ color: colors.primaryText }}>{transaction.date}</Text>
              <Text style={{ color: colors.primaryText }}>{transaction.category}</Text>
              <Text style={transaction.type === 'expense' ? styles.expenseText : styles.incomeText}>
                {transaction.type === 'expense' ? '-' : '+'}{transaction.currency}{transaction.amount.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteTransaction(transaction.id)}>
              <Image
                source={isDarkMode ? require('./android/app/src/main/res/drawable/trash_can_dark.png') : require('./android/app/src/main/res/drawable/trash_can.png')}
                style={styles.deleteIcon}
              />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
};

export default TransactionList;
