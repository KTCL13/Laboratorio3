const express = require('express');
const cors = require('cors'); // <-- Importa CORS
const morgan = require('morgan');
const app = express();


const containerPort = process.env.CONTAINER_PORT || 3000;
const hostPort = process.env.HOST_PORT;
const ipAddress = process.env.IP_ADDRESS; 
const containerName = process.env.CONTAINER_NAME;
let logicalClock = new Date();
const interval = 1000 + process.env.INTERVAL || 1500;

let event = 0


app.use(cors());

let logsArray = []; 

morgan.token('event', (req, res, tz) => {
  event = event + 1;
  return event;
});

const morganLogs = morgan('event:[:event] ":method :url HTTP/:http-version" :status :res[content-length] ":remote-addr ":user-agent"', {
  stream: {
    write: (log) => {
      console.log(log)
      logsArray.push(log); 
    }
  }
});


app.use(morganLogs);

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
  res.status(200).json( {hour: logicalClock.toTimeString().split(" ")[0]} );
});

const startServer = async () => {
  try {
    console.log('IP del host:', ipAddress);
    console.log('ID del contenedor:', containerName);
    console.log('HostPort:', hostPort);
    console.log("ipDIS:", process.env.DIS_SERVERIP_PORT);
    console.log(`Servidor corriendo en el puerto: ${containerPort}`);

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ipAddress: ipAddress, port: hostPort , id: containerName }),
    };

    await fetch(`http://${process.env.DIS_SERVERIP_PORT}/discoveryserver`, requestOptions)
      .then((response) => {
        console.log(response.status);
      });
  } catch (error) {
    console.error('Error al obtener la IP:', error);
  }
};

app.listen(containerPort, startServer);

