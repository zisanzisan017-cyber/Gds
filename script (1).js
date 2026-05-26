const data = {
    airports: {
        "DAC": "DHAKA", "ZYL": "SYLHET", "CGP": "CHITTAGONG", "DMM": "DAMMAM", "JED": "JEDDAH",
        "RUH": "RIYADH", "DXB": "DUBAI", "AUH": "ABU DHABI", "DOH": "DOHA", "LHR": "LONDON",
        "JFK": "NEW YORK", "SIN": "SINGAPORE", "BKK": "BANGKOK", "KUL": "KUALA LUMPUR",
        "DEL": "DELHI", "BOM": "MUMBAI", "IST": "ISTANBUL", "CDG": "PARIS", "FRA": "FRANKFURT", "SYD": "SYDNEY"
    },
    airlines: {
        "EK": "EMIRATES", "QR": "QATAR AIRWAYS", "BS": "US-BANGLA", "SV": "SAUDIA", "TK": "TURKISH",
        "BG": "BIMAN BANGLADESH", "AI": "AIR INDIA", "SQ": "SINGAPORE AIR", "EY": "ETIHAD", "GF": "GULF AIR",
        "KU": "KUWAIT AIR", "WY": "OMAN AIR", "FZ": "FLYDUBAI", "G9": "AIR ARABIA", "UK": "VISTARA",
        "CX": "CATHAY PACIFIC", "BA": "BRITISH AIRWAYS", "AF": "AIR FRANCE", "LH": "LUFTHANSA", "MH": "MALAYSIA AIR"
    },
    classes: ["Y", "J", "F", "B", "M", "H", "K", "L", "Q", "T"]
};

let state = {
    isLoggedIn: false,
    pnr: {
        flights: [],
        names: [],
        contact: "",
        ticketing: "",
        receivedBy: "",
        payment: "",
        isSaved: false,
        isIssued: false,
        fareLoaded: false
    },
    lastSearch: []
};

function login() {
    const user = document.getElementById('username').value;
    if (user) {
        state.isLoggedIn = true;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('terminal-screen').style.display = 'flex';
        document.getElementById('command-input').focus();
        printToTerminal("SIGNED IN SUCCESSFULLY AS " + user.toUpperCase());
    } else {
        alert("Enter Office ID / Username");
    }
}

const input = document.getElementById('command-input');
input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const cmd = this.value.toUpperCase().trim();
        this.value = '';
        processCommand(cmd);
    }
});

function printToTerminal(text, className = '') {
    const output = document.getElementById('output');
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
}

function clearTerminal() {
    const output = document.getElementById('output');
    output.innerHTML = 'AMADEUS GDS - READY FOR COMMANDS\n--------------------------------------------------';
}

function processCommand(cmd) {
    printToTerminal("> " + cmd);

    if (cmd === 'IG') {
        state.pnr = { flights: [], names: [], contact: "", ticketing: "", receivedBy: "", payment: "", isSaved: false, isIssued: false, fareLoaded: false };
        clearTerminal();
        printToTerminal("--- TRANSACTION IGNORED AND DISPLAY CLEARED ---");
        return;
    }

    if (cmd === 'HELP' || cmd === '?') {
        showHelp();
        return;
    }

    if (cmd === 'RT') {
        displayPNR();
        return;
    }

    if (cmd.startsWith('FQD')) {
        handleFQD(cmd);
        return;
    }

    if (cmd.startsWith('FPD')) {
        state.pnr.payment = cmd.substring(3).trim() || "CASH";
        printToTerminal(`OK - PAYMENT METHOD ${state.pnr.payment} ADDED`);
        return;
    }

    if (cmd.startsWith('XI')) {
        const index = parseInt(cmd.substring(2)) - 1;
        if (state.pnr.flights[index]) {
            state.pnr.flights.splice(index, 1);
            printToTerminal(`OK - SEGMENT ${index + 1} DELETED`);
        } else {
            printToTerminal("ERROR: INVALID SEGMENT", "error");
        }
        return;
    }

    if (cmd.startsWith('AN')) {
        handleAN(cmd);
    } 
    else if (cmd.startsWith('SS')) {
        handleSS(cmd);
    }
    else if (cmd.startsWith('NM')) {
        handleNM(cmd);
    }
    else if (cmd.startsWith('AP')) {
        handleAP(cmd);
    }
    else if (cmd === 'TKOK') {
        state.pnr.ticketing = "OK";
        printToTerminal("OK - TICKETING TIME LIMIT SET");
    }
    else if (cmd.startsWith('RF')) {
        state.pnr.receivedBy = cmd.substring(2) || "AGENT";
        printToTerminal("OK - RECEIVED BY " + state.pnr.receivedBy);
    }
    else if (cmd === 'ER') {
        if (state.pnr.flights.length > 0 && state.pnr.names.length > 0) {
            state.pnr.isSaved = true;
            printToTerminal("--- PNR SAVED AND RETRIEVED ---");
            displayPNR();
        } else {
            printToTerminal("ERROR: MANDATORY ELEMENTS MISSING (NAMES/FLIGHTS)", "error");
        }
    }
    else if (cmd === 'FQB' || cmd === 'FXP') {
        if (state.pnr.flights.length > 0) {
            state.pnr.fareLoaded = true;
            const fare = (Math.random() * 500 + 400).toFixed(2);
            printToTerminal(`FARE QUOTED: USD ${fare} TAX INCLUDED`);
            printToTerminal("OK - FARE STORED");
        } else {
            printToTerminal("ERROR: NO FLIGHTS SELECTED", "error");
        }
    }
    else if (cmd === 'TTP') {
        // Relaxed TTP requirements for easier learning, but still needs mandatory elements
        if (state.pnr.flights.length > 0 && state.pnr.names.length > 0) {
            state.pnr.isIssued = true;
            printToTerminal("OK - TICKET ISSUED SUCCESSFULLY");
        } else {
            printToTerminal("ERROR: PNR INCOMPLETE (NAMES OR FLIGHTS MISSING)", "error");
        }
    }
    else if (cmd === 'TTR/P') {
        if (state.pnr.isIssued) {
            printTicket();
        } else {
            printToTerminal("ERROR: NO TICKET ISSUED (TTP REQUIRED)", "error");
        }
    }
    else {
        printToTerminal("INVALID COMMAND OR NOT IMPLEMENTED", "error");
    }
}

