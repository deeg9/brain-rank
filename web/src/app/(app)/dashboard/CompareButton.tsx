"use client";

interface CompareButtonProps {
  isSelected: boolean;
  onClick: () => void;
}

export function CompareButton({ isSelected, onClick }: CompareButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        isSelected
          ? 'text-black bg-gray-100'
          : 'text-gray-400 hover:text-black hover:bg-gray-100'
      }`}
      title={isSelected ? "Remove from comparison" : "Add to comparison"}
    >
      <span className="material-symbols-outlined text-lg">
        {isSelected ? 'check' : 'compare_arrows'}
      </span>
    </button>
  );
}
