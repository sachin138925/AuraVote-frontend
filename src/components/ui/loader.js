// client/src/components/ui/loader.js
import React from "react";

export const Loader = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};
