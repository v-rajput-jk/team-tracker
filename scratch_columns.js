const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function run() {
  try {
    console.log("Fetching Token...");
    const tokenUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', process.env.CLIENT_ID);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('client_secret', process.env.CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');

    const tokenRes = await axios.post(tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const token = tokenRes.data.access_token;
    console.log("Token fetched successfully!");

    const siteId = "aoscaustralia.sharepoint.com,d56c5478-f99a-4137-b6e9-38914757c918,b43ef7df-1bfa-4c48-b4b1-9bb4450ffdf5";
    console.log("Using Site ID:", siteId);

    console.log("Fetching Overtime list...");
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const list = listsRes.data.value.find(
      (l) =>
        l.name.toLowerCase().includes("overtime") ||
        l.displayName.toLowerCase().includes("overtime")
    );

    if (!list) {
      console.log("Overtime list not found");
      return;
    }

    console.log("Fetching Columns...");
    const colsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/columns`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fs.writeFileSync('scratch_columns.json', JSON.stringify(colsRes.data.value, null, 2));
    console.log("Wrote scratch_columns.json!");
    
    // Log name, displayName, and type of custom columns
    const customCols = colsRes.data.value.map(c => ({
      name: c.name,
      displayName: c.displayName,
      readOnly: c.readOnly,
      required: c.required,
      type: c.text ? 'text' : c.dateTime ? 'dateTime' : c.number ? 'number' : c.lookup ? 'lookup' : 'other'
    }));
    console.log("Columns Summary:", customCols);

  } catch (error) {
    console.error("Error fetching columns:", error.response?.data || error.message);
  }
}

run();
