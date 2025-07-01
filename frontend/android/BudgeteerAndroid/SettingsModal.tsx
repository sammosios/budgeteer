import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from './ThemeContext';

interface SettingsModalProps {
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  currency: string;
  setCurrency: (currency: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettingsModal,
  setShowSettingsModal,
  currency,
  setCurrency,
}) => {
  const { isDarkMode, toggleDarkMode, colors } = useTheme();

  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
    },
    modalView: {
      margin: 20,
      backgroundColor: colors.primaryBg,
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
      color: colors.primaryText,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 15,
    },
    settingText: {
      fontSize: 16,
      color: colors.primaryText,
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
      color: colors.primaryText,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 4,
      backgroundColor: colors.accentBlue,
      marginHorizontal: 5,
    },
    buttonClose: {
      backgroundColor: colors.accentBlue,
      marginTop: 15,
    },
    textStyle: {
      color: colors.primaryText,
      fontWeight: 'bold',
      textAlign: 'center',
      fontSize: 14,
    },
  });

  return (
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

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Dark Mode</Text>
            <Switch
              trackColor={{ false: colors.sliderBg, true: colors.accentBlue }}
              thumbColor={isDarkMode ? colors.sliderBeforeBg : colors.sliderBeforeBg}
              ios_backgroundColor={colors.sliderBg}
              onValueChange={toggleDarkMode}
              value={isDarkMode}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Currency:</Text>
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
  );
};

export default SettingsModal;
