export interface CommitteeMember {
  id?: number;
  name: string;
  designation: string;
  description?: string;
  type: "bod" | "management";
  order: number;
  status: 0 | 1;
  primary_image?: {
    url: string;
    name?: string;
    id?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateCommitteeMemberData {
  name: string;
  designation: string;
  description: string;
  type: "bod" | "management" | "incharge";
  order: number;
  status: 0 | 1;
  assets?: File | null | string;
}

export interface UpdateCommitteeMemberData extends Partial<CreateCommitteeMemberData> {
  id?: number;
}
