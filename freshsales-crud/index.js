const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const axios = require("axios");

require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, // Use default port if not provided
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("MySQL connected...");
});

// Start the server
app.listen(process.env.PORT || 3000, () => { // Use default port if not provided
  console.log(`Server started on port ${process.env.PORT || 3000}`);
});

//Create a Contact
app.post("/createContact", async (req, res) => {
  const { first_name, last_name, email, mobile_number, data_store } = req.body;

  if (data_store === "CRM") {
    const options = {
      method: "POST",
      url: "https://apsisaerocompvtltd-org.myfreshworks.com/crm/sales/api/contacts",
      headers: {
        Authorization: "Token token=ezjX0qG-FFAP2Pmhe453XA",
        "Content-Type": "application/json",
      },
      data: {
        contact: { first_name, last_name, email, mobile_number },
      },
    };

    try {
      const response = await axios(options);
      res.status(201).json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to create contact in CRM" });
    }
  } else if (data_store === "DATABASE") {
    let sql =
      "INSERT INTO contacts (first_name, last_name, email, mobile_number) VALUES (?, ?, ?, ?)";
    let query = db.query(
      sql,
      [first_name, last_name, email, mobile_number],
      (err, result) => {
        if (err) throw err;
        res.status(201).json({
          id: result.insertId,
          first_name,
          last_name,
          email,
          mobile_number,
        });
      }
    );
  }
});

//Retrieve a Contact
app.post("/getContact", (req, res) => {
  const { contact_id, data_store } = req.body;

  if (data_store === "CRM") {
    const options = {
      method: "GET",
      url: `https://apsisaerocompvtltd-org.myfreshworks.com/crm/sales/api/contacts/${contact_id}`,
      headers: {
        Authorization: "Token token=ezjX0qG-FFAP2Pmhe453XA",
        "Content-Type": "application/json",
      },
    };

    axios(options)
      .then((response) => res.status(200).json(response.data))
      .catch((error) =>
        res.status(500).json({ error: "Failed to retrieve contact from CRM" })
      );
  } else if (data_store === "DATABASE") {
    let sql = "SELECT * FROM contacts WHERE id = ?";
    db.query(sql, [contact_id], (err, result) => {
      if (err) throw err;
      if (result.length === 0) {
        res.status(404).json({ error: "Contact not found" });
      } else {
        res.status(200).json(result[0]);
      }
    });
  }
});

// Update a Contact
app.post("/updateContact", (req, res) => {
  const { contact_id, new_email, new_mobile_number, data_store } = req.body;

  if (data_store === "CRM") {
    const options = {
      method: "PUT",
      url: `https://apsisaerocompvtltd-org.myfreshworks.com/crm/sales/api/contacts/${contact_id}`,
      headers: {
        Authorization: "Token token=ezjX0qG-FFAP2Pmhe453XA",
        "Content-Type": "application/json",
      },
      data: {
        contact: { email: new_email, mobile_number: new_mobile_number },
      },
    };

    axios(options)
      .then((response) => res.status(200).json(response.data))
      .catch((error) =>
        res.status(500).json({ error: "Failed to update contact in CRM" })
      );
  } else if (data_store === "DATABASE") {
    let sql = "UPDATE contacts SET email = ?, mobile_number = ? WHERE id = ?";
    db.query(sql, [new_email, new_mobile_number, contact_id], (err, result) => {
      if (err) throw err;
      res.status(200).json({ message: "Contact updated" });
    });
  }
});

//Delete a Contact
app.post("/deleteContact", (req, res) => {
  const { contact_id, data_store } = req.body;

  if (data_store === "CRM") {
    const options = {
      method: "DELETE",
      url: `https://apsisaerocompvtltd-org.myfreshworks.com/crm/sales/api/contacts/${contact_id}`,
      headers: {
        Authorization: "Token token=ezjX0qG-FFAP2Pmhe453XA",
        "Content-Type": "application/json",
      },
    };

    axios(options)
      .then(() => res.status(200).json({ message: "Contact deleted" }))
      .catch((error) =>
        res.status(500).json({ error: "Failed to delete contact from CRM" })
      );
  } else if (data_store === "DATABASE") {
    let sql = "DELETE FROM contacts WHERE id = ?";
    db.query(sql, [contact_id], (err, result) => {
      if (err) throw err;
      res.status(200).json({ message: "Contact deleted" });
    });
  }
});
