const express = require('express');
const axios = require('axios');

const app = express();
const port = 9000;

const ipAddress="http://192.168.1.9";

app.use(express.json());

const instances = [];

app.post("/discoveryServer", async (req, res) => {
    console.log("Nuevo servidor:", req.body);
    const instance = req.body;
    
    if(!instances.some(instancesOb => instancesOb.ipAddress === instance.ipAddress && instancesOb.port === instance.port)){
        try {
            await axios.post(`${ipAddress}:7000/monitor`, instance);
            instances.push(instance)
            res.status(200).end();
            console.log("Instancia enviada al monitor", instance);
        } catch (error) {
            console.error("Error al enviar instancia al monitor:", error);
        }
    }else{
        console.log("IP:PORT ya esta en uso");
        res.status(200).end();
    }
    console.log(instances)
});

app.listen(port, () => {
    console.log(`Discovery Server corriendo en el puerto: ${port}`);
});
