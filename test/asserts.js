function assertEquals(expected, actual) {
    if (expected !== actual) {
        throw new Error('Assertion error! Expected: ' + expected + ', actual: ' + actual);
    }
}
function assertTrue(actual) {
    assertEquals(true, actual);
}

module.exports.assertEquals = assertEquals;
module.exports.assertTrue = assertTrue;