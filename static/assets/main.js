const camera = document.getElementById("camera");
const playerGesture = document
  .getElementById("player-gesture")
  .querySelector("img");
const cpuGesture = document.getElementById("cpu-gesture").querySelector("img");
const winnerText = document.getElementById("winner");
const scoreText = document.getElementById("score");
const countdownText = document.getElementById("countdown");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");

const timerSound = document.getElementById("timer-sound");
const winSound = document.getElementById("win-sound");
const loseSound = document.getElementById("lose-sound");
const tieSound = document.getElementById("tie-sound");

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    camera.srcObject = stream;
  })
  .catch((error) => {
    console.error("Error accessing the camera:", error);
  });

async function sendFrame() {

  const canvas = document.createElement("canvas");
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  const context = canvas.getContext("2d");
  context.drawImage(camera, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("frame", blob);

    try {
      const response = await fetch("/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to detect gesture");
      }

      const data = await response.json();
      const gesture = data.gesture;
      playerGesture.src = `/static/${gesture.toLowerCase()}.png`;
    } catch (error) {
      console.error("Error in sendFrame:", error);
    }
  }, "image/jpeg");
}


setInterval(()=>{
  const dotter = document.querySelector(".dotter");
  dotter.classList.add("show");
  setTimeout(() => {
    dotter.classList.remove("show");
  }, 1000);
},2000)

setInterval(sendFrame, 1000);

function startCountdown() {
  let count = 3;
  countdownText.textContent = count;
  countdownText.style.visibility = "visible";
  timerSound.play();

  playerGesture.src = "/static/nothing.png";
  cpuGesture.src = "/static/nothing.png";

  const countdownInterval = setInterval(() => {
    count -= 1;
    if (count > 0) {
      countdownText.textContent = count;
    } else {
      clearInterval(countdownInterval);
      countdownText.style.visibility = "hidden";

      startGame();
    }
  }, 1000);
}

async function startGame() {
  try {
    const response = await fetch("/start_game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error("Failed to start game");
    }

    const data = await response.json();

    cpuGesture.src = `/static/${data.cpu_choice.toLowerCase()}.png`;
    playerGesture.src = `/static/${data.player_choice.toLowerCase()}.png`;
    winnerText.textContent = `Winner: ${data.winner}`;

    if (data.winner === "You win!") {
      winSound.play();
    } else if (data.winner === "CPU wins!") {
      loseSound.play();
    } else if (data.winner === "Tie!") {
      tieSound.play();
    }

    updateScores(data.player_score, data.cpu_score);
    setTimeout(() => {
      playerGesture.src = "/static/nothing.png";
      cpuGesture.src = "/static/nothing.png";
    }, 3000);
  } catch (error) {
    console.error("Error in startGame:", error);
  }
}

function updateScores(playerPoints, cpuPoints) {
  document.getElementById("player-score").textContent = playerPoints;
  document.getElementById("cpu-score").textContent = cpuPoints;
}

resetButton.addEventListener("click", async () => {
  try {
    const response = await fetch("/reset_game", { method: "POST" });

    if (!response.ok) {
      throw new Error("Failed to reset game");
    }

    const data = await response.json();

    playerGesture.src = "/static/rock.png";
    cpuGesture.src = "/static/rock.png";
    winnerText.textContent = "Winner: None";

    updateScores(0, 0);
  } catch (error) {
    console.error("Error in resetGame:", error);
  }
});

startButton.addEventListener("click", startCountdown);
