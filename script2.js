const svg = document.getElementById('svg');

// 🧭 Начальные параметры
let viewBox = { x: -200, y: -200, width: 400, height: 400 };
let zoomFactor = 1.1;
let panStep = 20;

// 📦 Применить viewBox
function updateViewBox() {
  svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
}

// 🔘 Кнопки масштабирования
document.getElementById('zoomIn').addEventListener('click', () => {
  const factor = 1 / zoomFactor;
  viewBox.x = viewBox.x + viewBox.width * (1 - factor) / 2;
  viewBox.y = viewBox.y + viewBox.height * (1 - factor) / 2;
  viewBox.width *= factor;
  viewBox.height *= factor;
  updateViewBox();
});

document.getElementById('zoomOut').addEventListener('click', () => {
  const factor = zoomFactor;
  viewBox.x = viewBox.x + viewBox.width * (1 - factor) / 2;
  viewBox.y = viewBox.y + viewBox.height * (1 - factor) / 2;
  viewBox.width *= factor;
  viewBox.height *= factor;
  updateViewBox();
});

// 🔘 Кнопки перемещения
document.getElementById('panLeft').addEventListener('click', () => {
  viewBox.x -= panStep;
  updateViewBox();
});
document.getElementById('panRight').addEventListener('click', () => {
  viewBox.x += panStep;
  updateViewBox();
});
document.getElementById('panUp').addEventListener('click', () => {
  viewBox.y -= panStep;
  updateViewBox();
});
document.getElementById('panDown').addEventListener('click', () => {
  viewBox.y += panStep;
  updateViewBox();
});

// 🔧 Инициализация
updateViewBox();


