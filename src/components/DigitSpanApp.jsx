import React, { useState, useEffect, useRef, useCallback } from "react";
import { Howl } from "howler";
import ReactCanvasConfetti from "react-canvas-confetti";

// Breakpoints for Tablet/Laptop focus
const BREAKPOINTS = {
  sm: 768, // Treat typical tablets/larger phones as 'sm' minimum
  md: 1024, // Standard tablet/small laptop
  lg: 1440 // Large laptop
};

// MODIFICATION: YouTube Aspect Ratio (16:9) Logic
function getCardWidth() {
  const w = window.innerWidth;
  if (w < BREAKPOINTS.sm) return "95%";
  if (w < BREAKPOINTS.md) return 800; // Wider for 16:9
  if (w < BREAKPOINTS.lg) return 1100; // Larger screens
  return 1280; // Max width approximating a popular HD resolution
}

function getCardMinHeight(width) {
  let actualWidth = parseFloat(width);
  if (typeof width === 'string' && width.includes('%')) {
      actualWidth = window.innerWidth * (parseFloat(width) / 100);
  }

  if (actualWidth < BREAKPOINTS.sm * 0.95) { 
      // Keep a sensible minimum height for mobile devices
      return window.innerWidth < BREAKPOINTS.sm ? 480 : 600; 
  }
  // NEW: Maintain a 16:9 ratio (height is 9/16 of width)
  return Math.round(actualWidth * (9/16));
}
// ──────────────────────────────────────────────────────────────────────────────
//  FINAL COLOR PALETTES – Darker Light / Lighter Dark (Unique & Bold)
// ──────────────────────────────────────────────────────────────────────────────
const COLOR_THEMES = {
  light: {
    // ── DARKER, BOLD LIGHT MODE (Navy + Vibrant Orange) ───────────────────
    bgStart:   "#E3F2FD",   // Sky blue tint
    bgEnd:     "#BBDEFB",   // Deeper sky
    bg:        "#F5F9FF",   // Clean base
    card:      "#E8F0FE",   // Card surface
    accent:    "#1565C0",   // Deep navy (buttons)
    accentDark:"#0D47A1",   // Pressed
    accent2:   "#E3F2FD",   // Subtle bg
    text:      "#0A3D62",   // Very dark navy
    correct:   "#FF8F00",   // Bright orange success
    incorrect: "#E53935",   // Strong red
    neutral:   "#E8F0FE",
    shadowLight: "rgba(255, 255, 255, 0.9)",
    shadowDark:  "rgba(21, 101, 192, 0.28)"
  },
  dark: {
    // ── LIGHTER, AIRY DARK MODE (Charcoal + Vivid Lime) ───────────────────
    bgStart:   "#1A202C",   // Soft charcoal
    bgEnd:     "#2D3748",   // Warmer gray
    bg:        "#232A36",   // Base
    card:      "#2D3748",   // Light card
    accent:    "#A0E070",   // Electric lime
    accentDark:"#80C050",   // Pressed
    accent2:   "#374151",   // Subtle
    text:      "#F7FAFC",   // Crisp white
    correct:   "#68D391",   // Lime green success
    incorrect: "#FC8181",   // Soft red
    neutral:   "#2D3748",
    shadowLight: "rgba(100, 120, 140, 0.35)",
    shadowDark:  "rgba(0, 0, 0, 0.55)"
  }
};

const digitSets = {
  "Set A": {
    forward: [
      "5-7-3", "4-1-7", "5-3-8-7", "6-1-5-8",
      "1-6-4-9-5", "2-9-7-6-3", "3-4-1-7-9-6", "6-1-5-8-3-9",
      "7-2-5-9-4-8-3", "4-7-1-5-3-8-6"
    ],
    backward: [
      "4-7-2-9-1-6-8-5", "9-2-5-8-3-1-7-4",
      "4-7-2-9-1-0-8-3", "9-2-5-8-3-1-7-4"
    ]
  },
  "Set B": {
    forward: [
      "3-8-1", "7-2-5", "9-4-2-6", "5-8-3-1",
      "7-1-5-3-9", "4-2-8-6-1", "2-7-5-9-3-8", "1-6-4-2-7-5",
      "8-3-6-1-9-4-2", "5-9-2-7-4-1-6"
    ],
    backward: [
      "7-3-9-1-5-8-2-4", "6-1-8-4-9-3-5-2",
      "5-2-9-7-1-8-3-6", "3-8-1-5-9-2-7-4"
    ]
  },
  "Set C": {
    forward: [
      "6-2-9", "1-5-8", "3-7-4-2", "9-5-1-6",
      "2-8-3-6-1", "5-1-9-4-7", "8-3-2-6-1-9", "4-7-5-2-8-3",
      "1-9-4-6-3-8-2", "7-2-5-8-1-6-3"
    ],
    backward: [
      "2-6-9-1-5-8-3-7", "4-1-7-3-9-2-5-8",
      "8-3-5-1-9-4-2-7", "6-2-8-4-1-9-5-3"
    ]
  }
};

