const logoutButton = document.getElementById("logout");

logoutButton.addEventListener("click", async () => {
  const data = await fetch("http://localhost:3000/logout");
  const parsedData = await data.json();

  if(parsedData.success) {
    window.location = "http://localhost:3000/login"; 
  }
});
