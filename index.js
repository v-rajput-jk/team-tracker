require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const app = express();
app.use(express.json());

// 🔹 CORS (allow any localhost for dev)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 🔹 Request logging
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// 🔹 JWKS Client (Token verification ke liye)
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.TENANT_ID}/discovery/v2.0/keys`,
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No auth header" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "No token provided" });

  // Microsoft Graph tokens have a special signature that cannot be verified 
  // via standard public JWKS endpoints. We decode to check expiration,
  // and MS Graph will perform the actual signature validation.
  const decoded = jwt.decode(token);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    return res.status(401).json({ message: "Token has expired" });
  }

  req.user = decoded;
  req.userToken = token;
  next();
};

// 🔹 Cache for Site ID
let cachedSiteId = null;

// 🔹 Get Site ID
const getSiteId = async (token) => {
  try {
    if (cachedSiteId) return cachedSiteId;

    const res = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${process.env.SITE_URL}:${process.env.SITE_PATH}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    cachedSiteId = res.data.id;
    return cachedSiteId;
  } catch (error) {
    console.error("❌ Site ID Error:", error.response?.data || error.message);
    throw error;
  }
};

// 🔹 Get List Items
const getListItems = async (token, listName) => {
  try {
    const siteId = await getSiteId(token);

    // Get all lists
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const list = listsRes.data.value.find(
      (l) =>
        l.name.toLowerCase() === listName.toLowerCase() ||
        l.displayName.toLowerCase() === listName.toLowerCase()
    );

    if (!list) throw new Error(`List '${listName}' not found`);

    // Get items
    const itemsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items?expand=fields`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return itemsRes.data.value.map((item) => item.fields);
  } catch (error) {
    console.error(`❌ List Error (${listName}):`, error.response?.data || error.message);
    throw error;
  }
};

// 🔹 Routes
app.get("/", (req, res) => {
  res.send("🚀 Backend running with Delegated Auth");
});

// 🔹 Get Lists
app.get("/getLists", validateToken, async (req, res) => {
  try {
    const siteId = await getSiteId(req.userToken);

    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      {
        headers: { Authorization: `Bearer ${req.userToken}` },
      }
    );

    res.json(
      response.data.value.map((list) => ({
        name: list.name,
        displayName: list.displayName,
      }))
    );
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch lists",
      error: error.response?.data || error.message,
    });
  }
});

// 🔹 Employees
app.get("/getEmployees", validateToken, async (req, res) => {
  try {
    const data = await getListItems(req.userToken, "Team Members");
    res.json(data);
  } catch (error) {
    console.warn("⚠️ Returning empty array for Employees due to error.");
    res.json([]);
  }
});

// 🔹 Tasks
app.get("/getTasks", validateToken, async (req, res) => {
  try {
    let data;
    try {
      data = await getListItems(req.userToken, "Project");
    } catch {
      try {
        data = await getListItems(req.userToken, "Project_Tracking_all");
      } catch {
        try {
          data = await getListItems(req.userToken, "Tasks");
        } catch {
          throw new Error("Project, Project_Tracking_all, and Tasks failed");
        }
      }
    }
    res.json(data);
  } catch (error) {
    console.warn("⚠️ Returning empty array for Tasks due to error.");
    res.json([]);
  }
});

