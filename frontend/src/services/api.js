import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

export const getProperties = (params) => API.get('/properties', { params });
export const getPropertyById = (id) => API.get(`/properties/${id}`);
export const createProperty = (data) => API.post('/properties', data);
export const updateProperty = (id, data) => API.put(`/properties/${id}`, data);
export const deleteProperty = (id) => API.delete(`/properties/${id}`);
export const updateStatus = (id, status) => API.patch(`/properties/${id}/status`, { status });
export const getDistricts = () => API.get('/properties/districts');
export const exportExcel = () => API.get('/properties/export/excel');

export const uploadImages = (formData) => API.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteImage = (id) => API.delete(`/upload/${id}`);
export const setThumbnail = (data) => API.put('/upload/thumbnail', data);

export const previewImport = (text) => API.post('/import/preview', { text });
export const confirmImport = (items) => API.post('/import/confirm', { items });

export default API;
