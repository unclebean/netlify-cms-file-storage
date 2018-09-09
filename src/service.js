import {Base64} from "js-base64";
const SIMPLE = 'simple';

export default class Service {
    constructor(config) {
        this.api_root = config.api_root || "/api";
    }

    user() {
        return this.request("/user");
    }

    requestHeaders(headers = {}) {
        const baseHeader = {
            "Content-Type": "application/json",
            ...headers,
        };

        return baseHeader;
    }

    parseJsonResponse(response) {
        return response.json().then((json) => {
            if (!response.ok) {
                return Promise.reject(json);
            }

            return json;
        });
    }

    urlFor(path, options) {
        const cacheBuster = new Date().getTime();
        const params = [`ts=${ cacheBuster }`];
        if (options.params) {
            for (const key in options.params) {
                params.push(`${ key }=${ encodeURIComponent(options.params[key]) }`);
            }
        }
        if (params.length) {
            path += `?${ params.join("&") }`;
        }
        return this.api_root + path;
    }

    request(path, options = {}) {
        const headers = this.requestHeaders(options.headers || {});
        const url = this.urlFor(path, options);
        let responseStatus;
        return fetch(url, { ...options,
                headers
            }).then((response) => {
                responseStatus = response.status;
                const contentType = response.headers.get("Content-Type");
                if (contentType && contentType.match(/json/)) {
                    return this.parseJsonResponse(response);
                }
                return response.text();
            })
            .catch((error) => {
                //TODO
                throw "error occured";
            });
    }

    readFile(path) {
        const cache = Promise.resolve(null);
        return cache.then((cached) => {
            if (cached) {
                return cached;
            }

            return this.request(`/file/${ path }`, {
                headers: {
                    Accept: "application/octet-stream"
                },
                params: {},
                cache: "no-store",
            }).then((result) => {
                return result;
            });
        });
    }

    listFiles(path) {
        return this.request(`/files/${ path }`, {
                params: {},
            })
            .then((files) => {
                if (!Array.isArray(files)) {
                    throw new Error(`Cannot list files, path ${ path } is not a directory but a ${ files.type }`);
                }
                return files;
            })
            .then(files => files.filter(file => file.type === "file"));
    }

    composeFileTree(files) {
        let filename;
        let part;
        let parts;
        let subtree;
        const fileTree = {};

        files.forEach((file) => {
            if (file.uploaded) {
                return;
            }
            parts = file.path.split("/").filter(part => part);
            filename = parts.pop();
            subtree = fileTree;
            while (part = parts.shift()) {
                subtree[part] = subtree[part] || {};
                subtree = subtree[part];
            }
            subtree[filename] = file;
            file.file = true;
        });

        return fileTree;
    }

    toBase64(str) {
        return Promise.resolve(
            Base64.encode(str)
        );
    }

    uploadBlob(item, newFile = false) {
        const content = item.raw ? this.toBase64(item.raw) : item.toBase64();
        const method = newFile ? "POST" : "PUT"; // Always update or create new. PUT is Update existing only

        const pathID = item.path.substring(0, 1) === '/' ? item.path.substring(1, item.path.length) : item.path.toString();

        return content.then(contentBase64 => this.request(`/file/${ pathID }`, {
            method: method,
            body: JSON.stringify({
                content: contentBase64,
                encoding: "base64",
            }),
        }).then((response) => {
            item.uploaded = true;
            return item;
        }));
    }

    persistFiles(entry, mediaFiles, options) {
        const uploadPromises = [];
        const files = mediaFiles.concat(entry);

        files.forEach((file) => {
            if (file.uploaded) {
                return;
            }
            uploadPromises.push(this.uploadBlob(file, (options.newEntry && !(file.toBase64))));
        });

        const fileTree = this.composeFileTree(files);

        return Promise.all(uploadPromises).then(() => {
            if (!options.mode || (options.mode && options.mode === SIMPLE)) {
                return fileTree;
            }
        });
    }

    deleteFile(path, message, options = {}) {
        const fileURL = `/file/${ path }`;
        return this.request(fileURL, {
            method: "DELETE",
            params: {}
        });
    }

    unpublishedEntries() {
        return this.request('/workflow/unpublishedEntries', {method: "GET", params: {}}).then((response) => {
            return response.map((entry => {
                entry.data = Base64.decode(entry.data.content);
                return entry;
            }));
        });
    }

    unpublishedEntry(category, slug) {
        return this.request(`/workflow/unpublishedEntry/${category}/${slug}`, {method: "GET", params: {}}).then((response) => {
            try{
                response.data = Base64.decode(response.data.content);
                return response;
            } catch(e) {
                return null;
            }
        });
    }

    createDraftEntry(category, contentName, content) {
        const url = `/workflow/save/${category}/${contentName}`;
        const base64Body = content.raw ? this.toBase64(content.raw) : content.toBase64();
        return base64Body.then(encodeContent => this.request(url, {
            method: 'POST',
            body: JSON.stringify({
                content: encodeContent,
                encoding: "base64",
            }),
        }).then((response) => {
            console.log(response);
            content.uploaded = true;
            console.log(content);
            return content;
        }));
    }

    updateUnpublishedEntryStatus(category, slug, newStatus) {
        const url = `/workflow/updateUnpublishedEntryStatus/${category}/${slug}/${newStatus}`;
        return this.request(url, {method: 'PUT'});
    }

    publishedEntries(category, extension) {
        const url = `/workflow/publishedEntries/${category}`;
        return this.request(url, {method: 'GET'}).then(response => {
            return response.map((entry => {
                entry.name = `${entry.slug}.${extension}`;
                entry.data = Base64.decode(entry.data.content);
                entry.file = {path: `${entry.collection}/${entry.slug}.${extension}`};
                return entry;
            }));
        });
    }

    publishEntry(category, slug) {
        const url = `/workflow/publishEntry/${category}/${slug}`;
        return this.request(url, {method: 'PUT'});
    }

    deleteEntry(category, slug) {
        const url = `/workflow/delete/${category}/${slug}`;
        return this.request(url, {method: 'DELETE'});
    }

}