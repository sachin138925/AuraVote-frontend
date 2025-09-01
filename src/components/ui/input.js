// client/src/components/ui/input.js
import React from "react";
import clsx from "clsx";

export const Input = ({ className, ...props }) => {
  return (
    <input
      className={clsx(
        "w-full px-4 py-2 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        className
      )}
      {...props}
    />
  );
};
