const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());
const storage = multer.memoryStorage();
const upload = multer( {storage:storage} );


let connections = [];

app.post("/middleware", (req, res) => {
  let instance = req.body
  connections.push({instance:`${instance.ipAddress}:${instance.port}`, requests: 0, tried:false });
  res.status(200).end();
  console.log("Instancias actualizadas: ", connections);
});

let currentServerIndex = 0;

app.post("/request", upload.single('image'), async (req, res) => {
console.log("/request - middleware");
  if (!req.file) {
    return res.status(400).send('400: No se ha subido ningún archivo.');
  }

  if (connections.length === 0) {
    console.log("No hay servidores disponibles")
    return res.status(503).json({ error: "503: No hay servidores disponibles" });

  }

  let initialServerIndex = currentServerIndex;
  
  while (true) {
    let leastConnectedServer = connections[currentServerIndex];

    try {
      const formData = new FormData();
      formData.append('image', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
          knownLength: req.file.size
      });

      console.log(`Llamando a servidor: ${leastConnectedServer.instance}/upload`);
      const response = await axios.post(`http://${leastConnectedServer.instance}/upload`, formData, {
        headers: {
          ...formData.getHeaders()
        },
        responseType: "arraybuffer"
      });
      
      currentServerIndex = (currentServerIndex + 1) % connections.length;

      res.set('Content-Type', response.headers['content-type']);
      res.send(response.data);
      break;

    } catch (error) {
      console.log(`Error. ${leastConnectedServer.instance}: ${error.message}. ${new Date()}`);
      leastConnectedServer.requests++;

      currentServerIndex = (currentServerIndex + 1) % connections.length;

      const availableConnections = connections.filter(conn => !conn.tried);

      if (availableConnections.length === 0 || currentServerIndex === initialServerIndex) {
        connections.forEach(conn => conn.tried = false);
        return res.status(503).json({ error: "No hay servidores disponibles" });
      }
    }
  }

  connections.forEach(conn => conn.tried = false);
});




app.listen(port, () => {
  console.log(`Middleware corriendo en el puerto: ${port}`);
});
