import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

const ImageGallery = ({ images, alt, className = "h-64" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Parse images safely
  let imageList = [];
  try {
    if (Array.isArray(images)) {
      imageList = images;
    } else if (typeof images === 'string') {
      // Check if it's a JSON string representation of an array
      if (images.trim().startsWith('[')) {
        imageList = JSON.parse(images);
      } else {
        // Legacy support for single URL string
        imageList = [images];
      }
    }
  } catch (e) {
    console.error("Image parsing error", e);
    imageList = [];
  }

  // Filter out empty or invalid entries
  const validImages = imageList.filter(img => img && typeof img === 'string' && img.length > 5);

  if (validImages.length === 0) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <ImageIcon className="h-12 w-12 text-gray-400" />
      </div>
    );
  }

  const nextSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  return (
    <div className={`relative group w-full overflow-hidden bg-gray-100 ${className}`}>
      <img
        src={validImages[currentIndex]}
        alt={`${alt} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-transform duration-500"
      />
      
      {validImages.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight size={24} />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
             {validImages.map((_, idx) => (
               <button
                 key={idx}
                 onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                 className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
               />
             ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageGallery;