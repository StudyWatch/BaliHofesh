import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Calendar, Users, GraduationCap, MessageCircle, Star, Trophy,
  MoreVertical, X, ArrowLeftToLine, ArrowRightToLine, ArrowUpToLine
} from "lucide-react";

// הגדרת כפתורי קיצור
const navItems = [
  { id: 'profile', label_he: 'פרופיל הקורס', label_en: 'Course Profile', icon: <User size={22} />, targetId: 'course-header' },
  { id: 'sessions', label_he: 'מפגשי לימוד', label_en: 'Sessions', icon: <Calendar size={22} />, targetId: 'shared-sessions' },
  { id: 'partners', label_he: 'שותפי למידה', label_en: 'Partners', icon: <Users size={22} />, targetId: 'study-partners' },
  { id: 'tutors', label_he: 'מורים פרטיים', label_en: 'Private Tutors', icon: <GraduationCap size={22} />, targetId: 'tutors-section' },
  { id: 'reviews', label_he: 'חוות דעת', label_en: 'Reviews', icon: <MessageCircle size={22} />, targetId: 'course-reviews' },
  { id: 'lecturers', label_he: 'דירוג מרצים', label_en: 'Lecturer Ratings', icon: <Star size={22} />, targetId: 'course-lecturers' },
  { id: 'marathon', label_he: 'מרתון', label_en: 'Marathon', icon: <Trophy size={22} />, targetId: 'marathon-section' },
];

const DOCKS = [
  { id: "right", icon: ArrowLeftToLine, label: "ימין" },
  { id: "left", icon: ArrowRightToLine, label: "שמאל" },
  { id: "bottom", icon: ArrowUpToLine, label: "תחתון" },
];

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 640;
}

