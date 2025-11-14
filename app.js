// --- Configuración de HiveMQ Cloud ---
const brokerHost = 'f947446ef593459bbe64f460dd92cf88.s1.eu.hivemq.cloud';
const brokerPort = 8884; // Puerto WebSocket (WSS)
const topicoHumedad = 'invernadero/humedad'; // El tópico que lee tu Arduino

// --- Credenciales ---
const options = {
    username: 'Tecnologias2',
    password: 'Tecnologias2',
    protocol: 'wss' // Protocolo WebSocket Seguro
};

// URL de conexión (incluye /mqtt al final para HiveMQ)
const brokerUrl = `wss://${brokerHost}:${brokerPort}/mqtt`;

// --- Elementos del HTML ---
const estadoSpan = document.getElementById('estado');
const humedadP = document.getElementById('datoHumedad');

// --- Conexión MQTT ---
console.log(`Intentando conectar a: ${brokerUrl}`);
const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
    console.log('¡Conectado a HiveMQ Cloud!');
    estadoSpan.textContent = "Conectado";
    estadoSpan.style.color = "green";
    
    // Nos suscribimos al tópico
    client.subscribe(topicoHumedad, (err) => {
        if (!err) {
            console.log(`Suscrito a: ${topicoHumedad}`);
        } else {
            console.error('Error de suscripción: ', err);
        }
    });
});

client.on('message', (topic, message) => {
    const mensajeTexto = message.toString();
    console.log(`Mensaje recibido en ${topic}: ${mensajeTexto}`);
    
    // Actualizamos el dashboard
    if (topic === topicoHumedad) {
        humedadP.textContent = `${mensajeTexto} %`;
    }
});

client.on('error', (err) => {
    console.error('Error de conexión: ', err);
    estadoSpan.textContent = "Error de conexión";
    estadoSpan.style.color = "red";
    client.end();
});

client.on('close', () => {
    console.log('Desconectado');
    if (estadoSpan.textContent !== "Error de conexión") {
        estadoSpan.textContent = "Desconectado";
        estadoSpan.style.color = "red";
    }
});
