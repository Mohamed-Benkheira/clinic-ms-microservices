import axios from 'axios'
const AUTH_URL        = 'http://localhost:8001/api/auth'
const PATIENT_URL     = 'http://localhost:8002/api/patients'
const DOCTOR_URL      = 'http://localhost:8003/api/doctors'
const APPOINTMENT_URL = 'http://localhost:8004/api/appointments'
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
export const login    = (d: object) => axios.post(`${AUTH_URL}/login/`, d)
export const register = (d: object) => axios.post(`${AUTH_URL}/register/`, d)
export const getMe    = ()          => axios.get(`${AUTH_URL}/me/`, auth())
export const getPatients   = ()                      => axios.get(`${PATIENT_URL}/`, auth())
export const createPatient = (d: object)             => axios.post(`${PATIENT_URL}/`, d, auth())
export const updatePatient = (id: number, d: object) => axios.put(`${PATIENT_URL}/${id}/`, d, auth())
export const deletePatient = (id: number)            => axios.delete(`${PATIENT_URL}/${id}/`, auth())
export const getDoctors   = ()                      => axios.get(`${DOCTOR_URL}/`, auth())
export const createDoctor = (d: object)             => axios.post(`${DOCTOR_URL}/`, d, auth())
export const updateDoctor = (id: number, d: object) => axios.put(`${DOCTOR_URL}/${id}/`, d, auth())
export const deleteDoctor = (id: number)            => axios.delete(`${DOCTOR_URL}/${id}/`, auth())
export const getAppointments   = ()                      => axios.get(`${APPOINTMENT_URL}/`, auth())
export const createAppointment = (d: object)             => axios.post(`${APPOINTMENT_URL}/`, d, auth())
export const updateAppointment = (id: number, d: object) => axios.put(`${APPOINTMENT_URL}/${id}/`, d, auth())
export const deleteAppointment = (id: number)            => axios.delete(`${APPOINTMENT_URL}/${id}/`, auth())
