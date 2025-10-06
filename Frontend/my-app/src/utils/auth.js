// src/utils/auth.js
import Cookie from "js-cookie";

export const isLoggedIn = () => {
  return !!Cookie.get("token");
};

export const logout = (clearCart) => {
  Cookie.remove("token");
  if (clearCart) clearCart(); // pass CartContext.clearCart when available
  window.location.href = "/login"; // redirect after logout
};
