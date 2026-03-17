import type {
  ContactUs,
  CreateContactUsData,
  UpdateContactUsData,
} from "@/types/contacts/contactUs";
import { createBaseService } from "./baseService";

export const contactUsService = createBaseService<
  ContactUs,
  CreateContactUsData,
  UpdateContactUsData
>("contact-us");
