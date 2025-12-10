import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (): Socket | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No token found, cannot initialize socket");
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  socket = io("http://localhost:4000", {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  if (!socket || !socket.connected) {
    return initializeSocket();
  }
  return socket;
};

export default socket;

