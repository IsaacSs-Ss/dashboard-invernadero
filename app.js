// --- Configuración de HiveMQ Cloud (TUS DATOS) ---
const brokerHost = 'f947446ef593459bbe64f460dd92cf88.s1.eu.hivemq.cloud';
const brokerPort = 8884;
const options = {
    username: 'Tecnologias2',
    password: 'Tecnologias2',
    protocol: 'wss'
};
const brokerUrl = `wss://${brokerHost}:${brokerPort}/mqtt`;

// --- Tópicos de ESTADO (El Arduino publica aquí) ---
const topicos_estado = [
    "invernadero/humedad",
    "invernadero/temperatura/1",
    "invernadero/temperatura/2",
    "invernadero/actuadores/bomba",
    "invernadero/actuadores/servo/1",
    "invernadero/actuadores/servo/2",
    "invernadero/actuadores/rele/1",
    "invernadero/actuadores/rele/2"
];

// --- Tópicos de COMANDO (La Web publica aquí) ---
const t_bomba_cmd = "invernadero/actuadores/bomba/comando";
// (Aquí añadirías los otros tópicos de comando)

// --- Elementos del HTML ---
const estadoSpan = document.getElementById('estado-mqtt');
// Botones de control
const btnBombaOn = document.getElementById('bombaOn');
const btnBombaOff = document.getElementById('bombaOff');

// --- Variables de Google Charts ---
let humidityChart, temp1Chart, temp2Chart;
let humidityData, temp1Data, temp2Data;
const gaugeOptions = { width: 250, height: 180, redFrom: 90, redTo: 100, yellowFrom:75, yellowTo: 90, minorTicks: 5, min: 0, max: 100, animation: { duration: 400, easing: 'inAndOut' } };

// --- PASO 1: Cargar la librería de Google Charts ---
google.charts.load('current', {'packages':['gauge']});
google.charts.setOnLoadCallback(drawCharts);

// --- PASO 2: Función para dibujar los gráficos iniciales ---
function drawCharts() {
    humidityData = google.visualization.arrayToDataTable([['Label', 'Value'], ['Humedad', 0]]);
    humidityChart = new google.visualization.Gauge(document.getElementById('humedad_chart'));
    let humOptions = { ...gaugeOptions, min: 0, max: 100, greenFrom: 30, greenTo: 75 };
    humidityChart.draw(humidityData, humOptions);

    temp1Data = google.visualization.arrayToDataTable([['Label', 'Value'], ['Temp 1', 0]]);
    temp1Chart = new google.visualization.Gauge(document.getElementById('temp1_chart'));
    let tempOptions = { ...gaugeOptions, min: 0, max: 50, greenFrom: 15, greenTo: 30, yellowFrom: 30, yellowTo: 40, redFrom: 40, redTo: 50 };
    temp1Chart.draw(temp1Data, tempOptions);

    temp2Data = google.visualization.arrayToDataTable([['Label', 'Value'], ['Temp 2', 0]]);
    temp2Chart = new google.visualization.Gauge(document.getElementById('temp2_chart'));
    temp2Chart.draw(temp2Data, tempOptions);
}

// --- Helper para actualizar estados ON/OFF ---
function updateStatusIndicator(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message.toUpperCase();
        el.className = "status-indicator"; // Resetea clases
        if (message.toUpperCase().includes("ON") || (message.toUpperCase().includes("0") && elementId.includes("servo"))) {
            el.classList.add("status-on");
        } else if (message.toUpperCase().includes("OFF") || (message.toUpperCase().includes("90") && elementId.includes("servo"))) {
             el.classList.add("status-off");
        } else {
             el.classList.add("status-unknown");
        }
    }
}

// --- PASO 3: Conexión MQTT ---
console.log(`Intentando conectar a: ${brokerUrl}`);
const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
    console.log('¡Conectado a HiveMQ Cloud!');
    estadoSpan.textContent = "Conectado";
    estadoSpan.style.color = "#5cb85c";
    
    // Nos suscribimos a TODOS los tópicos de ESTADO
    client.subscribe(topicos_estado, (err) => {
        if (!err) {
            console.log(`Suscrito a ${topicos_estado.length} tópicos de estado.`);
        } else {
            console.error('Error de suscripción: ', err);
        }
    });

    // --- NUEVO: Asignar listeners a los botones ---
    btnBombaOn.addEventListener('click', () => {
        console.log('Publicando comando: ON');
        client.publish(t_bomba_cmd, 'ON');
    });

    btnBombaOff.addEventListener('click', () => {
        console.log('Publicando comando: OFF');
        client.publish(t_bomba_cmd, 'OFF');
    });
});

// --- PASO 4: Manejador de mensajes (RECIBIR ESTADOS) ---
client.on('message', (topic, message) => {
    const msg = message.toString();
    console.log(`Mensaje de estado recibido en ${topic}: ${msg}`);
    const value = parseInt(msg);

    switch (topic) {
        case "invernadero/humedad":
            if (humidityChart) { humidityData.setValue(0, 1, value); humidityChart.draw(humidityData, { ...gaugeOptions, min: 0, max: 100, greenFrom: 30, greenTo: 75 }); }
            break;
        case "invernadero/temperatura/1":
            if (temp1Chart) { temp1Data.setValue(0, 1, value); temp1Chart.draw(temp1Data, { ...gaugeOptions, min: 0, max: 50, greenFrom: 15, greenTo: 30, yellowFrom: 30, yellowTo: 40, redFrom: 40, redTo: 50 }); }
            break;
        case "invernadero/temperatura/2":
            if (temp2Chart) { temp2Data.setValue(0, 1, value); temp2Chart.draw(temp2Data, { ...gaugeOptions, min: 0, max: 50, greenFrom: 15, greenTo: 30, yellowFrom: 30, yellowTo: 40, redFrom: 40, redTo: 50 }); }
            break;
        case "invernadero/actuadores/bomba":
            updateStatusIndicator("bomba_status", msg);
            break;
        case "invernadero/actuadores/servo/1":
            updateStatusIndicator("servo1_status", msg + "°");
            break;
        case "invernadero/actuadores/servo/2":
            updateStatusIndicator("servo2_status", msg + "°");
            break;
        case "invernadero/actuadores/rele/1":
            updateStatusIndicator("rele1_status", msg);
            break;
        case "invernadero/actuadores/rele/2":
            updateStatusIndicator("rele2_status", msg);
            break;
    }
});

// --- Manejadores de error y cierre ---
client.on('error', (err) => {
    console.error('Error de conexión: ', err);
    estadoSpan.textContent = "Error de conexión";
    estadoSpan.style.color = "#d9534f";
    client.end();
});

client.on('close', () => {
    console.log('Desconectado');
    estadoSpan.textContent = "Desconectado";
    estadoSpan.style.color = "#f0ad4e";
});
