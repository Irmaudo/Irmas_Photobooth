// ----------------- ELEMENTEN -----------------
const video = document.getElementById("video");
const captureBtn = document.getElementById("capture-btn");
const photosContainer = document.getElementById("photos");
const timerInput = document.getElementById("timer");
const countdownEl = document.getElementById("countdown");

// ----------------- GRAIN IMAGE -----------------
const grainImg = new Image();
grainImg.src = "images/krassen.jpg";

// ----------------- CAMERA TOEGANG -----------------
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    video.play();

    // Voeg live subtiele grain toe als video klaar is
    video.addEventListener("loadedmetadata", addLiveGrain);
  })
  .catch((err) => {
    console.error("Camera error:", err);
    alert("Kon de camera niet openen. Controleer permissies!");
  });

// ----------------- LIVE GRAIN -----------------
function addLiveGrain() {
    const overlay = document.createElement("canvas");
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    overlay.style.position = "absolute";
    overlay.style.top = video.offsetTop + "px";
    overlay.style.left = video.offsetLeft + "px";
    overlay.style.width = video.offsetWidth + "px";
    overlay.style.height = video.offsetHeight + "px";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "5";
    video.parentElement.appendChild(overlay);
    const octx = overlay.getContext("2d");

    function draw() {
        octx.clearRect(0, 0, overlay.width, overlay.height);
        octx.globalAlpha = 0.05; // subtiel
        octx.drawImage(grainImg, 0, 0, overlay.width, overlay.height);
        octx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    draw();
}

// ----------------- FOTO CAPTURE MET COUNTDOWN -----------------
captureBtn.addEventListener("click", () => {
  let timer = Number(timerInput.value) || 0;

  if (timer > 0) {
    captureBtn.disabled = true;
    countdownEl.style.display = "block";

    let countdownNumber = timer;
    countdownEl.textContent = countdownNumber;

    const interval = setInterval(() => {
      countdownNumber--;
      if (countdownNumber > 0) {
        countdownEl.textContent = countdownNumber;
      } else {
        clearInterval(interval);
        countdownEl.textContent = "";
        countdownEl.style.display = "none";
        captureBtn.disabled = false;
        takePhoto();
      }
    }, 1000);

  } else {
    takePhoto();
  }
});

// ----------------- FUNCTIE OM FOTO TE MAKEN MET GRAIN -----------------
function takePhoto() {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // Spiegelbeeld
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Teken video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Pixels filteren (grayscale, sepia, contrast, brightness, saturate)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Grayscale 90%
        const gray = r*0.033 + g*0.033 + b*0.033 + 0.9*(r+g+b)/3;

        // Sepia 30%
        const sepiaR = gray*0.7 + 0.3*(r*0.393 + g*0.769 + b*0.189);
        const sepiaG = gray*0.7 + 0.3*(r*0.349 + g*0.686 + b*0.168);
        const sepiaB = gray*0.7 + 0.3*(r*0.272 + g*0.534 + b*0.131);

        // Contrast 120%
        const factor = (259 * (120 + 255)) / (255 * (259 - 120));
        let rC = factor*(sepiaR-128)+128;
        let gC = factor*(sepiaG-128)+128;
        let bC = factor*(sepiaB-128)+128;

        // Brightness 0.7
        rC *= 0.7; gC *= 0.7; bC *= 0.7;

        // Saturate 0.2
        const avg = (rC + gC + bC)/3;
        const saturateFactor = 0.6;
        rC = avg + (rC - avg) * saturateFactor;
        gC = avg + (gC - avg) * saturateFactor;
        bC = avg + (bC - avg) * saturateFactor;

        // Clamp waarden
        data[i] = Math.min(255, Math.max(0, rC));
        data[i+1] = Math.min(255, Math.max(0, gC));
        data[i+2] = Math.min(255, Math.max(0, bC));
    }

    ctx.putImageData(imgData, 0, 0);

    // Subtiele grain toevoegen
    ctx.globalAlpha = 0.05; // subtiel
    ctx.drawImage(grainImg, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    // Maak foto zichtbaar en downloadbaar
    const dataURL = canvas.toDataURL("image/png");

    const photoDiv = document.createElement("div");
    photoDiv.classList.add("photo");

    const img = document.createElement("img");
    img.src = dataURL;
    photoDiv.appendChild(img);

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download";
    downloadBtn.addEventListener("click", () => {
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = "photo.png";
        a.click();
    });
    photoDiv.appendChild(downloadBtn);

    photosContainer.appendChild(photoDiv);
}




  


