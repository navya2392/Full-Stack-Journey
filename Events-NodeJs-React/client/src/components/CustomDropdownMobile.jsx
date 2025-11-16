import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomDropdownMobile({ 
  label, 
  value, 
  options, 
  onChange, 
  name,
  required = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setIsOpen(false);
  };

  return (
    <div className={className} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
        >
          <span>{value}</span>
          <ChevronDown 
            size={18} 
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <div
                key={option}
                onClick={() => handleSelect(option)}
                className={`px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                  option === value ? 'bg-blue-50 font-medium' : ''
                }`}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
