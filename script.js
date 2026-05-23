// ====================== AMADEUS GDS TRAINING SIMULATOR ======================

const output = document.getElementById('output');
const commandInput = document.getElementById('command-input');

// Database
const airports = ["DAC", "BKK", "SIN", "DXB", "DMM", "DEL", "KUL", "CGK", "HKG", "LHR"];
const airlines = {
    "BG": "Biman Bangladesh", "SQ": "Singapore Airlines", "EK": "Emirates",
    "TG": "Thai Airways", "MH": "Malaysia Airlines", "AI": "Air India"
};

let flightsDB = [
    { id: 1, airline: "BG", flight: "388", origin: "DAC", dest: "BKK", dep: "1030", arr: "1430", aircraft: "320", classes: { Y:9, B:9, M:7, H:5, K:3 } },
    { id: 2, airline: "SQ", flight: "447", origin: "DAC", dest: "SIN", dep: "1320", arr: "1900", aircraft: "359", classes: { Y:8, B:8, M:6, H:4, K:2 } },
    { id: 3, airline: "EK", flight: "582", origin: "DAC", dest: "DXB", dep: "0215", arr: "0530", aircraft: "77W", classes: { Y:12, B:10, M:8, H:6 } },
    { id: 4, airline: "TG", flight: "321", origin: "DAC", dest: "BKK", dep: "0850", arr: "1250", aircraft: "788", classes: { Y:9, B:7, M:5 } },
];

// State
let currentAvailability = [];
let activePNR = null;
let lastSavedPNR = null;
let sessionState = {};

// Load from localStorage
function loadSession() {
    const saved = localStorage.getItem('gds_simulator');
    if (saved) {
        const data = JSON.parse(saved);
        activePNR = data.activePNR || null;
        lastSavedPNR = data.lastSavedPNR || null;
    }
}

function saveSession() {
    localStorage.setItem('gds_simulator', JSON.stringify({
        activePNR,
        lastSavedPNR
    }));
}

// Print to terminal
function print(text, color = "#00ff00") {
    const line = document.createElement('div');
    line.style.color = color;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

// Clear screen
function clearScreen() {
    output.innerHTML = '';
}

// Generate PNR
function generatePNR() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pnr = "";
    for (let i = 0; i < 6; i++) {
        pnr += chars[Math.floor(Math.random() * chars.length)];
    }
    return pnr;
}

// Display Availability
function displayAvailability(results) {
    currentAvailability = results;
    print("                    AVAILABILITY DISPLAY", "#ffff00");
    print("=".repeat(70), "#00aa00");
    
    results.forEach((flight, index) => {
        let classStr = "";
        for (let cls in flight.classes) {
            classStr += `${cls}${flight.classes[cls]} `;
        }
        print(`${index+1} ${flight.airline}${flight.flight} ${classStr} ${flight.origin}${flight.dest} ${flight.dep} ${flight.arr} ${flight.aircraft}`);
    });
    print("=".repeat(70), "#00aa00");
}

