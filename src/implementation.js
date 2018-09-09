import trimStart from 'lodash/trimStart';
import AuthenticationUI from './AuthenticationUI';
import Service from "./service";

window.repoFiles = window.repoFiles || {};

const getFile = path => {
    const segments = path.split('/');
    let obj = window.repoFiles;
    while (obj && segments.length) {
        obj = obj[segments.shift()];
    }
    return obj || {};
}

const nameFromEmail = email => {
    return email
        .split('@').shift().replace(/[.-_]/g, ' ')
        .split(' ')
        .filter(f => f)
        .map(s => s.substr(0, 1).toUpperCase() + (s.substr(1) || ''))
        .join(' ');
};

export default class Implementation {
    constructor(config) {
        this.config = config;

        this.api_root = config.getIn(["backend", "api_root"], "/api");
    }

    authComponent() {
        return AuthenticationUI;
    }

    restoreUser(user) {
        return this.authenticate(user);
    }

    authenticate(state) {
        this.api = new Service({api_root: this.api_root});
        return Promise.resolve({email: state.email, name: nameFromEmail(state.email)});
    }

    logout() {
        return null;
    }

    getToken() {
        return Promise.resolve('');
    }

    entriesByFolder(collection, extension) {
        //TODO should handle multiple backend fs & lokijs

        /*
        return this.api.listFiles(collection.get("folder"))
        // .then(files => files.filter(file => file.indexOf('.'+extension)>-1))
            .then(this.fetchFiles.bind(this));
            */

        return this.api.publishedEntries(collection.get('name'), extension);
    }

    entriesByFiles(collection) {
        const files = collection.get("files").map(collectionFile => ({
            path: collectionFile.get("file"),
            label: collectionFile.get("label"),
        }));
        return this.fetchFiles(files);
    }

    fetchFiles(files) {
        const promises = [];
        files.forEach((file) => {
            promises.push(new Promise((resolve, reject) => this.api.readFile(file.path).then((data) => {
                resolve({file, data});
            }).catch((err) => {
                reject(err);
            })));
        });
        return Promise.all(promises);
    };

    getEntry(collection, slug, path) {
        return this.api.readFile(path).then(data => ({
            file: {path},
            data,
        }));
    }

    getMedia() {
        return this.api.listFiles(this.config.get('media_folder'))
            .then(files => files.filter(file => file.type === 'file'))
            .then(files => files.map(({sha, name, size, stats, path}) => {
                return {id: sha, name, size: stats.size, url: `${ this.config.get('public_folder') }/${ name }`, path};
            }));
    }

    persistEntry(entry, mediaFiles = [], options = {}) {
        if (options.useWorkflow) {
            return this.api.createDraftEntry(options.collectionName, entry.slug, entry);
        } else {
            return this.api.persistFiles(entry, mediaFiles, options);
        }
    }

    async persistMedia(mediaFile, options = {}) {
        try {
            const response = await this.api.persistFiles([], [mediaFile], options);
            const {value, size, path, public_path, fileObj} = mediaFile;
            const url = public_path;
            return {id: response.sha, name: value, size: fileObj.size, url, path: trimStart(path, '/')};
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    deleteFile(path, commitMessage, options) {
        return this.api.deleteFile(path, commitMessage, options);
    }

    unpublishedEntry(collection, slug) {
        return this.api.unpublishedEntry(collection.get('name'), slug);
    }

    unpublishedEntries() {
        return this.api.unpublishedEntries().then((response) => {
            return Promise.resolve(response);
        });
    }

    updateUnpublishedEntryStatus(category, slug, newStatus) {
        return this.api.updateUnpublishedEntryStatus(category, slug, newStatus);
    }

    deleteUnpublishedEntry(collection, slug){
        return this.api.deleteEntry(collection, slug);
    }

    publishUnpublishedEntry(category, slug) {
        return this.api.publishEntry(category, slug);
    }

}