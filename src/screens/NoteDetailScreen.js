import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { enhanceNote } from '../services/GeminiService';
import { updateNote } from '../services/StorageService';
import { Ionicons } from '@expo/vector-icons';

export default function NoteDetailScreen({ route, navigation }) {
    const { note: initialNote } = route.params;
    const [note, setNote] = useState(initialNote);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Navigation options
        navigation.setOptions({ title: note.title });
    }, [note.title]);

    const handleEnhance = async () => {
        setLoading(true);
        const result = await enhanceNote(note);
        setLoading(false);

        if (result.error) {
            Alert.alert('AI Error', result.error);
            return;
        }

        // Update local state
        const { embedding, ...metaUpdates } = result;
        const updatedMetadata = { ...note.metadata, ...metaUpdates, aiProcessed: true };
        const updatedNote = { ...note, metadata: updatedMetadata };

        setNote(updatedNote);

        // Save to DB
        await updateNote(note.id, { metadata: updatedMetadata, embedding: embedding || null });
        Alert.alert('Success', 'Note enhanced by Gemini!');
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.contentContainer}>
                <Text style={styles.date}>{new Date(note.createdAt).toLocaleString()}</Text>

                {note.type === 'image' && note.metadata?.imageUri && (
                    <Image source={{ uri: note.metadata.imageUri }} style={styles.image} />
                )}

                {note.type === 'voice' && (
                    <View style={styles.audioPlaceholder}>
                        <Ionicons name="mic-circle" size={48} color="#007AFF" />
                        <Text>Audio Note Recorded</Text>
                    </View>
                )}

                <Text style={styles.content}>{note.content}</Text>

                {/* AI Section */}
                <View style={styles.aiSection}>
                    <Text style={styles.aiHeader}>AI Analysis</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#007AFF" />
                    ) : note.metadata?.aiProcessed ? (
                        <View>
                            {note.metadata.transcription && (
                                <View style={styles.aiBlock}>
                                    <Text style={styles.label}>Transcription:</Text>
                                    <Text style={styles.value}>{note.metadata.transcription}</Text>
                                </View>
                            )}

                            {note.metadata.summary && (
                                <View style={styles.aiBlock}>
                                    <Text style={styles.label}>Summary:</Text>
                                    <Text style={styles.value}>{note.metadata.summary}</Text>
                                </View>
                            )}

                            {note.metadata.tags && (
                                <View style={styles.tagContainer}>
                                    {note.metadata.tags.map((tag, index) => (
                                        <View key={index} style={styles.tag}>
                                            <Text style={styles.tagText}>#{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.enhanceContainer}>
                            <Text style={styles.enhanceText}>Unlock insights with Gemini AI</Text>
                            <Button title="Analyze Note" onPress={handleEnhance} />
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        padding: 20,
    },
    date: {
        fontSize: 12,
        color: '#999',
        marginBottom: 10,
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 20,
    },
    image: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        borderRadius: 12,
        marginBottom: 20,
    },
    audioPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    aiSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    aiHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#007AFF',
    },
    aiBlock: {
        marginBottom: 15,
    },
    label: {
        fontWeight: '600',
        marginBottom: 5,
        color: '#444',
    },
    value: {
        fontSize: 15,
        color: '#555',
        fontStyle: 'italic',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    tagText: {
        color: '#1565C0',
        fontSize: 12,
    },
    enhanceContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F5F5FA',
        borderRadius: 12,
    },
    enhanceText: {
        marginBottom: 10,
        color: '#666',
    }
});
