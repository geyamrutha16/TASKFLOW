/**
 * Expo config plugin: allow plain-HTTP requests in release builds.
 *
 * Android blocks cleartext (http://) traffic by default for release APKs.
 * Our dev/demo backend runs on http://<LAN-IP>:5000, so we opt in here.
 * If the API is deployed behind HTTPS, this plugin can be removed.
 */
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (application) application.$['android:usesCleartextTraffic'] = 'true';
    return cfg;
  });
};
