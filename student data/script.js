$(document).ready(function () {

    let currentPage = 1;
    let currentLimit = parseInt($('#recordsPerPage').val()) || 5;
    let currentSortBy = 'rollno';
    let currentOrder = 'ASC';
    let currentSearch = '';
    let currentViewType = 'active'; // 'active' or 'recycle'

    const defaultSvgAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='42' height='42' viewBox='0 0 24 24' fill='%23cccccc'><circle cx='12' cy='8' r='4'/><path d='M12 14c-6.1 0-8 4-8 4h16s-1.9-4-8-4z'/></svg>";

    // Lightbox Modal
    if ($('#imagePreviewModal').length === 0) {
        $('body').append(`
            <style>
                .image-preview-modal {
                    display: none;
                    position: fixed;
                    z-index: 99999;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.85);
                    align-items: center;
                    justify-content: center;
                }
                .image-preview-content {
                    max-width: 85%;
                    max-height: 85%;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                    object-fit: contain;
                }
                .image-preview-close {
                    position: absolute;
                    top: 20px;
                    right: 30px;
                    color: #ffffff;
                    font-size: 35px;
                    font-weight: bold;
                    cursor: pointer;
                    user-select: none;
                }
                .image-preview-close:hover {
                    color: #ff4d4d;
                }
                .profile-img {
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                .profile-img:hover {
                    transform: scale(1.1);
                }
            </style>
            <div id="imagePreviewModal" class="image-preview-modal">
                <span id="closeImagePreview" class="image-preview-close">&times;</span>
                <img id="fullImagePreview" class="image-preview-content" src="" alt="Full Preview">
            </div>
        `);
    }

    // Load Students Data
    function loadStudents(page = 1, limit = 5, sortBy = 'rollno', order = 'ASC', search = '') {
        currentPage = page;
        currentLimit = limit;
        currentSortBy = sortBy;
        currentOrder = order;
        currentSearch = search;

        $.ajax({
            url: 'get_all_students.php',
            method: 'GET',
            data: { 
                page: currentPage, 
                limit: currentLimit,
                sort_by: currentSortBy,
                order: currentOrder,
                search: currentSearch,
                view_type: currentViewType
            },
            dataType: 'json'
        })
        .done(function (response) {
            if (response.status === 'success') {
                renderStudentTable(response.data);
                updateSortUI();
                renderPagination(response.pagination);
            } else {
                $('#studentTableBody').html(`<tr><td colspan="7" style="text-align:center; color:red;">${response.message}</td></tr>`);
            }
        })
        .fail(function () {
            $('#studentTableBody').html(`<tr><td colspan="7" style="text-align:center; color:red;">Failed to fetch student data. Check server connection.</td></tr>`);
        });
    }

    // Render Table Body
    function renderStudentTable(students) {
        const $tbody = $('#studentTableBody');
        let htmlContent = '';
        
        if (!students || students.length === 0) {
            const noMsg = (currentViewType === 'recycle') ? 'Recycle bin is empty.' : 'No matching students found.';
            $tbody.html(`<tr><td colspan="7" style="text-align:center;">${noMsg}</td></tr>`);
            $('#pageControls').empty();
            updatePageSelectDropdown(0, 1);
            return;
        }

        $.each(students, function (index, student) {
            let imgSrc = defaultSvgAvatar;
            let rawPath = '';
            
            if (student.image_path && student.image_path.trim() !== '' && student.image_path !== 'uploads/default.png') {
                rawPath = student.image_path;
                imgSrc = student.image_path + '?t=' + new Date().getTime();
            }

            let actionBtns = '';
            if (currentViewType === 'active') {
                actionBtns = `
                    <button type="button" class="btn-edit edit-btn" 
                        data-rollno="${student.rollno}"
                        data-name="${student.name}"
                        data-standard="${student.standard}"
                        data-email="${student.email}"
                        data-phone="${student.phone}"
                        data-image="${student.image_path || ''}">Edit</button>
                    <button type="button" class="btn-delete delete-btn" 
                        data-rollno="${student.rollno}">Delete</button>
                `;
            } else {
                actionBtns = `
                    <button type="button" class="btn-restore restore-btn" data-rollno="${student.rollno}">Restore</button>
                    <button type="button" class="btn-perm-delete perm-delete-btn" data-rollno="${student.rollno}">Delete</button>
                `;
            }

            htmlContent += `
                <tr id="row-${student.rollno}">
                    <td class="col-profile">
                        <img src="${imgSrc}" class="profile-img" alt="Profile" data-fullimg="${rawPath}" onerror="this.onerror=null; this.src='${defaultSvgAvatar}';">
                    </td>
                    <td>${student.rollno}</td>
                    <td>${student.name}</td>
                    <td>${student.standard}</td>
                    <td>${student.email}</td>
                    <td>${student.phone}</td>
                    <td class="col-action">${actionBtns}</td>
                </tr>
            `;
        });

        $tbody.html(htmlContent);
    }

    // Toggle Recycle Bin View
    $('#toggleRecycleBtn').on('click', function () {
        if (currentViewType === 'active') {
            currentViewType = 'recycle';
            $(this).html('View All Students').addClass('active-view');
            $('#pageSectionTitle').text('Recycle Bin (Deleted Students)');
            $('#openAddModalBtn').hide();
        } else {
            currentViewType = 'active';
            $(this).html('Recycle Bin').removeClass('active-view');
            $('#pageSectionTitle').text('All Students');
            $('#openAddModalBtn').show();
        }
        loadStudents(1, currentLimit, currentSortBy, currentOrder, currentSearch);
    });

    // Image Lightbox
    $(document).on('click', '.profile-img', function () {
        const fullImgSrc = $(this).data('fullimg') || $(this).attr('src');
        if (fullImgSrc && !fullImgSrc.startsWith('data:image/svg+xml')) {
            $('#fullImagePreview').attr('src', fullImgSrc);
            $('#imagePreviewModal').css('display', 'flex');
        }
    });

    $(document).on('click', '#closeImagePreview, #imagePreviewModal', function (e) {
        if (e.target !== $('#fullImagePreview')[0]) {
            $('#imagePreviewModal').hide();
        }
    });

    // Open Edit Modal
    $(document).on('click', '.edit-btn', function () {
        const student = $(this).data();
        openModal();
        $('#mode').val('update');
        $('#modalTitle').text('Edit Student (Roll No ' + student.rollno + ')');
        $('#rollno').val(student.rollno).prop('readonly', true);
        $('#name').val(student.name);
        $('#standard').val(student.standard);
        $('#email').val(student.email);
        $('#phone').val(student.phone);
        
        const imgPath = student.image || '';
        $('#existing_image').val(imgPath);

        if (imgPath && imgPath.trim() !== '' && imgPath !== 'uploads/default.png') {
            $('#currentImagePreview').html(`
                <div style="margin-top: 6px; font-size: 12px;">
                    Current File: <a href="${imgPath}" target="_blank" style="color:#007bff; font-weight:bold; text-decoration:underline;">View File</a>
                </div>
            `);
        } else {
            $('#currentImagePreview').html('<div style="margin-top: 6px; font-size: 12px; color:#777;">No profile picture uploaded.</div>');
        }
    });

    // Validation Helpers
    function showError(field, message) { $('#' + field + 'Error').text(message); }
    function clearError(field) { $('#' + field + 'Error').text(''); }
    function clearAllErrors() { ['rollno', 'name', 'standard', 'email', 'phone'].forEach(clearError); }

    function validateEmailField() {
        const emailVal = $('#email').val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal) { showError('email', 'Email is required.'); return false; }
        if (!emailRegex.test(emailVal)) { showError('email', 'Please enter a valid email address.'); return false; }
        clearError('email'); return true;
    }

    function validatePhoneField() {
        const phoneVal = $('#phone').val().trim();
        if (!phoneVal) { showError('phone', 'Phone number is required.'); return false; }
        if (phoneVal.length !== 10) { showError('phone', 'Phone number must be 10 digits.'); return false; }
        clearError('phone'); return true;
    }

    $('#email').on('input keyup blur', validateEmailField);
    $('#phone').on('input keyup blur', function () { this.value = this.value.replace(/\D/g, ''); validatePhoneField(); });
    $('#rollno, #name, #standard').on('input keyup blur', function () {
        if ($(this).val().trim() !== '') clearError($(this).attr('id'));
    });

    function validateForm() {
        let isValid = true;
        if (!$('#rollno').val().trim()) { showError('rollno', 'Roll No is required.'); isValid = false; } else clearError('rollno');
        if (!$('#name').val().trim()) { showError('name', 'Name is required.'); isValid = false; } else clearError('name');
        if (!$('#standard').val().trim()) { showError('standard', 'Standard is required.'); isValid = false; } else clearError('standard');
        if (!validateEmailField()) isValid = false;
        if (!validatePhoneField()) isValid = false;
        return isValid;
    }

    // Save Form
    $('#contactForm').on('submit', function (e) {
        e.preventDefault();
        if (!validateForm()) return;

        const formData = new FormData(this);
        const $btn = $('#submitBtn').prop('disabled', true);

        $.ajax({
            url: $(this).attr('action'),
            method: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            dataType: 'json'
        })
        .done(function (response) {
            if (response.status === 'success') {
                closeModal();
                showGlobalAlert('success', response.message || 'Saved successfully.');
                loadStudents(currentPage, currentLimit, currentSortBy, currentOrder, currentSearch);
            } else {
                showAlert(response.message || 'Error processing request.');
            }
        })
        .fail(function () {
            showAlert('Server error occurred.');
        })
        .always(function () {
            $btn.prop('disabled', false);
        });
    });

    // Soft Delete (Move to Recycle Bin)
    $(document).on('click', '.delete-btn', function () {
        const rollno = $(this).data('rollno');
        if (confirm('Move student Roll No ' + rollno + ' to Recycle Bin?')) {
            $.ajax({
                url: 'delete_student.php',
                method: 'POST',
                data: { rollno: rollno },
                dataType: 'json'
            })
            .done(function (response) {
                if (response.status === 'success') {
                    showGlobalAlert('success', response.message);
                    loadStudents(currentPage, currentLimit, currentSortBy, currentOrder, currentSearch);
                } else {
                    showGlobalAlert('error', response.message);
                }
            });
        }
    });

    // Restore Student
    $(document).on('click', '.restore-btn', function () {
        const rollno = $(this).data('rollno');
        $.ajax({
            url: 'restore_student.php',
            method: 'POST',
            data: { rollno: rollno, action: 'restore' },
            dataType: 'json'
        })
        .done(function (response) {
            if (response.status === 'success') {
                showGlobalAlert('success', response.message);
                loadStudents(currentPage, currentLimit, currentSortBy, currentOrder, currentSearch);
            } else {
                showGlobalAlert('error', response.message);
            }
        });
    });

    // Permanent Delete
    $(document).on('click', '.perm-delete-btn', function () {
        const rollno = $(this).data('rollno');
        if (confirm('Permanently delete student Roll No ' + rollno + '? This cannot be undone!')) {
            $.ajax({
                url: 'restore_student.php',
                method: 'POST',
                data: { rollno: rollno, action: 'permanent_delete' },
                dataType: 'json'
            })
            .done(function (response) {
                if (response.status === 'success') {
                    showGlobalAlert('success', response.message);
                    loadStudents(currentPage, currentLimit, currentSortBy, currentOrder, currentSearch);
                } else {
                    showGlobalAlert('error', response.message);
                }
            });
        }
    });

    // Search Debounce
    let searchTimeout;
    $('#searchInput').on('keyup input', function () {
        clearTimeout(searchTimeout);
        const query = $(this).val().trim();
        searchTimeout = setTimeout(function () {
            loadStudents(1, currentLimit, currentSortBy, currentOrder, query);
        }, 300);
    });

    // Sort Handler
    $('.student-table th.sortable').on('click', function () {
        const sortBy = $(this).data('sort');
        let order = (sortBy === currentSortBy && currentOrder === 'ASC') ? 'DESC' : 'ASC';
        loadStudents(currentPage, currentLimit, sortBy, order, currentSearch);
    });

    function updateSortUI() {
        $('.student-table th.sortable').each(function () {
            const col = $(this).data('sort');
            const $up = $(this).find('.sort-up').removeClass('active');
            const $down = $(this).find('.sort-down').removeClass('active');
            if (col === currentSortBy) {
                if (currentOrder === 'ASC') $up.addClass('active');
                else $down.addClass('active');
            }
        });
    }

    // Pagination Controls
    function updatePageSelectDropdown(totalPages, activePage) {
        const $pageSelect = $('#pageSelect').empty();
        if (totalPages <= 0) { $pageSelect.append('<option value="1">Page 1</option>'); return; }
        for (let i = 1; i <= totalPages; i++) {
            $pageSelect.append(`<option value="${i}" ${i === activePage ? 'selected' : ''}>Page ${i}</option>`);
        }
    }

    function renderPagination(meta) {
        updatePageSelectDropdown(meta.total_pages, meta.page);
        const $controls = $('#pageControls').empty();
        if (meta.total_pages <= 0) return;

        $controls.append(`<button class="page-btn" ${meta.page === 1 ? 'disabled' : ''} id="prevPage">Previous</button>`);
        for (let i = 1; i <= meta.total_pages; i++) {
            $controls.append(`<button class="page-btn ${i === meta.page ? 'active' : ''}" data-page="${i}">${i}</button>`);
        }
        $controls.append(`<button class="page-btn" ${meta.page === meta.total_pages ? 'disabled' : ''} id="nextPage">Next</button>`);
    }

    $('#recordsPerPage').on('change', function () { loadStudents(1, parseInt($(this).val()), currentSortBy, currentOrder, currentSearch); });
    $('#pageSelect').on('change', function () { loadStudents(parseInt($(this).val()), currentLimit, currentSortBy, currentOrder, currentSearch); });
    $(document).on('click', '.page-btn[data-page]', function () { loadStudents(parseInt($(this).data('page')), currentLimit, currentSortBy, currentOrder, currentSearch); });
    $(document).on('click', '#prevPage', function () { if (currentPage > 1) loadStudents(currentPage - 1, currentLimit, currentSortBy, currentOrder, currentSearch); });
    $(document).on('click', '#nextPage', function () { loadStudents(currentPage + 1, currentLimit, currentSortBy, currentOrder, currentSearch); });

    // Modal Helpers
    function openModal() { $('#studentModal').css('display', 'flex'); }
    function closeModal() { $('#studentModal').hide(); resetFormFields(); $('#formAlert').hide(); }

    $('#openAddModalBtn').on('click', function () {
        openModal();
        $('#mode').val('insert');
        $('#modalTitle').text('Add Student');
        $('#rollno').prop('readonly', false);
    });

    $('#cancelBtn').on('click', closeModal);

    function resetFormFields() {
        $('#mode').val('insert');
        $('#contactForm')[0].reset();
        $('#existing_image').val('');
        $('#currentImagePreview').empty();
        $('#rollno').prop('readonly', false);
        clearAllErrors();
    }

    function showGlobalAlert(type, message) {
        const $banner = $('#globalAlert');
        $banner.removeClass('alert-banner-success alert-banner-error')
               .addClass(type === 'success' ? 'alert-banner-success' : 'alert-banner-error')
               .text(message)
               .slideDown();

        setTimeout(() => $banner.slideUp(), 3000);
    }

    function showAlert(message) { $('#formAlert').text(message).show(); }

    loadStudents(currentPage, currentLimit, currentSortBy, currentOrder, currentSearch);
});