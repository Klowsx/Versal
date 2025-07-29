document.addEventListener("DOMContentLoaded", () => {
  const countdownElement = document.getElementById("countdown");
  let secondsLeft = 5;

  const interval = setInterval(() => {
    secondsLeft--;
    countdownElement.textContent = secondsLeft;

    if (secondsLeft <= 0) {
      clearInterval(interval);
      window.location.href = "/frontend/modules/main/dashboard.html";
    }
  }, 1000);
});
