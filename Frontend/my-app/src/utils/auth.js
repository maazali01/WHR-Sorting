// src/utils/auth.js
import Cookies from "js-cookie";
import axios from "axios";

export const isLoggedIn = () => {
  const cookieToken = Cookies.get("token");
  const lsToken = localStorage.getItem("token");

  // return true only if we have a non-empty token in either storage
  return !!(cookieToken && cookieToken.trim()) || !!(lsToken && lsToken.trim());
};

export const logout = (clearCart) => {
  Cookies.remove("token", { path: "/" });
  localStorage.removeItem("token");
  
  // clear axios auth header
  delete axios.defaults.headers.common['Authorization'];
  
  if (typeof clearCart === "function") {
    try { clearCart(); } catch (e) {}
  }
  
  // notify UI
  try {
    window.dispatchEvent(new Event("authChanged"));
  } catch (e) {
    /* ignore */
  }
  
  // Do NOT auto-redirect here - let caller handle navigation
};
