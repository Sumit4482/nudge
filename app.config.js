/**
 * Extends app.json. The Firebase client file (google-services.json) is not committed to git.
 * Builds on EAS get it from the GOOGLE_SERVICES_JSON file variable. Locally it is read from the project root.
 */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
  },
});
