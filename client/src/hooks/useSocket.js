import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';

let socketInstance = null;

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    if (!socketInstance) {
      socketInstance = io('http://localhost:5000', { withCredentials: true });
    }

    socketRef.current = socketInstance;
    socketInstance.emit('join', user._id);

    return () => {
      // Don't disconnect on component unmount — keep alive for notifications
    };
  }, [user]);

  return socketRef.current || socketInstance;
};

export default useSocket;
