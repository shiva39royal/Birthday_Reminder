import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Camera,
  X,
  AlertCircle,
  Calendar,
  Filter,
  Check
} from 'lucide-react';
import { Employee } from '../../../shared/types';

export const EmployeeBirthdays: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string | null>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'dob'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formName, setFormName] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formPhotoDataUrl, setFormPhotoDataUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await window.birthdayBuddyAPI.getAllEmployees();
      setEmployees(data);

      // Load photos
      const urls: Record<string, string | null> = {};
      await Promise.all(
        data.map(async emp => {
          if (emp.photo_path) {
            urls[emp.id] = await window.birthdayBuddyAPI.getPhotoDataUrl(emp.photo_path);
          } else {
            urls[emp.id] = null;
          }
        })
      );
      setPhotoUrls(urls);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormDob('');
    setFormPhotoDataUrl(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.employee_name);
    setFormDob(emp.date_of_birth);
    setFormPhotoDataUrl(photoUrls[emp.id] || null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handlePickPhoto = async () => {
    try {
      const filePath = await window.birthdayBuddyAPI.openFileDialog({
        title: 'Select Employee Photo',
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
      });
      if (filePath) {
        // Fetch data URL or read file
        const dataUrl = await window.birthdayBuddyAPI.getPhotoDataUrl(filePath);
        if (dataUrl) {
          setFormPhotoDataUrl(dataUrl);
        } else {
          // If path is external, read it directly
          const reader = new FileReader();
          // We can pass data URL from the file
          setFormPhotoDataUrl(filePath); // Or pass path
        }
      }
    } catch (err) {
      console.error('Error selecting photo:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Photo size cannot exceed 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFormPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Employee name is mandatory');
      return;
    }
    if (!formDob) {
      setFormError('Date of birth is mandatory');
      return;
    }

    const birthDate = new Date(formDob);
    const today = new Date();
    if (birthDate > today) {
      setFormError('Date of birth cannot be in the future');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');

      if (editingEmployee) {
        await window.birthdayBuddyAPI.updateEmployee(editingEmployee.id, {
          employee_name: formName.trim(),
          date_of_birth: formDob,
          photo_data_url: formPhotoDataUrl || undefined
        });
      } else {
        await window.birthdayBuddyAPI.createEmployee({
          employee_name: formName.trim(),
          date_of_birth: formDob,
          photo_data_url: formPhotoDataUrl || undefined
        });
      }

      setIsModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save employee record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await window.birthdayBuddyAPI.deleteEmployee(id);
      setDeletingId(null);
      loadEmployees();
    } catch (err) {
      console.error('Failed to delete employee:', err);
    }
  };

  // Filter and Sort
  const filtered = employees.filter(emp =>
    emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  filtered.sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc'
        ? a.employee_name.localeCompare(b.employee_name)
        : b.employee_name.localeCompare(a.employee_name);
    } else {
      // Sort by birthday month and day
      const aParts = a.date_of_birth.split('-').map(Number);
      const bParts = b.date_of_birth.split('-').map(Number);
      const aScore = aParts[1] * 100 + aParts[2];
      const bScore = bParts[1] * 100 + bParts[2];
      return sortOrder === 'asc' ? aScore - bScore : bScore - aScore;
    }
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Employee Birthdays</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Manage your team directory, birth dates, and profile photographs.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-2xl shadow-md shadow-purple-200 transition-all transform active:scale-95 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-xs focus:outline-none"
            >
              <option value="name">Employee Name</option>
              <option value="dob">Birthday Month/Day</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg font-bold text-xs hover:bg-gray-100"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-14 text-center">Photo</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Date of Birth</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filtered.map(emp => {
                  const [y, m, d] = emp.date_of_birth.split('-').map(Number);
                  const bdayObj = new Date(y, m - 1, d);
                  const formattedDob = bdayObj.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={emp.id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 mx-auto flex items-center justify-center overflow-hidden border border-purple-100">
                          {photoUrls[emp.id] ? (
                            <img
                              src={photoUrls[emp.id]!}
                              alt={emp.employee_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-purple-600 text-sm">
                              {emp.employee_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">{emp.employee_name}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{formattedDob}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Edit Employee"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(emp.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-xl">
              👥
            </div>
            <h3 className="font-bold text-gray-800 text-base">No employee records found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? `No employees match "${searchQuery}". Try a different search term.`
                : 'Get started by adding individual employees or importing an Excel workbook.'}
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-900">
                {editingEmployee ? 'Edit Employee Record' : 'Add New Employee'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center space-x-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Photo Preview & Selector */}
              <div className="flex flex-col items-center justify-center space-y-2 py-2">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-purple-50 border-2 border-dashed border-purple-200 flex items-center justify-center overflow-hidden shadow-inner">
                    {formPhotoDataUrl ? (
                      <img src={formPhotoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-purple-400" />
                    )}
                  </div>
                  {formPhotoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setFormPhotoDataUrl(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600"
                      title="Remove Photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold transition-colors">
                    <span>Choose Photo...</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., John Doe"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                />
              </div>

              {/* DOB */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={formDob}
                  onChange={e => setFormDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 text-base">Delete Employee Record?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to permanently delete this employee? Their profile photograph and birthday history will be removed.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

