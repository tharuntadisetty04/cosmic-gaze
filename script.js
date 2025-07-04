const apodCard = document.getElementById("apod-card");
const mediaContainer = document.getElementById("media-container");
const apodDate = document.getElementById("apod-date");
const apodTitle = document.getElementById("apod-title");
const apodDesc = document.getElementById("apod-desc");
const hdLinkContainer = document.getElementById("hd-link");
const hdLink = document.querySelector("#hd-link > a");
const controls = document.getElementById("controls");
const prevDayBtn = document.getElementById("prev-day-btn");
const nextDayBtn = document.getElementById("next-day-btn");
const datePicker = document.getElementById("date-picker");
const randomApodBtn = document.getElementById("random-apod-btn");
const loadingSpinner = document.getElementById("loading-spinner");
const errorMessage = document.getElementById("error-message");
const errorDetails = document.getElementById("error-details");
const footer = document.querySelector("footer");
const themeToggleBtn = document.getElementById("theme-toggle");

let currentDate = new Date();

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const showLoading = () => {
  loadingSpinner.style.display = "flex";
  errorMessage.style.display = "none";
};

const hideLoading = () => {
  loadingSpinner.style.display = "none";
};

const showError = (err) => {
  errorMessage.style.display = "block";
  errorDetails.textContent = err?.message || err;
};

const fetchAPOD = async (date = null, isRandom = false) => {
  showLoading();

  let url = "https://nasa-project-server-one.vercel.app/api/apod";
  if (isRandom) {
    url += `?isRandom=true`;
  } else if (date) {
    url += `?date=${date}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();

      if (
        response.status === 404 &&
        errorData.msg &&
        errorData.msg.startsWith("No data available for date:")
      ) {
        showError(
          `NASA has not uploaded today's APOD. Please check back later. \n${errorData?.msg}`
        );

        datePicker.value = formatDate(currentDate);
        return;
      }

      showError(errorData.error?.message || errorData?.msg || "Fetch error");
      throw new Error(
        errorData.error?.message || errorData?.msg || "Fetch error"
      );
    }

    const data = await response.json();
    displayAPOD(data);

    if (!isRandom) {
      datePicker.value = formatDate(currentDate);
    } else {
      currentDate = new Date(data.date);
      datePicker.value = data.date;
    }
  } catch (error) {
    showError(error);
    datePicker.value = formatDate(currentDate);
  } finally {
    hideLoading();
  }
};

const displayAPOD = (data) => {
  apodCard.style.display = "flex";
  controls.style.display = "flex";
  footer.style.display = "block";

  apodDate.textContent = new Date(data.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  apodTitle.textContent = data?.title || "No Title Available";
  apodDesc.textContent = data?.explanation || "No explanation available.";

  if (data.media_type === "image") {
    mediaContainer.innerHTML = `<img src="${data?.url}" alt="${data?.title}"/>`;

    if (data.hdurl) {
      hdLink.href = data.hdurl;
      hdLinkContainer.style.display = "flex";
    } else {
      hdLinkContainer.style.display = "none";
    }
  } else if (data.media_type === "video") {
    mediaContainer.innerHTML = `<iframe src="${data?.url}" allowfullscreen width="768" height="432"></iframe>`;
    hdLinkContainer.style.display = "none";
  } else {
    mediaContainer.innerHTML = "<p>Unsupported media type.</p>";
    hdLinkContainer.style.display = "none";
  }
};

prevDayBtn.addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() - 1);
  fetchAPOD(formatDate(currentDate));
});

nextDayBtn.addEventListener("click", () => {
  if (currentDate.getDate() === new Date().getDate()) {
    showError("There are no images for future dates.");
    window.scrollTo({ top: 0 });
    return;
  }

  currentDate.setDate(currentDate.getDate() + 1);
  fetchAPOD(formatDate(currentDate));
});

datePicker.addEventListener("change", (e) => {
  const selectedDate = new Date(e.target.value);
  const minApodDate = new Date("1995-06-16");

  if (selectedDate < minApodDate) {
    showError(`Minimum available date is ${minApodDate.toDateString()}.`);
    window.scrollTo({ top: 0 });
    datePicker.value = formatDate(currentDate);
    return;
  }
  if (selectedDate > new Date()) {
    showError("Please select today's date or a past date.");
    window.scrollTo({ top: 0 });
    datePicker.value = formatDate(currentDate);
    return;
  }

  currentDate = selectedDate;

  fetchAPOD(formatDate(selectedDate));
});

randomApodBtn.addEventListener("click", () => {
  randomApodBtn.disabled = true;
  fetchAPOD(null, true).finally(() => {
    randomApodBtn.disabled = false;
  });
});

const setTheme = (mode) => {
  if (mode === "light") {
    document.body.classList.add("light-mode");
    localStorage.setItem("theme", "light");
    themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    document.body.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
    themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
  }
};

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-mode");
    setTheme(isLight ? "light" : "dark");
  });
}

(function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    setTheme("dark");
  }
})();

const initializeDatePicker = () => {
  const today = new Date();
  const minDate = new Date("1995-06-16");
  datePicker.value = formatDate(today);
  datePicker.max = formatDate(today);
  datePicker.min = formatDate(minDate);
};

document.addEventListener("DOMContentLoaded", () => {
  initializeDatePicker();
  fetchAPOD(formatDate(currentDate));
});
