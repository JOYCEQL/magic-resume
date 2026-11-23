import { DEFAULT_AVATAR } from "@/generated/defaultAvatar";

export { DEFAULT_AVATAR };

// Resolve old backup URLs at render time without rewriting saved/custom photos.
export const getResumePhotoSrc = (photo: string | undefined) =>
  photo === "/avatar.png" ? DEFAULT_AVATAR : photo;
