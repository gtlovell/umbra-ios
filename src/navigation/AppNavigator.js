import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import GraphScreen from '../screens/GraphScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';
import CaptureScreen from '../screens/CaptureScreen';
import VoiceScreen from '../screens/VoiceScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Graph') {
                        iconName = focused ? 'git-network' : 'git-network-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: 'tomato',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Graph" component={GraphScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MainTabs"
                component={BottomTabs}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="NoteEditor"
                component={NoteEditorScreen}
                options={{ presentation: 'modal', title: 'New Note' }}
            />
            <Stack.Screen
                name="CameraCapture"
                component={CaptureScreen}
                options={{ presentation: 'modal', title: 'Capture Image' }}
            />
            <Stack.Screen
                name="VoiceRecorder"
                component={VoiceScreen}
                options={{ presentation: 'modal', title: 'Record Voice' }}
            />
            <Stack.Screen
                name="NoteDetail"
                component={NoteDetailScreen}
                options={{ title: 'Note Details' }}
            />
        </Stack.Navigator>
    );
}
