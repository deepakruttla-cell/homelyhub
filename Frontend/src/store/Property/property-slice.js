import {createSlice} from "@reduxjs/toolkit"

const propertySlice = createSlice({
    name: "property",
    initialState:{
        properties:[],
        totalProperties:0,
        searchParams:{},
        error:null,
        loading:false
    },
reducers: {
    getRequest(state) {
        state.loading = true;
        state.error = null;
    },

    getProperties(state, action) {
        state.properties = Array.isArray(action.payload?.data)
            ? action.payload.data
            : [];

        state.totalProperties =
            Number(action.payload?.all_properties) || 0;

        state.loading = false;
        state.error = null;
    },

    updateSearchParams(state, action) {
        state.searchParams =
            Object.keys(action.payload).length === 0
                ? {}
                : {
                    ...state.searchParams,
                    ...action.payload
                };
    },

    getErrors(state, action) {
        state.error = action.payload;
        state.loading = false;
    }
}
})

export const propertyAction = propertySlice.actions;
export default propertySlice