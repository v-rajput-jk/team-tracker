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

    console.log("Fetching Site ID dynamically...");
    const siteRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${process.env.SITE_URL}:${process.env.SITE_PATH}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const siteId = siteRes.data.id;
    console.log("Using Site ID:", siteId);

    console.log("Fetching Lists...");
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const list = listsRes.data.value.find(l => 
      l.name.toLowerCase().includes('overtime') || 
      l.displayName.toLowerCase().includes('overtime')
    );
    
    if (!list) {
      console.log("❌ No list with name containing 'overtime' found!");
      return;
    }

    console.log(`Found Overtime List: ${list.displayName} (ID: ${list.id})`);

    console.log("Fetching items...");
    const itemsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items?expand=fields`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const items = itemsRes.data.value.map(i => ({ id: i.id, fields: i.fields }));
    console.log(`Found ${items.length} items in ${list.displayName}`);
    
    fs.writeFileSync('scratch_overtime_items.json', JSON.stringify(items, null, 2));
    console.log("Saved items to scratch_overtime_items.json!");
    
    if (items.length > 0) {
      console.log("Sample Item Fields:", Object.keys(items[0].fields));
      console.log("Sample Item Content:", JSON.stringify(items[0], null, 2));
    }
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

run();
