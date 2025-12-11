import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import * as d3 from 'd3-force';
import { getNotes } from '../services/StorageService';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Cosine Similarity
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        mA += vecA[i] * vecA[i];
        mB += vecB[i] * vecB[i];
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    if (mA === 0 || mB === 0) return 0;
    return dotProduct / (mA * mB);
};

export default function GraphScreen({ navigation }) {
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            initGraph();
        }, [])
    );

    const initGraph = async () => {
        setLoading(true);
        const fetchedNotes = await getNotes();

        // Filter notes that have embeddings (or just map them)
        const validNotes = fetchedNotes.filter(n => n.embedding).map(n => ({
            ...n,
            embedding: JSON.parse(n.embedding)
        }));

        const initialNodes = validNotes.map(n => ({
            ...n, // Spread all note properties
            x: width / 2 + (Math.random() - 0.5) * 50,
            y: height / 2 + (Math.random() - 0.5) * 50
        }));

        const newLinks = [];
        const threshold = 0.75; // Similarity threshold

        for (let i = 0; i < validNotes.length; i++) {
            for (let j = i + 1; j < validNotes.length; j++) {
                const sim = cosineSimilarity(validNotes[i].embedding, validNotes[j].embedding);
                if (sim > threshold) {
                    newLinks.push({
                        source: validNotes[i].id,
                        target: validNotes[j].id,
                        value: sim
                    });
                }
            }
        }

        const simulation = d3.forceSimulation(initialNodes)
            .force("link", d3.forceLink(newLinks).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(30));

        // Run simulation for a fixed number of ticks (static layout for performance)
        // Or run dynamically. Let's do static for MVPs to avoid loop issues
        for (let i = 0; i < 300; ++i) simulation.tick();

        setNodes(initialNodes);
        setLinks(newLinks);
        setLoading(false);
    };

    if (loading) {
        return <View style={styles.center}><Text>Building Knowledge Graph...</Text></View>;
    }

    if (nodes.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>No processed notes found.</Text>
                <Text>Create notes and enhance them with AI to see the graph.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Svg width={width} height={height}>
                {links.map((link, i) => (
                    <Line
                        key={i}
                        x1={link.source.x}
                        y1={link.source.y}
                        x2={link.target.x}
                        y2={link.target.y}
                        stroke="#ccc"
                        strokeWidth="2"
                    />
                ))}
                {nodes.map((node, i) => (
                    <React.Fragment key={i}>
                        <Circle
                            cx={node.x}
                            cy={node.y}
                            r="20"
                            fill={node.type === 'voice' ? '#FF9500' : node.type === 'image' ? '#FF2D55' : '#007AFF'}
                            onPress={() => navigation.navigate('NoteDetail', { note: node })} // Pass original note? Need to refetch or pass partial
                        />
                        <SvgText
                            x={node.x}
                            y={node.y + 30}
                            fill="#333"
                            fontSize="10"
                            textAnchor="middle"
                        >
                            {node.title.substring(0, 10)}
                        </SvgText>
                    </React.Fragment>
                ))}
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    }
});
