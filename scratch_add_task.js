const axios = require('axios');
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

    console.log("Fetching Site ID...");
    const siteRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${process.env.SITE_URL}:${process.env.SITE_PATH}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const siteId = siteRes.data.id;
    console.log("Site ID:", siteId);

    console.log("Fetching Lists...");
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const list = listsRes.data.value.find(
      (l) =>
        l.name.toLowerCase() === "project" ||
        l.displayName.toLowerCase() === "project"
    );

    if (!list) {
      console.log("Project list not found");
      return;
    }

    console.log(`Found list: ${list.displayName} (ID: ${list.id})`);

    // Let's try to add a test task
    console.log("Adding test task to SharePoint...");
    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items`,
      {
        fields: {
          Title: "Test Task via Script",
          field_1: "Vectorlab",
          field_3: "Navreet",
          field_4: "Not Started",
          field_5: "2026-06-11",
          field_6: "2026-06-19",
          field_7: "Test description",
          field_8: ""
        }
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    console.log("✅ Success! Item created:", response.data);
  } catch (error) {
    console.error("❌ Error adding task:", error.response?.data || error.message);
  }
}

run();
