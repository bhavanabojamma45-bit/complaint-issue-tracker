function submitComplaint(){

let name = document.getElementById("name").value;
let issue = document.getElementById("issue").value;

// Get old complaints
let complaints = JSON.parse(localStorage.getItem("complaints")) || [];

// Create complaint object
let complaintData = {
name: name,
issue: issue,
status: "Pending"
};

// Add new complaint
complaints.push(complaintData);

// Save back to localStorage
localStorage.setItem("complaints", JSON.stringify(complaints));

alert("Complaint Submitted Successfully");

// Clear input fields
document.getElementById("name").value="";
document.getElementById("issue").value="";

}