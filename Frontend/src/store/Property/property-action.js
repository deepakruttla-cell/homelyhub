
import { propertyAction } from './property-slice';
import { axiosInstance } from '../../utils/axios';

export const getAllProperties = () => async (dispatch, getState) => {
  try {
    dispatch(propertyAction.getRequest());

    const { searchParams } = getState().properties;

    const response = await axiosInstance.get('/v1/rent/listing', {
      params: searchParams,
    });

    const result = response.data;

    // Your existing reducer expects data and all_properties.
    const properties = Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result?.properties)
        ? result.properties
        : Array.isArray(result)
          ? result
          : [];

    const totalProperties =
      result?.all_properties ??
      result?.totalProperties ??
      properties.length;

    dispatch(
      propertyAction.getProperties({
        data: properties,
        all_properties: totalProperties,
      })
    );
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Could not fetch properties';

    console.error('Fetching properties failed:', message);

    dispatch(propertyAction.getErrors(message));
  }
};