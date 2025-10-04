import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Chat from "./Chat";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:owner/:repo" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}
