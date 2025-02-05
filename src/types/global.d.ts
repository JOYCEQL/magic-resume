declare global {
  interface Window {
    showDirectoryPicker(
      options?: FilePickerOptions
    ): Promise<FileSystemDirectoryHandle>;
  }
}

interface FilePickerOptions {
  multiple?: boolean;
  mode?: "read" | "readwrite";
}

export {};
