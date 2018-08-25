module.exports = {
    get500ErrorResponse: (basicResponse) => {
        return {...basicResponse, status: 500};
    }
};