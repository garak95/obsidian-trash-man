import { Vault, Stat, normalizePath } from "obsidian";

export class TrashCanItem {
    constructor(
        readonly trash: TrashCan,
        readonly path: string,
        readonly stat: Stat
    ) { };

    async readText() {
        const path = this.trash.getCleanPath(this.path);
        return await this.trash.vault.adapter.read(path);
    }

    // async readBinary() {
    //     const path = this.trash.getNormalizedPath(this.path);
    //     return await this.trash.vault.adapter.read(path);
    // }

    async delete() {
        const path = this.trash.getCleanPath(this.path);
        if (this.stat.type === "folder") {
            await this.trash.vault.adapter.rmdir(path, true);
        } else {
            await this.trash.vault.adapter.remove(path);
        }
    }

    async restore(newPath: string) {
        const path = this.trash.getCleanPath(this.path);
        // FIXME: Ensure newPath is in the vault
        newPath = normalizePath(newPath);
        await this.trash.vault.adapter.rename(path, newPath);
    }

    async exists() {
        const path = this.trash.getCleanPath(this.path);
        return await this.trash.vault.adapter.exists(path);
    }

    getResourcePath() {
        const path = this.trash.getCleanPath(this.path);
        return this.trash.vault.adapter.getResourcePath(path);
    }
}

export class TrashCan {
    vault: Vault;
    path: string;

    constructor(vault: Vault, trashPath: string = ".trash") {
        this.vault = vault;
        this.path = trashPath;
    }

    async getItems(): Promise<TrashCanItem[]> {
        const trashPath = normalizePath(this.path);
        const items: TrashCanItem[] = [];

        const walkFolder = async (path: string, callback: (path: string, stat: Stat) => void) => {
            const listing = await this.vault.adapter.list(path);
            for (const item of listing.folders) {
                const stat = await this.vault.adapter.stat(item);
                if (!stat) {
                    // console.log(...)
                    continue;
                }
                callback(item, stat);
                await walkFolder(item, callback);
            }
            for (const item of listing.files) {
                const stat = await this.vault.adapter.stat(item);
                if (!stat) {
                    // console.log(...)
                    continue;
                }
                callback(item, stat);
            }
        }

        await walkFolder(trashPath, (item, stat) => {
            items.push(new TrashCanItem(this, normalizePath(item.replace(trashPath, '')), stat));
        });

        return items;
    }

    getCleanPath(path: string) {
        // Make sure path doesn't end up outside the trash can after evaluating all /../..
        // path = normalize(path);
        path = path
            .replace(/[\\\/]+/g, '/')
            .replace(/\/\.\.\//g, '/')
            .replace(/^\/+/, '');
        return normalizePath(this.path + "/" + normalizePath(path));
    }
}