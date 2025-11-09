"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ChatInterface } from "./chat/ChatInterface";

export function Hero() {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleStartChat = () => {
    setIsAnimating(true);
  };

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      if (e.deltaY > 0 && !isAnimating) {
        // Scroll down
        setIsAnimating(true);
      }
    };

    window.addEventListener("wheel", handleScroll);
    return () => window.removeEventListener("wheel", handleScroll);
  }, [isAnimating]);

  return (
    <section className="relative h-[calc(100vh-80px)] flex items-center justify-center px-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[var(--color-blue-accent)] rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--color-sage-green)] rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="max-w-7xl w-full">
        <motion.div
          initial={false}
          animate={{
            x: isAnimating ? "-150%" : 0,
            opacity: isAnimating ? 0 : 1,
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          {/* Left side - Text content */}
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight"
              style={{ fontFamily: "var(--font-aveburg)" }}
            >
              Discutez avec Bob
            </h1>

            <p
              className="text-xl sm:text-2xl lg:text-3xl leading-relaxed max-w-2xl mx-auto lg:mx-0"
              style={{
                fontFamily: "var(--font-abc-stefan)",
                color: "var(--color-brown-text)",
              }}
            >
              Bob vous aide à connaître et améliorer votre empreinte carbone
            </p>

            {/* CTA Button */}
            <div
              onClick={handleStartChat}
              className="inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-4 sm:py-5 rounded-full transition-all hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: "var(--color-light-green-bg)",
                fontFamily: "var(--font-roobert)",
                fontWeight: 500,
                fontSize: "clamp(1.1rem, 2.5vw, 1.65rem)",
              }}
            >
              <Sparkles
                className="w-5 h-5 sm:w-6 sm:h-6"
                style={{ color: "var(--color-sage-green)" }}
              />
              <span style={{ color: "var(--color-sage-green)" }}>
                Eco assistant nouvelle génération
              </span>
              <Sparkles
                className="w-4 h-4 sm:w-5 sm:h-5"
                style={{ color: "var(--color-sage-green)" }}
              />
            </div>
          </div>

          {/* Right side - Bob Mascot */}
          <div className="flex justify-center items-center">
            <div onClick={handleStartChat} className="cursor-pointer">
              <BobMascot />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isAnimating ? 1 : 0,
            scale: isAnimating ? 1 : 0.8,
            display: isAnimating ? "flex" : "none",
          }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ height: "calc(100vh - 80px)" }}
        >
          <ChatInterface />
        </motion.div>
      </div>
    </section>
  );
}

// Bob Mascot Component - based on the SVG design
function BobMascot() {
  return (
    <div className="relative w-full max-w-md">
      <svg viewBox="0 0 400 400" className="w-full h-auto">
        {/* Main face circle - blue background */}
        <circle cx="200" cy="200" r="150" fill="#9fcaf4" opacity="1" />
        <circle
          cx="200"
          cy="200"
          r="149"
          fill="none"
          stroke="#3a1e14"
          strokeWidth="2"
        />

        {/* Right eye */}
        <g>
          <circle cx="230" cy="180" r="52" fill="#fff" />
          <ellipse
            cx="235"
            cy="175"
            rx="33"
            ry="43"
            fill="#3a1e14"
            transform="rotate(-31 235 175)"
          />
          {/* Eye reflection */}
          <path
            d="M 220 175 Q 235 177 242 183"
            stroke="#fff"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Pupil highlights */}
          <circle cx="232" cy="178" r="2.5" fill="#fff" />
          <circle cx="238" cy="178" r="4.2" fill="#fff" />
        </g>

        {/* Left eye */}
        <g>
          <circle cx="170" cy="184" r="52" fill="#fff" />
          <ellipse
            cx="175"
            cy="179"
            rx="33"
            ry="43"
            fill="#3a1e14"
            transform="rotate(-31 175 179)"
          />
          {/* Eye reflection */}
          <path
            d="M 160 179 Q 175 181 182 187"
            stroke="#fff"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Pupil highlights */}
          <circle cx="172" cy="182" r="2.5" fill="#fff" />
          <circle cx="178" cy="182" r="4.2" fill="#fff" />
        </g>

        {/* Mouth */}
        <ellipse
          cx="200"
          cy="243"
          rx="10.5"
          ry="17"
          fill="#3a1e14"
          transform="rotate(-0.16 200 243)"
        />

        {/* Decorative sparkle - top left */}
        <g transform="translate(80, 90)">
          <path
            d="M 0,-15 L 2,-2 L 15,0 L 2,2 L 0,15 L -2,2 L -15,0 L -2,-2 Z"
            fill="#fff"
            opacity="0.9"
          />
        </g>

        {/* Decorative sparkle - top right */}
        <g transform="translate(310, 120)">
          <path
            d="M 0,-10 L 1.5,-1.5 L 10,0 L 1.5,1.5 L 0,10 L -1.5,1.5 L -10,0 L -1.5,-1.5 Z"
            fill="#fff"
            opacity="0.8"
          />
        </g>

        {/* Shadow/depth effect */}
        <ellipse
          cx="200"
          cy="350"
          rx="120"
          ry="20"
          fill="#0868b7"
          opacity="0.1"
        />

        {/* Speech bubble */}
        <g transform="translate(320, 140)">
          <circle cx="0" cy="0" r="54" fill="#3a1e14" />
          <circle
            cx="0"
            cy="0"
            r="52"
            fill="none"
            stroke="#3a1e14"
            strokeWidth="1"
          />
          <rect x="-36" y="-20" width="72" height="40" rx="16" fill="#ecf7e2" />

          {/* Three dots in speech bubble */}
          <circle cx="-18" cy="0" r="3.9" fill="#3a1e14" />
          <circle cx="0" cy="0" r="3.9" fill="#3a1e14" />
          <circle cx="18" cy="0" r="3.9" fill="#3a1e14" />

          {/* Speech bubble pointer */}
          <path d="M -15 18 L -20 32 L -8 22 Z" fill="#ecf7e2" />
        </g>
      </svg>
    </div>
  );
}
