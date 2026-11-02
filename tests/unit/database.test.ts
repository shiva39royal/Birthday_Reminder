import { describe, it, expect, beforeEach } from 'vitest';
import { DbManager } from '../../src/main/database/db-manager';

describe('DbManager', () => {
  let db: DbManager;

  beforeEach(async () => {
    db = DbManager.getInstance();
    await db.initialize();
  });

  it('creates, retrieves, updates, and deletes an employee', () => {
    const id = 'crud-test-1';
    const created = db.createEmployee({
      id,
      employee_name: 'John Doe',
      date_of_birth: '1988-04-12'
    });

    expect(created.id).toBe(id);
    expect(created.employee_name).toBe('John Doe');

    // Retrieve
    const retrieved = db.getEmployeeById(id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.employee_name).toBe('John Doe');

    // Update
    const updated = db.updateEmployee(id, { employee_name: 'Johnathan Doe' });
    expect(updated?.employee_name).toBe('Johnathan Doe');

    // Delete
    const deleted = db.deleteEmployee(id);
    expect(deleted).toBe(true);

    const afterDelete = db.getEmployeeById(id);
    expect(afterDelete).toBeNull();
  });

  it('persists and updates application settings', () => {
    const initial = db.getSettings();
    expect(initial.start_with_windows).toBeDefined();

    const updated = db.updateSettings({
      reminder_delay_minutes: 10,
      confetti_enabled: false
    });

    expect(updated.reminder_delay_minutes).toBe(10);
    expect(updated.confetti_enabled).toBe(false);

    // Verify retrieval
    const reloaded = db.getSettings();
    expect(reloaded.reminder_delay_minutes).toBe(10);
    expect(reloaded.confetti_enabled).toBe(false);
  });
});

