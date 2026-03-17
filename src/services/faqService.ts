import type { Faq, CreateFaqData, UpdateFaqData } from "@/types/faqs/faq";
import { createBaseService } from "./baseService";

export const faqService = createBaseService<Faq, CreateFaqData, UpdateFaqData>("faq");
