import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { addNote } from '../services/StorageService';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

export default function CaptureScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedImage, setCapturedImage] = useState(null);
    const cameraRef = useRef(null);

    if (!permission) {
        // Camera permissions are still loading
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center', marginBottom: 20 }}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    async function takePicture() {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                setCapturedImage(photo.uri);
            } catch (error) {
                console.error('Failed to take picture', error);
            }
        }
    }

    async function saveNote() {
        if (!capturedImage) return;

        // Move to permanent storage
        const fileName = `image_${Date.now()}.jpg`;
        const newUri = FileSystem.documentDirectory + fileName;

        try {
            await FileSystem.moveAsync({
                from: capturedImage,
                to: newUri
            });

            const title = `Handwriting Scan ${new Date().toLocaleTimeString()}`;
            const content = "Image capture (OCR pending...)";

            await addNote(title, content, 'image', { imageUri: newUri });
            navigation.goBack();

        } catch (error) {
            console.error("Error saving image note", error);
            Alert.alert("Error", "Could not save image");
        }
    }

    if (capturedImage) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: capturedImage }} style={styles.preview} />
                <View style={styles.actionButtons}>
                    <Button title="Retake" onPress={() => setCapturedImage(null)} />
                    <Button title="Save Note" onPress={saveNote} />
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} ref={cameraRef} facing="back">
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'black'
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        marginBottom: 64,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    preview: {
        flex: 1,
        resizeMode: 'contain',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: 'white'
    }
});
