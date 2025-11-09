// Check if logged in
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

const user = getUser();
let currentLevel = user.level || 100;
let currentCalculationType = 'semester1';
let userScores = JSON.parse(localStorage.getItem('cgpaScores')) || {};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Set user info
    const userNameElement = document.getElementById('userName');
    if (userNameElement) userNameElement.textContent = user.full_name;
    
    // Set user level
    const userLevelDisplay = document.getElementById('userLevelDisplay');
    if (userLevelDisplay) userLevelDisplay.textContent = currentLevel;

    // Add event listeners
    const calculationType = document.getElementById('calculationType');
    if (calculationType) {
        calculationType.addEventListener('change', function() {
            currentCalculationType = this.value;
            loadCoursesForCalculation();
        });
    }

    // Close modal when clicking outside
    const clearModal = document.getElementById('clearConfirmationModal');
    if (clearModal) {
        clearModal.addEventListener('click', (e) => {
            if (e.target.id === 'clearConfirmationModal') {
                closeClearModal();
            }
        });
    }

    // Load initial courses
    loadCoursesForCalculation();
});

// Load courses based on calculation type
function loadCoursesForCalculation() {
    const tableBody = document.getElementById('coursesTableBody');
    const tableTitle = document.getElementById('tableTitle');
    
    if (!tableBody) return;

    tableBody.innerHTML = '';

    let coursesToShow = [];
    let title = '';

    switch (currentCalculationType) {
        case 'semester1':
            coursesToShow = coursesDatabase[currentLevel]?.['1'] || [];
            title = `Level ${currentLevel} - First Semester Courses`;
            break;
        case 'semester2':
            coursesToShow = coursesDatabase[currentLevel]?.['2'] || [];
            title = `Level ${currentLevel} - Second Semester Courses`;
            break;
        case 'cgpa':
            // Show both semesters for CGPA calculation
            const sem1Courses = coursesDatabase[currentLevel]?.['1'] || [];
            const sem2Courses = coursesDatabase[currentLevel]?.['2'] || [];
            coursesToShow = [...sem1Courses, ...sem2Courses];
            title = `Level ${currentLevel} - All Courses (CGPA Calculation)`;
            break;
    }

    if (tableTitle) {
        tableTitle.textContent = title;
    }

    if (coursesToShow.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <div class="text-4xl mb-2">📚</div>
                    <p class="text-lg font-medium">No courses found for Level ${currentLevel}</p>
                    <p class="text-sm">Please check if this level exists in the course database.</p>
                </td>
            </tr>
        `;
        return;
    }

    // Populate table with courses
    coursesToShow.forEach(course => {
        const courseKey = `${currentLevel}-${course.code}`;
        const savedScore = userScores[courseKey] || '';
        const gradeInfo = savedScore ? getGradeFromScore(savedScore) : null;
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition duration-150';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${course.code}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900">${course.title}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 font-medium">${course.credits}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value="${savedScore}"
                    oninput="updateGrade('${courseKey}', this.value, ${course.credits})"
                    class="score-input w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0-100"
                >
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium ${gradeInfo ? getGradeColor(gradeInfo.grade) : 'text-gray-500'}" id="grade-${courseKey}">
                    ${gradeInfo ? gradeInfo.grade : '-'}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 font-medium" id="point-${courseKey}">
                    ${gradeInfo ? gradeInfo.point : '0'}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 font-medium" id="qp-${courseKey}">
                    ${gradeInfo ? (course.credits * gradeInfo.point) : '0'}
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update grade when score changes with strict validation
function updateGrade(courseKey, score, credits) {
    const inputElement = event.target;
    let isValid = true;
    
    // Validate score
    if (score === '' || score === null) {
        // Empty score is valid (user cleared it)
        delete userScores[courseKey];
        resetInputStyle(inputElement);
    } else {
        const numericScore = parseInt(score);
        
        // Check if it's a valid number between 0 and 100
        if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
            isValid = false;
            setInputErrorStyle(inputElement);
            showToast('Score must be between 0 and 100', 'error');
            
            // Don't save invalid score
            inputElement.value = '';
            delete userScores[courseKey];
        } else {
            // Valid score
            userScores[courseKey] = numericScore;
            resetInputStyle(inputElement);
        }
    }
    
    localStorage.setItem('cgpaScores', JSON.stringify(userScores));

    // Calculate and update grade only for valid scores
    if (isValid && score !== '' && score !== null) {
        const gradeInfo = getGradeFromScore(score);
        
        const gradeElement = document.getElementById(`grade-${courseKey}`);
        const pointElement = document.getElementById(`point-${courseKey}`);
        const qpElement = document.getElementById(`qp-${courseKey}`);

        if (gradeElement && pointElement && qpElement) {
            gradeElement.textContent = gradeInfo.grade;
            gradeElement.className = `text-sm font-medium ${getGradeColor(gradeInfo.grade)}`;
            pointElement.textContent = gradeInfo.point;
            qpElement.textContent = credits * gradeInfo.point;
        }
    } else {
        // Reset display for invalid/cleared scores
        const gradeElement = document.getElementById(`grade-${courseKey}`);
        const pointElement = document.getElementById(`point-${courseKey}`);
        const qpElement = document.getElementById(`qp-${courseKey}`);

        if (gradeElement && pointElement && qpElement) {
            gradeElement.textContent = '-';
            gradeElement.className = 'text-sm font-medium text-gray-500';
            pointElement.textContent = '0';
            qpElement.textContent = '0';
        }
    }
}

// Set error style for invalid input
function setInputErrorStyle(inputElement) {
    inputElement.classList.add('border-red-500', 'bg-red-50', 'text-red-900');
    inputElement.classList.remove('border-gray-300', 'bg-white', 'text-gray-900');
}

// Reset input style to normal
function resetInputStyle(inputElement) {
    inputElement.classList.remove('border-red-500', 'bg-red-50', 'text-red-900');
    inputElement.classList.add('border-gray-300', 'bg-white', 'text-gray-900');
}

// Get color for grade display
function getGradeColor(grade) {
    const colors = {
        'A': 'text-green-600',
        'B': 'text-blue-600',
        'C': 'text-yellow-600',
        'D': 'text-orange-600',
        'E': 'text-red-500',
        'F': 'text-red-600'
    };
    return colors[grade] || 'text-gray-500';
}

// Calculate results with validation
function calculateResults() {
    let totalCredits = 0;
    let totalQualityPoints = 0;
    let coursesInCalculation = [];
    let hasInvalidScores = false;
    let invalidInputs = [];

    // Determine which courses to include in calculation
    switch (currentCalculationType) {
        case 'semester1':
            coursesInCalculation = coursesDatabase[currentLevel]?.['1'] || [];
            break;
        case 'semester2':
            coursesInCalculation = coursesDatabase[currentLevel]?.['2'] || [];
            break;
        case 'cgpa':
            const sem1 = coursesDatabase[currentLevel]?.['1'] || [];
            const sem2 = coursesDatabase[currentLevel]?.['2'] || [];
            coursesInCalculation = [...sem1, ...sem2];
            break;
    }

    // First pass: Validate all scores
    coursesInCalculation.forEach(course => {
        const courseKey = `${currentLevel}-${course.code}`;
        const score = userScores[courseKey];
        const inputElement = document.querySelector(`input[oninput*="${courseKey}"]`);
        
        if (score !== undefined && score !== null && score !== '') {
            const numericScore = parseInt(score);
            if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
                hasInvalidScores = true;
                if (inputElement) {
                    setInputErrorStyle(inputElement);
                    invalidInputs.push(course.code);
                }
            } else if (inputElement) {
                resetInputStyle(inputElement);
            }
        }
    });

    // If invalid scores found, show error and stop calculation
    if (hasInvalidScores) {
        const errorMessage = invalidInputs.length > 0 
            ? `Invalid scores in: ${invalidInputs.join(', ')}. Scores must be between 0 and 100.`
            : 'Some scores are invalid. Scores must be between 0 and 100.';
        
        showToast(errorMessage, 'error');
        
        // Highlight the results panel in red if it's visible
        const resultsPanel = document.getElementById('resultsPanel');
        if (resultsPanel && !resultsPanel.classList.contains('hidden')) {
            resultsPanel.classList.add('bg-red-50', 'border-red-200');
            setTimeout(() => {
                resultsPanel.classList.remove('bg-red-50', 'border-red-200');
            }, 3000);
        }
        
        return;
    }

    // Second pass: Calculate totals (only if all scores are valid)
    coursesInCalculation.forEach(course => {
        const courseKey = `${currentLevel}-${course.code}`;
        const score = userScores[courseKey];
        
        if (score && !isNaN(score)) {
            const gradeInfo = getGradeFromScore(score);
            totalCredits += course.credits;
            totalQualityPoints += course.credits * gradeInfo.point;
        }
    });

    // Calculate final result
    let finalResult = 0;
    if (totalCredits > 0) {
        finalResult = totalQualityPoints / totalCredits;
    }

    // Display results
    displayResults(totalCredits, totalQualityPoints, finalResult);
}

// Display calculation results
function displayResults(totalCredits, totalQualityPoints, finalResult) {
    const resultsPanel = document.getElementById('resultsPanel');
    const resultsTitle = document.getElementById('resultsTitle');
    const totalCreditsElement = document.getElementById('totalCredits');
    const totalQualityPointsElement = document.getElementById('totalQualityPoints');
    const resultTypeElement = document.getElementById('resultType');
    const finalResultElement = document.getElementById('finalResult');

    if (resultsPanel) {
        resultsPanel.classList.remove('hidden');
        resultsPanel.classList.remove('bg-red-50', 'border-red-200');
        resultsPanel.classList.add('bg-green-50', 'border-green-200');
    }

    let title = '';
    let resultType = '';

    switch (currentCalculationType) {
        case 'semester1':
            title = `First Semester GPA Results - Level ${currentLevel}`;
            resultType = 'GPA';
            break;
        case 'semester2':
            title = `Second Semester GPA Results - Level ${currentLevel}`;
            resultType = 'GPA';
            break;
        case 'cgpa':
            title = `Cumulative GPA (CGPA) Results - Level ${currentLevel}`;
            resultType = 'CGPA';
            break;
    }

    if (resultsTitle) resultsTitle.textContent = title;
    if (totalCreditsElement) totalCreditsElement.textContent = totalCredits;
    if (totalQualityPointsElement) totalQualityPointsElement.textContent = totalQualityPoints.toFixed(2);
    if (resultTypeElement) resultTypeElement.textContent = resultType;
    if (finalResultElement) finalResultElement.textContent = finalResult.toFixed(2);
}

// Clear all scores with modal confirmation instead of popup
function clearAllScores() {
    // Create modal if it doesn't exist
    let clearModal = document.getElementById('clearConfirmationModal');
    
    if (!clearModal) {
        clearModal = document.createElement('div');
        clearModal.id = 'clearConfirmationModal';
        clearModal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        clearModal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <h3 class="text-2xl font-bold mb-4 text-gray-900">Clear All Scores</h3>
                <div class="mb-6">
                    <p class="text-gray-700">Are you sure you want to clear all scores?</p>
                    <p class="text-gray-600 text-sm mt-2">This action cannot be undone.</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="confirmClearScores()" class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium">
                        Clear All
                    </button>
                    <button onclick="closeClearModal()" class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(clearModal);
    }
    
    clearModal.classList.remove('hidden');
}

// Close clear modal
function closeClearModal() {
    const clearModal = document.getElementById('clearConfirmationModal');
    if (clearModal) {
        clearModal.classList.add('hidden');
    }
}

// Confirm clear scores
function confirmClearScores() {
    userScores = {};
    localStorage.removeItem('cgpaScores');
    loadCoursesForCalculation();
    
    const resultsPanel = document.getElementById('resultsPanel');
    if (resultsPanel) {
        resultsPanel.classList.add('hidden');
    }
    
    closeClearModal();
    showToast('All scores cleared successfully', 'success');
}

// Save results (placeholder - can be enhanced)
function saveResults() {
    showToast('Results saved successfully!', 'success');
    // Here you could implement saving to a database or generating a PDF
}

// Premium Toast notification function
function showToast(message, type = 'info') {
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    const bgGradient = type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                      type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                      'bg-gradient-to-r from-blue-500 to-indigo-600';
    
    const icon = type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle';
    
    toast.className = `toast-notification fixed top-6 right-6 ${bgGradient} text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform transition-all duration-500 translate-x-full flex items-center space-x-3 min-w-80`;
    toast.innerHTML = `
        <i class="fas ${icon} text-xl"></i>
        <span class="font-medium">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
        toast.classList.add('translate-x-0');
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 500);
    }, 4000);
}