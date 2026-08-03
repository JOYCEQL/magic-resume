declare global {
  interface Window {
    showDirectoryPicker(
      options?: FilePickerOptions
    ): Promise<FileSystemDirectoryHandle>;
  }

  /**
   * File System Access API 的权限接口尚未进入 TS 标准 DOM 库，
   * 但 Chromium 系浏览器已实现。这里按 W3C 草案补声明。
   * 消费者：src/utils/fileSystem.ts 的 verifyPermission()。
   */
  type FileSystemPermissionMode = "read" | "readwrite";

  interface FileSystemHandlePermissionDescriptor {
    mode?: FileSystemPermissionMode;
  }

  interface FileSystemHandle {
    queryPermission(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
    requestPermission(
      descriptor?: FileSystemHandlePermissionDescriptor
    ): Promise<PermissionState>;
  }
}

interface FilePickerOptions {
  multiple?: boolean;
  mode?: "read" | "readwrite";
}

export {};
