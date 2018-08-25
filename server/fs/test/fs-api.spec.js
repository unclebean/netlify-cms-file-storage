const expect = require('chai').expect;
const sinon = require('sinon');

const fsAPI = require('../fs-service');

before(() => {
    fsAPI.siteRoot.setPath('fs/test/test-contents');
});

describe("files", () => {
    it("read files from given folder", (done) => {
        const filesPromise = fsAPI.files('faq');
        filesPromise.then((fileList) => {
            expect(fileList.length).to.equal(1);
            expect(fileList[0].name).to.equal('test.md');
            expect(fileList[0].path).to.equal('faq/test.md');
            done();
        });
    });
});

describe("file", () => {
    it("read file content", (done) => {
        const fileHandler = fsAPI.file('faq', 'test.md');
        fileHandler.read().then((content) => {
            expect(content).to.equal(
                '---\n' +
                'title: test\n' +
                '---\n' +
                'test content');
            done();
        });
    });
    it("give not exist file should throw error", (done) => {
        const fileHandler = fsAPI.file('faq', 'xxxx.md');
        fileHandler.read().then(() => {
        }, (err) => {
            expect(err.message).to.equal("Invalid call to file.read - object path is not a file!");
            done();
        });
    });
    it("create a new file with category and fileName", (done) => {
        const fileHandler = fsAPI.file('faq', 'zero_content_folder-exist.md');
        fileHandler.create({content: 'test', encoding: 'utf-8'}).then((content) => {
            expect(content).to.equal('test');
            fileHandler.del().then(() => {
            }, () => {
            });
            done();
        });
    });
    it("give not exist folder should create new folder", (done) => {
        const fileHandler = fsAPI.file('new_folder', 'zero_content.md');
        fileHandler.create({content: 'test', encoding: 'utf-8'}).then((content) => {
            expect(content).to.equal('test');
            fileHandler.del().then(() => {
            }, () => {
            });
            fileHandler.rmDir().then(() => {
            }, () => {
            });
            done();
        });
    });
    it("update file content", (done) => {
        const fileHandler = fsAPI.file('faq', 'zero_content.md');
        fileHandler.create({content: 'test', encoding: 'utf-8'}).then(() => {
        }, () => {
        });
        fileHandler.update({content: 'updated content', encoding: 'utf-8'}).then((content) => {
            expect(content).to.equal('updated content');
            fileHandler.del().then(() => {
            }, () => {
            });
            done();
        }, () => {
        });
    });
    it("delete file", (done) => {
        const fileHandler = fsAPI.file('faq', 'zero_content_delete.md');
        fileHandler.create({content: 'test', encoding: 'utf-8'}).then(() => {
            fileHandler.del().then((status) => {
                expect(status).to.equal('successful');
                done();
            }, () => {
                done();
            });
        }, () => {
        });
    });
});