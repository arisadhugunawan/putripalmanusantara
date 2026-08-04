export type MediaFileType = "image" | "video" | "pdf";

export interface Media {
  id: string;
  file_url: string;
  file_type: MediaFileType;
  alt_text: string;
  width: number | null;
  height: number | null;
  uploaded_at: string;
}
