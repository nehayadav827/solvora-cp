import axiosInstance from "./axiosInstance";

export const getAllProblems = (params) =>
  axiosInstance.get("/problems", { params });

export const getProblemBySlug = (slug) =>
  axiosInstance.get(`/problems/${slug}`);