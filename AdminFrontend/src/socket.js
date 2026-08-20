import { io } from "socket.io-client";
import { SOCKET_URL } from "./config/api";

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
};

const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    auth: {
        token: getCookie('admin_token')
    }
});

export default socket;
