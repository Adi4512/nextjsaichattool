"use client";
import { useState, useEffect } from "react";

export default function Footer() {
  const [currentYear, setCurrentYear] = useState("");
  
  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);
  
  return (
    <footer className="py-6 text-center">
      <div className="text-gray-400 text-sm">
        © {currentYear || "2024"} • Crafted by{' '}
        <a 
          href="https://adisharma.dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-pink-400 transition-colors duration-200 underline decoration-purple-400/30 hover:decoration-pink-400/50"
        >
          adityasharma
        </a>
      </div>
    </footer>
  );
}
