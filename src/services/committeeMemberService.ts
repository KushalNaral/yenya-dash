import type {
  CommitteeMember,
  CreateCommitteeMemberData,
  UpdateCommitteeMemberData,
} from "@/types/committeeMembers/committeeMember";
import { createBaseService } from "./baseService";

export const committeeMemberService = createBaseService<
  CommitteeMember,
  CreateCommitteeMemberData,
  UpdateCommitteeMemberData
>("committee-members");
