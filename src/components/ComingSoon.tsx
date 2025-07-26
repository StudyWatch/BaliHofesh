import React from "react";
import { Gift, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ComingSoon: React.FC<{ title?: string; children?: React.ReactNode }> = ({
  title = "החנות תיפתח בקרוב!",
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-100 via-white to-blue-100 p-2 sm:p-4">
      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* כפתור חזור */}
        <button
          className="absolute right-0 top-0 bg-white rounded-full p-2 shadow hover:bg-gray-100 transition"
          onClick={() => navigate(-1)}
          aria-label="חזור אחורה"
        >
          <ArrowRight className="w-6 h-6 text-purple-500" />
        </button>

        <div className="animate-bounce-slow flex items-center gap-2 mb-5 mt-10 text-purple-600">
          <Gift size={48} className="drop-shadow-lg" />
          <Clock size={40} className="drop-shadow-lg" />
        </div>
        <div className="bg-white/95 shadow-2xl rounded-3xl px-6 sm:px-10 py-10 flex flex-col items-center border border-purple-100">
          <h1 className="text-3xl font-extrabold mb-3 text-purple-700 tracking-tight drop-shadow">
            {title}
          </h1>
          <p className="max-w-md text-lg text-gray-800 mb-6 leading-relaxed font-medium">
            בקרוב תיפתח כאן חנות ההטבות הגדולה בישראל לסטודנטים!<br />
            מאות הנחות והטבות: כלים דיגיטליים, ציוד לימודי, טכנולוגיה, תחבורה, חיי חברה ועוד.<br />
            <span className="inline-block mt-4 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 font-bold text-base shadow">
              תקבלו התראה אוטומטית באתר כשהחנות תיפתח 🎉
            </span>
          </p>
          {children}
        </div>
      </div>
      {/* אנימציית bounce קלה לאייקונים */}
      <style>
        {`
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0);}
            50% { transform: translateY(-10px);}
          }
          .animate-bounce-slow {
            animation: bounce-slow 2.6s infinite;
          }
        `}
      </style>
    </div>
  );
};

export default ComingSoon;
