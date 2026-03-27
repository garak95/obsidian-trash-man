import { App, Modal, moment } from "obsidian";
import { TrashCan, TrashCanItem } from "./TrashCan"
import { TrashRestoreModal } from "TrashRestoreModal";
import { TrashDeleteModal } from "TrashDeleteModal";

export class TrashModal extends Modal {
  sidebarDiv: HTMLDivElement;
  contentDiv: HTMLDivElement;
  headerDiv: HTMLDivElement;
  previewDiv: HTMLDivElement;
  trashCan: TrashCan;

  constructor(app: App) {
    super(app);
    this.setTitle("Trash Manager");
    this.modalEl.addClass("mod-trash-man-modal");
    this.sidebarDiv = this.contentEl.createEl("div", { attr: { class: "mod-trash-man-sidebar" } });
    this.contentDiv = this.contentEl.createEl("div", { attr: { class: "mod-trash-man-content" } });
    this.headerDiv = this.contentDiv.createEl("div", { attr: { class: "mod-trash-man-file-header" } });
    this.previewDiv = this.contentDiv.createEl("div", { attr: { class: "mod-trash-man-file-preview" } });
    this.trashCan = new TrashCan(app.vault);
  }

  async onOpen() {
    const trashItems: TrashCanItem[] = [];
    const visibleItems: [Element, TrashCanItem][] = [];
    let selectedPath: string = "";
    let filterValue: string = "";

    const selectItem = async (path: string) => {
      this.sidebarDiv.querySelectorAll('.is-active').forEach((el) => {
        el.removeClass('is-active');
      });
      preview.empty();

      const selectedItem = visibleItems.find(([el, item]) => item.path === path);
      const el = selectedItem?.[0];
      const item = selectedItem?.[1];

      if (!el || !item || !await item.exists()) {
        filename.textContent = `Nothing selected`;
        preview.textContent = `Nothing selected`;
        selectedPath = "";
        return;
      }

      selectedPath = item.path;

      if (item.stat.type == "folder") {
        preview.createEl('strong', { text: "Folder contents:" });
        const ul = preview.createEl('ul');
        for (const [_el, _item] of visibleItems) {
          if (_item.path.startsWith(item.path + "/")) {
            ul.createEl('li', { text: _item.path });
          }
        }
      } else if (item.stat.size == 0) {
        preview.createEl('em', { text: "Empty file" });
      } else if (item.path.match(/(md|txt|css|base|json|canvas|js|ts)$/)) {
        preview.createEl('strong', { text: "File contents:" });
        preview.createEl('pre', { text: await item.readText() });
      } else if (item.path.match(/(jpe?g|png|gif|bmp|svg)$/)) {
        preview.createEl('img', { attr: { src: item.getResourcePath() } });
      } else {
        preview.innerHTML = `Can't preview this type of file! <a href=".trash/${item.path}">Open outside obsidian.</a>`;
      }
      filename.textContent = item.path;
      el.addClass('is-active');
    };

    const updateSelection = async () => {
      // The goal is to take note of the item above current selection, refresh the list, go back to that item + 1
      let selectedIndex = visibleItems.findIndex(([el, item]) => item.path === selectedPath);
      let index = selectedIndex > 0 ? selectedIndex - 1 : 0;
      const topPos = list.parentElement?.scrollTop || 0;
      selectedPath = visibleItems[index]?.[1].path || "";
      await refresh(filterValue, true);
      // Then advance by one
      selectedIndex = visibleItems.findIndex(([el, item]) => item.path === selectedPath);
      selectedIndex += 1;
      if (selectedIndex < visibleItems.length) {
        selectItem(visibleItems[selectedIndex]?.[1].path || "");
        // visibleItems[selectedIndex]?.[0].scrollIntoView();
      }
      if (list.parentElement)
        list.parentElement.scrollTop = topPos;
    };

    const deleteItem = () => {
      const item = trashItems.find((item) => item.path === selectedPath);
      if (item) new TrashDeleteModal(this.app, item, updateSelection).open();
    };

    const restoreItem = () => {
      const item = trashItems.find((item) => item.path === selectedPath);
      if (item) new TrashRestoreModal(this.app, item, updateSelection).open();
    };

    const refresh = async (filterValue: string, rescan: boolean = false) => {
      filterValue = filterValue.toLowerCase();
      visibleItems.splice(0, visibleItems.length);
      list.empty();
      if (rescan) {
        trashItems.splice(0, trashItems.length);
        trashItems.push(...await this.trashCan.getItems());
      }
      for (const item of trashItems) {
        if (filterValue !== "" && !item.path.toLowerCase().contains(filterValue)) {
          continue;
        }
        const el = list.createEl('div', { attr: { class: 'mod-trash-man-item' } });
        el.createEl('div', { text: item.path, attr: {} });
        el.createEl('div', { text: `${item.stat.size} bytes, ${moment(item.stat.mtime).fromNow()}`, attr: { class: "u-small u-muted" } });
        el.onclick = () => selectItem(item.path);
        visibleItems.push([el, item]);
      }
      await selectItem(selectedPath);
    };

    const preview = this.previewDiv;
    const filename = this.headerDiv.createEl("h2");
    const buttons = this.headerDiv.createEl("div");
    buttons.createEl('button', { text: "Restore" }).onclick = restoreItem;
    buttons.createEl('button', { text: "Delete forever" }).onclick = deleteItem;

    const filter = this.sidebarDiv.createEl('div').createEl('input', { placeholder: "Filter..." });
    const list = this.sidebarDiv.createEl('div');

    filter.onchange = async () => {
      filterValue = filter.value;
      await refresh(filterValue);
    }
    filter.onkeyup = async () => {
      filterValue = filter.value;
      await refresh(filterValue);
    };

    await refresh(filterValue, true);
  }

}
