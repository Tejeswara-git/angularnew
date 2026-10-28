import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Employee } from './models/employee';
import { EmployeeService } from './services/employee';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private employeeService = inject(EmployeeService);

  employees: Employee[] = [];
  searchText = '';
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  editingId: string | null = null;
  showForm = false;
  form: Employee = this.emptyEmployee();

  ngOnInit(): void {
    this.loadEmployees();
  }

  emptyEmployee(): Employee {
    return {
      name: '',
      email: '',
      department: '',
      position: '',
      salary: 0
    };
  }

  get filteredEmployees(): Employee[] {
    const query = this.searchText.trim().toLowerCase();
    if (!query) {
      return this.employees;
    }
    return this.employees.filter(employee =>
      [
        employee.name,
        employee.email,
        employee.department,
        employee.position
      ].some(value => value.toLowerCase().includes(query))
    );
  }

  get totalSalary(): number {
    return this.employees.reduce(
      (total, employee) => total + employee.salary,
      0
    );
  }

  getDepartmentCount(): number {
    return new Set(
      this.employees.map(employee => employee.department)
    ).size;
  }

  loadEmployees(): void {
    this.loading = true;
    this.errorMessage = '';

    this.employeeService.getEmployees().subscribe({
      next: employees => {
        this.employees = employees;
        this.loading = false;
      },
      error: () => {
        this.errorMessage =
          'Unable to load employees. Check the backend and database.';
        this.loading = false;
      }
    });
  }

  openAddForm(): void {
    this.editingId = null;
    this.form = this.emptyEmployee();
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openEditForm(employee: Employee): void {
    if (!employee._id) return;
    this.editingId = employee._id;
    this.form = { ...employee };
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.form = this.emptyEmployee();
  }

  saveEmployee(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const payload: Employee = {
      name: this.form.name.trim(),
      email: this.form.email.trim().toLowerCase(),
      department: this.form.department.trim(),
      position: this.form.position.trim(),
      salary: Number(this.form.salary)
    };

    if (
      !payload.name ||
      !payload.email ||
      !payload.department ||
      !payload.position ||
      !Number.isFinite(payload.salary) ||
      payload.salary < 0
    ) {
      this.errorMessage = 'Please enter valid employee details.';
      return;
    }

    this.saving = true;

    const request = this.editingId
      ? this.employeeService.updateEmployee(this.editingId, payload)
      : this.employeeService.createEmployee(payload);

    request.subscribe({
      next: () => {
        const wasEditing = this.editingId !== null;
        this.saving = false;
        this.closeForm();
        this.successMessage = wasEditing
          ? 'Employee updated successfully.'
          : 'Employee added successfully.';
        this.loadEmployees();
      },
      error: error => {
        this.saving = false;
        this.errorMessage =
          error.error?.message || 'Unable to save employee.';
      }
    });
  }

  deleteEmployee(employee: Employee): void {
    if (!employee._id) return;

    const confirmed = window.confirm(
      `Delete ${employee.name}? This cannot be undone.`
    );
    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.employeeService.deleteEmployee(employee._id).subscribe({
      next: () => {
        this.successMessage = 'Employee deleted successfully.';
        this.loadEmployees();
      },
      error: error => {
        this.errorMessage =
          error.error?.message || 'Unable to delete employee.';
      }
    });
  }
}
