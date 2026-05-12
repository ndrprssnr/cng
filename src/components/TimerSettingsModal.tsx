import { Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useTimerSettings } from '../contexts/TimerSettingsContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PRESETS = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '1m', value: 60 },
  { label: '1:30', value: 90 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
  { label: '5m', value: 300 },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimerSettingsModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const { settings, updateSettings } = useTimerSettings();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.paperBg }]}>
          <Text style={[styles.title, { color: theme.primaryText }]}>Timer Settings</Text>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: theme.primaryText }]}>Timer Mode</Text>
            <Switch
              value={settings.enabled}
              onValueChange={v => updateSettings({ enabled: v })}
            />
          </View>

          {settings.enabled && (
            <>
              <Text style={[styles.sectionLabel, { color: theme.primaryText }]}>Duration:</Text>
              <View style={styles.chipsRow}>
                {PRESETS.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.chip,
                      { backgroundColor: settings.durationSeconds === p.value ? theme.actionBtnBg : theme.inlineBtnBg },
                    ]}
                    onPress={() => updateSettings({ durationSeconds: p.value })}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: settings.durationSeconds === p.value ? theme.actionBtnText : theme.inlineBtnText },
                    ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: theme.inlineBtnBg }]}
                  onPress={() => updateSettings({ durationSeconds: settings.durationSeconds - 15 })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stepperText, { color: theme.inlineBtnText }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.durationDisplay, { color: theme.primaryText }]}>
                  {formatDuration(settings.durationSeconds)}
                </Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, { backgroundColor: theme.inlineBtnBg }]}
                  onPress={() => updateSettings({ durationSeconds: settings.durationSeconds + 15 })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stepperText, { color: theme.inlineBtnText }]}>+</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.actionBtnBg }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.doneBtnText, { color: theme.actionBtnText }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  durationDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    minWidth: 60,
    textAlign: 'center',
  },
  doneBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
