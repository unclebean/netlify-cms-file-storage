const workflowService = require('./workflow-service');

module.exports = (app) => {

    app.post('/api/workflow/save/:category/:slug', (req, res, next) => {
        const newContent = {slug: req.params.slug, collection: req.params.category, data: req.body};
        res.json(workflowService.createOrUpdate(newContent));
    });

    app.get('/api/workflow/unpublishedEntries', (req, res, next) => {
        res.json(workflowService.getAllUnpublishedContents());
    });

    app.get('/api/workflow/unpublishedEntry/:category/:slug', (req, res, next) => {
        res.json(workflowService.getContentBySlug(req.params.category, req.params.slug));
    });

    app.put('/api/workflow/updateUnpublishedEntryStatus/:category/:slug/:newStatus', (req, res, next) => {
        const {category, slug, newStatus} = req.params;
        res.json(workflowService.updateContentStatus(category, slug, newStatus));
    });

    app.get('/api/workflow/publishedEntries/:category', (req, res, next) => {
        const list = workflowService.getAllPublishedContentsByCollection(req.params.category);
        res.json(list);
    });

    app.put('/api/workflow/publishEntry/:category/:slug', (req, res, next) => {
        const {category, slug} = req.params;
        res.json(workflowService.publishedContent(category, slug));
    });

    app.delete('/api/workflow/delete/:category/:slug', (req, res, next) => {
        const {category, slug} = req.params;
        res.json(workflowService.deleteContent(category, slug));
    });

};