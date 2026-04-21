export type UserRole =
  | "Admin"
  | "ProjectManager"
  | "SiteEngineer"
  | "Accountant";

export interface User {
  user_id: number;
  full_name: string;
  role: UserRole;
  mobile_number: string;
  email: string;
  address: string;
  pan_number: string;
  aadhaar_number: string;
  profile_image: string;
  designation: string;
  joining_date: string;
  is_active: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  color: string;
  is_active: boolean;
}
