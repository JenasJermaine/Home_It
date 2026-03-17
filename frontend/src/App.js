import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import Sidebar from "./components/Sidebar";
import SignUpPage from "./pages/SignUp";
import SignInPage from "./pages/SignIn";
import HomePage from "./pages/HomePage";
import BuyPage from "./pages/Buy";
import SellPage from "./pages/Sell";
import MyListingsPage from "./pages/MyListings";
import PriceEstimatorPage from "./pages/PriceEstimator";
import BookmarksPage from "./pages/Bookmarks";
import HelpPage from "./pages/Help";
import SettingsPage from "./pages/Settings";
import ProfilePage from "./pages/Profile";

function AppContent({ isExpanded, setIsExpanded }) {
  const location = useLocation();

  // Hide Sidebar on SignUp and SignIn pages
  const isAuthPage = ["/Signup", "/Signin"].includes(location.pathname);
  const sidebarWidth = isExpanded ? "180px" : "56px";

  return (
    <>
      {!isAuthPage && <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />}
      <div
        style={{
          marginLeft: !isAuthPage ? sidebarWidth : "0",
          transition: "0.3s",
          flex: 1,
          minWidth: 0,
          maxWidth: !isAuthPage ? `calc(100vw - ${sidebarWidth})` : "100vw",
          overflowX: "hidden",
        }}
      >
        <Routes>
          <Route path="/Signup" element={<SignUpPage />} />
          <Route path="/Signin" element={<SignInPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/Buy" element={<BuyPage />} />
          <Route path="/Sell" element={<SellPage />} />
          <Route path="/Mylistings" element={<MyListingsPage />} />
          <Route path="/Priceestimator" element={<PriceEstimatorPage />} />
          <Route path="/Bookmarks" element={<BookmarksPage />} />
          <Route path="/Help" element={<HelpPage />} />
          <Route path="/Settings" element={<SettingsPage />} />
          <Route path="/Profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <BrowserRouter>
      <AppContent isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
    </BrowserRouter>
  );
}

export default App;
