const { google } = require('googleapis');
const multiparty = require('multiparty');
const fs = require('fs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = new multiparty.Form();
  form.parse(req, async (err, fields, files) => {
    try {
      const url = fields.url[0];
      const jsonPath = files.jsonFile[0].path;
      const content = fs.readFileSync(jsonPath, 'utf8');
      const key = JSON.parse(content);

      const jwtClient = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        ['https://www.googleapis.com/auth/indexing']
      );

      await jwtClient.authorize();
      const indexing = google.indexing({ version: 'v3', auth: jwtClient });

      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url: url,
          type: 'URL_UPDATED',
        },
      });

      return res.status(200).json({ message: 'URL berhasil dikirim ke Google!' });
    } catch (error) {
      return res.status(500).json({ error: 'Gagal mengirim URL: ' + error.message });
    }
  });
};