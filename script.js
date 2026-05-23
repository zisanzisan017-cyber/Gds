// =============================================
// AMADEUS GDS TRAINING SIMULATOR
// Full Client-Side - Vanilla JS
// =============================================

const output = document.getElementById('output');
const input = document.getElementById('command-input');

let activePNR = null;
let lastAvailability = null;
let sessionState = {};

// Database
const airports = {
    "DAC": "Dhaka", "BKK": "Bangkok", "SIN": "Singapore", 
    "DXB": "Dubai", "DMM": "Dammam", "DEL": "Delhi", "LHR": "London"
};

const airlines = {
    "BG": "Biman Bangladesh", "TG": "Thai Airways", "EK": "Emirates",
    "SQ": "Singapore Airlines", "SV": "Saudia"
};

const flightsDB = [
    { line: 1, carrier: "BG", flight: "388", dep: "DAC", arr: "BKK", depTime: "1030", arrTime: "1430", aircraft: "738", classes: { Y: 9, B: 9, M: 7, H: 5, K: 4 } },
    { line: 2, carrier: "BG", flight: "390", dep: "DAC", arr: "BKK", depTime: "1800", arrTime: "2130", aircraft: "738", classes: { Y: 12, B: 8, M: 6, H: 4 } },
    { line: 3, carrier: "TG", flight: "321", dep: "DAC", arr: "BKK", depTime: "0920", arrTime: "1320", aircraft: "77W", classes: { Y: 15, B: 10, M: 8 } },
    { line: 4, carrier: "EK", flight: "582", dep: "DAC", arr: "DXB", depTime: "2200", arrTime: "0200", aircraft: "77W", classes: { Y: 20, B: 12 } },
    { line: 5, carrier: "SQ", flight: "446", dep: "DAC", arr: "SIN", depTime: "1425", arrTime: "2035", aircraft: "333", classes: { Y: 18, B: 9, M: 7 } }
];

// Utility
function printLine(text, color = "#00ff00") {
    const p = document.createElement('div');
    p.style.color = color;
    p.textContent = text;
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
}

function clearScreen() {
    output.innerHTML = '';
}

// Command History
let history = [];
let historyIndex = -1;

// State Management
function saveSession() {
    localStorage.setItem('gds_session', JSON.stringify({
        activePNR,
        sessionState
    }));
}

function loadSession() {
    const saved = localStorage.getItem('gds_session');
    if (saved) {
        const data = JSON.parse(saved);
        activePNR = data.activePNR;
    }
}

// PNR Generator
function generatePNR() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
        pnr += chars[Math.floor(Math.random() * chars.length)];
    }
    return pnr;
}

// AN Command Parser
function parseAN(cmd) {
    const match = cmd.match(/^AN(\d{2})([A-Z]{3})([A-Z]{3})(?:\/([A-Z]{2}))?$/);
    if (!match) return null;

    const [, date, origin, dest, airline] = match;
    
    if (!airports[origin] || !airports[dest]) {
        return { error: "CITY/AIRPORT CODE NOT FOUND" };
    }
    if (airline && !airlines[airline]) {
        return { error: "AIRLINE CODE NOT FOUND" };
    }

    return { date, origin, dest, airline };
}

// Display Availability
function displayAvailability(results) {
    lastAvailability = results;
    printLine(`AN${results[0].date}${results[0].origin}${results[0].dest}`);
    printLine("   FLT  CLS AVL  DEPART  ARRIVE  A/C");
    printLine("-------------------------------------");
    
    results.forEach(f => {
        let clsStr = Object.entries(f.classes).map(([c, s]) => `${c}${s}`).join(' ');
        printLine(` ${f.line} ${f.carrier}${f.flight}  ${clsStr}  ${f.depTime}  ${f.arrTime}  ${f.aircraft}`);
    });
}

// SS Command
function sellSegment(cmd) {
    if (!lastAvailability) return "NO AVAILABILITY DISPLAYED";
    
    const match = cmd.match(/^SS(\d)([A-Z])(\d)$/);
    if (!match) return "INVALID FORMAT";
    
    const [, seats, cls, lineNum] = match;
    const flight = lastAvailability.find(f => f.line === parseInt(lineNum));
    
    if (!flight) return "SEGMENT NOT FOUND";
    if (!flight.classes[cls] || flight.classes[cls] < parseInt(seats)) {
        return "CLASS NOT AVAILABLE";
    }

    // Reduce seats
    flight.classes[cls] -= parseInt(seats);

    // Create PNR if not exists
    if (!activePNR) {
        activePNR = {
            recordLocator: generatePNR(),
            passengers: [],
            itinerary: [],
            phone: "",
            receivedFrom: "",
            tkTimeLimit: "",
            fare: 450.00,
            status: "HK"
        };
    }

    activePNR.itinerary.push({
        ...flight,
        bookingClass: cls,
        seats: parseInt(seats)
    });

    saveSession();
    return `SEGMENT SOLD - ${flight.carrier}${flight.flight} ${cls}${seats}`;
}

