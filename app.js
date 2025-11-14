// --- Configuración de HiveMQ Cloud (TUS DATOS) ---
const brokerHost = 'f947446ef593459bbe64f460dd92cf88.s1.eu.hivemq.cloud';
const brokerPort = 8884;
const options = {
    username: 'Tecnologias2',
    password: 'Tecnologias2',
    protocol: 'wss'
};
const brokerUrl = `wss://${brokerHost}:${brokerPort}/mqtt`;

// --- Tópicos ---
const topicoHumedad = 'invernadero/humedad';
// (A futuro, añadirás más tópicos aquí)
// const topicoTemp1 = 'invernadero/temperatura/1';
// const topicoBomba = 'invernadero/actuadores/bomba';

// --- Elementos del HTML ---
const estadoSpan = document.getElementById('estado-mqtt');

// --- Variables de Google Charts ---
let humidityChart;
let humidityData;
const gaugeOptions = {
    width: 250, height: 180,
    redFrom: 90, redTo: 100,
    yellowFrom:75, yellowTo: 90,
    minorTicks: 5,
    min: 0, max: 100,
    animation: { duration: 400, easing: 'inAndOut' }
};

// --- PASO 1: Cargar la librería de Google Charts ---
google.charts.load('current', {'packages':['gauge']});
google.charts.setOnLoadCallback(drawCharts); // Llama a drawCharts cuando esté lista

// --- PASO 2: Función para dibujar los gráficos iniciales ---
function drawCharts() {
    // --- Gráfico de Humedad ---
    humidityData = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Humedad', 0] // Valor inicial
    ]);
    humidityChart = new google.visualization.Gauge(document.getElementById('humedad_chart'));
    gaugeOptions.greenFrom = 30; // Definir rangos de color
    gaugeOptions.greenTo = 75;
    humidityChart.draw(humidityData, gaugeOptions);

    // (A futuro, dibujarías los otros gráficos aquí)
}

// --- PASO 3: Conexión MQTT (esto se ejecuta en paralelo) ---
console.log(`Intentando conectar a: ${brokerUrl}`);
const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
    console.log('¡Conectado a HiveMQ Cloud!');
    estadoSpan.textContent = "Conectado";
    estadoSpan.style.color = "green";
    
    // Nos suscribimos al tópico de humedad
    client.subscribe(topicoHumedad, (err) => {
        if (!err) {
            console.log(`Suscrito a: ${topicoHumedad}`);
        }
    });
    // (A futuro, te suscribes a todos tus tópicos aquí)
});

// --- PASO 4: Manejador de mensajes ---
client.on('message', (topic, message) => {
    const msg = message.toString();
    console.log(`Mensaje recibido en ${topic}: ${msg}`);
    
    // Comprobar si el gráfico de humedad ya está listo
    if (topic === topicoHumedad && humidityChart) {
        const value = parseInt(msg); // Convertir mensaje a número
        
        // Actualizar el valor en la tabla de datos
        humidityData.setValue(0, 1, value);
        
        // Volver a dibujar el gráfico con el nuevo valor
        humidityChart.draw(humidityData, gaugeOptions);
    }
    
    // (A futuro, manejarías los otros tópicos aquí)
    // else if (topic === topicoBomba) { ... }
});

// --- Manejadores de error y cierre ---
client.on('error', (err) => {
    console.error('Error de conexión: ', err);
    estadoSpan.textContent = "Error de conexión";
    estadoSpan.style.color = "red";
    client.end();
});

client.on('close', () => {
    console.log('Desconectado');
    estadoSpan.textContent = "Desconectado";
    estadoSpan.style.color = "red";
});
