import { Plugin } from "obsidian";
import { TrashModal } from "TrashModal";

export default class TrashManPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "open-trash-manager",
      name: "Open Trash Manager",
      callback: () => {
        new TrashModal(this.app).open();
      },
    });

    this.addRibbonIcon("trash", "Open Trash Manager", () => {
      new TrashModal(this.app).open();
    });
  }
}
