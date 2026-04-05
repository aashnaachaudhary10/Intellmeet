import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [meetingId, setMeetingId] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!meetingId) return;
    navigate(`/meeting/${meetingId}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Enter Meeting ID</h2>

      <input
        value={meetingId}
        onChange={(e) => setMeetingId(e.target.value)}
        placeholder="Enter Meeting ID"
      />

      <button onClick={handleJoin}>Join Meeting</button>
    </div>
  );
};

export default Login;