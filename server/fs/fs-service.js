const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '../');
console.log(`Root path is ${ projectRoot }`);

let siteRel = "contents";
const siteDir = () => path.join(projectRoot, siteRel);
const siteRoot = {
    setPath: (relPath) => {
        siteRel = relPath;
    },
    dir: () => {
        return siteDir()
    }
};
console.log(`Site path is ${ siteRoot.dir() }`);

const getFileInfoPromise = (fullPath, fileName, relativePath) => {
    return new Promise((resolve, reject) => {
        fs.stat(fullPath, (err, stats) => {
            err ? reject(err) : resolve({name: fileName, path: relativePath, stats, type: "file"});
        });
    });
};

const createFilePromise = (filePath, body, flag = 'wx') => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, body.content, {encoding: body.encoding, flag: flag}, (err) => {
            err ? reject(err) : resolve(body.content);
        });
    });
};

const createFolderPromise = (folderPath) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(folderPath, (err) => {
            err ? reject(err) : resolve('successful');
        });
    });
};

const deleteFilePromise = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            err ? reject('error') : resolve('successful');
        });
    });
};

const readFilePromise = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            err ? reject(new Error("Invalid call to file.read - object path is not a file!")) : resolve(data);
        })
    });

};

module.exports = {
    siteRoot: siteRoot,
    files: (dirname) => {
        const folderPath = path.join(siteRoot.dir(), dirname);
        // TODO update node js to +8 to use until.promisify
        const files = fs.existsSync(folderPath) ? fs.readdirSync(folderPath) : [];
        const fileListPromise = [];
        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            fileListPromise.push(getFileInfoPromise(filePath, file, `${ dirname }/${ file }`));
        });
        return Promise.all(fileListPromise);
    },
    file: (directory, fileName) => {
        const folderPath = path.join(siteRoot.dir(), directory);
        const filePath = path.join(siteRoot.dir(), directory, fileName);

        /* GET-Read an existing file */
        const read = () => {
            return readFilePromise(filePath);
            /*return new Promise((resolve, reject) => {
                getFileInfoPromise(filePath).then(() => {
                    readFilePromise(filePath);
                }, (err) => {
                    reject(new Error("Invalid call to file.read - object path is not a file!"));
                });
            });*/
        };
        /* POST-Create a NEW file, ERROR if exists */
        const create = (body) => {
            return getFileInfoPromise(folderPath).then(() => {
                return createFilePromise(filePath, body);
            }, () => {
                return createFolderPromise(folderPath).then(
                    () => {
                        return createFilePromise(filePath, body);
                    }, (err) => Promise.reject(err)
                );
            });
            /*return new Promise((resolve, reject) => {
                getFileInfoPromise(folderPath).then(() => {
                    createFilePromise(filePath, body).then(
                        (content) => resolve(content),
                        (err) => reject(err));
                }, () => {
                    createFolderPromise(folderPath).then(
                        () => {
                            createFilePromise(filePath, body).then(
                                (content) => resolve(content),
                                (err) => reject(err));

                        }, (err) => reject(err)
                    );
                });
            });*/
        };
        /* PUT-Update an existing file */
        const update = (body) => {
            return createFilePromise(filePath, body, 'w');
        };
        /* DELETE an existing file */
        const del = () => {
            return deleteFilePromise(filePath);
        };

        const rmDir = () => {
            return new Promise((resolve, reject) => {
                fs.rmdir(folderPath, (err) => {
                    err ? reject(err) : resolve();
                });
            });
        };
        return {read, create, update, del, rmDir};
    },
};
