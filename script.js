// script.js
// ==================== GDS TRAINING SIMULATOR ====================

// ====================== DATABASE ======================
const airports = {
    "DAC": "Dhaka, Bangladesh",
    "BKK": "Bangkok, Thailand",
    "DEL": "Delhi, India",
    "DXB": "Dubai, UAE",
    "LHR": "London, UK",
    "JFK": "New York, USA",
    "SIN": "Singapore",
    "KUL": "Kuala Lumpur, Malaysia",
    "CGK": "Jakarta, Indonesia",
    "HKG": "Hong Kong",
    "ICN": "Seoul, South Korea",
    "NRT": "Tokyo, Japan",
    "SYD": "Sydney, Australia",
    "MCT": "Muscat, Oman",
    "RUH": "Riyadh, Saudi Arabia"
};

const airlines = {
    "BG": "Biman Bangladesh Airlines",
    "QR": "Qatar Airways",
    "EK": "Emirates",
    "SQ": "Singapore Airlines",
    "AI": "Air India",
    "MH": "Malaysia Airlines",
    "TG": "Thai Airways",
    "JL": "Japan Airlines"
};

const sampleFlights = [
    { id: 1, airline: "BG", flightNo: "147", from: "DAC", to: "BKK", dep: "23:45", arr: "05:30", duration: "4h45m", price: 285 },
    { id: 2, airline: "QR", flightNo: "638", from: "DAC", to: "BKK", dep: "08:15", arr: "14:05", duration: "4h50m", price: 320 },
    { id: 3, airline: "TG", flightNo: "321", from: "DAC", to: "BKK", dep: "10:30", arr: "16:20", duration: "4h50m", price: 310 },
    { id: 4, airline: "BG", flightNo: "148", from: "BKK", to: "DAC", dep: "07:00", arr: "09:10", duration: "3h10m", price: 260 },
];

// ====================== STATE ======================
let currentPNR = {
    locator: "",
    passengers: [],
    segments: [],
    contact: "",
    tkTime: "",
    ticketNumber: "",
    status: "OPEN",
    fare: 0
};

let sessionHistory = [];

// ====================== UTILITIES ======================
function generatePNR() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let pnr = "";
    for (let i = 0; i < 6; i++) {
        pnr += letters[Math.floor(Math.random() * 26)];
    }
    return pnr;
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
}

function updateClock() {
    document.getElementById('current-time').textContent = getCurrentTime();
}

// ====================== LOCALSTORAGE ======================
function saveToLocalStorage() {
    localStorage.setItem('gds_pnr', JSON.stringify(currentPNR));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('gds_pnr');
    if (saved) {
        currentPNR = JSON.parse(saved);
        if (!currentPNR.locator) currentPNR.locator = generatePNR();
    } else {
        currentPNR.locator = generatePNR();
    }
}

// ====================== TERMINAL RENDERING ======================
const output = document.getElementById('output');
const inputField = document.getElementById('command-input');

function printLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `output-line ${className}`;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function clearTerminal() {
    output.innerHTML = '';
}

// ====================== COMMAND PARSER ======================
function parseCommand(cmd) {
    cmd = cmd.trim().toUpperCase();
    if (!cmd) return;

    printLine(`> ${cmd}`, 'info');

    const parts = cmd.split(' ');
    const command = parts[0];

    switch (command) {
        case 'AN':
            handleAN(cmd);
            break;
        case 'NM':
            handleNM(cmd);
            break;
        case 'AP':
            handleAP(cmd);
            break;
        case 'TK':
            handleTK(cmd);
            break;
        case 'SS':
            handleSS(cmd);
            break;
        case 'XE':
            handleXE(cmd);
            break;
        case 'RT':
            handleRT(cmd);
            break;
        case 'RF':
            handleRF(cmd);
            break;
        case 'TTP':
            handleTTP();
            break;
        case 'IG':
            handleIG();
            break;
        case 'IR':
            handleIR();
            break;
        case 'FQ':
        case 'FXD':
        case 'FXB':
        case 'FXX':
        case 'FXR':
            handleFareCommand(cmd);
            break;
        default:
            if (cmd.startsWith('SSR') || cmd.startsWith('OSI') || cmd.startsWith('RM') || cmd.startsWith('NIP')) {
                printLine('COMMAND PROCESSED (SIMULATED)', 'success');
            } else {
                printLine('NOT RECOGNIZED OR INVALID FORMAT', 'error');
            }
    }
}

