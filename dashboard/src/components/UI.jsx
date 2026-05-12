import React from "react";

export function Card({ title, children }) {
  return (
    <div>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 16,
          color: "#e2e8f0",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export function Empty({ text }) {
  return (
    <div
      style={{
        textAlign: "center",
        color: "#475569",
        padding: "32px 0",
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}
