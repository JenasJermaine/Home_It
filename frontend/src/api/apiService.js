import axios from "axios";

const SERVER_URL = "http://localhost:8090";
const API_URL = "http://localhost:8090/api";

const api = axios.create({
  baseURL: API_URL
});

//Checks if its FormData being Passed or not and changes the api header
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers["Content-Type"];
    }
  } else if (!config.headers?.["Content-Type"]) {
    config.headers = config.headers || {};
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// Add JWT to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const postJson = (url, payload, config = {}) =>
  api.post(url, payload, {
    ...config,
    headers: {
      ...(config.headers || {}),
      "Content-Type": "application/json"
    }
  });

export const postFormData = (url, formData, config = {}) =>
  api.post(url, formData, config);

export const putJson = (url, payload, config = {}) =>
  api.put(url, payload, {
    ...config,
    headers: {
      ...(config.headers || {}),
      "Content-Type": "application/json"
    }
  });

export const putFormData = (url, formData, config = {}) =>
  api.put(url, formData, config);

// MEDIA URL/API HELPERS (/uploads is served from server root, not /api)
export const buildMediaUrl = (mediaPath) => {
  if (!mediaPath) return "";
  if (mediaPath.startsWith("http://") || mediaPath.startsWith("https://")) {
    return mediaPath;
  }
  return mediaPath.startsWith("/")
    ? `${SERVER_URL}${mediaPath}`
    : `${SERVER_URL}/${mediaPath}`;
};

export const getMediaFile = (mediaPath, config = {}) =>
  axios.get(buildMediaUrl(mediaPath), config);

//AUTH API
export const register = (regBody) => postJson('/auth/register', regBody);
export const login = (loginBody) => postJson('/auth/login', loginBody);

//PROPERTIES API
export const getAllProperties = (params) => api.get('/properties', { params });
export const getFilteredProperties = (params) => api.get('/properties/filters', { params });
export const getPropertyById= (propertyId) => api.get(`/properties/${propertyId}`);
export const addBasicHouseInfo= (basicInfoBody) => postJson('/properties', basicInfoBody);
export const addHouseAmenities= (propertyId, houseAmenitiesBody) => postJson(`/properties/${propertyId}/amenities`, houseAmenitiesBody);
export const addHouseImages= (propertyId, houseImagesBody) => postFormData(`/properties/${propertyId}/images`, houseImagesBody);
export const modifyBasicHouseInfo= (propertyId, newBasicInfoBody) => putJson(`/properties/${propertyId}`, newBasicInfoBody);
export const modifyHouseAmenities= (propertyId, newHouseAmenities) => putJson(`/properties/${propertyId}/amenities`, newHouseAmenities);
export const modifyHouseImages= (propertyId, newhouseImagesBody) => putFormData(`/properties/${propertyId}/images`, newhouseImagesBody);
export const deleteHouse= (propertyId) => api.delete(`/properties/${propertyId}`);
export const deleteSingleHouseImage= (propertyId, imageId) => api.delete(`/properties/${propertyId}/images/${imageId}`);
export const deleteAllHouseImages= (propertyId) => api.delete(`/properties/${propertyId}/images`);

//BOOKMARKS API
export const getMyBookmarks = () => api.get('/bookmarks');
export const checkBookmarkStatus = (propertyId) => api.get(`/bookmarks/check/${propertyId}`);
export const createBookmark = (bookmarkBody) => postJson('/bookmarks', bookmarkBody);
export const deleteBookmarkByProperty = (propertyId) => api.delete(`/bookmarks/property/${propertyId}`);
export const deleteBookmarkById = (bookmarkId) => api.delete(`/bookmarks/${bookmarkId}`);

//AMENITIES API
export const getAllAmenities = () => api.get('/amenities');
export const createAmenity = (amenityBody) => postJson('/amenities', amenityBody);
export const updateAmenity = (amenityId, amenityBody) => putJson(`/amenities/${amenityId}`, amenityBody);
export const deleteAmenity = (amenityId) => api.delete(`/amenities/${amenityId}`);

//USER PROFILE API
export const getMyProfile = () => api.get('/user_profiles/me');
export const updateMyProfile = (profileBody) => putJson('/user_profiles/me', profileBody);
export const updateMyProfilePicture = (profilePictureFormData) =>
  putFormData('/user_profiles/me/profile-picture', profilePictureFormData);


export default api;
