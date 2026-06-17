const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const infoDiv = document.getElementById("info");

// 바탕화면 어부 이미지 설정
let isImageLoaded = false;
const fishermanImg = new Image();
fishermanImg.src = "fish.png"; 

fishermanImg.onload = function() {
    isImageLoaded = true;
};
fishermanImg.onerror = function() {
    isImageLoaded = false; 
};

const fisherman = { x: canvas.width / 2 - 40, y: 50, width: 80, height: 80 };

// 찌 상태 ("idle", "wait", "approach", "bite", "success")
const bobber = {
    startX: canvas.width / 2, startY: 130,
    x: canvas.width / 2, y: 130, radius: 8,
    state: "idle",
    biteStartTime: 0,
    waitTimer: 0
};

let targetFish = null;
let caughtFishInfo = null; 

// 플레이 기록 데이터 변수
const stats = {
    totalCaught: 0,
    maxScore: 0,
    maxLenRecord: 0,
    combo: 0
};

// 다양한 물고기 이모지 데이터
const fishSpecies = [
    { emoji: "🐟", name: "고등어", minLen: 20, maxLen: 40, minWeg: 0.3, maxWeg: 1.0, baseScore: 100 },
    { emoji: "🐠", name: "열대어", minLen: 10, maxLen: 25, minWeg: 0.1, maxWeg: 0.5, baseScore: 150 },
    { emoji: "🐡", name: "복어", minLen: 15, maxLen: 35, minWeg: 0.5, maxWeg: 2.0, baseScore: 200 },
    { emoji: "🐙", name: "문어", minLen: 30, maxLen: 80, minWeg: 1.5, maxWeg: 5.0, baseScore: 300 },
    { emoji: "🦈", name: "상어", minLen: 100, maxLen: 250, minWeg: 20.0, maxWeg: 80.0, baseScore: 700 },
    { emoji: "🐋", name: "고래", minLen: 300, maxLen: 700, minWeg: 150.0, maxWeg: 500.0, baseScore: 1500 }
];

