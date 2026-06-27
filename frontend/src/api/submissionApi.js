import axiosInstance from "./axiosInstance";

export const submitCode = (data) =>
  axiosInstance.post("/submissions", data);

export const getMySubmissions = (problemSlug) =>
  axiosInstance.get("/submissions", { params: { problemSlug } });

export const getSubmissionById = (id) =>
  axiosInstance.get(`/submissions/${id}`);