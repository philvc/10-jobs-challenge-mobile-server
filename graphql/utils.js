module.exports.paginateResults = ({
    after,
    pageSize,
    results,
    // can pass in a function to calculate an item's cursor
    getCursor,
}) => {
    if (pageSize < 1) return [];

    if (!after) return results.slice(0, pageSize);
    const cursorIndex = results.findIndex((item, index) => {
        // if an item has a `cursor` on it, use that, otherwise try to generate one
        let itemCursor = item.cursor ? item.cursor : getCursor(index);

        // if there's still not a cursor, return false by default
        return itemCursor ? after === itemCursor : false;
    });
    return cursorIndex >= 0
        ? cursorIndex === results.length - 1 || cursorIndex > results.length - 1 // don't let us overflow
            ? []
            : results.slice(
                cursorIndex + 1,
                Math.min(results.length, cursorIndex + 1 + pageSize),
            )
        : results.slice(0, pageSize);
};