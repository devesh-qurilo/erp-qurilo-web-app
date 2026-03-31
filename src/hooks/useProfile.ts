"use client";

import { useQuery } from "@tanstack/react-query";

// Updated type based on full API response
export type Profile = {
  employeeId: string;
  name: string;
  email: string;
  profilePictureUrl: string;
  gender: string;
  birthday: string;
  bloodGroup: string;
  joiningDate: string;
  language: string;
  country: string;
  mobile: string;
  address: string;
  about: string;
  departmentId: number;
  departmentName: string;
  designationId: number;
  designationName: string;
  reportingToId: string;
  reportingToName: string;
  role: string;
  loginAllowed: boolean;
  receiveEmailNotification: boolean;
  hourlyRate: number;
  slackMemberId: string;
  skills: string[];
  probationEndDate: string;
  noticePeriodStartDate: string;
  noticePeriodEndDate: string;
  employmentType: string;
  maritalStatus: string;
  businessAddress: string;
  officeShift: string;
  active: boolean;
  createdAt: string;
};

// Function to fetch profile from API
const fetchProfile = async (): Promise<Profile> => {
  const res = await fetch("api/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

// Custom hook
export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // don't refetch on window focus
  });
};
