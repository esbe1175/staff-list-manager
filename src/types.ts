export interface StaffMember {
  name: string;
  job_title?: string;
  image_path: string;
  is_intern: boolean;
}

export interface StaffSection {
  title: string;
  members: StaffMember[];
}

export interface StaffData {
  title: string;
  sections: StaffSection[];
}