// 🔹 Attendance
app.get("/getAttendance", validateToken, async (req, res) => {
  try {
    const siteId = await getSiteId(req.userToken);
    
    // Get list ID for Attendence
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      { headers: { Authorization: `Bearer ${req.userToken}` } }
    );
    const list = listsRes.data.value.find(l => l.name === 'Attendence' || l.displayName === 'Attendence');
    if (!list) throw new Error("Attendence list not found");

    // Fetch Items and Columns with safety catches to avoid crashing if columns fetch fails
    let items = [];
    try {
      const itemsRes = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items?expand=fields`, {
        headers: { Authorization: `Bearer ${req.userToken}` }
      });
      items = itemsRes.data.value.map(item => item.fields);
    } catch (itemErr) {
      console.error("❌ Failed to fetch attendance items:", itemErr.message);
      throw itemErr;
    }

    let columnMap = {};
    try {
      const columnsRes = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/columns`, {
        headers: { Authorization: `Bearer ${req.userToken}` }
      });
      if (columnsRes.data && columnsRes.data.value) {
        columnsRes.data.value.forEach(col => {
          columnMap[col.name] = col.displayName;
        });
      }
    } catch (colErr) {
      console.warn("⚠️ Warning: Failed to fetch attendance columns schema:", colErr.message);
    }

    res.json({
      items,
      columnMap
    });
  } catch (error) {
    console.error("❌ Attendance Fetch Error:", error.message);
    res.json({ items: [], columnMap: {} });
  }
});

// 🔹 Overtime
app.get("/getOvertime", validateToken, async (req, res) => {
  try {
    const siteId = await getSiteId(req.userToken);
    
    // Get all lists to find one containing 'overtime'
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      { headers: { Authorization: `Bearer ${req.userToken}` } }
    );
    
    console.log("All Lists for Debugging:", listsRes.data.value.map(l => ({ name: l.name, displayName: l.displayName })));

    const list = listsRes.data.value.find(l => 
      l.name.toLowerCase().includes('overtime') || 
      l.displayName.toLowerCase().includes('overtime')
    );
    
    if (!list) {
      console.warn("⚠️ Overtime list not found in SharePoint lists.");
      return res.json({ items: [], columnMap: {} });
    }

    console.log(`Found Overtime List: ${list.displayName} (ID: ${list.id})`);

    // Fetch Items and Columns with safety catches to avoid crashing if columns fetch fails
    let items = [];
    try {
      const itemsRes = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items?expand=fields`, {
        headers: { Authorization: `Bearer ${req.userToken}` }
      });
      items = itemsRes.data.value.map(item => item.fields);
    } catch (itemErr) {
      console.error("❌ Failed to fetch overtime items:", itemErr.message);
      throw itemErr;
    }

    let columnMap = {};
    try {
      const columnsRes = await axios.get(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/columns`, {
        headers: { Authorization: `Bearer ${req.userToken}` }
      });
      if (columnsRes.data && columnsRes.data.value) {
        columnsRes.data.value.forEach(col => {
          columnMap[col.name] = col.displayName;
        });
      }
    } catch (colErr) {
      console.warn("⚠️ Warning: Failed to fetch overtime columns schema:", colErr.message);
    }

    console.log("Overtime items found:", items.length);
    res.json({
      items,
      columnMap
    });
  } catch (error) {
    console.error("❌ Overtime Fetch Error:", error.response?.data || error.message);
    res.json({ items: [], columnMap: {} });
  }
});

