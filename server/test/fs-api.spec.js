const expect = require('chai').expect;
const sinon = require('sinon');

const fsAPI = require('../fs-api');

describe("files", () => {
    it("read files from given folder", (done) => {
        const filesHandler = fsAPI.files('faq');
        filesHandler.read((fileList) => {
            expect(fileList.length).to.equal(1);
            done();
        });
    });
});