const UltraFloatingSidebar = () => {
  const { dir } = useLanguage();
  const { theme } = useTheme?.() || { theme: "light" };
  const [dock, setDock] = useState(isMobile() ? "bottom" : dir === "rtl" ? "right" : "left");
  const [visible, setVisible] = useState(true);
  const [compact, setCompact] = useState(isMobile());
  const [active, setActive] = useState(navItems[0].id);

  // מעבר אוטומטי לנייד
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setDock("bottom");
        setCompact(true);
      } else if (dock === "bottom") {
        setDock(dir === "rtl" ? "right" : "left");
        setCompact(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dir, dock]);

  // הדגשת קיצור רלוונטי
  useEffect(() => {
    const handleScroll = () => {
      let minDiff = Infinity, current = navItems[0].id;
      navItems.forEach(item => {
        const el = document.getElementById(item.targetId);
        if (el) {
          const diff = Math.abs(el.getBoundingClientRect().top - (isMobile() ? 70 : 120));
          if (diff < minDiff) {
            minDiff = diff;
            current = item.id;
          }
        }
      });
      setActive(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // צבעים וסגנון – לילה/יום/מעבר חלק
  const sidebarBg =
    theme === "dark"
      ? "bg-gradient-to-br from-[#202638] via-[#181c30] to-[#232442] shadow-[0_4px_32px_0_rgba(24,28,56,0.45)] border border-[#2a385a]/80 backdrop-blur-md"
      : "bg-gradient-to-br from-white via-blue-50 to-blue-100/80 shadow-[0_4px_24px_0_rgba(80,100,180,0.11)] border border-blue-200/60";
  const buttonActive =
    theme === "dark"
      ? "bg-gradient-to-t from-[#2353b8] via-[#327ce8] to-[#6bb1fc] text-white ring-2 ring-[#4fc3ff60] shadow-[0_0_14px_2px_#51b1f955]"
      : "bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 text-white ring-2 ring-blue-300/60";
  const iconColor =
    theme === "dark"
      ? "text-[#bfe8ff] drop-shadow-[0_0_8px_rgba(110,184,255,0.23)]"
      : "text-blue-900";
  const tooltipBg =
    theme === "dark"
      ? "bg-[#25294a] text-[#e5f3ff] border border-[#405388] shadow-[0_2px_8px_2px_#23264733]"
      : "bg-gray-900/95 text-white border border-blue-200/40 shadow-[0_2px_8px_2px_#7fa5fc22]";

  // מיקום סרגל
  let sidebarClass = "fixed z-[100] transition-all";
  if (dock === "bottom") {
    sidebarClass += " left-0 right-0 bottom-0 w-full flex-row rounded-t-xl justify-center";
  } else if (dock === "right") {
    sidebarClass += " top-20 bottom-4 right-2 flex-col rounded-3xl";
  } else {
    sidebarClass += " top-20 bottom-4 left-2 flex-col rounded-3xl";
  }

  // גודל
  const size = isMobile() ? 38 : 48;
  const margin = isMobile() ? "mb-1 mx-2" : "mb-2";

  // Tooltip
  const tooltipDir = dock === "right" ? "left" : "right";

  // כפתור פתיחה
  if (!visible) {
    return (
      <motion.button
        className={`fixed z-[100] bg-primary text-white rounded-full p-3 shadow-xl 
          ${dock === "bottom" ? "left-1/2 -translate-x-1/2 bottom-4" : (dock === "right" ? "right-4 top-24" : "left-4 top-24")}`}
        onClick={() => setVisible(true)}
        aria-label={dir === "rtl" ? "הצג תפריט" : "Show sidebar"}
        whileTap={{ scale: 1.08 }}
        tabIndex={0}
        style={{ transition: "all .2s" }}
      >
        <MoreVertical />
      </motion.button>
    );
  }

  return (
    <motion.div
      className={`${sidebarClass} flex items-center px-2 py-2 gap-0 ${sidebarBg}`}
      style={{
        minHeight: isMobile() && dock === "bottom" ? 52 : undefined,
        maxWidth: dock === "bottom" ? "100vw" : 64,
        border: "1.5px solid rgba(120,130,220,0.10)",
        boxShadow: theme === "dark"
          ? "0 6px 44px 0 #0e2d5330"
          : "0 4px 32px 0 #7fa5fc26"
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      tabIndex={0}
      aria-label={dir === "rtl" ? "סרגל קיצור" : "Quick Sidebar"}
    >
      {/* שליטה ודוקינג */}
      <div className={`flex ${dock === "bottom" ? "flex-row" : "flex-col"} items-center ${dock === "bottom" ? "gap-2" : "gap-1"} px-1`}>
        <button
          className="p-1 bg-white/90 dark:bg-[#22263a]/70 rounded-full hover:bg-gray-200 dark:hover:bg-[#394569]/60 shadow transition"
          onClick={() => setVisible(false)}
          aria-label="סגור סרגל"
          style={{ minWidth: 28, minHeight: 28 }}
        >
          <X className="w-4 h-4" />
        </button>
        {/* דוקינג – החצים בכיוון הנכון לפי RTL */}
        {!isMobile() && DOCKS.map(pos => {
          const Icon = pos.icon;
          // ב־RTL חץ ימין/שמאל מתהפך (רק בצדדים)
          let isRtlSwap = (dir === "rtl" && (pos.id === "left" || pos.id === "right"));
          return (
            <button
              key={pos.id}
              className={`p-1 rounded-full border transition shadow-sm
                ${dock === pos.id
                  ? "bg-primary/80 text-white ring-2 ring-blue-500/80"
                  : "bg-white/70 dark:bg-[#232647]/80 hover:bg-primary/10 dark:hover:bg-[#3952a4]/40"}
              `}
              onClick={() => setDock(pos.id)}
              aria-label={dir === "rtl" ? (pos.label === "ימין" ? "שמאל" : pos.label === "שמאל" ? "ימין" : pos.label) : pos.label}
              style={{ minWidth: 26, minHeight: 26 }}
            >
              <span style={{
                display: "inline-block",
                transform: isRtlSwap ? "scaleX(-1)" : undefined,
                transition: "transform .18s"
              }}>
                <Icon className="w-4 h-4" />
              </span>
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {(!compact || isMobile()) ? (
          navItems.map(item => (
            <motion.button
              key={item.id}
              onClick={() => {
                const el = document.getElementById(item.targetId);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`
                relative flex items-center justify-center
                rounded-full group transition-all focus:ring-2 focus:ring-primary/80 outline-none
                ${dock === "bottom" ? "mx-2" : margin}
                ${active === item.id ? buttonActive + " scale-110 ring-2" : "bg-white/90 dark:bg-[#21274a]/70 hover:bg-blue-200/80 dark:hover:bg-blue-900/30"}
                `}
              aria-label={dir === "rtl" ? item.label_he : item.label_en}
              whileTap={{ scale: 0.96 }}
              tabIndex={0}
              style={{
                width: size,
                height: size,
                boxShadow: active === item.id ? "0 0 10px 2px #7ba2fa33" : undefined,
                transition: "all .18s cubic-bezier(.5,1.7,.5,1.1)"
              }}
            >
              <span className={`
                transition-colors ${active === item.id
                  ? "text-white drop-shadow-[0_0_10px_rgba(89,183,255,0.43)]"
                  : iconColor}
              `}>
                {item.icon}
              </span>
              {active === item.id && (
                <>
                  <motion.span
                    className="absolute inset-0 rounded-full ring-2 ring-primary/60 pointer-events-none"
                    initial={{ scale: 1.13, opacity: 0.39 }}
                    animate={{ scale: 1.23, opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                  />
                  <motion.span
                    className="absolute inset-0 rounded-full ring-4 ring-primary/10 pointer-events-none"
                    initial={{ scale: 0.85, opacity: 0.22 }}
                    animate={{ scale: 1.07, opacity: 0.14 }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </>
              )}
              {/* Tooltip */}
              <span
                className={`
                  absolute whitespace-nowrap px-2 py-1 ${tooltipBg} text-[10px] rounded
                  opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none
                  ${dock === "bottom"
                    ? "bottom-8 left-1/2 -translate-x-1/2"
                    : tooltipDir === "left"
                      ? "left-10 top-1/2 -translate-y-1/2"
                      : "right-10 top-1/2 -translate-y-1/2"}
                `}
                style={{
                  fontFamily: "inherit", fontWeight: 400,
                  boxShadow: "0 2px 8px 2px #7fa5fc22"
                }}
              >
                {dir === "rtl" ? item.label_he : item.label_en}
              </span>
            </motion.button>
          ))
        ) : (
          <motion.div
            className={`flex ${dock === "bottom" ? "flex-row gap-2" : "flex-col gap-3"} items-center justify-center pt-2`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            {[1, 2, 3].map(i => (
              <span key={i} className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full opacity-70" />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UltraFloatingSidebar;
