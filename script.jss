const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3NM3WDDArJI8H4CvbfA5Bu2VJSHvYES9CvvaPdMFSE3oQj4SeYujRRwZ6nhgcFDgJ/exec";
let currentQuestions = [];
let userAnswers = {}; // Stores { questionIndex: selectedOptionIndex }
let timerInterval;
let timeLeft = 3600; // 60 mins

async function loadData(action, params = "") {
    const res = await fetch(`${SCRIPT_URL}?action=${action}${params}`);
    return await res.json();
}

// 1. Load Courses on startup
async function init() {
    const courses = await loadData("getCourses");
    const container = document.getElementById('course-list');
    courses.slice(1).forEach(c => {
        container.innerHTML += `
            <div class="course-card">
                <img src="${c[5]}">
                <h4>${c[1]}</h4>
                <div class="price-row"><span class="p-now">₹${c[4]}</span> <span class="p-old">₹${c[3]}</span></div>
                <button onclick="openCourse('${c[0]}')">Get Course</button>
            </div>
        `;
    });
}

// 2. Open Course / Show Tests
async function openCourse(courseId) {
    showView('test-list-view');
    const tests = await loadData("getTests", `&courseId=${courseId}`);
    const container = document.getElementById('test-items-container');
    container.innerHTML = "";
    tests.forEach(t => {
        container.innerHTML += `
            <div class="course-card" onclick="startTest('${t[3]}')">
                <b>${t[2]}</b> <i class="fa fa-chevron-right" style="float:right"></i>
            </div>
        `;
    });
}

// 3. Start Test Logic
async function startTest(sheetName) {
    showView('quiz-view');
    const data = await loadData("getQuestions", `&sheetName=${sheetName}`);
    currentQuestions = data.slice(1);
    renderQuestion(0);
    startTimer();
}

let currentIndex = 0;
function renderQuestion(index) {
    currentIndex = index;
    const q = currentQuestions[index];
    document.getElementById('que-counter').innerText = `${index + 1} / ${currentQuestions.length}`;
    let html = `<h3>${q[1]}</h3>`;
    for(let i=1; i<=4; i++) {
        const selected = userAnswers[index] === i ? 'selected' : '';
        html += `<div class="option ${selected}" onclick="selectOption(${index}, ${i})">${q[i+1]}</div>`;
    }
    document.getElementById('question-box').innerHTML = html;
}

function selectOption(qIdx, optIdx) {
    userAnswers[qIdx] = optIdx;
    renderQuestion(qIdx);
}

function nextQue() { if(currentIndex < currentQuestions.length - 1) renderQuestion(currentIndex + 1); }
function prevQue() { if(currentIndex > 0) renderQuestion(currentIndex - 1); }

// 4. Timer Logic
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        let min = Math.floor(timeLeft / 60);
        let sec = timeLeft % 60;
        document.getElementById('timer').innerText = `${min}:${sec < 10 ? '0' : ''}${sec}`;
        if(timeLeft <= 0) finishQuiz();
    }, 1000);
}

// 5. Result Analysis Logic
function finishQuiz() {
    clearInterval(timerInterval);
    showView('result-view');
    
    let correct = 0, wrong = 0, skipped = 0;
    let analysisHtml = "<h3>Detailed Analysis</h3>";

    currentQuestions.forEach((q, i) => {
        const correctOpt = parseInt(q[6].replace('op',''));
        const userOpt = userAnswers[i];
        
        if(!userOpt) skipped++;
        else if(userOpt === correctOpt) correct++;
        else wrong++;

        // Build Analysis UI
        analysisHtml += `
            <div class="analysis-item">
                <p>Q${i+1}: ${q[1]}</p>
                <p class="correct-ans">Correct: ${q[correctOpt+1]}</p>
                ${userOpt && userOpt !== correctOpt ? `<p class="wrong-ans">Your Answer: ${q[userOpt+1]}</p>` : ''}
            </div>
        `;
    });

    document.getElementById('final-score').innerText = correct;
    document.getElementById('stat-c').innerText = correct;
    document.getElementById('stat-w').innerText = wrong;
    document.getElementById('analysis-box').innerHTML = analysisHtml;
}

function showAnalysis() {
    document.getElementById('analysis-box').classList.toggle('hidden');
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

window.onload = init;
function renderCourseCard(course) {
    return `
        <div class="course-card" onclick="openCourse('${course[0]}')">
            <img src="${course[5]}" alt="${course[1]}">
            <div class="course-info">
                <div class="tag-row">
                    <span class="tag tag-live">LIVE CLASS</span>
                    <span class="tag tag-test">50+ TESTS</span>
                </div>
                <h4 class="course-title">${course[1]}</h4>
                <div class="instructor">By ${course[2]}</div>
                <div class="price-box">
                    <div>
                        <span style="font-size: 18px; font-weight: 700; color: #1e293b;">₹${course[4]}</span>
                        <span style="font-size: 12px; text-decoration: line-through; color: #94a3b8; margin-left: 5px;">₹${course[3]}</span>
                    </div>
                    <button class="buy-now-btn">Enroll</button>
                </div>
            </div>
        </div>
    `;
}
