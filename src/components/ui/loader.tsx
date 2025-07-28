import React from "react";

export const Loader = () => {
  return (
    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
      <div className="w-3 h-3 rounded-full animate-bounce bg-blue-500"></div>
      <div className="w-3 h-3 rounded-full animate-bounce bg-blue-500 delay-150"></div>
      <div className="w-3 h-3 rounded-full animate-bounce bg-blue-500 delay-300"></div>
    </div>
  );
};