// ====================== COMMAND HANDLERS ======================
function handleAN(cmd) {
    printLine('*** AVAILABILITY DISPLAY ***', 'success');
    
    let date = "15JUN";
    let from = "DAC";
    let to = "BKK";
    
    const match = cmd.match(/AN(\d{2}[A-Z]{3})([A-Z]{3})([A-Z]{3})/);
    if (match) {
        date = match[1];
        from = match[2];
        to = match[3];
    }
    
    printLine(`FROM ${from} TO ${to} ON ${date}`, 'info');
    
    sampleFlights.forEach((flight, i) => {
        if (flight.from === from && flight.to === to) {
            printLine(`${i+1} ${flight.airline}${flight.flightNo} ${flight.dep}-${flight.arr} ${flight.duration} ${flight.price}USD Y`, 'flight-line');
        }
    });
    
    printLine('*** END OF AVAILABILITY ***');
}

function handleNM(cmd) {
    const match = cmd.match(/NM(\d+)(.+)/);
    if (match) {
        const count = parseInt(match[1]);
        let name = match[2].trim();
        currentPNR.passengers.push({ name: name, type: "ADT" });
        printLine(`PASSENGER ADDED: ${name}`, 'success');
        saveToLocalStorage();
    } else {
        printLine('INVALID NAME FORMAT', 'error');
    }
}

function handleAP(cmd) {
    currentPNR.contact = cmd.substring(2);
    printLine('CONTACT INFORMATION STORED', 'success');
    saveToLocalStorage();
}

function handleTK(cmd) {
    currentPNR.tkTime = cmd.substring(2);
    printLine(`TICKETING TIME LIMIT SET: ${currentPNR.tkTime}`, 'success');
    saveToLocalStorage();
}

function handleSS(cmd) {
    const match = cmd.match(/SS(\d)([A-Z])(\d)/);
    if (match) {
        const qty = parseInt(match[1]);
        const cabin = match[2];
        
        if (sampleFlights.length > 0) {
            const flight = sampleFlights[0];
            currentPNR.segments.push({
                airline: flight.airline,
                flightNo: flight.flightNo,
                from: flight.from,
                to: flight.to,
                dep: flight.dep,
                arr: flight.arr,
                cabin: cabin,
                status: "HK"
            });
            printLine(`SEGMENT SOLD: ${flight.airline}${flight.flightNo} ${flight.from}-${flight.to}`, 'success');
            saveToLocalStorage();
        }
    }
}

function handleXE(cmd) {
    const num = parseInt(cmd.substring(2));
    if (num > 0 && num <= currentPNR.segments.length) {
        currentPNR.segments.splice(num-1, 1);
        printLine(`SEGMENT ${num} DELETED`, 'success');
        saveToLocalStorage();
    } else {
        printLine('INVALID SEGMENT NUMBER', 'error');
    }
}

function handleRT(cmd) {
    printLine(`*** PNR DISPLAY - ${currentPNR.locator} ***`, 'success');
    printLine(`PASSENGERS:`, 'info');
    currentPNR.passengers.forEach((p, i) => {
        printLine(`  ${i+1}. ${p.name}`);
    });
    
    printLine(`ITINERARY:`, 'info');
    currentPNR.segments.forEach((seg, i) => {
        printLine(`  ${i+1}. ${seg.airline}${seg.flightNo} ${seg.from}-${seg.to} ${seg.dep}-${seg.arr}`);
    });
    
    printLine(`CONTACT: ${currentPNR.contact || 'NOT SET'}`);
    printLine(`STATUS: ${currentPNR.status}`);
}

function handleRF(cmd) {
    printLine(`RECEIVED FROM: ${cmd.substring(3)}`, 'success');
}