// Main Command Processor
function processCommand(cmd) {
    cmd = cmd.trim().toUpperCase();
    if (!cmd) return;

    history.unshift(cmd);
    historyIndex = -1;

    printLine(`> ${cmd}`);

    let result = "COMMAND NOT RECOGNIZED";

    // Availability
    if (cmd.startsWith('AN')) {
        const parsed = parseAN(cmd);
        if (parsed && parsed.error) {
            result = parsed.error;
        } else if (parsed) {
            const filtered = flightsDB.filter(f => 
                (!parsed.airline || f.carrier === parsed.airline)
            );
            if (filtered.length === 0) {
                result = "NO FLIGHTS AVAILABLE";
            } else {
                displayAvailability(filtered.map((f,i) => ({...f, line: i+1, date: parsed.date})));
                return;
            }
        } else {
            result = "INVALID FORMAT";
        }
    }

    // Sell Segment
    else if (cmd.startsWith('SS')) {
        result = sellSegment(cmd);
    }

    // Passenger Name
    else if (cmd.startsWith('NM')) {
        if (!activePNR) activePNR = { recordLocator: generatePNR(), passengers: [], itinerary: [] };
        const name = cmd.substring(2).trim();
        activePNR.passengers.push(name);
        result = `NAME ADDED: ${name}`;
    }

    // Phone
    else if (cmd.startsWith('AP')) {
        if (activePNR) {
            activePNR.phone = cmd.substring(2).trim();
            result = "PHONE ADDED";
        }
    }

    // Received From
    else if (cmd.startsWith('RF')) {
        if (activePNR) {
            activePNR.receivedFrom = cmd.substring(2).trim();
            result = "RECEIVED FROM UPDATED";
        }
    }

    // Ticketing Time Limit
    else if (cmd.startsWith('TK')) {
        if (activePNR) {
            activePNR.tkTimeLimit = cmd.substring(2).trim();
            result = "TKTL SET";
        }
    }

    // Retrieve PNR
    else if (cmd === 'RT' || cmd.startsWith('RT ')) {
        if (activePNR) {
            printLine(`RP/DAC1A0980/DAC1A0980 AA/SU ${new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'2-digit'})}`);
            printLine(`1.${activePNR.passengers.join('  ')}`);
            activePNR.itinerary.forEach((seg, i) => {
                printLine(`${i+1}. ${seg.carrier}${seg.flight} ${seg.bookingClass} ${seg.dep} ${seg.arr} HK${seg.seats} ${seg.depTime} ${seg.arrTime}`);
            });
            if (activePNR.phone) printLine(`AP ${activePNR.phone}`);
            if (activePNR.receivedFrom) printLine(`RF ${activePNR.receivedFrom}`);
            return;
        } else {
            result = "NO ACTIVE PNR";
        }
    }

    // Delete Segment
    else if (cmd.startsWith('XE')) {
        if (activePNR && activePNR.itinerary.length > 0) {
            activePNR.itinerary.pop();
            result = "SEGMENT DELETED";
        }
    }

    // Ticket
    else if (cmd === 'TTP') {
        if (activePNR && activePNR.itinerary.length > 0) {
            result = `TICKET ISSUED - PNR ${activePNR.recordLocator}`;
            activePNR.status = "TK";
        } else {
            result = "PNR INCOMPLETE";
        }
    }

    // System
    else if (cmd === 'IG') {
        result = "IGNORED - CHANGES DISCARDED";
        activePNR = null;
    }

    else if (cmd === 'IR') {
        result = "PNR RESTORED";
    }

    printLine(result);
    saveSession();
}

// Input Handler
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = input.value.trim();
        if (cmd) processCommand(cmd);
        input.value = '';
    }
    
    // History navigation
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length > 0) {
            historyIndex = Math.min(historyIndex + 1, history.length - 1);
            input.value = history[historyIndex];
        }
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = history[historyIndex];
        } else {
            historyIndex = -1;
            input.value = '';
        }
    }
});

// PDF Ticket Generator
window.printTicket = function() {
    if (!activePNR || activePNR.itinerary.length === 0) {
        alert("No ticketed PNR found!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("courier");
    doc.setFontSize(12);
    doc.text("ELECTRONIC TICKET", 105, 20, { align: "center" });
    doc.text("===========================", 105, 28, { align: "center" });

    doc.text(`PNR: ${activePNR.recordLocator}`, 20, 45);
    doc.text(`PASSENGER: ${activePNR.passengers[0] || "N/A"}`, 20, 55);
    doc.text(`ISSUE DATE: ${new Date().toLocaleDateString()}`, 20, 65);

    let y = 80;
    activePNR.itinerary.forEach((seg, i) => {
        doc.text(`${seg.carrier}${seg.flight} ${seg.dep}-${seg.arr} ${seg.depTime}-${seg.arrTime} ${seg.bookingClass}`, 20, y);
        y += 10;
    });

    doc.text(`TOTAL FARE: USD ${activePNR.fare}`, 20, y + 10);
    doc.text("THANK YOU FOR FLYING WITH US", 105, y + 30, { align: "center" });

    doc.save(`ETICKET_${activePNR.recordLocator}.pdf`);
};

// Initialize
function init() {
    clearScreen();
    printLine("Welcome to Amadeus GDS Training Simulator", "#00ff88");
    printLine("Type commands like AN10JUNDACBKK, SS1Y1, NM1RAHIM/MR, etc.");
    printLine("=============================================================");
    loadSession();
}

init();