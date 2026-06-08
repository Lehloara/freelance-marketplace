import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import FreelancerProfileSetupScreen from '../screens/FreelancerProfileSetupScreen';

import ClientHomeScreen from '../screens/ClientHomeScreen';
import CreateGigScreen from '../screens/CreateGigScreen';
import ClientGigDetailScreen from '../screens/ClientGigDetailScreen';
import ProposalListScreen from '../screens/ProposalListScreen';
import PaymentScreen from '../screens/PaymentScreen';
import WorkReviewScreen from '../screens/WorkReviewScreen';
import ClientProfileScreen from '../screens/ClientProfileScreen';
import MyGigsScreen from '../screens/MyGigsScreen';

import FreelancerHomeScreen from '../screens/FreelancerHomeScreen';
import GigListScreen from '../screens/GigListScreen';
import SearchScreen from '../screens/SearchScreen';
import FreelancerGigDetailScreen from '../screens/FreelancerGigDetailScreen';
import ProposalScreen from '../screens/ProposalScreen';
import MyProjectsScreen from '../screens/MyProjectsScreen';
import UploadWorkScreen from '../screens/UploadWorkScreen';
import FreelancerProfileScreen from '../screens/FreelancerProfileScreen';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="FreelancerProfileSetup" component={FreelancerProfileSetupScreen} />
    </Stack.Navigator>
  );
}

function ClientHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientHome" component={ClientHomeScreen} />
      <Stack.Screen name="MyGigs" component={MyGigsScreen} options={{ headerShown: true, title: 'My Gigs' }} />
      <Stack.Screen name="ClientGigDetail" component={ClientGigDetailScreen} options={{ headerShown: true, title: 'Project Details' }} />
    </Stack.Navigator>
  );
}

function ProposalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProposalList" component={ProposalListScreen} options={{ headerShown: true, title: 'Proposals' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: true, title: 'Secure Payment' }} />
    </Stack.Navigator>
  );
}

function WorkReviewStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkReview" component={WorkReviewScreen} options={{ headerShown: true, title: 'Review Work' }} />
    </Stack.Navigator>
  );
}

function ClientProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientProfile" component={ClientProfileScreen} />
    </Stack.Navigator>
  );
}

function FreelancerHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FreelancerHome" component={FreelancerHomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: true, title: 'Search Gigs' }} />
      <Stack.Screen name="FreelancerGigDetail" component={FreelancerGigDetailScreen} options={{ headerShown: true, title: 'Gig Details' }} />
      <Stack.Screen name="SubmitProposal" component={ProposalScreen} options={{ headerShown: true, title: 'Submit Proposal' }} />
    </Stack.Navigator>
  );
}

function BrowseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GigList" component={GigListScreen} />
      <Stack.Screen name="FreelancerGigDetail" component={FreelancerGigDetailScreen} options={{ headerShown: true, title: 'Gig Details' }} />
      <Stack.Screen name="SubmitProposal" component={ProposalScreen} options={{ headerShown: true, title: 'Submit Proposal' }} />
    </Stack.Navigator>
  );
}

function FreelancerProjectsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyProjects" component={MyProjectsScreen} />
      <Stack.Screen name="UploadWork" component={UploadWorkScreen} options={{ headerShown: true, title: 'Submit Work' }} />
    </Stack.Navigator>
  );
}

function FreelancerProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FreelancerProfile" component={FreelancerProfileScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { token, user, checkAuth } = useAuthStore();
  useEffect(() => { checkAuth(); }, []);

  if (token === undefined) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#0052FF" /></View>;
  }

  return (
    <NavigationContainer>
      {token && user ? (
        user.role === 'client' ? (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: '#0052FF',
              tabBarInactiveTintColor: '#8E8E93',
              tabBarStyle: { paddingBottom: 5, height: 60 },
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                else if (route.name === 'Post Gig') iconName = focused ? 'add-circle' : 'add-circle-outline';
                else if (route.name === 'Proposals') iconName = focused ? 'people' : 'people-outline';
                else if (route.name === 'WorkReview') iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
                else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Home" component={ClientHomeStack} />
            <Tab.Screen name="Post Gig" component={CreateGigScreen} />
            <Tab.Screen name="Proposals" component={ProposalsStack} />
            <Tab.Screen name="WorkReview" component={WorkReviewStack} />
            <Tab.Screen name="Profile" component={ClientProfileStack} />
          </Tab.Navigator>
        ) : user.role === 'freelancer' ? (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: '#0052FF',
              tabBarInactiveTintColor: '#8E8E93',
              tabBarStyle: { paddingBottom: 5, height: 60 },
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                else if (route.name === 'Browse') iconName = focused ? 'search' : 'search-outline';
                else if (route.name === 'Projects') iconName = focused ? 'briefcase' : 'briefcase-outline';
                else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Home" component={FreelancerHomeStack} />
            <Tab.Screen name="Browse" component={BrowseStack} />
            <Tab.Screen name="Projects" component={FreelancerProjectsStack} />
            <Tab.Screen name="Profile" component={FreelancerProfileStack} />
          </Tab.Navigator>
        ) : null
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}