import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Detection from "./pages/Detection";
import Log from "./pages/Log";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/detection" element={<Detection />} />
      <Route path="/log" element={<Log />} />
    </Routes>
  );
}

export default AppRoutes;
