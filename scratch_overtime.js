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

    const lists = listsRes.data.value;
    console.log("All Lists:", lists.map(l => l.displayName));

    const otList = lists.find(l => l.name.toLowerCase().includes('overtime') || l.displayName.toLowerCase().includes('overtime'));
    if (!otList) {
      console.log("❌ No list with name containing 'overtime' found!");
      return;
    }

    console.log(`Found Overtime List: ${otList.displayName} (ID: ${otList.id})`);

    console.log("Fetching items...");
    const itemsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${otList.id}/items?expand=fields`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const items = itemsRes.data.value.map(i => i.fields);
    console.log(`Found ${items.length} items in ${otList.displayName}`);
    if (items.length > 0) {
      console.log("Sample Item:", JSON.stringify(items[0], null, 2));
      fs.writeFileSync('scratch_overtime_items.json', JSON.stringify(items, null, 2));
      console.log("Wrote items to scratch_overtime_items.json!");
    }

    console.log("Fetching Columns...");
    const colsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${otList.id}/columns`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Columns:", colsRes.data.value.map(c => ({ name: c.name, displayName: c.displayName })));

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

run();