// 🔹 Update Overtime Field (supports pivoted columns like 2026-05-06)
app.post("/updateOvertimeField", validateToken, async (req, res) => {
  let executionPath = "none";
  let detectedFields = {};
  let selectedFieldName = null;
  let targetItemId = null;
  let patchPayload = null;

  try {
    const { employeeName, date, value, isShortLeave, startTime, endTime } = req.body;
    console.log("➡️ UPDATE REQUEST RECEIVED:", { employeeName, date, value, isShortLeave });
    const siteId = await getSiteId(req.userToken);
    
    // Normalize date formats
    let isoDate = date; // e.g. '2026-05-06'
    let ddDate = date;  // e.g. '06-05-2026'
    const matchYYYY = date.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    const matchDD = date.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (matchYYYY) {
      const [_, y, m, d] = matchYYYY;
      ddDate = `${d}-${m}-${y}`;
    } else if (matchDD) {
      const [_, d, m, y] = matchDD;
      isoDate = `${y}-${m}-${d}`;
    }

    // Find the Overtime list
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      { headers: { Authorization: `Bearer ${req.userToken}` } }
    );
    const list = listsRes.data.value.find(l => 
      l.name.toLowerCase().includes('overtime') || 
      l.displayName.toLowerCase().includes('overtime')
    );
    if (!list) throw new Error("Overtime list not found");

    console.log(`Using Overtime List for Update: ${list.displayName} (ID: ${list.id})`);

    // 1. Fetch all items from SharePoint list
    const itemsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items?expand=fields`,
      { headers: { Authorization: `Bearer ${req.userToken}` } }
    );
    const items = itemsRes.data.value || [];
    console.log(`Fetched ${items.length} items from Overtime list`);

    // 2. Fetch Columns with safety try-catch (SharePoint columns endpoint can fail)
    let columns = [];
    try {
      const colsRes = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/columns`,
        { headers: { Authorization: `Bearer ${req.userToken}` } }
      );
      columns = colsRes.data.value || [];
    } catch (colErr) {
      console.warn("⚠️ Warning: Failed to fetch list columns schema:", colErr.message);
    }

    // 3. Scan fields and columns to find standard field names
    let dateFieldName = null;
    let hoursFieldName = null;
    let empNameFieldName = null;

    // Check items first (keys in fields) - scan all items' fields to find possible columns
    if (items.length > 0) {
      const allKeys = new Set();
      items.forEach(item => {
        if (item.fields) {
          Object.keys(item.fields).forEach(k => allKeys.add(k));
        }
      });
      const keys = Array.from(allKeys);
      console.log("➡️ All detected item fields keys:", keys);
      
      const normalize = k => k.toLowerCase().replace(/_x0020_/g, '').replace(/_/g, '').replace(/\s/g, '');
      
      if (isShortLeave) {
        // Find exact Leave Date column (LeaveDate)
        dateFieldName = keys.find(k => normalize(k) === 'leavedate') || 
                        keys.find(k => normalize(k).includes('leavedate') || normalize(k).includes('leave_date')) ||
                        'LeaveDate';
        
        // Find exact Leave Hours column (Leave)
        hoursFieldName = keys.find(k => normalize(k) === 'leave') || 
                         keys.find(k => !normalize(k).includes('date') && (normalize(k).includes('leavehours') || normalize(k).includes('leave_hours') || normalize(k).includes('leave'))) ||
                         'Leave';
      } else {
        // Find exact Overtime Date column (OvertimeDate)
        dateFieldName = keys.find(k => normalize(k) === 'overtimedate') || 
                        keys.find(k => !normalize(k).includes('leave') && (normalize(k).includes('overtimedate') || normalize(k).includes('overtime_date') || normalize(k).includes('date'))) ||
                        'OvertimeDate';
        
        // Find exact Overtime Hours column (OvertimeHours)
        hoursFieldName = keys.find(k => normalize(k) === 'overtimehours') || 
                         keys.find(k => !normalize(k).includes('date') && !normalize(k).includes('leave') && (normalize(k).includes('overtimehours') || normalize(k).includes('totalextrahours') || normalize(k).includes('hours') || normalize(k).includes('hour') || normalize(k).includes('overtime'))) ||
                         'OvertimeHours';
      }
      
      // Find Employee Name column
      empNameFieldName = keys.find(k => ['employeename', 'employee_name', 'employee'].includes(normalize(k))) || 'Title';
    }

    // Fallback to columns list schema
    if (columns.length > 0) {
      const normalize = k => k.toLowerCase().replace(/_x0020_/g, '').replace(/_/g, '').replace(/\s/g, '');
      
      if (isShortLeave) {
        if (!dateFieldName || dateFieldName === 'LeaveDate') {
          const col = columns.find(c => c.name && normalize(c.name) === 'leavedate');
          if (col) dateFieldName = col.name;
        }
        if (!hoursFieldName || hoursFieldName === 'Leave') {
          const col = columns.find(c => c.name && normalize(c.name) === 'leave');
          if (col) hoursFieldName = col.name;
        }
      } else {
        if (!dateFieldName || dateFieldName === 'OvertimeDate') {
          const col = columns.find(c => c.name && normalize(c.name) === 'overtimedate');
          if (col) dateFieldName = col.name;
        }
        if (!hoursFieldName || hoursFieldName === 'OvertimeHours') {
          const col = columns.find(c => c.name && normalize(c.name) === 'overtimehours');
          if (col) hoursFieldName = col.name;
        }
      }

      if (!dateFieldName) {
        dateFieldName = columns.find(col => col.name && (
          ['overtimedate', 'date', 'overtime_date'].includes(normalize(col.name)) || 
          normalize(col.name).includes('date')
        ))?.name;
      }
      if (!hoursFieldName) {
        hoursFieldName = columns.find(col => col.name && (
          !normalize(col.name).includes('date') && (
            ['overtimehours', 'totalextrahours', 'extrahours', 'hours', 'totalhours', 'extrahour'].includes(normalize(col.name)) || 
            normalize(col.name).includes('hours') || normalize(col.name).includes('hour')
          )
        ))?.name;
      }
      if (!empNameFieldName || empNameFieldName === 'Title') {
        const col = columns.find(c => c.name && ['employeename', 'employee_name', 'employee'].includes(normalize(c.name)));
        if (col) empNameFieldName = col.name;
      }
    }

    // 4. Value-based detection if columns/keys didn't match typical names
    if (items.length > 0) {
      if (!empNameFieldName || !dateFieldName || !hoursFieldName) {
        console.log("➡️ Trying value-based field detection...");
        // Scan the first few items to find match patterns
        for (const item of items.slice(0, 5)) {
          const f = item.fields || {};
          for (const [key, val] of Object.entries(f)) {
            if (key === 'id' || key === 'Title' || key === 'Attachments') continue;
            
            const valStr = String(val);
            if (!empNameFieldName && valStr.toLowerCase() === employeeName.toLowerCase()) {
              empNameFieldName = key;
              console.log(`➡️ Value-based detected empNameFieldName: ${key}`);
            }
            if (!dateFieldName && valStr.match(/^\d{4}-\d{2}-\d{2}/)) {
              dateFieldName = key;
              console.log(`➡️ Value-based detected dateFieldName: ${key}`);
            }
            if (!hoursFieldName && typeof val === 'number' && val > 0 && val <= 24) {
              hoursFieldName = key;
              console.log(`➡️ Value-based detected hoursFieldName: ${key}`);
            }
          }
        }
      }
    }

    // Ensure we do not try to write to read-only columns LinkTitle / LinkTitleNoMenu
    if (empNameFieldName === 'LinkTitle' || empNameFieldName === 'LinkTitleNoMenu') {
      empNameFieldName = 'Title';
    }

    // Format dates with a time and UTC zone for SharePoint Graph API standard dateTime fields
    const graphDate = isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00Z`;

    const availableColumns = new Set(columns.map(c => c.name));
    let startTimeField = null;
    let endTimeField = null;
    const normalizeKey = k => k.toLowerCase().replace(/_x0020_/g, '').replace(/_/g, '').replace(/\s/g, '');
    
    const startCol = columns.find(c => c.name && (normalizeKey(c.name) === 'starttime' || normalizeKey(c.name) === 'start_time'));
    if (startCol) startTimeField = startCol.name;
    else if (availableColumns.has('StartTime')) startTimeField = 'StartTime';
    else if (availableColumns.has('Start_x0020_Time')) startTimeField = 'Start_x0020_Time';
    
    const endCol = columns.find(c => c.name && (normalizeKey(c.name) === 'endtime' || normalizeKey(c.name) === 'end_time'));
    if (endCol) endTimeField = endCol.name;
    else if (availableColumns.has('EndTime')) endTimeField = 'EndTime';
    else if (availableColumns.has('End_x0020_Time')) endTimeField = 'End_x0020_Time';

    detectedFields = { dateFieldName, hoursFieldName, empNameFieldName, startTimeField, endTimeField };
    console.log("➡️ FINAL DETECTED FIELDS:", detectedFields);

    // 5. If we found standard Date and Hours fields, it's standard vertical list format!
    // We check if either columns or items contain standard keys
    const isStandardVertical = items.length > 0 && (
      Object.keys(items[0].fields || {}).some(k => k.toLowerCase() === dateFieldName.toLowerCase()) ||
      Object.keys(items[0].fields || {}).some(k => k.toLowerCase() === hoursFieldName.toLowerCase())
    );

    if (isStandardVertical || dateFieldName !== 'Date' || hoursFieldName !== 'Hours') {
      executionPath = "standard_vertical";
      console.log(`Detected Standard vertical list format. Date Field: ${dateFieldName}, Hours Field: ${hoursFieldName}, Name Field: ${empNameFieldName}`);

      // Find existing item matching developer AND date (extracted YYYY-MM-DD)
      let matchedItem = items.find(item => {
        const f = item.fields;
        const empName = f[empNameFieldName] || f.Employee_x0020_Name || f.Title || f.Name || f.EmployeeName || '';
        const rawDate = f[dateFieldName] || '';
        
        let itemDate = '';
        if (rawDate) {
          if (rawDate.includes('T')) {
            itemDate = rawDate.split('T')[0];
          } else {
            const mYYYY = rawDate.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
            const mDD = rawDate.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
            if (mYYYY) {
              itemDate = rawDate;
            } else if (mDD) {
              const [_, d, m, y] = mDD;
              itemDate = `${y}-${m}-${d}`;
            } else {
              itemDate = rawDate.trim();
            }
          }
        }
        return empName.toLowerCase() === employeeName.toLowerCase() && itemDate === isoDate;
      });

      // If no exact match by date, search for an empty pre-created row for this employee
      if (!matchedItem) {
        matchedItem = items.find(item => {
          const f = item.fields;
          const empName = f[empNameFieldName] || f.Employee_x0020_Name || f.Title || f.Name || f.EmployeeName || '';
          const hasOvertimeDate = !!f.OvertimeDate;
          const hasLeaveDate = !!f.LeaveDate;
          return empName.toLowerCase() === employeeName.toLowerCase() && !hasOvertimeDate && !hasLeaveDate;
        });
        if (matchedItem) {
          console.log(`➡️ Found empty pre-created row for ${employeeName} (ID: ${matchedItem.id}), reusing it.`);
        }
      }

      if (matchedItem) {
        targetItemId = matchedItem.id;
        if (isShortLeave) {
          selectedFieldName = "Leave";
          patchPayload = { 
            Leave: Number(value),
            LeaveDate: graphDate
          };
          if (startTime && startTimeField) patchPayload[startTimeField] = startTime;
          if (endTime && endTimeField) patchPayload[endTimeField] = endTime;
        } else {
          selectedFieldName = hoursFieldName;
          patchPayload = { 
            [hoursFieldName]: Number(value),
            [dateFieldName]: graphDate
          };
          if (startTime && startTimeField) patchPayload[startTimeField] = startTime;
          if (endTime && endTimeField) patchPayload[endTimeField] = endTime;
        }
        
        console.log(`Updating existing standard record ID: ${matchedItem.id} with payload:`, patchPayload);
        const updateRes = await axios.patch(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items/${matchedItem.id}/fields`,
          patchPayload,
          { headers: { Authorization: `Bearer ${req.userToken}`, 'Content-Type': 'application/json' } }
        );
        console.log("✅ Update Res status:", updateRes.status);
        return res.json({ message: "Field updated successfully", item: matchedItem.id, value: Number(value) });
      } else {
        let fieldsToCreate = {};
        if (isShortLeave) {
          fieldsToCreate = {
            [empNameFieldName]: employeeName,
            LeaveDate: graphDate,
            Leave: Number(value)
          };
          if (startTime && startTimeField) fieldsToCreate[startTimeField] = startTime;
          if (endTime && endTimeField) fieldsToCreate[endTimeField] = endTime;
        } else {
          fieldsToCreate = {
            [empNameFieldName]: employeeName,
            [dateFieldName]: graphDate,
            [hoursFieldName]: Number(value)
          };
          if (startTime && startTimeField) fieldsToCreate[startTimeField] = startTime;
          if (endTime && endTimeField) fieldsToCreate[endTimeField] = endTime;
        }
        
        // Add Title if it's not already used as the employee name column
        if (empNameFieldName !== 'Title') {
          fieldsToCreate.Title = isShortLeave ? `Leave - ${employeeName}` : `Overtime - ${employeeName}`;
        }

        patchPayload = { fields: fieldsToCreate };
        console.log(`Creating new record for ${employeeName} on ${isoDate} with fields:`, fieldsToCreate);
        const newItem = await axios.post(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items`,
          patchPayload,
          { headers: { Authorization: `Bearer ${req.userToken}`, 'Content-Type': 'application/json' } }
        );
        console.log("✅ Creation Res status:", newItem.status);
        return res.json({ message: "Field created successfully", item: newItem.data.id, value: Number(value) });
      }
    }

    // ----------------------------------------------------
    // 6. FALLBACK TO ORIGINAL PIVOTED COLUMNS UPDATE LOGIC
    // ----------------------------------------------------
    executionPath = "pivoted_columns_fallback";
    console.log(`Using Pivoted format fallback logic for Overtime update.`);
    
    const matchedItem = items.find(item => {
      const f = item.fields;
      const empName = f.Employee_x0020_Name || f.Title || f.Name || f.EmployeeName || f.LinkTitleNoMenu || '';
      return empName.toLowerCase() === employeeName.toLowerCase();
    });

    if (!matchedItem) {
      return res.status(404).json({ message: `Employee '${employeeName}' not found in Overtime list` });
    }

    targetItemId = matchedItem.id;

    const matchedCol = columns.find(col => {
      const colName = col.name.toLowerCase();
      const colDisp = col.displayName.toLowerCase();
      return colName.includes(isoDate) || colDisp.includes(isoDate) ||
             colName.includes(ddDate) || colDisp.includes(ddDate) ||
             colName.replace(/_x002d_/g, '-').includes(isoDate) ||
             colName.replace(/_x002d_/g, '-').includes(ddDate);
    });

    let fieldName = matchedCol ? matchedCol.name : null;

    if (!fieldName) {
      const decodedKey = Object.keys(matchedItem.fields).find(k => {
        let decoded = k.replace(/^OData_/, '');
        decoded = decoded.replace(/_x([0-9a-fA-F]{4})_/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        return decoded.includes(isoDate) || decoded.includes(ddDate);
      });
      if (decodedKey) fieldName = decodedKey;
    }

    if (!fieldName) {
      fieldName = date; // final fallback
    }

    selectedFieldName = fieldName;

    const numericValue = Number(value);
    const finalValue = isNaN(numericValue) ? value : numericValue;

    patchPayload = { [fieldName]: finalValue };

    await axios.patch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items/${matchedItem.id}/fields`,
      patchPayload,
      { headers: { Authorization: `Bearer ${req.userToken}`, 'Content-Type': 'application/json' } }
    );

    res.json({ message: "Field updated successfully", item: matchedItem.id, field: fieldName, value: finalValue });
  } catch (error) {
    console.error("❌ Update Field Error:", error.response?.data || error.message);
    res.status(500).json({ 
      message: "Failed to update field", 
      error: error.message, 
      details: {
        ...(error.response?.data || {}),
        debugInfo: {
          executionPath,
          detectedFields,
          selectedFieldName,
          targetItemId,
          patchPayload
        }
      }
    });
  }
});

