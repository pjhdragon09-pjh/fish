const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const infoDiv = document.getElementById("info");

// 어부 이미지
let isImageLoaded = false;
const fishermanImg = new Image();
fishermanImg.src = "fish.png";

fishermanImg.onload = function () {
    isImageLoaded = true;
};

fishermanImg.onerror = function () {
    isImageLoaded = false;
};

const fisherman = {
    x: canvas.width / 2 - 40,
    y: 50,
    width: 80,
    height: 80
};

// 찌 상태
const bobber = {
    startX: canvas.width / 2,
    startY: 130,
    x: canvas.width / 2,
    y: 130,
    radius: 8,
    state: "idle",
    biteStartTime: 0,
    waitTimer: 0
};

let targetFish = null;
let caughtFishInfo = null;

const fishSpecies = [
    { emoji: "🐟", name: "고등어", minLen: 20, maxLen: 40, minWeg: 0.3, maxWeg: 1.0 },
    { emoji: "🐠", name: "열대어", minLen: 10, maxLen: 25, minWeg: 0.1, maxWeg: 0.5 },
    { emoji: "🐡", name: "복어", minLen: 15, maxLen: 35, minWeg: 0.5, maxWeg: 2.0 },
    { emoji: "🐙", name: "문어", minLen: 30, maxLen: 80, minWeg: 1.5, maxWeg: 5.0 },
    { emoji: "🦈", name: "상어", minLen: 100, maxLen: 250, minWeg: 20.0, maxWeg: 80.0 },
    { emoji: "🐋", name: "고래", minLen: 300, maxLen: 700, minWeg: 150.0, maxWeg: 500.0 }
];

function spawnFish() {
    const species = fishSpecies[Math.floor(Math.random() * fishSpecies.length)];

    const angle = Math.random() * Math.PI * 2;
    const distance = 250;

    const length =
        (species.minLen + Math.random() * (species.maxLen - species.minLen)).toFixed(1);

    const weight =
        (species.minWeg + Math.random() * (species.maxWeg - species.minWeg)).toFixed(2);

    targetFish = {
        x: bobber.x + Math.cos(angle) * distance,
        y: bobber.y + Math.sin(angle) * distance,
        speed: 2.0,
        emoji: species.emoji,
        name: species.name,
        length: length,
        weight: weight
    };
}

canvas.addEventListener("mousedown", function (e) {

    const rect = canvas.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (bobber.state === "success") {
        resetGame();
        return;
    }

    if (bobber.state === "idle" && clickY > 150) {

        bobber.x = clickX;
        bobber.y = clickY;

        bobber.state = "wait";

        bobber.waitTimer =
            Date.now() + (1500 + Math.random() * 2500);

        infoDiv.innerText =
            "👀 물고기가 찌로 다가오길 기다리는 중...";
    }

    else if (bobber.state === "bite") {

        const elapsed =
            Date.now() - bobber.biteStartTime;

        if (elapsed <= 1200) {

            bobber.state = "success";

            caughtFishInfo = {
                ...targetFish
            };

            infoDiv.innerText =
                "🎉 대어를 낚았습니다! 화면을 클릭해 다시 던지세요.";
        }

        else {

            infoDiv.innerText =
                "❌ 너무 늦었습니다! 물고기가 도망쳤습니다.";

            resetGame();
        }
    }

    else if (
        bobber.state === "wait" ||
        bobber.state === "approach"
    ) {

        infoDiv.innerText =
            "💨 물고기가 오기 전에 줄을 당겨 도망쳤습니다!";

        resetGame();
    }
});

function resetGame() {

    bobber.x = bobber.startX;
    bobber.y = bobber.startY;

    bobber.state = "idle";

    targetFish = null;
    caughtFishInfo = null;

    infoDiv.innerText =
        "🎣 바다를 클릭해 찌를 던지고 물고기를 기다리세요!";
}

