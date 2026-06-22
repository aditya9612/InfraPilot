export type UserRole =
  | "Admin"
  | "ProjectManager"
  | "SiteEngineer"
  | "Accountant"
  | "Client"
  | "Labour";

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
  department?: string;
  project_id?: number;
  project_name?: string;
}

export interface RoleCounts {
  Admin?: number;
  ProjectManager?: number;
  SiteEngineer?: number;
  Accountant?: number;
  Client?: number;
  Labour?: number;
  total?: number;
  [key: string]: number | undefined;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  color: string;
  is_active: boolean;
}
