import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "freelance-gig-8e329.firebaseapp.com",
  projectId: "freelance-gig-8e329",
  storageBucket: "freelance-gig-8e329.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const uploadImage = async (uri, path) => {
  const response = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const bytes = decode(response);
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, bytes, { contentType: 'image/jpeg' });
  return await getDownloadURL(storageRef);
};