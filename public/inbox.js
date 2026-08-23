/* =========================================================
   WWC INBOX.JS
   Private Messaging System
   ========================================================= */

import {
  getApps,
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyCgio17aPEfR7d6juqIhn3yi6Mf65W_tO4",
  authDomain: "world-wide-connect-62c87.firebaseapp.com",
  projectId: "world-wide-connect-62c87",
  storageBucket: "world-wide-connect-62c87.firebasestorage.app",
  messagingSenderId: "93178453668",
  appId: "1:93178453668:web:2184630caa8e61f7445031",
  measurementId: "G-PKFJ5NEMGQ"
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;
let currentProfile = null;
let activeChatUser = null;
let unsubscribeMessages = null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const conversationList =
  document.getElementById("conversationList");

const chatScreen =
  document.getElementById("chatScreen");

const chatMessages =
  document.getElementById("chatMessages");

const messageInput =
  document.getElementById("messageInput");

const sendMessageBtn =
  document.getElementById("sendMessageBtn");

const chatUsername =
  document.getElementById("chatUsername");

const chatPhoto =
  document.getElementById("chatPhoto");

const backBtn =
  document.getElementById("chatBackBtn");

const newChatBtn =
  document.getElementById("newChatBtn");


/* =========================================================
   HELPER
   ========================================================= */

function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   USER PROFILE
   ========================================================= */

async function loadMyProfile() {

  if (!currentUser) {
    return;
  }

  const userRef =
    doc(
      db,
      "users",
      currentUser.uid
    );

  const snap =
    await getDoc(userRef);

  if (snap.exists()) {

    currentProfile =
      snap.data();

  }

}


/* =========================================================
   AUTH
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser = user;

    if (!user) {

      window.location.href =
        "./auth.html";

      return;

    }

    await loadMyProfile();

    loadConversations();

  }
);


/* =========================================================
   CONVERSATION ID
   ========================================================= */

function getConversationId(
  uid1,
  uid2
) {

  return [uid1, uid2]
    .sort()
    .join("_");

}


/* =========================================================
   OPEN CHAT
   ========================================================= */

async function openChat(user) {

  if (!currentUser || !user?.uid) {
    return;
  }

  activeChatUser = user;

  if (chatUsername) {

    chatUsername.textContent =
      "@" +
      String(
        user.username ||
        "wwc_user"
      ).replace(/^@/, "");

  }

  if (chatPhoto) {

    chatPhoto.src =
      user.photoURL ||
      "./images/profile.png";

  }

  if (chatScreen) {

    chatScreen.classList.add(
      "show"
    );

  }

  loadMessages(user.uid);

}


/* =========================================================
   LOAD CONVERSATIONS
   ========================================================= */

function loadConversations() {

  if (!conversationList || !currentUser) {
    return;
  }

  /*
   * messages collection থেকে
   * আমার পাঠানো messages
   */

  const sentQuery =
    query(
      collection(
        db,
        "messages"
      ),
      where(
        "senderId",
        "==",
        currentUser.uid
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );


  /*
   * আমার কাছে আসা messages
   */

  const receivedQuery =
    query(
      collection(
        db,
        "messages"
      ),
      where(
        "receiverId",
        "==",
        currentUser.uid
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );


  let sentMessages = [];
  let receivedMessages = [];


  onSnapshot(
    sentQuery,
    snapshot => {

      sentMessages =
        snapshot.docs.map(
          item => ({
            id: item.id,
            ...item.data()
          })
        );

      renderConversations(
        sentMessages,
        receivedMessages
      );

    },
    error => {

      console.error(
        "Sent messages error:",
        error
      );

    }
  );


  onSnapshot(
    receivedQuery,
    snapshot => {

      receivedMessages =
        snapshot.docs.map(
          item => ({
            id: item.id,
            ...item.data()
          })
        );

      renderConversations(
        sentMessages,
        receivedMessages
      );

    },
    error => {

      console.error(
        "Received messages error:",
        error
      );

    }
  );

}


/* =========================================================
   RENDER CONVERSATIONS
   ========================================================= */

async function renderConversations(
  sent,
  received
) {

  if (!conversationList) {
    return;
  }


  const all =
    [...sent, ...received];


  const unique =
    new Map();


  all.forEach(
    message => {

      const otherUserId =
        message.senderId === currentUser.uid
          ? message.receiverId
          : message.senderId;


      if (
        !otherUserId ||
        otherUserId === currentUser.uid
      ) {
        return;
      }


      const existing =
        unique.get(otherUserId);


      if (
        !existing ||
        getTime(message.createdAt) >
        getTime(existing.createdAt)
      ) {

        unique.set(
          otherUserId,
          message
        );

      }

    }
  );


  if (!unique.size) {

    conversationList.innerHTML = `
      <div class="empty-inbox">
        💬 এখনো কোনো Chat নেই।
        <br>
        <small>একজন User-এর Profile থেকে Chat শুরু করুন।</small>
      </div>
    `;

    return;

  }


  conversationList.innerHTML = "";


  for (
    const [userId, message]
    of unique
  ) {

    const user =
      await getUser(userId);


    if (!user) {
      continue;
    }


    const item =
      document.createElement(
        "button"
      );


    item.type =
      "button";

    item.className =
      "conversation-item";


    item.innerHTML = `

      <img
        class="conversation-photo"
        src="${escapeHTML(
          user.photoURL ||
          "./images/profile.png"
        )}"
        alt="Profile"
      >

      <div class="conversation-info">

        <div class="conversation-name">
          ${escapeHTML(
            user.name ||
            "WWC User"
          )}
        </div>

        <div class="conversation-username">
          @${escapeHTML(
            String(
              user.username ||
              "wwc_user"
            ).replace(/^@/, "")
          )}
        </div>

        <div class="conversation-last-message">
          ${escapeHTML(
            message.text ||
            "Message"
          )}
        </div>

      </div>

    `;


    item.addEventListener(
      "click",
      () => {

        openChat({
          uid: userId,
          ...user
        });

      }
    );


    conversationList.appendChild(
      item
    );

  }

}


/* =========================================================
   GET USER
   ========================================================= */

async function getUser(uid) {

  try {

    const ref =
      doc(
        db,
        "users",
        uid
      );

    const snap =
      await getDoc(ref);


    if (!snap.exists()) {
      return null;
    }


    return snap.data();

  } catch (error) {

    console.error(
      "Get user error:",
      error
    );

    return null;

  }

}


/* =========================================================
   LOAD MESSAGES
   ========================================================= */

function loadMessages(
  otherUserId
) {

  if (!currentUser || !chatMessages) {
    return;
  }


  if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages =
      null;

  }


  const messagesQuery =
    query(
      collection(
        db,
        "messages"
      ),
      where(
        "participants",
        "array-contains",
        currentUser.uid
      ),
      orderBy(
        "createdAt",
        "asc"
      )
    );


  unsubscribeMessages =
    onSnapshot(
      messagesQuery,
      snapshot => {

        const messages =
          snapshot.docs
            .map(
              item => ({
                id: item.id,
                ...item.data()
              })
            )
            .filter(
              message => {

                return (
                  (
                    message.senderId ===
                    currentUser.uid &&
                    message.receiverId ===
                    otherUserId
                  )
                  ||
                  (
                    message.senderId ===
                    otherUserId &&
                    message.receiverId ===
                    currentUser.uid
                  )
                );

              }
            );


        renderMessages(
          messages
        );

      },
      error => {

        console.error(
          "Message loading error:",
          error
        );

        chatMessages.innerHTML = `
          <div class="chat-error">
            ❌ Message load করা যায়নি।
          </div>
        `;

      }
    );

}


/* =========================================================
   RENDER MESSAGES
   ========================================================= */

function renderMessages(
  messages
) {

  if (!chatMessages) {
    return;
  }


  chatMessages.innerHTML = "";


  if (!messages.length) {

    chatMessages.innerHTML = `
      <div class="no-messages">
        👋 প্রথম Message পাঠান।
      </div>
    `;

    return;

  }


  messages.forEach(
    message => {

      const bubble =
        document.createElement(
          "div"
        );


      bubble.className =
        "message-bubble";


      if (
        message.senderId ===
        currentUser.uid
      ) {

        bubble.classList.add(
          "my-message"
        );

      } else {

        bubble.classList.add(
          "their-message"
        );

      }


      bubble.innerHTML = `
        <div class="message-text">
          ${escapeHTML(
            message.text
          )}
        </div>

        <div class="message-time">
          ${formatTime(
            message.createdAt
          )}
        </div>
      `;


      chatMessages.appendChild(
        bubble
      );

    }
  );


  chatMessages.scrollTop =
    chatMessages.scrollHeight;

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

  if (
    !currentUser ||
    !activeChatUser
  ) {

    return;

  }


  const text =
    messageInput?.value.trim();


  if (!text) {
    return;
  }


  if (
    activeChatUser.uid ===
    currentUser.uid
  ) {

    alert(
      "নিজেকে Message পাঠানো যাবে না।"
    );

    return;

  }


  if (sendMessageBtn) {

    sendMessageBtn.disabled =
      true;

  }


  try {

    const conversationId =
      getConversationId(
        currentUser.uid,
        activeChatUser.uid
      );


    const messageData = {

      conversationId:

        conversationId,

      senderId:

        currentUser.uid,

      receiverId:

        activeChatUser.uid,

      participants: [

        currentUser.uid,

        activeChatUser.uid

      ],

      text:

        text,

      createdAt:

        serverTimestamp()

    };


    await addDoc(
      collection(
        db,
        "messages"
      ),
      messageData
    );


    /*
     * Conversation document
     */

    await setDoc(
      doc(
        db,
        "conversations",
        conversationId
      ),
      {

        participants: [

          currentUser.uid,

          activeChatUser.uid

        ],

        lastMessage:
          text,

        lastSenderId:
          currentUser.uid,

        updatedAt:
          serverTimestamp()

      },
      {
        merge: true
      }
    );


    if (messageInput) {

      messageInput.value =
        "";

      messageInput.focus();

    }

  } catch (error) {

    console.error(
      "Send message error:",
      error
    );


    alert(
      "❌ Message পাঠানো যায়নি।"
    );

  } finally {

    if (sendMessageBtn) {

      sendMessageBtn.disabled =
        false;

    }

  }

}


/* =========================================================
   SEND BUTTON
   ========================================================= */

if (sendMessageBtn) {

  sendMessageBtn.addEventListener(
    "click",
    sendMessage
  );

}


/* =========================================================
   ENTER TO SEND
   ========================================================= */

if (messageInput) {

  messageInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );

}


/* =========================================================
   BACK TO INBOX
   ========================================================= */

if (backBtn) {

  backBtn.addEventListener(
    "click",
    () => {

      if (chatScreen) {

        chatScreen.classList.remove(
          "show"
        );

      }


      activeChatUser =
        null;


      if (unsubscribeMessages) {

        unsubscribeMessages();

        unsubscribeMessages =
          null;

      }

    }
  );

}


/* =========================================================
   TIME
   ========================================================= */

function getTime(
  timestamp
) {

  if (
    !timestamp ||
    typeof timestamp.toMillis !==
    "function"
  ) {

    return 0;

  }


  return timestamp.toMillis();

}


function formatTime(
  timestamp
) {

  if (!timestamp) {
    return "";
  }


  try {

    const date =
      timestamp.toDate();


    return date.toLocaleTimeString(
      "bn-BD",
      {
        hour: "numeric",
        minute: "2-digit"
      }
    );

  } catch {

    return "";

  }

}


/* =========================================================
   NEW CHAT
   ========================================================= */

if (newChatBtn) {

  newChatBtn.addEventListener(
    "click",
    async () => {

      if (!currentUser) {
        return;
      }


      const username =
        prompt(
          "যে User-কে Message করতে চান তার Username লিখুন:"
        );


      if (!username) {
        return;
      }


      const cleanUsername =
        username
          .trim()
          .replace(/^@/, "")
          .toLowerCase();


      if (!cleanUsername) {
        return;
      }


      try {

        const usersSnapshot =
          await getDocs(
            collection(
              db,
              "users"
            )
          );


        let foundUser =
          null;


        usersSnapshot.forEach(
          userDoc => {

            const data =
              userDoc.data();


            const dbUsername =
              String(
                data.username || ""
              )
                .replace(/^@/, "")
                .toLowerCase();


            if (
              dbUsername ===
              cleanUsername
            ) {

              foundUser = {

                uid:
                  userDoc.id,

                ...data

              };

            }

          }
        );


        if (!foundUser) {

          alert(
            "❌ User পাওয়া যায়নি।"
          );

          return;

        }


        openChat(
          foundUser
        );

      } catch (error) {

        console.error(
          "New chat error:",
          error
        );


        alert(
          "❌ User খুঁজে পাওয়া যায়নি।"
        );

      }

    }
  );

}


/* =========================================================
   START
   ========================================================= */

console.log(
  "💬 WWC Inbox loaded"
);
