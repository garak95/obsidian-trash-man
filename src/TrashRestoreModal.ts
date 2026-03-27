import { App, Modal, normalizePath, Notice, Setting } from 'obsidian';
import { TrashCanItem } from 'TrashCan';

export class TrashRestoreModal extends Modal {
  constructor(app: App, item: TrashCanItem, onSubmit: (destPath: string) => void | Promise<void>) {
    super(app);
    this.setTitle('Restore item from trash:');
    this.contentEl.createEl("em", {text: item.path});

    let destPath = item.path;

    new Setting(this.contentEl)
      .setName('Choose destination:')
      .addText(text =>
        text
          .setValue(destPath)
          .onChange((value) => {
            destPath = normalizePath(value);
          })
      )
      .addButton((btn) =>
        btn
          .setButtonText('Restore')
          .setCta()
          .onClick(async () => {
            try {
              await item.restore(destPath);
              await onSubmit(destPath);
              this.close();
            } catch (error) {
              new Notice(`Error restoring file:\n${error}`);
            }
          }))
  }
}