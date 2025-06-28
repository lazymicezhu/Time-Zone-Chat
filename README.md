# World Time Zone Chat Room

A web application that allows users from around the world to chat in different time zones and categories.

## Features

- **Time Zone Based Chatrooms**: Users can join chat rooms based on their time zone.
- **Multiple Chat Categories**: Support for various chat topics like General, Food, Travel, Study, and Music.
- **Rich Media Support**:
  - Share photos
  - Create polls
  - Send voice messages
- **Real-time Updates**: See who's online and receive messages instantly.
- **User Authentication**: Login with email/password or Google account.

## Technical Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Firebase (Authentication, Realtime Database, Storage)

## Setup Instructions

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google)
3. Create a Realtime Database
4. Set up Storage for images and audio files
5. Update the Firebase configuration in `js/firebase-config.js` with your project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
};
```

6. Deploy the application to a web server or run it locally.

## Database Structure

```
/users
  /uid
    displayName: string
    email: string
    photoURL: string
    createdAt: timestamp

/chatrooms
  /{timezone}/{category}
    /messages
      /messageId
        uid: string
        displayName: string
        photoURL: string
        text: string
        type: "text" | "image" | "poll" | "voice"
        timestamp: timestamp
        imageURL?: string
        audioURL?: string
        pollQuestion?: string
        pollOptions?: object
        pollVotes?: object

    /users
      /uid
        uid: string
        displayName: string
        photoURL: string
        lastActive: timestamp
```

## Browser Support

This application uses modern web technologies and is compatible with:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License
