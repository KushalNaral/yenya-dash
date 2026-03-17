import type { Download, CreateDownloadData, UpdateDownloadData } from "@/types/downloads/download";
import { createBaseService } from "./baseService";

export const downloadService = createBaseService<Download, CreateDownloadData, UpdateDownloadData>(
  "downloads",
);
