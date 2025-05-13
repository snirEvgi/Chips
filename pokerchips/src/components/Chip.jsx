import React from 'react';

const Chip = ({ value, onClick }) => {
  return (
    <div 
      className={`chip chip-${value} h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 text-base sm:text-lg md:text-xl font-bold transition-transform active:scale-95`}
      onClick={onClick}
    >
      {value}
    </div>
  );
};

export default Chip;
