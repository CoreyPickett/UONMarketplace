// src/utils/messageUtils.js
import { getAuth } from "firebase/auth";
import { api } from "../api";

export async function sendMessage(conversationId, messageText, onSuccess) {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Not logged in");
  const token = await user.getIdToken();

  await api.post(
    `/messages/${conversationId}/messages`,
    { body: messageText },
    { headers: { authtoken: token } }
  );

  if (typeof onSuccess === "function") {
    onSuccess();
  }
}