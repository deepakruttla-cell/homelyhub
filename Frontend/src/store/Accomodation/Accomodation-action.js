
import { accomodationActions } from './Accomodation-slice';
import { axiosInstance } from '../../utils/axios';

export const createAccomodation = (accomodationData) => async (dispatch) => {
    try {
        dispatch(accomodationActions.getAccomodationRequest());

        const response = await axiosInstance.post(
            '/v1/rent/user/newAccommodation',
            accomodationData
        );

        dispatch(accomodationActions.getAccomodation(response.data.data));

        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            error.message ||
            'Unable to create property';

        dispatch(accomodationActions.getErrors(message));

        throw new Error(message);
    }
};

export const getAllAccomodation = () => async (dispatch) => {
    try {
        dispatch(accomodationActions.getAccomodationRequest());

        const { data } = await axiosInstance.get(
            '/v1/rent/user/myAccommodation'
        );

        dispatch(accomodationActions.getAccomodation(data.data));

        return data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            error.message ||
            'Unable to retrieve properties';

        dispatch(accomodationActions.getErrors(message));

        throw new Error(message);
    }
};
