module.exports = new Proxy({}, {
  get(_target, property) {
    throw new Error(
      "[GGWave Android] Unexpected access to Node.js fs API: " +
      String(property)
    );
  }
});
