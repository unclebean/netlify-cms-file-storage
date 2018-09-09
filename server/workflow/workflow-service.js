const workflowRepository = require('../repository/workflow-repository');

module.exports = {
    createOrUpdate: (content) => {
        const storedContent = workflowRepository.getContentBySlug(content.collection, content.slug);
        if(storedContent) {
            return workflowRepository.updateContentDataBySlug(content);
        } else {
            return workflowRepository.createDraft(content);
        }
    },
    getAllUnpublishedContents: () => {
        return workflowRepository.getAllUnpublishedContents();
    },
    getContentBySlug: (collection, slug) => {
        return workflowRepository.getContentBySlug(collection, slug);
    },
    updateContentStatus: (collection, slug, newStatus) => {
        return workflowRepository.updateContentStatus(collection, slug, newStatus);
    },
    getAllPublishedContentsByCollection: (collection) => {
        return workflowRepository.getAllPublishedContents(collection);
    },
    publishedContent: (collection, slug) => {
        return workflowRepository.updateContentStatus(collection, slug, 'published');
    },
    deleteContent: (collection, slug) => {
        return workflowRepository.deleteContentBySlug(collection, slug);
    }
};