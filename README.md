# BCR-FM

Barberton Radio Station FM 104.1 — Mobile App

---

## Overview

**BCR-FM** is a cross-platform mobile application for Barberton Radio Station FM 104.1, built with React Native and Expo.  
The app provides users with live radio streaming, trending news, weather updates for Mpumalanga towns, podcasts, and interactive features such as reactions and feedback.

---

## Features

- **Live Radio Streaming:** Listen to Barberton FM 104.1 live from anywhere.
- **Trending News:** Browse the latest news and top stories, fetched from the station’s WordPress site.
- **Weather Updates:** Get real-time weather for major towns in Mpumalanga, South Africa.
- **Podcasts:** Access and play recent podcasts.
- **User Reactions:** React to news stories with emojis (❤️ 😂 🤗 👍 😢).
- **Feedback:** Send feedback directly from the app.
- **Dark/Light Theme:** Toggle between dark and light modes.
- **Modern UI:** Responsive, mobile-first design with smooth navigation.

---

## Screenshots

*(Add screenshots of your app here for better presentation!)*

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [Git](https://git-scm.com/)
- (For iOS) Xcode, (For Android) Android Studio

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/CodingNinja223/BCR-FM.git
   cd BCR-FM/MyTabApp
   ```

2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```

3. **Set up Firebase:**
   - Add your Firebase configuration to `firebase.ts` if not already set.

4. **Start the Expo development server:** / NPM EXPO START --CLEAR if you use EXPO GO AS YOUR SERVER
   ```sh
   npm start
   # or
   yarn start
   # or
   expo start --dev-client
   ```

5. **Run on your device:**
   - For Android:  
     `npm run android` or `expo run:android`
   - For iOS:  
     `npm run ios` or `expo run:ios`
   - For Web:  
     `npm run web` or `expo start --web`

---

## Project Structure

```
MyTabApp/
├── app/                # Main app screens and navigation
│   ├── (tabs)/         # Tabbed navigation (Live, Trending, Podcast, etc.)
│   ├── components/     # UI components (ThemeToggle, etc.)
│   └── services/       # Service files (e.g., background audio)
├── assets/             # Images, fonts, and other static assets
├── components/         # Shared React components
├── constants/          # App-wide constants
├── hooks/              # Custom React hooks
├── firebase.ts         # Firebase configuration
├── package.json        # Project metadata and scripts
├── app.json            # Expo configuration
└── ...                 # Other config and build files
```

---

## Available Scripts

- `npm start` — Start the Expo dev server
- `npm run android` — Run app on Android device/emulator
- `npm run ios` — Run app on iOS simulator
- `npm run web` — Run app in the browser
- `npm test` — Run tests with Jest

---

## Environment Variables

- Create a `.env` file for any sensitive keys (e.g., Firebase, API keys).
- **Never commit your `.env` file or secrets to git.**

---

## Dependencies

- React Native, Expo, Expo Router
- Firebase (Realtime Database)
- Axios, Cheerio, Lottie, and more
- See [`package.json`](./package.json) for the full list

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a new Pull Request

---

## License

This project is licensed under the 0BSD License.

---

## Contact

For questions, suggestions, or feedback, please open an issue or contact the maintainer.

---

**Enjoy using BCR-FM!**
