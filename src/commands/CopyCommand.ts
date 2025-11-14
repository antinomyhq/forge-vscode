import { ClipboardService } from "../services/ClipboardService";
import { showNotificationIfEnabled } from "../utils/notifications";
import { getFileReference } from "../utils/fileUtils";

export class CopyCommand {
  constructor(private clipboardService: ClipboardService) {}

  /**
   * Copy file reference to clipboard
   */
  async copyFileReference(): Promise<void> {
    const fileRef = getFileReference();
    if (!fileRef) {
      showNotificationIfEnabled("No file found.", 'warning');
      return;
    }

    await this.clipboardService.copyFileReference(fileRef);
    showNotificationIfEnabled("File reference copied to clipboard.", 'info');
  }

  /**
   * Copy file reference with specific format
   */
  async copyFileReferenceWithFormat(format: "absolute" | "relative"): Promise<void> {
    const fileRef = getFileReference(format);
    if (!fileRef) {
      showNotificationIfEnabled("No file found.", 'warning');
      return;
    }

    await this.clipboardService.copyFileReference(fileRef);
    showNotificationIfEnabled("File reference copied to clipboard.", 'info');
  }
}