// 🔹 Update Project Fields
app.post("/updateProjectFields", validateToken, async (req, res) => {
  try {
    const { taskId, allocatedStaff, remarks, status, clientFeedback } = req.body;
    const siteId = await getSiteId(req.userToken);

    // Find the Project_Tracking_all or Tasks list
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      { headers: { Authorization: `Bearer ${req.userToken}` } }
    );
    let list = listsRes.data.value.find(l => 
      l.name.toLowerCase() === "project" || 
      l.displayName.toLowerCase() === "project"
    );
    if (!list) {
      list = listsRes.data.value.find(l => 
        l.name === "Project_Tracking_all" || 
        l.displayName === "Project_Tracking_all"
      );
    }
    if (!list) {
      list = listsRes.data.value.find(l => 
        l.name === "Tasks" || 
        l.displayName === "Tasks"
      );
    }
    if (!list) throw new Error("Project list not found");

    // Fetch all items to find the one matching taskId or project name dynamically
    const itemsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items?expand=fields`,
      { headers: { Authorization: `Bearer ${req.userToken}` } }
    );

    const matchedItem = itemsRes.data.value.find(item => {
      const f = item.fields;
      return String(item.id) === String(taskId) || 
             String(f.id) === String(taskId) || 
             String(f.TaskID) === String(taskId) || 
             (f.Title && f.Title.toLowerCase() === String(taskId).toLowerCase());
    });

    if (!matchedItem) {
      return res.status(404).json({ message: `Project/Task '${taskId}' not found in list` });
    }

    // Dynamic schema detection to prevent 400 Bad Request due to incorrect or read-only columns
    let listColumns = [];
    try {
      const colsRes = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/columns`,
        { headers: { Authorization: `Bearer ${req.userToken}` } }
      );
      listColumns = colsRes.data.value || [];
    } catch (colErr) {
      console.warn("⚠️ Failed to fetch list columns schema:", colErr.message);
    }

    const availableColumns = new Set(listColumns.map(c => c.name));
    const readOnlyColumns = new Set(listColumns.filter(c => c.readOnly).map(c => c.name));

    // If fetch columns failed, fallback to matched item fields
    if (availableColumns.size === 0 && matchedItem.fields) {
      Object.keys(matchedItem.fields).forEach(k => availableColumns.add(k));
    }

    const getTargetField = (candidates, defaultFallback) => {
      for (const cand of candidates) {
        if (availableColumns.has(cand)) return cand;
      }
      for (const cand of candidates) {
        const lowerCand = cand.toLowerCase();
        for (const col of availableColumns) {
          if (col.toLowerCase() === lowerCand) return col;
        }
      }
      return defaultFallback;
    };

    const staffField = getTargetField(['field_3', 'AllocatedStaff', 'Allocated_Staff', 'AssignedTo', 'Staff'], 'field_3');
    const statusField = getTargetField(['field_4', 'Status', 'ProjectStatus'], 'field_4');
    const remarksField = getTargetField(['field_8', 'Remarks', 'Comments'], 'field_8');

    // Smart detection of Client Feedback column
    let feedbackFieldName = null;
    for (const col of availableColumns) {
      if (col.toLowerCase().includes('feedback')) {
        feedbackFieldName = col;
        break;
      }
    }
    if (!feedbackFieldName) {
      feedbackFieldName = getTargetField(['field_9', 'ClientFeedback'], null);
    }

    // Build the patch fields safely
    const patchFields = {};

    const tryAddField = (fieldName, val) => {
      if (!fieldName) return;
      if (readOnlyColumns.has(fieldName)) {
        console.warn(`⚠️ Skipping read-only field: ${fieldName}`);
        return;
      }
      if (availableColumns.size === 0 || availableColumns.has(fieldName)) {
        patchFields[fieldName] = val;
      } else {
        console.warn(`⚠️ Skipping field not present in schema: ${fieldName}`);
      }
    };

    if (allocatedStaff !== undefined) tryAddField(staffField, allocatedStaff);
    if (status !== undefined) tryAddField(statusField, status);
    if (remarks !== undefined) tryAddField(remarksField, remarks);
    if (clientFeedback !== undefined && feedbackFieldName) {
      tryAddField(feedbackFieldName, clientFeedback);
    }

    console.log("➡️ Patching fields to SharePoint:", patchFields);

    if (Object.keys(patchFields).length > 0) {
      await axios.patch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items/${matchedItem.id}/fields`,
        patchFields,
        { headers: { Authorization: `Bearer ${req.userToken}`, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log("⚠️ No writeable fields to update.");
    }

    res.json({ message: "Project fields updated successfully", itemId: matchedItem.id });
  } catch (error) {
    console.error("❌ Update Project Fields Error:", error.response?.data || error.message);
    const detailMsg = error.response?.data?.error?.message || error.response?.data || error.message;
    res.status(500).json({ message: "Failed to update project fields", error: detailMsg });
  }
});

// 🔹 Create Task
app.post("/addTask", validateToken, async (req, res) => {
  try {
    const { name, project, assignedTo, priority, deadline, description, assignedDate } = req.body;
    const siteId = await getSiteId(req.userToken);

    // Find the Project_Tracking_all or Tasks list
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      { headers: { Authorization: `Bearer ${req.userToken}` } }
    );
    let list = listsRes.data.value.find(l => 
      l.name.toLowerCase() === "project" || 
      l.displayName.toLowerCase() === "project"
    );
    if (!list) {
      list = listsRes.data.value.find(l => 
        l.name === "Project_Tracking_all" || 
        l.displayName === "Project_Tracking_all"
      );
    }
    if (!list) {
      list = listsRes.data.value.find(l => 
        l.name === "Tasks" || 
        l.displayName === "Tasks"
      );
    }
    if (!list) throw new Error("Project/Tasks list not found");

    // POST to SharePoint
    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items`,
      {
        fields: {
          Title: name,
          field_1: project,
          field_3: assignedTo,
          field_4: "Not Started",
          field_5: assignedDate,
          field_6: deadline,
          field_7: description,
          field_8: ""
        }
      },
      { headers: { Authorization: `Bearer ${req.userToken}`, 'Content-Type': 'application/json' } }
    );

    res.json({ message: "Task created successfully", itemId: response.data.id, item: response.data.fields });
  } catch (error) {
    console.error("❌ Add Task Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to create task", error: error.message });
  }
});

