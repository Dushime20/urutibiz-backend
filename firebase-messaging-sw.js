importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAZrC6kfEPmVRjDdVvGJKKTZm7eLY_-fOA",
    authDomain: "urtbz-af684.firebaseapp.com",
    projectId: "urtbz-af684",
    storageBucket: "urtbz-af684.firebasestorage.app",
    messagingSenderId: "997587510479",
    appId: "1:997587510479:web:ece1efb4de7919c73803ba",
    measurementId: "G-NP2E94ZPP8"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Background message received:', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192x192.png', // Optional: add your app icon
        badge: '/badge-72x72.png', // Optional: add your badge icon
        tag: 'notification-' + Date.now(), // Unique tag for each notification
        data: payload.data || {}
    };

    // Show the notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    // You can add custom logic here, like opening a specific URL
    // event.waitUntil(
    //     clients.openWindow('https://your-app.com/notifications')
    // );
});
