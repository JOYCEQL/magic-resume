"use client";
import { useState } from "react";
import { X, Menu } from "lucide-react";

interface MenuToggleProps {
  onToggle: (isOpen: boolean) => void;
}

export default function MenuToggle({ onToggle }: MenuToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle(newState);
  };

  return (
    <button
      className="md:hidden p-2 hover:bg-accent rounded-md"
      onClick={handleToggle}
    >
      {isOpen ? (
        <X className="w-5 h-5" />
      ) : (
        <Menu className="w-5 h-5" />
      )}
    </button>
  );
}
