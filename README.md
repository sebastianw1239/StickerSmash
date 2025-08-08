# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

You are seeing this error because `react-native-maps` is a native module and is **not supported in Expo Go**. The error:

> TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found. Verify that a module by this name is registered in the native binary.

means the native code for the map is not present in the Expo Go app.

---

## How to Fix

### 1. **You must use a custom development build (Expo Dev Client) or the prebuild workflow.**

#### **Option A: Expo Dev Client (Recommended)**
1. **Install EAS CLI** (if you haven't):
   ```sh
   npm install -g eas-cli
   ```
2. **Configure your app for EAS Build:**
   ```sh
   eas build:configure
   ```
3. **Build a development client:**
   ```sh
   eas build --profile development --platform ios
   ```
   or for Android:
   ```sh
   eas build --profile development --platform android
   ```
4. **Install the build on your device** (Expo will give you a QR code or download link).
5. **Open your project in the new Expo Dev Client** (not Expo Go).

#### **Option B: Expo Prebuild (Bare) Workflow**
1. Run:
   ```sh
   npx expo prebuild
   ```
2. Then run:
   ```sh
   npx expo run:ios
   ```
   or
   ```sh
   npx expo run:android
   ```

---

### 2. **If you want to stay in Expo Go:**
You cannot use `react-native-maps`. You would need to use the Expo SDK's managed map component (if available), but it is not as full-featured as `react-native-maps`.

---

## **Summary**
- You cannot use `react-native-maps` in Expo Go.
- You must use a custom dev client (EAS Build) or prebuild and run on a simulator/device.
- Follow the steps above to get your map working!

---

Would you like to proceed with EAS Build or prebuild? I can walk you through the exact commands and steps for your platform (iOS/Android)!
