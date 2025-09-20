// Global variables
let currentTab = 'dashboard';
let properties = [];
let units = [];
let tenants = [];
let bills = [];
let payments = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    setupEventListeners();
});

function setupEventListeners() {
    // Form submissions
    document.getElementById('add-property-form').addEventListener('submit', handleAddProperty);
    document.getElementById('add-unit-form').addEventListener('submit', handleAddUnit);
    document.getElementById('add-tenant-form').addEventListener('submit', handleAddTenant);
    document.getElementById('add-bill-form').addEventListener('submit', handleAddBill);
    document.getElementById('add-payment-form').addEventListener('submit', handleAddPayment);
}

// Tab switching
function showDashboard() {
    switchTab('dashboard');
    loadDashboard();
}

function showProperties() {
    switchTab('properties');
    loadProperties();
}

function showUnits() {
    switchTab('units');
    loadUnits();
}

function showTenants() {
    switchTab('tenants');
    loadTenants();
}

function showBills() {
    switchTab('bills');
    loadBills();
}

function showPayments() {
    switchTab('payments');
    loadPayments();
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).style.display = 'block';

    // Add active class to clicked button
    event.target.classList.add('active');

    currentTab = tabName;
}

// API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`/api${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showMessage('操作失败: ' + error.message, 'error');
        return null;
    }
}

// Dashboard functions
async function loadDashboard() {
    const stats = await apiCall('/dashboard');
    if (stats) {
        document.getElementById('total-properties').textContent = stats.totalProperties;
        document.getElementById('total-units').textContent = stats.totalUnits;
        document.getElementById('total-tenants').textContent = stats.totalTenants;
        document.getElementById('monthly-revenue').textContent = `¥${stats.monthlyRevenue.toLocaleString()}`;
        document.getElementById('pending-bills').textContent = `¥${stats.pendingBills.toLocaleString()}`;
    }
}

// Properties functions
async function loadProperties() {
    properties = await apiCall('/properties');
    if (properties) {
        const tbody = document.querySelector('#properties-table tbody');
        tbody.innerHTML = properties.map(prop => `
            <tr>
                <td>${prop.id}</td>
                <td>${prop.name}</td>
                <td>${prop.address}</td>
                <td>${prop.total_units}</td>
                <td>${new Date(prop.created_at).toLocaleDateString()}</td>
                <td class="action-buttons">
                    <button onclick="editProperty(${prop.id})" class="btn btn-secondary">编辑</button>
                    <button onclick="deleteProperty(${prop.id})" class="btn btn-danger">删除</button>
                </td>
            </tr>
        `).join('');
    }
}

async function handleAddProperty(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const result = await apiCall('/properties', 'POST', data);
    if (result) {
        closeModal('add-property-modal');
        loadProperties();
        showMessage('房产添加成功', 'success');
        e.target.reset();
    }
}

function showAddPropertyModal() {
    document.getElementById('add-property-modal').style.display = 'block';
}