// Keyframes for animations
const pulseKeyframes = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.01); opacity: 0.98; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

// Keyframes for a subtle dot animation
const dotPulseKeyframes = `
  @keyframes dotPulse {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.2); opacity: 1; }
  }
`;

// Keyframes for rotation on theme toggle
const rotateToggleKeyframes = `
  @keyframes rotateToggle {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

function useTheme() {
  const getInitial = () => {
    const persisted = localStorage.getItem("theme");
    if (persisted) return persisted;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return "dark";
    }
    return "light";
  };
  const [theme, setTheme] = useState(getInitial);
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  // The toggle function is correct
  const toggle = () => setTheme(t => (t === "light" ? "dark" : "light"));
  return [theme, COLOR_THEMES[theme], toggle];
}

function ConfettiEffect({ fire, theme }) {
  const ref = useRef();
  const shoot = useCallback(() => {
    ref.current && ref.current({
      particleCount: 110,
      spread: 97,
      origin: { y: 0.6 },
      zIndex: 2,
      colors: theme === "dark"
        ? ["#66CDAA", "#D9E8F2", "#2F4650", "#1B2C33"]
        : ["#67A398","#E9F5F3","#365A54","#FFD700"],
    });
  }, [theme]);
  useEffect(() => { if (fire) shoot(); }, [fire, shoot]);
  return (
    <ReactCanvasConfetti
      refConfetti={inst => (ref.current = inst)}
      style={{
        position: "fixed",
        pointerEvents: "none",
        width: "100vw",
        height: "100vh",
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    />
  );
}

// Component to provide context and fill the initial empty state
function DescriptionBox({ COLORS }) {
  const isSmallScreen = window.innerWidth < BREAKPOINTS.sm;
  return (
    <div style={{
      marginTop: isSmallScreen ? 15 : 40,
      padding: isSmallScreen ? "15px 20px" : "20px 30px",
      textAlign: "left",
      background: COLORS.bg, // Use lighter background for box contrast
      borderRadius: "20px", // Larger radius
      color: COLORS.text,
      fontSize: isSmallScreen ? "16px" : "18px",
      lineHeight: 1.7,
      // Soft Inner Shadow (Debossed look)
      boxShadow: `inset 4px 4px 8px ${COLORS.shadowDark}, inset -4px -4px 8px ${COLORS.shadowLight}`,
    }}>
      <h4 style={{ color: COLORS.accent, marginTop: 0, marginBottom: 12, fontWeight: 700, fontSize: isSmallScreen ? "18px" : "22px" }}>
        Welcome to the Digit Span Test
      </h4>
      <p style={{ margin: "5px 0" }}>
        This test measures your short-term memory capacity.
      </p>
      <ul style={{ paddingLeft: 20, margin: "10px 0" }}>
        {/* MODIFICATION: Removed ** from list items */}
        <li>Forward (▶️): Repeat the sequence exactly as shown.</li>
        <li>Backward (◀️): Repeat the sequence in reverse order.</li>
        <li>Sequences start short and get longer as you succeed.</li>
      </ul>
      <p style={{ margin: "5px 0 0 0", fontWeight: 700 }}>
        Select a Set and click Start Focus Test to begin.
      </p>
    </div>
  );
}

// Simple Loading/Preparation Indicator
function PreparationIndicator({ COLORS }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '25px',
      marginBottom: '35px',
      gap: '10px',
      height: '80px', // Maintain vertical space
    }}>
      <span style={{
        width: '15px',
        height: '15px',
        borderRadius: '50%',
        background: COLORS.accent,
        animation: 'dotPulse 1.2s infinite ease-in-out',
        animationDelay: '0s',
      }}></span>
      <span style={{
        width: '15px',
        height: '15px',
        borderRadius: '50%',
        background: COLORS.accent,
        animation: 'dotPulse 1.2s infinite ease-in-out',
        animationDelay: '0.4s',
      }}></span>
      <span style={{
        width: '15px',
        height: '15px',
        borderRadius: '50%',
        background: COLORS.accent,
        animation: 'dotPulse 1.2s infinite ease-in-out',
        animationDelay: '0.8s',
      }}></span>
    </div>
  );
}

export default function DigitSpanApp() {
  const [theme, COLORS, toggleTheme] = useTheme();
  const [selectedSet, setSelectedSet] = useState("");
  const [gameActive, setGameActive] = useState(false);
  const [level, setLevel] = useState(3);
  const [digitsToShow, setDigitsToShow] = useState("");
  const [showDigits, setShowDigits] = useState(false);
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState("");
  const [msg, setMsg] = useState("Select a set to begin");
  const [score, setScore] = useState(0);
  const [bgColor, setBgColor] = useState(COLORS.card);
  const [fireConfetti, setFireConfetti] = useState(false);
  
  const [toggleRotate, setToggleRotate] = useState(false);


  const music = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setBgColor(COLORS.card); }, [COLORS]);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, [showDigits, gameActive]);

  useEffect(() => {
    // Add all keyframes to the document head
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = pulseKeyframes + dotPulseKeyframes + rotateToggleKeyframes;
    document.head.appendChild(styleSheet);

    music.current = new Howl({
      src: ["https://cdn.pixabay.com/download/audio/2022/03/15/audio_41f6b2b4d7.mp3"],
      loop: true,
      volume: 0.15,
      html5: true,
    });
    return () => music.current?.stop();
  }, []);

  const getNextDigits = (setName, direction, length) => {
    const base = digitSets[setName][direction];
    const flatDigits = base.flatMap(seq => seq.split("-")).map(Number);
    const digits = [];
    for (let i = 0; i < length; i++) {
      digits.push(flatDigits[Math.floor(Math.random() * flatDigits.length)]);
    }
    return digits.join("-");
  };

  const startTest = () => {
    if (!selectedSet) { alert("Please select a set first!"); return; }
    music.current?.play();
    setGameActive(true);
    setScore(0);
    setLevel(3);
    setMsg("Memorize the digits shown");
    nextRound(3);
  };

  const nextRound = (len) => {
    setBgColor(COLORS.card);
    const dir = Math.random() < 0.5 ? "forward" : "backward";
    setDirection(dir);
    const seq = getNextDigits(selectedSet, dir, len);
    setDigitsToShow(seq);
    setShowDigits(true);
    const icon = dir === "forward" ? "▶️" : "◀️";
    setMsg(`${icon} Focus on this sequence for ${dir.toUpperCase()} recall...`);
    setInput("");
    setTimeout(() => {
      setShowDigits(false);
      setMsg("⌨️ Enter the sequence now (separate digits with '-'):");
    }, 2100 + len * 380);
  };

  const handleSubmit = () => {
    const correctSeq = direction === "backward"
      ? digitsToShow.split("-").reverse().join("-")
      : digitsToShow;
    if (input.trim() === correctSeq) {
      setMsg("✅ Excellent! Moving to the next level.");
      setBgColor(COLORS.correct);
      setScore(s => s + 1);
      setFireConfetti(true);
      setTimeout(() => {
        setFireConfetti(false);
        const newLevel = level + 1;
        setLevel(newLevel);
        nextRound(newLevel);
      }, 1200);
    } else {
      setMsg(`Try again! The correct sequence was: ${correctSeq}. Press restart.`);
      setBgColor(COLORS.incorrect);
      setGameActive(false);
      music.current?.stop();
    }
  };

  const handleRestart = () => {
    setGameActive(false);
    setInput("");
    setBgColor(COLORS.card);
    setMsg("Select a set to begin");
    setScore(0);
    setLevel(3);
    setShowDigits(false);
    music.current?.stop();
  };


  function handleInputKey(e) {
    if (e.key === "Enter" && !showDigits && gameActive) handleSubmit();
  }

  // Neomorphic Button Styles - Simplified to use helper function that includes theme colors
  const getButtonStyle = (isAccent, isPressed) => {
    const textColor = isAccent ? COLORS.card : COLORS.text;
    const baseStyle = {
      background: isAccent ? `linear-gradient(145deg, ${COLORS.accent}, ${COLORS.accentDark})` : COLORS.card,
      color: textColor,
      border: "none",
      borderRadius: "18px",
      cursor: "pointer",
      fontSize: "20px",
      fontWeight: 700,
      letterSpacing: "1px",
      transition: "background .2s, transform .1s, box-shadow .2s",
      outline: 'none',
      padding: window.innerWidth < BREAKPOINTS.sm ? "16px 25px" : "18px 40px",
      // Neomorphic Outer Shadow (Raised look)
      boxShadow: `7px 7px 14px ${COLORS.shadowDark}, -7px -7px 14px ${COLORS.shadowLight}`,
      // FONT: Use a clean sans-serif for buttons/bold elements
      fontFamily: "'Inter', 'Stack Sans Notch', 'Merriweather', serif", 
    };
    
    const pressedStyle = {
      transform: 'translateY(1px)',
      boxShadow: `inset 5px 5px 10px ${COLORS.shadowDark}, inset -5px -5px 10px ${COLORS.shadowLight}`,
      background: isAccent ? COLORS.accentDark : COLORS.card, // Darker press effect
    };

    const hoverStyle = {
      transform: 'translateY(-2px)',
      boxShadow: `10px 10px 20px ${COLORS.shadowDark}, -10px -10px 20px ${COLORS.shadowLight}`,
    };

    if (isPressed) return { ...baseStyle, ...pressedStyle };
    
    return { base: baseStyle, hover: hoverStyle, pressed: pressedStyle };
  };

  // Main layout
  return (
    <div
      style={{
        // MODIFICATION: Set Merriweather as the primary serif font
        fontFamily: "'Merriweather', 'Inter', 'serif'",
        background: `linear-gradient(to bottom right, ${COLORS.bgStart}, ${COLORS.bgEnd})`,
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.6s",
        backgroundAttachment: 'fixed',
      }}
    >
      <ConfettiEffect fire={fireConfetti} theme={theme} />

      <div
        style={{
          background: bgColor, // Dynamic color change based on game state
          borderRadius: "40px", 
          boxShadow: `20px 20px 50px ${COLORS.shadowDark}, -20px -20px 50px ${COLORS.shadowLight}`,
          padding: window.innerWidth < BREAKPOINTS.sm ? "25px 15px" : "60px 50px", 
          textAlign: "center",
          maxWidth: getCardWidth(),
          minHeight: getCardMinHeight(getCardWidth()), // Enforce 16:9 aesthetic
          width: getCardWidth(),
          margin: "3vw auto",
          transition: "background .7s, max-width .4s, box-shadow .7s, min-height .4s",
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between', 
        }}
      >
        {/* Theme Toggle Button FIX */}
        <button
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          onClick={() => { 
            toggleTheme(); // This is the function that actually changes the theme state
            setToggleRotate(prev => !prev); 
          }}
          style={{
            position: "absolute",
            top: window.innerWidth < BREAKPOINTS.sm ? 20 : 40,
            right: window.innerWidth < BREAKPOINTS.sm ? 20 : 40,
            background: COLORS.card,
            border: "none",
            borderRadius: "50%",
            width: window.innerWidth < BREAKPOINTS.sm ? 55 : 65, 
            height: window.innerWidth < BREAKPOINTS.sm ? 55 : 65,
            cursor: "pointer",
            color: COLORS.accent,
            zIndex: 9,
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `5px 5px 10px ${COLORS.shadowDark}, -5px -5px 10px ${COLORS.shadowLight}`,
            transition: 'box-shadow .2s, transform .2s',
            animation: toggleRotate ? 'rotateToggle 0.6s linear' : 'none', 
          }}
          // Use mouse handlers only for visual pressed feedback
          onMouseDown={(e) => { e.currentTarget.style.boxShadow = getButtonStyle(false, true).pressed.boxShadow; e.currentTarget.style.transform = getButtonStyle(false, true).pressed.transform; }}
          onMouseUp={(e) => { e.currentTarget.style.boxShadow = `5px 5px 10px ${COLORS.shadowDark}, -5px -5px 10px ${COLORS.shadowLight}`; e.currentTarget.style.transform = 'none'; }}
          onAnimationEnd={() => setToggleRotate(false)} 
        >
          <span style={{ fontSize: window.innerWidth < BREAKPOINTS.sm ? 28 : 36, lineHeight: 1 }}>
            {theme === "light" ? "🌙" : "🌞"}
          </span>
        </button>

        <h2 style={{
          color: COLORS.text,
          marginBottom: window.innerWidth < BREAKPOINTS.sm ? 20 : 40,
          fontWeight: 800, 
          fontSize: window.innerWidth < BREAKPOINTS.sm ? 32 : 48, 
          letterSpacing: "0.02em", 
          // FONT: Use a clean sans-serif for headings
          fontFamily: "'Inter', 'Stack Sans Notch', sans-serif",
        }}>
          🧠 Memory Span Challenge
        </h2>

        {/* --- Initial State (Set Selection) --- */}
        {!gameActive && (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <DescriptionBox COLORS={COLORS} />
            <select
              value={selectedSet}
              onChange={e => setSelectedSet(e.target.value)}
              style={{
                padding: window.innerWidth < BREAKPOINTS.sm ? 15 : 20,
                fontSize: "20px",
                borderRadius: "18px",
                border: "none",
                marginTop: window.innerWidth < BREAKPOINTS.sm ? 30 : 50,
                marginBottom: window.innerWidth < BREAKPOINTS.sm ? 20 : 30,
                width: "80%",
                background: COLORS.card,
                color: COLORS.text,
                fontWeight: 600,
                boxShadow: `inset 4px 4px 8px ${COLORS.shadowDark}, inset -4px -4px 8px ${COLORS.shadowLight}`,
                outline: 'none',
              }}
            >
              <option value="">Select a Cognitive Set</option>
              {Object.keys(digitSets).map((setName) => (
                <option key={setName} value={setName}>
                  {setName}
                </option>
              ))}
            </select>
            <button
              onClick={startTest}
              style={{
                ...getButtonStyle(true).base,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = getButtonStyle(true).hover.transform; e.currentTarget.style.boxShadow = getButtonStyle(true).hover.boxShadow; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = getButtonStyle(true).base.boxShadow; e.currentTarget.style.background = getButtonStyle(true).base.background; }}
              onMouseDown={(e) => { e.currentTarget.style.boxShadow = getButtonStyle(true).pressed.boxShadow; e.currentTarget.style.transform = getButtonStyle(true).pressed.transform; e.currentTarget.style.background = getButtonStyle(true).pressed.background;}}
              onMouseUp={(e) => { e.currentTarget.style.boxShadow = getButtonStyle(true).base.boxShadow; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = getButtonStyle(true).base.background;}}
            >
              ▶ Start Focus Test
            </button>
          </div>
        )}

        {/* --- Game Active State --- */}
        {gameActive && (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3
              style={{
                color: COLORS.text,
                marginTop: window.innerWidth < BREAKPOINTS.sm ? 30 : 50,
                marginBottom: "30px",
                fontWeight: 700,
                fontSize: window.innerWidth < BREAKPOINTS.sm ? 22 : 30,
                // FONT: Use a clean sans-serif for headings
                fontFamily: "'Inter', 'Stack Sans Notch', sans-serif",
              }}>
              {msg.replace(/\*\*(.*?)\*\*/g, (match, p1) => p1)}
            </h3>
            {showDigits ? (
              <div style={{
                margin: "auto",
                width: "90%",
                marginTop: "30px",
                marginBottom: "40px"
              }}>
                <h1
                  style={{
                    fontSize: window.innerWidth < BREAKPOINTS.sm ? "60px" : "100px",
                    // Keep Monospace for high readability of numbers
                    fontFamily: "monospace",
                    letterSpacing: window.innerWidth < BREAKPOINTS.sm ? "25px" : "40px",
                    color: COLORS.text,
                    background: `linear-gradient(145deg, ${COLORS.accent2}, ${COLORS.bg})`,
                    borderRadius: "30px",
                    padding: "0.8em 0",
                    margin: 0,
                    fontWeight: 900,
                    animation: 'pulse 2s infinite ease-in-out',
                    boxShadow: `inset 0px 0px 15px ${COLORS.shadowDark}`,
                  }}
                >
                  {digitsToShow}
                </h1>
              </div>
            ) : (
              <div>
                <PreparationIndicator COLORS={COLORS} />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="e.g. 5-7-3-1"
                  autoFocus
                  style={{
                    padding: window.innerWidth < BREAKPOINTS.sm ? "18px" : "25px",
                    width: "80%",
                    marginTop: "25px",
                    marginBottom: "30px",
                    borderRadius: "20px",
                    border: 'none',
                    textAlign: "center",
                    fontSize: window.innerWidth < BREAKPOINTS.sm ? 22 : 28,
                    outline: "none",
                    background: COLORS.card,
                    color: COLORS.text,
                    boxShadow: `inset 5px 5px 10px ${COLORS.shadowDark}, inset -5px -5px 10px ${COLORS.shadowLight}`,
                  }}
                  onKeyDown={handleInputKey}
                />
                <div style={{
                  display: "flex", gap: "25px",
                  justifyContent: "center",
                  marginTop: "20px"
                }}>
                  {/* Submit Button (Neomorphic Raised) */}
                  <button
                    onClick={handleSubmit}
                    style={{
                      ...getButtonStyle(true).base,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = getButtonStyle(true).hover.transform; e.currentTarget.style.boxShadow = getButtonStyle(true).hover.boxShadow; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = getButtonStyle(true).base.boxShadow; e.currentTarget.style.background = getButtonStyle(true).base.background;}}
                    onMouseDown={(e) => { e.currentTarget.style.boxShadow = getButtonStyle(true).pressed.boxShadow; e.currentTarget.style.transform = getButtonStyle(true).pressed.transform; e.currentTarget.style.background = getButtonStyle(true).pressed.background;}}
                    onMouseUp={(e) => { e.currentTarget.style.boxShadow = getButtonStyle(true).base.boxShadow; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = getButtonStyle(true).base.background;}}
                  >
                    Submit
                  </button>
                  {/* Reset Button (Neomorphic Raised) */}
                  <button
                    onClick={handleRestart}
                    style={{
                      ...getButtonStyle(false).base,
                      background: COLORS.card,
                      color: COLORS.text,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = getButtonStyle(false).hover.transform; e.currentTarget.style.boxShadow = getButtonStyle(false).hover.boxShadow; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = getButtonStyle(false).base.boxShadow; e.currentTarget.style.background = getButtonStyle(false).base.background; }}
                    onMouseDown={(e) => { e.currentTarget.style.boxShadow = getButtonStyle(false).pressed.boxShadow; e.currentTarget.style.transform = getButtonStyle(false).pressed.transform; e.currentTarget.style.background = getButtonStyle(false).pressed.background; }}
                    onMouseUp={(e) => { e.currentTarget.style.boxShadow = getButtonStyle(false).base.boxShadow; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = getButtonStyle(false).base.background; }}
                    title="Restart"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Score/Level Status (Prominent Footer) --- */}
        <div style={{
          marginTop: window.innerWidth < BREAKPOINTS.sm ? 40 : 60,
          padding: window.innerWidth < BREAKPOINTS.sm ? "15px 10px" : "25px 20px",
          borderRadius: "25px",
          fontWeight: 700,
          display: "flex",
          justifyContent: "space-around",
          alignItems: 'center',
          fontSize: window.innerWidth < BREAKPOINTS.sm ? "22px" : "32px",
          background: COLORS.accent2,
          boxShadow: `inset 0px 0px 10px ${COLORS.shadowDark}`,
          // FONT: Use a clean sans-serif for numbers/stats
          fontFamily: "'Inter', 'Stack Sans Notch', sans-serif", 
        }}>
          <span style={{ color: COLORS.text }}>
            ✅ Score: <span style={{ color: COLORS.accent, fontWeight: 900 }}>{score}</span>
          </span>
          <span style={{ color: COLORS.text }}>
            🔢 Level: <span style={{ color: COLORS.accent, fontWeight: 900 }}>{level}</span>
          </span>
        </div>
      </div>
    </div>
  );
}