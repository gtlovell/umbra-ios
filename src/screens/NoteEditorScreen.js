import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Button, SafeAreaView, Alert } from 'react-native';
import { addNote } from '../services/StorageService';

export default function NoteEditorScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSave = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Note content cannot be empty');
            return;
        }

        try {
            await addNote(title || 'Untitled Note', content, 'text');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to save note');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <TextInput
                    style={styles.titleInput}
                    placeholder="Title"
                    value={title}
                    onChangeText={setTitle}
                />
                <TextInput
                    style={styles.contentInput}
                    placeholder="Start typing..."
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                />
                <Button title="Save Note" onPress={handleSave} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
        flex: 1,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    contentInput: {
        fontSize: 16,
        flex: 1,
        marginBottom: 20,
    },
});
