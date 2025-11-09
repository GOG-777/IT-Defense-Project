// Check if logged in
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

const user = getUser();
let allCourses = [];
let enrolledCourseIds = [];
let enrolledCourses = [];
let selectedCourse = null;
const MAX_CREDITS = 24;

// Load all courses
async function loadCourses() {
    try {
        const loadingElement = document.getElementById('loading');
        const coursesGrid = document.getElementById('coursesGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingElement) loadingElement.classList.remove('hidden');
        if (coursesGrid) coursesGrid.innerHTML = '';
        if (emptyState) emptyState.classList.add('hidden');
        
        console.log('Loading courses from API...');
        
        // Load courses for student's level only
        const coursesResponse = await fetch(`${API_BASE_URL}/courses?level=${user.level}`);
        console.log('Courses response status:', coursesResponse.status);
        
        if (!coursesResponse.ok) {
            throw new Error('Failed to fetch courses');
        }
        
        const coursesData = await coursesResponse.json();
        console.log('Courses data:', coursesData);
        allCourses = coursesData.courses || [];
        
        // Load enrolled courses
        const enrolledResponse = await apiRequest('/enrollments/my-courses');
        console.log('Enrolled response status:', enrolledResponse.status);
        
        const enrolledData = await enrolledResponse.json();
        console.log('Enrolled data:', enrolledData);
        
        enrolledCourseIds = (enrolledData.enrollments || [])
            .filter(e => e.status === 'enrolled')
            .map(e => e.id);

        enrolledCourses = (enrolledData.enrollments || [])
            .filter(e => e.status === 'enrolled');
        
        console.log('Enrolled course IDs:', enrolledCourseIds);
        
        if (loadingElement) loadingElement.classList.add('hidden');
        displayCourses(allCourses);
        updateCreditDisplay();
    } catch (error) {
        console.error('Failed to load courses:', error);
        const loadingElement = document.getElementById('loading');
        if (loadingElement) loadingElement.classList.add('hidden');
        showToast('Failed to load courses. Please check console for details.', 'error');
    }
}

// Calculate total enrolled credits
function getTotalEnrolledCredits() {
    return enrolledCourses.reduce((total, course) => total + (course.credits || 0), 0);
}

// Update credit display in UI
function updateCreditDisplay() {
    const totalCredits = getTotalEnrolledCredits();
    const creditDisplay = document.getElementById('creditDisplay');
    
    if (creditDisplay) {
        const remainingCredits = MAX_CREDITS - totalCredits;
        const progressPercentage = (totalCredits / MAX_CREDITS) * 100;
        
        creditDisplay.innerHTML = `
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/60">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-blue-900 flex items-center">
                            <i class="fas fa-chart-pie mr-2"></i>
                            Credit Progress
                        </h3>
                        <p class="text-blue-700 text-sm">Track your academic load</p>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold ${totalCredits >= MAX_CREDITS ? 'text-red-600' : 'text-blue-600'}">
                            ${totalCredits}<span class="text-gray-500 text-lg">/${MAX_CREDITS}</span>
                        </div>
                        <div class="text-sm ${totalCredits >= MAX_CREDITS ? 'text-red-600' : 'text-blue-600'} font-medium">
                            ${totalCredits >= MAX_CREDITS ? 'Maximum Reached' : `${remainingCredits} credits available`}
                        </div>
                    </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ${
                        totalCredits >= MAX_CREDITS ? 'from-red-500 to-red-600' : ''
                    }" style="width: ${Math.min(progressPercentage, 100)}%"></div>
                </div>
                <p class="text-sm text-gray-600 text-center">
                    ${totalCredits >= MAX_CREDITS ? 
                        'You have reached the maximum credit limit. Drop some courses to enroll in new ones.' :
                        `You can enroll in courses worth ${remainingCredits} more credits.`
                    }
                </p>
            </div>
        `;
    }
}

// Display courses
function displayCourses(courses) {
    const grid = document.getElementById('coursesGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!grid || !emptyState) {
        console.error('Required DOM elements not found');
        return;
    }
    
    console.log('Displaying courses:', courses.length);
    
    if (courses.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    const totalCredits = getTotalEnrolledCredits();
    const remainingCredits = MAX_CREDITS - totalCredits;

    grid.innerHTML = courses.map(course => {
        const isEnrolled = enrolledCourseIds.includes(course.id);
        const courseCredits = course.credits || 0;
        const wouldExceedLimit = totalCredits + courseCredits > MAX_CREDITS;
        const canEnroll = !isEnrolled && !wouldExceedLimit && totalCredits < MAX_CREDITS;
        
        return `
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/60 group overflow-hidden ${
                isEnrolled ? 'border-green-200/60 bg-green-50/30' : 
                wouldExceedLimit ? 'border-red-200/60 bg-red-50/30' : 
                'hover:border-blue-200/60'
            }">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            ${course.course_code.split(' ')[0]}
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            ${isEnrolled ? 
                                '<span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium flex items-center gap-1"><i class="fas fa-check-circle text-xs"></i> Enrolled</span>' :
                                wouldExceedLimit ?
                                '<span class="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium flex items-center gap-1"><i class="fas fa-times-circle text-xs"></i> Credit Limit</span>' :
                                '<span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium flex items-center gap-1"><i class="fas fa-plus-circle text-xs"></i> Available</span>'
                            }
                            <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                ${course.semester === 1 ? '1st' : '2nd'} Sem
                            </span>
                        </div>
                    </div>
                    
                    <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">${course.course_code}</h3>
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">${course.course_name}</h4>
                    
                    <div class="space-y-3 text-sm text-gray-600 mb-6">
                        <div class="flex items-center gap-3">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-coins text-blue-500"></i>
                                <span class="font-medium">${course.credits} Credits</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fas fa-layer-group text-purple-500"></i>
                                <span>Level ${course.level}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${isEnrolled ? 
                        '<button disabled class="w-full bg-gray-300 text-gray-600 px-4 py-3 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center space-x-2"><i class="fas fa-check"></i><span>Already Enrolled</span></button>' :
                        wouldExceedLimit ?
                        `<button disabled class="w-full bg-gray-300 text-gray-600 px-4 py-3 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center space-x-2" title="Enrolling in this course would exceed the ${MAX_CREDITS} credit limit">
                            <i class="fas fa-ban"></i>
                            <span>Credit Limit</span>
                         </button>` :
                        `<button onclick="showEnrollModal(${course.id})" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition duration-300 shadow-lg transform group-hover:scale-[1.02] flex items-center justify-center space-x-2">
                            <i class="fas fa-plus-circle"></i>
                            <span>Enroll Now</span>
                         </button>`
                    }
                    
                    ${wouldExceedLimit && !isEnrolled ? 
                        `<p class="text-red-600 text-xs mt-3 text-center">
                            <i class="fas fa-exclamation-triangle mr-1"></i>
                            Requires ${courseCredits} credits (${remainingCredits} available)
                         </p>` : ''
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Apply filters
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const semesterFilter = document.getElementById('semesterFilter');
    
    if (!searchInput || !semesterFilter) {
        console.error('Filter elements not found');
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase();
    const semesterValue = semesterFilter.value;
    
    let filtered = allCourses;
    
    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(course => 
            course.course_name.toLowerCase().includes(searchTerm) ||
            course.course_code.toLowerCase().includes(searchTerm)
        );
    }
    
    // Semester filter
    if (semesterValue) {
        filtered = filtered.filter(course => course.semester === parseInt(semesterValue));
    }
    
    displayCourses(filtered);
}

// Clear all filters
function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const semesterFilter = document.getElementById('semesterFilter');
    
    if (searchInput) searchInput.value = '';
    if (semesterFilter) semesterFilter.value = '';
    
    displayCourses(allCourses);
    showToast('Filters cleared', 'info');
}

// Show enrollment modal
function showEnrollModal(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    
    selectedCourse = course;
    const totalCredits = getTotalEnrolledCredits();
    const newTotal = totalCredits + (course.credits || 0);
    const remainingAfter = MAX_CREDITS - newTotal;
    
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-200">
            <h4 class="font-bold text-lg text-blue-900">${course.course_code}</h4>
            <p class="text-blue-700 font-semibold">${course.course_name}</p>
            <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div class="flex items-center gap-2">
                    <i class="fas fa-coins text-blue-500"></i>
                    <span>${course.credits} Credits</span>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fas fa-layer-group text-purple-500"></i>
                    <span>Level ${course.level}</span>
                </div>
                <div class="flex items-center gap-2">
                    <i class="fas fa-calendar text-green-500"></i>
                    <span>${course.semester === 1 ? 'First' : 'Second'} Semester</span>
                </div>
            </div>
        </div>
        
        <div class="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 mb-4 border border-yellow-200">
            <div class="flex items-start gap-3">
                <i class="fas fa-chart-line text-yellow-600 text-lg mt-1"></i>
                <div>
                    <p class="font-semibold text-yellow-800 mb-2">Credit Impact</p>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Current Credits:</span>
                            <span class="font-semibold">${totalCredits}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>After Enrollment:</span>
                            <span class="font-semibold">${newTotal}</span>
                        </div>
                        <div class="flex justify-between border-t border-yellow-200 pt-2">
                            <span>Remaining:</span>
                            <span class="font-bold ${remainingAfter >= 0 ? 'text-green-600' : 'text-red-600'}">
                                ${remainingAfter} credits
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <p class="text-gray-700 text-center">Ready to enroll in this course?</p>
    `;
    
    const enrollModal = document.getElementById('enrollModal');
    if (enrollModal) {
        enrollModal.classList.remove('hidden');
    }
}

// Close modal
function closeModal() {
    const enrollModal = document.getElementById('enrollModal');
    if (enrollModal) {
        enrollModal.classList.add('hidden');
    }
    selectedCourse = null;
}

// Confirm enrollment 
async function confirmEnrollment() {
    if (!selectedCourse) return;
    
    try {
        const response = await apiRequest('/enrollments/enroll', {
            method: 'POST',
            body: JSON.stringify({ course_id: selectedCourse.id })
        });

        const data = await response.json();
        
        if (!response.ok) {
            showToast(data.error || 'Enrollment failed', 'error');
            closeModal();
            return;
        }
        
        showToast(`Successfully enrolled in ${selectedCourse.course_code}! 🎉`, 'success');
        closeModal();
        
        // Update UI smoothly without full page reload
        await reloadCoursesSilently();
        
    } catch (error) {
        console.error('Enrollment error:', error);
        showToast('Failed to enroll. Please try again.', 'error');
        closeModal();
    }
}

// Helper function to reload courses without loading state
async function reloadCoursesSilently() {
    try {
        // Reload enrolled courses data
        const enrolledResponse = await apiRequest('/enrollments/my-courses');
        const enrolledData = await enrolledResponse.json();
        
        enrolledCourseIds = (enrolledData.enrollments || [])
            .filter(e => e.status === 'enrolled')
            .map(e => e.id);

        enrolledCourses = (enrolledData.enrollments || [])
            .filter(e => e.status === 'enrolled');
        
        // Update the display
        displayCourses(allCourses);
        updateCreditDisplay();
        
    } catch (error) {
        console.error('Failed to reload courses silently:', error);
        // If silent reload fails, do a full reload
        loadCourses();
    }
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Set user info
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) userNameElement.textContent = user.full_name;
    if (userAvatarElement && user.full_name) {
        userAvatarElement.textContent = user.full_name.charAt(0).toUpperCase();
    }
    
    // Add event listeners
    const searchInput = document.getElementById('searchInput');
    const semesterFilter = document.getElementById('semesterFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (semesterFilter) {
        semesterFilter.addEventListener('change', applyFilters);
    }
    
    // Setup modal event listeners
    const enrollModal = document.getElementById('enrollModal');
    const cancelEnrollBtn = document.getElementById('cancelEnrollBtn');
    
    if (enrollModal) {
        // Close modal when clicking outside
        enrollModal.addEventListener('click', (e) => {
            if (e.target.id === 'enrollModal') {
                closeModal();
            }
        });
    }
    
    if (cancelEnrollBtn) {
        // Close modal when cancel button is clicked
        cancelEnrollBtn.addEventListener('click', closeModal);
    }
    
    console.log('Initializing courses page...');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('User:', user);
    loadCourses();
});