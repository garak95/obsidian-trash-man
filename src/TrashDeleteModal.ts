import { App, Modal, Notice, Setting } from 'obsidian';
import { TrashCanItem } from 'TrashCan';

export class TrashDeleteModal extends Modal {
  constructor(app: App, item: TrashCanItem, onSubmit: () => void|Promise<void>) {
    super(app);
    this.setTitle('Delete item forever:');
    this.contentEl.createEl("em", {text: item.path});

    new Setting(this.contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Delete')
          .setWarning()
          .onClick(async () => {
            try {
              await item.delete();
              await onSubmit();
              this.close();
            } catch (error) {
              new Notice(`Error deleting file:\n${error}`);
            }
          }));
  }
}