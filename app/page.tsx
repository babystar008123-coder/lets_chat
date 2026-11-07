"use client";
import SplashScreen from "@/components/SplashScreen";
import SwipeableMessage from "@/components/SwipeableMessage";
import React, { useState, useRef, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  push,
  remove
} from "firebase/database";
import {
  FiSend,
  FiSmile,
  FiUserPlus,
  FiLogOut,
  FiArrowLeft,
  FiCheck,
  FiCamera,
  FiEdit2,
  FiHeart,
  FiX,
  FiDownload
} from "react-icons/fi";
import { FiTrash2 } from 'react-icons/fi';
import { FaDice } from "react-icons/fa";

const firebaseConfig = {
  apiKey: "AIzaSyCbUD9KOprj-tshPfD8Yz9jnhtvfFWwT-E",
  authDomain: "lets-chat-008.firebaseapp.com",
  databaseURL: "https://lets-chat-008-default-rtdb.firebaseio.com",
  projectId: "lets-chat-008",
  storageBucket: "lets-chat-008.firebasestorage.app",
  messagingSenderId: "834486224386",
  appId: "1:834486224386:web:f65c6e5f52d8561de9091b",
  measurementId: "G-0LNJM2NX09"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

interface UserProfile {
  name: string;
  mobile: string;
  pin: string;
  glassId: string;
  avatarUrl: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  type: "text" | "sticker" | "tod_card";
  content: string;
  todType?: "Truth" | "Dare";
  timestamp: string;
}

interface ChatContact {
  glassId: string;
  name: string;
  avatarUrl: string;
  lastMessage: string;
  unread?: boolean;
}

interface IncomingRequest {
  fromGlassId: string;
  fromName: string;
  fromAvatar: string;
}

const TANGLISH_STICKERS: Record<string, string[]> = {
  Comedy: [
    "Aaha! Enna oru puthisaalithanam! 😂",
    "Enna thalaivaa ipdi panniteenga? 🤦‍♂️",
    "Naan apdiye shock aayiten! ⚡",
    "Ipdi pannitiye da parama! 😭",
    "Neengala mudivu panniteengala? 🤣",
    "Evanavadhu kaapathunga da! 🏃‍♂️"
  ],
  Love: [
    "Nee illama naan illa pa 💖",
    "Always thinking about you sweetheart ✨",
    "Enna paatha epdi theriyudhu? Cute-a? 🥰",
    "Life time settlement doli nee enakku! 🌹",
    "Un smile paathe flat aagiten 😍",
    "Romba miss panren pa unna 💕"
  ],
  Sad: [
    "Manase seri illa da 💔",
    "Yen da ipdi panreenga? 🥺",
    "Ellam en neram! 😔",
    "En kitta matum yen ipdi nadakudhu? 🥀",
    "Romba valikudhu bro 😢",
    "Oru naal ellam maarum nu namburan 🌧️"
  ],
  Laughing: [
    "Mudila da saami! LOL! 💀",
    "Sirippu thaanga mudila baa! 🤣",
    "Vayiru valikura alavukku sirichiten! 😂",
    "Orey comedy thaan ponga haha! 😹",
    "Hahaha semma punch bro! 🔥",
    "Vera level timing ba! 👏"
  ]
};

const withTimeout = (promise: Promise<any>, ms: number = 15000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Network error. Please try again!")), ms)
    )
  ]);
};

