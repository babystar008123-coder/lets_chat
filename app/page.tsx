"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiSmile,
  FiUserPlus,
  FiLogOut,
  FiArrowLeft,
  FiCheck,
  FiCamera
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
  type: "text" | "sticker" | "tod_card" | "tod_response";
  content: string;
  subContent?: string;
  todType?: "Truth" | "Dare";
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

interface ChatContact {
  id: string;
  glassId: string;
  name: string;
  avatarUrl: string;
  lastMessage: string;
  unreadCount: number;
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
    const numeric = val.replace(/\D/g, "");
    if (numeric.length <= 10) setMobile(numeric);
  };

  const handlePinInput = (val: string) => {
    const numeric = val.replace(/\D/g, "");
    if (numeric.length <= 4) setPin(numeric);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setAuthError("Please enter your name.");
    if (mobile.length !== 10) return setAuthError("Enter a valid 10-digit mobile number.");
    if (pin.length !== 4) return setAuthError("PIN must be exactly 4 digits.");

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
    if (mobile.length !== 10) return setAuthError("Enter your 10-digit mobile number.");
    if (pin.length !== 4) return setAuthError("Enter your 4-digit PIN.");

    const storedData = localStorage.getItem(`user_db_${mobile}`);
    if (!storedData) {
      return setAuthError("Mobile number not registered. Please switch to Register.");
    }

    const parsed: UserProfile = JSON.parse(storedData);
    if (parsed.pin !== pin) {
      return setAuthError("Incorrect PIN.");
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
    type: "text" | "sticker" | "tod_card" | "tod_response",
    content: string,
    subContent?: string,
    mode?: "Truth" | "Dare"
  ) => {
    if (!activeChat || !currentUser) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.glassId,
      senderName: currentUser.name,
      type,
      content,
      subContent,
      todType: mode,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read"
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat.glassId]: [...(prev[activeChat.glassId] || []), newMsg]
    }));

    setContacts((prev) =>
      prev.map((c) =>
        c.glassId === activeChat.glassId
          ? { ...c, lastMessage: type === "text" ? content : `Sent a ${type}` }
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
    sendDirectMessage("tod_card", customTodQuestion.trim(), undefined, todType);
    setCustomTodQuestion("");
    setShowTodModal(false);
  };

  const handleSendConnectionRequest = () => {
    if (searchGlassId.trim().length !== 5) {
      setAddContactError("Enter a valid 5-digit Glass ID.");
      return;
    }
    if (searchGlassId === currentUser?.glassId) {
      setAddContactError("You cannot connect with your own Glass ID.");
      return;
    }

    const newFriend: ChatContact = {
      id: Date.now().toString(),
      glassId: searchGlassId,
      name: `User ${searchGlassId}`,
      avatarUrl: `https://api.dicebear.com/7.x/micah/svg?seed=${searchGlassId}`,
      lastMessage: "Connected! Say Hi 👋",
      unreadCount: 0
    };

    setContacts((prev) => [...prev, newFriend]);
    setShowAddContactModal(false);
    setSearchGlassId("");
    setAddContactError("");
  };

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/70 backdrop-blur-2xl border border-white/60 p-6 rounded-3xl shadow-xl space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              Let's Chat
            </h1>
            <p className="text-xs text-rose-900/60 font-medium">Private 1-on-1 Glassmorphic Messenger</p>
          </div>

          <div className="flex bg-rose-200/40 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setAuthError(""); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                !isRegister ? "bg-white text-rose-600 shadow-sm" : "text-rose-950/70"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setAuthError(""); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                isRegister ? "bg-rose-500 text-white shadow-sm" : "text-rose-950/70"
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-100/80 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-rose-900 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-rose-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-rose-900 mb-1">Mobile Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-rose-200/40 border border-r-0 border-rose-200/60 rounded-l-xl text-xs font-bold text-rose-800">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={mobile}
                  onChange={(e) => handleMobileInput(e.target.value)}
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-rose-200/60 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-rose-900 mb-1">4-Digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={(e) => handlePinInput(e.target.value)}
                maxLength={4}
                className="w-full px-3.5 py-2.5 bg-white/80 border border-rose-200/60 rounded-xl text-center tracking-widest text-base font-bold focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
              <p className="text-[10px] text-rose-900/50 mt-1 text-center">4 numeric digits only</p>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-rose-900 mb-1">
                  Profile Picture <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-rose-300" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center text-rose-500">
                      <FiCamera className="text-lg" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="text-xs text-rose-900 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-rose-500 file:text-white cursor-pointer"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all mt-2"
            >
              {isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-rose-100 via-pink-50 to-white flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full h-full sm:max-w-md sm:h-[92vh] bg-white/70 backdrop-blur-2xl border border-white/60 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {!activeChat ? (
          <>
            <header className="p-4 border-b border-rose-100 flex items-center justify-between bg-white/40">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-rose-300"
                />
                <div>
                  <h2 className="text-base font-bold text-gray-800 leading-tight">{currentUser.name}</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-100/80 px-2 py-0.5 rounded-full">
                      ID: {currentUser.glassId}
                    </span>
                  </div>
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
                  <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-400 text-2xl">
                    👋
                  </div>
                  <h3 className="font-bold text-gray-700">Zero Contacts</h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Your account is private. Share your 5-digit Glass ID (<strong>{currentUser.glassId}</strong>) or add a friend's ID to begin chatting.
                  </p>
                  <button
                    onClick={() => setShowAddContactModal(true)}
                    className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-semibold shadow hover:bg-rose-600 transition-all"
                  >
                    Enter 5-Digit ID
                  </button>
                </div>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.glassId}
                    onClick={() => setActiveChat(contact)}
                    className="flex items-center gap-3 p-3 bg-white/60 hover:bg-white/90 rounded-2xl border border-rose-100/60 cursor-pointer transition-all shadow-sm"
                  >
                    <img
                      src={contact.avatarUrl}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover border border-rose-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-gray-800 truncate">{contact.name}</p>
                        <span className="text-[10px] text-rose-400 font-bold">#{contact.glassId}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{contact.lastMessage}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <header className="p-3 border-b border-rose-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="p-2 hover:bg-rose-100/60 rounded-full text-rose-600"
                >
                  <FiArrowLeft className="text-lg" />
                </button>
                <img
                  src={activeChat.avatarUrl}
                  alt={activeChat.name}
                  className="w-10 h-10 rounded-full object-cover border border-rose-200"
                />
                <div>
                  <h3 className="font-bold text-sm text-gray-800">{activeChat.name}</h3>
                  <p className="text-[10px] text-rose-500 font-semibold">Glass ID: {activeChat.glassId}</p>
                </div>
              </div>

              <button
                onClick={() => setShowTodModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-full text-xs font-bold transition-all"
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
                      <div className="p-3 bg-white/90 border border-rose-200/80 rounded-2xl shadow-sm text-center">
                        <p className="text-sm font-bold text-rose-600">{msg.content}</p>
                        <span className="block text-[9px] text-gray-400 mt-1">{msg.timestamp}</span>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMe
                            ? "bg-rose-500 text-white rounded-br-none"
                            : "bg-white/90 text-gray-800 rounded-bl-none border border-rose-100"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-[9px] ${isMe ? "text-rose-200" : "text-gray-400"}`}>
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
                      className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
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
                      className="p-2 bg-rose-50/60 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-medium text-gray-800 text-left transition-all"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={handleSendText}
              className="p-3 border-t border-rose-100 bg-white/60 backdrop-blur-md flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setShowStickerDrawer((prev) => !prev)}
                className="p-2.5 bg-rose-100/70 hover:bg-rose-200 text-rose-600 rounded-full transition-all"
              >
                <FiSmile className="text-lg" />
              </button>

              <input
                type="text"
                placeholder="Type your message..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white/80 border border-rose-200/60 rounded-full text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
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

        {showTodModal && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <h4 className="font-bold text-center text-gray-800 text-base">Custom Truth or Dare</h4>
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
                placeholder={`Type your custom ${todType} question here...`}
                value={customTodQuestion}
                onChange={(e) => setCustomTodQuestion(e.target.value)}
                rows={3}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTodModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendCustomTod}
                  className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl shadow"
                >
                  Send Task
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddContactModal && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-4">
              <h4 className="font-bold text-center text-gray-800 text-base">Connect via 5-Digit ID</h4>
              {addContactError && (
                <p className="text-[11px] text-red-500 text-center font-medium">{addContactError}</p>
              )}
              <input
                type="text"
                placeholder="Enter 5-digit Glass ID"
                value={searchGlassId}
                onChange={(e) => setSearchGlassId(e.target.value.replace(/\D/g, "").slice(0, 5))}
                maxLength={5}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center font-bold tracking-widest text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddContactModal(false); setAddContactError(""); }}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendConnectionRequest}
                  className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl shadow"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
