// Retrieve complaints from localStorage
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];
let userPoints = JSON.parse(localStorage.getItem("userPoints")) || {};

// -------------------- Dark/Light Mode --------------------
const toggleModeBtn = document.getElementById("toggleMode");
if(toggleModeBtn){
    toggleModeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
    });
}

// -------------------- Toast Notification --------------------
function showToast(message){
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(()=>{toast.classList.add("show")},50);
    setTimeout(()=>{toast.classList.remove("show"); setTimeout(()=>toast.remove(),500)},3000);
}
// -------------------- Live Location Function --------------------
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Convert coordinates to human-readable location
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();

            // Put location into the form field
            document.getElementById("location").value = data.display_name || "Unknown Location";

            // Show a toast notification
            showToast("Live location detected!");
        }, function(error) {
            alert("Unable to fetch location: " + error.message);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}
function detectIssueType(issue){
    issue = issue.toLowerCase();
    if(issue.includes("wifi") || issue.includes("network") || issue.includes("internet")){
        return "Network";
    }
    else if(issue.includes("bill") || issue.includes("payment")){
        return "Billing";
    }
    else if(issue.includes("service") || issue.includes("support")){
        return "Service";
    }
    else{
        return "Other";
    }
}

// -------------------- Index Page: Submission --------------------
if (document.getElementById("complaintForm")) {
    const form = document.getElementById("complaintForm");
    const complaintList = document.getElementById("complaintList");
    const searchInput = document.getElementById("searchInput");
    const voiceBtn = document.getElementById("voiceBtn");

    function displayComplaints(filtered=complaints) {
        complaintList.innerHTML = "";
        filtered.forEach(c => {
            let li = document.createElement("li");
            li.innerText = `${c.name} : ${c.issue} (${c.type} - ${c.priority})`;
            if (c.priority === "High") li.classList.add("high");
            complaintList.appendChild(li);
        });
    }

    displayComplaints();
    function detectPriority(issue){

issue = issue.toLowerCase();

if(issue.includes("down") || issue.includes("not working") || issue.includes("broken") || issue.includes("urgent")){
return "High";
}

else if(issue.includes("slow") || issue.includes("delay") || issue.includes("problem")){
return "Medium";
}

else{
return "Low";
}

}

    // Form submit
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const issue = document.getElementById("issue").value.trim();
        const type = detectIssueType(issue);
        document.getElementById("type").value = type;
        let priority = document.getElementById("priority").value;

if(!priority){
priority = detectPriority(issue);
document.getElementById("priority").value = priority;
}
        const location = document.getElementById("location").value;

        if (!name || !issue || !type || !priority) return showToast("All fields are required!");

        const duplicate = complaints.find(c => c.name === name && c.issue === issue);
        if (duplicate) return showToast("This complaint has already been submitted!");

        const date = new Date().toLocaleString();
        const photoInput = document.getElementById("photo");

const reader = new FileReader();

reader.onload = function(){

const newComplaint = {
name,
issue,
type,
priority,
location,
date,
photo: reader.result
};

complaints.push(newComplaint);
localStorage.setItem("complaints", JSON.stringify(complaints));

// Gamification points
userPoints[name] = (userPoints[name] || 0) + 10;
localStorage.setItem("userPoints", JSON.stringify(userPoints));

displayComplaints();
form.reset();
showToast("Complaint submitted successfully! Points earned: " + userPoints[name]);

};

if(photoInput.files[0]){
reader.readAsDataURL(photoInput.files[0]);
}else{
reader.onload();
}
       
    });

    // Search functionality
    searchInput.addEventListener("input", function(){
        const query = this.value.toLowerCase();
        const filtered = complaints.filter(c => c.name.toLowerCase().includes(query) || c.issue.toLowerCase().includes(query));
        displayComplaints(filtered);
    });

    // Voice Input
    if('webkitSpeechRecognition' in window){
        voiceBtn.addEventListener("click", () => {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = "en-US";
            recognition.start();
            recognition.onresult = function(event){
                const speech = event.results[0][0].transcript;
                document.getElementById("issue").value = speech;
            };
        });
    }
}

