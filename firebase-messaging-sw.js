// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// আপনার Firebase কনফিগারেশন
const firebaseConfig = {
    apiKey: "AIzaSyCgio17aPEfR7d6juqIhn3yi6Mf65W_tO4",
    authDomain: "world-wide-connect-62c87.firebaseapp.com",
    projectId: "world-wide-connect-62c87",
    storageBucket: "world-wide-connect-62c87.firebasestorage.app",
    messagingSenderId: "93178453668",
    appId: "1:93178453668:web:2184630caa8e61f7445031"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ব্যাকগ্রাউন্ড মেসেজ হ্যান্ডলার
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] ব্যাকগ্রাউন্ড মেসেজ:', payload);

    const notificationTitle = payload.notification?.title || 'WWC নোটিফিকেশন';
    const notificationOptions = {
        body: payload.notification?.body || 'আপনার জন্য নতুন নোটিফিকেশন',
        icon: 'https://mostofakamal66678-cloud.github.io/WWC-Core/favicon.ico',
        badge: 'https://mostofakamal66678-cloud.github.io/WWC-Core/favicon.ico',
        vibrate: [200, 100, 200],
        data: payload.data || {}
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// নোটিফিকেশনে ক্লিক করলে
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || 'https://mostofakamal66678-cloud.github.io/WWC-Core/';

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (let client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
