document.addEventListener('DOMContentLoaded', function() {
  const yearElement = document.querySelector('.year');
  const months = document.querySelectorAll('.months span');
  const numDate = document.querySelector('.num-date');
  const dayElement = document.querySelector('.day');
  const daysContainer = document.querySelector('.num-dates');

  const currentDate = new Date();
  let currentYear = currentDate.getFullYear();
  let currentMonth = currentDate.getMonth(); // 0-indexed
  const currentDay = currentDate.getDate();
  const currentDayName = currentDate.toLocaleString('default', { weekday: 'long' });

  // Set the year
  yearElement.textContent = currentYear;

  // Highlight the current month
  function highlightCurrentMonth() {
    months.forEach((month, index) => {
      if (index === currentMonth) {
        month.classList.add('month-color');
      } else {
        month.classList.remove('month-color');
      }
    });
  }
  highlightCurrentMonth();

  // Set the current date and day
  numDate.textContent = currentDay;
  dayElement.textContent = currentDayName.toUpperCase();

  // Function to generate the calendar dates
  function generateCalendarDates() {
    daysContainer.innerHTML = ''; // Clear existing dates

    // Calculate the start day of the month and total days in the month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate(); // Last day of the previous month

    // Fill the dates before the 1st of the month (from the previous month)
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const prevDateSpan = document.createElement('span');
      prevDateSpan.textContent = daysInPrevMonth - i;
      prevDateSpan.classList.add('grey'); // Add a class to style these dates differently if needed
      daysContainer.appendChild(prevDateSpan);
    }

    // Fill the dates of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateSpan = document.createElement('span');

      if (i === currentDay && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear()) {
        dateSpan.classList.add('active-day');
      }
      
      dateSpan.textContent = i;
      daysContainer.appendChild(dateSpan);
    }

    // Fill the dates after the last day of the month (from the next month)
    const totalCells = daysContainer.children.length;
    const remainingDays = 42 - totalCells; // 6 rows * 7 columns = 42 grid cells
    for (let i = 1; i <= remainingDays; i++) {
      const nextDateSpan = document.createElement('span');
      nextDateSpan.textContent = i;
      nextDateSpan.classList.add('grey'); // Add a class to style these dates differently if needed
      daysContainer.appendChild(nextDateSpan);
    }
  }

  // Generate the initial calendar
  generateCalendarDates();

  // Year navigation (when clicking the triangles)
  document.querySelector('.triangle-left').addEventListener('click', function() {
    changeYear(-1); // Directly change the year by decreasing it
  });

  document.querySelector('.triangle-right').addEventListener('click', function() {
    changeYear(1); // Directly change the year by increasing it
  });

  function changeYear(offset) {
    currentYear += offset;
    updateCalendar(); // Update the calendar after changing the year
  }

  // Month navigation (optional, if you still want to navigate by month)
  function changeMonth(offset) {
    currentMonth += offset;

    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    } else if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }

    updateCalendar();
  }

  function updateCalendar() {
    yearElement.textContent = currentYear; // Update the displayed year
    highlightCurrentMonth(); // Ensure the current month is still highlighted correctly

    // Regenerate the calendar dates for the new month and year
    generateCalendarDates();
  }

  // Add event listener to each month span for user interaction
  months.forEach((month, index) => {
    month.addEventListener('click', function() {
      currentMonth = index;
      updateCalendar();
    });
  });

});