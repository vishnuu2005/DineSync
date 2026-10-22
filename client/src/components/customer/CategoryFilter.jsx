import React from 'react';
import { Coffee, Utensils, CupSoda, Cookie, Croissant, Sparkles, Grid } from 'lucide-react';

const categories = [
  { name: 'All', icon: Grid },
  { name: 'Coffee', icon: Coffee },
  { name: 'Tea', icon: CupSoda },
  { name: 'Snacks', icon: Utensils },
  { name: 'Breakfast', icon: Croissant },
  { name: 'Desserts', icon: Cookie },
  { name: 'Other', icon: Sparkles },
];

const CategoryFilter = ({ activeCategory, onSelectCategory }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isSelected = activeCategory === cat.name;

        return (
          <button
            key={cat.name}
            onClick={() => onSelectCategory(cat.name)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all duration-200 shrink-0 ${
              isSelected
                ? 'bg-[#2C1810] text-[#FAEDCD] shadow-md scale-102 ring-2 ring-[#8B5E3C]/30'
                : 'bg-white text-[#3C2A21] hover:bg-[#FAEDCD]/50 border border-[#D4A373]/25 shadow-2xs'
            }`}
          >
            <Icon className={`w-4 h-4 ${isSelected ? 'text-[#D4A373]' : 'text-[#8B5E3C]'}`} />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
