import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { addNote } from '../services/StorageService';
import { Ionicons } from '@expo/vector-icons';

export default function VoiceScreen({ navigation }) {
    const [recording, setRecording] = useState();
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [recordedUri, setRecordedUri] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    async function startRecording() {
        try {
            if (permissionResponse.status !== 'granted') {
                console.log('Requesting permission..');
                await requestPermission();
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('Starting recording..');
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Failed to start recording');
        }
    }

    async function stopRecording() {
        console.log('Stopping recording..');
        setRecording(undefined);
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);
        setRecordedUri(uri);
    }

    async function saveRecording() {
        if (!recordedUri) return;

        // Move file to permanent location
        const fileName = `voice_${Date.now()}.m4a`;
        const newUri = FileSystem.documentDirectory + fileName;

        try {
            await FileSystem.moveAsync({
                from: recordedUri,
                to: newUri
            });

            // Create Note
            // TODO: In the future, this is where we'd call the transcription service
            const title = `Voice Note ${new Date().toLocaleTimeString()}`;
            const content = "Audio recording (Transcription pending...)";

            await addNote(title, content, 'voice', { audioUri: newUri });
            navigation.goBack();

        } catch (error) {
            console.error("Error saving recording", error);
            Alert.alert("Error", "Could not save recording");
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.visualizer}>
                <Ionicons name="mic-circle" size={120} color={isRecording ? "red" : "#ccc"} />
                <Text style={styles.statusText}>{isRecording ? "Recording..." : "Ready to Record"}</Text>
            </View>

            <View style={styles.controls}>
                {recordedUri ? (
                    <View style={styles.previewContainer}>
                        <Text style={styles.previewText}>Recording captured!</Text>
                        <View style={styles.actionButtons}>
                            <Button title="Rerecord" onPress={() => setRecordedUri(null)} />
                            <Button title="Save Note" onPress={saveRecording} />
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.recordButton, isRecording && styles.recordingButton]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 24,
    },
    visualizer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        marginTop: 20,
        fontSize: 18,
        color: '#666',
    },
    controls: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    recordingButton: {
        backgroundColor: '#FF3B30',
    },
    previewContainer: {
        alignItems: 'center',
        gap: 10,
    },
    previewText: {
        fontSize: 16,
        marginBottom: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 20,
    }
});
