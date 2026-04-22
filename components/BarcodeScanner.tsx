import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { BarcodeScanningResult, Camera, CameraView } from 'expo-camera';
import { Food } from '../types/food';
import { apiClient } from '../lib/api';

interface BarcodeScannerProps {
  onFoodScanned: (food: Food) => void;
  onClose: () => void;
  visible: boolean;
}

export default function BarcodeScanner({ onFoodScanned, onClose, visible }: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    setScanned(true);
    console.log(`Bar code with type ${type} and data ${data} has been scanned!`);

    try {
      // Parse the barcode data to get food information
      const foodData = await parseBarcodeToFood(data);
      onFoodScanned(foodData);
      onClose();
    } catch (error) {
      console.error('Error parsing barcode:', error);
      Alert.alert(
        'Scan Error',
        'Could not get food information from this barcode. Please try again or enter manually.',
        [
          { text: 'OK', onPress: () => setScanned(false) }
        ]
      );
    }
  };

  const parseBarcodeToFood = async (barcode: string): Promise<Food> => {
    console.log('Looking up barcode via backend:', barcode);
    
    try {
      // Call our backend API which will query Open Food Facts
      const response = await apiClient.searchFoodByBarcode(barcode);
      console.log('Backend response:', JSON.stringify(response, null, 2));
      
      // For now, let's see what we get back and create a basic Food object
      // We'll adapt this based on what the API returns
      if (response && response.product) {
        const product = response.product;
        const nutriments = product.nutriments || {};
        
        const foodData: Food = {
          name: product.product_name || `Product ${barcode}`,
          calories: Math.round(nutriments['energy-kcal_100g'] || 0),
          protein: Math.round(nutriments['proteins_100g'] || 0),
          carbs: Math.round(nutriments['carbohydrates_100g'] || 0),
          fat: Math.round(nutriments['fat_100g'] || 0),
        };
        
        return foodData;
      } else {
        throw new Error('Product not found in food database');
      }
    } catch (error) {
      console.error('Error calling backend food API:', error);
      throw new Error('Could not retrieve food information');
    }
  };

  if (hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text style={styles.text}>No access to camera</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
          }}
        />
        
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan Food Barcode</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
            <Text style={styles.instruction}>
              Point your camera at a food barcode
            </Text>
          </View>

          <View style={styles.footer}>
            {scanned && (
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.scanAgainButtonText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  instruction: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
  footer: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  scanAgainButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  scanAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});