function handleFQD(cmd) {
    const regex = /FQD\s*([A-Z]{3})\s*([A-Z]{3})/;
    const match = cmd.match(regex);
    if (!match) {
        printToTerminal("FORMAT: FQD DACDXB", "error");
        return;
    }
    const origin = match[1];
    const dest = match[2];
    printToTerminal(`--- FARE DISPLAY: ${origin} TO ${dest} ---`);
    printToTerminal("AL  CLASS  CUR  FARE TYPE  AMOUNT");
    const airlines = Object.keys(data.airlines).slice(0, 5);
    airlines.forEach(al => {
        const fare = Math.floor(Math.random() * 300) + 200;
        printToTerminal(`${al}   Y      USD  OW         ${fare}.00`);
    });
}

function handleAN(cmd) {
    const regex = /AN\s*(\d{2}[A-Z]{3})\s*([A-Z]{3})\s*([A-Z]{3})(?:\/([A-Z]{2,3}))?/;
    const match = cmd.match(regex);
    
    if (!match) {
        printToTerminal("FORMAT: AN 25JUN DACDXB /AEK", "error");
        return;
    }

    const date = match[1];
    const origin = match[2];
    const dest = match[3];
    let airlinePref = match[4] || "";
    if (airlinePref.startsWith('A')) airlinePref = airlinePref.substring(1);

    if (!data.airports[origin] || !data.airports[dest]) {
        printToTerminal(`INVALID AIRPORT CODE: ${origin} OR ${dest}`, "error");
        return;
    }

    printToTerminal(`** AMADEUS AVAILABILITY - AN ** ${origin} / ${dest} - ${date}`);
    state.lastSearch = [];

    let airlineList = [];
    if (airlinePref && data.airlines[airlinePref]) {
        airlineList = [airlinePref, airlinePref, airlinePref, airlinePref, airlinePref];
    } else {
        const keys = Object.keys(data.airlines);
        for(let i=0; i<5; i++) {
            airlineList.push(keys[Math.floor(Math.random() * keys.length)]);
        }
    }
    
    for (let i = 1; i <= 5; i++) {
        const al = airlineList[i-1];
        const flightNum = Math.floor(Math.random() * 900) + 100;
        const depTime = `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}${String(Math.floor(Math.random() * 6) * 10).padStart(2, '0')}`;
        const arrTime = `${String((parseInt(depTime.substring(0,2)) + 4) % 24).padStart(2, '0')}${depTime.substring(2)}`;
        
        const flight = {
            id: i,
            airline: al,
            flightNum: al + flightNum,
            origin: origin,
            dest: dest,
            date: date,
            depTime: depTime,
            arrTime: arrTime,
            classes: data.classes.map(c => c + (Math.floor(Math.random() * 9) + 1))
        };
        
        state.lastSearch.push(flight);
        const classStr = flight.classes.slice(0, 7).join(' ') + '...';
        printToTerminal(`${i}  ${flight.flightNum}  ${classStr}  ${origin}${dest}  ${depTime}  ${arrTime}  E0/77W`);
    }
}

function handleSS(cmd) {
    const regex = /SS(\d)([A-Z])(\d)/;
    const match = cmd.match(regex);
    if (!match) {
        printToTerminal("FORMAT: SS1Y1", "error");
        return;
    }

    const seats = match[1];
    const cls = match[2];
    const line = parseInt(match[3]);

    if (state.lastSearch[line - 1]) {
        const flight = state.lastSearch[line - 1];
        state.pnr.flights.push({ ...flight, selectedClass: cls, seats: seats });
        printToTerminal(`OK - ${seats} SEAT(S) SELECTED ON ${flight.flightNum} ${cls} CLASS`);
    } else {
        printToTerminal("INVALID LINE NUMBER", "error");
    }
}

