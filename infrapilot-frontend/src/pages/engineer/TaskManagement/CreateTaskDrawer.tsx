import { useState } from 'react';
import { Calendar, Search, Building2, UserCircle, Briefcase, FileText, Filter as FilterIcon, Check } from 'lucide-react';
import Modal from '../../../components/common/Modal';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateTaskDrawer = ({ isOpen, onClose }: CreateTaskModalProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [startDate, setStartDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [project, setProject] = useState('None');
    const [filterRole, setFilterRole] = useState('All Roles');
    const [filterDepartment, setFilterDepartment] = useState('All Departments');
    const [showAllDepartments, setShowAllDepartments] = useState(false);
    const [searchEmployee, setSearchEmployee] = useState('');
    
    // Mock employees
    const employees = [
        { id: '1', name: 'Vicky Singh', role: 'MANAGER', isSelf: true, dept: '', empId: '' },
        { id: '2', name: 'Ankit Bose', role: 'TEAM LEAD', dept: 'Engineering', empId: 'EMP03' },
        { id: '3', name: 'Suresh Chaudhari', role: 'EMPLOYEE', dept: 'Engineering', empId: 'EMP05' },
        { id: '4', name: 'Amit Khare', role: 'EMPLOYEE', dept: '', empId: '' }
    ];

    const [selectedEmployees, setSelectedEmployees] = useState<string[]>(['1']);

    const handleSelectAll = () => {
        if (selectedEmployees.length === employees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(employees.map(e => e.id));
        }
    };

    const toggleEmployee = (id: string) => {
        setSelectedEmployees(prev => 
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // create task logic
        onClose();
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5";
    const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300";

    const modalFooter = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button
                form="create-task-form"
                type="submit"
                className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
            >
                Create Task
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Task"
            footer={modalFooter}
            maxWidth="max-w-3xl"
        >
            <form id="create-task-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Task Details Section */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 mb-4">Task Information</h3>
                    
                    <div>
                        <label className={labelClasses}>
                            Task Title <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            placeholder="Enter task title"
                            className={inputClasses}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className={labelClasses}>
                            Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea 
                            placeholder="Enter task description"
                            rows={3}
                            className={`${inputClasses} resize-none`}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>
                                <Briefcase className="w-3 h-3 text-primary" />
                                Priority
                            </label>
                            <select 
                                className={inputClasses}
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className={labelClasses}>
                                <FileText className="w-3 h-3 text-primary" />
                                Project (Optional)
                            </label>
                            <select 
                                className={inputClasses}
                                value={project}
                                onChange={(e) => setProject(e.target.value)}
                            >
                                <option value="None">None</option>
                                <option value="Shopex">Shopex</option>
                                <option value="Test Project">Test Project</option>
                                <option value="staffly">staffly</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>
                                <Calendar className="w-3 h-3 text-primary" />
                                Start Date
                            </label>
                            <input 
                                type="date"
                                className={inputClasses}
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>
                                <Calendar className="w-3 h-3 text-primary" />
                                Deadline <span className="text-rose-500">*</span>
                            </label>
                            <input 
                                type="date"
                                className={inputClasses}
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Assignment Section */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2 mb-4">Task Assignment</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>
                                <FilterIcon className="w-3 h-3 text-primary" />
                                Filter Role
                            </label>
                            <select 
                                className={inputClasses}
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="All Roles">All Roles</option>
                                <option value="Team Lead">Team Lead</option>
                                <option value="Employee">Employee</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>
                                <Building2 className="w-3 h-3 text-primary" />
                                Filter Department
                            </label>
                            <select 
                                className={inputClasses}
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                            >
                                <option value="All Departments">All Departments</option>
                                <option value="Engineering">Engineering</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={labelClasses}>
                                <UserCircle className="w-3 h-3 text-primary" />
                                Assign To <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showAllDepartments ? 'bg-primary border-primary text-white' : 'border-slate-300 text-transparent'}`}
                                    onClick={() => setShowAllDepartments(!showAllDepartments)}
                                >
                                    <Check className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-medium text-slate-500">Show All Departments</span>
                            </div>
                        </div>
                        
                        <div className="relative mb-3">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-slate-400" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search employees by name, ID or email..."
                                className={`${inputClasses} pl-9`}
                                value={searchEmployee}
                                onChange={(e) => setSearchEmployee(e.target.value)}
                            />
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <div 
                                className="flex items-center justify-between p-3 border-b border-slate-100 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                onClick={handleSelectAll}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedEmployees.length === employees.length ? 'bg-primary border-primary text-white' : 'border-slate-300 text-transparent'}`}>
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">Select All Visible</span>
                                </div>
                                {selectedEmployees.length > 0 && (
                                    <span className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-md">
                                        {selectedEmployees.length} Selected
                                    </span>
                                )}
                            </div>

                            <div className="max-h-48 overflow-y-auto">
                                {employees.map(emp => (
                                    <div 
                                        key={emp.id}
                                        className="flex items-center justify-between p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => toggleEmployee(emp.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedEmployees.includes(emp.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 text-transparent'}`}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-bold text-slate-800">{emp.name}</span>
                                                    {emp.isSelf && <span className="text-xs font-bold text-primary">(Self)</span>}
                                                </div>
                                                {(emp.dept || emp.empId) && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {emp.dept && (
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                                <Building2 className="w-3 h-3 text-slate-400" />
                                                                {emp.dept}
                                                            </div>
                                                        )}
                                                        {emp.empId && (
                                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                                                                ID: {emp.empId}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">
                                            {emp.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CreateTaskDrawer;