// Command Handlers
const commands = {
    HELP: () => {
        print("Available Commands:");
        print("AN[date][origin][dest][/airline] - Availability");
        print("SS[seats][class][line] - Sell Segment");
        print("NM1NAME/MR - Add Passenger");
        print("AP[phone] - Add Phone");
        print("TKTL[date] / TKOK - Ticketing Time Limit");
        print("RF[name] - Received From");
        print("RT - Retrieve PNR");
        print("XE[n] - Delete Segment");
        print("IG - Ignore Changes");
        print("IR - Ignore & Restore");
        print("TTP - Issue Ticket");
    },

    AN: (input) => {
        const match = input.match(/^AN(\d{2})([A-Z]{3})([A-Z]{3})(?:\/([A-Z]{2}))?$/);
        if (!match) {
            print("INVALID FORMAT. USE: AN10JUNDACBKK", "#ff0000");
            return;
        }

        const [, date, origin, dest, airlineFilter] = match;

        if (!airports.includes(origin) || !airports.includes(dest)) {
            print("CITY/AIRPORT CODE NOT FOUND", "#ff0000");
            return;
        }

        let results = flightsDB.filter(f => 
            f.origin === origin && f.dest === dest
        );

        if (airlineFilter) {
            results = results.filter(f => f.airline === airlineFilter);
        }

        if (results.length === 0) {
            print("NO FLIGHTS AVAILABLE", "#ffaa00");
        } else {
            displayAvailability(results);
        }
    },

    SS: (input) => {
        if (!currentAvailability.length) {
            print("NO AVAILABILITY DISPLAYED. RUN AN FIRST.", "#ff0000");
            return;
        }

        const match = input.match(/^SS(\d)([A-Z])(\d+)$/);
        if (!match) {
            print("INVALID SS FORMAT. USE: SS1Y1", "#ff0000");
            return;
        }

        const [, seats, cls, lineNum] = match;
        const flightIndex = parseInt(lineNum) - 1;
        const flight = currentAvailability[flightIndex];

        if (!flight) {
            print("SEGMENT NOT FOUND", "#ff0000");
            return;
        }

        if (!flight.classes[cls] || flight.classes[cls] < parseInt(seats)) {
            print("CLASS NOT AVAILABLE", "#ff0000");
            return;
        }

        // Reduce seat count
        flight.classes[cls] -= parseInt(seats);

        if (!activePNR) {
            activePNR = {
                pnr: generatePNR(),
                passengers: [],
                segments: [],
                phone: "",
                receivedFrom: "",
                ttl: "",
                ticketed: false
            };
        }

        activePNR.segments.push({
            ...flight,
            bookingClass: cls,
            status: "HK" + seats
        });

        print(`SEGMENT ADDED: ${flight.airline}${flight.flight} ${cls} CLASS`, "#00ff00");
        saveSession();
    },

    NM: (input) => {
        if (!activePNR) activePNR = { pnr: generatePNR(), passengers: [], segments: [], phone: "", receivedFrom: "", ttl: "", ticketed: false };
        
        const names = input.substring(2).split(' ').map(n => n.trim());
        names.forEach(name => {
            if (name) activePNR.passengers.push(name);
        });
        print("PASSENGER NAME RECORDED", "#00ff00");
        saveSession();
    },

    AP: (input) => {
        if (!activePNR) {
            print("NO ACTIVE PNR", "#ff0000");
            return;
        }
        activePNR.phone = input.substring(2);
        print("PHONE RECORDED", "#00ff00");
        saveSession();
    },

    RF: (input) => {
        if (!activePNR) {
            print("NO ACTIVE PNR", "#ff0000");
            return;
        }
        activePNR.receivedFrom = input.substring(2);
        print("RECEIVED FROM RECORDED", "#00ff00");
        saveSession();
    },

    TKTL: (input) => {
        if (!activePNR) {
            print("NO ACTIVE PNR", "#ff0000");
            return;
        }
        activePNR.ttl = input.substring(4);
        print("TICKETING TIME LIMIT SET", "#00ff00");
        saveSession();
    },

    RT: () => {
        if (!activePNR) {
            print("NO ACTIVE PNR FOUND", "#ffaa00");
            return;
        }

        print(`RP/DAC1A0980/DAC1A0980 AA/SU ${new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'2-digit'})}`, "#ffff00");
        print("=".repeat(60));
        
        activePNR.passengers.forEach((p, i) => {
            print(`${i+1}.${p}`);
        });

        activePNR.segments.forEach((seg, i) => {
            print(`${i+1}. ${seg.airline}${seg.flight} ${seg.bookingClass} ${seg.origin}${seg.dest} ${seg.status} ${seg.dep} ${seg.arr}`);
        });

        if (activePNR.phone) print(`AP ${activePNR.phone}`);
        if (activePNR.receivedFrom) print(`RF ${activePNR.receivedFrom}`);
        print("=".repeat(60));
    },

    XE: (input) => {
        if (!activePNR || !activePNR.segments.length) {
            print("NO SEGMENTS TO DELETE", "#ff0000");
            return;
        }
        const num = parseInt(input.substring(2)) - 1;
        if (num >= 0 && num < activePNR.segments.length) {
            activePNR.segments.splice(num, 1);
            print(`SEGMENT ${num+1} DELETED`, "#ffff00");
            saveSession();
        }
    },

    IG: () => {
        activePNR = lastSavedPNR ? JSON.parse(JSON.stringify(lastSavedPNR)) : null;
        print("CHANGES IGNORED. RESTORED LAST SAVED STATE.", "#ffff00");
    },

    IR: () => {
        if (lastSavedPNR) {
            activePNR = JSON.parse(JSON.stringify(lastSavedPNR));
            print("PNR RESTORED FROM LAST SAVE", "#00ff00");
        } else {
            print("NO PREVIOUS SAVED PNR", "#ff0000");
        }
    },

    TTP: () => {
        if (!activePNR || activePNR.segments.length === 0 || activePNR.passengers.length === 0) {
            print("CANNOT TICKET - INCOMPLETE PNR", "#ff0000");
            return;
        }
        activePNR.ticketed = true;
        print("TICKET ISSUED SUCCESSFULLY", "#00ff88");
        print(`TICKET NUMBER: 123-4567890123`, "#00ff88");
        saveSession();
    }
};

