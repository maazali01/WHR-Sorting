import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookie from "js-cookie";
import axios from "axios";

const GoogleSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // Save token in cookie + localStorage
      Cookie.set("token", token, { path: "/", sameSite: "lax", expires: 1 / 24 });
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios.defaults.withCredentials = true;

      try { window.dispatchEvent(new Event("authChanged")); } catch {}

      // Redirect user to dashboard or home
      navigate("/home");
    } else {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  return <div>Logging you in with Google...</div>;
};

export default GoogleSuccess;
