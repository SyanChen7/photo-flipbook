const bookElement = document.querySelector("#book");
const pages = bookElement.querySelectorAll(".book-page");
const config = window.PHOTO_FLIPBOOK_CONFIG || {};
if (config.background) document.documentElement.style.setProperty("--desk-background", `url(${JSON.stringify(config.background)})`);
if (config.clothColor) document.documentElement.style.setProperty("--cloth", config.clothColor);
// Decorative page blocks are separate from the library-managed leaves.
for (const side of ["left", "right"]) {
  const stack = document.createElement("span");
  stack.className = `paper-stack ${side}`;
  stack.setAttribute("aria-hidden", "true");
  bookElement.appendChild(stack);
}

const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const pageStatus = document.querySelector("#page-status");
const orientationStatus = document.querySelector("#orientation");
const pageWidth = Number(bookElement.dataset.pageWidth) || 512;
const pageHeight = Number(bookElement.dataset.pageHeight) || 640;
document.documentElement.style.setProperty("--page-ratio", pageWidth / pageHeight);

const pageFlip = new St.PageFlip(bookElement, {
  width: pageWidth,
  height: pageHeight,
  size: "stretch",
  minWidth: Math.max(1, Math.round(pageWidth * 0.56)),
  // The viewport-sized rig controls display size; base dimensions define the ratio.
  maxWidth: Number.MAX_SAFE_INTEGER,
  minHeight: Math.max(1, Math.round(pageHeight * 0.56)),
  maxHeight: Number.MAX_SAFE_INTEGER,
  drawShadow: true,
  flippingTime: 760,
  usePortrait: true,
  startZIndex: 10,
  autoSize: true,
  maxShadowOpacity: 0.42,
  showCover: true,
  mobileScrollSupport: false,
  clickEventForward: true,
  useMouseEvents: true,
  swipeDistance: 24,
  showPageCorners: true,
  disableFlipByClick: false,
});

let currentPage = 0;
let isTurning = false;

// A local, short paper rustle; play only after an intentional user gesture.
const paperSound = document.createElement("audio");
if (config.sound?.enabled && config.sound?.src) paperSound.src = config.sound.src;
paperSound.preload = "auto";
paperSound.volume = Math.max(0, Math.min(1, Number(config.sound?.volume ?? 0.40)));
paperSound.hidden = true;
paperSound.setAttribute("aria-hidden", "true");
document.body.appendChild(paperSound);
let soundArmed = false;
let previousFlipState = "read";
bookElement.addEventListener("pointerdown", () => { soundArmed = true; }, {capture: true});
window.addEventListener("keydown", (event) => {
  if (bookElement.dataset.editing !== "true" && !event.altKey && !event.ctrlKey && !event.metaKey && !isTurning &&
      ["ArrowLeft", "ArrowRight", " "].includes(event.key)) soundArmed = true;
}, {capture: true});
function playPaperSound() {
  if (!config.sound?.enabled || !config.sound?.src) return;
  paperSound.currentTime = 0;
  // Autoplay denial must never interrupt page navigation.
  const playback = paperSound.play();
  if (playback) playback.catch(() => {});
}


function updateControls() {
  const pageCount = pageFlip.getPageCount();
  const lastPage = pageCount - 1;
  const progress = Math.max(0, Math.min(1, currentPage / Math.max(1, lastPage)));
  bookElement.style.setProperty("--left-stack", `${(2 + 6 * progress).toFixed(2)}px`);
  bookElement.style.setProperty("--right-stack", `${(8 - 6 * progress).toFixed(2)}px`);
  bookElement.dataset.edge = currentPage === 0 ? "front" : currentPage === lastPage ? "back" : "inside";

  previousButton.disabled = currentPage === 0 || isTurning;
  nextButton.disabled = currentPage === lastPage || isTurning;

  if (currentPage === 0) {
    pageStatus.textContent = "封面";
  } else if (currentPage === lastPage) {
    pageStatus.textContent = "封底";
  } else {
    pageStatus.textContent = `${String(currentPage + 1).padStart(2, "0")} / ${String(pageCount).padStart(2, "0")}`;
  }
}

pageFlip.on("flip", (event) => {
  currentPage = Number(event.data);
  updateControls();
});

pageFlip.on("changeState", (event) => {
  if (event.data === "flipping" && previousFlipState !== "flipping" && soundArmed) {
    soundArmed = false;
    playPaperSound();
  }
  if (event.data === "read") soundArmed = false;
  previousFlipState = event.data;
  isTurning = event.data !== "read";
  updateControls();
});

function updateOrientation(orientation) {
  bookElement.dataset.layout = orientation;
  orientationStatus.textContent = orientation === "portrait" ? "单页阅读" : "双页阅读";
}

pageFlip.on("init", (event) => updateOrientation(event.data.mode));
pageFlip.on("changeOrientation", (event) => updateOrientation(event.data));

pageFlip.loadFromHTML(pages);
updateControls();

const requestedPage = Number(new URLSearchParams(location.search).get("page"));
if (Number.isInteger(requestedPage) && requestedPage >= 0 && requestedPage < pages.length) {
  pageFlip.turnToPage(requestedPage);
}

previousButton.addEventListener("click", () => {
  if (!isTurning) pageFlip.flipPrev("bottom");
});

nextButton.addEventListener("click", () => {
  if (!isTurning) pageFlip.flipNext("bottom");
});

window.addEventListener("keydown", (event) => {
  if (bookElement.dataset.editing === "true" || event.target.isContentEditable || /^(INPUT|TEXTAREA)$/.test(event.target.tagName) || event.altKey || event.ctrlKey || event.metaKey || isTurning) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    pageFlip.flipPrev("bottom");
  }

  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    pageFlip.flipNext("bottom");
  }

  if (event.key === "Home") pageFlip.turnToPage(0);
  if (event.key === "End") pageFlip.turnToPage(pageFlip.getPageCount() - 1);
});
