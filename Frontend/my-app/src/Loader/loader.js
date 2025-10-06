// src/components/Loader.js
import React from "react";
import "./loader.css"; // your Newton’s Cradle CSS

const Loader = () => {
  return (
    <div className="loader-wrapper">
      <div className="newtons-cradle">
        <div className="newtons-cradle__dot"></div>
        <div className="newtons-cradle__dot"></div>
        <div className="newtons-cradle__dot"></div>
        <div className="newtons-cradle__dot"></div>
      </div>
    </div>
  );
};

export default Loader;