// Main Command Processor
function processCommand(cmd) {
    print("> " + cmd, "#aaaaaa");
    
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0].toUpperCase();
    const arg = cmd.substring(command.length).trim();

    if (commands[command]) {
        commands[command](arg || cmd);
    } else if (command.startsWith("AN")) {
        commands.AN(cmd);
    } else if (command.startsWith("SS")) {
        commands.SS(cmd);
    } else if (command.startsWith("NM")) {
        commands.NM(cmd);
    } else if (command.startsWith("AP")) {
        commands.AP(cmd);
    } else if (command.startsWith("RF")) {
        commands.RF(cmd);
    } else if (command.startsWith("TKTL")) {
        commands.TKTL(cmd);
    } else if (command === "TKOK") {
        print("TICKETING OK", "#00ff00");
    } else {
        print("COMMAND NOT RECOGNIZED", "#ff0000");
    }
}

// PDF Ticket Generator
window.printTicket = function() {
    if (!activePNR || !activePNR.ticketed) {
        alert("Please issue ticket first using TTP command");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("courier");
    doc.setFontSize(16);
    doc.text("ELECTRONIC TICKET", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`PNR: ${activePNR.pnr}`, 20, 40);
    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 20, 50);

    doc.text("Passenger:", 20, 70);
    activePNR.passengers.forEach((p, i) => {
        doc.text(p, 20, 80 + i*10);
    });

    doc.text("Itinerary:", 20, 110);
    activePNR.segments.forEach((seg, i) => {
        doc.text(`${seg.airline}${seg.flight} ${seg.origin}-${seg.dest} ${seg.dep}-${seg.arr} ${seg.bookingClass}`, 20, 120 + i*10);
    });

    doc.text("Thank you for flying with us!", 105, 200, { align: "center" });

    doc.save(`ETicket_${activePNR.pnr}.pdf`);
};

// Event Listeners
commandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const cmd = commandInput.value.trim();
        if (cmd) {
            processCommand(cmd);
        }
        commandInput.value = '';
    }
});

// Initialize
function init() {
    loadSession();
    clearScreen();
    print("══════════════════════════════════════════════════════════════", "#00aa00");
    print("          WELCOME TO AMADEUS GDS TRAINING SYSTEM", "#ffff00");
    print("             DAC1A0980 - TRAINING ENVIRONMENT", "#00ff00");
    print("══════════════════════════════════════════════════════════════", "#00aa00");
    print("Type HELP for available commands.\n", "#aaaaaa");
    
    // Welcome PNR example
    if (!activePNR) {
        print("No active PNR. Create one with AN + SS + NM commands.", "#ffff00");
    }
}

init();