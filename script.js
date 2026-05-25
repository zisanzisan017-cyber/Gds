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

function processCommand(cmd) {
    printToTerminal("> " + cmd);

    if (cmd === 'IG') {
        state.pnr = { flights: [], names: [], contact: "", ticketing: "", receivedBy: "", isSaved: false, isIssued: false, fareLoaded: false };
        printToTerminal("--- TRANSACTION IGNORED ---");
        return;
    }

    // AN Command: AN 25JUN DACDXB /AEK or AN25JUNDACDXB/AEK
    if (cmd.startsWith('AN')) {
        handleAN(cmd);
    } 
    // SS Command: SS1Y1
    else if (cmd.startsWith('SS')) {
        handleSS(cmd);
    }
    // Help Command
    else if (cmd === 'HELP' || cmd === '?') {
        showHelp();
    }
    // NM Command: NM1BALAKRISHNAN/AMIN
    else if (cmd.startsWith('NM')) {
        handleNM(cmd);
    }
    // AP Command: AP 017...
    else if (cmd.startsWith('AP')) {
        handleAP(cmd);
    }
    // TKOK Command
    else if (cmd === 'TKOK') {
        state.pnr.ticketing = "OK";
        printToTerminal("OK - TICKETING TIME LIMIT SET");
    }
    // RF Command: RFBALAKRISHNAN
    else if (cmd.startsWith('RF')) {
        state.pnr.receivedBy = cmd.substring(2);
        printToTerminal("OK - RECEIVED BY " + state.pnr.receivedBy);
    }
    // ER Command
    else if (cmd === 'ER') {
        if (state.pnr.flights.length > 0 && state.pnr.names.length > 0) {
            state.pnr.isSaved = true;
            printToTerminal("--- PNR SAVED AND RETRIEVED ---");
            displayPNR();
        } else {
            printToTerminal("ERROR: MANDATORY ELEMENTS MISSING (NAMES/FLIGHTS)", "error");
        }
    }
    // FQB / FXP Command
    else if (cmd === 'FQB' || cmd === 'FXP') {
        if (state.pnr.flights.length > 0) {
            state.pnr.fareLoaded = true;
            const fare = (Math.random() * 500 + 400).toFixed(2);
            printToTerminal(`FARE QUOTE: USD ${fare} TAX INCLUDED`);
            printToTerminal("OK - FARE STORED");
        } else {
            printToTerminal("ERROR: NO FLIGHTS IN PNR", "error");
        }
    }
    // TTP Command
    else if (cmd === 'TTP') {
        if (state.pnr.isSaved && state.pnr.fareLoaded) {
            state.pnr.isIssued = true;
            printToTerminal("OK - TICKET ISSUED SUCCESSFULLY");
        } else {
            printToTerminal("ERROR: PNR NOT SAVED OR FARE NOT LOADED", "error");
        }
    }
    // TTR/P Command
    else if (cmd === 'TTR/P') {
        if (state.pnr.isIssued) {
            printTicket();
        } else {
            printToTerminal("ERROR: NO TICKET ISSUED", "error");
        }
    }
    else {
        printToTerminal("INVALID COMMAND OR NOT IMPLEMENTED", "error");
    }
}

function handleAN(cmd) {
    // Improved regex to handle AN25JUNDACDXB/AEK or AN 25JUN DACDXB /AEK
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
    if (airlinePref.startsWith('A')) airlinePref = airlinePref.substring(1); // Handle /AEK

    if (!data.airports[origin] || !data.airports[dest]) {
        printToTerminal(`INVALID AIRPORT CODE: ${origin} OR ${dest}`, "error");
        return;
    }

    printToTerminal(`AN ${date} ${origin}${dest} /A${airlinePref}`);
    printToTerminal(`** AMADEUS AVAILABILITY - AN ** ${origin} ${data.airports[origin]} / ${dest} ${data.airports[dest]}`);
    state.lastSearch = [];

    // Select 5 airlines for display
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

function showHelp() {
    printToTerminal("--- AMADEUS COMMAND LIST ---");
    printToTerminal("AN [DATE][ORIGIN][DEST] /A[AIRLINE] - Check Availability");
    printToTerminal("SS[SEATS][CLASS][LINE] - Select Flight");
    printToTerminal("FQB - Check Best Fare");
    printToTerminal("NM1[SURNAME]/[GIVEN NAME] - Add Passenger");
    printToTerminal("AP [PHONE] - Add Contact");
    printToTerminal("TKOK - Ticketing Time Limit");
    printToTerminal("RF[NAME] - Received By");
    printToTerminal("ER - Save and Retrieve PNR");
    printToTerminal("FXP - Load Final Fare");
    printToTerminal("TTP - Issue Ticket");
    printToTerminal("TTR/P - Print Ticket");
    printToTerminal("IG - Ignore Transaction");
    printToTerminal("----------------------------");
}

function handleSS(cmd) {
    // Format: SS1Y1 (Sell 1 seat in Y class from line 1)
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
    state.pnr.names.forEach((n, i) => printToTerminal(`${i+1}. ${n}`));
    state.pnr.flights.forEach((f, i) => {
        printToTerminal(`${i+1}  ${f.flightNum} ${f.selectedClass} ${f.date} ${f.origin}${f.dest} HK${f.seats}`);
    });
    printToTerminal(`AP ${state.pnr.contact}`);
    printToTerminal(`TK ${state.pnr.ticketing}`);
}

function printTicket() {
    const output = document.getElementById('output');
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'ticket';
    
    let ticketContent = `
ELECTRONIC TICKET RECORD
------------------------------------------
PASSENGER: ${state.pnr.names[0]}
TICKET NUMBER: 0${Math.floor(Math.random() * 999999999999)}
ISSUED BY: AMADEUS GDS SIMULATOR
DATE: ${new Date().toLocaleDateString()}

FLIGHT INFORMATION:
`;

    state.pnr.flights.forEach(f => {
        ticketContent += `${f.flightNum} | ${f.date} | ${f.origin} -> ${f.dest} | CLASS: ${f.selectedClass}\n`;
    });

    ticketContent += `\nSTATUS: CONFIRMED\n------------------------------------------`;
    
    ticketDiv.textContent = ticketContent;
    output.appendChild(ticketDiv);
    output.scrollTop = output.scrollHeight;
}
