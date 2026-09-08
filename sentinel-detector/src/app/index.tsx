import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [spectralReading, setSpectralReading] = useState<number | null>(null);
  const [gasReading, setGasReading] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);

  const startScan = async () => {
    setScanning(true);
    setResult(null);
    setConfidence(null);
    setScanId(null);
    setEvidenceHash(null);

    try {
      // Request GPS permission
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setResult('LOCATION PERMISSION REQUIRED');
        setScanning(false);
        return;
      }

      // Get current GPS location
      const location =
        await Location.getCurrentPositionAsync({});

      const currentLatitude = location.coords.latitude;
      const currentLongitude = location.coords.longitude;

      setLatitude(currentLatitude);
      setLongitude(currentLongitude);

      // Simulated sensor readings
      const spectral = Math.floor(2200 + Math.random() * 600);
      const gas = Math.floor(900 + Math.random() * 900);

      setSpectralReading(spectral);
      setGasReading(gas);

      // Prototype confidence calculation
      const calculatedConfidence = Math.max(
        0,
        Math.min(
          100,
          100 - Math.abs(spectral - 2500) / 50
        )
      );

      setConfidence(Math.round(calculatedConfidence));

      // Create timestamp once so it is part of the evidence
      const scanTimestamp = new Date().toISOString();

      // Generate SHA-256 evidence hash
      const hashInput =
        `${spectral}-${gas}-${currentLatitude}-${currentLongitude}-${scanTimestamp}`;

      const generatedHash =
        await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          hashInput
        );

      setEvidenceHash(generatedHash);

      // Upload complete scan to Supabase
      const { data, error } = await supabase
        .from('scans')
        .insert({
          spectral_reading: spectral,
          gas_reading: gas,
          timestamp: scanTimestamp,
          latitude: currentLatitude,
          longitude: currentLongitude,
          evidence_hash: generatedHash,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        setResult('UPLOAD FAILED — CHECK DATABASE');
        setScanning(false);
        return;
      }

      if (data?.id) {
        setScanId(data.id);
      }

      // Prototype classification
      if (
        calculatedConfidence > 85 &&
        gas > 1000
      ) {
        setResult(
          'PROTOTYPE MATCH — LAB CONFIRMATION REQUIRED'
        );
      } else if (calculatedConfidence > 50) {
        setResult(
          'INCONCLUSIVE — LAB CONFIRMATION REQUIRED'
        );
      } else {
        setResult(
          'NO REFERENCE MATCH — SCREENING ONLY'
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      setResult('SCAN FAILED — CHECK DEVICE');
    }

    setScanning(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            SENTINELGRID
          </Text>

          <Text style={styles.subtitle}>
            FIELD DETECTOR
          </Text>
        </View>

        {/* DEVICE STATUS */}
        <View style={styles.statusCard}>
          <View style={styles.statusDot} />

          <View>
            <Text style={styles.statusTitle}>
              DEVICE ONLINE
            </Text>

            <Text style={styles.statusText}>
              FIELD-DETECTOR-01
            </Text>
          </View>
        </View>

        {/* CHEMBUDDY */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            CHEMBUDDY
          </Text>

          <Text style={styles.cardTitle}>
            Explainable AI Screening
          </Text>

          {result ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                {result}
              </Text>

              {confidence !== null && (
                <Text style={styles.confidenceText}>
                  Confidence: {confidence}%
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.mutedText}>
              Ready for field screening
            </Text>
          )}
        </View>

        {/* SENSOR READINGS */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            SENSOR READINGS
          </Text>

          <View style={styles.readingsRow}>
            <View style={styles.readingBox}>
              <Text style={styles.readingLabel}>
                SPECTRAL
              </Text>

              <Text style={styles.readingValue}>
                {spectralReading ?? '—'}
              </Text>
            </View>

            <View style={styles.readingBox}>
              <Text style={styles.readingLabel}>
                GAS
              </Text>

              <Text style={styles.readingValue}>
                {gasReading ?? '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* START SCAN */}
        <Pressable
          style={[
            styles.scanButton,
            scanning && styles.scanButtonDisabled,
          ]}
          onPress={startScan}
          disabled={scanning}
        >
          <Text style={styles.scanButtonText}>
            {scanning ? 'SCANNING...' : 'START SCAN'}
          </Text>
        </Pressable>

        {/* SCAN ID */}
        {scanId && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>
              SCAN ID
            </Text>

            <Text style={styles.scanId}>
              {scanId}
            </Text>

            <Text style={styles.mutedText}>
              Supabase evidence record created
            </Text>
          </View>
        )}

        {/* GPS */}
        {latitude !== null &&
          longitude !== null && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>
                GPS LOCATION
              </Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  LATITUDE
                </Text>

                <Text style={styles.infoValue}>
                  {latitude.toFixed(6)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  LONGITUDE
                </Text>

                <Text style={styles.infoValue}>
                  {longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}

        {/* EVIDENCE HASH */}
        {evidenceHash && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>
              EVIDENCE HASH
            </Text>

            <Text style={styles.hashText}>
              {evidenceHash}
            </Text>

            <Text style={styles.mutedText}>
              SHA-256 integrity signature
            </Text>
          </View>
        )}

        {/* SYSTEM STATUS */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            SYSTEM STATUS
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              GPS
            </Text>

            <Text style={styles.infoValue}>
              {latitude !== null
                ? 'CONNECTED'
                : 'READY'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              EVIDENCE HASH
            </Text>

            <Text style={styles.infoValue}>
              {evidenceHash
                ? 'GENERATED'
                : 'READY'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              COMMAND LINK
            </Text>

            <Text style={styles.infoValue}>
              CONNECTED
            </Text>
          </View>
        </View>

        {/* NOTICE */}
        <Text style={styles.footer}>
          Sensor values are simulated for
          demonstration. GPS is collected from
          the device. The architecture supports
          future ESP32 sensor integration.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071018',
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 24,
  },

  logo: {
    color: '#E8F7FF',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 2,
  },

  subtitle: {
    color: '#7FA6B8',
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 4,
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1B25',
    borderWidth: 1,
    borderColor: '#1D3543',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#45D483',
    marginRight: 12,
  },

  statusTitle: {
    color: '#45D483',
    fontSize: 13,
    fontWeight: '700',
  },

  statusText: {
    color: '#7895A4',
    fontSize: 11,
    marginTop: 3,
  },

  card: {
    backgroundColor: '#0D1B25',
    borderWidth: 1,
    borderColor: '#1D3543',
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
  },

  sectionLabel: {
    color: '#66899A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  cardTitle: {
    color: '#E8F7FF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  mutedText: {
    color: '#7895A4',
    fontSize: 12,
  },

  resultBox: {
    backgroundColor: '#102631',
    borderWidth: 1,
    borderColor: '#2A596D',
    borderRadius: 8,
    padding: 12,
  },

  resultText: {
    color: '#D8F2FF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  confidenceText: {
    color: '#79D8FF',
    fontSize: 12,
    marginTop: 7,
    fontWeight: '600',
  },

  readingsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  readingBox: {
    flex: 1,
    backgroundColor: '#09151D',
    borderRadius: 8,
    padding: 14,
  },

  readingLabel: {
    color: '#66899A',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 6,
  },

  readingValue: {
    color: '#E8F7FF',
    fontSize: 25,
    fontWeight: '700',
  },

  scanButton: {
    backgroundColor: '#1B87B3',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 15,
  },

  scanButtonDisabled: {
    opacity: 0.6,
  },

  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  scanId: {
    color: '#79D8FF',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 6,
  },

  hashText: {
    color: '#79D8FF',
    fontSize: 10,
    lineHeight: 16,
    fontFamily: 'monospace',
    marginBottom: 6,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#172A35',
  },

  infoLabel: {
    color: '#7895A4',
    fontSize: 11,
  },

  infoValue: {
    color: '#45D483',
    fontSize: 11,
    fontWeight: '700',
  },

  footer: {
    color: '#536D79',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 5,
  },
});