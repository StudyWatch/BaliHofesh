import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const ScrollToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => setVisible(window.scrollY > 250);
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="חזרה לראש הדף"
      className="
        fixed bottom-8 right-6 z-50
        bg-indigo-600 text-white p-3 rounded-full shadow-lg
        hover:bg-indigo-700 active:bg-indigo-800
        transition-all
        focus:outline-none focus:ring-2 focus:ring-indigo-400
      "
      style={{ direction: "rtl" }}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};

export default ScrollToTopButton;