export default function LetsChatApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [selectedMsgForDelete, setSelectedMsgForDelete] = useState<any>(null);
  const [contactToDelete, setContactToDelete] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw-push.js").catch(console.error);
      }
    }
  }, []);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [customGlassId, setCustomGlassId] = useState("");
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PWA Install State
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeChat, setActiveChat] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [editName, setEditName] = useState("");
  const [editGlassId, setEditGlassId] = useState("");
  const [profileMsg, setProfileMsg] = useState("");

  const [inputMsg, setInputMsg] = useState("");
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [activeStickerTab, setActiveStickerTab] = useState("Comedy");
  const [showTodModal, setShowTodModal] = useState(false);
  const [todType, setTodType] = useState<"Truth" | "Dare">("Truth");
  const [customTodQuestion, setCustomTodQuestion] = useState("");

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [searchGlassId, setSearchGlassId] = useState("");
  const [addContactError, setAddContactError] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // PWA பிடிபடும் நிகழ்வு
  useEffect(() => {
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallPrompt(false);
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, []);

  const triggerPwaInstall = async () => {
    if (!installPromptEvent) {
      alert("Use browser menu (⋮) -> 'Install app'.");
      return;
    }
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === "accepted") {
      setShowInstallPrompt(false);
      setInstallPromptEvent(null);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("lets_chat_active_user");
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      setEditName(user.name);
      setEditGlassId(user.glassId);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const reqRef = ref(db, `requests/${currentUser.glassId}`);
    const unsubscribeReq = onValue(reqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: IncomingRequest[] = Object.keys(data).map((key) => ({
          fromGlassId: key,
          fromName: data[key].senderName || `User ${key}`,
          fromAvatar: data[key].senderAvatar || `https://api.dicebear.com/7.x/micah/svg?seed=${key}`
        }));
        setIncomingRequests(list);
      } else {
        setIncomingRequests([]);
      }
    });

    const contactsRef = ref(db, `contacts/${currentUser.glassId}`);
    const unsubscribeContacts = onValue(contactsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: ChatContact[] = Object.keys(data).map((key) => ({
          glassId: key,
          name: data[key].name,
          avatarUrl: data[key].avatarUrl,
          lastMessage: data[key].lastMessage || "Connected",
          unread: data[key].unread || false
        }));
        setContacts(list);
      } else {
        setContacts([]);
      }
    });

    return () => {
      unsubscribeReq();
      unsubscribeContacts();
    };
  }, [currentUser]);

  // வாட்ஸ்அப் போன்ற புஷ் நோட்டிஃபிகேஷன் அமைத்தல்
  useEffect(() => {
    if (!currentUser || !activeChat) return;

    const roomId = [currentUser.glassId, activeChat.glassId].sort().join("_");
    const msgRef = ref(db, `chats/${roomId}/messages`);

    const unsubscribeMessages = onValue(msgRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed: ChatMessage[] = Object.keys(data).map((k) => ({
          id: k,
          ...data[k]
        }));
        setMessages(parsed);
        // Trigger system notification if screen locked or document hidden
        if (data) {
          const allMsgs = Object.values(data) as any[];
          const lastMsg = allMsgs[allMsgs.length - 1];
          if (lastMsg && lastMsg.senderId !== currentUser.glassId && document.hidden) {
            if ("Notification" in window && Notification.permission === "granted") {
              navigator.serviceWorker?.ready.then((reg) => {
                reg.showNotification(`New message from ${lastMsg.senderName || lastMsg.senderId}`, {
                  body: lastMsg.content,
                  icon: "/icon-192x192.png",
                  vibrate: [200, 100, 200],
                });
              });
            }
          }
        }

        const lastMsg = parsed[parsed.length - 1];
        if (
          lastMsg &&
          lastMsg.senderId !== currentUser.glassId &&
          document.visibilityState !== "visible"
        ) {
          if ("serviceWorker" in navigator && Notification.permission === "granted") {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(`LetsChat • ${lastMsg.senderName || "New Message"}`, {
                body: lastMsg.type === "text" ? lastMsg.content : `Sent a ${lastMsg.type}`,
                icon: "/icon-192.png",
                badge: "/icon-192.png"
              });
            });
          }
        }
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribeMessages();
  }, [currentUser, activeChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  
  const handleDeleteContact = async (contactGlassId: string) => {
    if (!currentUser) return;
    if (confirm("Are you sure you want to delete this contact and conversation?")) {
      try {
        const { remove, ref: dbRef } = await import("firebase/database");
        await remove(dbRef(db, `contacts/${currentUser.glassId}/${contactGlassId}`));
        if (activeChat?.glassId === contactGlassId) {
          setActiveChat(null);
        }
      } catch (err) {
        console.error("Delete contact error:", err);
      }
    }
  };

  const handleDeleteMessageForMe = (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setSelectedMsgForDelete(null);
  };

  const handleDeleteMessageForEveryone = async (msgId: string) => {
    if (!currentUser || !activeChat) return;
    try {
      const { update, ref: dbRef } = await import("firebase/database");
      const roomId = [currentUser.glassId, activeChat.glassId].sort().join("_");
      await update(dbRef(db, `chats/${roomId}/messages/${msgId}`), {
        isDeleted: true,
        content: "🚫 This message was deleted",
      });
    } catch (err) {
      console.error("Delete for everyone error:", err);
    }
    setSelectedMsgForDelete(null);
  };

  const handleOpenChat = async (contact: ChatContact) => {
    setActiveChat(contact);
    if (currentUser && contact.unread) {
      await set(ref(db, `contacts/${currentUser.glassId}/${contact.glassId}/unread`), false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) return setAuthError("Please enter your name.");
    if (mobile.length !== 10) return setAuthError("Please enter a valid 10-digit mobile number.");
    if (customGlassId.length !== 5) return setAuthError("Please enter a 5-digit Fancy Glass ID.");
    if (pin.length !== 4) return setAuthError("PIN must be exactly 4 digits.");

    setIsSubmitting(true);
    setAuthError("");

    try {
      const idCheck: any = await withTimeout(get(ref(db, `users/${customGlassId}`)));
      if (idCheck.exists()) {
        setIsSubmitting(false);
        return setAuthError("This 5-Digit ID is already taken. Please pick another.");
      }

      const newUser: UserProfile = {
        name: name.trim(),
        mobile,
        pin,
        glassId: customGlassId,
        avatarUrl: `https://api.dicebear.com/7.x/micah/svg?seed=${customGlassId}`
      };

      await withTimeout(set(ref(db, `users/${customGlassId}`), newUser));
      await withTimeout(set(ref(db, `mobileIndex/${mobile}`), customGlassId));

      localStorage.setItem("lets_chat_active_user", JSON.stringify(newUser));
      setCurrentUser(newUser);
      setEditName(newUser.name);
      setEditGlassId(newUser.glassId);
      setAuthError("");
    } catch {
      setAuthError("Network error. Please try again!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (mobile.length !== 10) return setAuthError("Please enter your 10-digit mobile number.");
    if (pin.length !== 4) return setAuthError("Please enter your 4-digit PIN.");

    setIsSubmitting(true);
    setAuthError("");

    try {
      const mobileSnap: any = await withTimeout(get(ref(db, `mobileIndex/${mobile}`)));
      if (!mobileSnap.exists()) {
        setIsSubmitting(false);
        return setAuthError("Mobile number not registered. Please switch to Register.");
      }

      const userGlassId = mobileSnap.val();
      const userSnap: any = await withTimeout(get(ref(db, `users/${userGlassId}`)));
      if (!userSnap.exists()) {
        setIsSubmitting(false);
        return setAuthError("User record not found.");
      }

      const user: UserProfile = userSnap.val();
      if (user.pin !== pin) {
        setIsSubmitting(false);
        return setAuthError("Incorrect PIN entered.");
      }

      localStorage.setItem("lets_chat_active_user", JSON.stringify(user));
      setCurrentUser(user);
      setEditName(user.name);
      setEditGlassId(user.glassId);
      setAuthError("");
    } catch {
      setAuthError("Network error. Please try again!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lets_chat_active_user");
    setCurrentUser(null);
    setActiveChat(null);
    setMobile("");
    setPin("");
    setName("");
    setCustomGlassId("");
    setIsRegister(true);
  };

  const handleSendConnectionRequest = async () => {
    if (!currentUser || isSending) return;
    if (searchGlassId.trim().length !== 5) {
      setAddContactError("Enter a valid 5-digit Glass ID.");
      return;
    }
    if (searchGlassId === currentUser.glassId) {
      setAddContactError("You cannot connect with your own ID.");
      return;
    }

    setIsSending(true);
    setAddContactError("");
    setRequestStatus("Verifying ID...");

    try {
      const targetUserSnap: any = await withTimeout(get(ref(db, `users/${searchGlassId}`)));
      if (!targetUserSnap.exists()) {
        setIsSending(false);
        setRequestStatus("");
        setAddContactError("No user found with this 5-digit ID.");
        return;
      }

      setRequestStatus("Sending request...");
      await withTimeout(
        set(ref(db, `requests/${searchGlassId}/${currentUser.glassId}`), {
          senderGlassId: currentUser.glassId,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatarUrl,
          timestamp: Date.now()
        })
      );

      setIsSending(false);
      setRequestStatus("Request sent! Waiting for acceptance...");
      setTimeout(() => {
        setShowAddContactModal(false);
        setSearchGlassId("");
        setRequestStatus("");
        setAddContactError("");
      }, 1500);
    } catch {
      setIsSending(false);
      setRequestStatus("");
      setAddContactError("Network error. Please try again!");
    }
  };

  const handleAcceptRequest = async (req: IncomingRequest) => {
    if (!currentUser) return;
    try {
      await withTimeout(
        set(ref(db, `contacts/${currentUser.glassId}/${req.fromGlassId}`), {
          glassId: req.fromGlassId,
          name: req.fromName,
          avatarUrl: req.fromAvatar,
          lastMessage: "Connected! Say Hi 👋",
          unread: false
        })
      );

      await withTimeout(
        set(ref(db, `contacts/${req.fromGlassId}/${currentUser.glassId}`), {
          glassId: currentUser.glassId,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
          lastMessage: "Connected! Say Hi 👋",
          unread: false
        })
      );

      await withTimeout(remove(ref(db, `requests/${currentUser.glassId}/${req.fromGlassId}`)));
    } catch {
      alert("Network error. Please try again!");
    }
  };

  const handleDeclineRequest = async (fromGlassId: string) => {
    if (!currentUser) return;
    await remove(ref(db, `requests/${currentUser.glassId}/${fromGlassId}`));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newUrl = reader.result as string;
        const updated = { ...currentUser, avatarUrl: newUrl };
        setCurrentUser(updated);
        localStorage.setItem("lets_chat_active_user", JSON.stringify(updated));
        await set(ref(db, `users/${currentUser.glassId}/avatarUrl`), newUrl);
        setProfileMsg("Profile Picture updated!");
        setTimeout(() => setProfileMsg(""), 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    if (!editName.trim()) return setProfileMsg("Name cannot be empty.");
    if (editGlassId.length !== 5) return setProfileMsg("Glass ID must be 5 digits.");

    try {
      if (editGlassId !== currentUser.glassId) {
        const check: any = await withTimeout(get(ref(db, `users/${editGlassId}`)));
        if (check.exists()) {
          return setProfileMsg("This ID is already taken. Try another 5-digit number.");
        }

        await remove(ref(db, `users/${currentUser.glassId}`));
        await set(ref(db, `mobileIndex/${currentUser.mobile}`), editGlassId);
      }

      const updated: UserProfile = {
        ...currentUser,
        name: editName.trim(),
        glassId: editGlassId
      };

      await set(ref(db, `users/${editGlassId}`), updated);
      localStorage.setItem("lets_chat_active_user", JSON.stringify(updated));
      setCurrentUser(updated);
      setProfileMsg("Profile updated successfully!");
      setTimeout(() => {
        setProfileMsg("");
        setShowProfileModal(false);
      }, 1200);
    } catch {
      setProfileMsg("Network error. Please try again!");
    }
  };

  const sendMessage = async (type: "text" | "sticker" | "tod_card", content: string, mode?: "Truth" | "Dare") => {
    if (!currentUser || !activeChat) return;

    const roomId = [currentUser.glassId, activeChat.glassId].sort().join("_");
    const newMsgRef = push(ref(db, `chats/${roomId}/messages`));

    const msgPayload = {
      senderId: currentUser.glassId,
      senderName: currentUser.name,
      type,
      content,
      todType: mode || null,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    await set(newMsgRef, msgPayload);
    const preview = type === "text" ? content : `Sent a ${type}`;

    await set(ref(db, `contacts/${currentUser.glassId}/${activeChat.glassId}/lastMessage`), preview);
    await set(ref(db, `contacts/${currentUser.glassId}/${activeChat.glassId}/unread`), false);

    await set(ref(db, `contacts/${activeChat.glassId}/${currentUser.glassId}/lastMessage`), preview);
    await set(ref(db, `contacts/${activeChat.glassId}/${currentUser.glassId}/unread`), true);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendMessage("text", inputMsg.trim());
    setInputMsg("");
  };

  const handleSendCustomTod = () => {
    if (!customTodQuestion.trim()) return;
    sendMessage("tod_card", customTodQuestion.trim(), todType);
    setCustomTodQuestion("");
    setShowTodModal(false);
  };

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-white flex items-center justify-center p-4">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
      
        <div className="w-full max-w-sm bg-white/90 backdrop-blur-2xl border border-rose-200/60 p-6 rounded-3xl shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Let's Chat
            </h1>
            <p className="text-xs text-gray-500 font-semibold tracking-wide">Secure 1-on-1 Messenger</p>
          </div>

          <div className="flex bg-rose-100/60 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setIsRegister(true); setAuthError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isRegister ? "bg-rose-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Register (New User)
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setAuthError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                !isRegister ? "bg-white text-rose-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Login
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-bold">
              {authError}
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Mobile Number</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-300">
                <span className="inline-flex items-center px-3.5 bg-gray-100 text-xs font-bold text-gray-700 border-r border-gray-300">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                  className="w-full px-4 py-2.5 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:outline-none"
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Choose 5-Digit Glass ID</label>
                <input
                  type="text"
                  placeholder="e.g. 77777 or 12345"
                  value={customGlassId}
                  onChange={(e) => setCustomGlassId(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  maxLength={5}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-center tracking-[0.3em] text-base font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">4-Digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-center tracking-[0.5em] text-lg font-black text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all mt-2 ${
                isSubmitting ? "bg-rose-300 cursor-not-allowed" : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              }`}
            >
              {isSubmitting
                ? "Processing..."
                : isRegister
                ? "Create Fresh Account"
                : "Sign In"}
            </button>
          </form>
        </div>
            {/* Delete Message Confirmation Modal */}
      {selectedMsgForDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setSelectedMsgForDelete(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 w-full max-w-sm shadow-2xl flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center py-1">
              Message Options
            </p>
            <button
              onClick={() => handleDeleteMessageForMe(selectedMsgForDelete.id)}
              className="w-full py-3 rounded-2xl bg-gray-50 text-gray-700 font-semibold text-xs text-center hover:bg-gray-100 transition-all"
            >
              Delete for Me
            </button>
            {selectedMsgForDelete.senderId === currentUser?.glassId && (
              <button
                onClick={() => handleDeleteMessageForEveryone(selectedMsgForDelete.id)}
                className="w-full py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-xs text-center hover:bg-rose-100 transition-all"
              >
                Delete for Everyone
              </button>
            )}
            <button
              onClick={() => setSelectedMsgForDelete(null)}
              className="w-full py-2 text-gray-400 font-semibold text-xs text-center mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-rose-100 via-pink-50 to-white flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
      <div className="w-full h-full sm:max-w-md sm:h-[92vh] bg-white/80 backdrop-blur-2xl border border-white/60 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* PWA INSTALL BANNER */}
        {showInstallPrompt && (
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-2.5 px-4 flex items-center justify-between shadow-lg z-30">
            <div className="flex items-center gap-2">
              <FiDownload className="text-base animate-bounce" />
              <div>
                <p className="text-xs font-bold leading-tight">Install LetsChat</p>
                <p className="text-[10px] text-rose-100">Standalone app without Chrome badge</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={triggerPwaInstall}
                className="px-3 py-1 bg-white text-rose-600 rounded-lg text-xs font-extrabold shadow active:scale-95 transition-all"
              >
                Install Now
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <FiX className="text-sm" />
              </button>
            </div>
          </div>
        )}

        {!activeChat ? (
          <>
            <header className="p-4 border-b border-rose-100 flex items-center justify-between bg-white/60">
              <div
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-3 cursor-pointer group"
                title="Click to edit Profile"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-rose-300 group-hover:opacity-85 transition-all"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1 rounded-full text-[9px] shadow">
                    <FiEdit2 />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight group-hover:text-rose-600 transition-colors">
                    {currentUser.name}
                  </h2>
                  <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                    ID: {currentUser.glassId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRequestsModal(true)}
                  className="relative p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-all"
                  title="Incoming Requests"
                >
                  <FiHeart className="text-lg fill-rose-500/20" />
                  {incomingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow">
                      {incomingRequests.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-all"
                  title="Add Connection"
                >
                  <FiUserPlus className="text-lg" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-all"
                  title="Logout"
                >
                  <FiLogOut className="text-lg" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {contacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-2xl">
                    👋
                  </div>
                  <h3 className="font-bold text-gray-800 text-base">Zero Contacts</h3>
                  <p className="text-xs text-gray-600 max-w-xs">
                    Your account is private. Share your 5-digit Glass ID (<strong>{currentUser.glassId}</strong>) or add a friend's ID to begin chatting.
                  </p>
                  <button
                    onClick={() => setShowAddContactModal(true)}
                    className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow hover:bg-rose-600 transition-all"
                  >
                    Enter 5-Digit ID
                  </button>
                </div>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.glassId}
                    onClick={() => handleOpenChat(contact)}
                    className="flex items-center gap-3 p-3 bg-white/80 hover:bg-white rounded-2xl border border-rose-100 cursor-pointer transition-all shadow-sm relative"
                  >
                    <img
                      src={contact.avatarUrl}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover border border-rose-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <p className="font-bold text-sm text-gray-900 truncate">{contact.name}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.glassId);
                              }}
                              className="p-1 text-gray-300 hover:text-rose-600 transition-colors"
                              title="Delete Contact"
                            >
                              <FiTrash2 className="text-xs" />
                            </button>
                          </div>
                        <span className="text-[10px] text-rose-500 font-bold">#{contact.glassId}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{contact.lastMessage}</p>
                    </div>

                    {contact.unread && (
                      <div className="w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <header className="p-3 border-b border-rose-100 flex items-center justify-between bg-white/70 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="p-2 hover:bg-rose-100 rounded-full text-rose-600"
                >
                  <FiArrowLeft className="text-lg" />
                </button>
                <img
                  src={activeChat.avatarUrl}
                  alt={activeChat.name}
                  className="w-10 h-10 rounded-full object-cover border border-rose-200"
                />
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{activeChat.name}</h3>
                  <p className="text-[10px] text-rose-600 font-bold">Glass ID: {activeChat.glassId}</p>
                </div>
              </div>

              <button
                onClick={() => setShowTodModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                <FaDice className="text-sm" /> Truth / Dare
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser.glassId;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
                    {msg.type === "tod_card" ? (
                      <div className="max-w-[85%] bg-gradient-to-r from-rose-500 to-pink-500 text-white p-3.5 rounded-2xl shadow-md space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-black tracking-wide uppercase bg-black/20 px-2 py-0.5 rounded-md w-fit">
                          🎲 {msg.todType} Challenge
                        </div>
                        <p className="text-sm font-semibold">{msg.content}</p>
                        <span className="block text-[10px] text-rose-100 text-right">{msg.timestamp}</span>
                      </div>
                    ) : msg.type === "sticker" ? (
                      <div className="p-3 bg-white/95 border border-rose-200 rounded-2xl shadow-sm text-center">
                        <p className="text-sm font-bold text-rose-600">{msg.content}</p>
                        <span className="block text-[9px] text-gray-500 mt-1">{msg.timestamp}</span>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm font-medium ${
                          isMe
                            ? "bg-rose-500 text-white rounded-br-none"
                            : "bg-white text-gray-900 rounded-bl-none border border-rose-100"
                        }`}
                      >
                        {msg.isDeleted ? (
                            <p className="italic text-xs opacity-75">🚫 This message was deleted</p>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <p>{msg.content}</p>
                              <button
                                onClick={() => setSelectedMsgForDelete(msg)}
                                className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-0.5 text-xs transition-opacity"
                                title="Delete"
                              >
                                <FiTrash2 className="text-[10px]" />
                              </button>
                            </div>
                          )}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-[9px] ${isMe ? "text-rose-200" : "text-gray-500"}`}>
                            {msg.timestamp}
                          </span>
                          {isMe && <FiCheck className="text-[10px] text-rose-200" />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {showStickerDrawer && (
              <div className="p-3 bg-white/95 border-t border-rose-100 max-h-56 flex flex-col">
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-rose-100">
                  {Object.keys(TANGLISH_STICKERS).map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveStickerTab(category)}
                      className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap transition-all ${
                        activeStickerTab === category ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 overflow-y-auto pt-2">
                  {TANGLISH_STICKERS[activeStickerTab].map((sticker, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sendMessage("sticker", sticker);
                        setShowStickerDrawer(false);
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-xl text-xs font-semibold text-gray-800 text-left transition-all"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>
            )}

                        {replyingTo && (
              <div className="mx-4 mb-2 p-2 px-3 rounded-2xl bg-white border-l-4 border-rose-500 shadow-sm flex items-center justify-between">
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-rose-500">Replying to {replyingTo.senderName || replyingTo.senderId}</span>
                  <span className="text-gray-500 line-clamp-1">{replyingTo.content}</span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}
            <form
              onSubmit={handleSendText}
              className="p-3 border-t border-rose-100 bg-white/70 backdrop-blur-md flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setShowStickerDrawer((prev) => !prev)}
                className="p-2.5 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-full transition-all"
                title="Stickers"
              >
                <FiSmile className="text-lg" />
              </button>

              <input
                type="text"
                placeholder="Type your message..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-full text-sm text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              />

              <button
                type="submit"
                className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md active:scale-95 transition-all"
              >
                <FiSend className="text-base" />
              </button>
            </form>
          </>
        )}

        {/* Requests Modal */}
        {showRequestsModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <FiHeart className="text-rose-500 fill-rose-500" />
                  <h4 className="font-bold text-gray-900 text-sm">Connection Requests</h4>
                </div>
                <button onClick={() => setShowRequestsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <FiX className="text-lg" />
                </button>
              </div>

              {incomingRequests.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No pending connection requests right now.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {incomingRequests.map((req) => (
                    <div key={req.fromGlassId} className="flex items-center justify-between p-2.5 bg-rose-50/70 rounded-2xl border border-rose-100">
                      <div className="flex items-center gap-2">
                        <img src={req.fromAvatar} alt={req.fromName} className="w-9 h-9 rounded-full object-cover border border-rose-300" />
                        <div>
                          <p className="text-xs font-bold text-gray-800">{req.fromName}</p>
                          <p className="text-[10px] text-rose-500 font-bold">ID: {req.fromGlassId}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="px-2.5 py-1 bg-rose-500 text-white text-[11px] font-bold rounded-lg shadow hover:bg-rose-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.fromGlassId)}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-[11px] font-bold rounded-lg hover:bg-gray-300"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {showProfileModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-center relative">
              <button
                onClick={() => { setShowProfileModal(false); setProfileMsg(""); }}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <FiX className="text-lg" />
              </button>

              <h4 className="font-bold text-gray-900 text-base">Edit Profile</h4>

              <div className="relative w-20 h-20 mx-auto">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover border-2 border-rose-400 shadow-md"
                />
                <label className="absolute bottom-0 right-0 p-1.5 bg-rose-500 text-white rounded-full cursor-pointer shadow hover:bg-rose-600">
                  <FiCamera className="text-xs" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              {profileMsg && (
                <p className="text-[11px] font-bold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-100">
                  {profileMsg}
                </p>
              )}

              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">5-Digit Glass ID</label>
                  <input
                    type="text"
                    value={editGlassId}
                    onChange={(e) => setEditGlassId(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    maxLength={5}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-center text-sm font-bold tracking-widest text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow active:scale-95 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Truth or Dare Modal */}
        {showTodModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <h4 className="font-bold text-center text-gray-900 text-base">Custom Truth or Dare</h4>
              <div className="flex bg-rose-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTodType("Truth")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    todType === "Truth" ? "bg-rose-500 text-white" : "text-rose-700"
                  }`}
                >
                  TRUTH
                </button>
                <button
                  type="button"
                  onClick={() => setTodType("Dare")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    todType === "Dare" ? "bg-rose-500 text-white" : "text-rose-700"
                  }`}
                >
                  DARE
                </button>
              </div>

              <textarea
                placeholder={`Type your custom ${todType} challenge here...`}
                value={customTodQuestion}
                onChange={(e) => setCustomTodQuestion(e.target.value)}
                rows={3}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTodModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendCustomTod}
                  className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow"
                >
                  Send Challenge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connect Modal */}
        {showAddContactModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <h4 className="font-bold text-center text-gray-900 text-base">Connect via 5-Digit ID</h4>
              {addContactError && (
                <p className="text-[11px] text-red-500 text-center font-bold">{addContactError}</p>
              )}
              {requestStatus && (
                <p className="text-[11px] text-emerald-600 text-center font-bold">{requestStatus}</p>
              )}
              <input
                type="text"
                placeholder="Enter 5-digit Glass ID"
                value={searchGlassId}
                onChange={(e) => setSearchGlassId(e.target.value.replace(/\D/g, "").slice(0, 5))}
                maxLength={5}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-center font-bold tracking-widest text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddContactModal(false); setAddContactError(""); setRequestStatus(""); }}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendConnectionRequest}
                  disabled={isSending}
                  className={`flex-1 py-2 text-white text-xs font-bold rounded-xl shadow transition-all ${
                    isSending ? "bg-rose-300 cursor-not-allowed" : "bg-rose-500 hover:bg-rose-600"
                  }`}
                >
                  {isSending ? "Sending..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}



