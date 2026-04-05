import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const MeetingRoom = () => {
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit("joinRoom", id);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [id]);

  const sendMessage = () => {
    if (!message) return;

    socket.emit("sendMessage", {
      roomId: id,
      message
    });

    setMessage("");
  };

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold">Meeting Room: {id}</h2>

      <div className="h-80 overflow-y-auto border p-3 my-3">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            {msg}
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border p-2 mr-2"
        placeholder="Type message..."
      />

      <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2">
        Send
      </button>
    </div>
  );
};

export default MeetingRoom;