function handleTTP() {
    if (currentPNR.segments.length === 0 || currentPNR.passengers.length === 0) {
        printLine('CANNOT TICKET - INCOMPLETE PNR', 'error');
        return;
    }
    
    currentPNR.ticketNumber = "125-" + Math.floor(10000000 + Math.random() * 90000000);
    currentPNR.status = "TICKETED";
    currentPNR.fare = currentPNR.segments.length * 320;
    
    printLine('*** TICKET ISSUED SUCCESSFULLY ***', 'success');
    printLine(`TICKET NUMBER: ${currentPNR.ticketNumber}`);
    printLine(`TOTAL FARE: USD ${currentPNR.fare}`);
    saveToLocalStorage();
}

function handleIG() {
    printLine('IGNORING CHANGES - RETURNING TO LAST SAVED STATE', 'info');
    loadFromLocalStorage();
    printLine('SESSION RESET TO SAVED PNR', 'success');
}

function handleIR() {
    printLine('RETRIEVING LAST SAVED PNR...', 'info');
    loadFromLocalStorage();
    printLine(`PNR ${currentPNR.locator} RETRIEVED`, 'success');
}

function handleFareCommand(cmd) {
    printLine('*** FARE QUOTE DISPLAY ***', 'success');
    printLine('BASE FARE: 285.00 USD', 'info');
    printLine('TAXES: 45.50 USD', 'info');
    printLine('TOTAL: 330.50 USD', 'success');
}

// ====================== PDF GENERATOR ======================
function printTicketPDF() {
    if (!currentPNR.ticketNumber) {
        alert("No ticket issued yet. Use TTP command first.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("courier");
    doc.setFontSize(16);
    doc.text("ELECTRONIC TICKET - IATA", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`PNR: ${currentPNR.locator}`, 20, 40);
    doc.text(`TICKET: ${currentPNR.ticketNumber}`, 20, 50);
    
    doc.text("PASSENGER:", 20, 70);
    currentPNR.passengers.forEach((p, i) => {
        doc.text(`${i+1}. ${p.name}`, 20, 80 + i*10);
    });
    
    doc.text("ITINERARY:", 20, 110);
    currentPNR.segments.forEach((seg, i) => {
        doc.text(`${seg.airline}${seg.flightNo}  ${seg.from} - ${seg.to}  ${seg.dep}`, 20, 120 + i*10);
    });
    
    doc.text(`TOTAL FARE: USD ${currentPNR.fare}`, 20, 170);
    doc.text(`ISSUE DATE: ${new Date().toLocaleDateString()}`, 20, 180);
    
    doc.setFontSize(10);
    doc.text("This is a simulated training ticket.", 105, 270, { align: "center" });
    
    doc.save(`TICKET_${currentPNR.locator}.pdf`);
}

// ====================== INITIALIZATION ======================
function initTerminal() {
    clearTerminal();
    printLine("========================================", 'success');
    printLine("     AMADEUS GDS TRAINING SIMULATOR", 'success');
    printLine("     CLIENT-SIDE • FULLY FUNCTIONAL", 'success');
    printLine("========================================", 'success');
    printLine("");
    printLine("Type commands like: AN15JUNDACBKK, NM1RAHIM/MR, SS1Y1, TTP", 'info');
    printLine("Available: AN, NM, AP, TK, SS, XE, RT, RF, TTP, IG, IR", 'info');
    printLine("");
    
    loadFromLocalStorage();
    printLine(`ACTIVE PNR: ${currentPNR.locator}`, 'success');
    
    setTimeout(() => {
        printLine("Session ready. Enter commands below.", 'info');
    }, 300);
}

function setupInput() {
    inputField.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const command = this.value.trim();
            if (command) {
                parseCommand(command);
                sessionHistory.push(command);
            }
            this.value = '';
        }
    });
}

document.addEventListener('click', () => {
    inputField.focus();
});

function startSimulator() {
    updateClock();
    setInterval(updateClock, 1000);
    
    initTerminal();
    setupInput();
    
    setTimeout(() => {
        inputField.focus();
    }, 500);
    
    if (currentPNR.passengers.length === 0) {
        currentPNR.passengers.push({ name: "RAHIM/MR", type: "ADT" });
        currentPNR.segments.push({
            airline: "BG",
            flightNo: "147",
            from: "DAC",
            to: "BKK",
            dep: "23:45",
            arr: "05:30",
            cabin: "Y"
        });
    }
}

window.onload = startSimulator;