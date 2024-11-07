const express = require('express');
const cors = require('cors'); // <-- Importa CORS
const { off } = require('process');
const app = express();


const containerPort = process.env.CONTAINER_PORT || 3000;
const hostPort = process.env.HOST_PORT || 3000;
const ipAddress = process.env.IP_ADDRESS || "localhost"; 
const containerName = process.env.CONTAINER_NAME;
let logicalClock = new Date();
const interval = 1000 + process.env.INTERVAL || 1500;
const disServerip= process.env.DIS_SERVERIP_PORT || "192.168.1.11:9000"
let event = 0
let localOffset = 0

app.use(cors());
app.use(express.json());

let logsArray = []; 

function createLog(req, res) {
  event += 1
  let log = "";
  if(!req){
      console.log(res.config)
      log = `event:${event}"${res.config.url}" "${JSON.stringify(res.data)}" `; 
  }else{
      log = `event:${event} "${req.method} ${req.originalUrl} HTTP/${req.httpVersion}" ${res.statusCode} ${res.get('Content-Length') || 0} "${req.ip}" "${req.get('User-Agent')}" "${req.body} ${req.query}"`;
  }
  console.log(log)
  logsArray.push(log);
}

function displayClock() {
    console.log(logicalClock.toTimeString().split(" ")[0]);
}

// Function to increment the clock by the interval
function updateClock() {
    logicalClock = new Date(logicalClock.getTime() + 1000);
    displayClock();
}

// Start the clock with the system time and then update at intervals
displayClock(); // Display the initial time
setInterval(updateClock, interval);


app.get("/healthCheck", (req, res) => {
  res.status(200).json(logsArray);
});

app.get("/clientHour", (req, res) => {
  res.status(200).json( {time: logicalClock.toTimeString().split(" ")[0]} );
});


app.get("/clientOffset", (req, res) => {
  createLog(req,res)
  const coordinatorTime = new Date(req.query.coordinatorTime)
  console.log(coordinatorTime)
  localOffset = logicalClock.getTime() - coordinatorTime.getTime() 
  console.log(localOffset)
  res.status(200).json({offset: localOffset})
});

app.post('/syncClock', (req, res) => {
  createLog(req,res)
  const { offset } = req.body;
  logicalClock = new Date(logicalClock.getTime() + localOffset*-1 + offset);
  res.send('Time adjusted');
});


const startServer = async () => {
  try {
    console.log('IP del host:', ipAddress);
    console.log('ID del contenedor:', containerName);
    console.log('HostPort:', hostPort);
    console.log("ipDIS:", disServerip);
    console.log(`Servidor corriendo en el puerto: ${containerPort}`);

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ipAddress: ipAddress, port: hostPort , id: containerName }),
    };

   const response = await fetch(`http://${disServerip}/discoveryserver`, requestOptions)
  } catch (error) {
    console.error('Error al obtener la IP:', error);
  }
};

app.listen(containerPort, startServer);

