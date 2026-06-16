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

    const siteId = "aoscaustralia.sharepoint.com,d56c5478-f99a-4137-b6e9-38914757c918,b43ef7df-1bfa-4c48-b4b1-9bb4450ffdf5";
    console.log("Using Site ID:", siteId);

    console.log("Fetching Project list...");
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const list = listsRes.data.value.find(
      (l) =>
        l.name.toLowerCase() === "project" ||
        l.displayName.toLowerCase() === "project" ||
        l.name === "Project_Tracking_all" ||
        l.displayName === "Project_Tracking_all"
    );

    if (!list) {
      console.log("Project list not found");
      return;
    }

    console.log(`Found list: ${list.displayName} (ID: ${list.id})`);

    // Fetch first task item to update
    const itemsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items?expand=fields`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const items = itemsRes.data.value;
    if (items.length === 0) {
      console.log("No items in list to update");
      return;
    }
    const matchedItem = items[0];
    console.log(`Matched Item ID: ${matchedItem.id}, Title: ${matchedItem.fields.Title}`);

    console.log("Attempting PATCH update...");
    const updateRes = await axios.patch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items/${matchedItem.id}/fields`,
      {
        field_3: "Harman",
        field_4: "Ongoing",
        field_8: "Test Update Remarks"
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    console.log("✅ Success! Status code:", updateRes.status);
    console.log("Response fields:", updateRes.data);

  } catch (error) {
    console.error("❌ Error performing update:", error.response?.data || error.message);
  }
}

run();
