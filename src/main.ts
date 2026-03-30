import { Plugin } from "obsidian";
import { TrashModal } from "TrashModal";

export default class TrashManPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "open-trash-manager",
      name: "Open trash manager",
      callback: () => {
        new TrashModal(this.app).open();
      },
    });

    this.addRibbonIcon("trash", "Open trash manager", () => {
      new TrashModal(this.app).open();
    });
  }
}
