"use client";
import React from "react";
import { ref as dbRef, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";

interface MessageActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: any;
  currentUserId: string;
  activeChatId: string;
  onDeleteForMe: (msgId: string) => void;
  onDeleteForEveryoneSuccess: (msgId: string) => void;
}

export default function MessageActionModal({
  isOpen,
  onClose,
  message,
  currentUserId,
  activeChatId,
  onDeleteForMe,
  onDeleteForEveryoneSuccess,
}: MessageActionModalProps) {
  if (!isOpen || !message) return null;

  const isSender = message.senderId === currentUserId;

  const handleDeleteForEveryone = async () => {
    try {
      const roomId = [currentUserId, activeChatId].sort().join("_");
      const targetRef = dbRef(db, `chats/${roomId}/messages/${message.id}`);
      await update(targetRef, {
        isDeleted: true,
        content: "🚫 This message was deleted",
        type: "text",
      });
      onDeleteForEveryoneSuccess(message.id);
      onClose();
    } catch (err: any) {
      console.error("Delete for everyone error:", err);
      // Fallback: remove totally if update rule blocks
      try {
        const roomId = [currentUserId, activeChatId].sort().join("_");
        await remove(dbRef(db, `chats/${roomId}/messages/${message.id}`));
        onDeleteForEveryoneSuccess(message.id);
        onClose();
      } catch (e) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999999] flex items-end justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-1" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
          Message Options
        </p>

        {/* Delete for you */}
        <button
          type="button"
          onClick={() => {
            onDeleteForMe(message.id);
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-gray-100 active:bg-gray-200 text-gray-800 font-bold text-xs text-center transition-all cursor-pointer"
        >
          Delete for you
        </button>

        {/* Delete for everyone */}
        {isSender && !message.isDeleted && (
          <button
            type="button"
            onClick={handleDeleteForEveryone}
            className="w-full py-3.5 rounded-2xl bg-rose-50 active:bg-rose-100 text-rose-600 font-black text-xs text-center border border-rose-200 transition-all cursor-pointer"
          >
            Delete for everyone
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-gray-400 font-bold text-xs text-center mt-1 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