function handleNM(cmd) {
    const name = cmd.substring(2);
    if (name) {
        state.pnr.names.push(name);
        printToTerminal(`OK - NAME ${name} ADDED`);
    }
}

function handleAP(cmd) {
    state.pnr.contact = cmd.substring(2).trim();
    printToTerminal(`OK - CONTACT ${state.pnr.contact} ADDED`);
}

function displayPNR() {
    printToTerminal("--- CURRENT PNR ---");
    if (state.pnr.names.length === 0 && state.pnr.flights.length === 0) {
        printToTerminal("NO ACTIVE PNR");
        return;
    }
    state.pnr.names.forEach((n, i) => printToTerminal(`${i+1}. ${n}`));
    state.pnr.flights.forEach((f, i) => {
        printToTerminal(`${i+1}  ${f.flightNum} ${f.selectedClass} ${f.date} ${f.origin}${f.dest} HK${f.seats}`);
    });
    if (state.pnr.contact) printToTerminal(`AP ${state.pnr.contact}`);
    if (state.pnr.ticketing) printToTerminal(`TK ${state.pnr.ticketing}`);
    if (state.pnr.payment) printToTerminal(`FP ${state.pnr.payment}`);
    if (state.pnr.receivedBy) printToTerminal(`RF ${state.pnr.receivedBy}`);
}

function printTicket() {
    const output = document.getElementById('output');
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'ticket';
    
    const ticketNum = "0" + Math.floor(Math.random() * 999999999999);
    const issueDate = new Date().toLocaleDateString();
    
    let ticketContent = `
ELECTRONIC TICKET RECORD
------------------------------------------
PASSENGER: ${state.pnr.names[0] || "WALK-IN"}
TICKET NUMBER: ${ticketNum}
ISSUED BY: AMADEUS GDS SIMULATOR
DATE OF ISSUE: ${issueDate}

FLIGHT INFORMATION:
`;

    state.pnr.flights.forEach(f => {
        ticketContent += `${f.flightNum} | ${f.date} | ${f.origin} -> ${f.dest} | CLASS: ${f.selectedClass} | STATUS: OK\n`;
    });

    ticketContent += `\nPAYMENT: ${state.pnr.payment || "CASH"}\nSTATUS: CONFIRMED\n------------------------------------------`;
    
    ticketDiv.textContent = ticketContent;
    
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = "DOWNLOAD E-TICKET (PDF)";
    downloadBtn.style.marginTop = "10px";
    downloadBtn.onclick = function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFont("courier", "bold");
        doc.setFontSize(18);
        doc.text("ELECTRONIC TICKET RECEIPT", 10, 20);
        
        doc.setFontSize(12);
        doc.setFont("courier", "normal");
        doc.text("------------------------------------------", 10, 30);
        doc.text(`PASSENGER NAME: ${state.pnr.names[0] || "WALK-IN"}`, 10, 40);
        doc.text(`TICKET NUMBER:  ${ticketNum}`, 10, 50);
        doc.text(`ISSUED BY:      AMADEUS SIMULATOR`, 10, 60);
        doc.text(`DATE OF ISSUE:  ${issueDate}`, 10, 70);
        doc.text("------------------------------------------", 10, 80);
        
        doc.text("FLIGHT DETAILS:", 10, 95);
        let y = 105;
        state.pnr.flights.forEach(f => {
            doc.text(`${f.flightNum}  ${f.date}  ${f.origin} TO ${f.dest}`, 10, y);
            doc.text(`CLASS: ${f.selectedClass}  STATUS: CONFIRMED`, 10, y + 7);
            y += 20;
        });
        
        doc.text("------------------------------------------", 10, y);
        doc.text("THANK YOU FOR FLYING WITH US", 10, y + 10);
        
        doc.save(`Ticket_${(state.pnr.names[0] || "Ticket").replace('/', '_')}.pdf`);
    };
    
    ticketDiv.appendChild(document.createElement('br'));
    ticketDiv.appendChild(downloadBtn);
    
    output.appendChild(ticketDiv);
    output.scrollTop = output.scrollHeight;
}

function showHelp() {
    printToTerminal("--- AMADEUS COMMAND LIST ---");
    printToTerminal("AN [DATE][ORIGIN][DEST] - Check Availability");
    printToTerminal("SS[SEATS][CLASS][LINE] - Select Flight");
    printToTerminal("RT - Retrieve Current PNR");
    printToTerminal("FQD[ORIGIN][DEST] - Fare Quote Display (Before Booking)");
    printToTerminal("FPD[PAYMENT] - Add Payment Method");
    printToTerminal("XI[LINE] - Delete Segment");
    printToTerminal("NM1[NAME] - Add Passenger");
    printToTerminal("AP [PHONE] - Add Contact");
    printToTerminal("TKOK - Ticketing Confirm");
    printToTerminal("RF[NAME] - Received By");
    printToTerminal("ER - Save PNR");
    printToTerminal("FQB / FXP - Fare Quote");
    printToTerminal("TTP - Issue Ticket");
    printToTerminal("TTR/P - Print PDF Ticket");
    printToTerminal("IG - Ignore and Clear Display");
    printToTerminal("----------------------------");
}