function spawnFish() {
    const species = fishSpecies[Math.floor(Math.random() * fishSpecies.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = 250; 
    
    let length = (species.minLen + Math.random() * (species.maxLen - species.minLen));
    let weight = (species.minWeg + Math.random() * (species.maxWeg - species.minWeg));
    let score = species.baseScore;

    // 5%의 확률로 특수 황금 버프 어종 등장!
    const isGolden = Math.random() < 0.05;
    let fishName = species.name;
    let fishEmoji = species.emoji;

    if (isGolden) {
        fishName = "✨황금 " + fishName;
        length *= 1.5; 
        weight *= 1.5; 
        score *= 3;    
    }

    targetFish = {
        x: bobber.x + Math.cos(angle) * distance,
        y: bobber.y + Math.sin(angle) * distance,
        speed: isGolden ? 3.3 : 2.3, 
        emoji: fishEmoji,
        name: fishName,
        length: length.toFixed(1),
        weight: weight.toFixed(2),
        score: Math.round(score),
        isGolden: isGolden,
        isPerfect: false 
    };
}

// 클릭 이벤트
canvas.addEventListener("mousedown", function(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 1. 성공 창 띄워진 상태라면 무조건 리셋
    if (bobber.state === "success") {
        resetGame();
        return;
    }

    // 2. 대기 모드에서 바다 영역(y: 150 이상)을 눌렀을 때만 던지기 유효
    if (bobber.state === "idle") {
        if (clickY >= 140) { 
            bobber.x = clickX;
            bobber.y = clickY;
            bobber.state = "wait";
            bobber.waitTimer = Date.now() + (1500 + Math.random() * 2000); 
            infoDiv.innerText = "👀 물고기가 찌로 다가오길 기다리는 중...";
        } else {
            infoDiv.innerText = "⚠️ 찌는 하늘이 아니라 바다에 던져야 합니다!";
        }
        return;
    }

    // 3. 입질 타이밍 챔질 판정
    if (bobber.state === "bite") {
        const elapsed = Date.now() - bobber.biteStartTime;
        if (elapsed <= 1200) {
            bobber.state = "success";
            caughtFishInfo = { ...targetFish };
            
            // 0.3초 이내 클릭 시 PERFECT 판정 보너스
            if (elapsed <= 300) {
                caughtFishInfo.isPerfect = true;
                caughtFishInfo.score *= 2;
            }

            stats.totalCaught++;
            stats.combo++;
            const comboBonus = Math.floor(caughtFishInfo.score * (stats.combo - 1) * 0.1);
            stats.maxScore += (caughtFishInfo.score + comboBonus);
            
            if (parseFloat(caughtFishInfo.length) > stats.maxLenRecord) {
                stats.maxLenRecord = parseFloat(caughtFishInfo.length);
            }

            const perfectText = caughtFishInfo.isPerfect ? " [PERFECT!!]" : "";
            infoDiv.innerText = `🎉 성공! ${caughtFishInfo.name}${perfectText} 획득! (+${caughtFishInfo.score}점)`;
        } else {
            infoDiv.innerText = "❌ 너무 늦었습니다! 물고기가 도망쳤습니다.";
            stats.combo = 0; 
            resetGame();
        }
        return;
    }

    // 4. 물고기가 아직 입질 안 했는데 성급하게 눌렀을 때 실패 처리
    if (bobber.state === "wait" || bobber.state === "approach") {
        infoDiv.innerText = "💨 물고기가 오기 전에 줄을 당겨 도망쳤습니다!";
        stats.combo = 0; 
        resetGame();
    }
});

function resetGame() {
    bobber.x = bobber.startX;
    bobber.y = bobber.startY;
    bobber.state = "idle";
    targetFish = null;
    caughtFishInfo = null;
    infoDiv.innerText = "🎣 바다를 클릭해 찌를 던지고 물고기를 기다리세요!";
}

// 게임 루프
function animate() {
    requestAnimationFrame(animate);
    ctx.save(); 

    const now = Date.now();

    // 입질 상태일 때 격렬한 화면 흔들림(진동) 연출
    if (bobber.state === "bite") {
        const shakeX = (Math.random() - 0.5) * 6;
        const shakeY = (Math.random() - 0.5) * 6;
        ctx.translate(shakeX, shakeY);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 기본 (하늘)
    ctx.fillStyle = "#87CEEB"; ctx.fillRect(0, 0, canvas.width, 150);
    
    // 뒤쪽 연두색 큰 산 
    ctx.fillStyle = "rgba(156, 204, 101, 0.6)";
    ctx.beginPath();
    ctx.moveTo(450, 150);  
    ctx.lineTo(650, 30);   
    ctx.lineTo(850, 150);  
    ctx.fill();

    // 앞쪽 초록색 작은 산
    ctx.fillStyle = "rgba(76, 175, 80, 0.85)";
    ctx.beginPath();
    ctx.moveTo(550, 150);  
    ctx.lineTo(720, 60);   
    ctx.lineTo(850, 150);  
    ctx.fill();

    // 바다 채우기
    ctx.fillStyle = "#1E90FF"; ctx.fillRect(0, 150, canvas.width, canvas.height - 150);

    // 좌측 상단 도감/대시보드 UI 출력 연출
    ctx.fillStyle = "rgba(0, 60, 100, 0.4)";
    ctx.fillRect(15, 15, 230, 105);
    ctx.strokeStyle = "#006064";
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, 230, 105);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`🏆 총 낚은 횟수: ${stats.totalCaught}회`, 30, 38);
    ctx.fillText(`✨ 최대 길이 기록: ${stats.maxLenRecord.toFixed(1)} cm`, 30, 60);
    ctx.fillText(`💰 누적 점수: ${stats.maxScore} pt`, 30, 82);
    
    if (stats.combo > 1) {
        ctx.fillStyle = "#ffeb3b";
        ctx.font = "italic bold 14px sans-serif";
        ctx.fillText(`🔥 ${stats.combo} COMBO 연속!`, 30, 105);
    }

    // 어부 그리기
    if (isImageLoaded) {
        ctx.drawImage(fishermanImg, fisherman.x, fisherman.y, fisherman.width, fisherman.height);
    } else {
        ctx.fillStyle = "#ffe082";
        ctx.fillRect(fisherman.x, fisherman.y, fisherman.width, fisherman.height);
        ctx.font = "40px sans-serif";
        ctx.fillText("🧑‍✈️", fisherman.x + 20, fisherman.y + 55);
    }

    // 낚싯줄
    if (bobber.state !== "idle") {
        ctx.beginPath();
        ctx.moveTo(bobber.startX, bobber.startY);
        ctx.lineTo(bobber.x, bobber.y);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // 상태 처리
    if (bobber.state === "wait") {
        if (now > bobber.waitTimer) {
            spawnFish();
            bobber.state = "approach";
        }
    }
    
    else if (bobber.state === "approach" && targetFish) {
        const dx = bobber.x - targetFish.x;
        const dy = bobber.y - targetFish.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 8) {
            targetFish.x += (dx / dist) * targetFish.speed;
            targetFish.y += (dy / dist) * targetFish.speed;
            
            ctx.fillStyle = targetFish.isGolden ? "rgba(255, 235, 59, 0.7)" : "rgba(13, 71, 161, 0.4)";
            ctx.beginPath();
            ctx.arc(targetFish.x, targetFish.y, targetFish.isGolden ? 18 : 14, 0, Math.PI * 2);
            ctx.fill();
            
            if (targetFish.isGolden) {
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        } else {
            bobber.state = "bite";
            bobber.biteStartTime = now;
            infoDiv.innerText = "❗ 찌가 흔들립니다! 지금 클릭하세요!!";
        }
    }
    
    else if (bobber.state === "bite") {
        const timeLeft = ((1200 - (now - bobber.biteStartTime)) / 1000).toFixed(2);
        if (now - bobber.biteStartTime > 1200) {
            infoDiv.innerText = "💨 아깝다! 물고기가 도망쳤습니다.";
            stats.combo = 0; 
            resetGame();
        } else {
            ctx.fillStyle = "red";
            ctx.font = "bold 24px sans-serif";
            ctx.fillText(`⚠️ 찌가 물 속으로!!  남은시간: ${timeLeft}초`, canvas.width / 2 - 180, 230);
        }
    }

    // 찌 그리기
    if (bobber.state !== "idle" && bobber.state !== "success") {
        ctx.beginPath();
        ctx.arc(bobber.x, bobber.y, bobber.radius, 0, Math.PI * 2);
        
        if (bobber.state === "bite") {
            ctx.fillStyle = (Math.floor(now / 100) % 2 === 0) ? "yellow" : "red";
        } else {
            ctx.fillStyle = "orange";
        }
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // 낚시 성공 시 계측 결과 오버레이 팝업보드 렌더링
    if (bobber.state === "success" && caughtFishInfo) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 140, 400, 270);
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = caughtFishInfo.isGolden ? "#ffd700" : "#00ecc1";
        ctx.strokeRect(canvas.width / 2 - 200, canvas.height / 2 - 140, 400, 270);

        ctx.font = "65px sans-serif";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText(종류: ${caughtFishInfo.name}, canvas.width / 2, canvas.height / 2 - 5);
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#e0f7fa";
        ctx.fillText(체장(길이): ${caughtFishInfo.length} cm, canvas.width / 2, canvas.height / 2 + 25);ctx.fillText(중량(무게): ${caughtFishInfo.weight} kg, canvas.width / 2, canvas.height / 2 + 50);
        if (caughtFishInfo.isPerfect) {
            ctx.fillStyle = "#ff5252";ctx.font = "bold 16px sans-serif";
            ctx.fillText("⚡ PERFECT TIMING! (점수 2배) ⚡", canvas.width / 2, canvas.height / 2 + 75);
                                      
        } else {
            ctx.fillStyle = "#ffeb3b";
        }
        const currentBonus = Math.floor(caughtFishInfo.score * (stats.combo - 1) * 0.1);
        ctx.font = "18px sans-serif";
        ctx.fillText(획득 점수: +${caughtFishInfo.score + currentBonus} pt, canvas.width / 2, canvas.height / 2 + (caughtFishInfo.isPerfect ? 100 : 85));
        ctx.font = "13px sans-serif";ctx.fillStyle = "#80deea";
        ctx.fillText("다시 하려면 화면을 클릭하세요.", canvas.width / 2, canvas.height / 2 + 120);
        ctx.textAlign = "left";}ctx.restore();
}
animate();
        ctx.textAlign = "center";
        ctx.fillText(caughtFishInfo.emoji, canvas.width / 2, canvas.height / 2 - 60);

        ctx.fillStyle = caughtFishInfo.isGolden ? "#ffd700" : "#ffffff";
