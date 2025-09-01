// client/src/components/ui/dropdown.js
import React, { useState } from "react";

export const Dropdown = ({ label, options = [], onChange }) => {
  const [selected, setSelected] = useState("");

  const handleChange = (e) => {
    setSelected(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <select
        value={selected}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select...</option>
        {options.map((opt, i) => (
          <option key={i} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    </div>
  );
};