function animate() {

    requestAnimationFrame(animate);

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const now = Date.now();

    // 하늘
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        150
    );

    // 바다
    ctx.fillStyle = "#1E90FF";
    ctx.fillRect(
        0,
        150,
        canvas.width,
        canvas.height - 150
    );

    // 어부
    if (isImageLoaded) {

        ctx.drawImage(
            fishermanImg,
            fisherman.x,
            fisherman.y,
            fisherman.width,
            fisherman.height
        );

    } else {

        ctx.fillStyle = "#ffe082";

        ctx.fillRect(
            fisherman.x,
            fisherman.y,
            fisherman.width,
            fisherman.height
        );

        ctx.font = "40px sans-serif";

        ctx.fillText(
            "🧑‍✈️",
            fisherman.x + 20,
            fisherman.y + 55
        );
    }

    // 낚싯줄
    if (bobber.state !== "idle") {

        ctx.beginPath();

        ctx.moveTo(
            bobber.startX,
            bobber.startY
        );

        ctx.lineTo(
            bobber.x,
            bobber.y
        );

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    if (bobber.state === "wait") {

        if (now > bobber.waitTimer) {

            spawnFish();

            bobber.state = "approach";
        }
    }

    else if (
        bobber.state === "approach" &&
        targetFish
    ) {

        const dx = bobber.x - targetFish.x;
        const dy = bobber.y - targetFish.y;

        const dist = Math.sqrt(
            dx * dx +
            dy * dy
        );

        if (dist > 8) {

            targetFish.x +=
                (dx / dist) *
                targetFish.speed;

            targetFish.y +=
                (dy / dist) *
                targetFish.speed;

            ctx.fillStyle =
                "rgba(13,71,161,0.4)";

            ctx.beginPath();

            ctx.arc(
                targetFish.x,
                targetFish.y,
                14,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        else {

            bobber.state = "bite";

            bobber.biteStartTime =
                now;

            infoDiv.innerText =
                "❗ 찌가 흔들립니다! 지금 클릭하세요!!";
        }
    }

    else if (bobber.state === "bite") {

        const timeLeft =
            (
                (1200 -
                    (now - bobber.biteStartTime)
                ) / 1000
            ).toFixed(2);

        if (
            now -
            bobber.biteStartTime >
            1200
        ) {

            infoDiv.innerText =
                "💨 아깝다! 물고기가 도망쳤습니다.";

            resetGame();
        }

        else {

            ctx.fillStyle = "red";

            ctx.font =
                "bold 24px sans-serif";

            ctx.fillText(
                `⚠️ 찌가 물 속으로!! 남은시간: ${timeLeft}초`,
                canvas.width / 2 - 180,
                230
            );
        }
    }

    // 찌
    if (
        bobber.state !== "idle" &&
        bobber.state !== "success"
    ) {

        ctx.beginPath();

        ctx.arc(
            bobber.x,
            bobber.y,
            bobber.radius,
            0,
            Math.PI * 2
        );

        if (
            bobber.state === "bite"
        ) {

            ctx.fillStyle =
                Math.floor(now / 80) % 2 === 0
                    ? "#ffeb3b"
                    : "#ff1744";

        } else {

            ctx.fillStyle =
                "#ff4444";
        }

        ctx.fill();
    }

    // 성공창
    if (
        bobber.state === "success" &&
        caughtFishInfo
    ) {

        ctx.fillStyle =
            "rgba(0,0,0,0.85)";

        ctx.fillRect(
            150,
            150,
            500,
            240
        );

        ctx.strokeStyle =
            "#ffeb3b";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            150,
            150,
            500,
            240
        );

        ctx.font =
            "80px sans-serif";

        ctx.textAlign =
            "center";

        ctx.fillText(
            caughtFishInfo.emoji,
            260,
            290
        );

        ctx.textAlign = "left";

        ctx.fillStyle =
            "#ffffff";

        ctx.font =
            "bold 24px sans-serif";

        ctx.fillText(
            `물고기: ${caughtFishInfo.name}`,
            360,
            220
        );

        ctx.fillStyle =
            "#aed581";

        ctx.fillText(
            `길이: ${caughtFishInfo.length} cm`,
            360,
            270
        );

        ctx.fillText(
            `무게: ${caughtFishInfo.weight} kg`,
            360,
            320
        );

        ctx.fillStyle =
            "#ddd";

        ctx.font =
            "14px sans-serif";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "화면을 다시 클릭하면 다음 낚시를 시작합니다.",
            canvas.width / 2,
            365
        );

        ctx.textAlign =
            "left";
    }
}

animate();
