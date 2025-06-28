// DOM Elements
const timezoneSelect = document.getElementById("timezone-select");
const currentTimeElement = document.getElementById("current-time");
const currentChatroomElement = document.getElementById("current-chatroom");

// Current timezone data
let currentTimezone = {
    id: "UTC+0",
    offset: 0
};

// Initialize timezone based on user's local time
function initializeTimezone() {
    const localOffset = -(new Date().getTimezoneOffset() / 60);
    const sign = localOffset >= 0 ? "+" : "-";
    const absOffset = Math.abs(localOffset);
    const offsetString = `UTC${sign}${absOffset}`;
    
    // Find the closest timezone option
    let closestOption = "UTC+0";
    let minDifference = Number.MAX_VALUE;
    
    for (const option of timezoneSelect.options) {
        const optionValue = option.value;
        const optionOffset = parseTimezoneOffset(optionValue);
        const difference = Math.abs(optionOffset - localOffset);
        
        if (difference < minDifference) {
            minDifference = difference;
            closestOption = optionValue;
        }
    }
    
    timezoneSelect.value = closestOption;
    updateCurrentTimezone(closestOption);
    updateChatroomTitle();
    startTimeClock();
}

// Parse timezone offset from timezone string (e.g., "UTC+8" -> 8)
function parseTimezoneOffset(timezone) {
    const match = timezone.match(/UTC([+-])(\d+)(?::(\d+))?/);
    
    if (!match) {
        return 0;
    }
    
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) / 60 : 0;
    
    return sign * (hours + minutes);
}

// Update current timezone data
function updateCurrentTimezone(timezone) {
    currentTimezone.id = timezone;
    currentTimezone.offset = parseTimezoneOffset(timezone);
}

// Format time according to the selected timezone
function formatTimeForTimezone(date, timezoneOffset) {
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
    const timezoneTime = new Date(utcTime + (timezoneOffset * 60 * 60 * 1000));
    
    const hours = timezoneTime.getHours().toString().padStart(2, "0");
    const minutes = timezoneTime.getMinutes().toString().padStart(2, "0");
    const seconds = timezoneTime.getSeconds().toString().padStart(2, "0");
    
    const year = timezoneTime.getFullYear();
    const month = (timezoneTime.getMonth() + 1).toString().padStart(2, "0");
    const day = timezoneTime.getDate().toString().padStart(2, "0");
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Start clock to display current time
function startTimeClock() {
    updateTime();
    setInterval(updateTime, 1000);
}

// Update displayed time
function updateTime() {
    const now = new Date();
    const formattedTime = formatTimeForTimezone(now, currentTimezone.offset);
    currentTimeElement.textContent = formattedTime;
}

// Update chatroom title with current category and timezone
function updateChatroomTitle() {
    const activeCategory = document.querySelector(".category-btn.active").dataset.category;
    const categoryName = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
    currentChatroomElement.textContent = `${categoryName} Chat - ${currentTimezone.id}`;
}

// Change timezone event
timezoneSelect.addEventListener("change", () => {
    const selectedTimezone = timezoneSelect.value;
    updateCurrentTimezone(selectedTimezone);
    updateChatroomTitle();
    updateTime();
    
    // If user is logged in, update their chatroom
    if (currentUser) {
        leaveChatroom();
        joinChatroom();
    }
});

// Initialize timezone on page load
window.addEventListener("DOMContentLoaded", initializeTimezone); 