// Units functions
async function loadUnits() {
    units = await apiCall('/units');
    if (units) {
        await loadPropertiesForSelect();
        const tbody = document.querySelector('#units-table tbody');
        tbody.innerHTML = units.map(unit => {
            const property = properties.find(p => p.id === unit.property_id);
            return `
                <tr>
                    <td>${unit.id}</td>
                    <td>${property ? property.name : '未知'}</td>
                    <td>${unit.unit_number}</td>
                    <td>¥${unit.rent_amount.toLocaleString()}</td>
                    <td><span class="status ${unit.status}">${unit.status === 'vacant' ? '空置' : '已租'}</span></td>
                    <td class="action-buttons">
                        <button onclick="editUnit(${unit.id})" class="btn btn-secondary">编辑</button>
                        <button onclick="deleteUnit(${unit.id})" class="btn btn-danger">删除</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

async function loadPropertiesForSelect() {
    if (properties.length === 0) {
        properties = await apiCall('/properties') || [];
    }

    const selects = ['property_id', 'unit_property_id'];
    selects.forEach(selectId => {
        const select = document.querySelector(`select[name="${selectId}"]`);
        if (select) {
            select.innerHTML = properties.map(prop =>
                `<option value="${prop.id}">${prop.name}</option>`
            ).join('');
        }
    });
}

async function handleAddUnit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const result = await apiCall('/units', 'POST', data);
    if (result) {
        closeModal('add-unit-modal');
        loadUnits();
        showMessage('单元添加成功', 'success');
        e.target.reset();
    }
}

function showAddUnitModal() {
    loadPropertiesForSelect();
    document.getElementById('add-unit-modal').style.display = 'block';
}

// Tenants functions
async function loadTenants() {
    tenants = await apiCall('/tenants');
    if (tenants) {
        await loadVacantUnitsForSelect();
        const tbody = document.querySelector('#tenants-table tbody');
        tbody.innerHTML = tenants.map(tenant => `
            <tr>
                <td>${tenant.id}</td>
                <td>${tenant.name}</td>
                <td>${tenant.unit_number || '未知'}</td>
                <td>${tenant.property_name || '未知'}</td>
                <td>${tenant.phone || '无'}</td>
                <td>${tenant.email || '无'}</td>
                <td>${tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : '无'}</td>
                <td class="action-buttons">
                    <button onclick="editTenant(${tenant.id})" class="btn btn-secondary">编辑</button>
                    <button onclick="deleteTenant(${tenant.id})" class="btn btn-danger">删除</button>
                </td>
            </tr>
        `).join('');
    }
}

async function loadVacantUnitsForSelect() {
    const vacantUnits = await apiCall('/units') || [];
    const vacantUnitsFiltered = vacantUnits.filter(unit => unit.status === 'vacant');

    const select = document.querySelector('select[name="unit_id"]');
    if (select) {
        select.innerHTML = vacantUnitsFiltered.map(unit =>
            `<option value="${unit.id}">${unit.unit_number}</option>`
        ).join('');
    }
}

async function handleAddTenant(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const result = await apiCall('/tenants', 'POST', data);
    if (result) {
        closeModal('add-tenant-modal');
        loadTenants();
        showMessage('租客添加成功', 'success');
        e.target.reset();
    }
}

function showAddTenantModal() {
    loadVacantUnitsForSelect();
    document.getElementById('add-tenant-modal').style.display = 'block';
}

// Bills functions
async function loadBills() {
    bills = await apiCall('/bills');
    if (bills) {
        await loadTenantsForSelect();
        const tbody = document.querySelector('#bills-table tbody');
        tbody.innerHTML = bills.map(bill => `
            <tr>
                <td>${bill.id}</td>
                <td>${bill.tenant_name || '未知'}</td>
                <td>${bill.unit_number || '未知'}</td>
                <td>${getBillTypeLabel(bill.type)}</td>
                <td>¥${bill.amount.toLocaleString()}</td>
                <td>${new Date(bill.due_date).toLocaleDateString()}</td>
                <td><span class="status ${bill.status}">${bill.status === 'pending' ? '待付款' : '已付款'}</span></td>
                <td class="action-buttons">
                    ${bill.status === 'pending' ? `<button onclick="payBill(${bill.id})" class="btn btn-success">收款</button>` : ''}
                    <button onclick="editBill(${bill.id})" class="btn btn-secondary">编辑</button>
                    <button onclick="deleteBill(${bill.id})" class="btn btn-danger">删除</button>
                </td>
            </tr>
        `).join('');
    }
}

async function loadTenantsForSelect() {
    if (tenants.length === 0) {
        tenants = await apiCall('/tenants') || [];
    }

    const selects = ['tenant_id'];
    selects.forEach(selectId => {
        const select = document.querySelector(`select[name="${selectId}"]`);
        if (select) {
            select.innerHTML = tenants.map(tenant =>
                `<option value="${tenant.id}">${tenant.name} - ${tenant.unit_number || '未知'}</option>`
            ).join('');
        }
    });
}

async function handleAddBill(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const result = await apiCall('/bills', 'POST', data);
    if (result) {
        closeModal('add-bill-modal');
        loadBills();
        showMessage('账单创建成功', 'success');
        e.target.reset();
    }
}

function showAddBillModal() {
    loadTenantsForSelect();
    document.getElementById('add-bill-modal').style.display = 'block';
}

function getBillTypeLabel(type) {
    const labels = {
        'rent': '房租',
        'utilities': '水电费',
        'maintenance': '维修费',
        'other': '其他'
    };
    return labels[type] || type;
}

// Payments functions
async function loadPayments() {
    payments = await apiCall('/payments');
    if (payments) {
        await loadTenantsForSelect();
        const tbody = document.querySelector('#payments-table tbody');
        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td>${payment.id}</td>
                <td>${payment.tenant_name || '未知'}</td>
                <td>${payment.unit_number || '未知'}</td>
                <td>${payment.bill_type || '其他'}</td>
                <td>¥${payment.amount.toLocaleString()}</td>
                <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                <td>${getPaymentMethodLabel(payment.payment_method)}</td>
                <td>${payment.transaction_id || '无'}</td>
            </tr>
        `).join('');
    }
}

async function loadPendingBills(tenantId) {
    const pendingBills = await apiCall(`/bills?tenant_id=${tenantId}&status=pending`);
    const select = document.querySelector('select[name="bill_id"]');
    if (select && pendingBills) {
        select.innerHTML = pendingBills.map(bill =>
            `<option value="${bill.id}">${getBillTypeLabel(bill.type)} - ¥${bill.amount} (到期: ${new Date(bill.due_date).toLocaleDateString()})</option>`
        ).join('');
    }
}

async function handleAddPayment(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    const result = await apiCall('/payments', 'POST', data);
    if (result) {
        closeModal('add-payment-modal');
        loadPayments();
        loadBills();
        showMessage('收款登记成功', 'success');
        e.target.reset();
    }
}

function showAddPaymentModal() {
    loadTenantsForSelect();
    document.getElementById('add-payment-modal').style.display = 'block';
}

function getPaymentMethodLabel(method) {
    const labels = {
        'cash': '现金',
        'bank': '银行转账',
        'wechat': '微信支付',
        'alipay': '支付宝'
    };
    return labels[method] || method;
}

// Utility functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Placeholder functions for edit/delete operations
function editProperty(id) {
    showMessage('编辑功能开发中', 'info');
}

function deleteProperty(id) {
    if (confirm('确定要删除这个房产吗？')) {
        showMessage('删除功能开发中', 'info');
    }
}

function editUnit(id) {
    showMessage('编辑功能开发中', 'info');
}

function deleteUnit(id) {
    if (confirm('确定要删除这个单元吗？')) {
        showMessage('删除功能开发中', 'info');
    }
}

function editTenant(id) {
    showMessage('编辑功能开发中', 'info');
}

function deleteTenant(id) {
    if (confirm('确定要删除这个租客吗？')) {
        showMessage('删除功能开发中', 'info');
    }
}

function editBill(id) {
    showMessage('编辑功能开发中', 'info');
}

function deleteBill(id) {
    if (confirm('确定要删除这个账单吗？')) {
        showMessage('删除功能开发中', 'info');
    }
}

function payBill(billId) {
    showMessage('收款功能开发中', 'info');
}