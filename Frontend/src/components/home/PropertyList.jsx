
import React, { useEffect, useState, useRef } from 'react';
import '../../css/Home.css';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { propertyAction } from '../../store/Property/property-slice';
import { getAllProperties } from '../../store/Property/property-action';
import gsap from 'gsap';

// Property Card Component
const Card = ({ image, name, address, price, id }) => {
  return (
    <figure className="property">
      <Link to={`/propertylist/${id || ''}`}>
        {image ? (
          <img
            src={image}
            alt={name || 'Property'}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="property-image-placeholder">
            Image not available
          </div>
        )}
      </Link>

      <h4>{name || 'Unnamed Property'}</h4>

      <figcaption>
        <main className="propertydetails">
          <h5>{name || 'Unnamed Property'}</h5>

          <h6>
            <span className="material-symbols-outlined houseicon">
              home_pin
            </span>
            {address || 'Address not available'}
          </h6>

          <p>
            <span className="price">
              ₹{price ?? 'N/A'}
            </span>
            {' '}per night
          </p>
        </main>
      </figcaption>
    </figure>
  );
};

// Property List Component
const PropertyList = () => {
  const [currentPage, setCurrentPage] = useState({ page: 1 });
  const dispatch = useDispatch();

  const propertyState = useSelector((state) => state.properties || {});

  const properties = Array.isArray(propertyState.properties)
    ? propertyState.properties
    : [];

  const totalProperties = Number(propertyState.totalProperties) || 0;

  const lastPage = Math.ceil(totalProperties / 12);
  const propertyListRef = useRef(null);

  // Fetch properties whenever the page changes
  useEffect(() => {
    dispatch(propertyAction.updateSearchParams(currentPage));
    dispatch(getAllProperties());
  }, [currentPage, dispatch]);

  // Animate property cards
  useEffect(() => {
    const container = propertyListRef.current;

    if (container && container.children.length > 0) {
      gsap.fromTo(
        container.children,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
        }
      );
    }
  }, [properties]);

  // Move to previous page
  const handlePrevious = () => {
    setCurrentPage((previous) => ({
      page: Math.max(1, previous.page - 1),
    }));
  };

  // Move to next page
  const handleNext = () => {
    if (properties.length === 12) {
      setCurrentPage((previous) => ({
        page: previous.page + 1,
      }));
    }
  };

  return (
    <>
      {properties.length === 0 ? (
        <p className="not_found">Property Not Found</p>
      ) : (
        <div className="propertylist" ref={propertyListRef}>
{properties.map((property, index) => {
  const images = Array.isArray(property?.images)
    ? property.images
    : [];

  const image =
    images.find((item) => item?.url)?.url || '';

  const address = [
    property?.address?.city ?? property?.address_city,
    property?.address?.state ?? property?.address_state,
    property?.address?.pincode ?? property?.address_pincode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card
      key={property?.id ?? property?._id ?? index}
      id={property?.id ?? property?._id}
      image={image}
      name={property?.propertyName ?? property?.property_name}
      address={address || 'Address not available'}
      price={property?.price}
    />
  );
})}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          type="button"
          className="previous_btn"
          onClick={handlePrevious}
          disabled={currentPage.page <= 1}
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined">
            arrow_back_ios_new
          </span>
        </button>

        <button
          type="button"
          className="next_btn"
          onClick={handleNext}
          disabled={
            properties.length < 12 ||
            (lastPage > 0 && currentPage.page >= lastPage)
          }
          aria-label="Next page"
        >
          <span className="material-symbols-outlined">
            arrow_forward_ios
          </span>
        </button>
      </div>
    </>
  );
};

export default PropertyList;
