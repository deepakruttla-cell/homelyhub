import React, { useState } from 'react';
import FilterModal from './FilterModal';

const Filter = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShowAllPhotos = () => {
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  return (
    <>
      <span
        className="material-symbols-outlined filter"
        onClick={handleShowAllPhotos}
      >
        tune
      </span>
      {isModalOpen && <FilterModal onClose={handleCloseModal} />}
    </>
  );
};

export default Filter;
