const loki = require('lokijs');
const lfsa = require('lokijs/src/loki-fs-structured-adapter');

const CONTENT_COLLECTION_NAME = 'content';
const CONTENT_NAME = 'slug';
const CONTENT_CATEGORY = 'collection';
const CONTENT_PATH = 'path';
const CONTENT_BODY = 'data';
const CONTENT_STATUS = 'status';

const adapter = new lfsa();
const databaseInitialize = () => {
    const contentCollection = db.getCollection(CONTENT_COLLECTION_NAME);
    if (!contentCollection) {
        db.addCollection(CONTENT_COLLECTION_NAME, {indices: [CONTENT_NAME]});
    }
};

const db = new loki('db/workflow.json', {
    adapter: adapter,
    autoload: true,
    autoloadCallback: databaseInitialize,
    autosave: true,
    autosaveInterval: 4000
});

const getCollection = () => db.getCollection(CONTENT_COLLECTION_NAME);

const repository = {
    createDraft: (content) => {
        const newContent = {file: {path: ''}, metaData: {'status': 'draft'}};
        newContent.metaData[CONTENT_CATEGORY] = content.collection;
        newContent[CONTENT_NAME] = content[CONTENT_NAME];
        newContent[CONTENT_CATEGORY] = content[CONTENT_CATEGORY];
        newContent[CONTENT_BODY] = content[CONTENT_BODY];
        getCollection().insert(newContent);
        return newContent;
    },
    getContentBySlug: (category, slug) => {
        return getCollection().findOne({
            '$and': [{
                'slug':slug,
                'collection': category
            }]
        });
    },
    updateContentDataBySlug: (updatedContent) => {
        const content = repository.getContentBySlug(updatedContent.collection, updatedContent.slug);
        content[CONTENT_BODY] = updatedContent.data;
        getCollection().update(content);
        return content;
    },
    updateContentStatus: (category, slug, newStatus) => {
        const collection = getCollection();
        const query = {};
        query[CONTENT_NAME] = slug;
        query[CONTENT_CATEGORY] = category;
        const content = collection.findOne(query);
        content.metaData.status = newStatus;
        collection.update(content);
        return content;
    },
    getAllUnpublishedContents: () => {
        return getCollection().find({
            '$or': [{
                'metaData.status': 'draft'
            }, {
                'metaData.status': 'pending_review'
            }, {
                'metaData.status': 'pending_publish'
            }]
        });
    },
    getAllPublishedContents: (category) => {
        return getCollection().find({
            '$and': [{
                collection: category,
                'metaData.status': 'published'
            }]
        });
    },
    deleteContentBySlug: (category, slug) => {
        const content = repository.getContentBySlug(category, slug);
        return getCollection().remove(content);
    }
};

module.exports = repository;
