"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiSmile,
  FiUserPlus,
  FiLogOut,
  FiArrowLeft,
  FiCheck,
  FiCamera,
  FiEdit2,
  FiX
} from "react-icons/fi";
import { FaDice } from "react-icons/fa";

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
  id: string;
  glassId: string;
  name: string;
  avatarUrl: string;
  lastMessage: string;
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

export default function LetsChatApp() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [authError, setAuthError] = useState("");

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeChat, setActiveChat] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  const [inputMsg, setInputMsg] = useState("");
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [activeStickerTab, setActiveStickerTab] = useState("Comedy");
  const [showTodModal, setShowTodModal] = useState(false);
  const [todType, setTodType] = useState<"Truth" | "Dare">("Truth");
  const [customTodQuestion, setCustomTodQuestion] = useState("");

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [searchGlassId, setSearchGlassId] = useState("");
  const [addContactError, setAddContactError] = useState("");

  const [showProfileModal, setShowProfileModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("lets_chat_active_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const handleMobileInput = (val: string) => {
    const num = val.replace(/\D/g, "");
    if (num.length <= 10) setMobile(num);
  };

  const handlePinInput = (val: string) => {
    const num = val.replace(/\D/g, "");
    if (num.length <= 4) setPin(num);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>, isInsideApp = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isInsideApp && currentUser) {
          const updated = { ...currentUser, avatarUrl: result };
          setCurrentUser(updated);
          localStorage.setItem("lets_chat_active_user", JSON.stringify(updated));
          localStorage.setItem(`user_db_${currentUser.mobile}`, JSON.stringify(updated));
        } else {
          setAvatarPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setAuthError("தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்.");
    if (mobile.length !== 10) return setAuthError("10 இலக்க மொபைல் எண்ணை சரியாக உள்ளிடவும்.");
    if (pin.length !== 4) return setAuthError("பின் எண் சரியாக 4 இலக்கங்களாக மட்டுமே இருக்க வேண்டும்.");

    const generatedGlassId = Math.floor(10000 + Math.random() * 90000).toString();
    const newUser: UserProfile = {
      name: name.trim(),
      mobile,
      pin,
      glassId: generatedGlassId,
      avatarUrl: avatarPreview || `https://api.dicebear.com/7.x/micah/svg?seed=${name.trim()}`
    };

    localStorage.setItem(`user_db_${mobile}`, JSON.stringify(newUser));
    localStorage.setItem("lets_chat_active_user", JSON.stringify(newUser));
    setCurrentUser(newUser);
    setAuthError("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 10) return setAuthError("10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.");
    if (pin.length !== 4) return setAuthError("4 இலக்க பின் எண்ணை உள்ளிடவும்.");

    const storedData = localStorage.getItem(`user_db_${mobile}`);
    if (!storedData) {
      return setAuthError("இந்த மொபைல் எண் பதிவு செய்யப்படவில்லை. தயவுசெய்து Register செய்யவும்.");
    }

    const parsed: UserProfile = JSON.parse(storedData);
    if (parsed.pin !== pin) {
      return setAuthError("தவறான பின் எண்!");
    }

    localStorage.setItem("lets_chat_active_user", JSON.stringify(parsed));
    setCurrentUser(parsed);
    setAuthError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("lets_chat_active_user");
    setCurrentUser(null);
    setActiveChat(null);
    setMobile("");
    setPin("");
    setName("");
    setAvatarPreview("");
  };

  const sendDirectMessage = (
    type: "text" | "sticker" | "tod_card",
    content: string,
    mode?: "Truth" | "Dare"
  ) => {
    if (!activeChat || !currentUser) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.glassId,
      senderName: currentUser.name,
      type,
      content,
      todType: mode,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat.glassId]: [...(prev[activeChat.glassId] || []), newMsg]
    }));

    setContacts((prev) =>
      prev.map((c) =>
        c.glassId === activeChat.glassId
          ? { ...c, lastMessage: type === "text" ? content : `Sent ${type}` }
          : c
      )
    );
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendDirectMessage("text", inputMsg.trim());
    setInputMsg("");
  };

  const handleSendCustomTod = () => {
    if (!customTodQuestion.trim()) return;
    sendDirectMessage("tod_card", customTodQuestion.trim(), todType);
    setCustomTodQuestion("");
    setShowTodModal(false);
  };

  const handleAddFriend = () => {
    if (searchGlassId.trim().length !== 5) {
      setAddContactError("சரியான 5 இலக்க Glass ID-யை உள்ளிடவும்.");
      return;
    }
    if (searchGlassId === currentUser?.glassId) {
      setAddContactError("உங்கள் சொந்த ஐடியையே சேர்க்க முடியாது.");
      return;
    }

    const newContact: ChatContact = {
      id: Date.now().toString(),
      glassId: searchGlassId,
      name: `User ${searchGlassId}`,
      avatarUrl: `https://api.dicebear.com/7.x/micah/svg?seed=${searchGlassId}`,
      lastMessage: "Connected! Say Hi 👋"
    };

    setContacts((prev) => [...prev, newContact]);
    setActiveChat(newContact);
    setShowAddContactModal(false);
    setSearchGlassId("");
    setAddContactError("");
  };

  // Login & Register Screen
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-white flex items-center justify-center p-4">
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
              onClick={() => { setIsRegister(false); setAuthError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                !isRegister ? "bg-white text-rose-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setAuthError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isRegister ? "bg-rose-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-bold">
              {authError}
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {/* Name Field */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  முழு பெயர் (Full Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="உங்கள் பெயரை உள்ளிடவும்"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50/90 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                  required
                />
              </div>
            )}

            {/* Mobile Number Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                மொபைல் எண் (Mobile Number) <span className="text-rose-500">*</span>
              </label>
              <div className="flex rounded-xl shadow-sm overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-rose-400">
                <span className="inline-flex items-center px-3.5 bg-gray-100 text-xs font-bold text-gray-700 border-r border-gray-300">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="10 இலக்க மொபைல் எண்"
                  value={mobile}
                  onChange={(e) => handleMobileInput(e.target.value)}
                  maxLength={10}
                  className="w-full px-4 py-2.5 bg-gray-50/90 text-sm text-gray-900 placeholder-gray-400 font-medium focus:bg-white focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* 4-Digit PIN Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                4-இலக்க பின் (4-Digit PIN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={(e) => handlePinInput(e.target.value)}
                maxLength={4}
                className="w-full px-4 py-2.5 bg-gray-50/90 border border-gray-300 rounded-xl text-center tracking-[0.5em] text-lg font-black text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                required
              />
              <p className="text-[11px] text-gray-500 font-medium mt-1 text-center">சரியாக 4 எண்கள் மட்டுமே உள்ளிட முடியும்</p>
            </div>

            {/* Profile Picture (Optional) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Profile Picture <span className="text-gray-400 font-normal">(விருப்பப்பட்டால் மட்டும்)</span>
                </label>
                <div className="flex items-center gap-3 bg-gray-50/90 p-2 border border-gray-300 rounded-xl">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-rose-300" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                      <FiCamera className="text-lg" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarFile(e, false)}
                    className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-500 file:text-white cursor-pointer"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all mt-2"
            >
              {isRegister ? "கணக்கை உருவாக்கு (Register)" : "உள்நுழை (Login)"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Logged-in App Screen
  return (
    <div className="h-screen w-full bg-gradient-to-br from-rose-100 via-pink-50 to-white flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full h-full sm:max-w-md sm:h-[92vh] bg-white/80 backdrop-blur-2xl border border-white/60 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {!activeChat ? (
          <>
            <header className="p-4 border-b border-rose-100 flex items-center justify-between bg-white/60">
              <div
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-3 cursor-pointer group"
                title="படத்தை மாற்ற கிளிக் செய்யவும்"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-rose-300 group-hover:opacity-80 transition-all"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1 rounded-full text-[9px] shadow">
                    <FiEdit2 />
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight group-hover:text-rose-600 transition-colors">
                    {currentUser.name}
                  </h2>
                  <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-100/90 px-2 py-0.5 rounded-full">
                    ID: {currentUser.glassId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                  <h3 className="font-bold text-gray-800 text-base">தொடர்புகள் இல்லை (Zero Contacts)</h3>
                  <p className="text-xs text-gray-600 max-w-xs">
                    உங்கள் கணக்கு பாதுகாப்பானது. உங்கள் 5-இலக்க Glass ID-யை (<strong>{currentUser.glassId}</strong>) பகிரவும் அல்லது நண்பரின் ஐடியை உள்ளிட்டுக் கலந்துரையாடுங்கள்.
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
                    onClick={() => setActiveChat(contact)}
                    className="flex items-center gap-3 p-3 bg-white/80 hover:bg-white rounded-2xl border border-rose-100 cursor-pointer transition-all shadow-sm"
                  >
                    <img
                      src={contact.avatarUrl}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover border border-rose-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-gray-900 truncate">{contact.name}</p>
                        <span className="text-[10px] text-rose-500 font-bold">#{contact.glassId}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{contact.lastMessage}</p>
                    </div>
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
              {(messages[activeChat.glassId] || []).map((msg) => {
                const isMe = msg.senderId === currentUser.glassId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
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
                        <p>{msg.content}</p>
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
                        activeStickerTab === category
                          ? "bg-rose-500 text-white shadow-sm"
                          : "bg-rose-50 text-rose-700"
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
                        sendDirectMessage("sticker", sticker);
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

            <form
              onSubmit={handleSendText}
              className="p-3 border-t border-rose-100 bg-white/70 backdrop-blur-md flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setShowStickerDrawer((prev) => !prev)}
                className="p-2.5 bg-rose-100/80 hover:bg-rose-200 text-rose-600 rounded-full transition-all"
                title="Stickers"
              >
                <FiSmile className="text-lg" />
              </button>

              <input
                type="text"
                placeholder="செய்தியை தட்டச்சு செய்யவும்..."
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

        {/* Profile Picture Update Modal */}
        {showProfileModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-center relative">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <FiX className="text-lg" />
              </button>
              <h4 className="font-bold text-gray-900 text-base">Update Profile Picture</h4>
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-rose-400 shadow-md">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-gray-600">புதிய படத்தை தேர்ந்தெடுத்து சேமிக்கவும்</p>
              <label className="block w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow active:scale-95 transition-all">
                Choose New Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleAvatarFile(e, true);
                    setShowProfileModal(false);
                  }}
                  className="hidden"
                />
              </label>
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
                placeholder={`உங்கள் ${todType} கேள்வியை அல்லது சவாலை இங்கே தட்டச்சு செய்யவும்...`}
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

        {/* Add Connection Modal */}
        {showAddContactModal && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <h4 className="font-bold text-center text-gray-900 text-base">Connect via 5-Digit ID</h4>
              {addContactError && (
                <p className="text-[11px] text-red-500 text-center font-bold">{addContactError}</p>
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
                  onClick={() => { setShowAddContactModal(false); setAddContactError(""); }}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddFriend}
                  className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow"
                >
                  Connect & Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