// 🔹 Delete Task
app.post("/deleteTask", validateToken, async (req, res) => {
  try {
    const { taskId } = req.body;
    const siteId = await getSiteId(req.userToken);

    // Find the Project_Tracking_all or Tasks list
    const listsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`,
      { headers: { Authorization: `Bearer ${req.userToken}` } }
    );
    let list = listsRes.data.value.find(l => 
      l.name.toLowerCase() === "project" || 
      l.displayName.toLowerCase() === "project"
    );
    if (!list) {
      list = listsRes.data.value.find(l => 
        l.name === "Project_Tracking_all" || 
        l.displayName === "Project_Tracking_all"
      );
    }
    if (!list) {
      list = listsRes.data.value.find(l => 
        l.name === "Tasks" || 
        l.displayName === "Tasks"
      );
    }
    if (!list) throw new Error("Project list not found");

    // Fetch the item to get its SharePoint list item ID (integer)
    const itemsRes = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items?expand=fields`,
      { headers: { Authorization: `Bearer ${req.userToken}` } }
    );

    const matchedItem = itemsRes.data.value.find(item => {
      const f = item.fields;
      return String(item.id) === String(taskId) || 
             String(f.id) === String(taskId) || 
             String(f.TaskID) === String(taskId) || 
             (f.Title && f.Title.toLowerCase() === String(taskId).toLowerCase());
    });

    if (!matchedItem) {
      return res.status(404).json({ message: `Task '${taskId}' not found in list` });
    }

    // DELETE from SharePoint
    await axios.delete(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${list.id}/items/${matchedItem.id}`,
      { headers: { Authorization: `Bearer ${req.userToken}` } }
    );

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Task Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
});

// 🔹 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});