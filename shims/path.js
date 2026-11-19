module.exports = new Proxy({}, {
  get(_target, property) {
    throw new Error(
      "[GGWave Android] Unexpected access to Node.js path API: " +
      String(property)
    );
  }
});
