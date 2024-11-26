const camera = document.getElementById("camera");
const playerGesture = document
  .getElementById("player-gesture")
  .querySelector("img");
const cpuGesture = document
  .getElementById("cpu-gesture")
  .querySelector("img");
const winnerText = document.getElementById("winner");
const scoreText = document.getElementById("score");
const countdownText = document.getElementById("countdown");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");

// أصوات اللعبة
const timerSound = document.getElementById("timer-sound");
const winSound = document.getElementById("win-sound");
const loseSound = document.getElementById("lose-sound");
const tieSound = document.getElementById("tie-sound");

// تشغيل الكاميرا
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    camera.srcObject = stream;
  })
  .catch((error) => {
    console.error("Error accessing the camera:", error);
  });

// إرسال إطار الكاميرا إلى الخادم
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

// تحديث إيماءة اللاعب بشكل دائم
setInterval(sendFrame, 1000);

// العد التنازلي وبدء اللعبة
function startCountdown() {
  let count = 3;
  countdownText.textContent = count;
  countdownText.style.visibility = "visible";
  timerSound.play();

  const countdownInterval = setInterval(() => {
    count -= 1;
    if (count > 0) {
      countdownText.textContent = count;
    } else {
      clearInterval(countdownInterval);
      countdownText.style.visibility = "hidden";

      // بدء اللعبة بعد انتهاء العداد التنازلي
      startGame();
    }
  }, 1000);
}

// بدء اللعبة
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

    // تحديث صور الإيماءات والنتائج
    cpuGesture.src = `/static/${data.cpu_choice.toLowerCase()}.png`;
    winnerText.textContent = `Winner: ${data.winner}`;

    // تشغيل الصوت بناءً على النتيجة
    if (data.winner === "You win!") {
      winSound.play();
    } else if (data.winner === "CPU wins!") {
      loseSound.play();
    } else if (data.winner === "Tie!") {
      tieSound.play();
    }

    // تحديث النقاط باستخدام الدالة الجديدة
    updateScores(data.player_score, data.cpu_score);
  } catch (error) {
    console.error("Error in startGame:", error);
  }
}

// تحديث النقاط عند انتهاء اللعبة
function updateScores(playerPoints, cpuPoints) {
  document.getElementById("player-score").textContent = playerPoints;
  document.getElementById("cpu-score").textContent = cpuPoints;
}

// إعادة تعيين اللعبة
resetButton.addEventListener("click", async () => {
  try {
    const response = await fetch("/reset_game", { method: "POST" });

    if (!response.ok) {
      throw new Error("Failed to reset game");
    }

    const data = await response.json();

    // إعادة تعيين الصور والنصوص
    playerGesture.src = "/static/rock.png";
    cpuGesture.src = "/static/rock.png";
    winnerText.textContent = "Winner: None";

    // إعادة تعيين النقاط
    updateScores(0, 0);
  } catch (error) {
    console.error("Error in resetGame:", error);
  }
});

// زر بدء اللعبة
startButton.addEventListener("click", startCountdown);
