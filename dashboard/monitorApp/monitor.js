const { createApp } = Vue;

//const ipSocket = "http://localhost:3000"
const ipSocket = "http://192.168.137.53:7000";

createApp({
  data() {
    return {
      servers: [],
    };
  },
  mounted() {
    const socket = io(ipSocket);

    // Recibir datos de WebSocket en tiempo real
    socket.on("update", (data) => {
      if (JSON.stringify(this.servers) !== JSON.stringify(data.servers)) {
        this.servers = data.servers;
        console.log("Datos actualizados:", this.servers);
      }
    });
  },
  methods: {
    async runDockerCommand() {
      console.log(`Llamando /run-docker`)
      const response = await fetch(`${ipSocket}/run-docker`, { method: "POST" });
      const result = await response.text();
      console.log(`/run-docker -> ${result}`);
    },
    async stopRandomCont() {
      console.log(`Llamando /stop-random-container`)
      const response = await fetch(`${ipSocket}/stop-random-container`, { method: "GET" });
      const result = await response.text();
      console.log(`/stop-random-container -> ${result}`);
    },
    async asyncOperation() {
      try {
        console.log(`Llamando /sync`)
        const response = await fetch(`${ipSocket}/sync`, { method: "GET" });
        const result = await response.text();
        console.log(`/sync -> ${result}`);
      } catch (error) {
        console.error("Error en asyncOperation:", error);
      }
    }
  },
}).mount("#app");
