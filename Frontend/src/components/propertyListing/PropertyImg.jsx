
import React, { useState } from 'react';
import Modal from './Modal';

const PropertyImg = ({ images = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Keep only valid image objects with a URL.
  const validImages = Array.isArray(images)
    ? images.filter((image) => image && typeof image.url === 'string' && image.url.trim() !== '')
    : [];

  const handleShowAllPhotos = () => {
    if (validImages.length > 0) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (validImages.length === 0) {
    return (
      <div className="property-img-container">
        <p>No property images available.</p>
      </div>
    );
  }

  return (
    <>
      <div className="property-img-container">
        {validImages.slice(0, 5).map((image, index) => (
          <div className="img-item" key={`${image.url}-${index}`}>
            <img
              src={image.url}
              className="images"
              alt={`Property ${index + 1}`}
              style={
                index === 0
                  ? { borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' }
                  : index === 4
                    ? { borderBottomRightRadius: '10px' }
                    : undefined
              }
            />
          </div>
        ))}

        {validImages.length > 1 && (
          <button className="similar-photos" onClick={handleShowAllPhotos}>
            <span className="material-symbols-outlined">photo_library</span>
            Show all photos
          </button>
        )}
      </div>

      {isModalOpen && (
        <Modal images={validImages} onClose={handleCloseModal} />
      )}
    </>
  );
};

export default PropertyImg;