// -------------------- Admin Page: Dashboard --------------------
if(document.getElementById("complaintTable")){
    const tableBody = document.querySelector("#complaintTable tbody");
    const filterType = document.getElementById("filterType");
    const filterPriority = document.getElementById("filterPriority");
    const searchInputAdmin = document.getElementById("searchInputAdmin");

    function displayAdminComplaints(){
        tableBody.innerHTML = "";
        let filtered = complaints;
        if(filterType.value!=="All") filtered = filtered.filter(c => c.type===filterType.value);
        if(filterPriority.value!=="All") filtered = filtered.filter(c => c.priority===filterPriority.value);
        if(searchInputAdmin.value){
            const query = searchInputAdmin.value.toLowerCase();
            filtered = filtered.filter(c => c.name.toLowerCase().includes(query) || c.issue.toLowerCase().includes(query));
        }

        filtered.forEach(c => {
            const row = document.createElement("tr");
            row.innerHTML = `
<td>${c.name}</td>
<td>${c.issue}</td>
<td>${c.type}</td>
<td style="color:${c.priority==='High'?'red':c.priority==='Medium'?'orange':'green'}">${c.priority}</td>
<td>${c.date}</td>
<td>${c.photo ? `<img src="${c.photo}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">` : "No Image"}</td>
<td>${c.location || "Not Provided"}</td>
<td>
<button onclick="resolveComplaint(${complaints.indexOf(c)})">✔ Resolve</button>
<button onclick="deleteComplaint(${complaints.indexOf(c)})">🗑 Delete</button>
</td>
`;
            tableBody.appendChild(row);
        });
    }

    displayAdminComplaints();
    filterType.addEventListener("change", displayAdminComplaints);
    filterPriority.addEventListener("change", displayAdminComplaints);
    searchInputAdmin.addEventListener("input", displayAdminComplaints);

    // Chart.js analytics
    const ctx = document.getElementById('complaintChart').getContext('2d');
    function renderChart(){
        const typeCounts = {};
        complaints.forEach(c => typeCounts[c.type] = (typeCounts[c.type]||0)+1);
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(typeCounts),
                datasets:[{
                    label:'Number of Complaints',
                    data:Object.values(typeCounts),
                    backgroundColor:['#6a11cb','#2575fc','#ff0033','#00ff99']
                }]
            },
            options:{
                responsive:true,
                plugins:{legend:{display:false}}
            }
        });
    }
    renderChart();
}

// -------------------- AI Assistant --------------------
if(document.getElementById("chatSend")){
    const chatMessages = document.getElementById("chatMessages");
    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");

const predefinedResponses = {

"hi": "Hello! I'm your AI complaint assistant. I can help you submit complaints.",

"hello": "Hello! How can I help you today?",

"how": "To submit a complaint, fill in your Name, Issue, Type and Priority then click Submit Complaint.",

"network": "If your problem is related to WiFi or internet, choose Type: Network.",

"internet": "Internet problems fall under Network complaints.",

"wifi": "WiFi issues should be reported as Network complaints.",

"service": "Service complaints are related to staff support or maintenance.",

"billing": "Billing complaints are related to payments or charges.",

"payment": "Payment problems should be reported under Billing.",

"location": "You can click 'Get Live Location' to automatically detect your location.",

"priority": "High priority means urgent issues. Medium is moderate and Low is minor issues.",

"complaint": "To report a complaint, fill the form above and click Submit Complaint.",

"submit": "After filling the complaint form, click Submit Complaint to send it.",

"default": "I can help you submit complaints. Ask me about network, billing, service, location or how to submit a complaint."

};
        
    chatSend.addEventListener("click", function(){
        const userMsg = chatInput.value.toLowerCase();
        const msgDiv = document.createElement("div");
        msgDiv.innerText = "You: " + chatInput.value;
        chatDivScroll(msgDiv);

        let response = predefinedResponses["default"];
        for(let key in predefinedResponses){
            if(userMsg.includes(key)){
                response = predefinedResponses[key];
                break;
            }
        }

        const aiMsgDiv = document.createElement("div");
        aiMsgDiv.innerText = "AI: " + response;
        aiMsgDiv.style.fontWeight = "bold";
        chatDivScroll(aiMsgDiv);

        chatInput.value = "";
    });

    function chatDivScroll(el){
        chatMessages.appendChild(el);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}
function getLocation(){

if(navigator.geolocation){

navigator.geolocation.getCurrentPosition(function(position){

const latitude = position.coords.latitude;
const longitude = position.coords.longitude;

document.getElementById("location").value = latitude + ", " + longitude;

});

}else{

alert("Geolocation is not supported by this browser.");

}

}
function resolveComplaint(index){
complaints[index].status="Done";
localStorage.setItem("complaints",JSON.stringify(complaints));
alert("Complaint Resolved");
location.reload();
}

function deleteComplaint(index){
complaints.splice(index,1);
localStorage.setItem("complaints",JSON.stringify(complaints));
alert("Complaint Deleted");
location.reload();
}