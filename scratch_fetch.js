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

    console.log("All SharePoint Lists:", listsRes.data.value.map(l => ({ name: l.name, displayName: l.displayName, id: l.id })));
    const list = listsRes.data.value.find(
      (l) =>
        l.name.toLowerCase() === "project" ||
        l.displayName.toLowerCase() === "project"
    );

    if (!list) {
      console.log("Project list not found");
      return;
    }

    console.log("Fetching items from Project_Tracking_all...");
    const itemsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items?expand=fields`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const items = itemsRes.data.value.map((item) => item.fields);
    console.log(`Fetched ${items.length} items.`);

    if (items.length > 0) {
      fs.writeFileSync('scratch_item.json', JSON.stringify(items[0], null, 2));
      fs.writeFileSync('scratch_all_items.json', JSON.stringify(items, null, 2));
      console.log("Wrote scratch_item.json and scratch_all_items.json!");
    } else {
      console.log("No items found in Project_Tracking_all list.");
    }
  } catch (error) {
    console.error("Error in scratch_fetch:", error.response?.data || error.message);
  }
}

run();
