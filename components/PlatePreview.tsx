
import React from 'react';

interface PlatePreviewProps {
  plateNumber: string;
  governorate: string;
  category: string;
  plateType: string;
}

const PlatePreview: React.FC<PlatePreviewProps> = ({ plateNumber, governorate, category, plateType }) => {
  // تحديد الألوان بناءً على النوع
  const getColors = () => {
    switch (plateType) {
      case 'أجرة':
        return { bg: '#fbbf24', text: '#000000', border: '#000000' };
      case 'نقل':
        return { bg: '#2563eb', text: '#ffffff', border: '#ffffff' };
      case 'حكومي':
        return { bg: '#ef4444', text: '#ffffff', border: '#ffffff' };
      default: // خصوصي
        return { bg: '#ffffff', text: '#000000', border: '#000000' };
    }
  };

  const colors = getColors();

  return (
    <div 
      className="relative w-[340px] h-[160px] border-[6px] rounded-lg flex flex-col items-center justify-between p-3 shadow-2xl font-bold transition-all duration-500"
      style={{ 
        backgroundColor: colors.bg, 
        borderColor: colors.text,
        color: colors.text 
      }}
    >
      {/* Top Banner */}
      <div className="w-full flex justify-between items-center text-sm border-b-[3px] pb-1 uppercase tracking-tighter" style={{ borderColor: colors.text }}>
         <span className="font-black">YEMEN</span>
         <span className="font-black">الجمهورية اليمنية</span>
      </div>
      
      {/* Middle Section (Number) */}
      <div className="flex-1 flex items-center justify-center text-6xl tracking-[0.2em] font-serif py-1">
        {plateNumber.toString().padStart(5, '0')}
      </div>

      {/* Bottom Section (Details) */}
      <div className="w-full grid grid-cols-2 gap-0 border-t-[3px]" style={{ borderColor: colors.text }}>
        <div className="flex items-center justify-center border-l-[3px] py-1" style={{ borderColor: colors.text }}>
          <span className="text-xl">{governorate}</span>
        </div>
        <div className="flex items-center justify-center py-1">
          <span className="text-xl">فاصل {category}</span>
        </div>
      </div>
      
      {/* Background Hologram Effect */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none flex items-center justify-center">
         <div className="w-32 h-32 border-[2px] rounded-full" style={{ borderColor: colors.text }}></div>
         <div className="absolute w-24 h-24 border-[2px] rotate-45" style={{ borderColor: colors.text }}></div>
      </div>
    </div>
  );
};

export default PlatePreview;
