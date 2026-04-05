import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import MeetingRoom from "./pages/MeetingRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/meeting/:id" element={<MeetingRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;